const { generateAvailabilityFormExcelBuffer } = require('../src/services/komatsuAvailabilityFormService');
const ExcelJS = require('exceljs');

describe('Parts Availability Request Form Generator', () => {
  it('should generate a valid Excel workbook with exact 8 columns and data rows', async () => {
    const testItems = [
      {
        part_no: '17M-22-43430',
        latest_part_no: '17M-22-43430',
        description: 'SPRING',
        quantity: 1,
        model: 'D155A-6',
        serial: '88601',
        remarks: null,
      },
      {
        part_no: '17M-22-53160',
        latest_part_no: '17M-22-53160',
        description: 'DRUM',
        quantity: 2,
        model: 'D275A-5',
        serial: '-',
        remarks: null,
      },
      {
        part_no: '17M-13-05040',
        latest_part_no: '17M-13-05040',
        description: 'SERVICE KIT',
        quantity: 1,
        model: 'D275A-5',
        serial: '-',
        remarks: 'Urgent Japan backorder',
      },
    ];

    const buffer = await generateAvailabilityFormExcelBuffer({
      items: testItems,
      customer: 'Lalaa',
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    // Read back and verify with ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    expect(sheet.name).toBe('AVAILABILITY REQUEST FORM');

    // Title Row 1
    const titleCell = sheet.getRow(1).getCell(1);
    expect(titleCell.value).toBe('PARTS AVAILABILITY  REQUEST FORM');

    // Header Row 2
    const expectedHeaders = [
      'ITEM NO.',
      'PART NO. ',
      'LATEST PART NO.',
      ' DESCRIPTION',
      'REQ. QTY',
      'MACHINE MODEL',
      'SN',
      'KME REMARKS',
    ];
    for (let c = 1; c <= 8; c++) {
      expect(sheet.getRow(2).getCell(c).value).toBe(expectedHeaders[c - 1]);
    }

    // Row 3: Item 1
    const r3 = sheet.getRow(3);
    expect(r3.getCell(1).value).toBe(1);
    expect(r3.getCell(2).value).toBe('17M-22-43430');
    expect(r3.getCell(3).value).toBe('17M-22-43430');
    expect(r3.getCell(4).value).toBe('SPRING');
    expect(r3.getCell(5).value).toBe(1);
    expect(r3.getCell(6).value).toBe('D155A-6');
    expect(r3.getCell(7).value).toBe('88601');

    // Row 4: Item 2 (SN dash)
    const r4 = sheet.getRow(4);
    expect(r4.getCell(1).value).toBe(2);
    expect(r4.getCell(2).value).toBe('17M-22-53160');
    expect(r4.getCell(6).value).toBe('D275A-5');
    expect(r4.getCell(7).value).toBe('-');

    // Row 5: Item 3
    const r5 = sheet.getRow(5);
    expect(r5.getCell(1).value).toBe(3);
    expect(r5.getCell(8).value).toBe('Urgent Japan backorder');
  });
});
