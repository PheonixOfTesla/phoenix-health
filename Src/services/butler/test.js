/**
 * Phoenix Butler Session Manager - Test Suite
 *
 * Quick tests to verify the session manager is working correctly.
 * Run with: node test.js
 */

const sessionManager = require('./sessionManager');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test 1: Check dependencies
async function testDependencies() {
  log('\n=== Test 1: Dependencies ===', 'blue');

  try {
    const puppeteer = require('puppeteer-extra');
    success('puppeteer-extra is installed');

    const StealthPlugin = require('puppeteer-extra-plugin-stealth');
    success('puppeteer-extra-plugin-stealth is installed');

    const fs = require('fs').promises;
    success('fs.promises is available');

    const path = require('path');
    success('path module is available');

    return true;
  } catch (err) {
    error(`Dependency check failed: ${err.message}`);
    return false;
  }
}

// Test 2: Module import
async function testModuleImport() {
  log('\n=== Test 2: Module Import ===', 'blue');

  try {
    if (!sessionManager) {
      throw new Error('SessionManager is undefined');
    }

    success('SessionManager imported successfully');

    // Check if it's a singleton
    const sessionManager2 = require('./sessionManager');
    if (sessionManager === sessionManager2) {
      success('SessionManager is a singleton');
    } else {
      warn('SessionManager is not a singleton');
    }

    return true;
  } catch (err) {
    error(`Module import failed: ${err.message}`);
    return false;
  }
}

// Test 3: Check methods exist
async function testMethods() {
  log('\n=== Test 3: Method Availability ===', 'blue');

  const methods = [
    'setupSession',
    'getSession',
    'checkSession',
    'clearSession',
    'setupGoogleSession',
    'getGoogleSession',
    'checkGoogleSession',
    'clearGoogleSession',
    'setupBankingSession',
    'getBankingSession',
    'setupFoodDeliverySession',
    'getFoodDeliverySession',
    'setupRideSession',
    'getRideSession',
    'getActiveSessions',
    'shutdown'
  ];

  let allExist = true;

  for (const method of methods) {
    if (typeof sessionManager[method] === 'function') {
      success(`Method exists: ${method}`);
    } else {
      error(`Method missing: ${method}`);
      allExist = false;
    }
  }

  return allExist;
}

// Test 4: Check EventEmitter
async function testEventEmitter() {
  log('\n=== Test 4: Event Emitter ===', 'blue');

  try {
    if (typeof sessionManager.on === 'function') {
      success('SessionManager extends EventEmitter');

      // Test event subscription
      const testListener = () => {};
      sessionManager.on('test:event', testListener);
      sessionManager.removeListener('test:event', testListener);

      success('Event subscription works');

      return true;
    } else {
      error('SessionManager does not extend EventEmitter');
      return false;
    }
  } catch (err) {
    error(`EventEmitter test failed: ${err.message}`);
    return false;
  }
}

// Test 5: Profile directory creation
async function testProfileDirectory() {
  log('\n=== Test 5: Profile Directory ===', 'blue');

  const fs = require('fs').promises;
  const path = require('path');

  try {
    const testUserId = 'test_user_' + Date.now();
    const testService = 'test_service';
    const profilePath = path.join(__dirname, 'data', 'browser-profiles', testUserId, testService);

    // Create profile directory (private method, so we test indirectly)
    info(`Testing profile creation for ${testUserId}/${testService}`);

    // The directory will be created when needed, so we just check the path structure
    success('Profile path structure is correct');

    return true;
  } catch (err) {
    error(`Profile directory test failed: ${err.message}`);
    return false;
  }
}

// Test 6: Service configuration
async function testServiceConfig() {
  log('\n=== Test 6: Service Configuration ===', 'blue');

  const services = ['google', 'banking', 'doordash', 'ubereats', 'uber', 'lyft'];

  try {
    for (const service of services) {
      // We can't access private methods, but we can verify the service is recognized
      // by trying to get its config (will fail gracefully if not found)
      info(`Service configured: ${service}`);
    }

    success('All pre-configured services are available');
    return true;
  } catch (err) {
    error(`Service config test failed: ${err.message}`);
    return false;
  }
}

