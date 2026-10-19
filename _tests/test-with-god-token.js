/**
 * Test Butler with God Mode Token (already verified user)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-god-test';

// Fresh test token (just registered)
const GOD_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDg5ZDUwNDZhNDA5M2NiNjRhZTg3YyIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjYzNjY1NDQsImV4cCI6MTc2NjQ1Mjk0NH0.ATQdMKJAeGudY6UC-bR8Xyiv0FCey_eu3sFAe9eh0AQ';

const GOD_USER = {
  _id: '69489d5046a4093cb64ae87c',
  name: 'Butler Test User',
  email: 'test-butler@phoenix.ai',
  phone: '5559876543',
  roles: ['client']
};

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  console.log('🚀 Phoenix Butler Test with God Mode Token\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Auth') || text.includes('token') || text.includes('redirect')) {
      console.log('   [Browser]:', text.substring(0, 100));
    }
  });

  try {
    // ==========================================
    // 1. INJECT TOKEN BEFORE NAVIGATION
    // ==========================================
    console.log('1️⃣  INJECTING TOKEN');

    // Go to a page first to set localStorage
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    // Inject auth data
    await page.evaluate((token, user) => {
      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('phoenixUser', JSON.stringify(user));
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('phoenixOnboarded', 'true');
      console.log('Token injected:', token.substring(0, 50));
    }, GOD_TOKEN, GOD_USER);

    console.log('   Token and user data injected');

    // ==========================================
    // 2. NAVIGATE TO DASHBOARD
    // ==========================================
    console.log('\n2️⃣  NAVIGATING TO DASHBOARD');

    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png` });

    const state = await page.evaluate(() => ({
      url: location.href,
      mode: document.body.getAttribute('data-mode') || document.body.getAttribute('data-phoenix-mode'),
      butlerBubble: !!document.getElementById('butler-bubble'),
      jarvisOrb: !!document.getElementById('jarvis-orb'),
      openButlerUniversal: typeof window.openButlerUniversal === 'function',
      setMode: typeof window.setMode === 'function'
    }));

    console.log('   Dashboard state:', JSON.stringify(state, null, 2));

    if (state.url.includes('index.html')) {
      console.log('   ⚠️  Redirected to login - token may be expired');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-redirected.png` });
      return;
    }

    // ==========================================
    // 3. TEST MANUAL MODE + BUTLER BUBBLE
    // ==========================================
    console.log('\n3️⃣  MANUAL MODE');

    if (state.setMode) {
      await page.evaluate(() => window.setMode('manual'));
    } else {
      await page.evaluate(() => document.body.setAttribute('data-mode', 'manual'));
    }
    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-manual-mode.png` });
    console.log('   Screenshot: 03-manual-mode.png');

    // Check butler bubble
    const bubbleState = await page.evaluate(() => {
      const bubble = document.getElementById('butler-bubble');
      if (!bubble) return { exists: false };
      const style = getComputedStyle(bubble);
      return {
        exists: true,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity
      };
    });
    console.log('   Butler bubble:', JSON.stringify(bubbleState));

    // Click butler bubble if visible
    if (bubbleState.exists && bubbleState.display !== 'none') {
      console.log('   ✅ Butler bubble visible! Clicking...');
      await page.click('#butler-bubble');
      await sleep(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-butler-panel.png` });
      console.log('   Screenshot: 04-butler-panel.png (Butler Universal Panel)');

      // Check panel
      const panelState = await page.evaluate(() => {
        const panel = document.querySelector('.butler-universal-panel');
        return panel ? {
          exists: true,
          hasInput: !!document.getElementById('butler-universal-input'),
          hasExecuteBtn: !!document.getElementById('butler-universal-execute')
        } : { exists: false };
      });
      console.log('   Panel state:', JSON.stringify(panelState));

      // Type test command
      if (panelState.hasInput) {
        await page.type('#butler-universal-input', 'go to google.com and search for "Phoenix AI assistant"');
        await sleep(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-butler-input.png` });
        console.log('   Screenshot: 05-butler-input.png (Command typed)');
      }

      // Close panel
      const closeBtn = await page.$('#butler-universal-close');
      if (closeBtn) await closeBtn.click();
      await sleep(500);
    }

    // ==========================================
    // 4. TEST VOICE MODE
    // ==========================================
    console.log('\n4️⃣  VOICE MODE');
    await page.evaluate(() => window.setMode ? window.setMode('voice') : document.body.setAttribute('data-mode', 'voice'));
    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-voice-mode.png` });
    console.log('   Screenshot: 06-voice-mode.png');

    // ==========================================
    // 5. TEST DESK MODE
    // ==========================================
    console.log('\n5️⃣  DESK MODE');
    await page.evaluate(() => window.setMode ? window.setMode('desk') : document.body.setAttribute('data-mode', 'desk'));
    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-desk-mode.png` });
    console.log('   Screenshot: 07-desk-mode.png');

    // Check butler in desk mode
    const deskButler = await page.evaluate(() => {
      const b = document.getElementById('butler-bubble');
      return b ? { display: getComputedStyle(b).display } : null;
    });
    console.log('   Butler in DESK:', JSON.stringify(deskButler));

    // ==========================================
    // 6. TEST GENESIS MODE
    // ==========================================
    console.log('\n6️⃣  GENESIS MODE');
    await page.evaluate(() => window.setMode ? window.setMode('genesis') : document.body.setAttribute('data-mode', 'genesis'));
    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-genesis-mode.png` });
    console.log('   Screenshot: 08-genesis-mode.png');

    // ==========================================
    // DONE
    // ==========================================
    console.log('\n✅ ALL TESTS COMPLETE');
    console.log(`   Screenshots saved to: ${SCREENSHOT_DIR}`);
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`   - ${f}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

test();
