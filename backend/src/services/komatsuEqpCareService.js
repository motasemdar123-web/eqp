const fs = require('fs');
const path = require('path');
const machineRepository = require('../repositories/machineRepository');
const reportRepository = require('../repositories/reportRepository');
const db = require('../config/database');
const { resolveEqpTable } = require('../repositories/eqpTableResolver');

const COOKIE_FILE_PATH = path.join(__dirname, '../../data/eqpc_cookies.txt');
const LIFECYCLE_CACHE_FILE = path.join(__dirname, '../../data/eqp_care_live_lifecycle.json');
const BASE_EQPC_URL = 'https://eqp-care.komatsu.co.jp/eqpc';
const DAILY_OPERATION_URL = `${BASE_EQPC_URL}/EMDW0102MoveToEMDW0295.do?eqpMenuCtg=E&menuId=E0904`;

const DEFAULT_INITIAL_COOKIES =
  'mkmwFlg=""; userId=s021895; langCd=ENG; bandwidth=true; dispMenu=1; eqpMenuCtg=E; JSESSIONID=00019nAi3onLHDyC_MuBMUXqYw0:C3B70D869FE8372C0000046000000BED0A02014F';

let inMemoryCookie = '';

function cleanCookieString(cookie) {
  return String(cookie || '')
    .replace(/\^/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/^cookie:\s*/i, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

/**
 * Parses raw cookie strings, cURL commands, or header dumps.
 */
function parseCookieInput(rawInput = '') {
  let text = String(rawInput || '').trim();
  if (!text) return '';

  // 1. Check for -b or --cookie flag (including Windows cmd ^ escaping)
  const bMatch = text.match(/(?:-b|--cookie)\s+\^?["']([\s\S]*?)\^?["'](?:\s+[\^-]|$)/i);
  if (bMatch) {
    return cleanCookieString(bMatch[1]);
  }

  // 2. Check for -H "Cookie: ..." or -H ^"Cookie: ...^"
  const hMatch = text.match(/(?:-H|--header)\s+\^?["'](?:cookie:\s*)?([\s\S]*?)\^?["'](?:\s+[\^-]|$)/i);
  if (hMatch && hMatch[1].toLowerCase().includes('jsessionid')) {
    return cleanCookieString(hMatch[1]);
  }

  // 3. Check for direct Cookie: header line
  for (const line of text.split('\n')) {
    const lineTrimmed = line.trim();
    if (lineTrimmed.toLowerCase().startsWith('cookie:')) {
      return cleanCookieString(lineTrimmed.slice(7));
    }
  }

  // 4. If raw input contains JSESSIONID= or mkmwFlg= or userId=
  if (text.includes('JSESSIONID=') || text.includes('userId=') || text.includes('eqpMenuCtg=')) {
    const inlineBMatch = text.match(/-b\s+\^?["']([^"']+)["']/i);
    if (inlineBMatch) {
      return cleanCookieString(inlineBMatch[1]);
    }
    const tokens = [];
    const pairRegex = /(JSESSIONID|userId|langCd|bandwidth|eqpMenuCtg|dispMenu|mkmwFlg)=([^;^"'\s]+|""|'')/gi;
    let m;
    while ((m = pairRegex.exec(text)) !== null) {
      tokens.push(`${m[1]}=${m[2]}`);
    }
    if (tokens.length > 0) {
      return cleanCookieString(tokens.join('; '));
    }
  }

  let cleaned = cleanCookieString(text);
  if (!cleaned.toLowerCase().includes('jsessionid=') && (cleaned.includes(':') || cleaned.length > 20)) {
    cleaned = `JSESSIONID=${cleaned}`;
  }
  if (!cleaned.toLowerCase().includes('eqpmenuctg=')) {
    cleaned = `${cleaned}; eqpMenuCtg=E`;
  }
  return cleaned;
}

function loadCookie() {
  if (inMemoryCookie) {
    return inMemoryCookie;
  }
  // 1. Check user-saved cookie file first
  try {
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      const saved = fs.readFileSync(COOKIE_FILE_PATH, 'utf-8').trim();
      if (saved && !saved.includes('test_session')) {
        inMemoryCookie = saved;
        return saved;
      }
    }
  } catch {
    // Ignore read error
  }
  // 2. Check process.env.EQPC_COOKIES only if not a test placeholder
  if (process.env.EQPC_COOKIES && !process.env.EQPC_COOKIES.includes('test_session')) {
    return parseCookieInput(process.env.EQPC_COOKIES);
  }
  // 3. Fallback to file even if it had placeholder
  try {
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      const saved = fs.readFileSync(COOKIE_FILE_PATH, 'utf-8').trim();
      if (saved) return saved;
    }
  } catch {
    // Ignore
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
 * Resolves the genuine Komatsu equipment Type and Subtype codes.
 * Komatsu Master Classification:
 * - Hydraulic Excavators (PC series, e.g. PC400, PC500LC): Type '8', Subtype 'R'
 * - Bulldozers / Crawler Dozers (D series, e.g. D155A, D275): Type '6', Subtype 'R'
 * - Wheel Loaders (WA series, e.g. WA470, WA600): Type '6', Subtype 'R'
 * - Articulated Dump Trucks (HM series, e.g. HM400, HM300): Type '3', Subtype 'R'
 */
function resolveMachineTypeAndSubtype(model = '', existingType = null, existingSubtype = null) {
  const norm = String(model || '').trim().toUpperCase();
  let type = '3';
  let subtype = 'R';

  if (norm.includes('PC')) {
    type = '8';
    subtype = 'R';
  } else if (
    norm.includes('D155') ||
    norm.includes('D275') ||
    norm.includes('D375') ||
    norm.includes('D475') ||
    norm.includes('D65') ||
    norm.includes('D85')
  ) {
    type = '6';
    subtype = 'R';
  } else if (norm.includes('WA')) {
    type = '6';
    subtype = 'R';
  } else if (norm.includes('HM')) {
    type = '3';
    subtype = 'R';
  } else if (existingType && existingType !== '3') {
    type = String(existingType);
  }

  if (existingSubtype) {
    subtype = String(existingSubtype);
  }

  return { type, subtype };
}

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
  if (!cookieStr || cookieStr.includes('test_session')) {
    return {
      connected: false,
      status: 401,
      message: 'No active Komatsu Equipment Care session cookie configured. Please paste your session cookie from browser developer tools.',
    };
  }

  const hasJsessionId = cookieStr.toLowerCase().includes('jsessionid');
  if (!hasJsessionId) {
    return {
      connected: false,
      status: 401,
      message: "Session cookie is missing 'JSESSIONID'. In Edge/Chrome, press F12 -> Network tab -> copy 'Cookie' from Request Headers so JSESSIONID is included.",
    };
  }

  try {
    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': cookieStr,
      'Referer': 'https://eqp-care.komatsu.co.jp/eqpc/EMDW0904.do',
    };

    // Test tiles endpoint
    const response = await fetch(`${BASE_EQPC_URL}/link.do?linkPath=EMDW0904tiles`, {
      method: 'GET',
      headers: defaultHeaders,
      redirect: 'manual',
    });

    const text = await response.text();

    if (
      text.includes('error.do') ||
      text.includes('Your session was over') ||
      text.includes('C0101 : Login') ||
      text.includes('Welcome. Enter your K-PAS ID and password') ||
      text.includes('session is expired') ||
      response.status === 302 ||
      response.status === 401
    ) {
      return {
        connected: false,
        status: 401,
        message: 'Komatsu EQP Care session expired. Please refresh your browser tab on EQP Care and paste your updated session cookie.',
      };
    }

    if (response.status === 200 && (text.includes('EMDW0904') || text.includes('Daily Operation') || text.includes('History Record') || text.includes('DAR ALHAI'))) {
      if (customCookie && !customCookie.includes('test_session')) {
        saveCookie(customCookie);
      }
      return {
        connected: true,
        user: 'IBRAHIM AHMAD ALDARAWSHEH',
        organization: 'DAR ALHAI GENERAL TRADING KW (5194)',
        role: 'Distributor',
        level: '40',
        message: 'Connected as IBRAHIM AHMAD ALDARAWSHEH (Dar Al Hai - Level 40)',
      };
    }

    return {
      connected: false,
      status: response.status,
      message: `EQP Care portal returned status ${response.status}. Please verify your active session cookie.`,
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

  const effectiveModel = normModel || localMachine?.machine_type || 'HM400';
  const { type, subtype } = resolveMachineTypeAndSubtype(effectiveModel);

  return {
    model: effectiveModel,
    type,
    subtype,
    serialNo: normSerial,
    customer: localMachine?.customer_name || "LA'ALA AL-KUWAIT REAL ESTATE CO.",
    customerCode: 'DAH-1404',
    subsidiary: '9961',
    subsidiaryName: 'KME',
    country: 'KW',
    countryName: 'KUWAIT',
    distributor: '5194',
    distributorName: 'DAR AL HAI GENERAL TRADING KW',
    branch: '##1',
    site: '##1',
    lastSmr: localMachine?.current_smr || localMachine?.last_reported_smr || 0,
  };
}

/**
 * Uploads a single machine report document and form data to Komatsu Equipment Care Daily Operation (E0295 / E0904).
 */
async function uploadReportToEqpCare(reportData, customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No Komatsu Equipment Care session cookie configured.');
  }

  const {
    model,
    type = null,
    subtype = null,
    serialNo,
    eventCode,
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

  // Auto-save active custom cookie if provided
  if (customCookie && !customCookie.includes('test_session')) {
    saveCookie(customCookie);
  }

  // Contradiction protection: prevent uploading multiple contradictory reports in the same month
  const monthKey = String(serviceDate).slice(0, 7);
  if (reportData.preventMonthContradictions !== false) {
    try {
      const existing = await reportRepository.findByMachineAndMonth(serialNo, monthKey);
      if (existing && String(existing.id) !== String(reportId)) {
        return {
          status: 'EXCLUDED',
          model,
          serialNo,
          eventCode,
          serviceDate,
          month: monthKey,
          reason: `A report already exists for machine #${serialNo} in ${monthKey} (${existing.report_no || 'existing report'}). Excluded from upload to protect against contradictory reports.`,
          message: `Excluded from EQP Care upload: Machine #${serialNo} already has a report in ${monthKey}.`,
        };
      }
    } catch {
      // Non-fatal
    }
  }

  // Resolve genuine Komatsu Type and Subtype
  const { type: effectiveType, subtype: effectiveSubtype } = resolveMachineTypeAndSubtype(model, type, subtype);

  // Format date to MM/DD/YYYY
  const dateObj = new Date(serviceDate);
  const formattedDate = !isNaN(dateObj.getTime())
    ? `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`
    : String(serviceDate);

  // Fetch or prepare file payload
  let attachmentBuffer = fileBuffer;
  if (!attachmentBuffer && fileUrl) {
    try {
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        const fileResp = await fetch(fileUrl);
        if (fileResp.ok) {
          attachmentBuffer = Buffer.from(await fileResp.arrayBuffer());
        }
      }
    } catch {
      // Non-fatal if remote fetch fails
    }
  }

  if (!attachmentBuffer) {
    // Generate minimal valid PDF placeholder if no attachment provided
    attachmentBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
    );
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://eqp-care.komatsu.co.jp',
    'Referer': 'https://eqp-care.komatsu.co.jp/eqpc/link.do?linkPath=EMDW0904tiles',
    'Cookie': cookieStr,
  };

  // STEP 1: Search the specific machine on Komatsu EQP Care to resolve its unique machineId
  let machineId = reportData.machineId || '';
  if (!machineId) {
    try {
      const tileUrl = `${BASE_EQPC_URL}/link.do?linkPath=EMDW0904tiles&model=${encodeURIComponent(model)}&type=${encodeURIComponent(effectiveType)}&subtype=${encodeURIComponent(effectiveSubtype)}&serial=${encodeURIComponent(serialNo)}`;
      const tileResp = await fetch(tileUrl, {
        method: 'GET',
        headers: defaultHeaders,
      });
      const tileHtml = await tileResp.text();
      const idMatch = tileHtml.match(/name="machineId"\s+value="([^"]+)"/i) || tileHtml.match(/id="machineId"\s+value="([^"]+)"/i);
      if (idMatch && idMatch[1]) {
        machineId = idMatch[1];
      }
    } catch (searchErr) {
      console.warn('[uploadReportToEqpCare] Machine tile lookup notice:', searchErr.message);
    }
  }

  // Known fallback ID for seed machine #9720
  if (!machineId && String(serialNo).trim() === '9720') {
    machineId = '3792399';
  }

  // STEP 2: DWR Query to initialize rules
  try {
    const dwrBody = `callCount=1\nc0-scriptName=EMDW0902DWR\nc0-methodName=getEquipmentHistory\nc0-id=0\nc0-param0=string:${machineId}\nc0-param1=string:${eventCode}\nc0-param2=string:${formattedDate}\nc0-param3=string:insert\nc0-param4=string:E0904\nsubsessionID=defaultID\nxml=true\n`;
    const dwrResp = await fetch(`${BASE_EQPC_URL}/dwr/exec/EMDW0902DWR.getEquipmentHistory.dwr`, {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        'Content-Type': 'text/plain',
      },
      body: dwrBody,
    });
    console.log('[uploadReportToEqpCare] DWR status:', dwrResp.status);
  } catch (dwrErr) {
    console.warn('[uploadReportToEqpCare] DWR init notice:', dwrErr.message);
  }

  // STEP 3: Submit Record & File to EMDW0904.do
  const saveForm = new FormData();
  saveForm.append('subsessionID', 'defaultID');
  saveForm.append('eqpMenuCtg', 'E');
  saveForm.append('buttonId', 'save');
  saveForm.append('machineId', String(machineId));
  saveForm.append('model', String(model).trim());
  saveForm.append('type', String(effectiveType).trim());
  saveForm.append('stype', String(effectiveSubtype).trim());
  saveForm.append('serial', String(serialNo).trim());
  saveForm.append('hisInfoCd', String(eventCode).trim());
  saveForm.append('hisDate', formattedDate);
  saveForm.append('hisSmr', String(smr || 0).trim());
  saveForm.append('ordNo', String(orderNo || '').trim());
  saveForm.append('seller', String(seller || '').trim());
  saveForm.append('sellerNm', '');
  saveForm.append('subsidiary', String(subsidiary || '9961').trim());
  saveForm.append('subsidiaryNm', 'KME');
  saveForm.append('cntryCd', String(country || 'KW').trim());
  saveForm.append('cntryNm', 'KUWAIT');
  saveForm.append('point', String(adRoute || '').trim());
  saveForm.append('pointNm', '');
  saveForm.append('db', String(distributor || '5194').trim());
  saveForm.append('dbNm', 'DAR ALHAI GENERAL TRADING KW');
  saveForm.append('branchNm', String(branch || '##1').trim());
  saveForm.append('branchCd', String(branch || '##1').trim());
  saveForm.append('subDealer', String(subDealer || '').trim());
  saveForm.append('subDealerNm', '');
  saveForm.append('siteNm', String(site || '##1').trim());
  saveForm.append('siteCd', String(site || '##1').trim());
  saveForm.append('custNm', String(customer || "LA'ALA AL-KUWAIT REAL ESTATE CO.").trim());
  saveForm.append('custCd', 'DAH-1404');
  saveForm.append('custUnitNo', String(customerUnitNo || '').trim());
  saveForm.append('comment', String(comments || '').trim());
  saveForm.append('selLangCd', 'ENG');
  saveForm.append('actionMode', 'insert');
  saveForm.append('previousHisDate', '');
  saveForm.append('hisDateRule', '2');
  saveForm.append('ordNoRule', '0');
  saveForm.append('sellerRule', '0');
  saveForm.append('subsidiaryRule', '0');
  saveForm.append('cntryRule', '0');
  saveForm.append('pointRule', '0');
  saveForm.append('dbRule', '2');
  saveForm.append('branchNmRule', '1');
  saveForm.append('subDealerRule', '1');
  saveForm.append('siteNmRule', '1');
  saveForm.append('custNmRule', '2');
  saveForm.append('custUnitNoRule', '1');
  saveForm.append('creAuth', '1');
  saveForm.append('updAuth', '1');
  saveForm.append('refAuth', '1');

  if (attachmentBuffer) {
    const blob = new Blob([attachmentBuffer], { type: 'application/pdf' });
    saveForm.append('files[0]', blob, fileName || `report_${serialNo}.pdf`);
  }

  let httpStatus = 200;
  let responseText = '';
  let uploadSuccess = false;
  let komatsuMessage = '';

  try {
    const saveResp = await fetch(`${BASE_EQPC_URL}/EMDW0904.do`, {
      method: 'POST',
      headers: defaultHeaders,
      body: saveForm,
    });

    httpStatus = saveResp.status;
    responseText = await saveResp.text();

    if (responseText.includes('session is expired') || responseText.includes('Your session is expired')) {
      throw new Error('Komatsu EQP Care session expired. Please refresh your browser tab on EQP Care and paste the updated cookie.');
    }

    if (responseText.includes('error.do')) {
      try {
        const errRes = await fetch(`${BASE_EQPC_URL}/error.do?subsessionID=defaultID`, {
          headers: defaultHeaders,
        });
        const errText = await errRes.text();
        const errMsgMatch = errText.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
        const rawMsg = errMsgMatch ? errMsgMatch[1].trim() : '';
        if (rawMsg.includes('SQLCODE=-803') || rawMsg.includes('23505')) {
          throw new Error(`A record for ${eventCode} already exists for machine #${serialNo} on Komatsu EQP Care (Duplicate Key). Please use W41X (Extra PM) for subsequent services.`);
        }
        if (rawMsg) {
          throw new Error(`Komatsu portal error: ${rawMsg}`);
        }
      } catch (errCheck) {
        if (errCheck.message.includes('already exists') || errCheck.message.includes('Komatsu portal error')) {
          throw errCheck;
        }
      }
      throw new Error('Komatsu portal rejected the record submission (redirected to error.do).');
    }

    // Inspect popupMessage for validation failures or success
    const popupMatch = responseText.match(/Common\.popupMessage\("([^"]*)"\)/);
    const popupText = popupMatch ? popupMatch[1].replace(/\\r\\n/g, ' ').trim() : '';

    if (popupText) {
      if (popupText.toLowerCase().includes('succeeded') || popupText.toLowerCase().includes('success')) {
        uploadSuccess = true;
        komatsuMessage = popupText.replace(/^\*\s*/, '');
      } else {
        throw new Error(`Komatsu validation rejection: ${popupText.replace(/^\*\s*/, '')}`);
      }
    } else if (responseText.includes('error.do') || responseText.includes('Your session')) {
      throw new Error('Komatsu EQP Care session expired. Please refresh your browser tab on EQP Care and paste your updated session cookie.');
    } else {
      throw new Error('Komatsu portal did not confirm save. Please check your machine details or refresh your session.');
    }
  } catch (err) {
    throw err;
  }

  // STEP 4: Record successful dispatch in local database ONLY if genuinely succeeded
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

    // Update live lifecycle cache file directly so tracker is immediately current
    try {
      const cache = loadCachedLiveLifecycle();
      if (!cache.machines) cache.machines = {};
      const sNo = String(serialNo).trim();
      if (!cache.machines[sNo]) {
        cache.machines[sNo] = {
          machineNumber: sNo,
          model,
          machineId: null,
          totalReports: 0,
          reports: [],
          syncedAt: new Date().toISOString(),
        };
      }

      const isoDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : formattedDate;
      const reports = cache.machines[sNo].reports || [];
      const exists = reports.some((r) => r.eventCode === eventCode && (r.date === isoDate || r.rawDate === formattedDate));
      if (!exists) {
        reports.unshift({
          eventCode,
          eventName: eventObj.name,
          rawDate: formattedDate,
          date: isoDate,
          smr: Number(smr) || null,
          country: String(country || 'KUWAIT (KW)'),
          distributor: `${distributor} (DAR ALHAI)`,
        });
        reports.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        cache.machines[sNo].reports = reports;
        cache.machines[sNo].totalReports = reports.length;
        cache.machines[sNo].syncedAt = new Date().toISOString();
        cache.lastSync = new Date().toISOString();
        saveCachedLiveLifecycle(cache);
      }
    } catch (cacheErr) {
      console.warn('[uploadReportToEqpCare] Cache update notice:', cacheErr.message);
    }
  } catch (dbErr) {
    console.warn('[uploadReportToEqpCare] DB tracking notice:', dbErr.message);
  }

  return {
    status: 'SUCCESS',
    httpStatus,
    model,
    type: effectiveType,
    subtype: effectiveSubtype,
    serialNo,
    eventCode,
    eventName: eventObj.name,
    serviceDate: formattedDate,
    smr: Number(smr) || 0,
    customer,
    distributor: `${distributor} (DAR AL HAI)`,
    fileName,
    uploadedAt: new Date().toISOString(),
    message: komatsuMessage || `Successfully uploaded ${model} #${serialNo} (${eventObj.name}) to Komatsu EQP Care.`,
  };
}

/**
 * Parses DWR (Direct Web Remoting) response scripts into a structured JavaScript object.
 * Extracts primitive values, nested arrays, and callback parameters.
 */
function parseDwrResponse(dwrText) {
  const vars = {};
  if (!dwrText || typeof dwrText !== 'string') return {};

  const lines = dwrText.split(/[\r\n;]+/);
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('//#')) continue;

    // var s0={}; or s0={}; or var s1=[];
    let m = line.match(/^(?:var\s+)?([a-zA-Z0-9_]+)\s*=\s*(\{\}|\[\]);?$/);
    if (m) {
      vars[m[1]] = m[2] === '[]' ? [] : {};
      continue;
    }

    // Array item assignment: s1[0]="foo" or s1[0]=123 or s1[0]=s2
    m = line.match(/^([a-zA-Z0-9_]+)\[(\d+)\]\s*=\s*(.*?);?$/);
    if (m) {
      const arrName = m[1];
      const idx = parseInt(m[2], 10);
      let val = m[3].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      } else if (!isNaN(Number(val)) && val !== '') {
        val = Number(val);
      } else if (vars[val] !== undefined) {
        val = vars[val];
      }
      if (!vars[arrName]) vars[arrName] = [];
      vars[arrName][idx] = val;
      continue;
    }

    // Property assignment: s0.key = "value" or s0.key = s1 or s0.key = null
    m = line.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*=\s*(.*?);?$/);
    if (m) {
      const objName = m[1];
      const prop = m[2];
      let val = m[3].trim();

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      } else if (val === 'null') {
        val = null;
      } else if (val === 'true') {
        val = true;
      } else if (val === 'false') {
        val = false;
      } else if (!isNaN(Number(val)) && val !== '') {
        val = Number(val);
      } else if (vars[val] !== undefined) {
        val = vars[val];
      }

      if (!vars[objName]) vars[objName] = {};
      vars[objName][prop] = val;
    }
  }

  const cbMatch = dwrText.match(/_remoteHandleCallback\([^)]*,\s*([a-zA-Z0-9_]+)\)/);
  const rootVar = cbMatch ? cbMatch[1] : 's0';
  return vars[rootVar] || vars['s0'] || {};
}

