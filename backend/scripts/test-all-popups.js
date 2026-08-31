const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testAllPopups() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const pages = [];
  context.on('page', (p) => {
    console.log('Detected page event:', p.url());
    pages.push(p);
  });

  const mainPage = await context.newPage();
  await mainPage.goto('https://daralhai.b1pro.com/software/html5.html', { waitUntil: 'networkidle' });

  await mainPage.fill('#Editbox1', 'DAH38');
  await mainPage.fill('#Editbox2', 'Dar@20055');
  await mainPage.click('#buttonLogOn');

  console.log('Waiting 15 seconds for all windows to spawn...');
  await mainPage.waitForTimeout(15000);

  const allContextPages = context.pages();
  console.log(`Total active pages in context: ${allContextPages.length}`);

  const outDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < allContextPages.length; i++) {
    const p = allContextPages[i];
    const title = await p.title();
    const url = p.url();
    const ssPath = path.join(outDir, `page_${i}_${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
    await p.screenshot({ path: ssPath });
    console.log(`Page [${i}]: title="${title}", url="${url}", screenshot="${ssPath}"`);

    const hasCanvas = await p.evaluate(() => {
      const c = document.querySelector('canvas');
      return c ? { id: c.id, w: c.width, h: c.height } : null;
    });
    console.log(`Page [${i}] canvas:`, hasCanvas);
  }

  await browser.close();
}

testAllPopups().catch(console.error);
