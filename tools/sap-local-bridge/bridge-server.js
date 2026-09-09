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
  headless = false,
}) {
  if (!items || items.length === 0) {
    throw new Error('Cannot create Purchase Order without line items.');
  }

  latestJobStatus = {
    running: true,
    lastRun: new Date().toISOString(),
    status: 'IN_PROGRESS',
    currentStep: 'Initializing automation...',
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
    await page.goto(SAP_PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    addLog(`Filling credentials for user "${effectiveUser}"...`);
    await page.waitForSelector('#Editbox1', { timeout: 20000 });
    await page.fill('#Editbox1', effectiveUser);

    // Trigger onblur to start TSPlus checkLogin() AJAX request that reveals Editbox2
    await page.evaluate(() => {
      const u = document.getElementById('Editbox1');
      if (u) u.blur();
    });

    addLog('Waiting for password field to be activated by portal...');
    const passInput = await page.waitForSelector('#Editbox2', { state: 'visible', timeout: 20000 });
    await passInput.fill(effectivePass);
    await new Promise((r) => setTimeout(r, 400));

    addLog('Submitting login form (#buttonLogOn)...');
    await page.click('#buttonLogOn');

    addLog('Waiting for SAP HTML5 Remote Desktop session to load...');
    let targetPage = null;
    for (let s = 1; s <= 45; s++) {
      await new Promise((r) => setTimeout(r, 1000));
      const pages = context.pages();
      for (const p of pages) {
        const hasCanvas = await p.evaluate(() => !!document.querySelector('#JWTS_myCanvas, canvas')).catch(() => false);
        if (hasCanvas) {
          targetPage = p;
          break;
        }
      }
      if (targetPage) break;
    }

    if (!targetPage) {
      const pages = context.pages();
      targetPage = pages.find((p) => p.url().includes('html5.html')) || pages[pages.length - 1];
    }

    addLog(`Connected to active session tab: ${targetPage.url()}`);
    await targetPage.waitForSelector('#JWTS_myCanvas, canvas', { timeout: 15000 });
    addLog('HTML5 Canvas detected (#JWTS_myCanvas). Waiting 12s for SAP B1 desktop to stabilize...');

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

    async function updateSnapshot(stepName) {
      try {
        latestJobStatus.currentStep = stepName;
        const buf = await targetPage.screenshot({ type: 'png' }).catch(() => null);
        if (buf) {
          latestJobStatus.screenshotBase64 = `data:image/png;base64,${buf.toString('base64')}`;
        }
      } catch {}
    }

    async function checkScreenState(p) {
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

              // 1. Menu bar at (25, 18) - top left "File" / menu bar
              const pMenu = ctx.getImageData(25, 18, 1, 1).data;
              const isMenuLoaded = pMenu[0] > 100 || pMenu[1] > 100 || pMenu[2] > 100;

              // 2. Center of screen at (720, 450): TSPlus loading spinner is [247, 243, 247]
              const pCenter = ctx.getImageData(720, 450, 1, 1).data;
              const isSpinnerActive = (pCenter[0] >= 240 && pCenter[1] >= 235 && pCenter[2] >= 240);

              // 3. PO Window Title bar at (500, 100): dark navy blue [41, 77, 107]
              const pTitle = ctx.getImageData(500, 100, 1, 1).data;
              const isBlueTitle = (pTitle[0] >= 30 && pTitle[0] <= 65) &&
                                  (pTitle[1] >= 60 && pTitle[1] <= 100) &&
                                  (pTitle[2] >= 90 && pTitle[2] <= 135);

              // 4. Check for 'Vendor' label text pixels at X=14..36, Y=132..138
              let vendorLabelCount = 0;
              for (let y = 132; y <= 138; y++) {
                for (let x = 14; x <= 36; x++) {
                  const pt = ctx.getImageData(x, y, 1, 1).data;
                  if (pt[0] < 50 && pt[1] < 50 && pt[2] < 50) vendorLabelCount++;
                }
              }

              // 5. Add & New button at (52, 840)
              const pAddBtn = ctx.getImageData(52, 840, 1, 1).data;
              const isAddBtn = (pAddBtn[0] >= 30 && pAddBtn[0] <= 65) &&
                               (pAddBtn[1] >= 60 && pAddBtn[1] <= 100) &&
                               (pAddBtn[2] >= 90 && pAddBtn[2] <= 135);

              const isPoOpen = isBlueTitle && (vendorLabelCount >= 5 || isAddBtn);
              const isBpListOpen = isBlueTitle && !isPoOpen;
              const isSapReady = isMenuLoaded && !isSpinnerActive;

              resolve({ isSapReady, isPoOpen, isBpListOpen, isSpinnerActive, isBlueTitle, isAddBtn, b64: imgB64 });
            };
            img.onerror = () => resolve({ isSapReady: false, isPoOpen: false, isBpListOpen: false, isSpinnerActive: true, b64: imgB64 });
            img.src = 'data:image/png;base64,' + imgB64;
          });
        }, b64);
      } catch (err) {
        return { isSapReady: false, isPoOpen: false, isBpListOpen: false, isSpinnerActive: true };
      }
    }

    // STEP 1: Wait for SAP B1 remote desktop to actually initialize and render (waiting for loading spinner to clear)
    addLog('Waiting for SAP B1 remote desktop to initialize and render (waiting for loading spinner to clear)...');
    let desktopReady = false;
    for (let sec = 1; sec <= 30; sec++) {
      await new Promise((r) => setTimeout(r, 2000));

      // Dismiss any session takeover modal at (510, 475) or lingering prompt
      await rdpClick(targetPage, 510, 475, 100);
      await targetPage.keyboard.press('Enter');

      const status = await checkScreenState(targetPage);
      if (status.b64) {
        latestJobStatus.screenshotBase64 = `data:image/png;base64,${status.b64}`;
      }

      addLog(`[${sec * 2}s] SAP Desktop Ready: ${status.isSapReady} | Loading Spinner: ${status.isSpinnerActive} | PO Window Open: ${status.isPoOpen}`);

      if (status.isPoOpen) {
        desktopReady = true;
        addLog(`✓ SAP B1 Desktop ready & Purchase Order window already open after ${sec * 2}s.`);
        break;
      }
      if (status.isSapReady) {
        desktopReady = true;
        addLog(`✓ SAP B1 Desktop fully loaded and ready after ${sec * 2}s.`);
        break;
      }
      await updateSnapshot(`Loading SAP B1 Desktop (${sec * 2}s)...`);
    }

    // STEP 2: Ensure PO window is open (close stray BP List modal if open)
    let poStatus = await checkScreenState(targetPage);

    if (poStatus.isBpListOpen) {
      addLog('Stray Business Partner list detected. Closing with Escape...');
      await targetPage.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 800));
      await targetPage.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 800));
      poStatus = await checkScreenState(targetPage);
    }

    if (!poStatus.isPoOpen) {
      addLog('Purchase Order window not open yet. Opening via Modules menu...');
      for (let attempt = 1; attempt <= 3; attempt++) {
        // Clear any lingering sub-modals
        await targetPage.keyboard.press('Escape');
        await new Promise((r) => setTimeout(r, 300));

        // Click Modules menu at (268, 18)
        await rdpClick(targetPage, 268, 18);
        await new Promise((r) => setTimeout(r, 800));
        await targetPage.keyboard.press('p'); // Purchasing - A/P
        await new Promise((r) => setTimeout(r, 500));
        await targetPage.keyboard.press('ArrowRight'); // Open submenu
        await new Promise((r) => setTimeout(r, 500));
        await targetPage.keyboard.press('ArrowDown');
        await targetPage.keyboard.press('ArrowDown');
        await targetPage.keyboard.press('ArrowDown'); // Purchase Order
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Enter');
        await new Promise((r) => setTimeout(r, 4000));
        await updateSnapshot(`Opened via Modules Menu (Attempt ${attempt})`);

        poStatus = await checkScreenState(targetPage);
        addLog(`Attempt ${attempt} result -> PO Window Open: ${poStatus.isPoOpen}`);
        if (poStatus.isPoOpen) {
          addLog('✓ Purchase Order window confirmed OPEN via Modules menu!');
          break;
        }

        // Fallback: If Modules menu did not open PO, try F2 shortcut fallback
        if (attempt === 2) {
          addLog('Trying F2 shortcut fallback...');
          await rdpClick(targetPage, 400, 65);
          await new Promise((r) => setTimeout(r, 300));
          await targetPage.keyboard.press('F2');
          await new Promise((r) => setTimeout(r, 4000));
          poStatus = await checkScreenState(targetPage);
          if (poStatus.isPoOpen) break;
        }
      }
    }

    if (!poStatus.isPoOpen) {
      throw new Error('Failed to open Purchase Order window in SAP Business One after multiple attempts.');
    }

    // STEP 3: Switch to Add Mode if currently in OK mode (Control+A)
    if (!poStatus.isAddBtn) {
      addLog('Ensuring Purchase Order is in Add Mode (Control+A)...');
      await targetPage.keyboard.press('Control+A');
      await new Promise((r) => setTimeout(r, 1500));
    }
    await updateSnapshot('Purchase Order Form Open & Ready');

    // STEP 4: Enter Vendor Code - Click Vendor input field at (175, 135)
    addLog(`Entering Vendor Code: ${vendor}...`);
    await rdpClick(targetPage, 175, 135);
    await new Promise((r) => setTimeout(r, 300));
    await targetPage.keyboard.press('Control+A');
    await targetPage.keyboard.type(vendor, { delay: 50 });
    await new Promise((r) => setTimeout(r, 300));
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 2000));

    // Confirm any selection modal / List of Business Partners if it appeared
    const bpState = await checkScreenState(targetPage);
    if (bpState.isBpListOpen) {
      addLog('Business Partner selection list opened. Selecting matched vendor with Enter...');
      await targetPage.keyboard.press('Enter');
      await new Promise((r) => setTimeout(r, 1500));
    }

    // STEP 5: Enter Vendor Ref. No. (DB Order Reference) at (175, 175)
    const targetRef = dbOrderNo || quotationNo || remarks || '';
    if (targetRef) {
      addLog(`Entering Vendor Ref. No. (DB Order): ${targetRef}...`);
      await rdpClick(targetPage, 175, 175);
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.type(targetRef, { delay: 60 });
      await new Promise((r) => setTimeout(r, 500));
    }
    await updateSnapshot('Vendor & Reference Entered');

    // STEP 6: Grid Line Items - First row at Y=324, row height = 16
    addLog(`Entering ${items.length} line items into SAP grid...`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const partNo = it.part_no || it.partNo || it.itemCode;
      const qty = String(it.qty || it.quantity || 1);
      const rawPrice = it.unit_price || it.price || it.unitPrice || 0;
      const priceVal = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
      const rowY = 324 + (i * 16);

      addLog(`  [Line ${i + 1}/${items.length}] Part: ${partNo} | Qty: ${qty} | Unit Price: ${priceVal > 0 ? priceVal.toFixed(3) + ' USD' : 'Master Default'}`);

      // Select Item No cell in Row (X=95, Y=rowY)
      await rdpDblClick(targetPage, 95, rowY);
      await new Promise((r) => setTimeout(r, 400));
      await targetPage.keyboard.type(partNo, { delay: 70 });
      await new Promise((r) => setTimeout(r, 500));
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 3000));

      // Select Quantity cell in Row (X=260, Y=rowY)
      await rdpDblClick(targetPage, 260, rowY);
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.press('Backspace');
      for (let k = 0; k < 6; k++) {
        await targetPage.keyboard.press('Delete');
      }
      await targetPage.keyboard.type(qty, { delay: 60 });
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 1000));

      // Enter USD Unit Price if provided
      if (priceVal > 0) {
        const priceStr = `${priceVal.toFixed(3)} USD`;
        addLog(`    Setting USD Unit Price at (325, ${rowY}): ${priceStr}...`);
        await rdpDblClick(targetPage, 325, rowY);
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Control+A');
        await targetPage.keyboard.press('Backspace');
        for (let k = 0; k < 8; k++) {
          await targetPage.keyboard.press('Delete');
        }
        await targetPage.keyboard.type(priceStr, { delay: 60 });
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 1000));
      }

      await updateSnapshot(`Line Item ${i + 1} Entered (${partNo})`);
    }

    // STEP 7: Remarks at (140, 850)
    const remarksText = remarks || `Komatsu Quotation ${quotationNo || ''} / ${dbOrderNo || ''}`.trim();
    if (remarksText) {
      addLog(`Setting Remarks: ${remarksText}...`);
      await rdpClick(targetPage, 140, 850);
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.type(remarksText, { delay: 40 });
      await new Promise((r) => setTimeout(r, 500));
    }
    await updateSnapshot('PO Completed - Ready to Save');

    // STEP 8: Save document: Add Draft & New (149, 840) or Add & New (52, 840)
    if (isDraft) {
      addLog('Saving Purchase Order as Draft (Add Draft & New at 149, 840)...');
      await rdpClick(targetPage, 149, 840, 150);
    } else {
      addLog('Finalizing and posting Purchase Order (Add & New at 52, 840)...');
      await rdpClick(targetPage, 52, 840, 150);
    }

    await new Promise((r) => setTimeout(r, 5000));
    // Confirm any SAP dialog (e.g. "Exchange rate", "Document saved", etc.)
    await targetPage.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 2000));
    await updateSnapshot('Saved Confirmation');

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
