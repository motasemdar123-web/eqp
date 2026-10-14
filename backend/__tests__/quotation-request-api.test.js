const path = require('path');
const fs = require('fs');
const request = require('supertest');
const ExcelJS = require('exceljs');
const { createApp } = require('../src/app');

describe('Quotation Request API Route (POST /api/komatsu/quotations/parse-request)', () => {
  const app = createApp();
  const fixturePdf = path.join(__dirname, 'fixtures', 'MR-35211.pdf');

  test('parses uploaded MR-35211.pdf via multipart file upload', async () => {
    expect(fs.existsSync(fixturePdf)).toBe(true);

    const res = await request(app)
      .post('/api/komatsu/quotations/parse-request')
      .attach('file', fixturePdf);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metadata.customer).toBe('Lalaa');
    expect(res.body.metadata.quotationNo).toBe('MR-35211');
    expect(res.body.metadata.equipmentModel).toContain('D275A');
    expect(res.body.items.length).toBe(60);
    expect(res.body.summary.totalItems).toBe(60);
    expect(res.body.summary.totalQuantity).toBe(272);
  });

  test('parses uploaded Excel file via multipart upload', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Quotation Request');
    sheet.addRow(['Customer: Lalaa Real Estate', '', 'MR No: MR-77112']);
    sheet.addRow(['Part No', 'Description', 'Quantity']);
    sheet.addRow(['195-13-12711', 'SEAL RING', 3]);
    sheet.addRow(['06040-06219', 'BEARING', 2]);

    const tmpExcelPath = path.join(__dirname, 'fixtures', 'test_rfq.xlsx');
    await workbook.xlsx.writeFile(tmpExcelPath);

    try {
      const res = await request(app)
        .post('/api/komatsu/quotations/parse-request')
        .attach('file', tmpExcelPath);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metadata.customer).toBe('Lalaa');
      expect(res.body.metadata.quotationNo).toBe('MR-77112');
      expect(res.body.items.length).toBe(2);
      expect(res.body.items[0].part_no).toBe('195-13-12711');
      expect(res.body.items[0].quantity).toBe(3);
      expect(res.body.items[1].part_no).toBe('06040-06219');
      expect(res.body.items[1].quantity).toBe(2);
    } finally {
      if (fs.existsSync(tmpExcelPath)) fs.unlinkSync(tmpExcelPath);
    }
  });

  test('parses raw text in JSON payload', async () => {
    const payload = {
      text: 'Customer: Lalaa\nMR No: MR-35211\n195-13-12711, 2\n06040-06219, 4',
      fileName: 'text_input.txt',
    };

    const res = await request(app)
      .post('/api/komatsu/quotations/parse-request')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metadata.customer).toBe('Lalaa');
    expect(res.body.items.length).toBe(2);
    expect(res.body.items[0].part_no).toBe('195-13-12711');
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.items[1].part_no).toBe('06040-06219');
    expect(res.body.items[1].quantity).toBe(4);
  });

  test('returns 400 when no file or text is uploaded', async () => {
    const res = await request(app)
      .post('/api/komatsu/quotations/parse-request')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No quotation request file');
  });
});
