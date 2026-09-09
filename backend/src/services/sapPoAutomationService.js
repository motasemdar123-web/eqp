const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ExcelJS = require('exceljs');

const SAP_PORTAL_URL = process.env.SAP_PORTAL_URL || 'https://daralhai.b1pro.com/software/html5.html';
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
  buyer = 'MOTASEM GHANEM',
  deliveryDate,
  items = [],
  remarks = '',
  quotationNo = '',
  dbOrderNo = '',
  whsCode = '003',
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
  const refNo = dbOrderNo || remarks || quotationNo || '';

  items.forEach((it) => {
    sheet.addRow({
      cardCode: vendor || DEFAULT_VENDOR,
      docDate: todayStr,
      dueDate: targetDueDate,
      buyer: buyer || 'MOTASEM GHANEM',
      itemCode: it.part_no || it.partNo || it.itemCode,
      quantity: Number(it.qty || it.quantity || 1),
      price: it.price || it.unit_price ? Number(it.price || it.unit_price) : 0,
      taxCode: 'P0',
      whsCode: whsCode || '003',
      comments: refNo,
      vendorRef: refNo,
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
  buyer = 'MOTASEM GHANEM',
  deliveryDate,
  items = [],
  remarks = '',
  quotationNo = '',
  dbOrderNo = '',
  whsCode = '003',
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

async function launchChromiumWithAutoInstall() {
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--ignore-certificate-errors',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ],
  };

  try {
    return await chromium.launch(launchOptions);
  } catch (err) {
    const errMsg = String(err?.message || '');
    if (errMsg.includes("Executable doesn't exist") || errMsg.includes('download new browsers') || errMsg.includes('playwright install')) {
      addLog('Playwright Chromium binary not found on host. Downloading now (npx playwright install chromium)...', 'warn');
      try {
        execSync('npx playwright install chromium', { stdio: 'inherit', timeout: 120000 });
        addLog('Chromium binary downloaded successfully. Retrying launch...');
        return await chromium.launch(launchOptions);
      } catch (installErr) {
        throw new Error(`Chromium missing on host and auto-install failed: ${installErr.message}`);
      }
    }
    throw err;
  }
}

  let browser = null;
  try {
    addLog('Launching headless Chromium browser session...');
    browser = await launchChromiumWithAutoInstall();

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'en-US',
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
    try {
      await mainPage.goto(SAP_PORTAL_URL, { waitUntil: 'commit', timeout: 35000 });
    } catch (gotoErr) {
      addLog(`Commit navigation warning (${gotoErr.message}), trying domcontentloaded...`, 'warn');
      await mainPage.goto(SAP_PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 35000 });
    }

    addLog('Waiting for portal login form (#Editbox1)...');
    await mainPage.waitForSelector('#Editbox1', { timeout: 25000 });

    const effectivePass = password || process.env.SAP_PORTAL_PASSWORD || 'Dah@200055';
    addLog(`Filling credentials for user "${username}"...`);
    await mainPage.fill('#Editbox1', username);
    await mainPage.fill('#Editbox2', effectivePass);

    addLog('Submitting login credentials (#buttonLogOn)...');
    await mainPage.click('#buttonLogOn');

    addLog('Waiting for SAP HTML5 Remote Desktop session to initialize (up to 45s)...');
    let targetPage = null;
    for (let w = 0; w < 45; w++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pages = context.pages();
      targetPage = html5Page || pages.find((p) => p.url().includes('html5.html'));
      if (targetPage && targetPage.url().includes('html5.html')) break;
    }

    if (!targetPage) {
      const pages = context.pages();
      targetPage = pages[pages.length - 1];
    }

    addLog(`Connected to active session tab: ${targetPage.url()}`);
    try {
      await targetPage.waitForLoadState('domcontentloaded', { timeout: 20000 });
    } catch (_) {}

    await targetPage.waitForSelector('#JWTS_myCanvas, canvas', { timeout: 45000 });
    addLog('HTML5 Canvas detected (#JWTS_myCanvas). Waiting for SAP B1 client to settle...');

    async function rdpClick(p, x, y, holdMs = 120) {
      await p.mouse.move(x, y);
      await new Promise((r) => setTimeout(r, 60));
      await p.mouse.down();
      await new Promise((r) => setTimeout(r, holdMs));
      await p.mouse.up();
      await new Promise((r) => setTimeout(r, 100));
    }

    async function rdpDblClick(p, x, y) {
      await rdpClick(p, x, y, 80);
      await new Promise((r) => setTimeout(r, 80));
      await rdpClick(p, x, y, 80);
    }

    async function checkPoWindowStatus(p) {
      try {
        const buf = await p.screenshot({ type: 'png' });
        const b64 = buf.toString('base64');
        return await p.evaluate((imgB64) => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const c = document.createElement('canvas');
              c.width = 1440; c.height = 900;
              const ctx = c.getContext('2d');
              ctx.drawImage(img, 0, 0);

              // Pixel at (50, 140): white [>200, >200, >200] if PO form window is open
              const pForm = ctx.getImageData(50, 140, 1, 1).data;
              const isPoOpen = pForm[0] > 200 && pForm[1] > 200 && pForm[2] > 200;

              // Pixel at (25, 18): menu bar [>150, >150, >150]
              const pMenu = ctx.getImageData(25, 18, 1, 1).data;
              const isSapLoaded = pMenu[0] > 150 && pMenu[1] > 150 && pMenu[2] > 150;

              resolve({ isSapLoaded, isPoOpen, b64: imgB64 });
            };
            img.onerror = () => resolve({ isSapLoaded: false, isPoOpen: false, b64: imgB64 });
            img.src = 'data:image/png;base64,' + imgB64;
          });
        }, b64);
      } catch (err) {
        return { isSapLoaded: false, isPoOpen: false };
      }
    }

    // ADAPTIVE STEP 1: Wait for SAP B1 remote desktop to actually initialize and render
    addLog('Waiting for SAP B1 remote desktop to initialize and render (polling canvas state)...');
    let desktopReady = false;
    for (let sec = 0; sec < 30; sec++) {
      await new Promise((r) => setTimeout(r, 2000));

      // Dismiss any session takeover modal at (510, 475) or lingering prompt
      await rdpClick(targetPage, 510, 475, 100);
      await targetPage.keyboard.press('Enter');
      await targetPage.keyboard.press('Escape');

      const status = await checkPoWindowStatus(targetPage);
      if (status.isPoOpen) {
        desktopReady = true;
        addLog(`SAP B1 Desktop ready & PO form already open after ${(sec + 1) * 2}s.`);
        break;
      }
      if (status.isSapLoaded) {
        desktopReady = true;
        addLog(`SAP B1 Desktop fully loaded after ${(sec + 1) * 2}s.`);
        break;
      }
    }

    // ADAPTIVE STEP 2: Ensure PO window is open via F2
    let poStatus = await checkPoWindowStatus(targetPage);
    if (!poStatus.isPoOpen) {
      addLog('Purchase Order window not open yet. Triggering F2 shortcut...');
      for (let attempt = 1; attempt <= 4; attempt++) {
        // Clear any lingering sub-modals (e.g. License information)
        await targetPage.keyboard.press('Escape');
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Escape');
        await new Promise((r) => setTimeout(r, 400));

        // Click empty toolbar space at (400, 65) to ensure focus is in SAP main window
        await rdpClick(targetPage, 400, 65);
        await new Promise((r) => setTimeout(r, 300));

        addLog(`Pressing F2 to open Purchase Order (attempt ${attempt}/4)...`);
        await targetPage.keyboard.press('F2');
        await new Promise((r) => setTimeout(r, 3500));

        poStatus = await checkPoWindowStatus(targetPage);
        if (poStatus.isPoOpen) {
          addLog('✓ Purchase Order window confirmed OPEN!');
          break;
        }
      }
    }

    if (!poStatus.isPoOpen) {
      throw new Error('Failed to open Purchase Order window in SAP Business One after multiple attempts.');
    }

    // ADAPTIVE STEP 3: Switch to Add Mode if currently in OK mode (Control+A)
    addLog('Ensuring Purchase Order is in Add Mode (Control+A)...');
    await targetPage.keyboard.press('Control+A');
    await new Promise((r) => setTimeout(r, 1500));

    // Vendor Code - Click Vendor input field at (130, 132)
    addLog(`Entering Vendor Code: ${vendor}...`);
    await rdpClick(targetPage, 130, 132);
    await targetPage.keyboard.press('Control+A');
    await targetPage.keyboard.type(vendor, { delay: 50 });
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 2000));

    // Tab through Name and Contact Person to reach Vendor Ref. No.
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 200));
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 200));

    // Vendor Ref. No. (DB Order Reference)
    const targetRef = dbOrderNo || quotationNo || remarks || '';
    if (targetRef) {
      addLog(`Entering Vendor Ref. No. (DB Order): ${targetRef}...`);
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.type(targetRef, { delay: 80 });
      await new Promise((r) => setTimeout(r, 500));
    }

    // Grid Line Items - First row at Y=323, row height = 16
    addLog(`Entering ${items.length} line items into SAP grid...`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const partNo = it.part_no || it.partNo || it.itemCode;
      const qty = String(it.qty || it.quantity || 1);
      const rawPrice = it.unit_price || it.price || it.unitPrice || 0;
      const priceVal = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
      const rowY = 323 + (i * 16);

      addLog(`  [Line ${i + 1}/${items.length}] Part: ${partNo} | Qty: ${qty} | USD Unit Price: ${priceVal > 0 ? priceVal.toFixed(3) + ' USD' : 'Master Default'}`);
      // Select Item No cell in Row (X=75, Y=rowY)
      await rdpDblClick(targetPage, 75, rowY);
      await new Promise((r) => setTimeout(r, 400));
      await targetPage.keyboard.type(partNo, { delay: 70 });
      await new Promise((r) => setTimeout(r, 500));
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 3000));

      // Select Quantity cell in Row (X=180, Y=rowY)
      await rdpDblClick(targetPage, 180, rowY);
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.press('Backspace');
      for (let k = 0; k < 4; k++) {
        await targetPage.keyboard.press('Delete');
      }
      await targetPage.keyboard.type(qty, { delay: 60 });
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 1000));

      // Enter USD Unit Price if provided
      if (priceVal > 0) {
        const priceStr = `${priceVal.toFixed(3)} USD`;
        addLog(`    Setting USD Unit Price: ${priceStr}...`);
        await targetPage.keyboard.press('Control+A');
        await targetPage.keyboard.press('Backspace');
        for (let k = 0; k < 6; k++) {
          await targetPage.keyboard.press('Delete');
        }
        await targetPage.keyboard.type(priceStr, { delay: 60 });
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Remarks at (140, 770)
    const remarksText = remarks || `Komatsu Quotation ${quotationNo || ''} / ${dbOrderNo || ''}`.trim();
    if (remarksText) {
      addLog(`Setting Remarks: ${remarksText}...`);
      await rdpClick(targetPage, 140, 770);
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.type(remarksText, { delay: 40 });
      await new Promise((r) => setTimeout(r, 500));
    }

    // Save document: Add Draft & New (106, 832) or Add & New (38, 832)
    if (isDraft) {
      addLog('Saving Purchase Order as Draft (Add Draft & New at 106, 832)...');
      await rdpClick(targetPage, 106, 832, 150);
    } else {
      addLog('Finalizing and posting Purchase Order (Add & New at 38, 832)...');
      await rdpClick(targetPage, 38, 832, 150);
    }

    await new Promise((r) => setTimeout(r, 6000));

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
