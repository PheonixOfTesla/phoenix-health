/**
 * Test Butler - Final working version
 * Login, skip onboarding, test all 4 modes with screenshots
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-butler-final';

// Test user (bypass verification with @test.com)
const TEST_EMAIL = 'butler-test@test.com';
const TEST_PASSWORD = 'TestButler123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  console.log('🚀 Phoenix Butler Final Test\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Minimal console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('redirect') || text.includes('Authenticated') || text.includes('[ViewManager]')) {
      console.log('   [Browser]:', text.substring(0, 100));
    }
  });

  try {
    // ==========================================
    // 1. LOGIN
    // ==========================================
    console.log('1️⃣  LOGIN');
    await page.goto(`${FRONTEND_URL}/www/index.html`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Fill email in phone field
    const phoneInput = await page.$('input[type="tel"]');
    if (phoneInput) {
      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(TEST_EMAIL);
    }

    // Fill password
    const passInput = await page.$('input[type="password"]');
    if (passInput) await passInput.type(TEST_PASSWORD);

    // Click login
    const loginBtn = await page.$('#login-btn');
    if (loginBtn) await loginBtn.click();

    console.log('   Submitted login...');
    await sleep(3000);

    // ==========================================
    // 2. SET ONBOARDING COMPLETE + GO TO DASHBOARD
    // ==========================================
    console.log('\n2️⃣  BYPASS ONBOARDING & GO TO DASHBOARD');

    // Mark onboarding as complete in localStorage
    await page.evaluate(() => {
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('phoenixOnboarded', 'true');
    });

    // Go directly to dashboard
    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, { waitUntil: 'networkidle2' });
    await sleep(3000);

    // Check state
    const dashState = await page.evaluate(() => ({
      url: location.href,
      mode: document.body.getAttribute('data-mode') || document.body.getAttribute('data-phoenix-mode'),
      hasButler: !!document.getElementById('butler-bubble'),
      hasJarvis: !!document.getElementById('jarvis-orb'),
      token: !!localStorage.getItem('phoenixToken')
    }));

    console.log('   Dashboard state:', JSON.stringify(dashState));

    if (dashState.url.includes('index.html') || !dashState.hasButler) {
      console.log('   ⚠️  Not on dashboard - taking screenshot of current state');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/00-current-state.png` });

      // Check what we have
      const pageContent = await page.evaluate(() => ({
        title: document.title,
        hasOnboarding: document.body.innerHTML.includes('onboard'),
        visibleIds: Array.from(document.querySelectorAll('[id]'))
          .filter(e => e.offsetParent !== null)
          .map(e => e.id).slice(0, 15)
      }));
      console.log('   Page content:', JSON.stringify(pageContent));

      // If onboarding, try to complete it
      if (pageContent.hasOnboarding) {
        console.log('   Completing onboarding...');

        // Phase 0: Language
        await page.evaluate(() => {
          const btn = document.getElementById('nextPhase0');
          if (btn) btn.click();
        });
        await sleep(1000);

        // Phase 1: Voice
        await page.evaluate(() => {
          const voiceOpt = document.querySelector('.voice-option');
          if (voiceOpt) voiceOpt.click();
        });
        await sleep(500);
        await page.evaluate(() => {
          const btn = document.getElementById('nextPhase1');
          if (btn) btn.click();
        });
        await sleep(1000);

        // Phase 2: Account
        await page.evaluate(() => {
          const btn = document.getElementById('nextPhase2');
          if (btn) btn.click();
        });
        await sleep(1000);

        // Finish
        await page.evaluate(() => {
          const btn = document.getElementById('finishOnboarding');
          if (btn) btn.click();
        });
        await sleep(2000);

        console.log('   Onboarding completed!');

        // Navigate to dashboard again
        await page.goto(`${FRONTEND_URL}/www/dashboard.html`, { waitUntil: 'networkidle2' });
        await sleep(2000);
      }
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-dashboard.png` });
    console.log('   Screenshot: 01-dashboard.png');

    // ==========================================
    // 3. MANUAL MODE - BUTLER BUBBLE
    // ==========================================
    console.log('\n3️⃣  MANUAL MODE');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('manual');
      else document.body.setAttribute('data-mode', 'manual');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-manual-mode.png` });
    console.log('   Screenshot: 02-manual-mode.png');

    // Check butler
    const butlerState = await page.evaluate(() => {
      const b = document.getElementById('butler-bubble');
      if (!b) return { exists: false };
      const s = getComputedStyle(b);
      return {
        exists: true,
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity
      };
    });
    console.log('   Butler bubble:', JSON.stringify(butlerState));

    // Click butler if visible
    if (butlerState.exists && butlerState.display !== 'none') {
      console.log('   ✅ Clicking butler bubble...');
      await page.click('#butler-bubble');
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-butler-panel.png` });
      console.log('   Screenshot: 03-butler-panel.png (Butler Universal Panel)');

      // Type a test command
      const input = await page.$('#butler-universal-input');
      if (input) {
        await input.type('order pizza from Dominos');
        await sleep(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-butler-command.png` });
        console.log('   Screenshot: 04-butler-command.png');
      }

      // Close panel
      const close = await page.$('#butler-universal-close');
      if (close) await close.click();
      await sleep(500);
    }

    // ==========================================
    // 4. VOICE MODE
    // ==========================================
    console.log('\n4️⃣  VOICE MODE');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('voice');
      else document.body.setAttribute('data-mode', 'voice');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-voice-mode.png` });
    console.log('   Screenshot: 05-voice-mode.png');

    // ==========================================
    // 5. DESK MODE
    // ==========================================
    console.log('\n5️⃣  DESK MODE');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('desk');
      else document.body.setAttribute('data-mode', 'desk');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-desk-mode.png` });
    console.log('   Screenshot: 06-desk-mode.png');

    // ==========================================
    // 6. GENESIS MODE
    // ==========================================
    console.log('\n6️⃣  GENESIS MODE');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('genesis');
      else document.body.setAttribute('data-mode', 'genesis');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-genesis-mode.png` });
    console.log('   Screenshot: 07-genesis-mode.png');

    // ==========================================
    // DONE
    // ==========================================
    console.log('\n✅ ALL SCREENSHOTS CAPTURED');
    console.log(`   Directory: ${SCREENSHOT_DIR}`);
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`   - ${f}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

test();
