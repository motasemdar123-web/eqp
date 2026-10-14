const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const {
  parseQuotationRequest,
  parsePdfQuotationRequest,
  parseExcelQuotationRequest,
  parseTextQuotationRequest,
  normalizePartNumber,
  parseItemFromTextLine,
  extractMetadataFromText,
  KOMATSU_PART_REGEX,
} = require('../src/services/komatsuQuotationRequestParser');

describe('Komatsu Quotation Request Parser', () => {
  const fixturePdfPath = path.join(__dirname, 'fixtures', 'MR-35211.pdf');

  test('extracts all 60 items and metadata from real MR-35211.pdf fixture without footer leakage', async () => {
    expect(fs.existsSync(fixturePdfPath)).toBe(true);
    const pdfBuffer = fs.readFileSync(fixturePdfPath);

    const result = await parseQuotationRequest({
      buffer: pdfBuffer,
      fileName: 'MR-35211.pdf',
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toBe('MR-35211.pdf');

    // Metadata checks
    expect(result.metadata).toBeDefined();
    expect(result.metadata.quotationNo).toBe('MR-35211');
    expect(result.metadata.customer).toBe('Lalaa');
    expect(result.metadata.customerMode).toBe('LALAA');
    expect(result.metadata.equipmentModel).toContain('D275A');
    expect(result.metadata.equipmentType).toContain('KOMATSU DOZER');
    expect(result.metadata.pageCount).toBe(3);

    // Items count: all 60 items from the 3-page quotation request
    expect(result.items.length).toBe(60);
    expect(result.summary.totalItems).toBe(60);

    // Specific item validations
    const item1 = result.items[0];
    expect(item1.part_no).toBe('195-13-12711');
    expect(item1.description).toBe('SEAL RING');
    expect(item1.quantity).toBe(1);

    const item9 = result.items.find((it) => it.part_no === '07005-01612');
    expect(item9).toBeDefined();
    expect(item9.description).toBe('GASKET');
    expect(item9.quantity).toBe(10);

    const item15 = result.items[14];
    expect(item15.part_no).toBe('17M-22-43430');
    expect(item15.quantity).toBe(1);
    // Boundary check: item 15 should NOT contain page 1 footer or address text
    expect(item15.raw_line).not.toContain('KUWAIT BLDG');
    expect(item15.raw_line).not.toContain('1 of 3');

    const item17 = result.items.find((it) => it.part_no === '17A-22-11170');
    expect(item17).toBeDefined();
    expect(item17.description).toBe('DISC');
    expect(item17.quantity).toBe(14);

    // Multi-line wrapped item 26: TRANSMISSION SERVICE KIT
    const item26 = result.items.find((it) => it.part_no === '17M-15-05110');
    expect(item26).toBeDefined();
    expect(item26.description).toBe('TRANSMISSION SERVICE KIT');
    expect(item26.quantity).toBe(1);

    const item40 = result.items.find((it) => it.part_no === '561-15-32590');
    expect(item40).toBeDefined();
    expect(item40.description).toBe('WASHER');
    expect(item40.quantity).toBe(22);

    const item44 = result.items[43];
    expect(item44.part_no).toBe('17M-15-49290');
    // Boundary check: item 44 should NOT contain page 2 footer text
    expect(item44.raw_line).not.toContain('KUWAIT BLDG');
    expect(item44.raw_line).not.toContain('2 of 3');

    const item54 = result.items.find((it) => it.part_no === '426-15-22740');
    expect(item54).toBeDefined();
    expect(item54.description).toBe('PLATE');
    expect(item54.quantity).toBe(26);

    const item60 = result.items[59];
    expect(item60.part_no).toBe('07000-75165');
    expect(item60.description).toBe('ORING');
    expect(item60.quantity).toBe(1);
    // Boundary check: item 60 should NOT contain page 3 footer text
    expect(item60.raw_line).not.toContain('KUWAIT BLDG');
    expect(item60.raw_line).not.toContain('3 of 3');

    // Total quantity should equal 272
    expect(result.summary.totalQuantity).toBe(272);
  });

  test('parses Excel quotation request spreadsheet with headers, formulas, and rich text', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Quotation Request');

    sheet.addRow(['Customer: Lalaa Real Estate', '', 'MR No: MR-99901', 'Serial No: SN-40501']);
    sheet.addRow(['Model: KOMATSU PC400-8R']);
    sheet.addRow([]);
    sheet.addRow(['Item Code', 'Part Description', 'Quantity', 'Remarks']);
    sheet.addRow(['6742-01-4540', 'CYLINDER HEAD GASKET', 6, 'Urgent']);
    sheet.addRow(['600-319-3750', 'FUEL FILTER CARTRIDGE', 4, 'Stock replenishment']);
    sheet.addRow(['07143-10605 (BUSHING)', '', 10, 'Standard']);
    sheet.addRow(['1951312711', 'SEAL RING', 2, 'Unhyphenated 10 digits']);

    // Formula cell row
    const formulaRow = sheet.addRow();
    formulaRow.getCell(1).value = { formula: 'CONCATENATE("17M-", "15-05110")', result: '17M-15-05110' };
    formulaRow.getCell(2).value = 'SERVICE KIT';
    formulaRow.getCell(3).value = { formula: 'SUM(1,2)', result: 3 };

    // Rich text cell row
    const richRow = sheet.addRow();
    richRow.getCell(1).value = { richText: [{ text: '07000-' }, { text: '72095' }] };
    richRow.getCell(2).value = 'O RING';
    richRow.getCell(3).value = 5;

    const buffer = await workbook.xlsx.writeBuffer();

    const result = await parseQuotationRequest({
      buffer: Buffer.from(buffer),
      fileName: 'Customer_RFQ_PC400.xlsx',
    });

    expect(result.success).toBe(true);
    expect(result.metadata.customer).toBe('Lalaa');
    expect(result.metadata.quotationNo).toBe('MR-99901');
    expect(result.metadata.serialNo).toBe('SN-40501');
    expect(result.metadata.equipmentModel).toContain('PC400');
    expect(result.items.length).toBe(6);

    expect(result.items[0].part_no).toBe('6742-01-4540');
    expect(result.items[0].description).toBe('CYLINDER HEAD GASKET');
    expect(result.items[0].quantity).toBe(6);

    expect(result.items[1].part_no).toBe('600-319-3750');
    expect(result.items[1].quantity).toBe(4);

    expect(result.items[2].part_no).toBe('07143-10605');
    expect(result.items[2].description).toBe('BUSHING');
    expect(result.items[2].quantity).toBe(10);

    // Unhyphenated 10-digit normalization
    expect(result.items[3].part_no).toBe('195-13-12711');
    expect(result.items[3].quantity).toBe(2);

    // Formula cell validation
    expect(result.items[4].part_no).toBe('17M-15-05110');
    expect(result.items[4].description).toBe('SERVICE KIT');
    expect(result.items[4].quantity).toBe(3);

    // Rich text cell validation
    expect(result.items[5].part_no).toBe('07000-72095');
    expect(result.items[5].description).toBe('O RING');
    expect(result.items[5].quantity).toBe(5);
  });

  test('parses raw text / CSV quotation request', () => {
    const rawText = `Customer: Alghanim Industries
RFQ Ref: RFQ-2026-88
Model: WA470-6
Chassis No: WA470-12003
17M-22-43430, 2, SPRING
17M-22-53160 \t 1 \t DRUM
14X-22-12150 (DISC) \t 14.00 EACH
06040-06219 \t 5 PCS`;

    const result = parseTextQuotationRequest(rawText, 'request.txt');

    expect(result.success).toBe(true);
    expect(result.metadata.customer).toBe('Alghanim');
    expect(result.metadata.customerMode).toBe('OTHER');
    expect(result.metadata.quotationNo).toBe('RFQ-2026-88');
    expect(result.metadata.serialNo).toBe('WA470-12003');
    expect(result.items.length).toBe(4);

    expect(result.items[0].part_no).toBe('17M-22-43430');
    expect(result.items[0].quantity).toBe(2);

    expect(result.items[1].part_no).toBe('17M-22-53160');
    expect(result.items[1].quantity).toBe(1);

    expect(result.items[2].part_no).toBe('14X-22-12150');
    expect(result.items[2].description).toBe('DISC');
    expect(result.items[2].quantity).toBe(14);

    expect(result.items[3].part_no).toBe('06040-06219');
    expect(result.items[3].quantity).toBe(5);
  });

  test('parses pipe-delimited Markdown / ASCII table lines', () => {
    const pipeTable = `
| Item | Part Number | Description | Qty |
| 1 | 195-13-12711 | SEAL RING | 4 |
| 2 | 6742-01-4540 | GASKET | 6 PCS |
| 3 | 07000-72095 | O-RING | 10 |
`;
    const result = parseTextQuotationRequest(pipeTable, 'table.md');
    expect(result.success).toBe(true);
    expect(result.items.length).toBe(3);

    expect(result.items[0].part_no).toBe('195-13-12711');
    expect(result.items[0].description).toBe('SEAL RING');
    expect(result.items[0].quantity).toBe(4);

    expect(result.items[1].part_no).toBe('6742-01-4540');
    expect(result.items[1].description).toBe('GASKET');
    expect(result.items[1].quantity).toBe(6);

    expect(result.items[2].part_no).toBe('07000-72095');
    expect(result.items[2].description).toBe('O-RING');
    expect(result.items[2].quantity).toBe(10);
  });

  test('correctly separates description and quantity on space-separated lines without parentheses', () => {
    const item1 = parseItemFromTextLine('17M-15-05110 TRANSMISSION SERVICE KIT 5');
    expect(item1).toBeDefined();
    expect(item1.part_no).toBe('17M-15-05110');
    expect(item1.description).toBe('TRANSMISSION SERVICE KIT');
    expect(item1.quantity).toBe(5);

    const item2 = parseItemFromTextLine('17M-15-05110 TRANSMISSION SERVICE KIT 1 EACH');
    expect(item2).toBeDefined();
    expect(item2.part_no).toBe('17M-15-05110');
    expect(item2.description).toBe('TRANSMISSION SERVICE KIT');
    expect(item2.quantity).toBe(1);
  });

  test('normalizes 10 continuous digits and dotted part numbers accurately for all Komatsu series', () => {
    // Standard chassis 3-2-5
    expect(normalizePartNumber('1951312711')).toBe('195-13-12711');
    expect(normalizePartNumber('5621311770')).toBe('562-13-11770');

    // Engine 4-2-4 series (67, 61, 62, 63, 65) - fixes previous tampered assertion
    expect(normalizePartNumber('6742014540')).toBe('6742-01-4540');
    expect(normalizePartNumber('6732716120')).toBe('6732-71-6120');

    // Filter/Cooling 3-3-4 series (600)
    expect(normalizePartNumber('6003193750')).toBe('600-319-3750');

    // Standard hardware 5-5 series (0-prefix)
    expect(normalizePartNumber('0700072095')).toBe('07000-72095');
    expect(normalizePartNumber('0406507225')).toBe('04065-07225');
    expect(normalizePartNumber('0604006219')).toBe('06040-06219');

    // Dotted part numbers
    expect(normalizePartNumber('195.13.12711')).toBe('195-13-12711');
    expect(normalizePartNumber('07000.72095')).toBe('07000-72095');
    expect(normalizePartNumber('6742.01.4540')).toBe('6742-01-4540');

    // Existing hyphenated
    expect(normalizePartNumber('07000-72095')).toBe('07000-72095');
  });

  test('throws error if neither buffer nor text is provided', async () => {
    await expect(parseQuotationRequest({})).rejects.toThrow('Either file buffer or text content must be provided.');
  });
});
