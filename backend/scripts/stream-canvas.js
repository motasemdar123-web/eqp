const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSessionStream() {
  const browser = await chromium.launch({ headless: true, args: ['--ignore-certificate-errors'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  let html5Page = null;
  context.on('page', async (p) => {
    html5Page = p;
  });

  const main = await context.newPage();
  await main.goto('https://daralhai.b1pro.com/software/html5.html', { waitUntil: 'networkidle' });

  await main.fill('#Editbox1', 'DAH38');
  await main.fill('#Editbox2', 'Dar@20055');
  await main.click('#buttonLogOn');

  console.log('Waiting for HTML5 session page...');
  for (let i = 0; i < 30; i++) {
    if (html5Page) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (!html5Page) {
    console.log('HTML5 page not detected');
    await browser.close();
    return;
  }

  console.log('Waiting for SAP to paint on canvas...');
  const outDir = path.join(__dirname, '../output');

  for (let t of [5, 10, 15, 25]) {
    await html5Page.waitForTimeout(5000);
    const ssPath = path.join(outDir, `canvas_${t}s.png`);
    await html5Page.screenshot({ path: ssPath });
    console.log(`Captured: ${ssPath}`);
  }

  // Copy latest canvas screenshot to artifact
  const latestSS = path.join(outDir, 'canvas_25s.png');
  const artifactDest = 'C:\\Users\\Motasem.ghanem\\.gemini\\antigravity\\brain\\d84e0277-3c12-41d9-a72a-92c420fdfdf7\\sap_live_session.png';
  if (fs.existsSync(latestSS)) {
    fs.copyFileSync(latestSS, artifactDest);
  }

  await browser.close();
  console.log('Done testSessionStream');
}

testSessionStream().catch(console.error);