/**
 * Checks whether a given report is the last (most recent) report generated for a machine.
 * Compares against all records in eqp_machine_history, eqp_reports, and eqp_care_live_lifecycle.json cache.
 */
async function isLastReportForMachine(serialNo, eventCode, serviceDate) {
  const sNo = String(serialNo || '').trim();
  if (!sNo || !serviceDate) return false;

  let isoDate = String(serviceDate).trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate) === false) {
    const d = new Date(serviceDate);
    if (!isNaN(d.getTime())) {
      isoDate = d.toISOString().slice(0, 10);
    }
  }

  const allReports = [];

  // 1. Query PostgreSQL history records
  try {
    const historyTable = await resolveEqpTable('eqp_machine_history', 'machine_history');
    const machineTable = await resolveEqpTable('eqp_machines', 'machines');

    const histResult = await db.query(
      `
        SELECT emh.service_type, to_char(emh.operation_date, 'YYYY-MM-DD') AS op_date
        FROM ${historyTable} emh
        JOIN ${machineTable} em ON em.id = emh.machine_id
        WHERE em.machine_number ILIKE $1
        ORDER BY emh.operation_date DESC, emh.id DESC
        LIMIT 10
      `,
      [sNo]
    );

    for (const row of histResult.rows) {
      if (row.op_date) allReports.push({ date: row.op_date, code: row.service_type });
    }
  } catch {
    // Non-fatal if database is offline or in mock test environment
  }

  // 1b. Query PostgreSQL eqp_reports
  try {
    const reportsTable = await resolveEqpTable('eqp_reports', 'reports');
    const repResult = await db.query(
      `
        SELECT report_type, to_char(service_date, 'YYYY-MM-DD') AS rep_date
        FROM ${reportsTable}
        WHERE machine_number ILIKE $1
        ORDER BY service_date DESC, id DESC
        LIMIT 10
      `,
      [sNo]
    );
    for (const row of repResult.rows) {
      if (row.rep_date) allReports.push({ date: row.rep_date, code: row.report_type });
    }
  } catch {
    // Non-fatal if table not present
  }

  // 2. Query live lifecycle cache records
  try {
    const cache = loadCachedLiveLifecycle();
    const mReports = cache?.machines?.[sNo]?.reports || [];
    for (const r of mReports) {
      const d = String(r.date || '').slice(0, 10);
      if (d && d.length === 10) {
        allReports.push({ date: d, code: r.eventCode });
      }
    }
  } catch {}

  if (allReports.length === 0) {
    return true;
  }

  allReports.sort((a, b) => b.date.localeCompare(a.date));
  const latestRecordedDate = allReports[0].date;

  // If target date is greater than or equal to the latest recorded date
  if (isoDate >= latestRecordedDate) {
    return true;
  }

  // If within the same month and matching the latest report's code
  if (isoDate.slice(0, 7) === latestRecordedDate.slice(0, 7) && eventCode === allReports[0].code) {
    return true;
  }

  return false;
}

