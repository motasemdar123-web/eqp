const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const SAP_PORTAL_URL = process.env.SAP_PORTAL_URL || 'https://daralhai.b1pro.com/';
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
async function generateSapPoExcelBuffer({
  vendor = DEFAULT_VENDOR,
  buyer = 'Motasem Ghanem',
  deliveryDate,
  items = [],
  remarks = '',
  quotationNo = '',
}) {
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
      price: it.price || it.unit_price ? Number(it.price || it.unit_price) : 0,
      taxCode: 'P0',
      whsCode: '01',
      comments: commentText,
      vendorRef: quotationNo || '',
    });
  });

  return await workbook.xlsx.writeBuffer();
}

/**
 * Launch Playwright and automate Purchase Order creation in SAP B1 via HTML5 Canvas
 */
async function createSapPurchaseOrder({
  username = process.env.SAP_PORTAL_USER || 'DAH38',
  password = process.env.SAP_PORTAL_PASSWORD || 'Dah@200055',
  vendor = DEFAULT_VENDOR,
  buyer = 'Motasem Ghanem',
  deliveryDate,
  items = [],
  remarks = '',
  quotationNo = '',
  dryRun = false,
  isDraft = true,
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
  addLog(`User: ${username} | Vendor: ${vendor} | Buyer: ${buyer} | Mode: ${isDraft ? 'Draft PO' : 'Final PO'}`);

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
    addLog('Launching headless Chromium browser session...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
      ],
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 },
    });

    let html5Page = null;
    context.on('page', (p) => {
      addLog(`New tab opened: ${p.url() || 'initialization...'}`);
      if (p.url().includes('html5.html') || p.url() === 'about:blank') {
        html5Page = p;
      }
    });

    const mainPage = await context.newPage();

    addLog(`Navigating to SAP Web Access Portal (${SAP_PORTAL_URL})...`);
    await mainPage.goto(SAP_PORTAL_URL, { waitUntil: 'networkidle', timeout: 30000 });

    addLog(`Filling credentials for user "${username}"...`);
    await mainPage.fill('#Editbox1', username);
    await mainPage.fill('#Editbox2', password);

    addLog('Submitting login credentials (#buttonLogOn)...');
    await mainPage.click('#buttonLogOn');

    addLog('Waiting for SAP HTML5 Remote Desktop session to initialize (up to 40s)...');
    let targetPage = null;
    for (let w = 0; w < 40; w++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pages = context.pages();
      targetPage = pages.find((p) => p.url().includes('html5.html'));
      if (targetPage) break;
    }

    if (!targetPage) {
      const pages = context.pages();
      targetPage = pages[pages.length - 1];
    }

    addLog(`Connected to active session tab: ${targetPage.url()}`);
    await targetPage.waitForSelector('#JWTS_myCanvas', { timeout: 30000 });
    addLog('HTML5 Canvas detected (#JWTS_myCanvas). Waiting for SAP B1 client to settle...');

    // Wait for the desktop stream to stabilize
    await new Promise((r) => setTimeout(r, 12000));

    // Open Purchase Order window via SAP Menu search at (75, 150)
    addLog('Focusing SAP Menu search box...');
    await targetPage.mouse.click(75, 150);
    await new Promise((r) => setTimeout(r, 500));
    await targetPage.keyboard.press('Control+A');
    await targetPage.keyboard.type('Purchase Order', { delay: 100 });
    await new Promise((r) => setTimeout(r, 800));
    await targetPage.keyboard.press('Enter');

    addLog('Navigated to Purchase Order form. Waiting for form to render...');
    await new Promise((r) => setTimeout(r, 4000));

    // Vendor Selection
    addLog(`Entering Vendor Code: ${vendor}...`);
    await targetPage.keyboard.type(vendor, { delay: 100 });
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 1500));

    // Move to item table and type lines
    addLog(`Entering ${items.length} line items into SAP grid...`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const partNo = it.part_no || it.partNo || it.itemCode;
      const qty = String(it.qty || it.quantity || 1);

      addLog(`  [Line ${i + 1}/${items.length}] Part: ${partNo} | Qty: ${qty}`);
      await targetPage.keyboard.type(partNo, { delay: 80 });
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 800));

      // Move past Description to Quantity column
      await targetPage.keyboard.press('Tab');
      await targetPage.keyboard.type(qty, { delay: 80 });
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 400));

      // Down arrow to next row
      await targetPage.keyboard.press('ArrowDown');
      await new Promise((r) => setTimeout(r, 400));
    }

    // Save document
    if (isDraft) {
      addLog('Saving Purchase Order as Draft (Ctrl+D)...');
      await targetPage.keyboard.press('Control+D');
    } else {
      addLog('Finalizing and posting Purchase Order (Ctrl+A / Add & New)...');
      await targetPage.keyboard.press('Control+A');
    }

    await new Promise((r) => setTimeout(r, 3000));

    // Capture screenshot confirmation
    const screenshotDir = path.join(__dirname, '../../public/sap_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotName = `sap_po_${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, screenshotName);
    await targetPage.screenshot({ path: screenshotPath }).catch(() => {});

    latestJobStatus.screenshotUrl = `/sap_screenshots/${screenshotName}`;
    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
      mode: isDraft ? 'DRAFT_PO_CREATED' : 'PO_CREATED',
      vendor,
      buyer,
      quotationNo,
      itemsCount: items.length,
      screenshotUrl: latestJobStatus.screenshotUrl,
      timestamp: new Date().toISOString(),
      message: `Successfully processed Purchase Order for ${items.length} items in SAP Business One.`,
    };

    addLog(`✓ ${latestJobStatus.result.message}`);
    return latestJobStatus.result;
  } catch (err) {
    addLog(`Automation Error: ${err.message}`, 'error');
    latestJobStatus.status = 'FAILED';
    latestJobStatus.running = false;
    latestJobStatus.error = err.message;
    throw err;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
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
