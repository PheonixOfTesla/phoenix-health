/**
 * iOS NATIVE INTEGRATION TEST SUITE
 *
 * Tests all 7 iOS API endpoints to ensure backend integration works
 */

const axios = require('axios');

const API_BASE_URL = 'https://pal-backend-production.up.railway.app/api';

// Use token from created test user
let authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTk2MTdkMzVmNWUzNWZlNGVjODExMiIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjMyNzEwMzcsImV4cCI6MTc2MzM1NzQzN30.kr3cyqsqT5f0mMCuhYtR69Kr9CHQWn3OjkQOjKKGniQ';

async function testLogin() {
  console.log('\n🔐 Using pre-generated test token...');
  console.log(`   Token: ${authToken.substring(0, 30)}...`);
  console.log('✅ Token ready');
  return true;
}

async function testHealthKitSync() {
  console.log('\n💪 Testing HealthKit sync endpoint...');

  const mockHealthData = {
    heartRate: {
      resting: 65
    },
    heartRateVariability: 55,
    sleepAnalysis: {
      totalSleep: 7.5,
      deepSleep: 2.0
    },
    steps: 8500,
    activeEnergy: 450,
    restingEnergy: 1800,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/ios/healthkit/sync`, mockHealthData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ HealthKit sync successful');
    console.log(`   Recovery Score: ${response.data.recoveryScore}%`);
    console.log(`   Insights: ${response.data.insights?.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error('❌ HealthKit sync failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testCalendarSync() {
  console.log('\n📅 Testing Calendar sync endpoint...');

  const mockEvents = [
    {
      title: 'Team Meeting',
      startDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      endDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      location: 'Conference Room A'
    },
    {
      title: 'Gym Workout',
      startDate: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
      endDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      location: 'Fitness Center'
    }
  ];

  try {
    const response = await axios.post(`${API_BASE_URL}/ios/calendar/sync`,
      { events: mockEvents },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );

    console.log('✅ Calendar sync successful');
    console.log(`   Summary: ${response.data.summary}`);
    return true;
  } catch (error) {
    console.error('❌ Calendar sync failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testLocationUpdate() {
  console.log('\n📍 Testing Location update endpoint...');

  const mockLocation = {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    altitude: 50,
    heading: 180,
    speed: 0
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/ios/location/update`, mockLocation, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Location update successful');
    console.log(`   Context: ${response.data.context?.type || 'unknown'}`);
    return true;
  } catch (error) {
    console.error('❌ Location update failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testContactSearch() {
  console.log('\n👤 Testing Contact search endpoint...');

  const mockContacts = [
    { givenName: 'John', familyName: 'Doe', phoneNumbers: ['+1234567890'] },
    { givenName: 'Jane', familyName: 'Smith', phoneNumbers: ['+0987654321'] },
    { givenName: 'Bob', familyName: 'Johnson', phoneNumbers: ['+1122334455'] }
  ];

  try {
    const response = await axios.post(`${API_BASE_URL}/ios/contacts/search`,
      { query: 'John', contacts: mockContacts },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );

    console.log('✅ Contact search successful');
    console.log(`   Matches: ${response.data.matches?.length || 0}`);
    console.log(`   Exact match: ${response.data.exactMatch?.givenName || 'none'}`);
    return true;
  } catch (error) {
    console.error('❌ Contact search failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testVoiceCommand() {
  console.log('\n🎤 Testing Voice command endpoint...');

  const mockNativeContext = {
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    device: {
      batteryLevel: 0.75,
      isCharging: false,
      platform: 'iOS',
      model: 'iPhone 14 Pro'
    }
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/ios/voice-command`,
      {
        command: "What's my recovery score?",
        nativeContext: mockNativeContext
      },
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );

    console.log('✅ Voice command successful');
    console.log(`   Response: ${response.data.response?.substring(0, 100)}...`);
    console.log(`   Classification: ${response.data.classification}`);
    return true;
  } catch (error) {
    console.error('❌ Voice command failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testContextSync() {
  console.log('\n🔄 Testing Unified context sync endpoint...');

  const mockNativeData = {
    healthKit: {
      heartRate: { resting: 68 },
      heartRateVariability: 52,
      sleepAnalysis: { totalSleep: 7.0, deepSleep: 1.8 },
      steps: 7500
    },
    calendar: [
      {
        title: 'Standup',
        startDate: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString()
      }
    ],
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 15
    },
    device: {
      batteryLevel: 0.82,
      isCharging: true,
      platform: 'iOS',
      model: 'iPhone 15 Pro Max'
    }
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/ios/context/sync`, mockNativeData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Context sync successful');
    console.log(`   Health recovery: ${response.data.context?.health?.recoveryScore}%`);
    console.log(`   Location type: ${response.data.context?.location?.context?.type || 'unknown'}`);
    console.log(`   Battery: ${Math.round((response.data.context?.device?.batteryLevel || 0) * 100)}%`);
    return true;
  } catch (error) {
    console.error('❌ Context sync failed:', error.response?.data?.error || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('🧪 iOS NATIVE INTEGRATION TEST SUITE');
  console.log('='.repeat(70));

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test authentication first
  const isAuthenticated = await testLogin();

  if (isAuthenticated) {
    // Run all endpoint tests
    const tests = [
      testHealthKitSync,
      testCalendarSync,
      testLocationUpdate,
      testContactSearch,
      testVoiceCommand,
      testContextSync
    ];

    for (const test of tests) {
      results.total++;
      const passed = await test();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }
  } else {
    console.log('\n⚠️  Cannot run tests without authentication');
    console.log('   Create a test user or provide valid credentials');
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('='.repeat(70));

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
