/**
 * Test Butler Universal Agent with authentication
 * Takes screenshots of each mode after login
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-butler-test';

// Test credentials - using phone login
const TEST_PHONE = '3054399907';
const TEST_PASSWORD = 'test123';

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testButlerModes() {
  console.log('🚀 Starting Phoenix Butler Authenticated Test\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ==========================================
    // STEP 1: LOGIN
    // ==========================================
    console.log('📍 Step 1: Navigating to Phoenix login...');
    await page.goto(`${FRONTEND_URL}/www/index.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png` });
    console.log('   Screenshot: 01-login-page.png');

    // Check if we have a login form
    const hasPhoneInput = await page.$('input[type="tel"], input[placeholder*="phone"], input[placeholder*="555"]');

    if (hasPhoneInput) {
      console.log('   Found phone login form, attempting login...');

      // Find and fill phone number
      const phoneInput = await page.$('input[type="tel"]') || await page.$('input[placeholder*="555"]');
      if (phoneInput) {
        await phoneInput.click({ clickCount: 3 });
        await phoneInput.type(TEST_PHONE);
        console.log('   Entered phone number');
      }

      // Find and fill password
      const passwordInput = await page.$('input[type="password"]');
      if (passwordInput) {
        await passwordInput.type(TEST_PASSWORD);
        console.log('   Entered password');
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-credentials-entered.png` });
      console.log('   Screenshot: 02-credentials-entered.png');

      // Click login button
      const loginBtn = await page.$('button[type="submit"]') ||
                       await page.$('button:has-text("ACTIVATE")') ||
                       await page.$('button:has-text("LOGIN")') ||
                       await page.$('.login-btn') ||
                       await page.$('button');

      if (loginBtn) {
        const btnText = await page.evaluate(el => el.textContent, loginBtn);
        console.log(`   Clicking button: "${btnText.trim()}"`);
        await loginBtn.click();

        // Wait for navigation or response
        await sleep(3000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-login-click.png` });
        console.log('   Screenshot: 03-after-login-click.png');
      }
    }

    // Check current URL after login attempt
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    // If still on login page, try navigating directly to dashboard
    if (currentUrl.includes('index.html')) {
      console.log('   Still on login page, checking for stored token...');

      // Check localStorage for token
      const token = await page.evaluate(() => localStorage.getItem('phoenixToken'));
      console.log(`   Token exists: ${!!token}`);

      if (token) {
        // Try navigating to dashboard
        await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
      }
    }

    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-current-state.png` });
    console.log('   Screenshot: 04-current-state.png');

    // ==========================================
    // STEP 2: CHECK DASHBOARD STATE
    // ==========================================
    console.log('\n📋 Step 2: Checking dashboard elements...');

    const dashboardState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        mode: document.body.getAttribute('data-mode') || document.body.getAttribute('data-phoenix-mode'),
        hasButlerBubble: !!document.getElementById('butler-bubble'),
        butlerBubbleStyle: document.getElementById('butler-bubble')?.style.cssText,
        hasJarvisOrb: !!document.getElementById('jarvis-orb'),
        hasModeSelector: !!document.querySelector('[data-mode-selector]') || !!document.querySelector('.mode-tab'),
        visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
        }).length,
        bodyClasses: document.body.className,
        hasPhoenixConfig: !!window.PhoenixConfig,
        hasOpenButlerUniversal: typeof window.openButlerUniversal === 'function'
      };
    });

    console.log('   Dashboard state:', JSON.stringify(dashboardState, null, 2));

    // ==========================================
    // STEP 3: TEST MANUAL MODE - BUTLER BUBBLE
    // ==========================================
    console.log('\n🎮 Step 3: Testing MANUAL mode Butler...');

    // Try to switch to manual mode
    await page.evaluate(() => {
      if (window.setMode) window.setMode('manual');
      else if (window.switchToManual) window.switchToManual();
      else document.body.setAttribute('data-mode', 'manual');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-manual-mode.png` });
    console.log('   Screenshot: 05-manual-mode.png');

    // Look for butler bubble
    const butlerBubble = await page.$('#butler-bubble');
    if (butlerBubble) {
      console.log('   ✅ Butler bubble found!');

      // Get its computed style
      const bubbleVisible = await page.evaluate(() => {
        const el = document.getElementById('butler-bubble');
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          visibility: style.visibility,
          opacity: style.opacity,
          position: style.position,
          top: style.top,
          right: style.right
        };
      });
      console.log('   Butler bubble style:', JSON.stringify(bubbleVisible));

      // Try to click it
      try {
        await butlerBubble.click();
        console.log('   Clicked butler bubble!');
        await sleep(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-butler-panel-opened.png` });
        console.log('   Screenshot: 06-butler-panel-opened.png');

        // Check if universal panel appeared
        const panelState = await page.evaluate(() => {
          const panel = document.querySelector('.butler-universal-panel');
          return {
            exists: !!panel,
            visible: panel ? window.getComputedStyle(panel).display !== 'none' : false,
            innerHTML: panel?.innerHTML?.substring(0, 200)
          };
        });
        console.log('   Panel state:', JSON.stringify(panelState));

      } catch (e) {
        console.log('   Could not click butler bubble:', e.message);
      }
    } else {
      console.log('   ❌ Butler bubble not found');

      // List all visible elements with IDs
      const visibleIds = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[id]'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map(el => el.id)
          .slice(0, 20);
      });
      console.log('   Visible element IDs:', visibleIds);
    }

    // ==========================================
    // STEP 4: TEST VOICE MODE
    // ==========================================
    console.log('\n🎤 Step 4: Testing VOICE mode...');

    await page.evaluate(() => {
      if (window.setMode) window.setMode('voice');
      else if (window.switchToVoice) window.switchToVoice();
      else document.body.setAttribute('data-mode', 'voice');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-voice-mode.png` });
    console.log('   Screenshot: 07-voice-mode.png');

    // ==========================================
    // STEP 5: TEST DESK MODE
    // ==========================================
    console.log('\n🖥️  Step 5: Testing DESK mode...');

    await page.evaluate(() => {
      if (window.setMode) window.setMode('desk');
      else if (window.switchToDesk) window.switchToDesk();
      else document.body.setAttribute('data-mode', 'desk');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-desk-mode.png` });
    console.log('   Screenshot: 08-desk-mode.png');

    // ==========================================
    // STEP 6: TEST GENESIS MODE
    // ==========================================
    console.log('\n🧬 Step 6: Testing GENESIS mode...');

    await page.evaluate(() => {
      if (window.setMode) window.setMode('genesis');
      else if (window.switchToGenesis) window.switchToGenesis();
      else document.body.setAttribute('data-mode', 'genesis');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-genesis-mode.png` });
    console.log('   Screenshot: 09-genesis-mode.png');

    // ==========================================
    // DONE
    // ==========================================
    console.log('\n✅ Test complete!');
    console.log(`   Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('   Files:');

    const files = fs.readdirSync(SCREENSHOT_DIR);
    files.forEach(f => console.log(`   - ${f}`));

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error-state.png` });
    console.log('   Error screenshot saved');
  } finally {
    await browser.close();
  }
}

testButlerModes().catch(console.error);
