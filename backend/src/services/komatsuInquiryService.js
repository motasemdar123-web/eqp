const fs = require('fs');
const path = require('path');

const COOKIE_FILE_PATH = path.join(__dirname, '../../data/pdx_cookies.txt');
const INQUIRY_PAGE_URL = 'https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry';
const SEARCH_API_URL = 'https://www.komatsu.ae/kmewebportal/StockInquiry/MultiPartsStockInqSearch';

const DEFAULT_INITIAL_COOKIES =
  'SelectedLanguage=; ' +
  'ASP.NET_SessionId=dhikw34t4w02mzgqk5bckgg3; ' +
  '.AspNet.Cookies=3diPcaSc4DOvzzM3fKBXLobcx-_b7h-kebCwlG9baEieeg-b3fLEzVUI6NkQhvYMKmeaNZl5NDLONnje8T6QAVgzLxFpt3uzr9zT2qAqVEDPyCGFCFzfIJhVn5zbC4LeOIGi5XsNTaamtJqZ3P6LoxG3cTPYyABNVgV4YU6I-N9mErrHIaYw5DaXOU3dsiAclNJO2x53-Po5hCkqbX-zt_drfKT2hVLflni7ZA_LrGzcyHqihO1qr73xNsD5z9x455D0iQrZYUQB_J4bInBK7fogTvv3V0p2QaVJoQ13pwe0nA49rE_3wT7jKrUbR3yQfBkNMsIPFjiKLkK2XRNh90fggcc2kXAY524E0ZsbEm6glLHIpM_nqVS9hLWjGogAUenzWBRUcIEFD9ZVa3c2DAk2jYxcUHkm00vnJ7MVK6-V-au5SqQLIQSY6m8DzmVLYNlNCR7cYvghxhY7nR3OQvbHjFoQF_rrdpiYFkx23wgbfTZSlNzhhW1hmtUmzOnp4WV_zf7G_9IVaubutGx9C97Lo5vKg1g2Ka34sIzFo2_UorW-MZPP6hsi8zk7T2fFrvpSfsfj1NGjVkL7xr34GIw6prGEVuk0Nmhmbx2jggnRpOUyT1SFBijvd4f6g-o5NnP14qooTRslosODoyoZ5DPBL_qCm7idEOeXks_FcWdi2tjMqYV6VawL7m67diXW2UX5F-DzOwdiRNah5rSMQg2hYzXbaceKVhAdEi3l9HtdA_Vdei3mEUTCsK69-Uk6tmX8MX5MGTNW81ukI8N_y9m8eCqEr6_kyLPkvO_LpGa8fxt3m2IRi_aGonKz2Nuj1DWSMZQzXekR96GE7Ed6Yv1KlbntKuAviO_d7YK8yrhXuX3IDMDZRrDVd41GB7XuSYWapsXa6IpEBrW0c-TFZsryQf7GQKOitgUmK6s7hC7kuPDwyNPWRybgfzl87SK9Ux24MlTlMp6UECtlNNRLpKHuA6oqMHovYclJqkZBxXIAvuGthh2WpSahgfUMCc1GieLAnhoIePcSd5CXQg7P_MnlH9A6ojvuTYmh8SqoY1Kmlh07QeCcovnD0nCctukzMF9arBnsISpYR5QOR9U94jUv7CzFWDNo3GpeYyHGUxcYJqdLAmb6emiBJizye2MZlYdQIDTy8eRSDuYZNvrjlyiw6IeS4LQZUo4fZ3brGD3j88Ag0lT8aXlqVXhKJzXy-U6-odFfaxJ5IRc_9APJ2GqeywGpNaXm2uSt5qpn8itDUf9JSO2-K1Ih1U5EIDfjhcwT4PksgAuYi7gDudWoNs6cXGuEZvFGMle2ehTsamKUj_3mln3kO2RibH-u7i5jWBB1aY-OvrF0jLYhPGmEX_MCuswqjmTPOsZZSbDa7HoRdfFPiQ3DiYQhqDOdDn7Eft23W13RxOz_Xvy2SXXiEy_BRKDkYig_8fTZF53YihbhBjj2kYiCx7sfPL4aqV4Xxd_cdSiXGwtu_haKllHUo-naYUWelfvhU59podgg8tBkdU51OBCD1fsKhVB16XZTsie0qynbqMONKDzrJ5041UPK01uZNUMe8mRRLSf6lyp9P5zIh8u9dDlDPuWJJzR8KpwVodWWKJ9zuIQyrgSUsYXVuO4EqAe99rPSCVh9xUM6xz4Cl97hflI1ov2D5HVa';

let inMemoryCookie = '';

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
  const current = inMemoryCookie || loadSavedCookieRaw() || DEFAULT_INITIAL_COOKIES;
  const match = current.match(/\.AspNet\.Cookies=([^;]+)/);
  return match ? match[1] : '';
}

function parseCookieInput(rawInput = '') {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) return loadCookie();

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

  // If user only provided document.cookie (missing .AspNet.Cookies), automatically merge with stored auth token!
  if (!map.has('.AspNet.Cookies')) {
    const savedAuth = extractStoredAuthCookie();
    if (savedAuth) {
      map.set('.AspNet.Cookies', savedAuth);
    }
  }

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
  const saved = loadSavedCookieRaw();
  if (saved) return saved;

  return DEFAULT_INITIAL_COOKIES;
}

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
  parseCookieInput,
  testPdxConnection,
  queryPdxBatch,
  runBulkInquiry,
};
