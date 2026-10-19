
const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Debug Login Session...');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox'] 
  });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  
  page.on('request', request => {
    request.continue(); 
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/auth/login')) {
      console.log('API RESPONSE: ' + url);
      console.log('Status: ' + response.status() + ' ' + response.statusText());
      
      try {
        const text = await response.text();
        console.log('Body: ' + text.substring(0, 500)); 
      } catch (e) {
        console.log('(Could not read response body)');
      }
    }
  });

  try {
    const targetUrl = 'https://pheonix.us/login'; 
    console.log('Navigating to: ' + targetUrl);
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });

    const title = await page.title();
    console.log('Page Title: ' + title);

    console.log('Filling credentials...');
    
    const emailSel = '#login-email'; 
    const passSel = '#login-password';
    const btnSel = '#login-btn';
    const emailToggleBtn = '#toggle-method-btn';

    const isPhoneMode = await page.evaluate(() => {
        const phoneGroup = document.getElementById('phone-group');
        return phoneGroup && phoneGroup.style.display !== 'none';
    });

    if (isPhoneMode) {
        console.log('Switching to Email mode...');
        await page.click(emailToggleBtn);
        await new Promise(r => setTimeout(r, 500)); 
    }

    await page.type(emailSel, 'test@test.com');
    await page.type(passSel, 'password123');

    console.log('Clicking Login...');
    await page.click(btnSel);

    console.log('Waiting for network response...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    await page.screenshot({ path: 'debug-login-result.png' });
    console.log('Screenshot saved to debug-login-result.png');

  } catch (error) {
    console.error('DEBUG ERROR: ' + error.message);
  } finally {
    await browser.close();
    console.log('Debug session complete.');
  }
})();
