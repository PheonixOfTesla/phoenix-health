/**
 * COMPREHENSIVE LOGIN FLOW TEST
 * Tests: Backend responsiveness → User creation → Login → Token generation → Frontend redirect
 */

const https = require('https');

const BACKEND_URL = 'https://pal-backend-production.up.railway.app';
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'password123';

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BACKEND_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testLoginFlow() {
    console.log('🧪 PHOENIX LOGIN FLOW TEST SUITE\n');
    console.log('Testing:', BACKEND_URL);
    console.log('═'.repeat(60));

    try {
        // Test 1: Backend Health
        console.log('\n1️⃣  HEALTH CHECK');
        const health = await makeRequest('GET', '/api/health');
        console.log(`   Status: ${health.status}`);
        if (health.body) console.log(`   MongoDB: ${health.body.mongodb}`);
        console.log(`   ✅ Backend is responding`);

        // Test 2: CORS Preflight (OPTIONS)
        console.log('\n2️⃣  CORS PREFLIGHT (OPTIONS /api/auth/login)');
        const preflight = await makeRequest('OPTIONS', '/api/auth/login');
        console.log(`   Status: ${preflight.status}`);
        console.log(`   CORS Headers: ${preflight.headers['access-control-allow-origin'] || 'NOT SET'}`);
        if (preflight.status === 200 || preflight.status === 204) {
            console.log(`   ✅ Preflight response OK`);
        } else {
            console.log(`   ⚠️  Preflight returned ${preflight.status} (expected 200/204)`);
        }

        // Test 3: User Registration
        console.log('\n3️⃣  REGISTER TEST USER');
        const register = await makeRequest('POST', '/api/auth/register', {
            name: 'Test User',
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            emailVerified: true  // Bypass verification for testing
        });
        console.log(`   Status: ${register.status}`);
        if (register.status === 201 || register.status === 400) {
            if (register.body?.message?.includes('already exists')) {
                console.log(`   ℹ️  User already exists (OK for test)`);
            } else if (register.status === 201) {
                console.log(`   ✅ User created successfully`);
            }
        } else {
            console.log(`   ❌ Registration failed: ${register.status}`);
            console.log(`   Response:`, register.body);
        }

        // Test 4: Login
        console.log('\n4️⃣  LOGIN TEST');
        const login = await makeRequest('POST', '/api/auth/login', {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        console.log(`   Status: ${login.status}`);

        if (login.status === 200) {
            const token = login.body?.token || login.body?.accessToken;
            if (token) {
                console.log(`   ✅ LOGIN SUCCESSFUL`);
                console.log(`   📌 Token received: ${token.substring(0, 20)}...`);
                console.log(`   \n   🔗 Frontend redirect URL:`);
                console.log(`   dashboard.html#token=${encodeURIComponent(token)}`);
            } else {
                console.log(`   ⚠️  Login returned 200 but no token: ${JSON.stringify(login.body)}`);
            }
        } else if (login.status === 403) {
            console.log(`   ℹ️  Verification required: ${login.body?.message}`);
            console.log(`   (Expected for test users without email verification)`);
        } else {
            console.log(`   ❌ Login failed with status ${login.status}`);
            console.log(`   Response:`, login.body);
        }

        console.log('\n' + '═'.repeat(60));
        console.log('🎯 TEST COMPLETE');

    } catch (error) {
        console.error('❌ TEST ERROR:', error.message);
    }
}

testLoginFlow();
