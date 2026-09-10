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

function extractPartsFromText(text, quotationNo) {
  if (!text) return [];
  const cleanQtn = String(quotationNo || '').trim();
  const parts = [];
  const seenParts = new Set();

  function addItem(rawPartNo, rawDesc, rawQty, rawPrice, rawTotal, rawUom) {
    const partNo = String(rawPartNo || '').trim();
    if (!partNo || seenParts.has(partNo)) return;
    seenParts.add(partNo);

    const desc = String(rawDesc || 'PARTS').trim();
    const qNum = parseFloat(rawQty);
    const quantity = !isNaN(qNum) && qNum > 0 ? qNum : 1;

    let unitPrice = '0.000';
    if (rawPrice !== undefined && rawPrice !== null && rawPrice !== '') {
      const pNum = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
      if (!isNaN(pNum) && pNum >= 0) {
        unitPrice = pNum.toFixed(3);
      }
    }

    let totalPrice = '0.000';
    if (rawTotal !== undefined && rawTotal !== null && rawTotal !== '') {
      const tNum = typeof rawTotal === 'number' ? rawTotal : parseFloat(String(rawTotal).replace(/[^0-9.]/g, ''));
      if (!isNaN(tNum) && tNum >= 0) {
        totalPrice = tNum.toFixed(3);
      }
    } else if (parseFloat(unitPrice) > 0) {
      totalPrice = (quantity * parseFloat(unitPrice)).toFixed(3);
    }

    const unit = String(rawUom || 'EA').trim().toUpperCase() || 'EA';

    parts.push({
      part_no: partNo,
      description: desc,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      unit,
      quotation_no: cleanQtn,
    });
  }

  // 1. Try JSON parsing
  try {
    const json = typeof text === 'string' ? JSON.parse(text) : text;
    const dataList = json.Data || json.data || (Array.isArray(json) ? json : null);
    if (Array.isArray(dataList)) {
      dataList.forEach((item) => {
        const partNo = item.RequestedPartNo ||
          item.Requested_Part_No ||
          item.PartNo ||
          item.Part_No ||
          item.ItemNo ||
          item.ITEM_NO ||
          item.PartNumber ||
          item.part_no ||
          item.partNo;
        const desc = item.Description ||
          item.PartDescription ||
          item.ItemDescription ||
          item.PART_DESC ||
          item.part_desc ||
          item.ItemDesc;
        const qty = item.Requested_Quantity ??
          item.RequestedQuantity ??
          item.Quantity ??
          item.Qty ??
          item.QTY ??
          item.ReqQuantity ??
          item.ReqQty ??
          item.OrderQty ??
          item.quantity ??
          item.qty;
        const price = item.Unit_Price ??
          item.UnitPrice ??
          item.Price ??
          item.SellingPrice ??
          item.SalesPrice ??
          item.Rate ??
          item.unit_price ??
          item.price;
        const total = item.Total_Price ??
          item.TotalPrice ??
          item.Amount ??
          item.TotalAmount ??
          item.total_price;
        const uom = item.Unit || item.UOM || item.UnitOfMeasure;

        if (partNo) {
          addItem(partNo, desc, qty, price, total, uom);
        }
      });
    }
  } catch {
    // Not valid root JSON, continue to regex/HTML
  }

  if (parts.length > 0) return parts;

  // 2. Check for embedded JSON in script tags (Kendo Grid dataSource: [{"RequestedPartNo": ...}])
  const jsonArrayMatches = String(text).match(/\[\s*\{[^{}]*(?:"RequestedPartNo"|"PartNo"|"PartNumber")[^{}]*\}\s*\]/gi) || [];
  for (const arrStr of jsonArrayMatches) {
    try {
      const arr = JSON.parse(arrStr);
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          const partNo = item.RequestedPartNo || item.PartNo || item.ItemNo || item.part_no;
          const desc = item.Description || item.PartDescription || item.ItemDescription || item.PART_DESC;
          const qty = item.Requested_Quantity ?? item.RequestedQuantity ?? item.Quantity ?? item.Qty ?? item.quantity;
          const price = item.Unit_Price ?? item.UnitPrice ?? item.Price ?? item.unit_price;
          const total = item.Total_Price ?? item.TotalPrice ?? item.Amount ?? item.total_price;
          const uom = item.Unit || item.UOM;
          if (partNo) {
            addItem(partNo, desc, qty, price, total, uom);
          }
        });
      }
    } catch {
      // Ignore JSON parse errors for regex chunks
    }
  }

  if (parts.length > 0) return parts;

  // 3. Parse HTML table rows (<tr><td>...</td></tr>)
  const trMatches = String(text).match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  for (const tr of trMatches) {
    const tdMatches = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    if (tdMatches.length >= 3) {
      const cleanTds = tdMatches.map((td) => td.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim());
      // Look for a cell that resembles a Komatsu part number (e.g. 2A8-62-12230, 07143-10605, 207-70-71110)
      for (let i = 0; i < cleanTds.length; i++) {
        const cell = cleanTds[i];
        if (
          cell &&
          /^[A-Z0-9]{2,6}(?:-[A-Z0-9]{2,6}){1,3}$/i.test(cell) &&
          !cell.toLowerCase().includes('date') &&
          !seenParts.has(cell)
        ) {
          const cellsAfter = cleanTds.slice(i + 1);
          let desc = 'PARTS';
          let uom = 'EA';
          const numericCells = [];

          for (const c of cellsAfter) {
            const trimmed = String(c || '').trim();
            if (!trimmed) continue;

            if (/^(EA|PC|PCS|SET|M|KG|NOS|RO|BX|KIT)$/i.test(trimmed)) {
              uom = trimmed.toUpperCase();
              continue;
            }

            const numClean = trimmed.replace(/,/g, '');
            if (/^-?\d+(?:\.\d+)?$/.test(numClean)) {
              numericCells.push(parseFloat(numClean));
              continue;
            }

            if (desc === 'PARTS' && /[a-zA-Z]/.test(trimmed) && trimmed.length >= 2) {
              desc = trimmed;
            }
          }

          // Quantity is always the first numeric value following part & description
          const qty = numericCells.length > 0 && numericCells[0] > 0 ? numericCells[0] : 1;

          let unitPrice = '0.000';
          let totalPrice = '0.000';

          if (numericCells.length >= 2) {
            // Check if 2nd number * qty ≈ 3rd number (or last number), indicating qty * unitPrice = totalPrice
            if (numericCells.length >= 3 && Math.abs(qty * numericCells[1] - numericCells[2]) < 0.05) {
              unitPrice = numericCells[1].toFixed(3);
              totalPrice = numericCells[2].toFixed(3);
            } else if (numericCells.length >= 3 && Math.abs(qty * numericCells[1] - numericCells[numericCells.length - 1]) < 0.05) {
              unitPrice = numericCells[1].toFixed(3);
              totalPrice = numericCells[numericCells.length - 1].toFixed(3);
            } else {
              unitPrice = numericCells[1] >= 0 ? numericCells[1].toFixed(3) : '0.000';
              if (numericCells.length >= 3) {
                totalPrice = numericCells[numericCells.length - 1].toFixed(3);
              } else {
                totalPrice = (qty * parseFloat(unitPrice)).toFixed(3);
              }
            }
          }

          addItem(cell, desc, qty, unitPrice, totalPrice, uom);
          break;
        }
      }
    }
  }

  return parts;
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
  const subNo = cleanSeq === '00' || cleanSeq === '0' || !cleanSeq ? '0' : cleanSeq;

  const defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
    'Origin': 'https://www.komatsu.ae',
    'Cookie': cookieStr,
  };

  // STEP 1: Pre-load QuotationDetails session
  const detailUrl = `${BASE_PORTAL_URL}/QuotationDetails/Index?strQUTN=${cleanQtn}&strQutnSubNo=${subNo}&DBCode=536K`;
  let initHtml = '';
  try {
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
    initHtml = await initResp.text();
  } catch (err) {
    console.warn(`[getQuotationParts] QuotationDetails/Index fetch warning: ${err.message}`);
  }

  // Check if Index page itself already has the parts
  let parts = extractPartsFromText(initHtml, cleanQtn);
  if (parts.length > 0) {
    return {
      quotation_no: cleanQtn,
      revision_no: cleanSeq,
      count: parts.length,
      parts,
    };
  }

  // STEP 2: Query line items via QuotationDetails/Search (Payload 1: standard Kendo)
  const searchUrl = `${BASE_PORTAL_URL}/QuotationDetails/Search`;
  try {
    const searchResp = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': detailUrl,
        'Cookie': cookieStr,
      },
      body: new URLSearchParams({
        qtno: cleanQtn,
        subqtno: subNo,
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
    parts = extractPartsFromText(rawText, cleanQtn);
  } catch (err) {
    console.warn(`[getQuotationParts] QuotationDetails/Search payload 1 warning: ${err.message}`);
  }

  // STEP 3: Fallback Payload 2 (exact python pdx_core signature: { qtno, subqtno, DBCode })
  if (parts.length === 0) {
    try {
      const searchResp2 = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          ...defaultHeaders,
          'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': detailUrl,
          'Cookie': cookieStr,
        },
        body: new URLSearchParams({
          qtno: cleanQtn,
          subqtno: subNo,
          DBCode: '536K',
        }).toString(),
        signal: AbortSignal.timeout(20000),
      });
      const rawText2 = await searchResp2.text();
      parts = extractPartsFromText(rawText2, cleanQtn);
    } catch (err) {
      console.warn(`[getQuotationParts] QuotationDetails/Search payload 2 warning: ${err.message}`);
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
