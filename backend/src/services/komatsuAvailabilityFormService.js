const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const TEMPLATE_FILE_PATH = 'C:\\Spare Parts\\Spare parts form\\Parts Availability Request Form..xlsx';

/**
 * Generate Parts Availability Request Form Excel buffer matching the exact layout of:
 * C:\Spare Parts\Spare parts form\Parts Availability Request Form..xlsx
 *
 * Columns:
 * 1. ITEM NO.
 * 2. PART NO.
 * 3. LATEST PART NO.
 * 4. DESCRIPTION
 * 5. REQ. QTY
 * 6. MACHINE MODEL
 * 7. SN
 * 8. KME REMARKS
 */
async function generateAvailabilityFormExcelBuffer({ items = [], customer = '' } = {}) {
  const workbook = new ExcelJS.Workbook();
  let worksheet = null;
  let isFresh = false;

  // If template exists on disk, load it as base to preserve formatting & metadata
  if (fs.existsSync(TEMPLATE_FILE_PATH)) {
    try {
      await workbook.xlsx.readFile(TEMPLATE_FILE_PATH);
      worksheet = workbook.worksheets[0];
      // Clean existing sample data rows while keeping headers (Row 1 and Row 2)
      const existingRowCount = worksheet.actualRowCount || 16;
      for (let r = 3; r <= existingRowCount + 5; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= 8; c++) {
          row.getCell(c).value = null;
        }
      }
    } catch (err) {
      console.warn('[AvailabilityForm] Could not load template file directly, creating fresh:', err.message);
      worksheet = null;
    }
  }

  if (!worksheet) {
    worksheet = workbook.addWorksheet('AVAILABILITY REQUEST FORM');
    worksheet.mergeCells('A1:H1');
    isFresh = true;
  }

  // Set standard column widths matching the original template
  worksheet.getColumn(1).width = 10.1;
  worksheet.getColumn(2).width = 16.0;
  worksheet.getColumn(3).width = 16.5;
  worksheet.getColumn(4).width = 24.0;
  worksheet.getColumn(5).width = 14.0;
  worksheet.getColumn(6).width = 26.5;
  worksheet.getColumn(7).width = 22.0;
  worksheet.getColumn(8).width = 38.0;

  // Ensure Row 1: Title
  const titleRow = worksheet.getRow(1);
  titleRow.height = 24;
  const titleCell = titleRow.getCell(1);
  titleCell.value = 'PARTS AVAILABILITY  REQUEST FORM';
  titleCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  titleCell.border = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  };

  // Row 2: Headers
  const headerRow = worksheet.getRow(2);
  headerRow.height = 22;
  const headers = [
    'ITEM NO.',
    'PART NO. ',
    'LATEST PART NO.',
    ' DESCRIPTION',
    'REQ. QTY',
    'MACHINE MODEL',
    'SN',
    'KME REMARKS',
  ];

  headers.forEach((h, idx) => {
    const colIdx = idx + 1;
    const cell = headerRow.getCell(colIdx);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    cell.alignment = {
      horizontal: [1, 5, 7].includes(colIdx) ? 'center' : 'left',
      vertical: 'middle',
    };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF64748B' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });

  // Populate data rows starting at Row 3
  items.forEach((item, index) => {
    const rowIdx = index + 3;
    const row = worksheet.getRow(rowIdx);
    row.height = 19;

    const itemNo = index + 1;
    const partNo = String(item.part_no || item.partNo || '').trim().toUpperCase();
    const latestPartNo = String(item.latest_part_no || item.lpn || partNo).trim().toUpperCase();
    const description = String(item.description || 'KOMATSU COMPONENT').trim().toUpperCase();
    const reqQty = parseInt(item.quantity || item.qty || 1, 10) || 1;
    const model = String(item.model || item.machine_model || '').trim().toUpperCase() || '-';
    const sn = String(item.serial || item.sn || '-').trim() || '-';
    const remarks = item.remarks || null;

    const values = [itemNo, partNo, latestPartNo, description, reqQty, model, sn, remarks];

    values.forEach((val, valIdx) => {
      const colIdx = valIdx + 1;
      const cell = row.getCell(colIdx);
      cell.value = val;
      cell.font = {
        name: 'Calibri',
        size: 11,
        color: { argb: 'FF0F172A' },
      };
      cell.alignment = {
        horizontal: [1, 5, 7].includes(colIdx) ? 'center' : 'left',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9E2F3' } },
        bottom: { style: 'thin', color: { argb: 'FFD9E2F3' } },
        left: { style: 'thin', color: { argb: 'FFD9E2F3' } },
        right: { style: 'thin', color: { argb: 'FFD9E2F3' } },
      };

      // Subtle alternating zebra fill matching template
      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF4F7FB' },
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' },
        };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  TEMPLATE_FILE_PATH,
  generateAvailabilityFormExcelBuffer,
};
