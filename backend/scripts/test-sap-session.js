const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runSessionTest() {
  console.log('Launching browser in headful/headless mode...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  let popupPage = null;
  const pagePromise = new Promise((resolve) => {
    context.on('page', (p) => {
      console.log('>>> New popup window detected:', p.url());
      popupPage = p;
      resolve(p);
    });
  });

  const page = await context.newPage();
  await page.goto('https://daralhai.b1pro.com/software/html5.html', { waitUntil: 'networkidle' });

  console.log('Entering credentials...');
  await page.fill('#Editbox1', 'DAH38');
  await page.fill('#Editbox2', 'Dar@20055');

  console.log('Clicking Log on button...');
  await page.click('#buttonLogOn');

  console.log('Waiting for remote popup session to open...');
  const popup = await pagePromise;
  await popup.waitForLoadState('domcontentloaded');
  console.log('Popup URL:', popup.url());

  const outDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let s of [5, 10, 15, 20]) {
    console.log(`Waiting ${s}s for session to render...`);
    await popup.waitForTimeout(5000);
    const ssPath = path.join(outDir, `session_${s}s.png`);
    await popup.screenshot({ path: ssPath });
    console.log(`Saved screenshot: ${ssPath}`);
  }

  const popupInfo = await popup.evaluate(() => {
    const canvas = document.querySelector('canvas');
    return {
      title: document.title,
      url: window.location.href,
      canvas: canvas ? { id: canvas.id, width: canvas.width, height: canvas.height } : null,
      innerText: document.body.innerText.slice(0, 300)
    };
  });
  console.log('Popup session info:', JSON.stringify(popupInfo, null, 2));

  await browser.close();
  console.log('Session test completed successfully.');
}

runSessionTest().catch(console.error);
