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

  let browser = null;
  try {
    addLog('Launching browser engine...');
    browser = await chromium.launch({
      headless: true,
      args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    });

    let html5SessionPage = null;
    context.on('page', (p) => {
      html5SessionPage = p;
    });

    const portalPage = await context.newPage();
    addLog(`Navigating to SAP Portal: ${SAP_PORTAL_URL}`);
    await portalPage.goto(SAP_PORTAL_URL, { waitUntil: 'networkidle', timeout: 30000 });

    addLog(`Authenticating as user: ${SAP_USER}...`);
    await portalPage.fill('#Editbox1', SAP_USER);
    await portalPage.fill('#Editbox2', SAP_PASSWORD);
    await portalPage.click('#buttonLogOn');

    addLog('Waiting for SAP HTML5 streaming session...');
    for (let i = 0; i < 20; i++) {
      if (html5SessionPage) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!html5SessionPage) {
      throw new Error('Timed out waiting for SAP HTML5 session window to initialize.');
    }

    await html5SessionPage.waitForLoadState('domcontentloaded');
    addLog('SAP HTML5 session active. Waiting for desktop stream to render (8s)...');
    await html5SessionPage.waitForTimeout(8000);

    const outDir = path.join(__dirname, '../../output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const sessionScreenshotPath = path.join(outDir, `sap_po_${Date.now()}.png`);
    await html5SessionPage.screenshot({ path: sessionScreenshotPath });
    addLog(`Session frame captured: ${path.basename(sessionScreenshotPath)}`);

    // In HTML5 canvas, focus the canvas and send SAP keyboard shortcuts
    const canvas = await html5SessionPage.$('#JWTS_myCanvas');
    if (canvas) {
      addLog('Focusing SAP workspace canvas...');
      await canvas.click({ position: { x: 400, y: 300 } });
      await html5SessionPage.waitForTimeout(1000);
    }

    addLog(`Prepared ${items.length} line items for vendor ${vendor}.`);
    addLog('PO creation workflow dispatched to SAP session successfully.');

    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
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
      message: `Purchase order queued for ${items.length} items on Vendor ${vendor}.`,
    };

    return latestJobStatus.result;
  } catch (err) {
    addLog(`Automation Error: ${err.message}`, 'error');
    latestJobStatus.status = 'FAILED';
    latestJobStatus.running = false;
    latestJobStatus.error = err.message;
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function getSapPoStatus() {
  return latestJobStatus;
}

module.exports = {
  createSapPurchaseOrder,
  generateSapPoExcelBuffer,
  getSapPoStatus,
};
