/**
 * Test Butler Universal Agent - HEADFUL Chrome
 * Shows robot icon in action with live screenshots
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BACKEND_URL = 'https://pal-backend-production.up.railway.app';
const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/butler-headful-test';

// Test user
const TEST_EMAIL = 'butler-test@test.com';
const TEST_PASSWORD = 'TestButler123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  console.log('🤖 Butler Headful Test - Robot Icon Automation\n');

  // Get token from production backend
  console.log('1️⃣  Getting token from production backend...');

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
  console.log('   ✅ Got token for:', USER.email);

  // Launch HEADFUL Chrome
  console.log('\n2️⃣  Launching Chrome (HEADFUL - you should see browser window)...');

  const browser = await puppeteer.launch({
    headless: false,  // VISIBLE BROWSER
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1400,900',
      '--window-position=100,100'
    ],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Log relevant console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Butler') || text.includes('stream') || text.includes('Universal') || text.includes('confirm')) {
      console.log('   [Browser]:', text.substring(0, 120));
    }
  });

  try {
    // Load frontend
    console.log('\n3️⃣  Loading frontend...');
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    // Inject auth
    await page.evaluate((token, user) => {
      localStorage.clear();
      sessionStorage.clear();

      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('phoenixUser', JSON.stringify(user));
      localStorage.setItem('phoenix_user_id', user._id);
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('phoenixOnboarded', 'true');
      localStorage.setItem('phoenixHasSeenSync', 'true');

      sessionStorage.setItem('phoenixToken', token);
      sessionStorage.setItem('phoenix_greeted', 'true');

      console.log('✅ Auth injected');
    }, TOKEN, USER);

    // Navigate to dashboard
    console.log('   Navigating to dashboard...');
    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png` });
    console.log('   📸 01-dashboard.png');

    // Check current URL
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('index.html')) {
      console.log('   ⚠️ Redirected to login - taking screenshot');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-redirect.png` });
      await browser.close();
      return;
    }

    // Switch to MANUAL mode
    console.log('\n4️⃣  Switching to MANUAL mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('manual');
      else document.body.setAttribute('data-mode', 'manual');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-manual-mode.png` });
    console.log('   📸 02-manual-mode.png');

    // Find Butler bubble
    const butlerState = await page.evaluate(() => {
      const bubble = document.getElementById('butler-bubble');
      if (!bubble) return { exists: false };
      const style = getComputedStyle(bubble);
      const rect = bubble.getBoundingClientRect();
      return {
        exists: true,
        display: style.display,
        visible: rect.width > 0 && rect.height > 0,
        position: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
      };
    });
    console.log('   Butler bubble:', JSON.stringify(butlerState));

    if (butlerState.exists && butlerState.visible) {
      // Click the robot icon
      console.log('\n5️⃣  Clicking Butler robot icon (🤖)...');
      await page.click('#butler-bubble');
      await sleep(2000);

      // Debug: Check if Butler panel object exists
      const hasPanel = await page.evaluate(() => !!window.butlerUniversalPanel);
      console.log('   butlerUniversalPanel exists:', hasPanel);

      // Manually call openButlerUniversal
      await page.evaluate(() => {
        if (window.openButlerUniversal) window.openButlerUniversal();
      });
      await sleep(1500);

      // Check if panel is now visible
      const panelVisible = await page.evaluate(() => {
        const panel = document.querySelector('.butler-universal-panel');
        return panel ? panel.classList.contains('visible') : false;
      });
      console.log('   Panel visible:', panelVisible);

      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-butler-panel.png` });
      console.log('   📸 03-butler-panel.png (Panel opened with robot icon)');

      // Type a task
      console.log('\n6️⃣  Typing test task...');
      const input = await page.$('#butler-universal-input');
      if (input) {
        await input.type('Go to example.com');
        await sleep(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-task-typed.png` });
        console.log('   📸 04-task-typed.png');

        // Click Execute
        console.log('\n7️⃣  Clicking Execute button...');
        const executeBtn = await page.$('#butler-universal-execute');
        if (executeBtn) {
          await executeBtn.click();

          // Watch for automation
          console.log('   Watching automation...');
          for (let i = 0; i < 15; i++) {
            await sleep(2000);
            await page.screenshot({ path: `${SCREENSHOT_DIR}/05-running-${String(i).padStart(2, '0')}.png` });
            console.log(`   📸 05-running-${String(i).padStart(2, '0')}.png`);

            // Check for confirmation dialog
            const hasConfirm = await page.evaluate(() => {
              return document.body.innerHTML.includes('confirm') ||
                     document.body.innerHTML.includes('Confirm') ||
                     document.querySelector('.swal2-container') !== null;
            });

            if (hasConfirm) {
              console.log('   ⚠️ Confirmation dialog detected');
              // Try to click confirm
              try {
                await page.evaluate(() => {
                  const okBtn = document.querySelector('.swal2-confirm') ||
                                document.querySelector('button:contains("OK")');
                  if (okBtn) okBtn.click();
                });
              } catch (e) {}
            }

            // Check status
            const status = await page.evaluate(() => {
              const statusEl = document.querySelector('#butler-step-description') ||
                               document.querySelector('.butler-status');
              return statusEl?.textContent || '';
            });

            if (status.toLowerCase().includes('complete') || status.toLowerCase().includes('error')) {
              console.log('   Task finished:', status);
              break;
            }
          }
        }
      }
    } else {
      console.log('   ❌ Butler bubble not found or not visible');

      // Try switching to DESK mode where Butler is visible
      console.log('\n   Trying DESK mode...');
      await page.evaluate(() => {
        if (window.setMode) window.setMode('desk');
        else document.body.setAttribute('data-mode', 'desk');
      });
      await sleep(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-desk-mode.png` });
      console.log('   📸 03-desk-mode.png');
    }

    // Final screenshot
    await page.screenshot({ path: `${SCREENSHOT_DIR}/99-final.png` });
    console.log('\n   📸 99-final.png');

    console.log('\n✅ TEST COMPLETE');
    console.log(`   Screenshots: ${SCREENSHOT_DIR}`);
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`   - ${f}`));

    // Keep browser open so user can see
    console.log('\n   Browser will close in 15 seconds (watch the robot icon!)...');
    await sleep(15000);

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

test();
