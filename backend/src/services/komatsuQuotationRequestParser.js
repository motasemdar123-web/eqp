const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const ExcelJS = require('exceljs');
const { PDFParse } = require('pdf-parse');

// Comprehensive Komatsu & Heavy Equipment Part Number Regex
// Matches:
// - Standard 3-2-5: 195-13-12711, 17M-22-43430, 562-13-11770, 714-23-15501
// - Standard 5-5: 07000-72095, 04065-07225, 07005-01612, 06040-06219
// - Standard 4-2-4 / 4-2-5: 6742-01-4540, 6732-71-6120, 6150-12-1000
// - Standard 3-3-4: 600-319-3750, 600-185-4100
// - Alphanumeric standard: 2A8-62-12230, 20Y-26-22230, ND012028-5380, YM129900-51100
// - Dotted: 195.13.12711, 07000.72095, 6742.01.4540
// Note: Slashes (/) are intentionally NOT allowed to avoid matching dates (09/24/2026) or locations (440/25/094)
const KOMATSU_PART_REGEX = /\b([0-9A-Z]{2,8}[-.][0-9A-Z]{2,4}[-.][0-9A-Z]{4,5}|[0-9A-Z]{4,8}[-.][0-9A-Z]{4,6}|[0-9A-Z]{3,4}[-.][0-9A-Z]{3,4}[-.][0-9A-Z]{3,4})\b/i;
const CONTINUOUS_DIGITS_PART_REGEX = /\b([0-9]{10})\b/;

// Quantity unit regex (EACH, EA, PC, PCS, SET, SETS, UNIT, UNITS, NOS, MTR, PKG, etc.)
const QTY_UNIT_REGEX = /(\d+(?:\.\d+)?)\s*(?:EACH|EA|PC|PCS|SET|SETS|UNIT|UNITS|NOS|MTR|PKG)\b/i;

// Comprehensive noise lines regex to filter out page headers, footers, addresses, metadata
const NOISE_LINE_REGEX = /^(?:Page:?\s*\d+|--\s*\d+\s+of\s+\d+\s*--|\d+\s+of\s+\d+|-\s*\d+\s*-|La[’']?\s*Ala|Lalaa|MUBARAK AL-KABEER|KUWAIT|SOUK AL-|OFFICE-|BLOCK\s*\(\d+\)|BUILDING|BLDG|FLOOR|STREET|ROAD|AVENUE|P\.?O\.?\s*BOX|INFO@|SALES@|\+965|\b\d{8}\b|MR\s*No:|Technician:|Equipment|Delivery Date|Delivery:|WH\/INT|By:|NO\s+PRODUCT|INTERNAL\s+REF|ORDERED\s+FREE|REF\.?\s+LOCATION|LOCATION\s+ORDERED|APPROVED\s+BY|PREPARED\s+BY|CHECKED\s+BY|AUTHORIZED|SIGNATURE|STAMP|Chassis(?:\s*No)?|Serial(?:\s*No)?|S\/N|Plate(?:\s*No)?|GRN(?:\s*No)?|Project(?:\s*Code)?|Category:|Department:|File\s*No:|Easy\s*Build|Workshop|Customer:|Client:|Company:|Date:|\d{1,2}\/\d{1,2}\/\d{2,4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i;

/**
 * Check if a string looks like a calendar date rather than a part number
 */
function isDateString(str) {
  if (!str) return false;
  const clean = str.trim();
  // e.g. 09/24/2026, 2026-09-24, 24-09-2026, 09-24-2026
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(clean)) {
    const parts = clean.split(/[-/.]/).map(Number);
    const hasYear = parts.some((p) => p >= 1970 && p <= 2099);
    if (hasYear) return true;
  }
  return false;
}

/**
 * Safely extract string content from an Excel cell value
 * Handles strings, numbers, formula result objects, richText objects, hyperlinks
 */
function extractCellValueString(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean' || val instanceof Date) return '';

  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) {
      return extractCellValueString(val.result);
    }
    if (Array.isArray(val.richText)) {
      return val.richText.map((rt) => rt.text || '').join('').trim();
    }
    if (val.text !== undefined && val.text !== null) {
      return extractCellValueString(val.text);
    }
  }

  return String(val).trim();
}

