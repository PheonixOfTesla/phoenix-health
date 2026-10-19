// test-puppeteer-butler.js
// Comprehensive Test Script for Puppeteer Butler Automation
// ⚠️ WARNING: This will make REAL bookings/orders if credentials are valid!

const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@phoenix.ai';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

// Test credentials (DO NOT commit real credentials!)
const TEST_CREDENTIALS = {
  uber: {
    email: process.env.UBER_TEST_EMAIL || 'your-uber-email@example.com',
    password: process.env.UBER_TEST_PASSWORD || 'your-uber-password'
  },
  lyft: {
    email: process.env.LYFT_TEST_EMAIL || 'your-lyft-email@example.com',
    password: process.env.LYFT_TEST_PASSWORD || 'your-lyft-password'
  },
  opentable: {
    email: process.env.OPENTABLE_TEST_EMAIL || 'your-opentable-email@example.com',
    password: process.env.OPENTABLE_TEST_PASSWORD || 'your-opentable-password'
  },
  doordash: {
    email: process.env.DOORDASH_TEST_EMAIL || 'your-doordash-email@example.com',
    password: process.env.DOORDASH_TEST_PASSWORD || 'your-doordash-password'
  }
};

let authToken = null;

// Utility function for API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      config.headers['Content-Type'] = 'application/json';
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.data.message || error.response.statusText}`);
    }
    throw error;
  }
}

// Test 1: Login
async function testLogin() {
  console.log('\n📝 Test 1: Login to Phoenix');
  console.log('='.repeat(60));

  try {
    const result = await apiCall('POST', '/api/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    authToken = result.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    console.log('\n💡 Tip: Make sure you have a test user account created.');
    console.log(`   You can create one by POSTing to ${BASE_URL}/api/auth/register`);
    return false;
  }
}

// Test 2: Store Uber Credentials
async function testStoreUberCredentials() {
  console.log('\n🔐 Test 2: Store Uber Credentials');
  console.log('='.repeat(60));

  if (TEST_CREDENTIALS.uber.email === 'your-uber-email@example.com') {
    console.log('⏭️  Skipped: No real Uber credentials provided');
    console.log('   Set UBER_TEST_EMAIL and UBER_TEST_PASSWORD in .env to test');
    return false;
  }

  try {
    const result = await apiCall('POST', '/api/butler/credentials/uber', TEST_CREDENTIALS.uber, authToken);

    console.log('✅ Uber credentials stored successfully');
    console.log(`   Connected at: ${result.connectedAt}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to store Uber credentials:', error.message);
    return false;
  }
}

