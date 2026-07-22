const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const path = require('path');

const group = String(process.argv[2] || '').trim().toUpperCase();
const sourcePath = process.argv[3] ? path.resolve(process.argv[3]) : '';
const supportedGroups = {
  SAMA: 'Sama International General Trading & Contracting Co',
  REZ: 'ARIZONA NATIONAL GENERAL TRADING & CONTRACTING CO.',
};

async function main() {
  if (!supportedGroups[group] || !sourcePath) {
    throw new Error('Usage: node scripts/import-pc400-customer-template.js <SAMA|REZ> <source.xlsm>');
  }

  if (!await fs.pathExists(sourcePath)) {
    throw new Error(`Source template not found: ${sourcePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(sourcePath);
  const sheet = workbook.worksheets[0];

  if (sheet.getCell('B9').text !== 'PC400' || sheet.getCell('R13').text !== supportedGroups[group]) {
    throw new Error(`The source workbook does not match the ${group} PC400 template.`);
  }

  // Keep the Komatsu logo but remove the signature baked into the source workbook.
  sheet._media = sheet._media.filter((item) => {
    if (item.type !== 'image') return true;
    const topRow = item.range?.tl?.nativeRow ?? item.range?.tl?.row ?? Number.MAX_SAFE_INTEGER;
    return topRow < 10;
  });

  sheet.name = `PC400 ${group}`;
  ['L9', 'AD9', 'B13', 'L13', 'AP4'].forEach((address) => {
    sheet.getCell(address).value = null;
  });

  const outputDirectory = path.join(__dirname, '..', 'templates', 'PC400', group);
  const outputPath = path.join(outputDirectory, 'W41_Add_Service.xlsx');
  await fs.ensureDir(outputDirectory);
  await workbook.xlsx.writeFile(outputPath);

  console.log(`Imported ${group} PC400 template: ${outputPath}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
