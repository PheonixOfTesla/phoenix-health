/**
 * Create test user for iOS integration testing
 */

const axios = require('axios');

const API_BASE_URL = 'https://pal-backend-production.up.railway.app/api';

async function createTestUser() {
  const testUser = {
    name: 'iOS Test User',
    email: 'ios-test-' + Date.now() + '@phoenix.ai',
    password: 'TestPassword123!',
    phone: '+1555' + Math.floor(Math.random() * 10000000)
  };

  try {
    console.log('Creating test user...');
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);

    console.log('✅ Test user created successfully');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    console.log('Token:', response.data.token);

    return response.data.token;
  } catch (error) {
    if (error.response?.data?.error === 'Email already exists') {
      console.log('⚠️  Test user already exists, attempting login...');

      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });

        console.log('✅ Logged in successfully');
        console.log('Token:', loginResponse.data.token);
        return loginResponse.data.token;
      } catch (loginError) {
        console.error('❌ Login failed:', loginError.response?.data || loginError.message);
        return null;
      }
    } else {
      console.error('❌ Error creating test user:', error.response?.data || error.message);
      return null;
    }
  }
}

createTestUser().then(token => {
  if (token) {
    console.log('\n✅ Ready to run tests!');
    console.log('Run: node test-ios-integration.js');
  } else {
    console.log('\n❌ Failed to create test user');
    process.exit(1);
  }
});
