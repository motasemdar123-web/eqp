const ExcelJS = require('exceljs');
const path = require('path');

const templateRoot = path.join(__dirname, '..', 'templates', 'PC400');
const expectedCustomers = {
  SAMA: 'Sama International General Trading & Contracting Co',
  REZ: 'ARIZONA NATIONAL GENERAL TRADING & CONTRACTING CO.',
};

describe('official PC400 customer templates', () => {
  test.each(Object.entries(expectedCustomers))('%s template is clean and customer-specific', async (group, customer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join(templateRoot, group, 'W41_Add_Service.xlsx'));
    const sheet = workbook.worksheets[0];

    expect(sheet.getCell('B9').text).toBe('PC400');
    expect(sheet.getCell('R13').text).toBe(customer);
    expect(sheet.getCell('BF9').text).toBe('X');
    expect(sheet.getImages()).toHaveLength(1);
    expect(sheet.getCell('L9').text).toBe('');
    expect(sheet.getCell('AD9').text).toBe('');
    expect(sheet.getCell('AP4').text).toBe('');
  });
});
