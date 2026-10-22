const fs = require('fs');
const path = require('path');

const COOKIE_FILE_PATH = path.join(__dirname, '../../data/pdx_cookies.txt');
const INQUIRY_PAGE_URL = 'https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry';
const SEARCH_API_URL = 'https://www.komatsu.ae/kmewebportal/StockInquiry/MultiPartsStockInqSearch';

// PDX authenticates through the OWIN `.AspNet.Cookies` ticket (possibly chunked as .AspNet.CookiesC1, C2...).
// It is HttpOnly, so `document.cookie` never includes it; a cookie without it always lands on the SSO login page.
const AUTH_COOKIE_PATTERN = /(^|;\s*)\.AspNet\.Cookies(C\d+)?=[^;\s]+/;

const MISSING_AUTH_MESSAGE =
  'Cookie is missing the .AspNet.Cookies login ticket (document.cookie cannot read it). ' +
  'Use the EQP PDX extension or F12 > Network > Copy as cURL from a logged-in PDX tab.';

let inMemoryCookie = '';

function hasAuthTicket(cookieStr = '') {
  return AUTH_COOKIE_PATTERN.test(String(cookieStr || ''));
}

function loadSavedCookieRaw() {
  try {
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      const saved = fs.readFileSync(COOKIE_FILE_PATH, 'utf-8').trim();
      if (saved) return saved;
    }
  } catch {
    // Ignore read error
  }
  return '';
}

function extractStoredAuthCookie() {
  const current = inMemoryCookie || loadSavedCookieRaw();
  if (!current) return '';
  const match = current.match(/\.AspNet\.Cookies=([^;]+)/);
  return match ? match[1] : '';
}

// Resolves a cookie sent with a request. A cookie without the auth ticket never replaces a stored
// authenticated session, so a stale browser copy cannot break orders for everyone.
function parseCookieInput(rawInput = '') {
  const parsed = normalizeCookieString(rawInput);
  if (!parsed) return loadCookie();
  if (!hasAuthTicket(parsed)) {
    const stored = loadCookie();
    if (hasAuthTicket(stored)) return stored;
  }
  return parsed;
}

