const fs = require('fs');
const path = require('path');

const BASE_PORTAL_URL = 'https://www.komatsu.ae/kmewebportal';
const COOKIE_FILE_PATH = path.join(__dirname, '../../data/pdx_cookies.txt');

function loadCookie() {
  if (process.env.PDX_COOKIES) return process.env.PDX_COOKIES;
  if (fs.existsSync(COOKIE_FILE_PATH)) {
    return fs.readFileSync(COOKIE_FILE_PATH, 'utf8').trim();
  }
  return '';
}

function parseCookieInput(cookieInput) {
  if (!cookieInput) return '';
  return cookieInput
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .join('; ');
}

function mergeCookies(existingCookieStr, newCookiesArray) {
  const map = new Map();
  if (existingCookieStr) {
    existingCookieStr.split(';').forEach((p) => {
      const idx = p.indexOf('=');
      if (idx !== -1) {
        const k = p.slice(0, idx).trim();
        const v = p.slice(idx + 1).trim();
        if (k) map.set(k, v);
      }
    });
  }
  if (newCookiesArray) {
    const list = Array.isArray(newCookiesArray) ? newCookiesArray : [newCookiesArray];
    list.forEach((headerVal) => {
      if (!headerVal) return;
      const firstPart = headerVal.split(';')[0];
      const idx = firstPart.indexOf('=');
      if (idx !== -1) {
        const k = firstPart.slice(0, idx).trim();
        const v = firstPart.slice(idx + 1).trim();
        if (k) map.set(k, v);
      }
    });
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * Fetch line items for a specific Komatsu PDX Quotation
 */
async function getQuotationParts(quotationNo, seqNo = '00', customCookie = null) {
  let cookieStr = customCookie ? parseCookieInput(customCookie) : loadCookie();
  if (!cookieStr) {
    throw new Error('No PDX session cookie configured.');
  }

  const cleanQtn = String(quotationNo).trim();
  const cleanSeq = String(seqNo || '00').trim();

  const defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Origin': 'https://www.komatsu.ae',
    'Cookie': cookieStr,
  };

  // STEP 1: Pre-load QuotationDetails session
  const detailUrl = `${BASE_PORTAL_URL}/QuotationDetails/Index?strQUTN=${cleanQtn}&strQutnSubNo=${cleanSeq}&DBCode=536K`;
  const initResp = await fetch(detailUrl, {
    method: 'GET',
    headers: defaultHeaders,
    signal: AbortSignal.timeout(20000),
  });

  const initSetCookies = initResp.headers.getSetCookie
    ? initResp.headers.getSetCookie()
    : [initResp.headers.get('set-cookie')].filter(Boolean);
  if (initSetCookies.length > 0) {
    cookieStr = mergeCookies(cookieStr, initSetCookies);
  }

  // STEP 2: Query line items via QuotationDetails/Search
  const searchUrl = `${BASE_PORTAL_URL}/QuotationDetails/Search`;
  const searchResp = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': detailUrl,
      'Cookie': cookieStr,
    },
    body: new URLSearchParams({
      strQuotationNo: cleanQtn,
      strQuotSeqNo: cleanSeq,
      DBCode: '536K',
      page: '1',
      pageSize: '100',
      group: '',
      filter: '',
    }).toString(),
    signal: AbortSignal.timeout(20000),
  });

  const rawText = await searchResp.text();
  const parts = [];

  // Try parsing as JSON first (Kendo Grid data)
  try {
    const json = JSON.parse(rawText);
    const dataList = json.Data || json.data || (Array.isArray(json) ? json : null);
    if (Array.isArray(dataList)) {
      dataList.forEach((item) => {
        const partNo = item.RequestedPartNo || item.PartNo || item.ItemNo || item.PartNumber || '';
        if (!partNo) return;
        parts.push({
          part_no: String(partNo).trim(),
          description: String(item.Description || item.PartDescription || item.ItemDescription || 'PARTS').trim(),
          quantity: Number(item.Requested_Quantity || item.Quantity || item.Qty || 1),
          unit_price: item.Unit_Price !== undefined ? Number(item.Unit_Price).toFixed(3) : '0.000',
          total_price: item.Total_Price !== undefined ? Number(item.Total_Price).toFixed(3) : '0.000',
          unit: item.Unit || 'EA',
          quotation_no: cleanQtn,
        });
      });
    }
  } catch {
    // If not JSON, parse HTML table rows
    const trMatches = rawText.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    for (const tr of trMatches) {
      const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (tdMatches.length >= 4) {
        const cleanTds = tdMatches.map((td) => td.replace(/<[^>]+>/g, '').trim());
        const partNo = cleanTds[1] || cleanTds[0];
        if (partNo && !partNo.toLowerCase().includes('part') && !partNo.toLowerCase().includes('item')) {
          parts.push({
            part_no: partNo,
            description: cleanTds[2] || 'PARTS',
            quantity: parseFloat(cleanTds[3]) || 1,
            unit_price: cleanTds[4] || '0.000',
            total_price: cleanTds[5] || '0.000',
            unit: 'EA',
            quotation_no: cleanQtn,
          });
        }
      }
    }
  }

  return {
    quotation_no: cleanQtn,
    revision_no: cleanSeq,
    count: parts.length,
    parts,
  };
}

module.exports = {
  getQuotationParts,
};