/**
 * Safely extract numeric quantity from an Excel cell value
 */
function extractCellValueNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : Math.round(val);

  if (typeof val === 'object' && val.result !== undefined && val.result !== null) {
    return extractCellValueNumber(val.result);
  }

  const str = extractCellValueString(val);
  if (!str) return null;

  // Check unit e.g. "5 PCS" or "1.00 EACH"
  const unitMatch = str.match(QTY_UNIT_REGEX);
  if (unitMatch && unitMatch[1]) {
    const num = Math.round(parseFloat(unitMatch[1]));
    return num > 0 ? num : null;
  }

  const numMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (numMatch) {
    const num = Math.round(parseFloat(numMatch[1]));
    return num > 0 ? num : null;
  }

  return null;
}

/**
 * Format continuous 10-digit part number or dotted part numbers into standard Komatsu hyphenated format
 * Examples:
 * - 1951312711 -> 195-13-12711
 * - 0700072095 -> 07000-72095 (Hardware 5-5)
 * - 6742014540 -> 6742-01-4540 (Engine 4-2-4)
 * - 6003193750 -> 600-319-3750 (Filter/Cooling 3-3-4)
 * - 195.13.12711 -> 195-13-12711
 */
function normalizePartNumber(pNo) {
  if (!pNo) return '';
  let clean = String(pNo).trim().toUpperCase();
  clean = clean.replace(/^[([{<"']+|[)\]}>"']+$/g, '');

  if (isDateString(clean)) return '';

  // Dotted formats: replace separators with standard hyphens
  if (
    /^[0-9A-Z]{2,8}\.[0-9A-Z]{2,4}\.[0-9A-Z]{4,5}$/.test(clean) ||
    /^[0-9A-Z]{4,8}\.[0-9A-Z]{4,6}$/.test(clean) ||
    /^[0-9A-Z]{3,4}\.[0-9A-Z]{3,4}\.[0-9A-Z]{3,4}$/.test(clean)
  ) {
    return clean.replace(/\./g, '-');
  }

  // Continuous 10 digits
  if (/^\d{10}$/.test(clean)) {
    // 0-prefix: standard hardware 5-5 (e.g. 07000-72095, 04065-07225, 06040-06219)
    if (clean.startsWith('0')) {
      return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    // 61-68 series engine parts: 4-2-4 (e.g. 6742-01-4540, 6732-71-6120)
    if (/^6[12357]/.test(clean)) {
      return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6)}`;
    }
    // 600 series filter/cooling parts: 3-3-4 (e.g. 600-319-3750)
    if (clean.startsWith('600')) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    // Standard chassis 3-2-5 (e.g. 195-13-12711, 562-13-11770, 714-23-15501)
    return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
  }

  return clean;
}

/**
 * Check whether a line represents header/footer/metadata noise
 */
function isNoiseLine(line) {
  if (!line || typeof line !== 'string') return true;
  const trimmed = line.trim();
  if (!trimmed) return true;

  if (NOISE_LINE_REGEX.test(trimmed)) return true;
  if (/^[-=_*~]{3,}$/.test(trimmed)) return true;
  if (/^Page\s*\d+\s*(?:of|\/)\s*\d+$/i.test(trimmed)) return true;
  if (/^--\s*\d+\s*(?:of|\/)\s*\d+\s*--$/i.test(trimmed)) return true;
  if (isDateString(trimmed)) return true;

  return false;
}

/**
 * Extract document metadata (Customer, Quotation/MR No, Equipment Model, Serial No, Type)
 */
function extractMetadataFromText(text, fileName = '') {
  const metadata = {
    customer: '',
    customerMode: 'OTHER',
    quotationNo: '',
    equipmentModel: '',
    equipmentType: '',
    serialNo: '',
    detectedSource: fileName,
  };

  if (!text) return metadata;

  // 1. Quotation / MR Reference Number
  const mrMatch = text.match(/(?:MR|RFQ|PR|Requisition|Quotation|Quote|Inquiry|Enquiry|Tender|Ref)\s*(?:No|Number|Ref|Reference)?[:#\s]+([A-Z0-9_/-]+)/i);
  if (mrMatch) {
    metadata.quotationNo = mrMatch[1].trim();
  } else if (/MR-\d+/i.test(fileName)) {
    const fnMatch = fileName.match(/(MR-\d+)/i);
    if (fnMatch) metadata.quotationNo = fnMatch[1];
  }

  // 2. Equipment Model
  const modelMatch = text.match(/(?:Equipment\s*Model|Machine\s*Model|Model)[:\s]+([^\r\n,]+)/i);
  if (modelMatch) {
    const rawModel = modelMatch[1].trim();
    // Clean prefix like 'KOMATSU-' or 'KOMATSU '
    metadata.equipmentModel = rawModel.replace(/^(?:KOMATSU\s*[-:]?\s*)+/i, '').replace(/^[-\s]+/, '');
  }

  // 3. Equipment Type
  const typeMatch = text.match(/(?:Equipment\s*Type|Machine\s*Type|Type)[:\s]+([^\r\n,]+)/i);
  if (typeMatch) {
    metadata.equipmentType = typeMatch[1].trim();
  }

  // 4. Equipment Serial / Chassis Number
  const serialMatch = text.match(/(?:Serial\s*(?:No|Number)?|S\/N|Chassis\s*(?:No|Number)?|VIN)[:\s]+([A-Z0-9_-]+)/i);
  if (serialMatch && serialMatch[1]) {
    metadata.serialNo = serialMatch[1].trim();
  }

  // 5. Customer Identification
  if (/(?:La[’']?\s*Ala|Lalaa)/i.test(text) || /(?:La[’']?\s*Ala|Lalaa)/i.test(fileName)) {
    metadata.customer = 'Lalaa';
    metadata.customerMode = 'LALAA';
  } else if (/Boodai/i.test(text)) {
    metadata.customer = 'Boodai';
    metadata.customerMode = 'OTHER';
  } else if (/Al[\s-]?Ghanim/i.test(text)) {
    metadata.customer = 'Alghanim';
    metadata.customerMode = 'OTHER';
  } else if (/\bKOC\b|Kuwait Oil/i.test(text)) {
    metadata.customer = 'KOC';
    metadata.customerMode = 'OTHER';
  } else if (/\bKNPC\b/i.test(text)) {
    metadata.customer = 'KNPC';
    metadata.customerMode = 'OTHER';
  } else {
    // Try to find "Customer:" or "Company:" or "Client:"
    const custMatch = text.match(/(?:Customer|Client|Company|To)\s*[:]\s*([^\r\n,]+)/i);
    if (custMatch && custMatch[1]) {
      metadata.customer = custMatch[1].trim();
      metadata.customerMode = metadata.customer.toLowerCase().includes('lalaa') ? 'LALAA' : 'OTHER';
    }
  }

  return metadata;
}

/**
 * Extract single item row details (part number, description, quantity) from a stitched text line
 */
function parseItemFromTextLine(line) {
  if (!line || typeof line !== 'string') return null;

  const trimmed = line.trim();
  if (!trimmed || isNoiseLine(trimmed)) return null;

  // 1. Check for pipe-delimited Markdown/ASCII table format: | 1 | 195-13-12711 | SEAL RING | 4 |
  if (trimmed.includes('|')) {
    const pipeTokens = trimmed
      .split('|')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !/^[-=_+]+$/.test(t));

    let partIdx = -1;
    let foundPart = '';

    for (let i = 0; i < pipeTokens.length; i++) {
      const tok = pipeTokens[i];
      if (isDateString(tok)) continue;
      const match = tok.match(KOMATSU_PART_REGEX) || tok.match(CONTINUOUS_DIGITS_PART_REGEX);
      if (match) {
        const normalized = normalizePartNumber(match[1]);
        if (normalized && !isDateString(normalized)) {
          foundPart = normalized;
          partIdx = i;
          break;
        }
      }
    }

    if (foundPart && partIdx !== -1) {
      let foundQty = 1;
      let foundDesc = '';

      // First check for explicit quantity with unit in tokens
      for (let i = 0; i < pipeTokens.length; i++) {
        if (i === partIdx) continue;
        const uMatch = pipeTokens[i].match(QTY_UNIT_REGEX);
        if (uMatch && uMatch[1]) {
          foundQty = Math.round(parseFloat(uMatch[1]));
          break;
        }
      }

      // If no unit quantity, inspect tokens strictly after part index for numeric quantity
      if (foundQty === 1) {
        for (let i = partIdx + 1; i < pipeTokens.length; i++) {
          const numMatch = pipeTokens[i].match(/^(\d+(?:\.\d+)?)$/);
          if (numMatch) {
            const parsed = Math.round(parseFloat(numMatch[1]));
            if (parsed > 0 && parsed < 100000) {
              foundQty = parsed;
              break;
            }
          }
        }
      }

      // Description token: token other than part or quantity or leading row index
      for (let i = 0; i < pipeTokens.length; i++) {
        if (i === partIdx) continue;
        const tok = pipeTokens[i];
        if (
          !foundDesc &&
          !/^\d+$/.test(tok) &&
          tok.length > 1 &&
          !/^(?:EACH|EA|PC|PCS|SET|UNIT|NOS|MTR|PKG)\b/i.test(tok)
        ) {
          foundDesc = tok
            .replace(/\b\d+(?:\.\d+)?\s*(?:EACH|EA|PC|PCS|SET|UNIT)\b/i, '')
            .trim()
            .toUpperCase();
        }
      }

      return {
        part_no: foundPart,
        description: foundDesc || 'KOMATSU COMPONENT',
        quantity: foundQty,
        raw_line: trimmed,
      };
    }
  }

  // 2. Standard Part Number Detection
  let partMatch = trimmed.match(KOMATSU_PART_REGEX);
  let pNo = '';

  if (partMatch) {
    const candidate = normalizePartNumber(partMatch[1]);
    if (!isDateString(candidate)) {
      pNo = candidate;
    }
  }

  if (!pNo) {
    const digitMatch = trimmed.match(CONTINUOUS_DIGITS_PART_REGEX);
    if (digitMatch) {
      const candidate = normalizePartNumber(digitMatch[1]);
      if (!isDateString(candidate)) {
        pNo = candidate;
        partMatch = digitMatch;
      }
    }
  }

  if (!pNo) return null;

  // 3. Extract quantity:
  let quantity = 1;
  const qtyUnitMatch = trimmed.match(QTY_UNIT_REGEX);

  if (qtyUnitMatch && qtyUnitMatch[1]) {
    const parsed = Math.round(parseFloat(qtyUnitMatch[1]));
    if (parsed > 0 && parsed < 100000) {
      quantity = parsed;
    }
  } else {
    // Check labeled quantity e.g. "Qty: 5", "Quantity: 10"
    const labeledMatch = trimmed.match(/(?:qty|quantity|ordered)[:\s]+(\d+(?:\.\d+)?)/i);
    if (labeledMatch && labeledMatch[1]) {
      const parsed = Math.round(parseFloat(labeledMatch[1]));
      if (parsed > 0 && parsed < 100000) {
        quantity = parsed;
      }
    } else {
      // Check trailing number: e.g. "17M-15-05110 TRANSMISSION SERVICE KIT 5"
      const trailingNumMatch = trimmed.match(/\s+(\d+(?:\.\d+)?)\s*$/);
      if (trailingNumMatch && trailingNumMatch[1]) {
        const parsed = Math.round(parseFloat(trailingNumMatch[1]));
        if (parsed > 0 && parsed < 100000) {
          quantity = parsed;
        }
      } else {
        // Columnar number scan
        const tokens = trimmed.split(/[\t\s]{2,}|,/);
        for (let i = tokens.length - 1; i >= 0; i--) {
          const tok = tokens[i].trim();
          if (tok.includes('/') || tok.includes('-')) continue;
          if (/^\d+(?:\.\d+)?$/.test(tok)) {
            const num = Math.round(parseFloat(tok));
            if (num > 0 && num < 100000) {
              quantity = num;
              break;
            }
          }
        }
      }
    }
  }

  // 4. Extract description:
  let description = '';
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1].trim()) {
    description = parenMatch[1].trim().toUpperCase();
  } else {
    // Text after part number before quantity and stock columns
    const partIdx = trimmed.indexOf(partMatch[0]);
    if (partIdx !== -1) {
      let afterPart = trimmed.substring(partIdx + partMatch[0].length).trim();
      afterPart = afterPart.replace(/^[-\t, :|]+/, '');

      // Check if separated by tabs or multiple spaces
      const segTokens = afterPart.split(/\t|\s{2,}/);
      let descCandidate = segTokens[0] || '';

      // Strip trailing quantity or unit
      descCandidate = descCandidate
        .replace(/\b\d+(?:\.\d+)?\s*(?:EACH|EA|PC|PCS|SET|SETS|UNIT|UNITS|NOS|MTR|PKG)\b/i, '')
        .replace(/\s+\d+(?:\.\d+)?$/g, '')
        .trim();

      if (
        descCandidate &&
        descCandidate.length >= 2 &&
        !/^\d+/.test(descCandidate) &&
        !/^(?:EACH|EA|PC|PCS|SET|UNIT|MTR|PKG)\b/i.test(descCandidate)
      ) {
        description = descCandidate.trim().toUpperCase();
      }
    }
  }

  return {
    part_no: pNo,
    description: description || 'KOMATSU COMPONENT',
    quantity: quantity > 0 ? quantity : 1,
    raw_line: trimmed,
  };
}

/**
 * Check if an active row has completed its parsing and does not need continuation
 */
function isRowComplete(rowText) {
  if (!rowText) return false;
  // If row has open parenthesis without closing parenthesis: still needs continuation
  const openParens = (rowText.match(/\(/g) || []).length;
  const closeParens = (rowText.match(/\)/g) || []).length;
  if (openParens > closeParens) return false;

  // Has valid part and quantity unit or stock location
  const hasPart = KOMATSU_PART_REGEX.test(rowText) || CONTINUOUS_DIGITS_PART_REGEX.test(rowText);
  const hasQtyUnit = QTY_UNIT_REGEX.test(rowText);

  return hasPart && hasQtyUnit;
}

/**
 * Stitch multi-line PDF text rows together when descriptions or columns wrap across lines
 * Filters out address headers, page numbers, and table footer noise
 */
function stitchTextRows(rawLines) {
  const stitched = [];
  let currentRow = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = String(rawLines[i] || '').trim();
    if (!line) continue;

    // Discard noise lines (page headers/footers, repeated column titles, company addresses)
    if (isNoiseLine(line)) {
      continue;
    }

    const hasPart = KOMATSU_PART_REGEX.test(line) || CONTINUOUS_DIGITS_PART_REGEX.test(line);

    if (hasPart) {
      if (currentRow) {
        stitched.push(currentRow);
      }
      currentRow = line;
    } else if (currentRow) {
      // Only continue stitching if current row is not already complete
      if (!isRowComplete(currentRow)) {
        currentRow += ' ' + line;
      }
    }
  }

  if (currentRow) {
    stitched.push(currentRow);
  }

  return stitched;
}

/**
 * Extract PDF text with pdf-parse v2, with PyMuPDF fallback
 */
async function extractTextFromPdfBuffer(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      const text = parsed.text || '';
      const pageCount = Array.isArray(parsed.pages) ? parsed.pages.length : 1;
      return { text, pageCount };
    } finally {
      await parser.destroy();
    }
  } catch (err) {
    // Fallback: PyMuPDF via python if available
    try {
      const tmpPath = path.join(os.tmpdir(), `quotation-${Date.now()}-${Math.random().toString(36).substr(2, 6)}.pdf`);
      fs.writeFileSync(tmpPath, buffer);
      try {
        const pyScript = 'import fitz, sys, json; doc = fitz.open(sys.argv[1]); pages = [page.get_text() for page in doc]; print(json.dumps({"text": "\\n".join(pages), "pageCount": len(pages)}))';
        const stdout = execFileSync('python', ['-c', pyScript, tmpPath], { encoding: 'utf8', timeout: 15000 });
        const parsedPy = JSON.parse(stdout);
        return { text: parsedPy.text, pageCount: parsedPy.pageCount };
      } finally {
        try { fs.unlinkSync(tmpPath); } catch {}
      }
    } catch (pyErr) {
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }
  }
}

/**
 * Parse PDF Quotation Request
 */
async function parsePdfQuotationRequest(buffer, fileName = '') {
  const { text, pageCount } = await extractTextFromPdfBuffer(buffer);

  const metadata = extractMetadataFromText(text, fileName);
  metadata.pageCount = pageCount;

  const rawLines = text.split(/\r?\n/);
  const stitchedRows = stitchTextRows(rawLines);

  const items = [];
  stitchedRows.forEach((row, idx) => {
    const item = parseItemFromTextLine(row);
    if (item && item.part_no && !isDateString(item.part_no)) {
      items.push({
        itemIndex: idx + 1,
        part_no: item.part_no,
        description: item.description,
        quantity: item.quantity,
        raw_line: item.raw_line,
      });
    }
  });

  return {
    success: true,
    fileName,
    metadata,
    items,
    summary: {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, it) => sum + (it.quantity || 1), 0),
    },
  };
}

/**
 * Check if a cell header matches part number column
 */
function isPartColumnHeader(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return (
    /^(?:part\s*(?:no|number|#)?|p\/?n|material\s*(?:no|number|code)?|item\s*code|product\s*(?:no|code)?|article|parts)$/i.test(clean) ||
    /^(?:part\s*no|part\s*#|p\/n|p\.n\b|item\s*code|material\s*no)/i.test(clean)
  );
}

/**
 * Check if a cell header matches description column
 */
function isDescriptionColumnHeader(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return (
    /^(?:part\s*)?description|item\s*description|desc\b|product\s*(?:name|description)|goods\s*description|material\s*description|specification|details/i.test(clean)
  );
}

/**
 * Check if a cell header matches quantity column
 */
function isQuantityColumnHeader(text) {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return (
    /^(?:order(?:ed)?\s*)?quantity|qty\b|req(?:uired)?\s*qty|order\s*qty|pcs\b|pieces\b|count\b/i.test(clean)
  );
}

/**
 * Parse Excel Quotation Request (.xlsx or .xls)
 */
async function parseExcelQuotationRequest(buffer, fileName = '') {
  let workbook;
  try {
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
  } catch (excelErr) {
    // If not a valid zip .xlsx (e.g. CSV or HTML table named .xls), fall back to text parser
    const asText = buffer.toString('utf8');
    if (asText.includes(',') || asText.includes('\t') || asText.includes('<table')) {
      return parseTextQuotationRequest(asText, fileName);
    }
    throw new Error(`Unable to read Excel workbook: ${excelErr.message}`);
  }

  let detectedCustomer = '';
  let detectedMrNo = '';
  let detectedModel = '';
  let detectedSerial = '';

  const items = [];

  workbook.eachSheet((worksheet) => {
    let partColIdx = -1;
    let descColIdx = -1;
    let qtyColIdx = -1;
    let headerRowIdx = -1;

    // 1. Scan rows to locate header columns or metadata
    const maxHeaderScan = Math.min(30, worksheet.rowCount);
    for (let r = 1; r <= maxHeaderScan; r++) {
      const row = worksheet.getRow(r);
      const values = row.values;
      if (!Array.isArray(values) || values.length <= 1) continue;

      const rowStr = values.map((v) => extractCellValueString(v)).join(' ');

      // Metadata check in title rows
      if (!detectedMrNo) {
        const mrMatch = rowStr.match(/(?:MR|RFQ|PR|Requisition|Quotation)\s*(?:No|Number|Ref|Reference)?[:#\s]+([A-Z0-9_/-]+)/i);
        if (mrMatch) detectedMrNo = mrMatch[1].trim();
      }
      if (!detectedCustomer) {
        if (/(?:La[’']?\s*Ala|Lalaa)/i.test(rowStr)) {
          detectedCustomer = 'Lalaa';
        } else {
          const custMatch = rowStr.match(/(?:Customer|Client|Company|To)[:\s]+([^\r\n,]+)/i);
          if (custMatch && custMatch[1]) detectedCustomer = custMatch[1].trim();
        }
      }
      if (!detectedModel) {
        const mMatch = rowStr.match(/(?:Model|Equipment)[:\s]+([^\r\n,]+)/i);
        if (mMatch) detectedModel = mMatch[1].trim().replace(/^(?:KOMATSU\s*[-:]?\s*)+/i, '');
      }
      if (!detectedSerial) {
        const sMatch = rowStr.match(/(?:Serial\s*(?:No)?|S\/N|Chassis)[:\s]+([A-Z0-9_-]+)/i);
        if (sMatch) detectedSerial = sMatch[1].trim();
      }

      // Check for table header row
      let pIdx = -1;
      let dIdx = -1;
      let qIdx = -1;

      for (let c = 1; c < values.length; c++) {
        const cellText = extractCellValueString(values[c]);
        if (isPartColumnHeader(cellText) && pIdx === -1) {
          pIdx = c;
        } else if (isDescriptionColumnHeader(cellText) && dIdx === -1) {
          dIdx = c;
        } else if (isQuantityColumnHeader(cellText) && qIdx === -1) {
          qIdx = c;
        }
      }

      if (pIdx !== -1) {
        partColIdx = pIdx;
        descColIdx = dIdx;
        qtyColIdx = qIdx;
        headerRowIdx = r;
        break;
      }
    }

    // 2. Iterate data rows
    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;
    for (let r = startRow; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      const values = row.values;
      if (!Array.isArray(values) || values.length <= 1) continue;

      let partNo = '';
      let desc = '';
      let qty = 1;

      if (partColIdx !== -1) {
        const rawCell = values[partColIdx];
        const cellVal = extractCellValueString(rawCell);
        const match = cellVal.match(KOMATSU_PART_REGEX) || cellVal.match(CONTINUOUS_DIGITS_PART_REGEX);
        if (match) {
          const cand = normalizePartNumber(match[1]);
          if (!isDateString(cand)) {
            partNo = cand;
            const parenMatch = cellVal.match(/\(([^)]+)\)/);
            if (parenMatch) desc = parenMatch[1].trim();
          }
        }

        if (descColIdx !== -1 && !desc) {
          desc = extractCellValueString(values[descColIdx]);
        }

        if (qtyColIdx !== -1) {
          const parsedQty = extractCellValueNumber(values[qtyColIdx]);
          if (parsedQty !== null && parsedQty > 0) qty = parsedQty;
        }
      } else {
        // Fallback: search cells in row directly
        for (let c = 1; c < values.length; c++) {
          const cellStr = extractCellValueString(values[c]);
          const match = cellStr.match(KOMATSU_PART_REGEX) || cellStr.match(CONTINUOUS_DIGITS_PART_REGEX);
          if (match && !partNo) {
            const cand = normalizePartNumber(match[1]);
            if (!isDateString(cand)) {
              partNo = cand;
              const parenMatch = cellStr.match(/\(([^)]+)\)/);
              if (parenMatch) desc = parenMatch[1].trim();
            }
          } else {
            const num = extractCellValueNumber(values[c]);
            if (num !== null && num > 0 && num < 100000 && qty === 1) {
              qty = num;
            } else if (!desc && cellStr.length > 2 && !/^\d+$/.test(cellStr)) {
              desc = cellStr;
            }
          }
        }
      }

      if (partNo && !isDateString(partNo)) {
        items.push({
          itemIndex: items.length + 1,
          part_no: partNo,
          description: desc || 'KOMATSU COMPONENT',
          quantity: qty > 0 ? qty : 1,
        });
      }
    }
  });

  const isLalaa = /(?:La[’']?\s*Ala|Lalaa)/i.test(detectedCustomer) || /(?:La[’']?\s*Ala|Lalaa)/i.test(fileName);
  const metadata = {
    customer: isLalaa ? 'Lalaa' : detectedCustomer || '',
    customerMode: isLalaa ? 'LALAA' : 'OTHER',
    quotationNo: detectedMrNo || '',
    equipmentModel: detectedModel || '',
    serialNo: detectedSerial || '',
    detectedSource: fileName,
  };

  return {
    success: true,
    fileName,
    metadata,
    items,
    summary: {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, it) => sum + (it.quantity || 1), 0),
    },
  };
}

/**
 * Parse plain text or CSV quotation request
 */
function parseTextQuotationRequest(text, fileName = '') {
  const metadata = extractMetadataFromText(text, fileName);
  const rawLines = text.split(/\r?\n/);
  const stitched = stitchTextRows(rawLines);

  const items = [];
  stitched.forEach((row, idx) => {
    const item = parseItemFromTextLine(row);
    if (item && item.part_no && !isDateString(item.part_no)) {
      items.push({
        itemIndex: idx + 1,
        part_no: item.part_no,
        description: item.description,
        quantity: item.quantity,
        raw_line: item.raw_line,
      });
    }
  });

  return {
    success: true,
    fileName,
    metadata,
    items,
    summary: {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, it) => sum + (it.quantity || 1), 0),
    },
  };
}

/**
 * Universal quotation request parser entrypoint
 */
async function parseQuotationRequest({ buffer, fileName = '', text = '' }) {
  const lowerName = String(fileName || '').toLowerCase();

  if (buffer) {
    if (lowerName.endsWith('.pdf')) {
      return await parsePdfQuotationRequest(buffer, fileName);
    }
    if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
      return await parseExcelQuotationRequest(buffer, fileName);
    }
    // Default buffer interpretation: utf8 text / csv
    return parseTextQuotationRequest(buffer.toString('utf8'), fileName);
  }

  if (text) {
    return parseTextQuotationRequest(text, fileName);
  }

  throw new Error('Either file buffer or text content must be provided.');
}

module.exports = {
  KOMATSU_PART_REGEX,
  normalizePartNumber,
  extractCellValueString,
  extractCellValueNumber,
  extractMetadataFromText,
  parseItemFromTextLine,
  isNoiseLine,
  isRowComplete,
  stitchTextRows,
  parsePdfQuotationRequest,
  parseExcelQuotationRequest,
  parseTextQuotationRequest,
  parseQuotationRequest,
};
