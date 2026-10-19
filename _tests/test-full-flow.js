/**
 * Complete Phoenix Butler Test - Full Login + Onboarding + All Modes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-complete-test';

const TEST_PHONE = '5551234567';
const TEST_PASSWORD = 'test123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  console.log('🚀 Phoenix Complete Flow Test\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('token') || msg.text().includes('auth')) {
      console.log('   [Browser]:', msg.text().substring(0, 100));
    }
  });

  try {
    // ==========================================
    // 1. LOGIN
    // ==========================================
    console.log('1️⃣  LOGIN');
    await page.goto(`${FRONTEND_URL}/www/index.html`, { waitUntil: 'networkidle2' });

    // Fill phone
    await page.waitForSelector('input[type="tel"]', { timeout: 5000 });
    await page.click('input[type="tel"]', { clickCount: 3 });
    await page.type('input[type="tel"]', TEST_PHONE);

    // Fill password
    await page.type('input[type="password"]', TEST_PASSWORD);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-filled.png` });
    console.log('   Credentials entered');

    // Click ACTIVATE PHOENIX button
    await page.click('#login-btn');
    console.log('   Clicked login button');

    // Wait for response
    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-after-login.png` });

    // Check state
    let state = await page.evaluate(() => ({
      url: location.href,
      hasError: !!document.querySelector('.error') || document.body.innerHTML.includes('Error'),
      token: !!localStorage.getItem('phoenixToken'),
      onboarding: document.body.innerHTML.includes('language') || document.body.innerHTML.includes('voice')
    }));
    console.log('   State:', JSON.stringify(state));

    // ==========================================
    // 2. ONBOARDING (if needed)
    // ==========================================
    if (state.token && state.onboarding) {
      console.log('\n2️⃣  ONBOARDING');

      // Phase 0: Language Selection
      const langBtn = await page.$('#nextPhase0');
      if (langBtn) {
        // Select English if not already
        const englishLang = await page.$('[data-lang="en"]') || await page.$('.language-option');
        if (englishLang) await englishLang.click();
        await sleep(300);

        await langBtn.click();
        console.log('   Language selected');
        await sleep(1000);
      }
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-language.png` });

      // Phase 1: Voice Selection
      const voiceBtn = await page.$('#nextPhase1');
      if (voiceBtn) {
        // Select first voice
        const voiceOption = await page.$('.voice-option') || await page.$('[data-voice]');
        if (voiceOption) await voiceOption.click();
        await sleep(300);

        await voiceBtn.click();
        console.log('   Voice selected');
        await sleep(1000);
      }
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-voice.png` });

      // Phase 2: Account Details (name/email usually pre-filled)
      const accountBtn = await page.$('#nextPhase2');
      if (accountBtn) {
        await accountBtn.click();
        console.log('   Account confirmed');
        await sleep(1000);
      }
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-account.png` });

      // Finish button
      const finishBtn = await page.$('#finishOnboarding') || await page.$('.finish-btn');
      if (finishBtn) {
        await finishBtn.click();
        console.log('   Onboarding finished!');
        await sleep(2000);
      }
    }

    // ==========================================
    // 3. CHECK DASHBOARD
    // ==========================================
    console.log('\n3️⃣  DASHBOARD CHECK');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-current-page.png` });

    state = await page.evaluate(() => ({
      url: location.href,
      mode: document.body.getAttribute('data-mode'),
      butlerBubble: !!document.getElementById('butler-bubble'),
      jarvisOrb: !!document.getElementById('jarvis-orb'),
      genesisPanel: !!document.querySelector('.genesis-panel'),
      allIds: Array.from(document.querySelectorAll('[id]')).map(e => e.id).slice(0, 20)
    }));
    console.log('   Dashboard state:', JSON.stringify(state, null, 2));

    // If still not on dashboard, navigate directly
    if (!state.butlerBubble && !state.jarvisOrb) {
      console.log('   Navigating directly to dashboard...');
      await page.goto(`${FRONTEND_URL}/www/dashboard.html`, { waitUntil: 'networkidle2' });
      await sleep(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-direct-dashboard.png` });

      state = await page.evaluate(() => ({
        url: location.href,
        mode: document.body.getAttribute('data-mode'),
        butlerBubble: !!document.getElementById('butler-bubble'),
        jarvisOrb: !!document.getElementById('jarvis-orb')
      }));
      console.log('   After direct nav:', JSON.stringify(state));
    }

    // ==========================================
    // 4. TEST ALL MODES
    // ==========================================
    if (state.butlerBubble || state.jarvisOrb) {
      console.log('\n4️⃣  TESTING MODES');

      // MANUAL MODE
      console.log('   🎮 MANUAL mode...');
      await page.evaluate(() => {
        if (typeof setMode === 'function') setMode('manual');
        else document.body.setAttribute('data-mode', 'manual');
      });
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/08-manual-mode.png` });

      // Check butler bubble visibility
      const manualButler = await page.evaluate(() => {
        const b = document.getElementById('butler-bubble');
        return b ? { visible: getComputedStyle(b).display !== 'none', onclick: b.onclick?.toString().substring(0, 50) } : null;
      });
      console.log('      Butler bubble:', JSON.stringify(manualButler));

      // Click butler if visible
      if (manualButler?.visible) {
        await page.click('#butler-bubble');
        await sleep(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/09-butler-panel.png` });
        console.log('      Butler panel opened! Screenshot: 09-butler-panel.png');

        // Type test command
        const input = await page.$('#butler-universal-input');
        if (input) {
          await input.type('go to google.com and search for Phoenix AI');
          await page.screenshot({ path: `${SCREENSHOT_DIR}/10-butler-input.png` });
          console.log('      Test command typed! Screenshot: 10-butler-input.png');
        }

        // Close panel
        const closeBtn = await page.$('#butler-universal-close');
        if (closeBtn) await closeBtn.click();
      }

      // VOICE MODE
      console.log('   🎤 VOICE mode...');
      await page.evaluate(() => {
        if (typeof setMode === 'function') setMode('voice');
        else document.body.setAttribute('data-mode', 'voice');
      });
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/11-voice-mode.png` });

      // DESK MODE
      console.log('   🖥️  DESK mode...');
      await page.evaluate(() => {
        if (typeof setMode === 'function') setMode('desk');
        else document.body.setAttribute('data-mode', 'desk');
      });
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/12-desk-mode.png` });

      // GENESIS MODE
      console.log('   🧬 GENESIS mode...');
      await page.evaluate(() => {
        if (typeof setMode === 'function') setMode('genesis');
        else document.body.setAttribute('data-mode', 'genesis');
      });
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/13-genesis-mode.png` });

    } else {
      console.log('   ❌ Could not reach dashboard');
    }

    // ==========================================
    // DONE
    // ==========================================
    console.log('\n✅ TEST COMPLETE');
    console.log(`   Screenshots: ${SCREENSHOT_DIR}`);
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`   - ${f}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

test();