function normalizeCookieString(rawInput = '') {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return '';

  let extracted = trimmed;

  // If cURL command or header pasted
  if (trimmed.toLowerCase().includes('curl') || trimmed.toLowerCase().includes('invoke-webrequest') || trimmed.includes('fetch(')) {
    const match = trimmed.match(/-(?:H|-header)\s+['"](?:cookie:\s*)?([^'"]+)['"]/i);
    if (match) extracted = match[1].trim();

    const match2 = trimmed.match(/-(?:b|-cookie)\s+['"]([^'"]+)['"]/i);
    if (match2) extracted = match2[1].trim();

    const match3 = trimmed.match(/["']?cookie["']?\s*:\s*["']([^"']+)["']/i);
    if (match3) extracted = match3[1].trim();
  }

  for (const line of extracted.split('\n')) {
    const lineTrimmed = line.trim();
    if (lineTrimmed.toLowerCase().startsWith('cookie:')) {
      extracted = lineTrimmed.slice(7).trim();
      break;
    }
  }

  // Parse key-value pairs
  const map = new Map();
  extracted.split(';').forEach((part) => {
    const [k, ...v] = part.trim().split('=');
    if (k && v.length > 0) {
      map.set(k.trim(), v.join('=').trim());
    }
  });

  // Re-assemble complete cookie string
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function loadCookie() {
  if (inMemoryCookie) {
    return inMemoryCookie;
  }
  if (process.env.PDX_COOKIES) {
    return parseCookieInput(process.env.PDX_COOKIES);
  }
  if (process.env.KOMATSU_COOKIES) {
    return parseCookieInput(process.env.KOMATSU_COOKIES);
  }
  return loadSavedCookieRaw();
}

// Returns '' (and keeps the current session) when the input has no auth ticket.
function saveCookie(rawInput) {
  const cookieStr = normalizeCookieString(rawInput);
  if (!hasAuthTicket(cookieStr)) {
    return '';
  }
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

async function testPdxConnection(customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    return { connected: false, message: 'No PDX session cookie configured yet.' };
  }
  if (!hasAuthTicket(cookieStr)) {
    return { connected: false, missingAuthTicket: true, message: MISSING_AUTH_MESSAGE };
  }

  try {
    const response = await fetch(INQUIRY_PAGE_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
        'Accept': 'text/html, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': INQUIRY_PAGE_URL,
        'Cookie': cookieStr,
      },
      redirect: 'follow',
    });

    const text = await response.text();
    const finalUrl = response.url || '';

    if (
      finalUrl.includes('login.microsoftonline.com') ||
      finalUrl.includes('SSO/Dashboard') ||
      text.includes('Sign in to your account') ||
      !finalUrl.includes('kmewebportal')
    ) {
      return { connected: false, message: 'PDX Session expired. Please copy fresh cookies from your Edge browser tab.' };
    }

    const userMatch = text.match(/([A-Za-z\s]+),\s*Database:\s*([A-Za-z0-9_]+)/);
    if (userMatch) {
      return {
        connected: true,
        user: userMatch[1].trim(),
        database: userMatch[2].trim(),
        message: `Connected as ${userMatch[1].trim()} (${userMatch[2].trim()})`,
      };
    }

    return { connected: false, message: 'PDX Session invalid or expired. Please refresh your session cookie.' };
  } catch (error) {
    return { connected: false, message: `Network error connecting to Komatsu PDX: ${error.message}` };
  }
}

function sanitizeQty(val) {
  if (val === null || val === undefined) return '0';
  const str = String(val).replace(/,/g, '').trim();
  // Part numbers contain hyphens (e.g. 208-62-21260) or letters.
  // Stock/reserve quantities must strictly be numeric digits only.
  if (!str || str.includes('-') || /[a-z]/i.test(str)) {
    return '0';
  }
  const num = parseInt(str, 10);
  return isNaN(num) || num < 0 ? '0' : String(num);
}

function sanitizePrice(val) {
  if (val === null || val === undefined) return '0.00';
  const str = String(val).replace(/,/g, '').trim();
  if (!str || str.includes('-') || /[a-z]/i.test(str) || str === '000' || str === '0') {
    return '0.00';
  }
  const parsedP = parseFloat(str);
  return !isNaN(parsedP) && parsedP > 0 ? parsedP.toFixed(2) : '0.00';
}

function extractColumnMapping(theadHtml) {
  if (!theadHtml) return null;
  const thMatches = theadHtml.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
  if (thMatches.length === 0) return null;

  const colMap = {};
  let visibleColIdx = 0;

  for (const th of thMatches) {
    if (/display:\s*none/i.test(th) || /visibility:\s*hidden/i.test(th)) continue;
    const title = th.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim().replace(/\s+/g, ' ');
    const lower = title.toLowerCase();

    if (/part\s*no/i.test(lower)) colMap.partNo = visibleColIdx;
    else if (/part\s*desc|description/i.test(lower)) colMap.desc = visibleColIdx;
    else if (/^cc$/i.test(title) || /character\s*code/i.test(lower)) colMap.cc = visibleColIdx;
    else if (/^ic$/i.test(title) || /interchangeable/i.test(lower)) colMap.ic = visibleColIdx;
    else if (/^lpn$/i.test(title) || /latest\s*part/i.test(lower)) colMap.lpn = visibleColIdx;
    else if (/kme\s*stock/i.test(lower) || (/stock/i.test(lower) && !/point|regional|excess/i.test(lower))) colMap.stock = visibleColIdx;
    else if (/kme\s*eor/i.test(lower) || /^eor$/i.test(title) || /eor/i.test(lower)) colMap.eor = visibleColIdx;
    else if (/kme\s*on\s*order|on\s*order/i.test(lower)) colMap.onOrder = visibleColIdx;
    else if (/regional\s*inv|excess/i.test(lower)) colMap.regionalInv = visibleColIdx;
    else if (/kltd\s*total|japan\s*total/i.test(lower)) colMap.kltdTotal = visibleColIdx;
    else if (/kmeqa/i.test(lower)) colMap.kmeqa = visibleColIdx;
    else if (/dnet\s*price|list\s*price|^price$/i.test(lower)) colMap.dnetPrice = visibleColIdx;
    else if (/weight/i.test(lower)) colMap.weight = visibleColIdx;
    else if (/kltd\s*lt|lead\s*time|^lt$/i.test(lower)) colMap.leadTime = visibleColIdx;
    else if (/^mor$/i.test(title)) colMap.mor = visibleColIdx;
    else if (/^or$/i.test(title) || /order\s*rank/i.test(lower)) colMap.orderRank = visibleColIdx;

    visibleColIdx++;
  }

  // Ensure essential partNo and stock columns were identified
  if (colMap.partNo === undefined || colMap.stock === undefined) {
    return null;
  }
  return colMap;
}

function parsePdxHtmlTable(htmlText, queriedParts = []) {
  const tbodyMatch = htmlText.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];

  const theadMatch = htmlText.match(/<thead>([\s\S]*?)<\/thead>/i);
  const detectedColMap = theadMatch ? extractColumnMapping(theadMatch[1]) : null;

  // Standard fallback visible column layout (when visible cells exclude display:none)
  // [0]=PartNo, [1]=IntExist, [2]=tmpDnet, [3]=Desc, [4]=CC, [5]=IC, [6]=LPN,
  // [7]=KME Stock, [8]=KME EOR, [9]=KME On Order, [10]=Regional Inv,
  // [11]=KLTD Total, [12]=KMEQA, [13]=DNet Price, [14]=Weight(gm), [15]=KLTD LT, [16]=MOR, [17]=OR
  const colMap = detectedColMap || {
    partNo: 0,
    desc: 3,
    cc: 4,
    ic: 5,
    lpn: 6,
    stock: 7,
    eor: 8,
    onOrder: 9,
    regionalInv: 10,
    kltdTotal: 11,
    kmeqa: 12,
    dnetPrice: 13,
    weight: 14,
    leadTime: 15,
    mor: 16,
    orderRank: 17,
  };

  const trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const parsedRows = [];
  const seenKeys = new Set();
  const queriedSet = new Set(queriedParts.map((p) => String(p).trim().toUpperCase()));

  for (const tr of trMatches) {
    const rawTds = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    // Filter out internal hidden cells (e.g. style="display: none;") to align visible columns
    const visibleTds = [];
    for (const td of rawTds) {
      if (/display:\s*none/i.test(td) || /visibility:\s*hidden/i.test(td)) continue;
      const clean = td.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim().replace(/\s+/g, ' ');
      visibleTds.push(clean);
    }

    const minRequiredCols = detectedColMap
      ? Math.max((colMap.partNo ?? 0) + 1, (colMap.stock ?? 0) + 1)
      : 8;
    if (visibleTds.length < minRequiredCols) continue;

    const rawPartNo = visibleTds[colMap.partNo ?? 0] || '';
    const desc = visibleTds[colMap.desc ?? 3] || '';
    const cc = visibleTds[colMap.cc ?? 4] || '';
    const ic = visibleTds[colMap.ic ?? 5] || '';
    const lpnCandidate = visibleTds[colMap.lpn ?? 6];
    const lpn = (lpnCandidate && lpnCandidate.trim()) ? lpnCandidate.trim() : rawPartNo;

    // Numerical stock & inventory metrics with strict sanitization
    const stock = sanitizeQty(visibleTds[colMap.stock ?? 7]);
    const eor = sanitizeQty(visibleTds[colMap.eor ?? 8]);
    const onOrder = sanitizeQty(visibleTds[colMap.onOrder ?? 9]);
    const regionalInv = sanitizeQty(visibleTds[colMap.regionalInv ?? 10]);
    const kltdTotal = sanitizeQty(visibleTds[colMap.kltdTotal ?? 11]);
    const kmeqa = sanitizeQty(visibleTds[colMap.kmeqa ?? 12]);

    // Extract DNet / ListPrice strictly from ListPrice class or mapped price column
    let rawPriceText = '';
    const listPriceMatch = tr.match(/<td[^>]*class=["'][^"']*ListPrice[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    if (listPriceMatch) {
      rawPriceText = listPriceMatch[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
    } else if (colMap.dnetPrice !== undefined && visibleTds[colMap.dnetPrice]) {
      rawPriceText = visibleTds[colMap.dnetPrice];
    }
    const dnetPrice = sanitizePrice(rawPriceText);

    const weight = visibleTds[colMap.weight ?? 14] || '0';
    const leadTime = visibleTds[colMap.leadTime ?? 15] || '';
    const mor = visibleTds[colMap.mor ?? 16] || '';
    const orRank = visibleTds[colMap.orderRank ?? 17] || '';

    const isMain = queriedSet.size === 0 || (queriedSet.has(rawPartNo.trim().toUpperCase()) && (rawPartNo === lpn || !ic || ic === '000'));
    const rowKey = `${rawPartNo}_${lpn}_${dnetPrice}_${stock}_${isMain}`;
    if (seenKeys.has(rowKey)) continue;
    seenKeys.add(rowKey);

    parsedRows.push({
      itemType: isMain ? 'Main Part' : '↳ Alternative Part',
      isAlternative: !isMain,
      partNumber: isMain ? rawPartNo : `↳ ${rawPartNo}`,
      rawPartNumber: rawPartNo,
      description: desc,
      lpn: lpn,
      kmeStock: stock,
      eor: eor,
      onOrder: onOrder,
      dnetPrice: dnetPrice,
      weight: weight,
      leadTime: leadTime,
      characterCode: cc,
      interchangeableCode: ic,
      regionalInventory: regionalInv,
      kltdTotal: kltdTotal,
      kmeqa: kmeqa,
      mor: mor,
      orderRank: orRank,
    });
  }

  return parsedRows;
}

async function queryPdxBatch(cookieStr, partNumbers) {
  const formData = new URLSearchParams();
  formData.append('ddlManufacturer', '0000');
  formData.append('ddlStockPoint', '');

  for (let i = 1; i <= 12; i++) {
    formData.append(`txtPart${i}`, i - 1 < partNumbers.length ? String(partNumbers[i - 1]).trim() : '');
  }

  const response = await fetch(SEARCH_API_URL, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': 'text/html, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': INQUIRY_PAGE_URL,
      'Cookie': cookieStr,
    },
    body: formData.toString(),
  });

  const text = await response.text();
  if (response.url?.includes('login.microsoftonline.com') || text.includes('Sign in to your account')) {
    throw new Error('LOGIN_REQUIRED');
  }

  return parsePdxHtmlTable(text, partNumbers);
}

function chunkArray(array, size = 12) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function runBulkInquiry(partRecords, customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No Komatsu PDX session cookie found. Please save a valid cookie first.');
  }

  const batches = chunkArray(partRecords, 12);
  const allResults = [];
  const errors = [];

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    const batchPartNumbers = batch.map((item) => item.partNumber || item.Part_Number || item);
    const qtyMap = {};
    for (const item of batch) {
      const p = String(item.partNumber || item.Part_Number || item).trim();
      const q = Number(item.quantity || item.Quantity || 1);
      qtyMap[p.toUpperCase()] = q;
    }

    try {
      const rows = await queryPdxBatch(cookieStr, batchPartNumbers);
      for (const row of rows) {
        const reqQty = qtyMap[row.rawPartNumber.toUpperCase()] || qtyMap[row.lpn?.toUpperCase()] || 1;
        allResults.push({
          ...row,
          requestedQty: reqQty,
        });
      }
      // Small delay between batches to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 350));
    } catch (err) {
      if (err.message === 'LOGIN_REQUIRED') {
        throw new Error('PDX Session expired. Please copy a new session cookie from Edge.');
      }
      errors.push({ batch: bIdx + 1, error: err.message });
    }
  }

  return {
    totalQueried: partRecords.length,
    totalBatches: batches.length,
    resultsCount: allResults.length,
    results: allResults,
    errors,
  };
}

module.exports = {
  saveCookie,
  loadCookie,
  parseCookieInput,
  hasAuthTicket,
  MISSING_AUTH_MESSAGE,
  testPdxConnection,
  queryPdxBatch,
  runBulkInquiry,
  parsePdxHtmlTable,
  sanitizeQty,
};

