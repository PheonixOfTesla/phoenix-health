/**
 * Test Butler Universal Agent with LOCAL backend
 * Uses headful Chrome to show the robot icon in action
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const LOCAL_BACKEND = 'http://localhost:5000';
const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/butler-local-test';

// Test user (use @test.com to bypass verification)
const TEST_EMAIL = 'butler-test@test.com';
const TEST_PASSWORD = 'TestButler123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  console.log('🤖 Butler Local Test - Puppeteer Robot Icon Test\n');

  // First, get a token from local backend
  console.log('1️⃣  Getting token from LOCAL backend...');

  const loginRes = await fetch(`${LOCAL_BACKEND}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });

  const loginData = await loginRes.json();

  if (!loginData.success) {
    // Try to register
    console.log('   User not found, registering...');
    const registerRes = await fetch(`${LOCAL_BACKEND}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Butler Test',
        phone: '5559999888'
      })
    });
    const registerData = await registerRes.json();
    if (!registerData.success) {
      console.log('❌ Failed to register:', registerData.message);
      return;
    }
    loginData.token = registerData.token;
    loginData.user = registerData.user;
  }

  const TOKEN = loginData.token;
  const USER = loginData.user;
  console.log('   ✅ Got token for:', USER.email);

  // Launch headful Chrome
  console.log('\n2️⃣  Launching Chrome (headful)...');

  const browser = await puppeteer.launch({
    headless: false,  // HEADFUL - visible browser
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1400,900'
    ],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Log console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Butler') || text.includes('Universal') || text.includes('stream')) {
      console.log('   [Browser]:', text.substring(0, 100));
    }
  });

  try {
    // Go to frontend and inject token
    console.log('\n3️⃣  Loading frontend and injecting auth...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    // Inject auth for LOCAL backend
    await page.evaluate((token, user, backendUrl) => {
      localStorage.clear();
      sessionStorage.clear();

      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('phoenixUser', JSON.stringify(user));
      localStorage.setItem('phoenix_user_id', user._id);
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('phoenixOnboarded', 'true');

      sessionStorage.setItem('phoenixToken', token);
      sessionStorage.setItem('phoenix_greeted', 'true');

      // Override API base URL to use local backend
      window.PHOENIX_API_BASE = backendUrl;

      console.log('✅ Injected auth for local backend:', backendUrl);
    }, TOKEN, USER, LOCAL_BACKEND);

    // Navigate to dashboard
    console.log('   Navigating to dashboard...');
    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png` });
    console.log('   📸 Screenshot: 01-dashboard.png');

    // Switch to MANUAL mode
    console.log('\n4️⃣  Switching to MANUAL mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('manual');
      else document.body.setAttribute('data-mode', 'manual');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-manual-mode.png` });
    console.log('   📸 Screenshot: 02-manual-mode.png');

    // Check for Butler bubble
    const butlerExists = await page.evaluate(() => {
      const bubble = document.getElementById('butler-bubble');
      return bubble ? {
        exists: true,
        display: getComputedStyle(bubble).display,
        visible: bubble.offsetParent !== null
      } : { exists: false };
    });
    console.log('   Butler bubble:', JSON.stringify(butlerExists));

    if (butlerExists.exists && butlerExists.display !== 'none') {
      // Click the Butler bubble (robot icon)
      console.log('\n5️⃣  Clicking Butler robot icon...');
      await page.click('#butler-bubble');
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-butler-panel.png` });
      console.log('   📸 Screenshot: 03-butler-panel.png (Panel opened)');

      // Type a test task
      console.log('\n6️⃣  Typing test task...');
      const input = await page.$('#butler-universal-input');
      if (input) {
        await input.type('Go to google.com and search for Phoenix AI');
        await sleep(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-task-typed.png` });
        console.log('   📸 Screenshot: 04-task-typed.png');

        // Click Execute
        console.log('\n7️⃣  Clicking Execute...');
        const executeBtn = await page.$('#butler-universal-execute');
        if (executeBtn) {
          await executeBtn.click();
          console.log('   Waiting for automation to start...');

          // Take screenshots as automation runs
          for (let i = 0; i < 10; i++) {
            await sleep(2000);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/05-automation-${i}.png` });
            console.log(`   📸 Screenshot: 05-automation-${i}.png`);

            // Check if complete
            const status = await page.evaluate(() => {
              const statusEl = document.querySelector('#butler-status');
              return statusEl?.textContent || 'unknown';
            });

            if (status.includes('complete') || status.includes('error')) {
              console.log('   Automation finished:', status);
              break;
            }
          }
        }
      }
    } else {
      console.log('   ❌ Butler bubble not visible');
    }

    // Final screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/99-final.png` });
    console.log('\n   📸 Screenshot: 99-final.png');

    console.log('\n✅ TEST COMPLETE');
    console.log(`   Screenshots: ${SCREENSHOT_DIR}`);
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`   - ${f}`));

    // Keep browser open for 10 seconds so user can see
    console.log('\n   Browser will close in 10 seconds...');
    await sleep(10000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

test();
