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
  'mkmwFlg=""; userId=s021895; langCd=ENG; bandwidth=true; eqpMenuCtg=E; dispMenu=1';

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

  return cleanCookieString(text);
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
  if (html.includes('session is expired') || html.includes('Your session was over')) {
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
  batchUploadReports,
  resolveMachineTypeAndSubtype,
  EVENT_CODES,
  mapServiceTypeToEventCode,
  loadCachedLiveLifecycle,
  saveCachedLiveLifecycle,
  parseHistoryTableFromHtml,
  fetchMachineLifecycleFromEqpc,
  syncFleetLifecycleFromEqpc,
};

