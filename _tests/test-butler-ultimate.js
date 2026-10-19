/**
 * Ultimate Butler Test - Uses login API directly then constructs page state
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const BACKEND_URL = 'https://pal-backend-production.up.railway.app';
const SCREENSHOT_DIR = '/tmp/phoenix-butler-ultimate';

// Test credentials
const TEST_EMAIL = 'butler-test@test.com';
const TEST_PASSWORD = 'TestButler123';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Helper to make API call
function apiCall(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('🚀 Phoenix Butler Ultimate Test\n');

  // ==========================================
  // 1. GET TOKEN VIA DIRECT API CALL
  // ==========================================
  console.log('1️⃣  GETTING TOKEN VIA API');

  const loginResult = await apiCall('/api/auth/login', 'POST', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (!loginResult.success || !loginResult.token) {
    console.log('❌ Login failed:', loginResult.message);
    return;
  }

  const TOKEN = loginResult.token;
  const USER = loginResult.user;
  console.log('   ✅ Got token:', TOKEN.substring(0, 50) + '...');
  console.log('   User:', USER.name, '(' + USER.email + ')');

  // ==========================================
  // 2. LAUNCH BROWSER WITH INJECTED TOKEN
  // ==========================================
  console.log('\n2️⃣  LAUNCHING BROWSER');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // First, go to frontend domain to set localStorage
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' });

    // Inject ALL necessary auth data BEFORE any navigation
    await page.evaluate((token, user) => {
      // Clear any old data
      localStorage.clear();
      sessionStorage.clear();

      // Set auth
      localStorage.setItem('phoenixToken', token);
      localStorage.setItem('phoenixUser', JSON.stringify(user));
      localStorage.setItem('phoenix_user_id', user._id);

      // Set onboarding complete
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('phoenixOnboarded', 'true');

      // Also set in sessionStorage (some code checks there)
      sessionStorage.setItem('phoenixToken', token);
      sessionStorage.setItem('phoenixUser', JSON.stringify(user));
      sessionStorage.setItem('phoenix_greeted', 'true');

      console.log('✅ Auth data injected successfully');
    }, TOKEN, USER);

    console.log('   Token injected into localStorage + sessionStorage');

    // Now navigate to dashboard (with token already in place)
    console.log('   Navigating to dashboard...');
    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await sleep(3000);

    // Check state
    const state = await page.evaluate(() => ({
      url: location.href,
      mode: document.body.getAttribute('data-mode') || document.body.getAttribute('data-phoenix-mode'),
      hasButler: !!document.getElementById('butler-bubble'),
      hasJarvis: !!document.getElementById('jarvis-orb'),
      hasSetMode: typeof window.setMode === 'function',
      token: localStorage.getItem('phoenixToken')?.substring(0, 30),
      bodyClasses: document.body.className,
      visibleIds: Array.from(document.querySelectorAll('[id]'))
        .filter(e => e.offsetParent !== null)
        .map(e => e.id).slice(0, 25)
    }));

    console.log('   State:', JSON.stringify(state, null, 2));
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-initial-state.png` });

    // If still redirected, something else is wrong
    if (state.url.includes('index.html')) {
      console.log('\n   ⚠️ Still redirected to login. Taking additional screenshots...');

      // Check what error message might exist
      const errorInfo = await page.evaluate(() => ({
        pageTitle: document.title,
        hasError: !!document.querySelector('.error'),
        errorText: document.querySelector('.error')?.textContent,
        innerText: document.body.innerText.substring(0, 500)
      }));
      console.log('   Page info:', JSON.stringify(errorInfo, null, 2));

      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-redirect.png` });
      console.log('\n❌ Could not reach dashboard. Token validation may be failing on backend.');

      // Let's verify the token works
      console.log('\n   Verifying token with backend...');
      const profileResult = await apiCall('/api/users/profile', 'GET', null, TOKEN);
      console.log('   Profile result:', profileResult.success ? '✅ Valid' : '❌ Invalid', profileResult.message || profileResult.user?.name);

      await browser.close();
      return;
    }

    // ==========================================
    // 3. WE'RE ON DASHBOARD - TEST ALL MODES
    // ==========================================
    console.log('\n3️⃣  ON DASHBOARD - TESTING MODES');

    // MANUAL MODE
    console.log('   🎮 MANUAL mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('manual');
      else if (window.switchMode) window.switchMode('manual');
      else document.body.setAttribute('data-mode', 'manual');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-manual-mode.png` });
    console.log('   Screenshot: 03-manual-mode.png');

    // Check butler bubble
    const butlerState = await page.evaluate(() => {
      const b = document.getElementById('butler-bubble');
      if (!b) return { exists: false };
      const s = getComputedStyle(b);
      const rect = b.getBoundingClientRect();
      return {
        exists: true,
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity,
        position: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
      };
    });
    console.log('   Butler:', JSON.stringify(butlerState));

    if (butlerState.exists && butlerState.display !== 'none') {
      console.log('   ✅ Clicking butler bubble...');
      await page.click('#butler-bubble');
      await sleep(1500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-butler-panel.png` });
      console.log('   Screenshot: 04-butler-panel.png');

      // Type test command
      const input = await page.$('#butler-universal-input');
      if (input) {
        await input.type('order pizza from Dominos');
        await sleep(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-butler-command.png` });
        console.log('   Screenshot: 05-butler-command.png');
      }

      // Close
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
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-voice-mode.png` });
    console.log('   Screenshot: 06-voice-mode.png');

    // DESK MODE
    console.log('   🖥️  DESK mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('desk');
      else document.body.setAttribute('data-mode', 'desk');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-desk-mode.png` });
    console.log('   Screenshot: 07-desk-mode.png');

    // GENESIS MODE
    console.log('   🧬 GENESIS mode...');
    await page.evaluate(() => {
      if (window.setMode) window.setMode('genesis');
      else document.body.setAttribute('data-mode', 'genesis');
    });
    await sleep(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-genesis-mode.png` });
    console.log('   Screenshot: 08-genesis-mode.png');

    // ==========================================
    // DONE
    // ==========================================
    console.log('\n✅ ALL TESTS COMPLETE');
    console.log(`   Directory: ${SCREENSHOT_DIR}`);
    fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => console.log(`   - ${f}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }
}

test();
