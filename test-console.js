/**
 * PHOENIX LOGIN FLOW INTERACTIVE CONSOLE
 * Real-time testing & debugging of auth endpoints
 */

const https = require('https');
const readline = require('readline');

const BACKEND_URL = 'https://pal-backend-production.up.railway.app';
let authToken = null;
let testEmail = 'test@test.com';
let testPassword = 'password123';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '🔥 Phoenix> '
});

// Helper to make HTTPS requests
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
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
            body: data ? JSON.parse(data) : null,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Commands
const commands = {
  health: async () => {
    console.log('\n📊 Health Check...');
    try {
      const res = await request('GET', '/api/health');
      console.log(`Status: ${res.status}`);
      console.log(`Response:`, JSON.stringify(res.body, null, 2));
    } catch (e) {
      console.error('Error:', e.message);
    }
  },

  preflight: async () => {
    console.log('\n🔐 CORS Preflight Check...');
    try {
      const res = await request('OPTIONS', '/api/auth/login');
      console.log(`Status: ${res.status}`);
      console.log(`CORS Header:`, res.headers['access-control-allow-origin'] || 'NOT SET');
    } catch (e) {
      console.error('Error:', e.message);
    }
  },

  register: async (args) => {
    const email = args[0] || testEmail;
    const password = args[1] || testPassword;
    const name = args[2] || 'Test User';

    console.log(`\n👤 Registering: ${email}`);
    try {
      const res = await request('POST', '/api/auth/register', {
        name,
        email,
        password,
        emailVerified: true
      });
      console.log(`Status: ${res.status}`);
      if (res.body) {
        if (res.body.token) {
          authToken = res.body.token;
          console.log(`✅ Registered & logged in`);
          console.log(`Token: ${authToken.substring(0, 30)}...`);
        } else {
          console.log(`Response:`, JSON.stringify(res.body, null, 2));
        }
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  },

  login: async (args) => {
    const email = args[0] || testEmail;
    const password = args[1] || testPassword;

    console.log(`\n🔑 Logging in: ${email}`);
    try {
      const res = await request('POST', '/api/auth/login', {
        email,
        password
      });
      console.log(`Status: ${res.status}`);

      if (res.status === 200) {
        const token = res.body?.token || res.body?.accessToken;
        if (token) {
          authToken = token;
          console.log(`✅ Login successful`);
          console.log(`Token: ${token.substring(0, 30)}...`);
          console.log(`\n📍 Redirect URL:`);
          console.log(`dashboard.html#token=${encodeURIComponent(token)}&t=${Date.now()}`);
        }
      } else {
        console.log(`Response:`, JSON.stringify(res.body, null, 2));
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  },

  whoami: async () => {
    if (!authToken) {
      console.log('\n❌ Not logged in. Use: login [email] [password]');
      return;
    }

    console.log('\n👤 Getting user info...');
    try {
      const res = await request('GET', '/api/auth/me');
      console.log(`Status: ${res.status}`);
      console.log(`Response:`, JSON.stringify(res.body, null, 2));
    } catch (e) {
      console.error('Error:', e.message);
    }
  },

  test: async () => {
    console.log('\n🧪 Running full test suite...\n');

    try {
      // Health
      console.log('1. Health Check...');
      const health = await request('GET', '/api/health');
      console.log(`   Status: ${health.status} ${health.status === 200 ? '✅' : '❌'}\n`);

      // Preflight
      console.log('2. CORS Preflight...');
      const preflight = await request('OPTIONS', '/api/auth/login');
      const okPreflight = preflight.status === 200 || preflight.status === 204;
      console.log(`   Status: ${preflight.status} ${okPreflight ? '✅' : '❌'}\n`);

      // Register
      console.log('3. Register User...');
      const register = await request('POST', '/api/auth/register', {
        name: 'Test User',
        email: testEmail,
        password: testPassword,
        emailVerified: true
      });
      const okRegister = register.status === 201 || register.status === 400;
      console.log(`   Status: ${register.status} ${okRegister ? '✅' : '❌'}\n`);

      // Login
      console.log('4. Login...');
      const login = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: testPassword
      });
      const okLogin = login.status === 200;
      console.log(`   Status: ${login.status} ${okLogin ? '✅' : '❌'}`);

      if (okLogin) {
        const token = login.body?.token;
        if (token) {
          authToken = token;
          console.log(`   Token: ${token.substring(0, 30)}...\n`);
        }
      } else {
        console.log(`   Response: ${JSON.stringify(login.body)}\n`);
      }

      console.log(okHealth && okPreflight && okRegister && okLogin
        ? '✅ ALL TESTS PASSED'
        : '❌ SOME TESTS FAILED'
      );
    } catch (e) {
      console.error('Error:', e.message);
    }
  },

  status: async () => {
    console.log(`\n📡 Console Status:`);
    console.log(`Backend: ${BACKEND_URL}`);
    console.log(`Authenticated: ${authToken ? '✅ Yes' : '❌ No'}`);
    if (authToken) {
      console.log(`Token: ${authToken.substring(0, 30)}...`);
    }
    console.log(`Test Email: ${testEmail}`);
    console.log(`Test Password: ${'*'.repeat(testPassword.length)}`);
  },

  help: () => {
    console.log(`
🔥 PHOENIX LOGIN FLOW CONSOLE
════════════════════════════════════════════════════════════

Commands:
  health              Check backend health
  preflight           Test CORS preflight
  register [email] [pass] [name]  Register new user
  login [email] [pass]  Login existing user
  whoami              Get current user info
  test                Run full test suite
  status              Show console status
  clear               Clear screen
  exit                Exit console

Examples:
  register alice@test.com secret123
  login alice@test.com secret123
  test
════════════════════════════════════════════════════════════
`);
  },

  clear: () => {
    console.clear();
    console.log('🔥 PHOENIX LOGIN FLOW CONSOLE\n');
    console.log('Type "help" for commands\n');
  },

  exit: () => {
    console.log('\n👋 Goodbye!\n');
    process.exit(0);
  }
};

// Start
console.log(`
🔥 PHOENIX LOGIN FLOW CONSOLE
════════════════════════════════════════════════════════════
Backend: ${BACKEND_URL}
Type "help" for commands
════════════════════════════════════════════════════════════
`);

rl.prompt();

rl.on('line', async (input) => {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (commands[cmd]) {
    await commands[cmd](args);
  } else if (cmd) {
    console.log(`Unknown command: ${cmd}. Type "help" for commands.`);
  }

  rl.prompt();
});

rl.on('close', () => {
  console.log('\n👋 Goodbye!\n');
  process.exit(0);
});