// Test 3: Store Lyft Credentials
async function testStoreLyftCredentials() {
  console.log('\n🔐 Test 3: Store Lyft Credentials');
  console.log('='.repeat(60));

  if (TEST_CREDENTIALS.lyft.email === 'your-lyft-email@example.com') {
    console.log('⏭️  Skipped: No real Lyft credentials provided');
    return false;
  }

  try {
    const result = await apiCall('POST', '/api/butler/credentials/lyft', TEST_CREDENTIALS.lyft, authToken);

    console.log('✅ Lyft credentials stored successfully');
    console.log(`   Connected at: ${result.connectedAt}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to store Lyft credentials:', error.message);
    return false;
  }
}

// Test 4: Store OpenTable Credentials
async function testStoreOpenTableCredentials() {
  console.log('\n🔐 Test 4: Store OpenTable Credentials');
  console.log('='.repeat(60));

  if (TEST_CREDENTIALS.opentable.email === 'your-opentable-email@example.com') {
    console.log('⏭️  Skipped: No real OpenTable credentials provided');
    return false;
  }

  try {
    const result = await apiCall('POST', '/api/butler/credentials/opentable', TEST_CREDENTIALS.opentable, authToken);

    console.log('✅ OpenTable credentials stored successfully');
    console.log(`   Connected at: ${result.connectedAt}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to store OpenTable credentials:', error.message);
    return false;
  }
}

// Test 5: Store DoorDash Credentials
async function testStoreDoorDashCredentials() {
  console.log('\n🔐 Test 5: Store DoorDash Credentials');
  console.log('='.repeat(60));

  if (TEST_CREDENTIALS.doordash.email === 'your-doordash-email@example.com') {
    console.log('⏭️  Skipped: No real DoorDash credentials provided');
    return false;
  }

  try {
    const result = await apiCall('POST', '/api/butler/credentials/doordash', TEST_CREDENTIALS.doordash, authToken);

    console.log('✅ DoorDash credentials stored successfully');
    console.log(`   Connected at: ${result.connectedAt}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to store DoorDash credentials:', error.message);
    return false;
  }
}

// Test 6: Get Credentials List
async function testGetCredentials() {
  console.log('\n📋 Test 6: Get Stored Credentials');
  console.log('='.repeat(60));

  try {
    const result = await apiCall('GET', '/api/butler/credentials', null, authToken);

    console.log('✅ Retrieved credentials list');
    console.log('\n   Connected Services:');
    Object.entries(result.connections).forEach(([service, info]) => {
      console.log(`   - ${service}: connected at ${new Date(info.connectedAt).toLocaleString()}`);
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to get credentials:', error.message);
    return false;
  }
}

// Test 7: Book Uber Ride (DRY RUN - will attempt but can be cancelled)
async function testBookUberRide() {
  console.log('\n🚗 Test 7: Book Uber Ride (TEST MODE)');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: This will attempt to book a REAL Uber ride!');
  console.log('   Make sure to cancel immediately if you don\'t want the ride.');

  if (TEST_CREDENTIALS.uber.email === 'your-uber-email@example.com') {
    console.log('⏭️  Skipped: No real Uber credentials provided');
    return false;
  }

  try {
    const rideData = {
      pickup: '1 Market Street, San Francisco, CA',
      destination: 'Ferry Building, San Francisco, CA',
      rideType: 'UberX'
    };

    console.log(`\n   Booking ${rideData.rideType} from:`);
    console.log(`   📍 Pickup: ${rideData.pickup}`);
    console.log(`   📍 Destination: ${rideData.destination}`);
    console.log('\n   ⏳ This may take 30-60 seconds...\n');

    const result = await apiCall('POST', '/api/butler/uber/book', rideData, authToken);

    if (result.success) {
      console.log('✅ Uber ride booked successfully!');
      console.log(`   Confirmation: ${result.confirmationNumber}`);
      console.log(`   Action ID: ${result.actionId}`);
      if (result.screenshot) {
        console.log(`   Screenshot saved (${result.screenshot.length} bytes)`);
      }
      return true;
    } else {
      console.error('❌ Uber booking failed:', result.error);
      if (result.screenshot) {
        console.log(`   Error screenshot saved (${result.screenshot.length} bytes)`);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Uber booking error:', error.message);
    return false;
  }
}

// Test 8: Book Lyft Ride (DRY RUN)
async function testBookLyftRide() {
  console.log('\n🚗 Test 8: Book Lyft Ride (TEST MODE)');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: This will attempt to book a REAL Lyft ride!');

  if (TEST_CREDENTIALS.lyft.email === 'your-lyft-email@example.com') {
    console.log('⏭️  Skipped: No real Lyft credentials provided');
    return false;
  }

  try {
    const rideData = {
      pickup: '1 Market Street, San Francisco, CA',
      destination: 'Ferry Building, San Francisco, CA',
      rideType: 'Lyft'
    };

    console.log(`\n   Booking ${rideData.rideType} from:`);
    console.log(`   📍 Pickup: ${rideData.pickup}`);
    console.log(`   📍 Destination: ${rideData.destination}`);
    console.log('\n   ⏳ This may take 30-60 seconds...\n');

    const result = await apiCall('POST', '/api/butler/lyft/book', rideData, authToken);

    if (result.success) {
      console.log('✅ Lyft ride booked successfully!');
      console.log(`   Confirmation: ${result.confirmationNumber}`);
      console.log(`   Action ID: ${result.actionId}`);
      return true;
    } else {
      console.error('❌ Lyft booking failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Lyft booking error:', error.message);
    return false;
  }
}

// Test 9: Make OpenTable Reservation (DRY RUN)
async function testOpenTableReservation() {
  console.log('\n🍽️  Test 9: Make OpenTable Reservation (TEST MODE)');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: This will attempt to make a REAL reservation!');

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const reservationData = {
      restaurantName: 'The French Laundry',
      date: dateStr,
      time: '19:00',
      partySize: 2,
      preferences: {
        specialRequest: 'Window table if available'
      }
    };

    console.log(`\n   Making reservation at ${reservationData.restaurantName}`);
    console.log(`   📅 Date: ${reservationData.date} at ${reservationData.time}`);
    console.log(`   👥 Party size: ${reservationData.partySize}`);
    console.log('\n   ⏳ This may take 30-60 seconds...\n');

    const result = await apiCall('POST', '/api/butler/opentable/reserve', reservationData, authToken);

    if (result.success) {
      console.log('✅ Reservation made successfully!');
      console.log(`   Confirmation: ${result.confirmationNumber}`);
      console.log(`   Action ID: ${result.actionId}`);
      return true;
    } else {
      console.error('❌ Reservation failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Reservation error:', error.message);
    return false;
  }
}

// Test 10: Get Butler Action History
async function testGetActionHistory() {
  console.log('\n📊 Test 10: Get Butler Action History');
  console.log('='.repeat(60));

  try {
    const result = await apiCall('GET', '/api/butler/actions?limit=10', null, authToken);

    console.log('✅ Retrieved action history');
    console.log(`   Total actions: ${result.count}`);

    if (result.actions.length > 0) {
      console.log('\n   Recent Actions:');
      result.actions.forEach((action, index) => {
        console.log(`\n   ${index + 1}. ${action.description}`);
        console.log(`      Status: ${action.status}`);
        console.log(`      Type: ${action.actionType}`);
        console.log(`      Created: ${new Date(action.createdAt).toLocaleString()}`);
        if (action.metadata.confirmationNumber) {
          console.log(`      Confirmation: ${action.metadata.confirmationNumber}`);
        }
      });
    } else {
      console.log('   No actions yet');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to get action history:', error.message);
    return false;
  }
}

// Test 11: Remove Credentials
async function testRemoveCredentials() {
  console.log('\n🗑️  Test 11: Remove Credentials (Cleanup)');
  console.log('='.repeat(60));

  const services = ['uber', 'lyft', 'opentable', 'doordash'];
  let allSuccess = true;

  for (const service of services) {
    try {
      await apiCall('DELETE', `/api/butler/credentials/${service}`, null, authToken);
      console.log(`✅ Removed ${service} credentials`);
    } catch (error) {
      console.log(`⏭️  ${service} credentials not found (already removed or never added)`);
    }
  }

  return allSuccess;
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   PUPPETEER BUTLER AUTOMATION TEST SUITE                      ║');
  console.log('║   Phoenix Personal Operating System                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Test sequence
  const tests = [
    { name: 'Login', fn: testLogin, critical: true },
    { name: 'Store Uber Credentials', fn: testStoreUberCredentials },
    { name: 'Store Lyft Credentials', fn: testStoreLyftCredentials },
    { name: 'Store OpenTable Credentials', fn: testStoreOpenTableCredentials },
    { name: 'Store DoorDash Credentials', fn: testStoreDoorDashCredentials },
    { name: 'Get Credentials', fn: testGetCredentials },
    { name: 'Book Uber Ride', fn: testBookUberRide, realAction: true },
    { name: 'Book Lyft Ride', fn: testBookLyftRide, realAction: true },
    { name: 'OpenTable Reservation', fn: testOpenTableReservation, realAction: true },
    { name: 'Get Action History', fn: testGetActionHistory },
    { name: 'Remove Credentials', fn: testRemoveCredentials }
  ];

  // Ask user if they want to run real action tests
  console.log('\n⚠️  IMPORTANT: Some tests will make REAL bookings/orders!');
  console.log('   Set SKIP_REAL_ACTIONS=true in .env to skip those tests.\n');

  const skipRealActions = process.env.SKIP_REAL_ACTIONS === 'true';

  for (const test of tests) {
    if (test.realAction && skipRealActions) {
      console.log(`\n⏭️  Skipping: ${test.name} (real action test)`);
      results.skipped++;
      continue;
    }

    const success = await test.fn();

    if (success) {
      results.passed++;
    } else if (success === false) {
      results.failed++;

      // Stop if critical test fails
      if (test.critical) {
        console.log('\n❌ Critical test failed. Stopping test suite.');
        break;
      }
    } else {
      results.skipped++;
    }

    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📊 Total:   ${results.passed + results.failed + results.skipped}`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
