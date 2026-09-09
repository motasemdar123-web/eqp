const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function resolveModule(name) {
  try {
    return require(name);
  } catch (err) {
    try {
      return require(path.join(__dirname, '../../backend/node_modules', name));
    } catch {
      throw new Error(`Module "${name}" not found. Run "npm install" in this directory.`);
    }
  }
}

const express = resolveModule('express');
const cors = resolveModule('cors');
const { chromium } = resolveModule('playwright');

const app = express();
const PORT = process.env.BRIDGE_PORT || 5005;
const SAP_PORTAL_URL = process.env.SAP_PORTAL_URL || 'https://daralhai.b1pro.com/software/html5.html';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

let latestJobStatus = {
  running: false,
  lastRun: null,
  status: 'IDLE',
  logs: [],
  error: null,
  result: null,
  screenshotBase64: null,
};

function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { timestamp, message, type };
  latestJobStatus.logs.push(entry);
  if (latestJobStatus.logs.length > 100) latestJobStatus.logs.shift();
  console.log(`[SAP-LOCAL-BRIDGE] [${timestamp}] [${type.toUpperCase()}]: ${message}`);
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    bridge: 'SAP_LOCAL_BRIDGE',
    version: '1.0.0',
    port: PORT,
    localNetwork: true,
    running: latestJobStatus.running,
    message: 'Local Bridge is running and connected to your office network',
  });
});

app.get('/api/sap-po/status', (req, res) => {
  res.json({ success: true, ...latestJobStatus });
});

