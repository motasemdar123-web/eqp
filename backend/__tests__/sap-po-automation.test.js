const sapPoAutomationService = require('../src/services/sapPoAutomationService');
const ExcelJS = require('exceljs');

describe('SAP Business One Purchase Order Automation Service', () => {
  const sampleItems = [
    { part_no: '6732-81-8100', qty: 2, price: 150.5, description: 'STARTER MOTOR' },
    { part_no: '07000-12012', qty: 10, price: 12.0, description: 'O-RING' },
  ];

  test('validates that empty items list throws error', async () => {
    await expect(
      sapPoAutomationService.createSapPurchaseOrder({
        vendor: 'V000006',
        items: [],
      })
    ).rejects.toThrow('Cannot create Purchase Order without line items');
  });

  test('dry-run execution validates payload successfully', async () => {
    const result = await sapPoAutomationService.createSapPurchaseOrder({
      vendor: 'V000006',
      buyer: 'Motasem Ghanem',
      deliveryDate: '2026-09-05',
      items: sampleItems,
      quotationNo: 'Q100982',
      dryRun: true,
    });

    expect(result).toBeDefined();
    expect(result.mode).toBe('DRY_RUN');
    expect(result.vendor).toBe('V000006');
    expect(result.buyer).toBe('Motasem Ghanem');
    expect(result.itemsCount).toBe(2);
    expect(result.quotationNo).toBe('Q100982');
  });

  test('getSapPoStatus returns current execution status', () => {
    const status = sapPoAutomationService.getSapPoStatus();
    expect(status).toBeDefined();
    expect(status).toHaveProperty('status');
    expect(status).toHaveProperty('logs');
    expect(Array.isArray(status.logs)).toBe(true);
  });

  test('generateSapPoExcelBuffer creates a valid Excel spreadsheet', async () => {
    const buffer = await sapPoAutomationService.generateSapPoExcelBuffer({
      vendor: 'V000006',
      buyer: 'Mohammad Qraein',
      deliveryDate: '2026-09-10',
      items: sampleItems,
      quotationNo: 'Q100982',
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet('Purchase Order');
    expect(worksheet).toBeDefined();
    expect(worksheet.rowCount).toBe(3); // 1 header + 2 item rows
  });
});
