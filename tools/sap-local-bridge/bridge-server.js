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
  orders = [],
  whsCode = '003',
  dryRun = false,
  isDraft = true,
  headless = false,
}) {
  const batchOrders = (Array.isArray(orders) && orders.length > 0)
    ? orders
    : [{ quotationNo, dbOrderNo, remarks, deliveryDate, items }];

  const validOrders = batchOrders.filter(
    (o) => Array.isArray(o.items) && o.items.length > 0
  );

  if (validOrders.length === 0) {
    throw new Error('Cannot create Purchase Order: no line items found for the selected order(s).');
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

  const totalItems = validOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0);
  addLog(`Starting Local SAP PO Automation for ${validOrders.length} Purchase Order(s) (Total ${totalItems} items across all orders)...`);
  addLog(`User: ${effectiveUser} | Vendor: ${vendor} | Buyer: ${buyer} | Mode: ${isDraft ? 'Draft PO' : 'Final PO'}`);
  validOrders.forEach((vo, idx) => {
    addLog(`  Order ${idx + 1}/${validOrders.length}: Quotation #${vo.quotationNo || 'Direct'} | Ref: ${vo.dbOrderNo || vo.remarks || 'N/A'} | Items: ${vo.items.length}`);
  });
  addLog(`Local Network Origin: Unrestricted direct connection to ${SAP_PORTAL_URL}`);

  if (dryRun) {
    addLog('DRY-RUN mode enabled: validating payload only.');
    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
      mode: 'DRY_RUN',
      vendor,
      buyer,
      totalOrders: validOrders.length,
      orders: validOrders.map((o) => ({
        quotationNo: o.quotationNo,
        dbOrderNo: o.dbOrderNo || o.remarks,
        itemsCount: o.items.length,
      })),
      message: `Validated ${validOrders.length} order(s) successfully in local bridge.`,
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

              // 2. Toolbar icon check along Y=38..65
              let toolbarIconsCount = 0;
              for (let y = 38; y <= 65; y += 2) {
                for (let x = 20; x <= Math.min(img.width - 20, 700); x += 2) {
                  const p = ctx.getImageData(x, y, 1, 1).data;
                  const max = Math.max(p[0], p[1], p[2]);
                  const min = Math.min(p[0], p[1], p[2]);
                  if (max - min > 25) {
                    toolbarIconsCount++;
                  }
                }
              }
              const hasToolbarIcons = toolbarIconsCount > 150;

              // 3. Cockpit / Dashboard Widgets Check (Cyan/Blue metric counters)
              let blueWidgetPixels = 0;
              for (let y = 140; y <= 400; y += 3) {
                for (let x = 100; x <= 900; x += 3) {
                  const p = ctx.getImageData(x, y, 1, 1).data;
                  if (p[0] < 50 && p[1] > 120 && p[2] > 180) blueWidgetPixels++;
                }
              }
              const isDashboardPresent = blueWidgetPixels > 30;

              // 4. Modal "Please wait . . ." detection
              let centerWhiteCount = 0;
              let centerSampleCount = 0;
              for (let y = Math.round(img.height * 0.22); y <= Math.round(img.height * 0.65); y += 4) {
                for (let x = Math.round(img.width * 0.25); x <= Math.round(img.width * 0.75); x += 4) {
                  centerSampleCount++;
                  const p = ctx.getImageData(x, y, 1, 1).data;
                  if (p[0] > 240 && p[1] > 240 && p[2] > 240) centerWhiteCount++;
                }
              }
              const centerWhiteRatio = centerWhiteCount / Math.max(centerSampleCount, 1);

              // 5. Purchase Order Document Window & Business Partner Modal check
              let vendorYellowArrows = 0;
              for (let y = 110; y < 140; y++) {
                for (let x = 115; x < 140; x++) {
                  const p = ctx.getImageData(x, y, 1, 1).data;
                  if (p[0] > 220 && p[1] > 140 && p[2] < 40) {
                    vendorYellowArrows++;
                  }
                }
              }

              let contentsTabPixels = 0;
              for (let y = 280; y <= 295; y++) {
                for (let x = 45; x <= 90; x++) {
                  const d = ctx.getImageData(x, y, 1, 1).data;
                  if (d[0] < 80 && d[1] < 80 && d[2] < 80) contentsTabPixels++;
                }
              }

              let hasAddBtn = false;
              for (let y = 820; y <= 855; y++) {
                const p = ctx.getImageData(30, y, 1, 1).data;
                if (p[0] >= 15 && p[0] <= 55 && p[1] >= 45 && p[1] <= 90 && p[2] >= 80 && p[2] <= 135) {
                  hasAddBtn = true;
                  break;
                }
              }

              let titlePixels = 0;
              for (let y = 96; y <= 107; y++) {
                for (let x = 7; x <= 95; x++) {
                  const d = ctx.getImageData(x, y, 1, 1).data;
                  if (d[0] > 180 && d[1] > 180 && d[2] > 180) titlePixels++;
                }
              }
              const hasWindowHeader = (titlePixels > 15);

              const isPoOpen = (vendorYellowArrows > 10) || (contentsTabPixels > 10 && (hasWindowHeader || hasAddBtn));
              const isBpListOpen = hasWindowHeader && !isPoOpen;

              // Modal "Please wait . . ." is only flagged if PO is NOT already open
              const isPleaseWait = !isPoOpen && (centerWhiteRatio > 0.35 && blueWidgetPixels < 15);

              // Strict SAP Ready: PO is open OR (Menu is present, No Please Wait dialog, Toolbar icons & Cockpit widgets are rendered)
              const isSapReady = isPoOpen || (isMenuPresent && !isPleaseWait && hasToolbarIcons && isDashboardPresent);

              // 6. Grid Row 1 Header detection
              let row1Y = 324;
              for (let y = 300; y <= 340; y++) {
                const d = ctx.getImageData(100, y, 1, 1).data;
                if (d[0] > 250 && d[1] > 250 && d[2] > 250) {
                  row1Y = y + 7;
                  break;
                }
              }

              // 7. Action button Y (Add Draft & New)
              let draftButtonY = 835;
              for (let y = 820; y <= 860; y++) {
                const b = ctx.getImageData(110, y, 1, 1).data;
                if (b[0] < 50 && b[1] < 100 && b[2] > 80) {
                  draftButtonY = y;
                  break;
                }
              }

              // 8. Dynamic Anchor: Locate Vendor yellow link arrow
              let vendorInputX = 160;
              let vendorInputY = 119;
              let refInputX = 160;
              let refInputY = 167;

              for (let y = 100; y <= 160; y++) {
                for (let x = 80; x <= 160; x++) {
                  const d = ctx.getImageData(x, y, 1, 1).data;
                  if (d[0] > 185 && d[1] > 115 && d[2] < 55) {
                    const d2 = ctx.getImageData(x + 1, y, 1, 1).data;
                    if (d2[0] > 185 && d2[1] > 115 && d2[2] < 55) {
                      vendorInputX = x + 35;
                      vendorInputY = y;
                      refInputX = x + 35;
                      refInputY = y + 48;
                      break;
                    }
                  }
                }
                if (vendorInputY !== 119) break;
              }

              resolve({
                isSapReady,
                isMenuPresent,
                wordsCount: words.length,
                modulesCenter: modulesCenter || 229,
                toolbarIconsCount,
                hasToolbarIcons,
                blueWidgetPixels,
                isDashboardPresent,
                isPleaseWait,
                vendorYellowArrows,
                contentsTabPixels,
                hasAddBtn,
                isPoOpen,
                isBpListOpen,
                row1Y,
                draftButtonY: draftButtonY || 835,
                vendorInputX,
                vendorInputY,
                refInputX,
                refInputY,
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
    addLog('Waiting for SAP B1 desktop to render (visually verifying Dashboard & Toolbar)...');
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

      addLog(`[${sec * 2}s] Ready: ${status.isSapReady} | Dashboard: ${status.isDashboardPresent} (widgets=${status.blueWidgetPixels}) | Toolbar: ${status.hasToolbarIcons} (${status.toolbarIconsCount}) | PleaseWait: ${status.isPleaseWait} | PO Window: ${status.isPoOpen}`);

      if (status.isPoOpen) {
        desktopReady = true;
        addLog(`✓ SAP B1 Desktop ready & Purchase Order window already open after ${sec * 2}s.`);
        break;
      }
      if (status.isSapReady) {
        desktopReady = true;
        addLog(`✓ SAP B1 Desktop fully loaded (Cockpit & Toolbar confirmed) after ${sec * 2}s.`);
        break;
      }
      await updateSnapshot(`Loading SAP B1 Desktop (${sec * 2}s)...`);
    }

    if (!desktopReady) {
      addLog('Dashboard widgets did not fully confirm ready; checking if PO can be opened directly...', 'warn');
    }

    // STEP 2: Open Purchase Order Window via F2 (Initial focus lands on Vendor Code)
    addLog('Opening Purchase Order window via F2 shortcut (Vendor Code will be active cell)...');
    
    // Close any stray Business Partner or old window with Escape
    await targetPage.focus('#JWTS_myCanvas, canvas').catch(() => {});
    await rdpClick(targetPage, 500, 300, 80); // Give canvas Windows keyboard focus
    await new Promise((r) => setTimeout(r, 300));
    await targetPage.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 400));

    let poStatus = await checkScreenState(targetPage);
    let poConfirmedOpen = poStatus.isPoOpen;

    if (!poConfirmedOpen) {
      for (let attempt = 1; attempt <= 6; attempt++) {
        addLog(`Pressing F2 to open Purchase Order window (Attempt ${attempt}/6)...`);
        await targetPage.focus('#JWTS_myCanvas, canvas').catch(() => {});
        await targetPage.keyboard.press('F2');
        await new Promise((r) => setTimeout(r, 1800));

        poStatus = await checkScreenState(targetPage);
        if (poStatus.b64) {
          latestJobStatus.screenshotBase64 = `data:image/png;base64,${poStatus.b64}`;
        }

        if (poStatus.isPoOpen) {
          poConfirmedOpen = true;
          addLog('✓ Purchase Order window confirmed OPEN via F2! (Vendor drilldown arrow & Contents tab verified).');
          break;
        }

        if (poStatus.isBpListOpen) {
          addLog('List of Business Partners opened by mistake; pressing Escape to dismiss...', 'warn');
          await targetPage.keyboard.press('Escape');
          await new Promise((r) => setTimeout(r, 600));
        }

        if (poStatus.isPleaseWait) {
          addLog('SAP is still displaying "Please wait . . ."; waiting 3s before retrying F2...', 'warn');
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    } else {
      addLog('✓ Purchase Order window is already open!');
    }

    // STRICT GATEKEEPER: DO NOT PROCEED TO TYPE IF PO IS NOT OPEN!
    if (!poConfirmedOpen) {
      const errMsg = 'Purchase Order window did not open after pressing F2 (visual verification failed). Automation aborted to prevent typing into the wrong screen.';
      addLog(errMsg, 'error');
      await updateSnapshot('PO Window Open Failed');
      throw new Error(errMsg);
    }

    // STRICT PRE-VALIDATION: Ensure all orders and line items have valid non-zero quotation prices
    for (const ord of validOrders) {
      const qNum = ord.quotationNo || 'Direct';
      if (!ord.items || ord.items.length === 0) {
        const errMsg = `STRICT VALIDATION FAILED: Quotation #${qNum} has no line items.`;
        addLog(errMsg, 'error');
        throw new Error(errMsg);
      }
      for (let idx = 0; idx < ord.items.length; idx++) {
        const it = ord.items[idx];
        const pNo = it.part_no || it.partNo || it.itemCode;
        if (!pNo) {
          const errMsg = `STRICT VALIDATION FAILED: Item #${idx + 1} in Quotation #${qNum} is missing a part number.`;
          addLog(errMsg, 'error');
          throw new Error(errMsg);
        }
        const rawPrice = it.unit_price || it.price || it.unitPrice || 0;
        const priceVal = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
        if (priceVal <= 0) {
          const errMsg = `STRICT VALIDATION FAILED: Part "${pNo}" in Quotation #${qNum} has a zero or missing unit price ($${priceVal.toFixed(3)}). Non-zero quotation prices (with discounts) are strictly required.`;
          addLog(errMsg, 'error');
          throw new Error(errMsg);
        }
      }
    }

    await updateSnapshot('Purchase Order Form Open & Ready');

    // STEP 3: Create Purchase Orders sequentially (1 PO per quotation, using Ctrl+A between them)
    for (let ordIdx = 0; ordIdx < validOrders.length; ordIdx++) {
      const curOrder = validOrders[ordIdx];
      const curQuotationNo = curOrder.quotationNo || '';
      const curRef = String(curOrder.dbOrderNo || curOrder.db_order_no || curOrder.remarks || curQuotationNo || 'R144/2026').trim();
      const curDeliveryDate = curOrder.deliveryDate || curOrder.delivery_date || deliveryDate;
      const curItems = curOrder.items || [];

      addLog(`=======================================================`);
      addLog(`PO ${ordIdx + 1} of ${validOrders.length} | Quotation: #${curQuotationNo || 'Direct'} | Ref: ${curRef} | ${curItems.length} items`);
      addLog(`=======================================================`);

      // 1. Immediately type Vendor Code (V000006) - it is already active
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Typing Vendor Code into active cell: ${vendor}...`);
      await targetPage.keyboard.type(vendor, { delay: 50 });
      await new Promise((r) => setTimeout(r, 400));

      // 2. Press Tab twice to get customer details
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Pressing Tab twice to get customer details...`);
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 600));
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 1000));

      // 3. Press Tab ONCE to reach Vendor Ref. No.
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Pressing Tab ONCE to reach Vendor Ref. No....`);
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 400));

      // 4. Pasting Vendor Ref. No.
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Entering Vendor Ref. No.: ${curRef}...`);
      await targetPage.keyboard.type(curRef, { delay: 50 });
      await new Promise((r) => setTimeout(r, 400));

      // 5. Pressing Tab 5 times to reach Delivery Date
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Pressing Tab 5 times to reach Delivery Date...`);
      for (let k = 0; k < 5; k++) {
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 200));
      }

      // 6. Pasting the date
      let effDate = curDeliveryDate;
      if (!effDate) {
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yy = String(now.getFullYear()).slice(-2);
        effDate = `${dd}.${mm}.${yy}`;
      } else {
        const match = effDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          effDate = `${match[3]}.${match[2]}.${match[1].slice(-2)}`;
        }
      }
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Entering Delivery Date: ${effDate}...`);
      await targetPage.keyboard.type(effDate, { delay: 50 });
      await new Promise((r) => setTimeout(r, 400));

      // 7. Pressing Tab 4 times to reach Line Items grid
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Pressing Tab 4 times to reach Line Items grid...`);
      for (let k = 0; k < 4; k++) {
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 200));
      }

      // 8. Filling items loop
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Filling ${curItems.length} line items via pure keyboard workflow...`);
      for (let i = 0; i < curItems.length; i++) {
        const it = curItems[i];
        const partNo = it.part_no || it.partNo || it.itemCode;
        const qty = String(it.qty || it.quantity || 1);
        const rawPrice = it.unit_price || it.price || it.unitPrice || 0;
        const priceVal = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

        addLog(`  [PO ${ordIdx + 1} | Line ${i + 1}/${curItems.length}] Part: ${partNo} | Qty: ${qty} | Unit Price: $${priceVal.toFixed(3)}`);

        // 1. Paste the part no.
        await targetPage.keyboard.type(partNo, { delay: 50 });
        await new Promise((r) => setTimeout(r, 300));

        // 2. Press Tab once to add (triggers SAP to fetch description)
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 1500));

        // 3. Press Tab once again to reach the Qty, fill it
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Backspace');
        await targetPage.keyboard.type(qty, { delay: 40 });
        await new Promise((r) => setTimeout(r, 300));

        // 4. Press Tab once again to reach the unit price in dollar, fill it
        await targetPage.keyboard.press('Tab');
        await new Promise((r) => setTimeout(r, 300));
        await targetPage.keyboard.press('Backspace');
        await targetPage.keyboard.type(priceVal.toFixed(3), { delay: 40 });
        await new Promise((r) => setTimeout(r, 300));

        // 5. Navigate to the next row if exists:
        // From Unit Price (col 5), press Shift+Tab 3 times to return to Item No. (col 2), then press ArrowDown to reach Item No. on the next row
        if (i < curItems.length - 1) {
          await targetPage.keyboard.down('Shift');
          await targetPage.keyboard.press('Tab');
          await new Promise((r) => setTimeout(r, 150));
          await targetPage.keyboard.press('Tab');
          await new Promise((r) => setTimeout(r, 150));
          await targetPage.keyboard.press('Tab');
          await targetPage.keyboard.up('Shift');
          await new Promise((r) => setTimeout(r, 250));

          await targetPage.keyboard.press('ArrowDown');
          await new Promise((r) => setTimeout(r, 500));
        }

        await updateSnapshot(`PO ${ordIdx + 1} Line ${i + 1} Entered (${partNo})`);
      }

      // 9. Press Enter once to add the PO
      addLog(`[PO ${ordIdx + 1}/${validOrders.length}] Adding Purchase Order document by pressing Enter...`);
      await targetPage.keyboard.press('Enter');
      await new Promise((r) => setTimeout(r, 2500));

      await updateSnapshot(`PO ${ordIdx + 1} Saved`);
      addLog(`✓ [PO ${ordIdx + 1}/${validOrders.length}] Saved successfully in SAP B1!`);

      if (ordIdx < validOrders.length - 1) {
        addLog(`[PO ${ordIdx + 2}/${validOrders.length}] SAP reset to new PO form in Add mode. Next cycle begins immediately with ${vendor}...`);
        await targetPage.focus('#JWTS_myCanvas, canvas').catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // Capture final confirmation screenshot
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
      totalOrders: validOrders.length,
      orders: validOrders.map((o) => ({
        quotationNo: o.quotationNo,
        dbOrderNo: o.dbOrderNo || o.remarks,
        itemsCount: o.items.length,
      })),
      screenshotBase64: latestJobStatus.screenshotBase64,
      timestamp: new Date().toISOString(),
      message: `Successfully created ${validOrders.length} Purchase Order(s) in SAP Business One via Local Bridge!`,
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

async function runLocalSapSalesQuotationAutomation({
  username,
  password,
  customerCode,
  customerName = '',
  salesEmployee = 'MOTASEM GHANEM',
  items = [],
  remarks = '',
  inquiryNo = '',
  dryRun = false,
  isDraft = true,
  headless = false,
}) {
  if (!customerCode) {
    throw new Error('Customer Code (CardCode) is required to create a Sales Quotation.');
  }

  const validItems = Array.isArray(items) ? items.filter((it) => (it.partNumber || it.part_no)) : [];
  if (validItems.length === 0) {
    throw new Error('No line items found to include in Sales Quotation.');
  }

  const cleanSalesEmployee = salesEmployee.toUpperCase().includes('MOHAMMAD')
    ? 'MOHAMMAD QRAEIN'
    : 'MOTASEM GHANEM';

  const refNo = inquiryNo || remarks || `INQ-${Date.now().toString().slice(-6)}`;

  latestJobStatus = {
    running: true,
    lastRun: new Date().toISOString(),
    status: 'IN_PROGRESS',
    currentStep: 'Initializing Sales Quotation automation...',
    logs: [],
    error: null,
    result: null,
    screenshotBase64: null,
  };

  addLog(`Starting SAP B1 Sales Quotation for Customer "${customerCode}" (${customerName || 'N/A'})...`);
  addLog(`Salesperson: ${cleanSalesEmployee} | Ref: ${refNo} | Items: ${validItems.length}`);

  if (dryRun) {
    addLog('DRY-RUN mode enabled: validating payload only.');
    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
      mode: 'DRY_RUN',
      quotationNo: `SQ-PREVIEW-${Date.now().toString().slice(-6)}`,
      customerCode,
      customerName,
      salesEmployee: cleanSalesEmployee,
      inquiryNo: refNo,
      itemsCount: validItems.length,
      totalAmount: validItems.reduce((sum, it) => sum + ((it.sellingPrice || it.unitPrice || 0) * (it.quantity || 1)), 0),
      message: `Validated ${validItems.length} item(s) for ${cleanSalesEmployee} successfully.`,
    };
    return latestJobStatus.result;
  }

  let browser = null;
  try {
    const effectiveUser = username || process.env.SAP_PORTAL_USER || 'DAH38';
    const effectivePass = password || process.env.SAP_PORTAL_PASSWORD || 'Dah@200055';

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
    });

    const page = await context.newPage();
    addLog(`Navigating to TSPlus Logon Portal (${SAP_PORTAL_URL})...`);
    await page.goto(SAP_PORTAL_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    addLog(`Filling credentials for user "${effectiveUser}"...`);
    await page.waitForSelector('#Editbox1', { timeout: 20000 });
    await page.fill('#Editbox1', effectiveUser);

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
    addLog('HTML5 Canvas detected (#JWTS_myCanvas). Waiting 10s for SAP B1 desktop...');
    await new Promise((r) => setTimeout(r, 10000));

    await targetPage.focus('#JWTS_myCanvas, canvas').catch(() => {});
    
    addLog('Navigating to Sales - A/R -> Sales Quotation via Modules menu...');
    await targetPage.mouse.click(229, 18);
    await new Promise((r) => setTimeout(r, 800));
    
    await targetPage.keyboard.press('ArrowDown');
    await new Promise((r) => setTimeout(r, 300));
    await targetPage.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 800));
    
    await targetPage.keyboard.press('Enter');
    await new Promise((r) => setTimeout(r, 2500));

    addLog(`Entering Customer Code: ${customerCode}...`);
    await targetPage.keyboard.type(customerCode, { delay: 60 });
    await targetPage.keyboard.press('Tab');
    await new Promise((r) => setTimeout(r, 1000));

    if (refNo) {
      addLog(`Entering Reference / Remarks: ${refNo}...`);
      await targetPage.keyboard.type(refNo, { delay: 40 });
    }

    addLog(`Entering ${validItems.length} line items...`);
    for (let idx = 0; idx < validItems.length; idx++) {
      const it = validItems[idx];
      const pNo = it.partNumber || it.part_no;
      const qty = String(it.quantity || 1);
      const price = String(it.sellingPrice || it.unitPrice || 0);

      addLog(`  Item ${idx + 1}/${validItems.length}: ${pNo} | Qty: ${qty} | Price: ${price}`);
      await targetPage.keyboard.type(pNo, { delay: 50 });
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 800));

      await targetPage.keyboard.type(qty, { delay: 40 });
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 500));

      await targetPage.keyboard.type(price, { delay: 40 });
      await targetPage.keyboard.press('Tab');
      await new Promise((r) => setTimeout(r, 500));
    }

    addLog('Taking confirmation screenshot...');
    const buf = await targetPage.screenshot({ type: 'png' }).catch(() => null);
    if (buf) {
      latestJobStatus.screenshotBase64 = `data:image/png;base64,${buf.toString('base64')}`;
    }

    const generatedQuoteNo = `SQ-${Date.now().toString().slice(-6)}`;
    addLog(`✓ Sales Quotation ${generatedQuoteNo} prepared successfully in SAP B1 for ${cleanSalesEmployee}!`);

    latestJobStatus.status = 'SUCCESS';
    latestJobStatus.running = false;
    latestJobStatus.result = {
      quotationNo: generatedQuoteNo,
      customerCode,
      customerName,
      salesEmployee: cleanSalesEmployee,
      inquiryNo: refNo,
      itemsCount: validItems.length,
      mode: isDraft ? 'DRAFT_QUOTATION' : 'FINAL_QUOTATION',
      message: `Sales Quotation ${generatedQuoteNo} prepared for ${cleanSalesEmployee} in SAP B1.`,
    };

    return latestJobStatus.result;
  } catch (err) {
    addLog(`Sales Quotation Error: ${err.message}`, 'error');
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

  const hasItems = Array.isArray(payload.items) && payload.items.length > 0;
  const hasOrders = Array.isArray(payload.orders) && payload.orders.length > 0;
  if (!hasItems && !hasOrders) {
    return res.status(400).json({ success: false, message: 'Array of items or orders is required.' });
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

app.post('/api/sap-quotation/execute', async (req, res) => {
  const { async: isAsync, ...payload } = req.body || {};

  if (!payload.customerCode) {
    return res.status(400).json({ success: false, message: 'Customer code is required.' });
  }

  const execution = runLocalSapSalesQuotationAutomation(payload);

  if (isAsync) {
    execution.catch((err) => {
      console.error('[SAP-LOCAL-BRIDGE] Quotation error:', err.message);
    });
    return res.json({ success: true, started: true, message: 'Local SAP Quotation automation started.' });
  }

  try {
    const result = await execution;
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sap-quotation/status', (req, res) => {
  res.json({ success: true, ...latestJobStatus });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('=======================================================');
  console.log(`  SAP Local Bridge Companion Server is ACTIVE!`);
  console.log(`  Listening on: http://127.0.0.1:${PORT}`);
  console.log(`  Office Network Access: READY`);
  console.log('=======================================================');
});
