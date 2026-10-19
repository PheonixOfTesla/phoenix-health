/**
 * Test Butler Food Ordering with Visual Screenshots
 * Tests the full flow: panel → input → execute → live view
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BACKEND_URL = 'https://pal-backend-production.up.railway.app';
const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/butler-food-test';

const TEST_EMAIL = 'butler-test@test.com';
const TEST_PASSWORD = 'TestButler123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  console.log('🍕 Butler Food Order Test\n');

  // Get token
  console.log('1️⃣  Logging in...');
  const loginRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.log('❌ Login failed:', loginData.message);
    return;
  }
  const TOKEN = loginData.token;
  const USER = loginData.user;
  console.log('   ✅ Logged in as:', USER.email);

  // Launch browser
  console.log('\n2️⃣  Launching Chrome...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 }
  });
  const page = await browser.newPage();

  // Log butler-related console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Butler') || text.includes('stream') || text.includes('SSE')) {
      console.log('   [Browser]:', text.substring(0, 100));
    }
  });

  try {
    // Load frontend with auth
    console.log('\n3️⃣  Loading Phoenix dashboard...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    await page.evaluate((token, user) => {
      localStorage.clear();
      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('phoenixUser', JSON.stringify(user));
      localStorage.setItem('phoenix_user_id', user._id);
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('phoenixOnboarded', 'true');
      localStorage.setItem('phoenixHasSeenSync', 'true');
      sessionStorage.setItem('phoenixToken', token);
      sessionStorage.setItem('phoenix_greeted', 'true');
    }, TOKEN, USER);

    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png` });
    console.log('   📸 01-dashboard.png');

    // Switch to MANUAL mode by clicking tab
    console.log('\n4️⃣  Switching to MANUAL mode...');
    // Click the MANUAL mode button directly
    await page.click('#manual-mode-btn');
    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-manual-mode.png` });
    console.log('   📸 02-manual-mode.png');

    // Check if butler bubble exists
    const butlerBubble = await page.evaluate(() => {
      const bubble = document.getElementById('butler-bubble');
      if (!bubble) return { exists: false };
      const style = getComputedStyle(bubble);
      return {
        exists: true,
        display: style.display,
        rect: bubble.getBoundingClientRect()
      };
    });
    console.log('   Butler bubble:', JSON.stringify(butlerBubble));

    // Click Butler bubble or call openButlerUniversal directly
    console.log('\n5️⃣  Opening Butler panel...');
    await page.evaluate(() => {
      if (window.openButlerUniversal) window.openButlerUniversal();
    });
    await sleep(500);
    await page.evaluate(() => {
      if (window.openButlerUniversal) window.openButlerUniversal();
    });
    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-butler-panel.png` });
    console.log('   📸 03-butler-panel.png');

    // Type food order
    console.log('\n6️⃣  Typing food order...');
    const input = await page.$('#butler-universal-input');
    if (input) {
      await input.type('Order me a pizza from DoorDash');
      await sleep(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-task-typed.png` });
      console.log('   📸 04-task-typed.png');

      // Click Execute
      console.log('\n7️⃣  Clicking Execute...');
      await page.click('#butler-universal-execute');
      await sleep(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-executing.png` });
      console.log('   📸 05-executing.png');

      // Watch for live view / confirmation
      console.log('\n8️⃣  Watching automation...');
      for (let i = 0; i < 10; i++) {
        await sleep(2000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-progress-${i}.png` });
        console.log(`   📸 06-progress-${i}.png`);

        // Check for confirmation dialog or completion
        const status = await page.evaluate(() => {
          const statusEl = document.querySelector('#butler-step-text');
          const screenshot = document.querySelector('#butler-universal-screenshot');
          return {
            step: statusEl?.textContent || '',
            hasScreenshot: screenshot && screenshot.src && screenshot.src.length > 100,
            hasConfirm: document.body.innerHTML.includes('confirm')
          };
        });
        console.log(`   Status: ${status.step}, Screenshot: ${status.hasScreenshot}`);

        if (status.step.toLowerCase().includes('complete') || status.step.toLowerCase().includes('error')) {
          break;
        }
      }
    } else {
      console.log('   ❌ Input not found');
    }

    // Final screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/99-final.png` });
    console.log('\n   📸 99-final.png');

    console.log('\n✅ TEST COMPLETE');
    console.log(`   Screenshots: ${SCREENSHOT_DIR}`);
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`   - ${f}`));

    console.log('\n   Browser closing in 10s...');
    await sleep(10000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

test();
