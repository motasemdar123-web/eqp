const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSapLogin() {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  console.log('Navigating to https://daralhai.b1pro.com/software/html5.html ...');
  await page.goto('https://daralhai.b1pro.com/software/html5.html', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('Page title:', await page.title());
  
  const screenshotDir = path.join(__dirname, '../output');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  await page.screenshot({ path: path.join(screenshotDir, 'sap-login-screen.png') });
  console.log('Saved sap-login-screen.png');

  const inputs = await page.$$eval('input', (els) => els.map(e => ({
    id: e.id,
    name: e.name,
    type: e.type,
    placeholder: e.placeholder,
    className: e.className,
    value: e.value
  })));
  console.log('Inputs found:', JSON.stringify(inputs, null, 2));

  const userInput = await page.$('input[type="text"], input[name*="user"], input[id*="user"], #login, #user');
  const passInput = await page.$('input[type="password"], input[name*="pass"], input[id*="pass"], #pass, #password');

  if (userInput && passInput) {
    console.log('Filling credentials...');
    await userInput.fill('DAH38');
    await passInput.fill('Dar@20055');

    await page.screenshot({ path: path.join(screenshotDir, 'sap-login-filled.png') });

    const submitBtn = await page.$('input[type="submit"], button[type="submit"], #submit, #logonbtn, .submit-btn, button');
    if (submitBtn) {
      console.log('Clicking submit button...');
      await submitBtn.click();
    } else {
      console.log('Pressing Enter on password input...');
      await passInput.press('Enter');
    }

    console.log('Waiting 10s for HTML5 session to load...');
    await page.waitForTimeout(10000);

    await page.screenshot({ path: path.join(screenshotDir, 'sap-session-loaded.png') });
    console.log('Saved sap-session-loaded.png');
  } else {
    console.log('User/Pass inputs not matched by standard selectors.');
  }

  await browser.close();
  console.log('Test completed.');
}

testSapLogin().catch(err => {
  console.error('Error during test:', err);
});
