const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const path = require('path');

const templateRoot = path.join(__dirname, '..', 'templates');
const sourceDirectory = path.join(templateRoot, 'D155A');
const targetDirectory = path.join(templateRoot, 'PC400');

const leftChecklist = {
  C39: '    Fuel Tank',
  C40: '    Battery Electrolyte',
  C41: '    Radiator Coolant Level/Anti-freeze Protection',
  C42: '    Engine Oil Pan(s)',
  C43: '    Final Drive Cases',
  C44: '    Track Rollers and Idlers',
  C45: '    Hydraulic Tank',
  C46: '    Swing Machinery Case',
  C47: '    Pump Drive Case Oil',
  C48: '    Travel Reduction Gear Cases',
  C49: '    Hydraulic System Oil Level',
  C50: '    Attachment Lubrication Points',
  C52: '    Fuel Tank, Prefilter & Water Separator Sediment',
  C53: '    Drive Belt Tension(s) - Fan, Alternator, etc.',
  C54: '    Air Cleaner Element(s) & Connections',
  C55: '    Radiator Core & Cooling System Connections',
  C56: '    Engine Oil Filter(s), Fuel Filter(s) & Breather',
  C57: '    Hydraulic Oil Filter Element(s) & Tank Breather',
  C58: '    Inspect Entire Machine for Broken Welds, Cracks,',
  C59: '      Damage, Loose Bolts and Distortion',
  C60: '    Track Tension and Track Shoe Condition',
  C61: '    Undercarriage, Bucket Cutting Edge and Teeth Wear',
  C62: '    Boom, Arm, Bucket Pins, Bushings and Cylinder Mounts',
  C63: '    Swing Bearing, Track Shoes, Links and Sprocket Bolts',
  C64: '    KOMTRAX/VHMS Function - if applicable',
};

const operationChecklist = {
  AH33: '    Monitor Panel, Switches, Gauges, Lights and Indicators',
  AH34: '    Unusual Machine Noise',
  AH35: '    Warning Horn, Work Lights & Window Wipers',
  AH36: '    Travel Alarm',
  AH37: '    Engine and Work Equipment Lock Lever',
  AH38: '    Travel Controls and Straight Travel Operation',
  AH39: '    Swing Lock and Swing Brake Control',
  AH40: '    Control Lever Stroke, Play and Neutral Position',
  AH41: '    Boom, Arm and Bucket Operation',
  AH42: '    Attachment / Quick Coupler - if equipped',
  AH43: '    Engine Low Idle RPM',
  AH44: '    Engine High Idle RPM',
  AH45: '    Equipment Hydraulic Relief Pressure',
  AH46: '    Swing and Travel Operation',
  AH47: '    Procedure for using Multi-monitor and KOMTRAX',
};

function replaceRichText(cell, fromText, toText) {
  if (!cell.value || typeof cell.value !== 'object' || !Array.isArray(cell.value.richText)) {
    cell.value = String(cell.value || '').replace(fromText, toText);
    return;
  }

  cell.value = {
    richText: cell.value.richText.map((part) => ({
      ...part,
      text: part.text.replace(fromText, toText),
    })),
  };
}

async function buildTemplate(fileName) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(sourceDirectory, fileName));

  const sheet = workbook.worksheets[0];
  sheet.getCell('A1').value = 'HYDRAULIC EXCAVATORS';
  replaceRichText(sheet.getCell('V2'), 'BULLDOZERS & DOZER SHOVELS', 'HYDRAULIC EXCAVATORS');
  sheet.getCell('B9').value = 'PC400';
  sheet.getCell('I9').value = '8R';
  sheet.getCell('V9').value = 'SAA6D125E-5';

  Object.entries(leftChecklist).forEach(([address, value]) => {
    sheet.getCell(address).value = value;
  });
  Object.entries(operationChecklist).forEach(([address, value]) => {
    sheet.getCell(address).value = value;
  });

  sheet.getCell('AX43').value = null;
  sheet.getCell('AX44').value = null;
  sheet.getCell('C83').value = 'Form No. EQP-PC400-01';
  sheet.getCell('AZ83').value = 'Rev: Jul 2026';

  await workbook.xlsx.writeFile(path.join(targetDirectory, fileName));
}

async function main() {
  await fs.ensureDir(targetDirectory);
  const files = (await fs.readdir(sourceDirectory))
    .filter((fileName) => fileName.toLowerCase().endsWith('.xlsx'));

  await Promise.all(files.map(buildTemplate));
  console.log(`Built ${files.length} PC400 templates in ${targetDirectory}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
