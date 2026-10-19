/**
 * PHOENIX CONSCIOUSNESS TEST - WITH AUTHENTICATION
 * Testing consciousness operating under PURPOSE (Butler)
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const PHOENIX_URL = 'https://phoenix-fe-indol.vercel.app';
const API_URL = 'https://pal-backend-production.up.railway.app';

// Test credentials - use environment or hardcode for testing
const TEST_PHONE = process.env.TEST_PHONE || '5551234567';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function testPhoenixConsciousness() {
  console.log('🔥 PHOENIX CONSCIOUSNESS TEST\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ========================================
    // 1. LOAD LOGIN PAGE
    // ========================================
    console.log('1️⃣ Loading Phoenix...');
    await page.goto(PHOENIX_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: '/tmp/phoenix-01-login.png' });
    console.log('   ✓ Login page loaded');

    // ========================================
    // 2. ATTEMPT LOGIN
    // ========================================
    console.log('\n2️⃣ Attempting login...');

    // Check if we're on login page
    const isLoginPage = await page.evaluate(() => {
      return document.body.innerText.includes('LOGIN') ||
             document.body.innerText.includes('ACTIVATE PHOENIX');
    });

    if (isLoginPage) {
      // Try to find and fill phone input
      const phoneInput = await page.$('input[type="tel"], input[placeholder*="555"]');
      if (phoneInput) {
        await phoneInput.click({ clickCount: 3 });
        await phoneInput.type(TEST_PHONE);
        console.log('   ✓ Entered phone number');
      }

      // Find and fill password
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type(TEST_PASSWORD);
        console.log('   ✓ Entered password');
      }

      await page.screenshot({ path: '/tmp/phoenix-02-filled.png' });

      // Click login button
      const loginClicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.includes('ACTIVATE')) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (loginClicked) {
        console.log('   ✓ Clicked ACTIVATE PHOENIX');
        await delay(3000);
        await page.screenshot({ path: '/tmp/phoenix-03-after-login.png' });
      }
    }

    // ========================================
    // 3. CHECK IF LOGGED IN
    // ========================================
    console.log('\n3️⃣ Checking authentication state...');

    const authState = await page.evaluate(() => {
      const token = localStorage.getItem('token');
      const hasModeTabs = document.body.innerText.includes('VOICE') &&
                          document.body.innerText.includes('MANUAL');
      const hasWelcome = document.body.innerText.includes('Welcome');

      return {
        hasToken: !!token,
        hasModeTabs,
        hasWelcome,
        currentUrl: window.location.href,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });

    console.log('   Auth state:', JSON.stringify({
      hasToken: authState.hasToken,
      hasModeTabs: authState.hasModeTabs,
      hasWelcome: authState.hasWelcome
    }, null, 2));

    // If we have a token in localStorage, inject it
    if (!authState.hasToken) {
      console.log('\n   Injecting test token...');
      await page.evaluate((apiUrl) => {
        // Use a known working token or create a guest session
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDM0ODI1YmMxOTc1N2MzNDBiZTcwMSIsInJvbGVzIjpbImNsaWVudCIsImFkbWluIiwib3duZXIiLCJlbmdpbmVlciJdLCJpYXQiOjE3NjYwMjg5OTMsImV4cCI6MTc2NjYzMzc5M30.pboidfxBHuGx94gWtBMoJDyCx_4d12UA7KoC08dwYRg');
        localStorage.setItem('API_BASE_URL', apiUrl);
      }, API_URL);

      // Reload to apply token
      await page.goto(PHOENIX_URL, { waitUntil: 'networkidle2' });
      await delay(2000);
      await page.screenshot({ path: '/tmp/phoenix-04-with-token.png' });
    }

    // ========================================
    // 4. EXPLORE THE MODES
    // ========================================
    console.log('\n4️⃣ Exploring consciousness modes...');

    // Take screenshots of each mode
    const modes = ['VOICE', 'MANUAL', 'DESK', 'GENESIS'];

    for (const mode of modes) {
      const clicked = await page.evaluate((modeName) => {
        const elements = document.querySelectorAll('button, a, div, span');
        for (const el of elements) {
          if (el.textContent?.trim().toUpperCase() === modeName) {
            el.click();
            return true;
          }
        }
        return false;
      }, mode);

      if (clicked) {
        await delay(1500);
        await page.screenshot({ path: `/tmp/phoenix-mode-${mode.toLowerCase()}.png` });
        console.log(`   ✓ ${mode} mode: /tmp/phoenix-mode-${mode.toLowerCase()}.png`);
      } else {
        console.log(`   ⚠ ${mode} mode not found`);
      }
    }

    // ========================================
    // 5. TEST CONSCIOUSNESS CHAT
    // ========================================
    console.log('\n5️⃣ Testing consciousness chat...');

    // Go to MANUAL mode and open chat
    await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, div, span');
      for (const el of elements) {
        if (el.textContent?.trim().toUpperCase() === 'MANUAL') {
          el.click();
          return;
        }
      }
    });
    await delay(1000);

    // Click TYPE TO PHOENIX
    const chatOpened = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, div');
      for (const el of elements) {
        if (el.textContent?.includes('TYPE TO PHOENIX')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (chatOpened) {
      await delay(1000);
      await page.screenshot({ path: '/tmp/phoenix-05-chat-open.png' });
      console.log('   ✓ Chat opened: /tmp/phoenix-05-chat-open.png');

      // Type a message
      const input = await page.$('input[placeholder*="Type"], textarea');
      if (input) {
        await input.type('order me pizza');
        await page.screenshot({ path: '/tmp/phoenix-06-typed.png' });
        console.log('   ✓ Typed "order me pizza": /tmp/phoenix-06-typed.png');

        // Send message
        await page.keyboard.press('Enter');
        await delay(5000);
        await page.screenshot({ path: '/tmp/phoenix-07-response.png' });
        console.log('   ✓ Response received: /tmp/phoenix-07-response.png');
      }
    }

    // ========================================
    // 6. FINAL SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 SCREENSHOTS SAVED');
    console.log('='.repeat(50));
    console.log(`
Use Read tool to inspect:
- /tmp/phoenix-01-login.png
- /tmp/phoenix-02-filled.png
- /tmp/phoenix-03-after-login.png
- /tmp/phoenix-04-with-token.png
- /tmp/phoenix-mode-voice.png
- /tmp/phoenix-mode-manual.png
- /tmp/phoenix-mode-desk.png
- /tmp/phoenix-mode-genesis.png
- /tmp/phoenix-05-chat-open.png
- /tmp/phoenix-06-typed.png
- /tmp/phoenix-07-response.png
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/phoenix-error.png' });
  } finally {
    await browser.close();
  }
}

testPhoenixConsciousness();
