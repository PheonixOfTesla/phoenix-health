/**
 * Test Butler Universal Agent with pre-authenticated token
 * Takes screenshots of each mode
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-butler-final';

// Fresh token from registration
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDg5OGE4NDZhNDA5M2NiNjRhZTM0MyIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjYzNjUzNTMsImV4cCI6MTc2NjQ1MTc1M30.YNWoLOoN-kSuJVnGLfkGn2uf_VOjG7IMV-qi5sTiEC4';

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testButlerModes() {
  console.log('🚀 Starting Phoenix Butler Test with Token\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ==========================================
    // STEP 1: GO TO FRONTEND AND INJECT TOKEN
    // ==========================================
    console.log('📍 Step 1: Injecting authentication token...');

    // Go to index first
    await page.goto(`${FRONTEND_URL}/www/index.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Inject token into localStorage
    await page.evaluate((token) => {
      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('phoenixUser', JSON.stringify({
        _id: '694898a846a4093cb64ae343',
        name: 'Test User',
        email: 'test@phoenix.ai',
        phone: '5551234567',
        roles: ['client']
      }));
      console.log('Token injected:', token.substring(0, 50) + '...');
    }, TEST_TOKEN);

    console.log('   Token injected into localStorage');

    // Now navigate to dashboard
    console.log('   Navigating to dashboard...');
    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard-loaded.png` });
    console.log('   Screenshot: 01-dashboard-loaded.png');

    // Check if we're actually on dashboard
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        mode: document.body.getAttribute('data-mode'),
        token: localStorage.getItem('phoenixToken')?.substring(0, 30) + '...',
        hasButlerBubble: !!document.getElementById('butler-bubble'),
        hasJarvisOrb: !!document.getElementById('jarvis-orb'),
        bodyHTML: document.body.innerHTML.substring(0, 500)
      };
    });

    console.log('   Page info:', JSON.stringify({
      url: pageInfo.url,
      title: pageInfo.title,
      mode: pageInfo.mode,
      hasButlerBubble: pageInfo.hasButlerBubble,
      hasJarvisOrb: pageInfo.hasJarvisOrb
    }, null, 2));

    // If redirected to login, the token didn't work
    if (pageInfo.url.includes('index.html')) {
      console.log('   ⚠️  Still on login page - checking why...');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-still-login.png` });

      // Try to skip onboarding if that's the issue
      await page.evaluate(() => {
        localStorage.setItem('onboardingComplete', 'true');
        localStorage.setItem('phoenixOnboarded', 'true');
      });

      await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await sleep(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-onboard-skip.png` });
      console.log('   Screenshot: 03-after-onboard-skip.png');
    }

    // ==========================================
    // STEP 2: TEST MANUAL MODE - BUTLER BUBBLE
    // ==========================================
    console.log('\n🎮 Step 2: Testing MANUAL mode...');

    await page.evaluate(() => {
      if (window.setMode) window.setMode('manual');
      else if (window.switchMode) window.switchMode('manual');
      else document.body.setAttribute('data-mode', 'manual');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-manual-mode.png` });
    console.log('   Screenshot: 04-manual-mode.png');

    // Check butler bubble
    const butlerCheck = await page.evaluate(() => {
      const bubble = document.getElementById('butler-bubble');
      if (!bubble) return { exists: false };

      const style = window.getComputedStyle(bubble);
      const rect = bubble.getBoundingClientRect();

      return {
        exists: true,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        position: { top: rect.top, right: window.innerWidth - rect.right, width: rect.width, height: rect.height },
        onclick: bubble.getAttribute('onclick')
      };
    });

    console.log('   Butler bubble:', JSON.stringify(butlerCheck, null, 2));

    if (butlerCheck.exists && butlerCheck.display !== 'none') {
      console.log('   ✅ Butler bubble visible! Clicking...');

      await page.click('#butler-bubble');
      await sleep(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-butler-clicked.png` });
      console.log('   Screenshot: 05-butler-clicked.png');

      // Check panel state
      const panelCheck = await page.evaluate(() => {
        const panel = document.querySelector('.butler-universal-panel');
        if (!panel) return { exists: false };

        const style = window.getComputedStyle(panel);
        return {
          exists: true,
          display: style.display,
          visibility: style.visibility,
          hasInput: !!panel.querySelector('#butler-universal-input'),
          hasExecuteBtn: !!panel.querySelector('#butler-universal-execute')
        };
      });

      console.log('   Panel state:', JSON.stringify(panelCheck, null, 2));

      if (panelCheck.exists && panelCheck.hasInput) {
        console.log('   ✅ Butler panel opened! Testing input...');

        // Type a test command
        await page.type('#butler-universal-input', 'go to google.com');
        await sleep(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-butler-input-typed.png` });
        console.log('   Screenshot: 06-butler-input-typed.png');
      }
    }

    // ==========================================
    // STEP 3: TEST VOICE MODE
    // ==========================================
    console.log('\n🎤 Step 3: Testing VOICE mode...');

    // Close panel if open
    await page.evaluate(() => {
      const closeBtn = document.querySelector('#butler-universal-close');
      if (closeBtn) closeBtn.click();
    });

    await page.evaluate(() => {
      if (window.setMode) window.setMode('voice');
      else if (window.switchMode) window.switchMode('voice');
      else document.body.setAttribute('data-mode', 'voice');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-voice-mode.png` });
    console.log('   Screenshot: 07-voice-mode.png');

    // ==========================================
    // STEP 4: TEST DESK MODE
    // ==========================================
    console.log('\n🖥️  Step 4: Testing DESK mode...');

    await page.evaluate(() => {
      if (window.setMode) window.setMode('desk');
      else if (window.switchMode) window.switchMode('desk');
      else document.body.setAttribute('data-mode', 'desk');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-desk-mode.png` });
    console.log('   Screenshot: 08-desk-mode.png');

    // Check for butler bubble in desk mode
    const deskButler = await page.evaluate(() => {
      const bubble = document.getElementById('butler-bubble');
      if (!bubble) return { exists: false };
      const style = window.getComputedStyle(bubble);
      return {
        exists: true,
        display: style.display,
        visibility: style.visibility
      };
    });
    console.log('   Butler in DESK mode:', JSON.stringify(deskButler));

    // ==========================================
    // STEP 5: TEST GENESIS MODE
    // ==========================================
    console.log('\n🧬 Step 5: Testing GENESIS mode...');

    await page.evaluate(() => {
      if (window.setMode) window.setMode('genesis');
      else if (window.switchMode) window.switchMode('genesis');
      else document.body.setAttribute('data-mode', 'genesis');
    });

    await sleep(1500);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-genesis-mode.png` });
    console.log('   Screenshot: 09-genesis-mode.png');

    // Check for genesis chat input
    const genesisChat = await page.evaluate(() => {
      const chatInput = document.querySelector('#genesis-input') ||
                        document.querySelector('.genesis-input') ||
                        document.querySelector('[data-genesis-input]') ||
                        document.querySelector('textarea');
      return {
        hasInput: !!chatInput,
        placeholder: chatInput?.placeholder,
        id: chatInput?.id
      };
    });
    console.log('   Genesis chat:', JSON.stringify(genesisChat));

    // ==========================================
    // DONE
    // ==========================================
    console.log('\n✅ Test complete!');
    console.log(`   Screenshots saved to: ${SCREENSHOT_DIR}`);

    const files = fs.readdirSync(SCREENSHOT_DIR).sort();
    console.log('   Files:');
    files.forEach(f => console.log(`   - ${f}`));

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error-state.png` });
  } finally {
    await browser.close();
  }
}

testButlerModes().catch(console.error);
