/**
 * Test Butler - Login with real credentials then test
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-butler-login';

// Test user credentials (just created)
const TEST_PHONE = '5551234567';
const TEST_PASSWORD = 'test123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  console.log('🚀 Phoenix Butler Login Test\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // ==========================================
    // LOGIN
    // ==========================================
    console.log('📍 Logging in...');
    await page.goto(`${FRONTEND_URL}/www/index.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png` });

    // Enter credentials
    const phoneInput = await page.$('input[type="tel"]');
    if (phoneInput) {
      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(TEST_PHONE);
    }

    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.type(TEST_PASSWORD);
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-creds-entered.png` });

    // Click login
    await page.click('button');
    console.log('   Clicked login button');

    // Wait for response
    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-login.png` });

    const url = page.url();
    console.log(`   Current URL: ${url}`);

    // Check if we got onboarding
    const pageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasOnboarding: !!document.getElementById('ob-phase0') || document.body.innerHTML.includes('onboard'),
        hasVoiceSelection: !!document.getElementById('voiceGrid'),
        hasDashboard: !!document.getElementById('jarvis-orb') || !!document.getElementById('butler-bubble'),
        token: localStorage.getItem('phoenixToken')?.substring(0, 30)
      };
    });

    console.log('   State:', JSON.stringify(pageState, null, 2));

    if (pageState.hasOnboarding || pageState.hasVoiceSelection) {
      console.log('\n📋 Completing onboarding...');

      // Skip through onboarding phases
      // Phase 0: Language
      const nextPhase0 = await page.$('#nextPhase0');
      if (nextPhase0) {
        await nextPhase0.click();
        await sleep(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-phase0-done.png` });
        console.log('   Phase 0 (language) done');
      }

      // Phase 1: Voice selection
      const voiceOption = await page.$('.voice-option') || await page.$('[data-voice]');
      if (voiceOption) {
        await voiceOption.click();
        await sleep(500);
      }
      const nextPhase1 = await page.$('#nextPhase1');
      if (nextPhase1) {
        await nextPhase1.click();
        await sleep(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-phase1-done.png` });
        console.log('   Phase 1 (voice) done');
      }

      // Phase 2: Account details (may be pre-filled)
      const nextPhase2 = await page.$('#nextPhase2') || await page.$('button:has-text("Continue")');
      if (nextPhase2) {
        await nextPhase2.click();
        await sleep(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/06-phase2-done.png` });
        console.log('   Phase 2 (account) done');
      }

      // Try to finish onboarding
      const finishBtn = await page.$('#finishOnboarding') || await page.$('button:has-text("Finish")') || await page.$('button:has-text("Start")');
      if (finishBtn) {
        await finishBtn.click();
        await sleep(2000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-onboarding-done.png` });
        console.log('   Onboarding finished');
      }
    }

    // Check where we are now
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-current-state.png` });

    const finalState = await page.evaluate(() => {
      return {
        url: window.location.href,
        mode: document.body.getAttribute('data-mode'),
        hasButlerBubble: !!document.getElementById('butler-bubble'),
        hasJarvisOrb: !!document.getElementById('jarvis-orb'),
        visibleIds: Array.from(document.querySelectorAll('[id]'))
          .filter(el => el.offsetParent !== null)
          .map(el => el.id)
          .slice(0, 15)
      };
    });

    console.log('\n📊 Final state:', JSON.stringify(finalState, null, 2));

    // ==========================================
    // TEST MODES IF ON DASHBOARD
    // ==========================================
    if (finalState.hasButlerBubble || finalState.hasJarvisOrb) {
      console.log('\n✅ On dashboard! Testing Butler...');

      // MANUAL MODE
      await page.evaluate(() => window.setMode && window.setMode('manual'));
      await sleep(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/09-manual-mode.png` });
      console.log('   Screenshot: 09-manual-mode.png');

      // Click butler
      const bubble = await page.$('#butler-bubble');
      if (bubble) {
        await bubble.click();
        await sleep(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/10-butler-clicked.png` });
        console.log('   Screenshot: 10-butler-clicked.png (Butler panel)');
      }

      // VOICE MODE
      await page.evaluate(() => {
        const close = document.querySelector('#butler-universal-close');
        if (close) close.click();
      });
      await page.evaluate(() => window.setMode && window.setMode('voice'));
      await sleep(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/11-voice-mode.png` });
      console.log('   Screenshot: 11-voice-mode.png');

      // DESK MODE
      await page.evaluate(() => window.setMode && window.setMode('desk'));
      await sleep(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/12-desk-mode.png` });
      console.log('   Screenshot: 12-desk-mode.png');

      // GENESIS MODE
      await page.evaluate(() => window.setMode && window.setMode('genesis'));
      await sleep(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/13-genesis-mode.png` });
      console.log('   Screenshot: 13-genesis-mode.png');
    }

    console.log('\n✅ Test complete! Screenshots in:', SCREENSHOT_DIR);
    const files = fs.readdirSync(SCREENSHOT_DIR).sort();
    files.forEach(f => console.log(`   - ${f}`));

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
  } finally {
    await browser.close();
  }
}

test().catch(console.error);