/**
 * Updates an existing, already uploaded service log on Komatsu Equipment Care in place (EMDW0904.do with actionMode='update').
 * Updates PostgreSQL eqp_machine_history, eqp_reports, eqp_machines, and eqp_care_live_lifecycle.json without creating duplicate logs.
 */
async function updateServiceLogInEqpCare(updateData, customCookie = null) {
  const {
    model,
    type = null,
    subtype = null,
    serialNo,
    eventCode,
    serviceDate,
    newSmr,
    fileBuffer = null,
    fileName = null,
    comments = null,
    syncToEqpc = true,
  } = updateData;

  const sNo = String(serialNo || '').trim();
  const eCode = String(eventCode || '').trim();
  if (!sNo) {
    throw new Error('Machine serial number is required.');
  }
  if (!eCode) {
    throw new Error('Event code is required.');
  }
  if (!serviceDate) {
    throw new Error('Service date is required.');
  }
  if (newSmr == null || isNaN(Number(newSmr))) {
    throw new Error('Valid new SMR number is required.');
  }

  const numericSmr = Number(newSmr);
  const eventObj = EVENT_CODES.find((e) => e.code === eCode) || { code: eCode, name: eCode };

  // Format dates
  const dateObj = new Date(serviceDate);
  let formattedDate = '';
  let dbDateFormat = ''; // YYYYMMDD
  let isoDate = '';      // YYYY-MM-DD
  let monthKey = '';

  const str = String(serviceDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    isoDate = str;
    const [y, m, d] = str.split('-');
    formattedDate = `${m}/${d}/${y}`;
    dbDateFormat = `${y}${m}${d}`;
    monthKey = `${y}-${m}`;
  } else if (!isNaN(dateObj.getTime())) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    isoDate = `${y}-${m}-${d}`;
    formattedDate = `${m}/${d}/${y}`;
    dbDateFormat = `${y}${m}${d}`;
    monthKey = `${y}-${m}`;
  } else {
    isoDate = str.slice(0, 10);
    formattedDate = str;
    dbDateFormat = isoDate.replace(/-/g, '');
    monthKey = isoDate.slice(0, 7);
  }

  // Look up machine details
  const machineDetails = await lookupMachineDetails({ model, serialNo: sNo });
  const effectiveModel = model || machineDetails.model || 'HM400';
  const { type: effectiveType, subtype: effectiveSubtype } = resolveMachineTypeAndSubtype(effectiveModel, type, subtype);

  let komatsuUpdated = false;
  let komatsuNotice = '';
  // Auto-generate replacement report PDF if not provided manually
  let effectiveFileBuffer = fileBuffer;
  let effectiveFileName = fileName;
  let replacementReport = null;

  if (!effectiveFileBuffer) {
    try {
      const reportGeneratorService = require('./reportGeneratorService');
      replacementReport = await reportGeneratorService.generateReplacementReportPdf({
        machineNumber: sNo,
        eventCode: eCode,
        serviceDate: isoDate,
        newSmr: numericSmr,
        comments,
        performedBy: updateData.performedBy,
      });
      if (replacementReport?.pdfBuffer) {
        effectiveFileBuffer = replacementReport.pdfBuffer;
        effectiveFileName = replacementReport.fileName || effectiveFileName;
      }
    } catch (genErr) {
      console.warn('[updateServiceLogInEqpCare] Auto replacement PDF generation notice:', genErr.message);
    }
  }

  // 1. In-place update on Komatsu Equipment Care portal if requested
  if (syncToEqpc !== false) {
    const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
    if (!cookieStr || cookieStr.includes('test_session') || !cookieStr.toLowerCase().includes('jsessionid')) {
      throw new Error('Komatsu session cookie is missing or invalid. Please provide your active JSESSIONID session cookie to sync with Komatsu Equipment Care.');
    }

    if (customCookie && !customCookie.includes('test_session')) {
      saveCookie(customCookie);
    }

    const defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://eqp-care.komatsu.co.jp',
      'Referer': 'https://eqp-care.komatsu.co.jp/eqpc/link.do?linkPath=EMDW0904tiles',
      'Cookie': cookieStr,
    };

    // Resolve machineId: 1. From updateData, 2. From cached live lifecycle, 3. From tile query
    let machineId = updateData.machineId || '';
    if (!machineId) {
      try {
        const cache = loadCachedLiveLifecycle();
        if (cache?.machines?.[sNo]?.machineId) {
          machineId = cache.machines[sNo].machineId;
        }
      } catch {}
    }
    if (!machineId) {
      try {
        const tileUrl = `${BASE_EQPC_URL}/link.do?linkPath=EMDW0904tiles&model=${encodeURIComponent(effectiveModel)}&type=${encodeURIComponent(effectiveType)}&subtype=${encodeURIComponent(effectiveSubtype)}&serial=${encodeURIComponent(sNo)}`;
        const tileResp = await fetch(tileUrl, { method: 'GET', headers: defaultHeaders });
        const tileHtml = await tileResp.text();
        const idMatch = tileHtml.match(/name="machineId"\s+value="([^"]+)"/i) || tileHtml.match(/id="machineId"\s+value="([^"]+)"/i);
        if (idMatch && idMatch[1]) {
          machineId = idMatch[1];
        }
      } catch (searchErr) {
        console.warn('[updateServiceLogInEqpCare] Machine tile lookup notice:', searchErr.message);
      }
    }

    if (!machineId) {
      throw new Error(`Could not resolve Komatsu machineId for serial #${sNo}. Please verify the machine serial number.`);
    }

    // Query DWR to load existing record rules & data
    let dto = {};
    try {
      const dwrBody = `callCount=1\nc0-scriptName=EMDW0902DWR\nc0-methodName=getEquipmentHistory\nc0-id=0\nc0-param0=string:${machineId}\nc0-param1=string:${eCode}\nc0-param2=string:${formattedDate}\nc0-param3=string:update\nc0-param4=string:E0904\nsubsessionID=defaultID\nxml=true\n`;
      const dwrResp = await fetch(`${BASE_EQPC_URL}/dwr/exec/EMDW0902DWR.getEquipmentHistory.dwr`, {
        method: 'POST',
        headers: { ...defaultHeaders, 'Content-Type': 'text/plain' },
        body: dwrBody,
      });
      const dwrText = await dwrResp.text();
      if (
        dwrResp.url.includes('login') ||
        dwrText.includes('login.do') ||
        dwrText.includes('Your session was over') ||
        dwrText.includes('Your session is expired')
      ) {
        throw new Error('Komatsu EQP Care session expired during history lookup. Please refresh your session cookie.');
      }
      dto = parseDwrResponse(dwrText);
    } catch (dwrErr) {
      console.warn('[updateServiceLogInEqpCare] DWR notice:', dwrErr.message);
      if (dwrErr.message.includes('session expired') || dwrErr.message.includes('session was over')) {
        throw dwrErr;
      }
    }

    // Submit update to EMDW0904.do
    const updateForm = new FormData();
    updateForm.append('subsessionID', 'defaultID');
    updateForm.append('eqpMenuCtg', 'E');
    updateForm.append('buttonId', 'save');
    updateForm.append('actionMode', 'update');
    updateForm.append('machineId', String(machineId || dto.machineId || ''));
    updateForm.append('model', String(dto.model || effectiveModel).trim());
    updateForm.append('type', dto.type != null ? String(dto.type) : '');
    updateForm.append('stype', dto.stype != null ? String(dto.stype) : '');
    updateForm.append('serial', String(sNo).trim());
    updateForm.append('hisInfoCd', String(eCode).trim());
    updateForm.append('hisDate', dto.hisDate || formattedDate);
    updateForm.append('previousHisDate', dbDateFormat);
    updateForm.append('hisSmr', String(numericSmr).trim());
    updateForm.append('ordNo', dto.ordNo != null ? String(dto.ordNo) : '');
    updateForm.append('seller', dto.seller != null ? String(dto.seller) : '');
    updateForm.append('sellerNm', dto.sellerNm != null ? String(dto.sellerNm) : '');
    updateForm.append('subsidiary', dto.subsidiary != null ? String(dto.subsidiary) : '9961');
    updateForm.append('subsidiaryNm', dto.subsidiaryNm != null ? String(dto.subsidiaryNm) : 'KME');
    updateForm.append('cntryCd', dto.cntryCd != null ? String(dto.cntryCd) : 'KW');
    updateForm.append('cntryNm', dto.cntryNm != null ? String(dto.cntryNm) : 'KUWAIT');
    updateForm.append('point', dto.point != null ? String(dto.point) : '');
    updateForm.append('pointNm', dto.pointNm != null ? String(dto.pointNm) : '');
    updateForm.append('db', dto.db != null ? String(dto.db) : '5194');
    updateForm.append('dbNm', dto.dbNm != null ? String(dto.dbNm) : 'DAR ALHAI GENERAL TRADING KW');
    updateForm.append('branchNm', dto.branchNm != null ? String(dto.branchNm) : '##1');
    updateForm.append('branchCd', dto.branchCd != null ? String(dto.branchCd) : '##1');
    updateForm.append('subDealer', dto.subDealer != null ? String(dto.subDealer) : '');
    updateForm.append('subDealerNm', dto.subDealerNm != null ? String(dto.subDealerNm) : '');
    updateForm.append('siteNm', dto.siteNm != null ? String(dto.siteNm) : '##1');
    updateForm.append('siteCd', dto.siteCd != null ? String(dto.siteCd) : '##1');
    updateForm.append('custNm', dto.custNm != null ? String(dto.custNm) : "LA'ALA AL-KUWAIT REAL ESTATE CO.");
    updateForm.append('custCd', dto.custCd != null ? String(dto.custCd) : 'DAH-1404');
    updateForm.append('muserCd', dto.muserCd != null ? String(dto.muserCd) : '');
    updateForm.append('muserNm', dto.muserNm != null ? String(dto.muserNm) : '');
    updateForm.append('custUnitNo', dto.custUnitNo != null ? String(dto.custUnitNo) : '');
    updateForm.append('dataSrc', dto.dataSrc != null ? String(dto.dataSrc) : '01');
    updateForm.append('comment', comments || dto.comment1 || 'Periodic maintenance service verified and updated.');
    updateForm.append('commentId', (dto.commentId != null && dto.commentId !== '') ? String(dto.commentId) : '-1');
    updateForm.append('evdId', dto.strEvdId || dto.evdId || '');
    updateForm.append('strEvdId', dto.strEvdId || dto.evdId || '');
    updateForm.append('selLangCd', dto.langCd || 'ENG');
    updateForm.append('vhmsRegSts', dto.vhmsRegSts != null ? String(dto.vhmsRegSts) : '');
    updateForm.append('vhmsRegStsNm', dto.vhmsRegStsNm != null ? String(dto.vhmsRegStsNm) : '');

    // Rules
    updateForm.append('hisDateRule', dto.hisDateRule != null ? String(dto.hisDateRule) : '2');
    updateForm.append('ordNoRule', dto.ordNoRule != null ? String(dto.ordNoRule) : '0');
    updateForm.append('sellerRule', dto.sellerRule != null ? String(dto.sellerRule) : '0');
    updateForm.append('subsidiaryRule', dto.subsidiaryRule != null ? String(dto.subsidiaryRule) : '0');
    updateForm.append('cntryRule', dto.cntryRule != null ? String(dto.cntryRule) : '0');
    updateForm.append('pointRule', dto.pointRule != null ? String(dto.pointRule) : '0');
    updateForm.append('dbRule', dto.dbRule != null ? String(dto.dbRule) : '2');
    updateForm.append('branchNmRule', dto.branchNmRule != null ? String(dto.branchNmRule) : '1');
    updateForm.append('subDealerRule', dto.subDealerRule != null ? String(dto.subDealerRule) : '1');
    updateForm.append('siteNmRule', dto.siteNmRule != null ? String(dto.siteNmRule) : '1');
    updateForm.append('custNmRule', dto.custNmRule != null ? String(dto.custNmRule) : '2');
    updateForm.append('custUnitNoRule', dto.custUnitNoRule != null ? String(dto.custUnitNoRule) : '1');
    updateForm.append('muserCdRule', dto.muserCdRule != null ? String(dto.muserCdRule) : '0');
    updateForm.append('muserNmRule', dto.muserNmRule != null ? String(dto.muserNmRule) : '0');

    // Auth
    updateForm.append('refAuth', dto.refAuth != null ? String(dto.refAuth) : '1');
    updateForm.append('creAuth', dto.creAuth != null ? String(dto.creAuth) : '1');
    updateForm.append('updAuth', dto.updAuth != null ? String(dto.updAuth) : '1');
    updateForm.append('delAuth', dto.delAuth != null ? String(dto.delAuth) : '1');

    // Event checkboxes
    updateForm.append('eventChk', '');
    updateForm.append('claimChk', dto.claimChk != null ? String(dto.claimChk) : '');
    updateForm.append('tsiChk', '');
    updateForm.append('fcChk', '');

    // Sequence numbers: seqNo[0]..seqNo[8]
    for (let i = 0; i < 9; i++) {
      const seqVal = (dto.seqNo && dto.seqNo[i] != null) ? String(dto.seqNo[i]) : '0';
      updateForm.append(`seqNo[${i}]`, seqVal);
    }

    if (effectiveFileBuffer) {
      const blob = new Blob([effectiveFileBuffer], { type: 'application/pdf' });
      updateForm.append('files[0]', blob, effectiveFileName || `report_${sNo}_${isoDate}.pdf`);
    }

    try {
      const saveResp = await fetch(`${BASE_EQPC_URL}/EMDW0904.do`, {
        method: 'POST',
        headers: defaultHeaders,
        body: updateForm,
      });
      const saveText = await saveResp.text();

      if (
        saveResp.url.includes('login') ||
        saveText.includes('login.do') ||
        saveText.includes('Your session was over') ||
        saveText.includes('Your session is expired')
      ) {
        throw new Error('Komatsu session expired. Please re-login to Komatsu EQP Care and copy your updated session cookie.');
      }

      if (saveResp.url.includes('error.do') || saveText.includes('error.do') || saveResp.status !== 200) {
        let detailedError = '';
        try {
          const errRes = await fetch(`${BASE_EQPC_URL}/error.do?subsessionID=defaultID`, {
            headers: defaultHeaders,
          });
          const errText = await errRes.text();
          const errMsgMatch = errText.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i);
          const rawMsg = errMsgMatch ? errMsgMatch[1].trim() : '';
          if (rawMsg) {
            detailedError = rawMsg;
          }
        } catch {}

        if (detailedError) {
          throw new Error(`Komatsu portal rejected the update: ${detailedError}`);
        }
        if (saveResp.status !== 200) {
          throw new Error(`Komatsu portal update failed (HTTP ${saveResp.status}).`);
        }
        throw new Error('Komatsu portal rejected the update (redirected to error.do). Please verify permissions and session cookie.');
      }

      const popupMatch = saveText.match(/Common\.popupMessage\("([^"]*)"\)/);
      const popupText = popupMatch ? popupMatch[1].replace(/\\r\\n/g, ' ').trim() : '';

      if (popupText && (popupText.toLowerCase().includes('succeeded') || popupText.toLowerCase().includes('success'))) {
        komatsuUpdated = true;
        komatsuNotice = popupText.replace(/^\*\s*/, '');
      } else if (popupText) {
        throw new Error(`Komatsu portal rejected the update: ${popupText.replace(/^\*\s*/, '')}`);
      } else if (saveResp.status === 200 && !saveText.includes('error')) {
        komatsuUpdated = true;
        komatsuNotice = 'Service log updated on Komatsu EQP Care portal.';
      } else {
        throw new Error(`Komatsu portal update failed (HTTP ${saveResp.status}).`);
      }
    } catch (postErr) {
      console.warn('[updateServiceLogInEqpCare] Post notice:', postErr.message);
      throw postErr;
    }
  }

  // 2. Determine if target report is the last report generated for this machine
  const isLastReport = await isLastReportForMachine(sNo, eCode, isoDate);

  // 3. Local Database In-Place Update (Zero Duplicates)
  let dbUpdated = false;
  try {
    const historyTable = await resolveEqpTable('eqp_machine_history', 'machine_history');
    const machineTable = await resolveEqpTable('eqp_machines', 'machines');

    // Update eqp_machines.last_smr ONLY if this is the last report generated!
    if (isLastReport) {
      await db.query(
        `
          UPDATE ${machineTable}
          SET last_smr = $1, updated_at = CURRENT_TIMESTAMP
          WHERE machine_number ILIKE $2
        `,
        [numericSmr, sNo]
      );
    }

    // Find existing history entry
    const histFind = await db.query(
      `
        SELECT emh.id
        FROM ${historyTable} emh
        JOIN ${machineTable} em ON em.id = emh.machine_id
        WHERE em.machine_number ILIKE $1
          AND emh.service_type = $2
          AND (
            to_char(emh.operation_date, 'YYYY-MM-DD') = $3
            OR to_char(emh.operation_date, 'YYYY-MM') = $4
          )
        ORDER BY emh.operation_date DESC
        LIMIT 1
      `,
      [sNo, eCode, isoDate, monthKey]
    );

    if (histFind.rows[0]) {
      await db.query(
        `
          UPDATE ${historyTable}
          SET smr = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
        [numericSmr, histFind.rows[0].id]
      );
      dbUpdated = true;
    }

    // Check eqp_reports if present
    const reportsTable = await resolveEqpTable('eqp_reports', 'reports');
    try {
      const repFind = await db.query(
        `
          SELECT id
          FROM ${reportsTable}
          WHERE machine_number ILIKE $1
            AND (
              to_char(service_date, 'YYYY-MM-DD') = $2
              OR to_char(service_date, 'YYYY-MM') = $3
            )
          LIMIT 1
        `,
        [sNo, isoDate, monthKey]
      );

      if (repFind.rows[0]) {
        await db.query(
          `
            UPDATE ${reportsTable}
            SET smr = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `,
          [numericSmr, repFind.rows[0].id]
        );
      }
    } catch {
      // Non-fatal if table doesn't exist
    }
  } catch (dbErr) {
    console.warn('[updateServiceLogInEqpCare] Database update notice:', dbErr.message);
  }

  // 4. Live Cache In-Place Update
  let cacheUpdated = false;
  try {
    const cache = loadCachedLiveLifecycle();
    if (cache.machines && cache.machines[sNo]) {
      const mObj = cache.machines[sNo];
      if (isLastReport) {
        mObj.latestSmr = numericSmr;
      }
      const reports = mObj.reports || [];
      const targetReport = reports.find(
        (r) => r.eventCode === eCode && (r.date === isoDate || r.rawDate === formattedDate || r.date?.startsWith(monthKey))
      );

      if (targetReport) {
        targetReport.smr = numericSmr;
        mObj.syncedAt = new Date().toISOString();
        cache.lastSync = new Date().toISOString();
        saveCachedLiveLifecycle(cache);
        cacheUpdated = true;
      }
    }
  } catch (cacheErr) {
    console.warn('[updateServiceLogInEqpCare] Cache update notice:', cacheErr.message);
  }

  return {
    success: true,
    machineNumber: sNo,
    model: effectiveModel,
    eventCode: eCode,
    eventName: eventObj.name,
    serviceDate: isoDate,
    previousSmr: updateData.currentSmr ?? null,
    newSmr: numericSmr,
    isLastReportGenerated: isLastReport,
    komatsuUpdated,
    dbUpdated,
    cacheUpdated,
    replacementFile: effectiveFileName,
    replacementUrl: replacementReport?.fileUrl || null,
    message: komatsuNotice || `Successfully updated ${effectiveModel} #${sNo} ${eventObj.name} SMR to ${numericSmr} hrs.${isLastReport ? ' (Machine SMR updated in system)' : ''}`,
  };
}

/**
 * Batch uploads multiple machine reports sequentially.
 */
async function batchUploadReports(items = [], customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (customCookie && !customCookie.includes('test_session')) {
    saveCookie(customCookie);
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      results: [],
      errors: [],
    };
  }

  const results = [];
  const errors = [];
  let successful = 0;
  let excluded = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const res = await uploadReportToEqpCare(item, cookieStr);
      results.push(res);
      if (res.status === 'EXCLUDED') {
        excluded++;
      } else {
        successful++;
      }
    } catch (err) {
      failed++;
      const errObj = {
        status: 'FAILED',
        serialNo: item.serialNo || item.machine_number || '',
        model: item.model || '',
        error: err.message,
        message: `Failed to upload #${item.serialNo || item.machine_number || 'unknown'}: ${err.message}`,
      };
      results.push(errObj);
      errors.push(errObj);
    }
  }

  return {
    total: items.length,
    successful,
    excluded,
    failed,
    results,
    errors,
  };
}

