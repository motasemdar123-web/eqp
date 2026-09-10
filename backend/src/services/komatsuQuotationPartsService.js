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
      if (!isNaN(pNum) && pNum > 0) {
        unitPrice = pNum.toFixed(3);
      }
    }

    let totalPrice = '0.000';
    if (rawTotal !== undefined && rawTotal !== null && rawTotal !== '') {
      const tNum = typeof rawTotal === 'number' ? rawTotal : parseFloat(String(rawTotal).replace(/[^0-9.]/g, ''));
      if (!isNaN(tNum) && tNum > 0) {
        totalPrice = tNum.toFixed(3);
      }
    }

    // Derive unitPrice from line total if unit price was zero or missing
    if (parseFloat(unitPrice) <= 0 && parseFloat(totalPrice) > 0 && quantity > 0) {
      unitPrice = (parseFloat(totalPrice) / quantity).toFixed(3);
    } else if (parseFloat(totalPrice) <= 0 && parseFloat(unitPrice) > 0) {
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
        const partNo = item.ReqPartNo ||
          item.Req_Part_No ||
          item.RequestedPartNo ||
          item.Requested_Part_No ||
          item.ProcessedPartNo ||
          item.Processed_Part_No ||
          item.PartNo ||
          item.Part_No ||
          item.ItemNo ||
          item.ITEM_NO ||
          item.PartNumber ||
          item.part_no ||
          item.partNo;
        const desc = item.PartDescription ||
          item.Part_Description ||
          item.Description ||
          item.ItemDescription ||
          item.PART_DESC ||
          item.part_desc ||
          item.ItemDesc;
        const qty = item.RQ ??
          item.ReqQty ??
          item.RequestedQty ??
          item.Requested_Quantity ??
          item.RequestedQuantity ??
          item.AQ ??
          item.Quantity ??
          item.Qty ??
          item.QTY ??
          item.ReqQuantity ??
          item.OrderQty ??
          item.quantity ??
          item.qty;
        const price = item.UnitPrice ??
          item.Unit_Price ??
          item.unit_price ??
          item.DNetPrice ??
          item.DNet_Price ??
          item.DNet ??
          item.dnet ??
          item.SellingPrice ??
          item.Selling_Price ??
          item.NetPrice ??
          item.Net_Price ??
          item.QuotationPrice ??
          item.Quotation_Price ??
          item.SalesPrice ??
          item.Sales_Price ??
          item.Price ??
          item.price ??
          item.Rate ??
          item.ListPrice ??
          item.List_Price;
        const total = item.PriceAmount ??
          item.Price_Amount ??
          item.Total_Price ??
          item.TotalPrice ??
          item.total_price ??
          item.Amount ??
          item.TotalAmount ??
          item.Total_Amount ??
          item.ExtPrice ??
          item.ExtendedPrice ??
          item.SellingTotal;
        const uom = item.Unit || item.UOM || item.UnitOfMeasure;

        if (partNo) {
          addItem(partNo, desc, qty, price, total, uom);
        }
      });
    }
  } catch {
    // Not valid root JSON, continue to regex/HTML
  }

  if (parts.length > 0 && parts.every((p) => parseFloat(p.unit_price) > 0)) return parts;

  // 2. Check for embedded JSON in script tags (Kendo Grid dataSource: [{"RequestedPartNo": ...}])
  const jsonArrayMatches = String(text).match(/\[\s*\{[^{}]*(?:"ReqPartNo"|"ProcessedPartNo"|"RequestedPartNo"|"PartNo"|"PartNumber")[^{}]*\}\s*\]/gi) || [];
  for (const arrStr of jsonArrayMatches) {
    try {
      const arr = JSON.parse(arrStr);
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          const partNo = item.ReqPartNo || item.ProcessedPartNo || item.RequestedPartNo || item.PartNo || item.ItemNo || item.part_no;
          const desc = item.PartDescription || item.Description || item.ItemDescription || item.PART_DESC;
          const qty = item.RQ ?? item.ReqQty ?? item.Requested_Quantity ?? item.RequestedQuantity ?? item.AQ ?? item.Quantity ?? item.Qty ?? item.quantity;
          const price = item.UnitPrice ??
            item.Unit_Price ??
            item.unit_price ??
            item.DNetPrice ??
            item.DNet_Price ??
            item.DNet ??
            item.SellingPrice ??
            item.Selling_Price ??
            item.NetPrice ??
            item.Net_Price ??
            item.QuotationPrice ??
            item.Price ??
            item.price;
          const total = item.PriceAmount ?? item.Price_Amount ?? item.Total_Price ?? item.TotalPrice ?? item.Amount ?? item.total_price;
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

  if (parts.length > 0 && parts.every((p) => parseFloat(p.unit_price) > 0)) return parts;

  // 3. Parse HTML table rows (<tr><td>...</td></tr>)
  const trMatches = String(text).match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  // Check if there is a header row with column names
  let headerColMap = null;
  for (const tr of trMatches) {
    const rawThMatches = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    const cleanThs = rawThMatches.map((th) => th.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().toLowerCase());
    if (cleanThs.some((h) => h.includes('part') || h.includes('item') || h.includes('desc') || h.includes('dnet') || h === 'rq' || h === 'aq')) {
      headerColMap = {
        partIdx: -1,
        descIdx: -1,
        qtyIdx: -1,
        priceIdx: -1,
        totalIdx: -1,
        weightIdx: -1,
      };
      cleanThs.forEach((h, idx) => {
        if (/^(?:req\s*part\s*no|processed\s*part\s*no|part\s*(?:no|number)|item\s*(?:no|code))$/i.test(h) && headerColMap.partIdx === -1) headerColMap.partIdx = idx;
        else if (/part\s*(?:no|number)|item\s*(?:no|code)/i.test(h) && headerColMap.partIdx === -1) headerColMap.partIdx = idx;
        else if (/part\s*desc|description/i.test(h) && headerColMap.descIdx === -1) headerColMap.descIdx = idx;
        else if (/^(?:rq|aq|qty|quantity|req(?:uested)?\s*qty|order\s*qty)$/i.test(h) && headerColMap.qtyIdx === -1) headerColMap.qtyIdx = idx;
        else if (/^(?:unit\s*price|dnet(?:\s*price)?|selling\s*price|quotation\s*price|sales\s*price|price)$/i.test(h) && !h.includes('total') && !h.includes('amount') && headerColMap.priceIdx === -1) headerColMap.priceIdx = idx;
        else if (/^(?:price\s*amount|total|total\s*price|total\s*amount|ext(?:ended)?\s*price|amount|selling\s*total)$/i.test(h) && headerColMap.totalIdx === -1) headerColMap.totalIdx = idx;
        else if (/weight/i.test(h) && headerColMap.weightIdx === -1) headerColMap.weightIdx = idx;
      });
      break;
    }
  }

  for (const tr of trMatches) {
    const rawTdMatches = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    // Ignore hidden cells (e.g. style="display: none")
    const tdMatches = rawTdMatches.filter((td) => !/display\s*:\s*none/i.test(td));
    if (tdMatches.length >= 3) {
      const cleanTds = tdMatches.map((td) => {
        const inputMatch = td.match(/<input[^>]*value=["']([^"']*)["']/i);
        if (inputMatch && inputMatch[1] && inputMatch[1].trim() !== '') {
          return inputMatch[1].trim();
        }
        return td.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      });

      // If headers were found, use headerColMap
      if (headerColMap && headerColMap.partIdx !== -1 && cleanTds[headerColMap.partIdx]) {
        const partNo = cleanTds[headerColMap.partIdx];
        if (
          partNo &&
          /^[A-Z0-9]{2,6}(?:-[A-Z0-9]{2,6}){1,3}$/i.test(partNo) &&
          !partNo.toLowerCase().includes('date') &&
          !seenParts.has(partNo)
        ) {
          const desc = (headerColMap.descIdx !== -1 ? cleanTds[headerColMap.descIdx] : '') || 'PARTS';
          const rawQty = headerColMap.qtyIdx !== -1 ? cleanTds[headerColMap.qtyIdx] : 1;
          const rawPrice = headerColMap.priceIdx !== -1 ? cleanTds[headerColMap.priceIdx] : '0.000';
          const rawTotal = headerColMap.totalIdx !== -1 ? cleanTds[headerColMap.totalIdx] : '0.000';
          addItem(partNo, desc, rawQty, rawPrice, rawTotal, 'EA');
          continue;
        }
      }

      // Fallback: row scanning without headers
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

            // Strip currency words (USD, KWD, EUR, $, etc.) and commas
            const numClean = trimmed.replace(/(?:USD|KWD|EUR|GBP|SAR|AED|\$|,)/gi, '').trim();
            if (/^-?\d+(?:\.\d+)?$/.test(numClean)) {
              numericCells.push(parseFloat(numClean));
              continue;
            }

            if (
              desc === 'PARTS' &&
              /[a-zA-Z]/.test(trimmed) &&
              !/^(?:USD|KWD|EUR|EA|PC)$/i.test(trimmed) &&
              !/^[A-Z0-9]{2,6}(?:-[A-Z0-9]{2,6}){1,3}$/i.test(trimmed) &&
              trimmed.length >= 2
            ) {
              desc = trimmed;
            }
          }

          const qty = numericCells.length > 0 && numericCells[0] > 0 ? numericCells[0] : 1;
          let unitPrice = '0.000';
          let totalPrice = '0.000';

          if (numericCells.length >= 2) {
            let matched = false;
            for (let uIdx = 1; uIdx < numericCells.length; uIdx++) {
              const candU = numericCells[uIdx];
              if (candU <= 0) continue;
              for (let tIdx = uIdx + 1; tIdx < numericCells.length; tIdx++) {
                const candT = numericCells[tIdx];
                if (candT <= 0) continue;
                if (Math.abs(qty * candU - candT) < 0.05) {
                  unitPrice = candU.toFixed(3);
                  totalPrice = candT.toFixed(3);
                  matched = true;
                  break;
                }
              }
              if (matched) break;
            }

            // If no pair matched, check if numericCells[1] is a valid price and not an obvious gram weight
            if (!matched && numericCells.length >= 2) {
              const candU = numericCells[1];
              // Avoid taking weight (gm) as price: weights are large integers
              if (candU > 0 && (candU < 500 || candU % 1 !== 0)) {
                unitPrice = candU.toFixed(3);
                totalPrice = (qty * candU).toFixed(3);
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

  // Pre-extract from Index page as base items (never return early; always query Search API)
  let parts = extractPartsFromText(initHtml, cleanQtn);

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
    const searchParts = extractPartsFromText(rawText, cleanQtn);
    if (searchParts.length > 0) {
      if (parts.length === 0) {
        parts = searchParts;
      } else {
        // Merge searchParts prices into parts
        const priceMap = new Map(searchParts.map((sp) => [sp.part_no, sp]));
        parts = parts.map((p) => {
          const match = priceMap.get(p.part_no);
          if (match && parseFloat(match.unit_price) > 0) {
            return {
              ...p,
              unit_price: match.unit_price,
              total_price: match.total_price || (p.quantity * parseFloat(match.unit_price)).toFixed(3),
            };
          }
          return p;
        });
      }
    }
  } catch (err) {
    console.warn(`[getQuotationParts] QuotationDetails/Search payload 1 warning: ${err.message}`);
  }

  // STEP 3: Fallback Payload 2 (exact python pdx_core signature: { qtno, subqtno, DBCode })
  if (parts.length === 0 || parts.some((p) => parseFloat(p.unit_price) <= 0)) {
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
      const searchParts2 = extractPartsFromText(rawText2, cleanQtn);
      if (searchParts2.length > 0) {
        if (parts.length === 0) {
          parts = searchParts2;
        } else {
          const priceMap = new Map(searchParts2.map((sp) => [sp.part_no, sp]));
          parts = parts.map((p) => {
            const match = priceMap.get(p.part_no);
            if (match && parseFloat(match.unit_price) > 0) {
              return {
                ...p,
                unit_price: match.unit_price,
                total_price: match.total_price || (p.quantity * parseFloat(match.unit_price)).toFixed(3),
              };
            }
            return p;
          });
        }
      }
    } catch (err) {
      console.warn(`[getQuotationParts] QuotationDetails/Search payload 2 warning: ${err.message}`);
    }
  }

  // STEP 4: Cross-reference with Part Master to validate prices and guard against weight injection
  if (parts.length > 0) {
    try {
      const { lookupPartMaster } = require('./komatsuEoService');
      for (const p of parts) {
        let master = null;
        try {
          master = await lookupPartMaster(p.part_no, cookieStr);
        } catch {
          // Non-blocking lookup
        }

        if (master) {
          const masterPrice = parseFloat(master.price || '0');
          const masterWeight = parseFloat(master.weight || '0');
          const curPrice = parseFloat(p.unit_price || '0');

          // If price is missing/zero OR if it was mistakenly set to the item's weight in grams (e.g. 860g)
          if (curPrice <= 0 || (masterWeight > 0 && Math.abs(curPrice - masterWeight) < 0.001)) {
            if (masterPrice > 0) {
              p.unit_price = masterPrice.toFixed(3);
              p.total_price = (p.quantity * masterPrice).toFixed(3);
            }
          }

          if ((!p.description || p.description === 'PARTS') && master.description) {
            p.description = master.description;
          }
        }
      }
    } catch (err) {
      console.warn(`[getQuotationParts] Part Master validation warning: ${err.message}`);
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
