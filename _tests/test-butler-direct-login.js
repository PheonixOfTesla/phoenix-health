/**
 * Test Butler - Direct Frontend Login Flow
 * Uses the actual login form to authenticate, then tests all modes
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-butler-direct';

// Use @test.com email to bypass verification requirement
const TEST_EMAIL = 'butler-test@test.com';
const TEST_PHONE = '5559999888';
const TEST_PASSWORD = 'TestButler123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test() {
  console.log('🚀 Phoenix Butler Direct Login Test\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Log browser console
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Auth') || text.includes('token') || text.includes('redirect') || text.includes('login')) {
      console.log('   [Browser]:', text.substring(0, 120));
    }
  });

  try {
    // ==========================================
    // 1. GO TO LOGIN PAGE
    // ==========================================
    console.log('1️⃣  NAVIGATING TO LOGIN');
    await page.goto(`${FRONTEND_URL}/www/index.html`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png` });
    console.log('   Screenshot: 01-login-page.png');

    // Check what inputs are available
    const loginForm = await page.evaluate(() => {
      const phoneInput = document.querySelector('input[type="tel"]');
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const loginBtn = document.querySelector('#login-btn') || document.querySelector('button');
      return {
        hasPhone: !!phoneInput,
        hasEmail: !!emailInput,
        hasPassword: !!passwordInput,
        hasLoginBtn: !!loginBtn,
        btnText: loginBtn?.textContent
      };
    });
    console.log('   Login form:', JSON.stringify(loginForm));

    // ==========================================
    // 2. FILL LOGIN FORM
    // ==========================================
    console.log('\n2️⃣  FILLING LOGIN FORM');

    // Enter email (login form uses phone input but backend accepts email there)
    if (loginForm.hasPhone) {
      const phoneInput = await page.$('input[type="tel"]');
      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(TEST_EMAIL);  // Use email instead of phone
      console.log('   Entered email:', TEST_EMAIL);
    }

    // Enter password
    if (loginForm.hasPassword) {
      const passInput = await page.$('input[type="password"]');
      await passInput.type(TEST_PASSWORD);
      console.log('   Entered password');
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-form-filled.png` });
    console.log('   Screenshot: 02-form-filled.png');

    // ==========================================
    // 3. CLICK LOGIN
    // ==========================================
    console.log('\n3️⃣  CLICKING LOGIN');

    const loginBtn = await page.$('#login-btn') || await page.$('button');
    if (loginBtn) {
      await loginBtn.click();
      console.log('   Clicked login button');
    }

    // Wait for login response
    await sleep(5000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-after-login.png` });
    console.log('   Screenshot: 03-after-login.png');

    // Check where we are
    const afterLogin = await page.evaluate(() => ({
      url: location.href,
      hasOnboarding: !!document.getElementById('onboarding-container') || document.body.innerHTML.includes('onboard'),
      hasDashboard: !!document.getElementById('jarvis-orb') || !!document.getElementById('butler-bubble'),
      token: !!localStorage.getItem('phoenixToken'),
      errorMsg: document.querySelector('.error-message')?.textContent || document.querySelector('.error')?.textContent
    }));
    console.log('   After login state:', JSON.stringify(afterLogin));

    // ==========================================
    // 4. HANDLE ONBOARDING IF NEEDED
    // ==========================================
    if (afterLogin.hasOnboarding || afterLogin.url.includes('onboard')) {
      console.log('\n4️⃣  COMPLETING ONBOARDING');

      // Wait for onboarding to load
      await sleep(2000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-onboarding-start.png` });

      // Phase 0: Language
      const phase0Btn = await page.$('#nextPhase0');
      if (phase0Btn) {
        await phase0Btn.click();
        await sleep(1000);
        console.log('   Phase 0: Language selected');
      }

      // Phase 1: Voice
      const voiceOption = await page.$('.voice-option');
      if (voiceOption) {
        await voiceOption.click();
        await sleep(500);
      }
      const phase1Btn = await page.$('#nextPhase1');
      if (phase1Btn) {
        await phase1Btn.click();
        await sleep(1000);
        console.log('   Phase 1: Voice selected');
      }

      // Phase 2: Account
      const phase2Btn = await page.$('#nextPhase2');
      if (phase2Btn) {
        await phase2Btn.click();
        await sleep(1000);
        console.log('   Phase 2: Account confirmed');
      }

      // Finish
      const finishBtn = await page.$('#finishOnboarding');
      if (finishBtn) {
        await finishBtn.click();
        await sleep(2000);
        console.log('   Onboarding finished!');
      }

      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-onboarding-done.png` });
    }

    // ==========================================
    // 5. CHECK DASHBOARD
    // ==========================================
    console.log('\n5️⃣  CHECKING DASHBOARD');

    // Try navigating directly to dashboard
    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, { waitUntil: 'networkidle2' });
    await sleep(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-dashboard.png` });

    const dashState = await page.evaluate(() => ({
      url: location.href,
      mode: document.body.getAttribute('data-mode') || document.body.getAttribute('data-phoenix-mode'),
      hasButler: !!document.getElementById('butler-bubble'),
      hasJarvis: !!document.getElementById('jarvis-orb'),
      hasSetMode: typeof window.setMode === 'function',
      visibleIds: Array.from(document.querySelectorAll('[id]'))
        .filter(el => el.offsetParent !== null)
        .map(el => el.id)
        .slice(0, 20)
    }));
    console.log('   Dashboard state:', JSON.stringify(dashState, null, 2));

    if (dashState.url.includes('index.html')) {
      console.log('   ⚠️ Still on login - checking localStorage');
      const storage = await page.evaluate(() => ({
        token: localStorage.getItem('phoenixToken')?.substring(0, 50),
        user: localStorage.getItem('phoenixUser')?.substring(0, 100)
      }));
      console.log('   Storage:', JSON.stringify(storage));
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-login-redirect.png` });
      console.log('\n❌ Authentication failed - check credentials');
      await browser.close();
      return;
    }

    // ==========================================
    // 6. TEST ALL MODES
    // ==========================================
    console.log('\n6️⃣  TESTING ALL MODES');

    // MANUAL MODE
    console.log('   🎮 MANUAL mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('manual');
      else document.body.setAttribute('data-mode', 'manual');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-manual-mode.png` });

    // Check butler bubble
    const butlerVisible = await page.evaluate(() => {
      const bubble = document.getElementById('butler-bubble');
      if (!bubble) return { exists: false };
      const style = getComputedStyle(bubble);
      return {
        exists: true,
        display: style.display,
        visibility: style.visibility,
        onclick: !!bubble.onclick || bubble.getAttribute('onclick')
      };
    });
    console.log('   Butler bubble:', JSON.stringify(butlerVisible));

    // Click butler if visible
    if (butlerVisible.exists && butlerVisible.display !== 'none') {
      console.log('   ✅ Clicking butler bubble...');
      await page.click('#butler-bubble');
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/09-butler-panel.png` });
      console.log('   Screenshot: 09-butler-panel.png (Butler Universal Panel)');

      // Check panel
      const panelState = await page.evaluate(() => {
        const panel = document.querySelector('.butler-universal-panel');
        return {
          exists: !!panel,
          hasInput: !!document.getElementById('butler-universal-input'),
          hasExecute: !!document.getElementById('butler-universal-execute')
        };
      });
      console.log('   Panel:', JSON.stringify(panelState));

      // Type test command
      if (panelState.hasInput) {
        await page.type('#butler-universal-input', 'order pizza from Dominos');
        await sleep(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/10-butler-input.png` });
        console.log('   Screenshot: 10-butler-input.png (Command typed)');
      }

      // Close panel
      const close = await page.$('#butler-universal-close');
      if (close) await close.click();
      await sleep(500);
    }

    // VOICE MODE
    console.log('   🎤 VOICE mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('voice');
      else document.body.setAttribute('data-mode', 'voice');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-voice-mode.png` });

    // DESK MODE
    console.log('   🖥️  DESK mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('desk');
      else document.body.setAttribute('data-mode', 'desk');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-desk-mode.png` });

    // GENESIS MODE
    console.log('   🧬 GENESIS mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('genesis');
      else document.body.setAttribute('data-mode', 'genesis');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-genesis-mode.png` });

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
