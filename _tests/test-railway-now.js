#!/usr/bin/env node

/**
 * QUICK RAILWAY PUPPETEER TEST
 * Run this immediately to test if Puppeteer works on Railway
 *
 * Usage: node test-railway-now.js
 */

const https = require('https');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGUwMGJjYjk3ZTUzMzE0MDJiMzFlYiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY3MTk2NzYsImV4cCI6MTc5ODI1NTY3Nn0.o_tUCsh0tOQBk6Dsp34cula07TZXwKaFHQC_3HzQbXU';
const HOST = 'pal-backend-production.up.railway.app';
const PATH = '/api/butler/universal';

console.log('\n🚀 TESTING PUPPETEER ON RAILWAY...\n');

const postData = JSON.stringify({
  task: 'Navigate to https://example.com and take a screenshot',
  confirmed: true,
  headless: true
});

const options = {
  hostname: HOST,
  port: 443,
  path: PATH,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const startTime = Date.now();

const req = https.request(options, (res) => {
  console.log(`📡 Response Status: ${res.statusCode}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const elapsed = Date.now() - startTime;
    console.log(`⏱️  Response Time: ${elapsed}ms\n`);

    try {
      const json = JSON.parse(data);
      console.log('📦 Response Data:');
      console.log(JSON.stringify(json, null, 2));
      console.log('\n' + '='.repeat(80));

      if (json.success === true) {
        console.log('✅ SUCCESS: PUPPETEER IS WORKING ON RAILWAY!');
        if (json.finalScreenshot) {
          console.log(`✅ Screenshot captured (${json.finalScreenshot.length} chars)`);
        }
        if (json.sessionId) {
          console.log(`✅ Session ID: ${json.sessionId}`);
        }
        console.log('\n🎉 Chromium launched successfully!');
      } else if (json.success === false) {
        console.log('❌ FAILED: Task execution failed');
        if (json.error) {
          console.log(`\n❌ Error: ${json.error}`);

          const errorLower = json.error.toLowerCase();
          if (errorLower.includes('launch') ||
              errorLower.includes('chrome') ||
              errorLower.includes('browser')) {
            console.log('\n🔴 BROWSER LAUNCH FAILURE DETECTED');
            console.log('   Puppeteer cannot launch Chromium on Railway.');
            console.log('\n   Possible causes:');
            console.log('   • Chromium not installed');
            console.log('   • Missing dependencies');
            console.log('   • Wrong Dockerfile configuration');
          }
        }
        if (json.message) {
          console.log(`\nℹ️  Message: ${json.message}`);
        }
      } else {
        console.log('⚠️  UNKNOWN RESPONSE');
      }

      console.log('='.repeat(80) + '\n');

    } catch (e) {
      console.log('❌ Failed to parse JSON response');
      console.log('Raw response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.error('\n🔴 Cannot reach Railway backend');
  console.error('   Check if the service is running at:', `https://${HOST}`);
});

req.write(postData);
req.end();
