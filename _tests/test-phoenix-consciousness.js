/**
 * PHOENIX CONSCIOUSNESS TEST
 * Testing the entire architecture as one stream of consciousness
 * Butler isn't a separate system - it's consciousness operating under PURPOSE
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const PHOENIX_URL = 'https://phoenix-fe-indol.vercel.app';
const API_URL = 'https://pal-backend-production.up.railway.app';

async function testPhoenixConsciousness() {
  console.log('🔥 PHOENIX CONSCIOUSNESS TEST\n');
  console.log('Testing the unified stream across all modes...\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Capture console logs from the page
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Phoenix') || msg.text().includes('API')) {
      console.log(`  [Browser] ${msg.text()}`);
    }
  });

  // Capture network requests
  const apiCalls = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('pal-backend') || url.includes('railway')) {
      apiCalls.push({
        url: url.replace(API_URL, ''),
        status: response.status(),
        ok: response.ok()
      });
    }
  });

  try {
    // ========================================
    // 1. LOAD PHOENIX
    // ========================================
    console.log('1️⃣ Loading Phoenix frontend...');
    await page.goto(PHOENIX_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: '/tmp/phoenix-1-initial.png' });
    console.log('   ✓ Screenshot: /tmp/phoenix-1-initial.png\n');

    // ========================================
    // 2. CHECK WHAT MODE WE'RE IN
    // ========================================
    console.log('2️⃣ Checking current mode...');

    // Look for mode indicators
    const modeInfo = await page.evaluate(() => {
      const tabs = document.querySelectorAll('[class*="mode"], [class*="tab"], button');
      const activeTab = Array.from(tabs).find(t =>
        t.classList.contains('active') ||
        t.getAttribute('aria-selected') === 'true' ||
        window.getComputedStyle(t).borderColor.includes('0, 217, 255')
      );

      // Check for visible elements
      const hasOrb = !!document.querySelector('[class*="orb"], [class*="Orb"], canvas');
      const hasChat = !!document.querySelector('[class*="chat"], [class*="conversation"]');
      const hasDesk = !!document.querySelector('[class*="schedule"], [class*="calendar"]');
      const hasGenesis = !!document.querySelector('[class*="genesis"], [class*="Genesis"]');

      return {
        activeTab: activeTab?.textContent?.trim(),
        hasOrb,
        hasChat,
        hasDesk,
        hasGenesis,
        url: window.location.href
      };
    });

    console.log('   Current state:', JSON.stringify(modeInfo, null, 2));

    // ========================================
    // 3. NAVIGATE THROUGH ALL MODES
    // ========================================
    console.log('\n3️⃣ Testing all modes...');

    const modes = ['VOICE', 'MANUAL', 'DESK', 'GENESIS'];

    for (const mode of modes) {
      console.log(`\n   Testing ${mode} mode...`);

      // Try to click the mode tab
      const clicked = await page.evaluate((modeName) => {
        const buttons = document.querySelectorAll('button, [role="tab"], a');
        for (const btn of buttons) {
          if (btn.textContent?.toUpperCase().includes(modeName)) {
            btn.click();
            return true;
          }
        }
        return false;
      }, mode);

      if (clicked) {
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `/tmp/phoenix-mode-${mode.toLowerCase()}.png` });
        console.log(`   ✓ Screenshot: /tmp/phoenix-mode-${mode.toLowerCase()}.png`);
      } else {
        console.log(`   ⚠ Could not find ${mode} tab`);
      }
    }

    // ========================================
    // 4. TEST CHAT INPUT (THE CONSCIOUSNESS INTERFACE)
    // ========================================
    console.log('\n4️⃣ Testing consciousness interface (chat)...');

    // Go back to MANUAL mode for typing
    await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="tab"], a');
      for (const btn of buttons) {
        if (btn.textContent?.toUpperCase().includes('MANUAL')) {
          btn.click();
          return;
        }
      }
    });
    await page.waitForTimeout(1000);

    // Look for "TYPE TO PHOENIX" button
    const typeButton = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, div[role="button"]');
      for (const btn of buttons) {
        if (btn.textContent?.includes('TYPE TO PHOENIX')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (typeButton) {
      console.log('   ✓ Clicked "TYPE TO PHOENIX"');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/phoenix-5-chat-open.png' });
      console.log('   ✓ Screenshot: /tmp/phoenix-5-chat-open.png');
    }

    // ========================================
    // 5. CHECK API CONNECTIVITY
    // ========================================
    console.log('\n5️⃣ Checking API connectivity...');

    // Direct API test
    const healthCheck = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/health`);
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, API_URL);

    console.log('   Health check:', JSON.stringify(healthCheck, null, 2));

    // ========================================
    // 6. TEST THE CONVERSATION FLOW
    // ========================================
    console.log('\n6️⃣ Testing conversation flow...');

    // Find chat input
    const inputSelector = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea');
      for (const input of inputs) {
        const placeholder = input.placeholder?.toLowerCase() || '';
        if (placeholder.includes('type') || placeholder.includes('message') || placeholder.includes('phoenix')) {
          return true;
        }
      }
      return false;
    });

    if (inputSelector) {
      // Type a message
      await page.type('input, textarea', 'hello phoenix');
      await page.screenshot({ path: '/tmp/phoenix-6-typed.png' });
      console.log('   ✓ Typed message, screenshot: /tmp/phoenix-6-typed.png');

      // Try to send
      const sent = await page.evaluate(() => {
        // Look for send button
        const sendBtns = document.querySelectorAll('button');
        for (const btn of sendBtns) {
          if (btn.textContent?.toUpperCase().includes('SEND') ||
              btn.querySelector('svg') ||
              btn.getAttribute('aria-label')?.includes('send')) {
            btn.click();
            return true;
          }
        }
        // Try pressing Enter
        return false;
      });

      if (sent) {
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/phoenix-7-response.png' });
        console.log('   ✓ Sent message, screenshot: /tmp/phoenix-7-response.png');
      }
    }

    // ========================================
    // 7. SUMMARY
    // ========================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    console.log(`\nAPI Calls Made: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      const status = call.ok ? '✓' : '✗';
      console.log(`  ${status} ${call.status} ${call.url}`);
    });

    console.log('\nScreenshots saved to /tmp/phoenix-*.png');
    console.log('\nUse Read tool to visually inspect each screenshot.');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: '/tmp/phoenix-error.png' });
  } finally {
    await browser.close();
  }
}

testPhoenixConsciousness();
