/**
 * Test Butler Universal Agent in all 4 Phoenix modes
 * Takes screenshots to verify UI state
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const FRONTEND_URL = 'https://phoenix-fe-indol.vercel.app';
const SCREENSHOT_DIR = '/tmp/phoenix-screenshots';

// Create screenshot directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testAllModes() {
  console.log('🚀 Starting Phoenix Butler Mode Tests\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // 1. Go to dashboard (may redirect to login)
    console.log('📍 Navigating to Phoenix dashboard...');
    await page.goto(`${FRONTEND_URL}/www/dashboard.html`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-initial-load.png` });
    console.log('   Screenshot: 01-initial-load.png');

    // Check current URL
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);

    if (currentUrl.includes('index.html') || currentUrl.includes('login')) {
      console.log('   ⚠️  Redirected to login page - need to authenticate first');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-required.png` });
      console.log('   Screenshot: 02-login-required.png');

      // Check what's on the page
      const pageContent = await page.evaluate(() => {
        return {
          title: document.title,
          hasLoginForm: !!document.querySelector('form'),
          buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).slice(0, 5)
        };
      });
      console.log('   Page info:', JSON.stringify(pageContent));
    } else {
      // We're on the dashboard - check for butler elements
      console.log('\n📋 Checking Butler UI elements...');

      const butlerElements = await page.evaluate(() => {
        return {
          butlerBubble: !!document.getElementById('butler-bubble'),
          butlerBubbleVisible: document.getElementById('butler-bubble')?.style.display !== 'none',
          butlerWidget: !!document.querySelector('.butler-widget'),
          butlerUniversalPanel: !!document.querySelector('.butler-universal-panel'),
          currentMode: document.body.getAttribute('data-mode') || document.body.getAttribute('data-phoenix-mode'),
          openButlerUniversal: typeof window.openButlerUniversal === 'function'
        };
      });

      console.log('   Butler Bubble exists:', butlerElements.butlerBubble);
      console.log('   Butler Bubble visible:', butlerElements.butlerBubbleVisible);
      console.log('   Butler Widget exists:', butlerElements.butlerWidget);
      console.log('   Universal Panel exists:', butlerElements.butlerUniversalPanel);
      console.log('   Current mode:', butlerElements.currentMode);
      console.log('   openButlerUniversal function:', butlerElements.openButlerUniversal);

      // Test MANUAL mode
      console.log('\n🎮 Testing MANUAL mode...');
      await page.evaluate(() => {
        if (window.switchToManual) window.switchToManual();
        else if (window.setMode) window.setMode('manual');
        else document.body.setAttribute('data-mode', 'manual');
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-manual-mode.png` });
      console.log('   Screenshot: 03-manual-mode.png');

      // Check if butler bubble is visible in manual mode
      const manualButler = await page.evaluate(() => {
        const bubble = document.getElementById('butler-bubble');
        const style = bubble ? window.getComputedStyle(bubble) : null;
        return {
          exists: !!bubble,
          display: style?.display,
          visibility: style?.visibility,
          opacity: style?.opacity
        };
      });
      console.log('   Butler in MANUAL:', JSON.stringify(manualButler));

      // Try clicking butler bubble
      console.log('\n🖱️  Clicking Butler bubble...');
      try {
        await page.click('#butler-bubble');
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/04-butler-clicked.png` });
        console.log('   Screenshot: 04-butler-clicked.png');

        // Check if universal panel opened
        const panelState = await page.evaluate(() => {
          const panel = document.querySelector('.butler-universal-panel');
          return {
            exists: !!panel,
            visible: panel?.style.display !== 'none',
            classList: panel?.className
          };
        });
        console.log('   Universal Panel after click:', JSON.stringify(panelState));
      } catch (e) {
        console.log('   Could not click butler bubble:', e.message);
      }

      // Test DESK mode
      console.log('\n🖥️  Testing DESK mode...');
      await page.evaluate(() => {
        if (window.switchToDesk) window.switchToDesk();
        else if (window.setMode) window.setMode('desk');
        else document.body.setAttribute('data-mode', 'desk');
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-desk-mode.png` });
      console.log('   Screenshot: 05-desk-mode.png');

      // Test VOICE mode
      console.log('\n🎤 Testing VOICE mode...');
      await page.evaluate(() => {
        if (window.switchToVoice) window.switchToVoice();
        else if (window.setMode) window.setMode('voice');
        else document.body.setAttribute('data-mode', 'voice');
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-voice-mode.png` });
      console.log('   Screenshot: 06-voice-mode.png');

      // Test GENESIS mode
      console.log('\n🧬 Testing GENESIS mode...');
      await page.evaluate(() => {
        if (window.switchToGenesis) window.switchToGenesis();
        else if (window.setMode) window.setMode('genesis');
        else document.body.setAttribute('data-mode', 'genesis');
      });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-genesis-mode.png` });
      console.log('   Screenshot: 07-genesis-mode.png');
    }

    console.log('\n✅ Test complete! Screenshots saved to:', SCREENSHOT_DIR);

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/error-state.png` });
  } finally {
    await browser.close();
  }
}

testAllModes().catch(console.error);
