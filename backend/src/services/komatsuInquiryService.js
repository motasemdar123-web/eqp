const fs = require('fs');
const path = require('path');

const COOKIE_FILE_PATH = path.join(__dirname, '../../data/pdx_cookies.txt');
const INQUIRY_PAGE_URL = 'https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry';
const SEARCH_API_URL = 'https://www.komatsu.ae/kmewebportal/StockInquiry/MultiPartsStockInqSearch';

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

function saveCookie(rawInput) {
  const cookieStr = parseCookieInput(rawInput);
  if (cookieStr) {
    const dir = path.dirname(COOKIE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(COOKIE_FILE_PATH, cookieStr, 'utf-8');
  }
  return cookieStr;
}

function loadCookie() {
  try {
    if (fs.existsSync(COOKIE_FILE_PATH)) {
      return fs.readFileSync(COOKIE_FILE_PATH, 'utf-8').trim();
    }
  } catch {
    // Ignore read error
  }
  return '';
}

async function testPdxConnection(customCookie = null) {
  const cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    return { connected: false, message: 'No PDX session cookie configured yet.' };
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

    if (finalUrl.includes('login.microsoftonline.com') || text.includes('Sign in to your account')) {
      return { connected: false, message: 'PDX Session expired. Please copy fresh cookies from your Edge browser tab.' };
    }

    if (finalUrl.includes('MultiplePartsStockInquiry') || text.includes('PDX') || text.includes('KOMATSU')) {
      const userMatch = text.match(/([A-Za-z\s]+),\s*Database:\s*([A-Za-z0-9_]+)/);
      if (userMatch) {
        return {
          connected: true,
          user: userMatch[1].trim(),
          database: userMatch[2].trim(),
          message: `Connected as ${userMatch[1].trim()} (${userMatch[2].trim()})`,
        };
      }
      return { connected: true, message: 'Successfully connected to Komatsu PDX portal!' };
    }

    return { connected: false, message: `Unexpected response status: ${response.status}` };
  } catch (error) {
    return { connected: false, message: `Network error connecting to Komatsu PDX: ${error.message}` };
  }
}

function parsePdxHtmlTable(htmlText, queriedParts) {
  const tbodyMatch = htmlText.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];

  const trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const parsedRows = [];
  const seenKeys = new Set();
  const queriedSet = new Set(queriedParts.map((p) => String(p).trim().toUpperCase()));

  for (const tr of trMatches) {
    const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    const cleanTds = tdMatches.map((td) => {
      let txt = td.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
      return txt.replace(/\s+/g, ' ');
    });

    if (cleanTds.length >= 22) {
      const rawPartNo = cleanTds[0] || '';
      const desc = cleanTds[3] || '';
      const cc = cleanTds[4] || '';
      const ic = cleanTds[5] || '';
      const lpn = cleanTds[6] || '';
      const stock = cleanTds[7] || '0';
      const eor = cleanTds[8] || '';
      const onOrder = cleanTds[9] || '0';
      const regionalInv = cleanTds[10] || '';
      const kltdTotal = cleanTds[16] || '0';
      const kmeqa = cleanTds[17] || '0';
      const dnetPrice = cleanTds[18] || '0.00';
      const weight = cleanTds[19] || '0';
      const leadTime = cleanTds[20] || '';
      const mor = cleanTds[21] || '';
      const orRank = cleanTds[22] || '';

      const isMain = queriedSet.has(rawPartNo.trim().toUpperCase()) && (rawPartNo === lpn || !ic || ic === '000');
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
  testPdxConnection,
  queryPdxBatch,
  runBulkInquiry,
};
