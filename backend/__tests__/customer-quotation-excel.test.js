const ExcelJS = require('exceljs');
const { generateCustomerQuotationExcelBuffer } = require('../src/services/komatsuQuotationExcelService');

describe('Customer Quotation Excel Generation', () => {
  test('generates valid Excel buffer with 7 official columns and correct calculations', async () => {
    const mockItems = [
      {
        part_no: '17M-22-43430',
        description: 'SPRING',
        quantity: 2,
        dnet_price: 45.0,
        unitPriceKwd: 32.18,
        totalPriceKwd: 64.36,
        deliveryTime: '7-10 Days',
      },
      {
        part_no: '17M-22-53160',
        description: 'DRUM',
        quantity: 1,
        dnet_price: 320.0,
        unitPriceKwd: 228.835,
        totalPriceKwd: 228.835,
        deliveryTime: '3-5 Weeks',
      },
      {
        part_no: 'UNKNOWN-001',
        description: 'Unregistered / Not in PDX',
        quantity: 5,
        dnet_price: 0.0,
        unitPriceKwd: 0.0,
        totalPriceKwd: 0.0,
        deliveryTime: '3-5 Weeks',
      },
    ];

    const buffer = await generateCustomerQuotationExcelBuffer({
      customer: 'Lalaa',
      customerMode: 'LALAA',
      marginFactorR: 0.65,
      items: mockItems,
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    // Read back workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet('CUSTOMER QUOTATION');
    expect(sheet).toBeDefined();

    // Verify Title and Metadata
    expect(sheet.getCell('A1').value).toContain('DAR AL HAY - KOMATSU CUSTOMER QUOTATION');
    expect(sheet.getCell('A2').value).toContain('Customer: Lalaa');

    // Verify Headers
    expect(sheet.getCell('A4').value).toBe('Item');
    expect(sheet.getCell('B4').value).toBe('Description');
    expect(sheet.getCell('C4').value).toBe('Qty');
    expect(sheet.getCell('D4').value).toBe('DNet Price ($)');
    expect(sheet.getCell('E4').value).toBe('Price per Unit (KWD)');
    expect(sheet.getCell('F4').value).toBe('Total Price (KWD)');
    expect(sheet.getCell('G4').value).toBe('Delivery Time');

    // Verify Row 1 data
    expect(sheet.getCell('A5').value).toBe('17M-22-43430');
    expect(sheet.getCell('C5').value).toBe(2);
    expect(sheet.getCell('D5').value).toBe(45.0);
    expect(sheet.getCell('E5').value).toBe(32.18);
    expect(sheet.getCell('F5').value).toBe(64.36);
    expect(sheet.getCell('G5').value).toBe('7-10 Days');

    // Verify Row 3 (unregistered / zero price)
    expect(sheet.getCell('A7').value).toBe('UNKNOWN-001');
    expect(sheet.getCell('C7').value).toBe(5);
    expect(sheet.getCell('D7').value).toBe(0.0);
    expect(sheet.getCell('E7').value).toBe(0.0);
    expect(sheet.getCell('F7').value).toBe(0.0);

    // Verify Summary row
    expect(sheet.getCell('A8').value).toContain('TOTAL QUOTATION VALUE');
    expect(sheet.getCell('C8').value).toBe(8); // 2 + 1 + 5
    expect(sheet.getCell('F8').value).toBeCloseTo(293.195, 2); // 64.36 + 228.835
  });
});
