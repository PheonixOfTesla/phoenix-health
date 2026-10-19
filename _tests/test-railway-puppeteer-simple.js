/**
 * SIMPLE RAILWAY PUPPETEER TEST
 *
 * Run this with: node test-railway-puppeteer-simple.js
 */

const https = require('https');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGUwMGJjYjk3ZTUzMzE0MDJiMzFlYiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY3MTk2NzYsImV4cCI6MTc5ODI1NTY3Nn0.o_tUCsh0tOQBk6Dsp34cula07TZXwKaFHQC_3HzQbXU';
const HOST = 'pal-backend-production.up.railway.app';

console.log('\n' + '='.repeat(80));
console.log('RAILWAY PUPPETEER TEST - Can Chromium Launch on Production?');
console.log('='.repeat(80));
console.log(`Testing: https://${HOST}`);
console.log('='.repeat(80) + '\n');

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: HOST,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function testPuppeteerLaunch() {
  console.log('[TEST] POST /api/butler/universal');
  console.log('Task: Navigate to https://example.com and take a screenshot\n');

  const startTime = Date.now();

  try {
    const result = await makeRequest('/api/butler/universal', 'POST', {
      task: 'Navigate to https://example.com and take a screenshot',
      confirmed: true,
      headless: true
    });

    const elapsed = Date.now() - startTime;

    console.log(`Response Status: ${result.status}`);
    console.log(`Response Time: ${elapsed}ms`);
    console.log('\n--- RESPONSE DATA ---');
    console.log(JSON.stringify(result.data, null, 2));
    console.log('--- END RESPONSE ---\n');

    // Analysis
    console.log('='.repeat(80));
    console.log('ANALYSIS:');
    console.log('='.repeat(80));

    if (result.status === 200) {
      console.log('✅ HTTP 200 - Request accepted by server');

      if (result.data.success === true) {
        console.log('✅ Task executed successfully');

        if (result.data.finalScreenshot) {
          const screenshotLen = result.data.finalScreenshot.length;
          console.log(`✅ Screenshot received (${screenshotLen} characters)`);
          console.log(`   Preview: ${result.data.finalScreenshot.substring(0, 80)}...`);

          console.log('\n' + '🎉'.repeat(40));
          console.log('SUCCESS: PUPPETEER IS WORKING ON RAILWAY!');
          console.log('Chromium launched successfully and captured screenshot.');
          console.log('🎉'.repeat(40));
        } else {
          console.log('⚠️  No screenshot data received');
        }

        if (result.data.sessionId) {
          console.log(`   Session ID: ${result.data.sessionId}`);
        }
        if (result.data.steps) {
          console.log(`   Steps completed: ${result.data.steps}`);
        }
        if (result.data.message) {
          console.log(`   Message: ${result.data.message}`);
        }

      } else {
        console.log('❌ Task failed (success: false)');

        if (result.data.error) {
          console.log(`\n   ERROR: ${result.data.error}`);

          // Check for browser launch failures
          const errorLower = result.data.error.toLowerCase();
          if (errorLower.includes('launch') ||
              errorLower.includes('chrome') ||
              errorLower.includes('browser') ||
              errorLower.includes('puppeteer')) {

            console.log('\n' + '❌'.repeat(40));
            console.log('BROWSER LAUNCH FAILURE DETECTED');
            console.log('❌'.repeat(40));
            console.log('\nPuppeteer cannot launch Chromium on Railway.');
            console.log('\nPOSSIBLE CAUSES:');
            console.log('1. Chromium binary not found at /usr/bin/chromium');
            console.log('2. Missing system dependencies (libgbm, libnss3, etc.)');
            console.log('3. Dockerfile build failed to install chromium');
            console.log('4. Railway using wrong builder (should use DOCKERFILE)');
            console.log('\nRECOMMENDED ACTIONS:');
            console.log('1. Check Railway deployment logs');
            console.log('2. Verify Dockerfile built successfully');
            console.log('3. SSH into Railway container and check: which chromium');
            console.log('4. Test locally with: docker build -t test . && docker run test');
          }
        }

        if (result.data.message) {
          console.log(`   Message: ${result.data.message}`);
        }
      }

    } else if (result.status === 401) {
      console.log('❌ HTTP 401 - Authentication failed');
      console.log('   Token may be expired or invalid');

    } else if (result.status === 500) {
      console.log('❌ HTTP 500 - Server error');
      console.log('   Backend crashed or encountered fatal error');
      if (result.data.error) {
        console.log(`   Error: ${result.data.error}`);
      }

    } else {
      console.log(`❌ HTTP ${result.status} - Unexpected response`);
    }

    console.log('='.repeat(80));

    return result;

  } catch (error) {
    const elapsed = Date.now() - startTime;

    console.log(`❌ REQUEST FAILED after ${elapsed}ms`);
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);

    console.log('\n' + '='.repeat(80));
    console.log('NETWORK ERROR - Cannot reach Railway backend');
    console.log('='.repeat(80));
    console.log('Check if the Railway service is running:');
    console.log(`https://${HOST}/health`);

    return null;
  }
}

// Run the test
testPuppeteerLaunch()
  .then(() => {
    console.log('\nTest completed.\n');
  })
  .catch((err) => {
    console.error('\nFATAL ERROR:', err);
    process.exit(1);
  });
