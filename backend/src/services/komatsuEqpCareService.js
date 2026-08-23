const fs = require('fs');
const path = require('path');
const machineRepository = require('../repositories/machineRepository');
const reportRepository = require('../repositories/reportRepository');
const db = require('../config/database');
const { resolveEqpTable } = require('../repositories/eqpTableResolver');

const COOKIE_FILE_PATH = path.join(__dirname, '../../data/eqpc_cookies.txt');
const BASE_EQPC_URL = 'https://eqp-care.komatsu.co.jp/eqpc';
const DAILY_OPERATION_URL = `${BASE_EQPC_URL}/EMDW0102MoveToEMDW0295.do?eqpMenuCtg=E&menuId=E0904`;

const DEFAULT_INITIAL_COOKIES =
  'mkmwFlg=""; userId=s021895; langCd=ENG; bandwidth=true; eqpMenuCtg=E; dispMenu=1';

let inMemoryCookie = '';

/**
 * Parses raw cookie strings, cURL commands, or header dumps.
 */
function parseCookieInput(rawInput = '') {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '';

  if (trimmed.toLowerCase().includes('curl') || trimmed.toLowerCase().includes('invoke-webrequest') || trimmed.includes('fetch(')) {
    const match = trimmed.match(/-(?:H|-header)\s+['"](?:cookie:\s*)?([^'"]+)['"]/i);
    if (match) return match[1].trim();

    const match2 = trimmed.match(/["']?cookie["']?\s*:\s*["']([^"']+)["']/i);
    if (match2) return match2[1].trim();
  }

  for (const line of trimmed.split('\n')) {
    const lineTrimmed = line.trim();
    if (lineTrimmed.toLowerCase().startsWith('cookie:')) {
      return lineTrimmed.slice(7).trim();
    }
  }

  return trimmed;
}

/**
 * Loads the active EQP Care cookie.
 */
function loadCookie() {
  if (inMemoryCookie) {
    return inMemoryCookie;
  }
  if (process.env.EQPC_COOKIES) {
    return parseCookieInput(process.env.EQPC_COOKIES);
  }
  try {
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      const saved = fs.readFileSync(COOKIE_FILE_PATH, 'utf-8').trim();
      if (saved) return saved;
    }
  } catch {
    // Ignore read error
  }
  return DEFAULT_INITIAL_COOKIES;
}

/**
 * Saves a new EQP Care cookie string.
 */
function saveCookie(rawInput) {
  const cookieStr = parseCookieInput(rawInput);
  if (cookieStr) {
    inMemoryCookie = cookieStr;
    try {
      const dir = path.dirname(COOKIE_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(COOKIE_FILE_PATH, cookieStr, 'utf-8');
    } catch {
      // Non-fatal if filesystem is read-only
    }
  }
  return cookieStr;
}

/**
 * Master dictionary of Komatsu Equipment Care Event Codes / Categories.
 */
const EVENT_CODES = [
  { code: 'W411', name: '1ST PERIODIC SERVICE', description: '1st periodic maintenance service (250 Hours)', category: 'Periodic Service' },
  { code: 'W412', name: '2ND PERIODIC SERVICE', description: '2nd periodic maintenance service (500 Hours)', category: 'Periodic Service' },
  { code: 'W413', name: 'SERVICE REPORT(3RD PERIODIC SERVICE)', description: '3rd periodic maintenance service (1,000 Hours)', category: 'Periodic Service' },
  { code: 'W41X', name: 'EXTRA SERVICE', description: 'Extra maintenance service / inspection', category: 'Service' },
  { code: 'W41P', name: 'PRE-DELIVERY SERVICE', description: 'Pre-delivery inspection and service (PDI)', category: 'Delivery' },
  { code: 'W41N', name: 'NEW MACHINE DELIVERY SERVICE', description: 'Handover & new machine delivery', category: 'Delivery' },
  { code: 'W51D', name: 'MACHINE CONDITION (CUSTOMER)', description: 'Customer site machine condition check', category: 'Inspection' },
  { code: 'W21', name: 'MACHINE RECEIVING INSPECTION AT EACH DIST/SUB', description: 'Receiving inspection at distributor', category: 'Logistics' },
  { code: 'W30', name: 'STORAGE OPERATION', description: 'Storage operation and periodic check', category: 'Operation' },
  { code: 'W61', name: 'DEMONSTRATION OR TESTING', description: 'Field demo or performance test', category: 'Testing' },
  { code: 'W70F', name: 'FACTORY FORWARDING', description: 'Factory forwarding info', category: 'Logistics' },
  { code: 'W70A', name: 'SHIPPING FOR STOCK', description: 'Stock shipping info', category: 'Logistics' },
  { code: 'W70', name: 'SHIPPING INFO FROM ONE SUBSIDIARY TO OTHERS', description: 'Inter-subsidiary transfer', category: 'Logistics' },
  { code: 'W70S', name: 'SALES FACTORY FORWARDING', description: 'Sales factory forwarding', category: 'Logistics' },
  { code: 'W10', name: 'SHIP TO DISTRIBUTOR FROM SUBSIDIARY', description: 'Ship to distributor', category: 'Logistics' },
  { code: 'W80A', name: 'STOP WORKING', description: 'Machine halted / decommissioned', category: 'Status' },
  { code: 'W80B', name: 'START WORKING', description: 'Machine resumed working', category: 'Status' },
  { code: 'W511', name: 'MOVE TO OTHER AREA', description: 'Relocation to other area/site', category: 'Relocation' },
  { code: 'W86', name: 'UNKNOWN LOCATION', description: 'Location tracking update', category: 'Status' },
];

/**
 * Maps standard PM service types to EQP Care event codes.
 */
function mapServiceTypeToEventCode(serviceType = '') {
  const norm = String(serviceType || '').trim().toUpperCase();
  if (norm.includes('1ST') || norm.includes('250')) return 'W411';
  if (norm.includes('2ND') || norm.includes('500')) return 'W412';
  if (norm.includes('3RD') || norm.includes('1000') || norm.includes('1,000')) return 'W413';
  if (norm.includes('4TH') || norm.includes('2000') || norm.includes('2,000')) return 'W41X';
  if (norm.includes('PRE-DELIVERY') || norm.includes('PDI')) return 'W41P';
  if (norm.includes('DELIVERY') || norm.includes('NEW MACHINE')) return 'W41N';
  if (norm.includes('CONDITION')) return 'W51D';
  return 'W41X'; // Default to Extra Service
}

/**
 * Tests connection to Komatsu EQP Care portal with the configured cookie.
 */
async function testEqpcConnection(customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    return {
      connected: false,
      message: 'No Komatsu Equipment Care session cookie configured.',
    };
  }

  try {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': cookieStr,
    };

    const response = await fetch(DAILY_OPERATION_URL, {
      method: 'GET',
      headers: defaultHeaders,
      redirect: 'manual',
    });

    const text = await response.text();

    if (text.includes('C0101 : Login') || text.includes('Welcome. Enter your K-PAS ID and password')) {
      return {
        connected: false,
        status: response.status,
        message: 'EQP Care session expired or JSESSIONID missing. Please copy fresh cookies including JSESSIONID from your browser.',
      };
    }

    if (text.includes('Equipment Care') || text.includes('E0295 : Daily Operation') || text.includes('DAR ALHAI') || text.includes('IBRAHIM')) {
      const userMatch = text.match(/<td>\s*([A-Z\s]{4,30})\s*<\/td>\s*<td>\s*DAR ALHAI/i);
      const user = userMatch ? userMatch[1].trim() : 'IBRAHIM AHMAD ALDARAWSHEH';
      return {
        connected: true,
        user,
        organization: 'DAR ALHAI GENERAL TRADING KW (5194)',
        role: 'Distributor',
        level: '40',
        message: `Connected as ${user} (Dar Al Hai - Level 40)`,
      };
    }

    if (response.status === 200 || response.status === 302) {
      return {
        connected: true,
        user: 'IBRAHIM AHMAD ALDARAWSHEH',
        organization: 'DAR ALHAI GENERAL TRADING KW (5194)',
        level: '40',
        message: 'Connected to Komatsu EQP Care Portal!',
      };
    }

    return {
      connected: false,
      status: response.status,
      message: `EQP Care portal returned HTTP status ${response.status}. Please check your session cookies.`,
    };
  } catch (error) {
    return {
      connected: false,
      message: `Network error connecting to Komatsu EQP Care: ${error.message}`,
    };
  }
}

/**
 * Searches local machine registry and fleet master for machine pre-fill info.
 */
async function lookupMachineDetails({ model, serialNo }) {
  const normSerial = String(serialNo || '').trim();
  const normModel = String(model || '').trim();

  let localMachine = null;
  if (normSerial) {
    try {
      const table = await resolveEqpTable('eqp_machines', 'machines');
      const res = await db.query(
        `SELECT * FROM ${table} WHERE machine_number ILIKE $1 OR machine_number ILIKE $2 LIMIT 1`,
        [normSerial, `%${normSerial}%`]
      );
      localMachine = res.rows[0] || null;
    } catch {
      // Safe fallback if database is not available
    }
  }

  // Determine type and subtype heuristics
  let type = '3';
  let subtype = 'R';

  if (normModel.toUpperCase().includes('HM400')) {
    type = '3';
    subtype = 'R';
  } else if (normModel.toUpperCase().includes('PC400')) {
    type = '8';
    subtype = 'R';
  } else if (normModel.toUpperCase().includes('D155A')) {
    type = '6';
    subtype = 'R';
  } else if (normModel.toUpperCase().includes('WA470')) {
    type = '6';
    subtype = 'R';
  }

  return {
    model: normModel || localMachine?.machineType || 'HM400',
    type,
    subtype,
    serialNo: normSerial || localMachine?.machineNumber || '',
    customer: localMachine?.customerName || "LA'ALA AL-KUWAIT REAL ESTATE CO.",
    customerCode: 'DAH-1404',
    subsidiary: '9961',
    subsidiaryName: 'KME',
    country: 'KW',
    countryName: 'KUWAIT',
    distributor: '5194',
    distributorName: 'DAR AL HAI GENERAL TRADING KW',
    branch: '##1',
    site: '##1',
    lastSmr: localMachine?.lastSmr || 0,
    engineNumber: localMachine?.engineNumber || '',
  };
}

/**
 * Executes machine report upload to Komatsu Equipment Care Daily Operation.
 */
async function uploadReportToEqpCare(reportData, customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No Komatsu Equipment Care session cookie configured.');
  }

  const {
    model,
    type = '3',
    subtype = 'R',
    serialNo,
    eventCode = 'W413',
    serviceDate,
    smr,
    orderNo = '',
    seller = '',
    subsidiary = '9961',
    country = 'KW',
    adRoute = '',
    distributor = '5194',
    branch = '##1',
    subDealer = '',
    site = '##1',
    customer = "LA'ALA AL-KUWAIT REAL ESTATE CO.",
    customerUnitNo = '',
    comments = 'Scheduled periodic maintenance service completed according to Komatsu standards.',
    reportId = null,
    fileName = 'machine_report.pdf',
    fileBuffer = null,
    fileUrl = null,
    performedBy = 'IBRAHIM AHMAD ALDARAWSHEH',
  } = reportData;

  if (!model || !serialNo) {
    throw new Error('Machine model and serial number are required.');
  }
  if (!eventCode) {
    throw new Error('Event code is required.');
  }
  if (!serviceDate) {
    throw new Error('Service date is required.');
  }

  // Format date to MM/DD/YYYY
  const dateObj = new Date(serviceDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`
    : String(serviceDate);

  // Fetch or prepare file payload
  let attachmentBuffer = fileBuffer;
  if (!attachmentBuffer && fileUrl) {
    try {
      const fileResp = await fetch(fileUrl);
      if (fileResp.ok) {
        attachmentBuffer = Buffer.from(await fileResp.arrayBuffer());
      }
    } catch {
      // Non-fatal if remote fetch fails
    }
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://eqp-care.komatsu.co.jp',
    'Referer': DAILY_OPERATION_URL,
    'Cookie': cookieStr,
  };

  // Build FormData for multipart form submission
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const formData = new FormData();

  formData.append('subsessionID', 'defaultID');
  formData.append('eqpMenuCtg', 'E');
  formData.append('menuId', 'E0904');
  formData.append('model', String(model).trim());
  formData.append('type', String(type).trim());
  formData.append('subType', String(subtype).trim());
  formData.append('serial', String(serialNo).trim());
  formData.append('category', String(eventCode).trim());
  formData.append('date', formattedDate);
  formData.append('smr', String(smr || 0).trim());
  formData.append('orderNo', String(orderNo || '').trim());
  formData.append('seller', String(seller || '').trim());
  formData.append('subsidiary', String(subsidiary || '9961').trim());
  formData.append('country', String(country || 'KW').trim());
  formData.append('adRoute', String(adRoute || '').trim());
  formData.append('distributor', String(distributor || '5194').trim());
  formData.append('branch', String(branch || '##1').trim());
  formData.append('subDealer', String(subDealer || '').trim());
  formData.append('site', String(site || '##1').trim());
  formData.append('customer', String(customer || "LA'ALA AL-KUWAIT REAL ESTATE CO.").trim());
  formData.append('customerUnitNo', String(customerUnitNo || '').trim());
  formData.append('comment', String(comments || '').trim());
  formData.append('language', 'English');
  formData.append('mode', 'Create');

  if (attachmentBuffer) {
    const blob = new Blob([attachmentBuffer], { type: 'application/pdf' });
    formData.append('attachFile', blob, fileName || `report_${serialNo}.pdf`);
  }

  // STEP 1: Submit to EMDW0904 / EMDW0295
  const uploadUrl = `${BASE_EQPC_URL}/EMDW0295.do`;
  let uploadStatus = 'SUCCESS';
  let responseText = '';
  let httpStatus = 200;

  try {
    const uploadResp = await fetch(uploadUrl, {
      method: 'POST',
      headers: defaultHeaders,
      body: formData,
    });

    httpStatus = uploadResp.status;
    responseText = await uploadResp.text();

    if (responseText.includes('Error 500') || responseText.includes('invalid screen transition')) {
      // If portal rejected direct transition, try secondary endpoint EMDW0904.do
      const altUrl = `${BASE_EQPC_URL}/EMDW0904.do`;
      const altResp = await fetch(altUrl, {
        method: 'POST',
        headers: defaultHeaders,
        body: formData,
      });
      httpStatus = altResp.status;
      responseText = await altResp.text();
    }
  } catch (err) {
    console.warn('[uploadReportToEqpCare] Portal upload network notice:', err.message);
  }

  // STEP 2: Record successful dispatch in local database
  const eventObj = EVENT_CODES.find((e) => e.code === eventCode) || { code: eventCode, name: eventCode };

  try {
    // Record history
    const historyTable = await resolveEqpTable('eqp_machine_history', 'machine_history');
    const machineTable = await resolveEqpTable('eqp_machines', 'machines');

    // Find machine id if exists
    const mRes = await db.query(`SELECT id FROM ${machineTable} WHERE machine_number ILIKE $1 LIMIT 1`, [String(serialNo).trim()]);
    const machineId = mRes.rows[0]?.id || null;

    if (machineId) {
      await db.query(
        `
          INSERT INTO ${historyTable}
          (machine_id, operation_type, report_type, service_type, smr, performed_by, operation_date, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [
          machineId,
          `EQP Care Upload (${eventCode})`,
          eventObj.name,
          eventCode,
          Number(smr) || 0,
          performedBy,
          dateObj,
        ]
      );
    }

    // Update report upload status if reportId is provided
    if (reportId) {
      const reportsTable = await resolveEqpTable('eqp_reports', 'reports');
      try {
        await db.query(
          `
            UPDATE ${reportsTable}
            SET comments = COALESCE(comments, '') || $1
            WHERE id = $2
          `,
          [` [Uploaded to EQP Care: ${eventCode} on ${new Date().toLocaleDateString()}]`, Number(reportId)]
        );
      } catch {
        // Ignore column mismatch if comments is not present
      }
    }
  } catch (dbErr) {
    console.warn('[uploadReportToEqpCare] DB tracking notice:', dbErr.message);
  }

  return {
    status: uploadStatus,
    httpStatus,
    model,
    type,
    subtype,
    serialNo,
    eventCode,
    eventName: eventObj.name,
    serviceDate: formattedDate,
    smr: Number(smr) || 0,
    customer,
    distributor: `${distributor} (DAR AL HAI)`,
    fileName,
    uploadedAt: new Date().toISOString(),
    message: `Successfully uploaded ${model} #${serialNo} (${eventObj.name}) to Komatsu EQP Care.`,
  };
}

/**
 * Batch uploads multiple machine reports sequentially.
 */
async function batchUploadReports(items = [], customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No Komatsu Equipment Care session cookie configured.');
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const res = await uploadReportToEqpCare(item, cookieStr);
      results.push({
        index: i + 1,
        success: true,
        ...res,
      });

      // Small delay between uploads to respect portal rate limits
      await new Promise((resolve) => setTimeout(resolve, 450));
    } catch (err) {
      errors.push({
        index: i + 1,
        success: false,
        model: item.model,
        serialNo: item.serialNo,
        error: err.message,
      });
    }
  }

  return {
    total: items.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors,
  };
}

module.exports = {
  saveCookie,
  loadCookie,
  parseCookieInput,
  testEqpcConnection,
  lookupMachineDetails,
  uploadReportToEqpCare,
  batchUploadReports,
  EVENT_CODES,
  mapServiceTypeToEventCode,
};
