const axios = require('axios');

const API_URL = 'https://pal-backend-production.up.railway.app/api';

async function quickTest() {
    // Login
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: '8087510813',
        password: '123456'
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in!');

    // Ask one question
    console.log('\n🗣️ YOU: What is the meaning of life?\n');

    const response = await axios.post(
        `${API_URL}/interface/orchestrate`,
        { voiceQuery: 'What is the meaning of life?' },
        { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('📦 FULL API RESPONSE:');
    console.log(JSON.stringify(response.data, null, 2));
}

quickTest().catch(console.error);
