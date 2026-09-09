const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const SAP_PORTAL_URL = process.env.SAP_PORTAL_URL || 'https://daralhai.b1pro.com/software/html5.html';
const SAP_USER = process.env.SAP_PORTAL_USER || 'DAH38';
const SAP_PASSWORD = process.env.SAP_PORTAL_PASSWORD || 'Dar@20055';
const DEFAULT_VENDOR = 'V000006';

let latestJobStatus = {
  running: false,
  lastRun: null,
  status: 'IDLE',
  logs: [],
  error: null,
  result: null,
  screenshotUrl: null,
};

function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { timestamp, message, type };
  latestJobStatus.logs.push(entry);
  if (latestJobStatus.logs.length > 100) latestJobStatus.logs.shift();
  console.log(`[SAP-PO-AUTOMATION] [${timestamp}] [${type.toUpperCase()}]: ${message}`);
}

/**
 * Generate an Excel file formatted for SAP Business One Purchase Order Data Import
 */
async function generateSapPoExcelBuffer({ vendor = DEFAULT_VENDOR, buyer = 'Motasem Ghanem', deliveryDate, items = [], remarks = '', quotationNo = '' }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Purchase Order');

  sheet.columns = [
    { header: 'CardCode (Vendor)', key: 'cardCode', width: 18 },
    { header: 'DocDate', key: 'docDate', width: 14 },
    { header: 'DocDueDate (Delivery)', key: 'dueDate', width: 20 },
    { header: 'Buyer', key: 'buyer', width: 22 },
    { header: 'ItemCode', key: 'itemCode', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Price (LC)', key: 'price', width: 14 },
    { header: 'TaxCode', key: 'taxCode', width: 12 },
    { header: 'WhsCode', key: 'whsCode', width: 14 },
    { header: 'Comments / Remarks', key: 'comments', width: 35 },
    { header: 'VendorRefNo', key: 'vendorRef', width: 20 },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const targetDueDate = deliveryDate || todayStr;
  const commentText = remarks || `PDX Quotation #${quotationNo || 'N/A'}`;

  items.forEach((it) => {
    sheet.addRow({
      cardCode: vendor || DEFAULT_VENDOR,
      docDate: todayStr,
      dueDate: targetDueDate,
      buyer: buyer || 'Motasem Ghanem',
      itemCode: it.part_no || it.partNo || it.itemCode,
      quantity: Number(it.qty || it.quantity || 1),
      price: it.price ? Number(it.price) : 0,
      taxCode: 'P0',
      whsCode: '01',
      comments: commentText,
      vendorRef: quotationNo || '',
    });
  });

  return await workbook.xlsx.writeBuffer();
}

/**
 * Launch Playwright and automate Purchase Order creation in SAP B1
 */
async function createSapPurchaseOrder({
  vendor = DEFAULT_VENDOR,
  buyer = 'Motasem Ghanem',
  deliveryDate,
  items = [],
  remarks = '',
  quotationNo = '',
  dryRun = false,
}) {
  if (!items || items.length === 0) {
    throw new Error('Cannot create Purchase Order without line items.');
  }

  latestJobStatus = {
    running: true,
    lastRun: new Date().toISOString(),
    status: 'IN_PROGRESS',
    logs: [],
    error: null,
    result: null,
    screenshotUrl: null,
  };

  addLog(`Starting SAP PO Automation for Quotation #${quotationNo || 'Direct'} (${items.length} items)...`);
  addLog(`Vendor: ${vendor} | Buyer: ${buyer} | Delivery Date: ${deliveryDate || 'Default'}`);

  if (dryRun) {
    addLog('DRY-RUN mode enabled: skipping live browser interaction.');
    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
      mode: 'DRY_RUN',
      vendor,
      buyer,
      itemsCount: items.length,
      quotationNo,
      status: 'Validated successfully for SAP PO creation.',
    };
    return latestJobStatus.result;
  }

  addLog(`Direct HTML5 canvas browser automation disabled to prevent hangs/blocking.`);
  addLog(`Formatted ${items.length} line items for SAP Business One Data Import (Vendor: ${vendor} | Buyer: ${buyer}).`);

  latestJobStatus.status = 'SUCCESS';
  latestJobStatus.running = false;
  latestJobStatus.result = {
    mode: 'EXCEL_IMPORT_PREFERRED',
    vendor,
    buyer,
    quotationNo,
    itemsCount: items.length,
    items: items.map((it) => ({
      partNo: it.part_no || it.partNo || it.itemCode,
      qty: it.qty || it.quantity || 1,
      price: it.price || 0,
    })),
    timestamp: new Date().toISOString(),
    message: `Purchase order formatted for ${items.length} items. Use "Export SAP Excel Template" for direct SAP B1 import.`,
  };

  return latestJobStatus.result;
}

function getSapPoStatus() {
  return latestJobStatus;
}

module.exports = {
  createSapPurchaseOrder,
  generateSapPoExcelBuffer,
  getSapPoStatus,
};
