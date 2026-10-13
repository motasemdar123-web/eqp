const ExcelJS = require('exceljs');

/**
 * Generate Customer Quotation Excel buffer containing the 7 official columns:
 * 1. Item (Part No.)
 * 2. Description
 * 3. Qty
 * 4. DNet Price ($)
 * 5. Price per Unit (KWD)
 * 6. Total Price (KWD)
 * 7. Delivery Time
 */
async function generateCustomerQuotationExcelBuffer({
  customer = 'Customer',
  customerMode = 'LALAA',
  marginFactorR = 0.65,
  items = [],
} = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dar Al Hay - Komatsu Operations';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('CUSTOMER QUOTATION', {
    views: [{ showGridLines: true }],
  });

  // Setup column widths for the 7 official columns
  worksheet.getColumn(1).width = 18; // Item (Part No.)
  worksheet.getColumn(2).width = 34; // Description
  worksheet.getColumn(3).width = 12; // Qty
  worksheet.getColumn(4).width = 18; // DNet Price ($)
  worksheet.getColumn(5).width = 22; // Price per Unit (KWD)
  worksheet.getColumn(6).width = 24; // Total Price (KWD)
  worksheet.getColumn(7).width = 30; // Delivery Time

  // Row 1: Title Banner
  worksheet.mergeCells('A1:G1');
  const titleRow = worksheet.getRow(1);
  titleRow.height = 30;
  const titleCell = titleRow.getCell(1);
  titleCell.value = 'DAR AL HAY - KOMATSU CUSTOMER QUOTATION';
  titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Navy

  // Row 2: Customer, Date & Pricing Metadata
  worksheet.mergeCells('A2:C2');
  worksheet.getCell('A2').value = `Customer: ${customer}`;
  worksheet.getCell('A2').font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  worksheet.getCell('A2').alignment = { vertical: 'middle' };

  worksheet.mergeCells('D2:E2');
  const modeLabel = customerMode === 'LALAA' ? 'Lalaa Tier Partner' : 'Standard Formula';
  worksheet.getCell('D2').value = `Pricing Tier: ${modeLabel} (R = ${Number(marginFactorR).toFixed(2)})`;
  worksheet.getCell('D2').font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  worksheet.getCell('D2').alignment = { vertical: 'middle' };

  worksheet.mergeCells('F2:G2');
  const nowStr = new Date().toISOString().split('T')[0];
  worksheet.getCell('F2').value = `Date: ${nowStr}`;
  worksheet.getCell('F2').font = { name: 'Calibri', size: 10, color: { argb: 'FF475569' } };
  worksheet.getCell('F2').alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // Row 3: Blank separator
  worksheet.getRow(3).height = 8;

  // Row 4: Column Headers
  const headerRow = worksheet.getRow(4);
  headerRow.height = 24;
  const headers = [
    'Item',
    'Description',
    'Qty',
    'DNet Price ($)',
    'Price per Unit (KWD)',
    'Total Price (KWD)',
    'Delivery Time',
  ];

  headers.forEach((h, idx) => {
    const colIdx = idx + 1;
    const cell = headerRow.getCell(colIdx);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = {
      horizontal: [3, 4, 5, 6].includes(colIdx) ? 'right' : [1, 7].includes(colIdx) ? 'center' : 'left',
      vertical: 'middle',
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: {
        argb: colIdx === 6 ? 'FF047857' : colIdx === 4 ? 'FFB45309' : 'FF1E293B',
      },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } },
    };
  });

  // Data rows starting at Row 5
  let currentRowIdx = 5;
  let totalQty = 0;
  let grandTotalKwd = 0;
  let totalDNetUsd = 0;

  items.forEach((item, idx) => {
    const row = worksheet.getRow(currentRowIdx);
    row.height = 20;
    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const qty = parseInt(item.quantity || item.qty || 1, 10) || 1;
    const dnet = parseFloat(item.dnet_price || item.dnetPrice || item.dnet || 0) || 0;
    const unitKwd = parseFloat(item.unitPriceKwd || item.unit_price_kwd || item.unitPrice || 0) || 0;
    const totalKwd = parseFloat(item.totalPriceKwd || item.total_price_kwd || (unitKwd * qty) || 0) || 0;
    const delivery = item.deliveryTime || item.delivery_time || item.custom_delivery || '7-10 Days';

    totalQty += qty;
    grandTotalKwd += totalKwd;
    totalDNetUsd += dnet * qty;

    // Col 1: Item
    const c1 = row.getCell(1);
    c1.value = item.part_no || item.partNo || '';
    c1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    c1.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 2: Description
    const c2 = row.getCell(2);
    c2.value = item.description || 'Komatsu Genuine Component';
    c2.font = { name: 'Calibri', size: 11, color: { argb: 'FF334155' } };
    c2.alignment = { horizontal: 'left', vertical: 'middle' };

    // Col 3: Qty
    const c3 = row.getCell(3);
    c3.value = qty;
    c3.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    c3.numFmt = '#,##0';
    c3.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 4: DNet Price ($)
    const c4 = row.getCell(4);
    c4.value = dnet;
    c4.font = { name: 'Calibri', size: 11, color: { argb: 'FF78350F' } };
    c4.numFmt = '$#,##0.00';
    c4.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 5: Price per Unit (KWD)
    const c5 = row.getCell(5);
    c5.value = unitKwd;
    c5.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    c5.numFmt = '#,##0.000';
    c5.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 6: Total Price (KWD)
    const c6 = row.getCell(6);
    c6.value = totalKwd;
    c6.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF065F46' } };
    c6.numFmt = '#,##0.000';
    c6.alignment = { horizontal: 'right', vertical: 'middle' };

    // Col 7: Delivery Time
    const c7 = row.getCell(7);
    c7.value = delivery;
    c7.font = { name: 'Calibri', size: 11, color: { argb: 'FF1E293B' } };
    c7.alignment = { horizontal: 'center', vertical: 'middle' };

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }

    currentRowIdx++;
  });

  // Row: Summary / Grand Total
  const summaryRow = worksheet.getRow(currentRowIdx);
  summaryRow.height = 26;
  worksheet.mergeCells(`A${currentRowIdx}:B${currentRowIdx}`);
  const sumLabel = summaryRow.getCell(1);
  sumLabel.value = `TOTAL QUOTATION VALUE (${items.length} ITEMS)`;
  sumLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  sumLabel.alignment = { horizontal: 'center', vertical: 'middle' };

  const sumQty = summaryRow.getCell(3);
  sumQty.value = totalQty;
  sumQty.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  sumQty.numFmt = '#,##0';
  sumQty.alignment = { horizontal: 'right', vertical: 'middle' };

  const sumDNet = summaryRow.getCell(4);
  sumDNet.value = totalDNetUsd;
  sumDNet.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF78350F' } };
  sumDNet.numFmt = '$#,##0.00';
  sumDNet.alignment = { horizontal: 'right', vertical: 'middle' };

  const sumUnitBlank = summaryRow.getCell(5);
  sumUnitBlank.value = '';

  const sumTotalKwd = summaryRow.getCell(6);
  sumTotalKwd.value = grandTotalKwd;
  sumTotalKwd.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF065F46' } };
  sumTotalKwd.numFmt = '#,##0.000';
  sumTotalKwd.alignment = { horizontal: 'right', vertical: 'middle' };

  const sumDeliveryBlank = summaryRow.getCell(7);
  sumDeliveryBlank.value = '';

  for (let c = 1; c <= 7; c++) {
    const cell = summaryRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // Light emerald
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF059669' } },
      bottom: { style: 'double', color: { argb: 'FF059669' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  }

  return workbook.xlsx.writeBuffer();
}

module.exports = {
  generateCustomerQuotationExcelBuffer,
};
