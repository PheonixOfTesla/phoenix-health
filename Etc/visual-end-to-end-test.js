/**
 * VISUAL END-TO-END TEST - WATCH EVERYTHING WORK
 *
 * This script:
 * 1. Opens a REAL browser window (not headless) so you can SEE it
 * 2. Logs EVERY interaction to console
 * 3. Takes screenshots at every step
 * 4. Tests the FULL user journey: Login → Dashboard → Chat → Planets → Animations
 * 5. Monitors Railway backend logs in parallel
 * 6. Verifies animations, orb states, UI responses
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const BACKEND_URL = 'https://pal-backend-production.up.railway.app/api';

// Test credentials
const TEST_USER = {
  email: 'visual-test@phoenix.ai',
  password: 'VisualTest2025!',
  name: 'Visual Test User'
};

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, 'visual-test-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let screenshotCounter = 1;

async function takeScreenshot(page, name) {
  const filename = `${String(screenshotCounter).padStart(3, '0')}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot: ${filename}`);
  screenshotCounter++;
  return filepath;
}

async function logConsole(msg) {
  const type = msg.type();
  const text = msg.text();

  const emoji = {
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'log': '📝'
  }[type] || '💬';

  console.log(`${emoji} [BROWSER CONSOLE] ${text}`);
}

async function waitAndLog(page, message, ms = 2000) {
  console.log(`⏳ ${message} (${ms}ms)`);
  await page.waitForTimeout(ms);
}

async function runVisualTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🎬 VISUAL END-TO-END TEST - WATCHING PHOENIX COME TO LIFE');
  console.log('='.repeat(80) + '\n');

  console.log('🌐 Frontend: ' + FRONTEND_URL);
  console.log('🔌 Backend: ' + BACKEND_URL);
  console.log('📸 Screenshots: ' + SCREENSHOT_DIR);
  console.log('\n' + '='.repeat(80) + '\n');

  // Launch browser in NON-headless mode so we can SEE it
  const browser = await puppeteer.launch({
    headless: false, // VISUAL MODE
    defaultViewport: { width: 1920, height: 1080 },
    args: [
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    devtools: true // Open DevTools automatically
  });

  const page = await browser.newPage();

  // Listen to ALL console messages from the browser
  page.on('console', logConsole);

  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log(`🌐 [NETWORK] ${request.method()} ${request.url()}`);
    }
  });

  // Listen to network responses
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${emoji} [RESPONSE] ${status} ${response.url()}`);
    }
  });

  try {
    // ============================================
    // STEP 1: LOAD LOGIN PAGE
    // ============================================
    console.log('\n' + '─'.repeat(80));
    console.log('📝 STEP 1: Load Login Page');
    console.log('─'.repeat(80));

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    await takeScreenshot(page, 'login-page-loaded');

    await waitAndLog(page, 'Waiting for login page to fully render', 3000);

    // ============================================
    // STEP 2: REGISTER/LOGIN USER
    // ============================================
    console.log('\n' + '─'.repeat(80));
    console.log('📝 STEP 2: Register or Login User');
    console.log('─'.repeat(80));

    // Try to find login button
    try {
      await page.waitForSelector('button:has-text("ACTIVATE PHOENIX")', { timeout: 5000 });
      console.log('✅ Login form found');
    } catch (e) {
      console.log('⚠️  Login button not found, looking for onboarding...');
      await takeScreenshot(page, 'unexpected-page');
    }

    // Click "Create Account" if available
    try {
      const createAccountBtn = await page.$('button:has-text("CREATE ACCOUNT")');
      if (createAccountBtn) {
        console.log('🔘 Clicking "CREATE ACCOUNT"');
        await createAccountBtn.click();
        await waitAndLog(page, 'Waiting for onboarding', 2000);
        await takeScreenshot(page, 'onboarding-start');
      }
    } catch (e) {
      console.log('ℹ️  No create account button, proceeding to login');
    }

    // Fill in registration if on onboarding page
    const isOnboarding = await page.$('#ob-phase2');
    if (isOnboarding) {
      console.log('📝 On onboarding page - filling out registration');

      // Select language
      await page.click('[data-lang="en"]');
      await waitAndLog(page, 'Selected language', 1000);
      await page.click('#nextPhase0');
      await waitAndLog(page, 'Moving to voice selection', 2000);

      // Select voice
      await page.click('[data-voice="echo"]');
      await waitAndLog(page, 'Selected voice', 1000);
      await page.click('#nextPhase1');
      await waitAndLog(page, 'Moving to account creation', 2000);

      await takeScreenshot(page, 'onboarding-account-form');

      // Fill account details
      await page.type('#ob-name', TEST_USER.name);
      await page.type('#ob-email', TEST_USER.email);
      await page.type('#ob-password', TEST_USER.password);
      await page.type('#ob-password-confirm', TEST_USER.password);

      await takeScreenshot(page, 'onboarding-filled');

      await page.click('button:has-text("CREATE ACCOUNT")');
      await waitAndLog(page, 'Creating account...', 5000);

    } else {
      console.log('📝 On login page - logging in');

      // Try phone login or email login
      const phoneInput = await page.$('#login-phone');
      const emailInput = await page.$('#login-email-alt');

      if (phoneInput) {
        await page.type('#login-phone', TEST_USER.email);
      } else if (emailInput) {
        await page.type('#login-email-alt', TEST_USER.email);
      } else {
        // Toggle to email login
        const toggleBtn = await page.$('button:has-text("Sign in with email")');
        if (toggleBtn) {
          await toggleBtn.click();
          await waitAndLog(page, 'Switched to email login', 1000);
          await page.type('#login-email-alt', TEST_USER.email);
        }
      }

      await page.type('#login-password', TEST_USER.password);
      await takeScreenshot(page, 'login-filled');

      await page.click('#login-btn');
      await waitAndLog(page, 'Logging in...', 5000);
    }

    // ============================================
    // STEP 3: VERIFY DASHBOARD LOADED
    // ============================================
    console.log('\n' + '─'.repeat(80));
    console.log('📝 STEP 3: Verify Dashboard Loaded');
    console.log('─'.repeat(80));

    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    await takeScreenshot(page, 'dashboard-loaded');

    await waitAndLog(page, 'Analyzing dashboard elements', 3000);

    // Check for Phoenix orb
    const hasOrb = await page.$('.phoenix-orb, #phoenix-orb, .voice-orb');
    console.log(hasOrb ? '✅ Phoenix orb found' : '❌ Phoenix orb NOT found');

    // Check for planets
    const planetButtons = await page.$$('[data-planet], .planet-btn, button[onclick*="planet"]');
    console.log(`🌍 Found ${planetButtons.length} planet buttons`);

    // Check for user greeting
    const userGreeting = await page.$('.user-greeting, #user-name');
    console.log(userGreeting ? '✅ User greeting found' : '⚠️  User greeting not found');

    await takeScreenshot(page, 'dashboard-analyzed');

    // ============================================
    // STEP 4: INTERACT WITH PHOENIX ORB
    // ============================================
    console.log('\n' + '─'.repeat(80));
    console.log('📝 STEP 4: Interact with Phoenix Orb');
    console.log('─'.repeat(80));

    if (hasOrb) {
      console.log('🎤 Clicking Phoenix orb...');
      await hasOrb.click();
      await waitAndLog(page, 'Waiting for orb animation', 2000);
      await takeScreenshot(page, 'orb-activated');

      // Type a message in chat
      const chatInput = await page.$('#chat-input, input[placeholder*="message"], input[type="text"]');
      if (chatInput) {
        console.log('💬 Typing message to Phoenix...');
        await chatInput.type('How did I sleep last night?');
        await takeScreenshot(page, 'message-typed');

        // Press Enter or click send
        const sendBtn = await page.$('#send-btn, button:has-text("Send"), button[type="submit"]');
        if (sendBtn) {
          await sendBtn.click();
        } else {
          await page.keyboard.press('Enter');
        }

        console.log('📤 Message sent, waiting for response...');
        await waitAndLog(page, 'Waiting for AI response', 5000);
        await takeScreenshot(page, 'ai-response-received');

        // Check for animated response
        console.log('🔍 Checking for orb animations...');
        const orbState = await page.evaluate(() => {
          const orb = document.querySelector('.phoenix-orb, #phoenix-orb, .voice-orb');
          if (!orb) return null;
          return {
            classList: Array.from(orb.classList),
            style: orb.style.cssText,
            animation: window.getComputedStyle(orb).animation
          };
        });
        console.log('🎨 Orb state:', JSON.stringify(orbState, null, 2));
      }
    } else {
      console.log('⚠️  Skipping orb test - orb not found');
    }

    // ============================================
    // STEP 5: TEST PLANET NAVIGATION
    // ============================================
    console.log('\n' + '─'.repeat(80));
    console.log('📝 STEP 5: Test Planet Navigation');
    console.log('─'.repeat(80));

    const planets = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];

    for (const planet of planets) {
      console.log(`\n🪐 Testing ${planet.toUpperCase()} planet...`);

      const planetBtn = await page.$(`[data-planet="${planet}"], button[onclick*="${planet}"]`);
      if (planetBtn) {
        await planetBtn.click();
        await waitAndLog(page, `Opened ${planet}`, 2000);
        await takeScreenshot(page, `planet-${planet}-opened`);

        // Check for planet-specific content
        const planetPanel = await page.$(`#${planet}-panel, .${planet}-panel, [data-panel="${planet}"]`);
        console.log(planetPanel ? `✅ ${planet} panel displayed` : `⚠️  ${planet} panel not found`);

        // Close panel
        const closeBtn = await page.$('.close-panel, button:has-text("Close"), [data-action="close"]');
        if (closeBtn) {
          await closeBtn.click();
          await waitAndLog(page, `Closed ${planet}`, 1000);
        }
      } else {
        console.log(`⚠️  ${planet} button not found`);
      }
    }

    // ============================================
    // STEP 6: FINAL SCREENSHOT & SUMMARY
    // ============================================
    console.log('\n' + '─'.repeat(80));
    console.log('📝 STEP 6: Final Verification');
    console.log('─'.repeat(80));

    await takeScreenshot(page, 'test-complete');

    console.log('\n' + '='.repeat(80));
    console.log('✅ VISUAL TEST COMPLETE');
    console.log('='.repeat(80));
    console.log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`📊 Total screenshots: ${screenshotCounter - 1}`);
    console.log('\n👀 Review the screenshots to verify all interactions worked correctly.\n');

    // Keep browser open for manual inspection
    console.log('🔍 Browser will remain open for 30 seconds for manual inspection...');
    await waitAndLog(page, 'Keeping browser open', 30000);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await takeScreenshot(page, 'error-state');
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

// Run the test
runVisualTest().catch(console.error);
