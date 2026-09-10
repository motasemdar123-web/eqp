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
              c.width = img.width;
              c.height = img.height;
              const ctx = c.getContext('2d');
              ctx.drawImage(img, 0, 0);

              // 1. Menu bar analysis along Y=18
              const menuBgSample = ctx.getImageData(5, 18, 1, 1).data;
              const menuBg = [menuBgSample[0], menuBgSample[1], menuBgSample[2]];
              const isMenuPresent = (menuBg[0] > 15 || menuBg[1] > 30 || menuBg[2] > 50);

              const words = [];
              if (isMenuPresent) {
                let inWord = false;
                let wordStart = 0;
                for (let x = 10; x < 400; x++) {
                  let isTextPixel = false;
                  for (let y = 14; y <= 22; y++) {
                    const d = ctx.getImageData(x, y, 1, 1).data;
                    const diff = Math.abs(d[0] - menuBg[0]) + Math.abs(d[1] - menuBg[1]) + Math.abs(d[2] - menuBg[2]);
                    if (diff > 40) { isTextPixel = true; break; }
                  }
                  if (isTextPixel) {
                    if (!inWord) { inWord = true; wordStart = x; }
                  } else if (inWord) {
                    let gap = 0;
                    for (let g = x; g < Math.min(x + 4, 400); g++) {
                      let tp = false;
                      for (let y = 14; y <= 22; y++) {
                        const d = ctx.getImageData(g, y, 1, 1).data;
                        const diff = Math.abs(d[0] - menuBg[0]) + Math.abs(d[1] - menuBg[1]) + Math.abs(d[2] - menuBg[2]);
                        if (diff > 40) { tp = true; break; }
                      }
                      if (!tp) gap++; else break;
                    }
                    if (gap >= 3 || x === 399) {
                      inWord = false;
                      words.push({
                        start: wordStart,
                        end: x - 1,
                        center: Math.round((wordStart + x - 1) / 2),
                        width: x - wordStart,
                      });
                    }
                  }
                }
              }

              let modulesCenter = null;
              const modCandidate = words.find((w) => w.width >= 35 && w.center >= 190 && w.center <= 270);
              if (modCandidate) {
                modulesCenter = modCandidate.center;
              } else if (words.length >= 6) {
                const w6 = words[6] || words[5];
                if (w6) modulesCenter = w6.center;
              }
              if (!modulesCenter && words.length >= 3) {
                modulesCenter = 229;
              }

              // 2. Check if dropdown is open below modulesCenter
              let isDropdownOpen = false;
              if (modulesCenter) {
                const dropSample = ctx.getImageData(modulesCenter, 45, 1, 1).data;
                if (dropSample[0] > 210 && dropSample[1] > 210 && dropSample[2] > 210) {
                  isDropdownOpen = true;
                }
              }

              // 3. Dashboard / Cockpit Window check
              let isDashboardPresent = false;
              for (let y = 145; y <= 250; y++) {
                const p = ctx.getImageData(300, y, 1, 1).data;
                if (p[0] > 170 && p[1] > 120 && p[2] < 70) {
                  const pTitle = ctx.getImageData(300, y + 20, 1, 1).data;
                  if (pTitle[0] >= 20 && pTitle[0] <= 90 && pTitle[1] >= 45 && pTitle[1] <= 130 && pTitle[2] >= 75 && pTitle[2] <= 170) {
                    isDashboardPresent = true;
                    break;
                  }
                }
              }

              // 4. Purchase Order Document Window & Business Partner Modal check
              let titlePixels = 0;
              for (let y = 90; y <= 115; y++) {
                for (let x = 7; x <= 100; x++) {
                  const d = ctx.getImageData(x, y, 1, 1).data;
                  if (d[0] > 180 && d[1] > 180 && d[2] > 180) titlePixels++;
                }
              }

              let vendorLabelPixels = 0;
              for (let y = 130; y <= 140; y++) {
                for (let x = 5; x <= 45; x++) {
                  const d = ctx.getImageData(x, y, 1, 1).data;
                  if (d[0] < 80 && d[1] < 80 && d[2] < 80) vendorLabelPixels++;
                }
              }

              const hasWindowHeader = (titlePixels > 100);
              const isPoOpen = hasWindowHeader && (vendorLabelPixels > 10);
              const isBpListOpen = hasWindowHeader && (vendorLabelPixels <= 10);
              const isSapReady = isMenuPresent && (isDashboardPresent || isPoOpen || isBpListOpen || words.length >= 6);

              // 5. Grid Row 1 Header detection
              let row1Y = 360;
              for (let y = 320; y <= 370; y++) {
                const d = ctx.getImageData(50, y, 1, 1).data;
                if (d[0] > 230 && d[1] > 230 && d[2] > 230) {
                  row1Y = y + 27;
                  break;
                }
              }

              // 6. Action button Y
              let draftButtonY = null;
              for (let y = 820; y <= 940; y += 4) {
                const b = ctx.getImageData(105, y, 1, 1).data;
                if (b[0] >= 20 && b[0] <= 85 && b[1] >= 45 && b[1] <= 125 && b[2] >= 75 && b[2] <= 165) {
                  draftButtonY = y;
                  break;
                }
              }

              resolve({
                isSapReady,
                isMenuPresent,
                wordsCount: words.length,
                modulesCenter: modulesCenter || 229,
                isDropdownOpen,
                isDashboardPresent,
                isPoOpen,
                isBpListOpen,
                row1Y,
                draftButtonY: draftButtonY || 844,
                b64: imgB64,
              });
            };
            img.onerror = () => resolve({ isSapReady: false, isPoOpen: false, isBpListOpen: false });
            img.src = 'data:image/png;base64,' + imgB64;
          });
        }, b64);
      } catch (err) {
        return { isSapReady: false, isPoOpen: false, isBpListOpen: false, error: err.message };
      }
    }

    // STEP 1: Wait for SAP B1 remote desktop to initialize and render (visually verifying Menu Bar & Dashboard)
    addLog('Waiting for SAP B1 desktop to render (visually reading upper menu bar & dashboard)...');
    let desktopReady = false;
    let lastLandmarks = null;
    for (let sec = 1; sec <= 35; sec++) {
      await new Promise((r) => setTimeout(r, 2000));

      // Dismiss any session takeover modal at (510, 475) or lingering prompt
      await rdpClick(targetPage, 510, 475, 100);
      await targetPage.keyboard.press('Enter');

      const status = await checkScreenState(targetPage);
      lastLandmarks = status;
      if (status.b64) {
        latestJobStatus.screenshotBase64 = `data:image/png;base64,${status.b64}`;
      }

      addLog(`[${sec * 2}s] Menu Bar: ${status.isMenuPresent} (${status.wordsCount} words, Modules@X=${status.modulesCenter}) | Dashboard: ${status.isDashboardPresent} | PO Window: ${status.isPoOpen}`);

      if (status.isPoOpen) {
        desktopReady = true;
        addLog(`✓ SAP B1 Desktop ready & Purchase Order window already open after ${sec * 2}s.`);
        break;
      }
      if (status.isSapReady) {
        desktopReady = true;
        addLog(`✓ SAP B1 Desktop fully loaded (Menu Bar & Cockpit confirmed) after ${sec * 2}s.`);
        break;
      }
      await updateSnapshot(`Loading SAP B1 Desktop (${sec * 2}s)...`);
    }

    // STEP 2: Ensure PO window is open
    let poStatus = await checkScreenState(targetPage);

    if (poStatus.isBpListOpen) {
      addLog('Stray Business Partner list detected. Closing with Escape...');
      await targetPage.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 800));
      poStatus = await checkScreenState(targetPage);
    }

    if (!poStatus.isPoOpen) {
      addLog(`Opening Purchase Order window dynamically (Modules center detected at X=${poStatus.modulesCenter})...`);
      for (let attempt = 1; attempt <= 3; attempt++) {
        await targetPage.keyboard.press('Escape');
        await new Promise((r) => setTimeout(r, 400));

        // Click dynamically detected Modules center coordinate
        const targetModX = poStatus.modulesCenter || 229;
        addLog(`Clicking "Modules" menu at dynamically recognized position (${targetModX}, 18)...`);
        await rdpClick(targetPage, targetModX, 18);
        await new Promise((r) => setTimeout(r, 800));

        let modCheck = await checkScreenState(targetPage);
        if (!modCheck.isDropdownOpen) {
          addLog('Dropdown not visible via mouse click. Using Alt+M keyboard shortcut...');
          await targetPage.keyboard.press('Alt+m');
          await new Promise((r) => setTimeout(r, 800));
          modCheck = await checkScreenState(targetPage);
        }

        addLog(`Modules Dropdown Open: ${modCheck.isDropdownOpen}. Navigating to Purchase Order...`);
        await targetPage.keyboard.press('p'); // Purchasing - A/P
        await new Promise((r) => setTimeout(r, 500));
        await targetPage.keyboard.press('ArrowRight'); // Submenu
        await new Promise((r) => setTimeout(r, 500));
        await targetPage.keyboard.press('ArrowDown');
        await targetPage.keyboard.press('ArrowDown');
        await targetPage.keyboard.press('ArrowDown'); // Purchase Order
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Enter');
        await new Promise((r) => setTimeout(r, 4000));
        await updateSnapshot(`Opened via Modules Menu (Attempt ${attempt})`);

        poStatus = await checkScreenState(targetPage);
        addLog(`Attempt ${attempt} result -> PO Window Confirmed: ${poStatus.isPoOpen}`);
        if (poStatus.isPoOpen) {
          addLog('✓ Purchase Order window confirmed OPEN via Smart Screen Reading!');
          break;
        }

        // Fallback: If Modules menu did not open PO, try F2 shortcut
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
      throw new Error('Failed to open Purchase Order window in SAP Business One after smart visual verification.');
    }

    // STEP 3: Switch to Add Mode if currently in OK mode (Control+A)
    addLog('Ensuring Purchase Order is in Add Mode (Control+A)...');
    await targetPage.keyboard.press('Control+A');
    await new Promise((r) => setTimeout(r, 1200));
    await updateSnapshot('Purchase Order Form Open & Ready');

    // STEP 4: Enter Vendor Code - Click Vendor input field at (140, 135)
    addLog(`Entering Vendor Code: ${vendor}...`);
    await rdpClick(targetPage, 140, 135);
    await new Promise((r) => setTimeout(r, 300));
    await targetPage.keyboard.press('Control+A');
    await targetPage.keyboard.type(vendor, { delay: 50 });
    await new Promise((r) => setTimeout(r, 300));
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 1800));

    // Confirm any selection modal / List of Business Partners if it appeared
    const bpState = await checkScreenState(targetPage);
    if (bpState.isBpListOpen) {
      addLog('Business Partner selection modal detected. Confirming with Enter...');
      await targetPage.keyboard.press('Enter');
      await new Promise((r) => setTimeout(r, 1200));
    }

    // STEP 5: Enter Vendor Ref. No. (DB Order Reference) at (140, 185)
    const targetRef = dbOrderNo || quotationNo || remarks || '';
    if (targetRef) {
      addLog(`Entering Vendor Ref. No. (DB Order): ${targetRef}...`);
      await rdpClick(targetPage, 140, 185);
      await new Promise((r) => setTimeout(r, 300));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.type(targetRef, { delay: 50 });
      await new Promise((r) => setTimeout(r, 400));
      await targetPage.keyboard.press('Tab');
    }
    await updateSnapshot('Vendor & Reference Entered');

    // STEP 6: Grid Line Items
    const startRowY = poStatus.row1Y || 360;
    addLog(`Entering ${items.length} line items into SAP grid (Row 1 detected at Y=${startRowY})...`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const partNo = it.part_no || it.partNo || it.itemCode;
      const qty = String(it.qty || it.quantity || 1);
      const rawPrice = it.unit_price || it.price || it.unitPrice || 0;
      const priceVal = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
      const rowY = startRowY + (i * 16);

      addLog(`  [Line ${i + 1}/${items.length}] Part: ${partNo} | Qty: ${qty} | Unit Price: ${priceVal > 0 ? priceVal.toFixed(3) + ' USD' : 'Master Default'}`);

      // Select Item No cell in Row (X=65, Y=rowY)
      await rdpDblClick(targetPage, 65, rowY);
      await new Promise((r) => setTimeout(r, 350));
      await targetPage.keyboard.type(partNo, { delay: 60 });
      await new Promise((r) => setTimeout(r, 400));
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 2200)); // Allow SAP to fetch item details

      // If a modal appeared (e.g. item selection), confirm with Enter
      const itemModalCheck = await checkScreenState(targetPage);
      if (itemModalCheck.isBpListOpen) {
        await targetPage.keyboard.press('Enter');
        await new Promise((r) => setTimeout(r, 800));
      }

      // Select Quantity cell in Row (X=185, Y=rowY)
      await rdpDblClick(targetPage, 185, rowY);
      await new Promise((r) => setTimeout(r, 250));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.press('Backspace');
      for (let k = 0; k < 6; k++) {
        await targetPage.keyboard.press('Delete');
      }
      await targetPage.keyboard.type(qty, { delay: 50 });
      await new Promise((r) => setTimeout(r, 250));
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 800));

      // Enter USD Unit Price if provided (X=235, Y=rowY)
      if (priceVal > 0) {
        const priceStr = `${priceVal.toFixed(3)} USD`;
        addLog(`    Setting USD Unit Price at (235, ${rowY}): ${priceStr}...`);
        await rdpDblClick(targetPage, 235, rowY);
        await new Promise((r) => setTimeout(r, 250));
        await targetPage.keyboard.press('Control+A');
        await targetPage.keyboard.press('Backspace');
        for (let k = 0; k < 8; k++) {
          await targetPage.keyboard.press('Delete');
        }
        await targetPage.keyboard.type(priceStr, { delay: 50 });
        await new Promise((r) => setTimeout(r, 250));
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 800));
      }

      await updateSnapshot(`Line Item ${i + 1} Entered (${partNo})`);
    }

    // STEP 7: Remarks
    const remarksText = remarks || `Komatsu Quotation ${quotationNo || ''} / ${dbOrderNo || ''}`.trim();
    if (remarksText) {
      addLog(`Setting Remarks: ${remarksText}...`);
      const remarksY = (poStatus.draftButtonY ? poStatus.draftButtonY - 10 : 850);
      await rdpClick(targetPage, 140, remarksY);
      await new Promise((r) => setTimeout(r, 250));
      await targetPage.keyboard.press('Control+A');
      await targetPage.keyboard.type(remarksText, { delay: 35 });
      await new Promise((r) => setTimeout(r, 400));
    }
    await updateSnapshot('PO Completed - Ready to Save');

    // STEP 8: Save document
    const saveY = poStatus.draftButtonY || 844;
    if (isDraft) {
      addLog(`Saving Purchase Order as Draft (Add Draft & New at 115, ${saveY})...`);
      await rdpClick(targetPage, 115, saveY, 150);
    } else {
      addLog(`Finalizing and posting Purchase Order (Add & New at 45, ${saveY})...`);
      await rdpClick(targetPage, 45, saveY, 150);
    }

    await new Promise((r) => setTimeout(r, 4000));
    // Confirm any SAP dialog (e.g. "Exchange rate", "Document saved", etc.)
    await targetPage.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 1500));
    await targetPage.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 1000));
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
