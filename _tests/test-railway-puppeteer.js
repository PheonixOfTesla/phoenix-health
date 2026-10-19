/**
 * TEST: Puppeteer Browser Launch on Railway Production
 *
 * This script tests if Chromium can actually launch on Railway's infrastructure.
 * It will call the /api/butler/universal endpoint with a simple screenshot task.
 */

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGUwMGJjYjk3ZTUzMzE0MDJiMzFlYiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY3MTk2NzYsImV4cCI6MTc5ODI1NTY3Nn0.o_tUCsh0tOQBk6Dsp34cula07TZXwKaFHQC_3HzQbXU';
const BACKEND = 'https://pal-backend-production.up.railway.app';

console.log('='.repeat(70));
console.log('TESTING: Puppeteer Browser Launch on Railway Production');
console.log('='.repeat(70));
console.log(`Backend: ${BACKEND}`);
console.log(`Token: ${TOKEN.substring(0, 30)}...`);
console.log('='.repeat(70));

async function testUniversalEndpoint() {
  console.log('\n[TEST 1] POST /api/butler/universal - Screenshot Task');
  console.log('-'.repeat(70));

  const task = 'Navigate to https://example.com and take a screenshot';
  console.log(`Task: "${task}"`);
  console.log('Sending request with confirmed=true...\n');

  const start = Date.now();

  try {
    const response = await fetch(`${BACKEND}/api/butler/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        task: task,
        confirmed: true,
        headless: true
      })
    });

    const elapsed = Date.now() - start;
    const data = await response.json();

    console.log(`Response Status: ${response.status}`);
    console.log(`Response Time: ${elapsed}ms`);
    console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));
    console.log('\nResponse Body:');
    console.log(JSON.stringify(data, null, 2));

    // Analyze the response
    console.log('\n' + '='.repeat(70));
    console.log('ANALYSIS:');
    console.log('='.repeat(70));

    if (response.status === 200) {
      console.log('✅ HTTP 200 - Request accepted');

      if (data.success === true) {
        console.log('✅ Task marked as successful');
        if (data.finalScreenshot) {
          console.log(`✅ Screenshot data received (${data.finalScreenshot.length} chars)`);
          console.log(`   Screenshot preview: ${data.finalScreenshot.substring(0, 100)}...`);
        } else {
          console.log('⚠️  No screenshot data in response');
        }
        if (data.steps) {
          console.log(`✅ Steps completed: ${data.steps}`);
        }
        if (data.sessionId) {
          console.log(`✅ Session ID: ${data.sessionId}`);
        }
        console.log('\n🎉 PUPPETEER IS WORKING ON RAILWAY! Browser launched successfully.');
      } else {
        console.log('❌ Task failed - success: false');
        if (data.error) {
          console.log(`   Error: ${data.error}`);

          // Check for specific browser launch errors
          if (data.error.includes('Failed to launch') ||
              data.error.includes('Could not find Chrome') ||
              data.error.includes('chromium') ||
              data.error.includes('browser')) {
            console.log('\n❌ BROWSER LAUNCH FAILED ON RAILWAY');
            console.log('   Puppeteer cannot find or launch Chromium.');
            console.log('   Possible causes:');
            console.log('   - Chromium not installed in Railway environment');
            console.log('   - Missing dependencies (libgbm, libnss3, etc.)');
            console.log('   - Railway Nixpacks not configured for Puppeteer');
          }
        }
        if (data.message) {
          console.log(`   Message: ${data.message}`);
        }
      }
    } else {
      console.log(`❌ HTTP ${response.status} - Request failed`);
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
    }

    return data;

  } catch (error) {
    const elapsed = Date.now() - start;
    console.log(`❌ REQUEST FAILED after ${elapsed}ms`);
    console.log(`Error Type: ${error.constructor.name}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`Error Stack: ${error.stack}`);

    console.log('\n' + '='.repeat(70));
    console.log('NETWORK ERROR - Could not reach Railway backend');
    console.log('='.repeat(70));

    return null;
  }
}

async function testExecuteEndpoint() {
  console.log('\n\n[TEST 2] POST /api/butler/execute - Alternative Endpoint');
  console.log('-'.repeat(70));
  console.log('Testing simpler execute endpoint as fallback...\n');

  const start = Date.now();

  try {
    const response = await fetch(`${BACKEND}/api/butler/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        goal: 'Take a screenshot of google.com',
        confirmed: true
      })
    });

    const elapsed = Date.now() - start;
    const data = await response.json();

    console.log(`Response Status: ${response.status}`);
    console.log(`Response Time: ${elapsed}ms`);
    console.log('\nResponse Body:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('EXECUTE ENDPOINT ANALYSIS:');
    console.log('='.repeat(70));

    if (response.status === 200 && data.success) {
      console.log('✅ Execute endpoint working');
    } else {
      console.log('❌ Execute endpoint failed');
      if (data.error) {
        console.log(`   Error: ${data.error}`);
      }
    }

    return data;

  } catch (error) {
    console.log(`❌ Execute endpoint error: ${error.message}`);
    return null;
  }
}

async function testHealthCheck() {
  console.log('\n\n[TEST 3] GET /health - Railway Service Health');
  console.log('-'.repeat(70));

  try {
    const response = await fetch(`${BACKEND}/health`);
    const data = await response.json();

    console.log(`Response Status: ${response.status}`);
    console.log('Response Body:');
    console.log(JSON.stringify(data, null, 2));

    if (response.status === 200) {
      console.log('✅ Backend is healthy and reachable');
    }

    return data;
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('\nStarting tests...\n');

  // Test 3: Health check first
  await testHealthCheck();

  // Test 1: Main test - Universal endpoint
  const result1 = await testUniversalEndpoint();

  // Test 2: Fallback test - Execute endpoint
  const result2 = await testExecuteEndpoint();

  // Final Summary
  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(70));

  if (result1 && result1.success) {
    console.log('✅ PUPPETEER WORKS ON RAILWAY');
    console.log('   Browser successfully launched and executed the task.');
    console.log('   Chromium is properly installed and configured.');
  } else if (result1 && result1.error) {
    console.log('❌ PUPPETEER FAILS ON RAILWAY');
    console.log(`   Error: ${result1.error}`);
    console.log('\n   RECOMMENDED ACTIONS:');
    console.log('   1. Check Railway logs for detailed Chromium errors');
    console.log('   2. Verify Nixpacks configuration includes Puppeteer dependencies');
    console.log('   3. Check if Railway buildpack has chromium installed');
    console.log('   4. Review railway.json or nixpacks.toml configuration');
  } else {
    console.log('⚠️  INCONCLUSIVE');
    console.log('   Could not reach the backend or get a clear response.');
  }

  console.log('='.repeat(70));
}

// Execute
runTests().catch(err => {
  console.error('\n💥 FATAL ERROR:', err);
  process.exit(1);
});