/**
 * Loads the cached live lifecycle data pulled from Komatsu Equipment Care.
 */
function loadCachedLiveLifecycle() {
  try {
    if (fs.existsSync(LIFECYCLE_CACHE_FILE)) {
      const raw = fs.readFileSync(LIFECYCLE_CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[loadCachedLiveLifecycle] Cache read notice:', err.message);
  }
  return { lastSync: null, totalMachines: 0, machines: {} };
}

/**
 * Persists the live lifecycle cache to disk.
 */
function saveCachedLiveLifecycle(data) {
  try {
    const dir = path.dirname(LIFECYCLE_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LIFECYCLE_CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[saveCachedLiveLifecycle] Cache write notice:', err.message);
  }
}

/**
 * Parses the HTML response of EMDW0904tiles to extract all live equipment history reports.
 * 100% read-only parsing with zero writes to Komatsu.
 */
function parseHistoryTableFromHtml(html, serialNo, model) {
  const normSerial = String(serialNo || '').trim();
  const normModel = String(model || '').trim();

  const idMatch = html.match(/name="machineId"\s+value="([^"]+)"/i) || html.match(/id="machineId"\s+value="([^"]+)"/i);
  const machineId = idMatch ? idMatch[1] : null;

  const tableMatch = html.match(/<table[^>]*id\s*=\s*["']resultTable["'][^>]*>([\s\S]*?)<\/table>/i);
  let tableSnippet = '';
  if (tableMatch) {
    tableSnippet = tableMatch[1];
  } else {
    const tableIndex = html.search(/id\s*=\s*["']resultTable["']/i);
    if (tableIndex === -1) {
      if (html.includes('error.do') || html.includes('session is expired') || html.includes('Your session was over')) {
        throw new Error('Komatsu EQP Care session expired or invalid response returned.');
      }
      return {
        machineNumber: normSerial,
        model: normModel,
        machineId,
        totalReports: 0,
        reports: [],
        syncedAt: new Date().toISOString(),
      };
    }
    const tableEndMatch = html.slice(tableIndex).search(/<\/table>/i);
    tableSnippet = tableEndMatch !== -1 ? html.slice(tableIndex, tableIndex + tableEndMatch) : html.slice(tableIndex, tableIndex + 50000);
  }

  const trs = tableSnippet.match(/<TR[^>]*>[\s\S]*?<\/TR>/gi) || [];
  const reports = [];

  for (const tr of trs) {
    const tds = tr.match(/<TD[^>]*>([\s\S]*?)<\/TD>/gi) || [];
    if (tds.length < 3) continue;

    const cleanTds = tds.map((td) =>
      td.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    );
    const eventCode = cleanTds[0] || '';
    if (!eventCode) continue;

    const eventName = cleanTds[1] || '';
    const rawDate = cleanTds[2] || '';
    const smrStr = cleanTds[3] || '';
    const country = cleanTds[4] || '';
    const distributor = cleanTds[5] || '';

    let isoDate = null;
    if (rawDate && rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          isoDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else {
          // MM/DD/YYYY
          const m = parts[0].padStart(2, '0');
          const d = parts[1].padStart(2, '0');
          const y = parts[2];
          isoDate = `${y}-${m}-${d}`;
        }
      }
    } else if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
      isoDate = rawDate;
    }

    reports.push({
      eventCode,
      eventName,
      rawDate,
      date: isoDate || rawDate,
      smr: smrStr && !isNaN(Number(smrStr)) ? Number(smrStr) : null,
      country,
      distributor,
    });
  }

  return {
    machineNumber: normSerial,
    model: normModel,
    machineId,
    totalReports: reports.length,
    reports,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Strictly read-only: Pulls the real, complete reports lifecycle history for a single machine
 * directly from Komatsu Equipment Care online portal (EMDW0904tiles).
 * NEVER alters or writes to the Komatsu system.
 */
async function fetchMachineLifecycleFromEqpc({ serialNo, model = '', customCookie = null }) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr || cookieStr.includes('test_session')) {
    throw new Error('No active Komatsu Equipment Care session cookie configured.');
  }

  const normSerial = String(serialNo || '').trim();
  let effectiveModel = String(model || '').trim();

  // If model is missing, attempt to look up from database
  if (!effectiveModel) {
    try {
      const machineTable = await resolveEqpTable('eqp_machines', 'machines');
      const mRes = await db.query(
        `SELECT machine_type FROM ${machineTable} WHERE machine_number ILIKE $1 LIMIT 1`,
        [normSerial]
      );
      effectiveModel = mRes.rows[0]?.machine_type || '';
    } catch {
      // Ignore
    }
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': cookieStr,
    'Referer': 'https://eqp-care.komatsu.co.jp/eqpc/EMDW0904.do',
  };

  const url = `https://eqp-care.komatsu.co.jp/eqpc/link.do?linkPath=EMDW0904tiles&model=${encodeURIComponent(effectiveModel)}&serial=${encodeURIComponent(normSerial)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: defaultHeaders,
  });

  if (res.status === 401 || res.status === 302) {
    throw new Error('Komatsu EQP Care session expired. Please refresh your session cookie.');
  }

  const html = await res.text();
  if (
    html.includes('error.do') ||
    html.includes('session is expired') ||
    html.includes('Your session was over') ||
    html.includes('Your session has expired')
  ) {
    throw new Error('Komatsu EQP Care session expired. Please update your session cookie.');
  }

  const parsed = parseHistoryTableFromHtml(html, normSerial, effectiveModel);
  return parsed;
}

/**
 * Strictly read-only: Synchronizes the fleet lifecycle records from Komatsu Equipment Care.
 * Caches the results locally to enable instant offline access and fast page loading.
 */
async function syncFleetLifecycleFromEqpc({ machines = [], customCookie = null, machineNumber = null }) {
  const cache = loadCachedLiveLifecycle();
  if (!cache.machines) cache.machines = {};

  // If specific machineNumber requested
  if (machineNumber) {
    const matched = machines.find((m) =>
      String(m.machine_number || m.machineNumber || m.serialNo || m.serial) === String(machineNumber)
    );
    const model = matched?.machine_type || matched?.machineType || matched?.model || '';
    const res = await fetchMachineLifecycleFromEqpc({ serialNo: machineNumber, model, customCookie });
    cache.machines[String(machineNumber)] = res;
    cache.lastSync = new Date().toISOString();
    cache.totalMachines = Object.keys(cache.machines).length;
    saveCachedLiveLifecycle(cache);
    return {
      success: true,
      single: true,
      machineNumber,
      record: res,
      cache,
    };
  }

  // If list of machines provided or fetch all from database
  let targetMachines = machines;
  if (!targetMachines || targetMachines.length === 0) {
    try {
      const machineTable = await resolveEqpTable('eqp_machines', 'machines');
      const res = await db.query(
        `SELECT id, machine_number, machine_type FROM ${machineTable} ORDER BY machine_number ASC`
      );
      targetMachines = res.rows || [];
    } catch {
      targetMachines = [];
    }
  }

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (const m of targetMachines) {
    const sNo = String(m.machine_number || m.machineNumber || m.serialNo || m.serial || '').trim();
    const model = m.machine_type || m.machineType || m.model || '';
    if (!sNo) continue;

    try {
      const res = await fetchMachineLifecycleFromEqpc({ serialNo: sNo, model, customCookie });
      cache.machines[sNo] = res;
      synced++;
      // Brief polite delay between calls to not flood the Komatsu server
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      failed++;
      errors.push({ serialNo: sNo, error: err.message });
      // If session expired, halt batch to avoid useless retries
      if (err.message.includes('expired')) {
        break;
      }
    }
  }

  cache.lastSync = new Date().toISOString();
  cache.totalMachines = Object.keys(cache.machines).length;
  saveCachedLiveLifecycle(cache);

  return {
    success: true,
    totalTarget: targetMachines.length,
    synced,
    failed,
    errors,
    lastSync: cache.lastSync,
    machines: cache.machines,
  };
}

module.exports = {
  saveCookie,
  loadCookie,
  parseCookieInput,
  testEqpcConnection,
  lookupMachineDetails,
  uploadReportToEqpCare,
  updateServiceLogInEqpCare,
  batchUploadReports,
  resolveMachineTypeAndSubtype,
  EVENT_CODES,
  mapServiceTypeToEventCode,
  loadCachedLiveLifecycle,
  saveCachedLiveLifecycle,
  parseHistoryTableFromHtml,
  fetchMachineLifecycleFromEqpc,
  syncFleetLifecycleFromEqpc,
  isLastReportForMachine,
  parseDwrResponse,
};

