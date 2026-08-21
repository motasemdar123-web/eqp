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

const DEFAULT_INITIAL_COOKIES =
  'SelectedLanguage=; ' +
  '.AspNet.Cookies=cqIYX_3LSAVsSB0yvBHA1Esz6Z7Nd5IRgDulEoi-WW19R66jyOkA_pcuA3J3tWkvl7DrkPwpWsMhRc8AcOnxGQ4JT-V3Qlge2OOEVBjO1g9XF7_rMu8l5qGOS6JpZFVxwr0nRaQEZEBUCHV9NKL7IkZaUEICoE35IMwNr8mlqpMRt8AOVrjzLJDFmR0R8oTzfJuxAVzqDH2g3huhvkVQVi0wcnS2gE-XYIVxksxnXb0-I6fHjSelGmMlFvTCm5Z1BMZ7YD6uaiKgIKvCYLFV81fUP0zGWLuLzpARxfbSQC_YUzdcBPTwEculK4B7Caz3oJ27h-Tc6Y_KVJsKqwg6-EIO8yVtbFt_1R20rMga5IDZiGp8hHPWBQax2Q20m7pC4ymPDZDTWpP0rNpFpbd12vjIpXkfqKYg15RiJZEQkYivi6TYu2YepVOu1pJ0M8HNcH7UzPf3zgHDEb-cHR8LZFvWJjeOL17o53kPNEIvQnMDiFf3OPFv9xVh5THfR9QgA4eaB0pDnyD8i4S6lPx4xH6yFi5-yjy98tTw4eR48wP_sW1ppU4gPzGt3F4G_klXy5XbLpvOmzUFtLbx0fVWflkBJK4zxZFmhly14D9-m9R1hddKJv3YQM-XzI-1Y1YXpvYMd9vVf6d-WvohFYcfrOOgHZozc8EnQdaGwIQe6hYHCaRftJ9b_t_YzygnrX-zJ7BCMAEDErE1JLwzBcfkqG22qEI8_GnEpoWHqx_jXRBlXUC3_gmLNIhXf8yrXRDSFMjdOIs_zhYXBg6pltzHmV1MVA9NgvPKgc4DPqdCbLSxyk9uPum2wOqWPvJ7sVjUtmVjKGrJY2P09zwOZmaF18vrjZT3DapMMNg9nzAdCTUVsCK-haC-Fq9lbXgNKb7xMKIFSX3euEx-1PCDfRWsFEnufRWyf1n8MyHvVTSJDpQkCDOdVHjEJMGuO5DDXm8cALpgOLLrbEP5e84gE2mTiKdhrVWFYFZ5kdwyAxftZz-sVCycQQAfrd4zvExB9SGzyY6qVBWSqBmqRYPnQzPG_MhO7CZ3kTcCeuCFINV6hKCITdyArNNIEwdQ7zlxglhNhZqQjH3TgRZlXah22ipdL6LT-2Pz_3A-N-OqsaXKA59_YXyoNsK93oj0jEzS_p5CQwkVGtv4Wo15iboqWLoa_XCynmtueqXJnxBwYVN1PWBfkMDphjRIb_BkbZv2Wa3PiO-5xhN59xK3Itzz72DmaqQnn72ELsjxSpp2Uk4iWOn-DUoDOT8ghcF-6CvSU3cpr1Qp9MjTseUIYvYvOj8XXbTt4-hsS8AqJetfsD5HpQQNk9hraZBJeNCHy_ClQrP9nIQPs3d5IUh_AgPvy42Mv1aI8mMJdhSW0eFlLkYc7IPbjNd5PeF7eJn4pXKltjbq23HZEbG3xQ4wP50QHx4ogQS81hftxiInh03xl-2ETm-l-r11zKapI_vZESarEeoQ_koccqaJV4-6qtCwFSkA1ApNYx9V76Vgj-fl0HaLobakaxG_IzjcqGmH6LkWR8sbtQRHqZAoA-O4jPaLHCOqFFD66tqlDQPfK6vfifDbS-yVbg_YE4XaExoeuIWafn8hnGPF2BETEz9dM3cLhLtf6O5WxbrayIYrR2OFOhW0OE7Sxqsykl63wYXIbFsWzpVB_; ' +
  'ASP.NET_SessionId=f33mpgny11b3ikxgvclruxcl';

let inMemoryCookie = '';

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
  testPdxConnection,
  queryPdxBatch,
  runBulkInquiry,
};