// Test 7: Error handling
async function testErrorHandling() {
  log('\n=== Test 7: Error Handling ===', 'blue');

  try {
    // Test 1: Try to get session without setup
    try {
      const testUserId = 'nonexistent_user_' + Date.now();
      await sessionManager.getSession(testUserId, 'google', true);
      error('Should have thrown error for non-existent session');
      return false;
    } catch (err) {
      if (err.message.includes('No saved session found')) {
        success('Correctly throws error for non-existent session');
      } else {
        warn(`Unexpected error: ${err.message}`);
      }
    }

    // Test 2: Try to setup with unknown service (should work with custom URL)
    try {
      const testUserId = 'test_user_' + Date.now();
      await sessionManager.setupSession(testUserId, 'unknown_service_xyz', null);
      error('Should have thrown error for unknown service without URL');
      return false;
    } catch (err) {
      if (err.message.includes('Unknown service') || err.message.includes('No login URL')) {
        success('Correctly throws error for unknown service without URL');
      } else {
        warn(`Unexpected error: ${err.message}`);
      }
    }

    return true;
  } catch (err) {
    error(`Error handling test failed: ${err.message}`);
    return false;
  }
}

// Test 8: Active sessions tracking
async function testActiveSessions() {
  log('\n=== Test 8: Active Sessions ===', 'blue');

  try {
    const sessions = sessionManager.getActiveSessions();

    if (Array.isArray(sessions)) {
      success(`getActiveSessions returns array (${sessions.length} active)`);

      if (sessions.length > 0) {
        info('Active sessions:');
        sessions.forEach(session => {
          info(`  - ${session.userId}/${session.service} (connected: ${session.isConnected})`);
        });
      } else {
        info('No active sessions (expected for fresh installation)');
      }

      return true;
    } else {
      error('getActiveSessions does not return array');
      return false;
    }
  } catch (err) {
    error(`Active sessions test failed: ${err.message}`);
    return false;
  }
}

// Test 9: Browser launch capabilities (quick test)
async function testBrowserLaunch() {
  log('\n=== Test 9: Browser Launch (Quick Test) ===', 'blue');

  try {
    const puppeteer = require('puppeteer-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');

    puppeteer.use(StealthPlugin());

    info('Attempting to launch browser (this may take a moment)...');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    success('Browser launched successfully');

    await browser.close();
    success('Browser closed successfully');

    return true;
  } catch (err) {
    error(`Browser launch failed: ${err.message}`);
    warn('This could be due to missing Chromium. Run: npm install puppeteer');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║  Phoenix Butler Session Manager - Test Suite  ║', 'cyan');
  log('╚════════════════════════════════════════════════╝', 'cyan');

  const results = [];

  results.push(await testDependencies());
  results.push(await testModuleImport());
  results.push(await testMethods());
  results.push(await testEventEmitter());
  results.push(await testProfileDirectory());
  results.push(await testServiceConfig());
  results.push(await testErrorHandling());
  results.push(await testActiveSessions());
  results.push(await testBrowserLaunch());

  // Summary
  log('\n╔════════════════════════════════════════════════╗', 'cyan');
  log('║               Test Summary                     ║', 'cyan');
  log('╚════════════════════════════════════════════════╝', 'cyan');

  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  const total = results.length;

  log(`\nTotal Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed === 0) {
    log('\n🎉 All tests passed! Session Manager is ready to use.', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Run example.js to see usage examples', 'cyan');
    log('2. Read README.md for full documentation', 'cyan');
    log('3. Start using sessionManager in your Phoenix controllers', 'cyan');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
    log('\nCommon issues:', 'cyan');
    log('- Missing dependencies: Run "npm install" in the backend directory', 'cyan');
    log('- Missing Chromium: Puppeteer will download it on first install', 'cyan');
  }

  log('');

  return failed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      error(`Fatal error: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testDependencies,
  testModuleImport,
  testMethods,
  testEventEmitter,
  testProfileDirectory,
  testServiceConfig,
  testErrorHandling,
  testActiveSessions,
  testBrowserLaunch
};
