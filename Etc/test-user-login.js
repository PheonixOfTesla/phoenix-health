const axios = require('axios');
const API_URL = 'https://pal-backend-production.up.railway.app/api';

async function getOrCreateUser() {
    const users = [
        { email: 'josh@phoenixai.com', password: 'password123' },
        { email: 'test@test.com', password: 'test123456' },
        { email: 'demo@phoenix.ai', password: 'Demo123456!' }
    ];

    for (const user of users) {
        try {
            console.log(`Trying ${user.email}...`);
            const response = await axios.post(`${API_URL}/auth/login`, user);
            console.log(`✅ SUCCESS! Logged in as ${user.email}`);
            const token = response.data.token;
            console.log(`Token: ${token.substring(0, 30)}...`);
            return { user, token };
        } catch (e) {
            console.log(`  ❌ Failed: ${e.response?.data?.message || e.message}`);
        }
    }

    console.log('\nCreating new user...');
    try {
        const newUser = {
            name: 'Phoenix Tester',
            email: `phoenix_test_${Date.now()}@test.com`,
            password: 'TestPassword123!',
            firstName: 'Phoenix',
            lastName: 'Tester'
        };
        const response = await axios.post(`${API_URL}/auth/register`, newUser);
        console.log(`✅ Created and logged in as ${newUser.email}`);
        const token = response.data.token;
        console.log(`Token: ${token.substring(0, 30)}...`);
        return { user: newUser, token };
    } catch (e) {
        console.error('❌ Registration failed:', e.response?.data || e.message);
        return null;
    }
}

getOrCreateUser().then(result => {
    if (result) {
        console.log('\n📋 USE THESE CREDENTIALS:');
        console.log(`Email: ${result.user.email}`);
        console.log(`Password: ${result.user.password}`);
        console.log(`Token: ${result.token}`);
    }
});