async function runLocalSapPoAutomation({
  username,
  password,
  vendor = 'V000006',
  buyer = 'MOTASEM GHANEM',
  deliveryDate,
  items = [],
  remarks = '',
  quotationNo = '',
  dbOrderNo = '',
  whsCode = '003',
  dryRun = false,
  isDraft = true,
  headless = true,
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
    screenshotBase64: null,
  };

  const effectiveUser = username || process.env.SAP_PORTAL_USER || 'DAH38';
  const effectivePass = password || process.env.SAP_PORTAL_PASSWORD || 'Dah@200055';

  addLog(`Starting Local SAP PO Automation for Quotation #${quotationNo || 'Direct'} (${items.length} items)...`);
  addLog(`User: ${effectiveUser} | Vendor: ${vendor} | Buyer: ${buyer} | Mode: ${isDraft ? 'Draft PO' : 'Final PO'}`);
  addLog(`Local Network Origin: Unrestricted direct connection to ${SAP_PORTAL_URL}`);

  if (dryRun) {
    addLog('DRY-RUN mode enabled: validating payload only.');
    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
      mode: 'DRY_RUN',
      vendor,
      buyer,
      itemsCount: items.length,
      quotationNo,
      message: 'Validated successfully in local bridge.',
    };
    return latestJobStatus.result;
  }

  let browser = null;
  try {
    addLog(`Launching Chromium browser session (headless=${headless})...`);
    browser = await chromium.launch({
      headless: Boolean(headless),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    let html5Page = null;
    context.on('page', (p) => {
      addLog(`New tab opened: ${p.url() || 'initializing...'}`);
      if (p.url().includes('html5.html') || p.url() === 'about:blank') {
        html5Page = p;
      }
    });

    const page = await context.newPage();
    addLog(`Navigating to TSPlus Logon Portal (${SAP_PORTAL_URL})...`);
    await page.goto(SAP_PORTAL_URL, { waitUntil: 'commit', timeout: 25000 });

    addLog(`Filling credentials for user "${effectiveUser}"...`);
    const userInput = await page.waitForSelector('#Editbox1', { timeout: 20000 });
    await userInput.fill(effectiveUser);

    const passInput = await page.waitForSelector('#Editbox2', { timeout: 10000 });
    await passInput.fill(effectivePass);

    addLog('Submitting login form (#buttonLogOn)...');
    const submitBtn = await page.waitForSelector('#buttonLogOn', { timeout: 10000 });
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await passInput.press('Enter');
    }

    addLog('Waiting for SAP HTML5 Remote Desktop session to load...');
    let targetPage = null;
    for (let i = 0; i < 30; i++) {
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
    await targetPage.waitForSelector('#JWTS_myCanvas, canvas', { timeout: 35000 });
    addLog('HTML5 Canvas detected (#JWTS_myCanvas). Waiting 12s for SAP B1 desktop to stabilize...');

    // Wait for the desktop stream to stabilize
    await new Promise((r) => setTimeout(r, 12000));

    // Focus canvas and dismiss any warning / concurrent user dialogs
    addLog('Focusing SAP canvas and dismissing session dialogs...');
    await targetPage.mouse.click(500, 300);
    await new Promise((r) => setTimeout(r, 500));
    await targetPage.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 2000));

    // Navigate to Modules -> Purchasing - A/P -> Purchase Order
    addLog('Navigating to Modules > Purchasing - A/P > Purchase Order...');
    await targetPage.mouse.click(166, 18);
    await new Promise((r) => setTimeout(r, 600));

    // Move to Modules dropdown
    await targetPage.keyboard.press('ArrowRight');
    await new Promise((r) => setTimeout(r, 200));
    await targetPage.keyboard.press('ArrowRight');
    await new Promise((r) => setTimeout(r, 400));

    // Select Purchasing - A/P
    await targetPage.keyboard.press('p');
    await new Promise((r) => setTimeout(r, 400));

    // Open Purchasing submenu
    await targetPage.keyboard.press('ArrowRight');
    await new Promise((r) => setTimeout(r, 400));

    // Move down 3 items to Purchase Order (Item 1: Blanket, 2: Req, 3: Quot, 4: PO)
    await targetPage.keyboard.press('ArrowDown');
    await new Promise((r) => setTimeout(r, 200));
    await targetPage.keyboard.press('ArrowDown');
    await new Promise((r) => setTimeout(r, 200));
    await targetPage.keyboard.press('ArrowDown');
    await new Promise((r) => setTimeout(r, 400));

    // Open Purchase Order form
    await targetPage.keyboard.press('Enter');
    addLog('Purchase Order form triggered. Waiting 4s for window render...');
    await new Promise((r) => setTimeout(r, 4000));

    // Vendor Code
    addLog(`Entering Vendor Code: ${vendor}...`);
    await targetPage.keyboard.type(vendor, { delay: 80 });
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 1200));

    // Vendor Ref. No. (DB Order Reference)
    const targetRef = dbOrderNo || remarks || quotationNo || '';
    if (targetRef) {
      addLog(`Entering Vendor Ref. No. (DB Order): ${targetRef}...`);
      await targetPage.keyboard.press('Tab'); // Contact Person
      await new Promise((r) => setTimeout(r, 250));
      await targetPage.keyboard.press('Tab'); // Vendor Ref. No.
      await new Promise((r) => setTimeout(r, 250));
      await targetPage.keyboard.type(targetRef, { delay: 60 });
      await targetPage.keyboard.press('Tab'); // BP Currency
      await new Promise((r) => setTimeout(r, 250));
      await targetPage.keyboard.press('Tab'); // Item/Service Type
      await new Promise((r) => setTimeout(r, 250));
      await targetPage.keyboard.press('Tab'); // Grid Item No
      await new Promise((r) => setTimeout(r, 500));
    }

    // Grid Items
    addLog(`Entering ${items.length} line items into SAP grid...`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const partNo = it.part_no || it.partNo || it.itemCode;
      const qty = String(it.qty || it.quantity || 1);

      addLog(`  [Line ${i + 1}/${items.length}] Part: ${partNo} | Qty: ${qty}`);
      await targetPage.keyboard.type(partNo, { delay: 60 });
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 700));

      // Move to Quantity
      await targetPage.keyboard.press('Tab');
      await targetPage.keyboard.type(qty, { delay: 60 });
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 350));

      // Next Row
      await targetPage.keyboard.press('ArrowDown');
      await new Promise((r) => setTimeout(r, 350));
    }

    // Save document
    if (isDraft) {
      addLog('Saving Purchase Order as Draft (Ctrl+D)...');
      await targetPage.keyboard.press('Control+D');
    } else {
      addLog('Finalizing and posting Purchase Order (Ctrl+A)...');
      await targetPage.keyboard.press('Control+A');
    }

    await new Promise((r) => setTimeout(r, 2500));

    // Capture confirmation screenshot
    const screenshotBuffer = await targetPage.screenshot({ type: 'png' }).catch(() => null);
    if (screenshotBuffer) {
      latestJobStatus.screenshotBase64 = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;
    }

    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
      mode: isDraft ? 'DRAFT_PO_CREATED' : 'PO_CREATED',
      vendor,
      buyer,
      quotationNo,
      itemsCount: items.length,
      screenshotBase64: latestJobStatus.screenshotBase64,
      timestamp: new Date().toISOString(),
      message: `Successfully created Purchase Order for ${items.length} items in SAP Business One via Local Bridge!`,
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

app.post('/api/sap-po/execute', async (req, res) => {
  const { async: isAsync, ...payload } = req.body || {};

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Array of items is required.' });
  }

  const execution = runLocalSapPoAutomation(payload);

  if (isAsync) {
    execution.catch((err) => {
      console.error('[SAP-LOCAL-BRIDGE] Execution error:', err.message);
    });
    return res.json({ success: true, started: true, message: 'Local SAP automation started.' });
  }

  try {
    const result = await execution;
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('=======================================================');
  console.log(`  SAP Local Bridge Companion Server is ACTIVE!`);
  console.log(`  Listening on: http://127.0.0.1:${PORT}`);
  console.log(`  Office Network Access: READY`);
  console.log('=======================================================');
});
