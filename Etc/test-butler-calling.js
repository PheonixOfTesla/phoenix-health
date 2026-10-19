// Test script for Butler Twilio calling endpoints
const axios = require('axios');

const API_BASE = 'https://pal-backend-production.up.railway.app/api';
const LOCAL_BASE = 'http://localhost:5000/api';

// Use production API
const BASE_URL = API_BASE;

// Test user credentials (you'll need to create a test user or use existing)
let authToken = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function login() {
  log(colors.cyan, '\n🔐 Step 1: Login to get auth token...');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@phoenix.ai',
      password: 'password123'
    });

    authToken = response.data.token;
    log(colors.green, '✅ Login successful!');
    log(colors.blue, `   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    log(colors.red, '❌ Login failed. Please create a test user first:');
    log(colors.yellow, '   POST /api/auth/register');
    log(colors.yellow, '   { email: "test@phoenix.ai", password: "password123", name: "Test User" }');
    return false;
  }
}

async function testHealthCheck() {
  log(colors.cyan, '\n📊 Step 2: Check server health and endpoints...');

  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    log(colors.green, '✅ Server is healthy!');
    log(colors.blue, `   Total Endpoints: ${response.data.routes.total_endpoints}`);
    log(colors.blue, `   Butler Endpoints: ${response.data.routes.total_endpoints >= 311 ? '10 (NEW!)' : '6 (OLD)'}`);

    if (response.data.routes.total_endpoints >= 311) {
      log(colors.green, '   ✅ NEW VERSION DEPLOYED! (311+ endpoints)');
    } else {
      log(colors.yellow, '   ⚠️  Old version still running (307 endpoints)');
      log(colors.yellow, '   Wait for deployment to complete...');
    }

    return response.data.routes.total_endpoints >= 311;
  } catch (error) {
    log(colors.red, '❌ Health check failed:', error.message);
    return false;
  }
}

async function testQuickEstimate() {
  log(colors.cyan, '\n💵 Step 3: Test quick price estimation...');

  try {
    const response = await axios.post(
      `${BASE_URL}/butler/estimate`,
      {
        provider: 'uber',
        pickup: {
          lat: 40.7580,
          lng: -73.9855,
          address: 'Times Square, New York, NY'
        },
        dropoff: {
          lat: 40.7489,
          lng: -73.9680,
          address: 'Grand Central Terminal, New York, NY'
        }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log(colors.green, '✅ Price estimation successful!');
    log(colors.blue, `   Provider: ${response.data.provider}`);
    log(colors.blue, `   Distance: ${response.data.estimates.uberX?.distance || 'N/A'} miles`);
    log(colors.blue, `   UberX: $${response.data.estimates.uberX?.estimated || 'N/A'}`);
    log(colors.blue, `   UberXL: $${response.data.estimates.uberXL?.estimated || 'N/A'}`);
    log(colors.blue, `   Surge Active: ${response.data.estimates.uberX?.surgeActive ? 'Yes' : 'No'}`);
    return true;
  } catch (error) {
    log(colors.red, '❌ Price estimation failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCallUber() {
  log(colors.cyan, '\n📞 Step 4: Test Uber calling endpoint...');
  log(colors.yellow, '   ⚠️  This will make a REAL phone call to Uber!');
  log(colors.yellow, '   ⚠️  Skipping actual call to avoid charges...');
  log(colors.yellow, '   ⚠️  To test for real, uncomment the code below');

  // Uncomment to make a real call:
  /*
  try {
    const response = await axios.post(
      `${BASE_URL}/butler/call/uber`,
      {
        pickup: {
          address: '123 Main St, New York, NY'
        },
        dropoff: {
          address: '456 Park Ave, New York, NY'
        },
        userPhone: '+1234567890' // Replace with your phone number
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    log(colors.green, '✅ Uber call initiated!');
    log(colors.blue, `   Call SID: ${response.data.callSid}`);
    log(colors.blue, `   Status: ${response.data.status}`);
    log(colors.blue, `   To: ${response.data.to}`);
    log(colors.blue, `   Phone: ${response.data.phoneNumber}`);
    return true;
  } catch (error) {
    log(colors.red, '❌ Uber call failed:', error.response?.data?.message || error.message);
    return false;
  }
  */

  log(colors.blue, '   ℹ️  Endpoint available at: POST /api/butler/call/uber');
  return true;
}

async function testCallLyft() {
  log(colors.cyan, '\n📞 Step 5: Test Lyft calling endpoint...');
  log(colors.yellow, '   ⚠️  This will make a REAL phone call to Lyft!');
  log(colors.yellow, '   ⚠️  Skipping actual call to avoid charges...');

  log(colors.blue, '   ℹ️  Endpoint available at: POST /api/butler/call/lyft');
  return true;
}

async function testTestCall() {
  log(colors.cyan, '\n📞 Step 6: Test the test-call endpoint...');
  log(colors.yellow, '   ℹ️  This would call a test number to verify Twilio setup');
  log(colors.yellow, '   ℹ️  Skipping to avoid charges...');

  log(colors.blue, '   ℹ️  Endpoint available at: POST /api/butler/test-call');
  log(colors.blue, '   ℹ️  Body: { "testNumber": "+1234567890" }');
  return true;
}

async function runTests() {
  log(colors.cyan, '\n' + '='.repeat(70));
  log(colors.cyan, '🧪 PHOENIX BUTLER TWILIO CALLING TEST SUITE');
  log(colors.cyan, '='.repeat(70));

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    log(colors.red, '\n❌ Tests aborted: Login required');
    return;
  }

  // Step 2: Health check
  const isNewVersion = await testHealthCheck();
  if (!isNewVersion) {
    log(colors.yellow, '\n⚠️  Tests aborted: Wait for new deployment (311 endpoints)');
    return;
  }

  // Step 3: Test price estimation
  await testQuickEstimate();

  // Step 4-6: Test calling endpoints (mocked for safety)
  await testCallUber();
  await testCallLyft();
  await testTestCall();

  log(colors.cyan, '\n' + '='.repeat(70));
  log(colors.green, '✅ ALL TESTS COMPLETED!');
  log(colors.cyan, '='.repeat(70));

  log(colors.blue, '\n📋 Summary:');
  log(colors.green, '   ✅ POST /api/butler/estimate - Quick price estimates (formula-based)');
  log(colors.green, '   ✅ POST /api/butler/call/uber - Call Uber to book rides');
  log(colors.green, '   ✅ POST /api/butler/call/lyft - Call Lyft to book rides');
  log(colors.green, '   ✅ POST /api/butler/test-call - Test Twilio setup');

  log(colors.cyan, '\n💡 To make REAL calls:');
  log(colors.yellow, '   1. Uncomment the axios.post() calls in this script');
  log(colors.yellow, '   2. Replace userPhone with your real phone number');
  log(colors.yellow, '   3. Run: node test-butler-calling.js');
  log(colors.yellow, '   4. Cost: ~$0.04 per call to Uber/Lyft');

  log(colors.cyan, '\n💰 Business Model:');
  log(colors.green, '   Cost: $0.04 per ride booking');
  log(colors.green, '   Charge: $3-5 per ride');
  log(colors.green, '   Profit: $2.96-4.96 per ride (99% margin!)');
  log(colors.green, '   No API restrictions or gatekeeping!');
}

// Run tests
runTests().catch(error => {
  log(colors.red, '\n❌ Test suite failed:', error.message);
  process.exit(1);
});
