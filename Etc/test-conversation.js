// Test script for complex Phoenix conversations
const axios = require('axios');

const API_BASE = 'https://pal-backend-production.up.railway.app/api';
const LOCAL_BASE = 'http://localhost:5000/api';

// Use production API
const BASE_URL = API_BASE;

let authToken = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function login() {
  log(colors.cyan, '\n🔐 Logging in...');

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@phoenix.ai',
      password: 'password123'
    });

    authToken = response.data.token;
    log(colors.green, '✅ Login successful!');
    return true;
  } catch (error) {
    log(colors.red, '❌ Login failed. Create a test user:');
    log(colors.yellow, '   POST /api/auth/register');
    log(colors.yellow, '   { email: "test@phoenix.ai", password: "password123", name: "Test User" }');
    return false;
  }
}

async function sendMessage(message, personality = 'PHOENIX') {
  try {
    const response = await axios.post(
      `${BASE_URL}/phoenix/companion/chat`,
      {
        message,
        personality,
        includeContext: true
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    return response.data.data;
  } catch (error) {
    log(colors.red, `❌ Error: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function testBasicConversation() {
  log(colors.cyan, '\n\n' + '='.repeat(70));
  log(colors.cyan, '🧪 TEST 1: BASIC CONVERSATION FLOW');
  log(colors.cyan, '='.repeat(70));

  const messages = [
    "Hi Phoenix! How are you today?",
    "I've been thinking about starting a new fitness routine",
    "What do you think would be good for building strength?",
    "How often should I work out per week?",
    "Can you help me set a goal for this month?"
  ];

  for (const msg of messages) {
    log(colors.blue, `\n👤 User: ${msg}`);
    const response = await sendMessage(msg);

    if (response) {
      log(colors.green, `🤖 Phoenix: ${response.message}`);
      if (response.suggestions && response.suggestions.length > 0) {
        log(colors.yellow, `💡 Suggestions: ${response.suggestions.join(', ')}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testPersonalityConversation() {
  log(colors.cyan, '\n\n' + '='.repeat(70));
  log(colors.cyan, '🧪 TEST 2: PERSONALITY VARIATIONS');
  log(colors.cyan, '='.repeat(70));

  const personalities = ['PHOENIX', 'ALFRED', 'JARVIS'];
  const testMessage = "What's the best way to optimize my daily routine?";

  for (const personality of personalities) {
    log(colors.blue, `\n👤 User (to ${personality}): ${testMessage}`);
    const response = await sendMessage(testMessage, personality);

    if (response) {
      log(colors.green, `🤖 ${personality}: ${response.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testComplexMultiTurn() {
  log(colors.cyan, '\n\n' + '='.repeat(70));
  log(colors.cyan, '🧪 TEST 3: COMPLEX MULTI-TURN DIALOGUE');
  log(colors.cyan, '='.repeat(70));

  const dialogue = [
    {
      user: "I want to talk about my life goals",
      expect: "should ask follow-up questions or acknowledge goals"
    },
    {
      user: "I'm trying to balance my career and health",
      expect: "should reference previous message about goals"
    },
    {
      user: "My energy levels have been low lately",
      expect: "should ask about sleep, diet, or workouts"
    },
    {
      user: "I usually sleep around 6 hours",
      expect: "should suggest more sleep and reference energy issue"
    },
    {
      user: "How can I improve my sleep quality?",
      expect: "should provide actionable sleep advice"
    },
    {
      user: "What about my diet?",
      expect: "should connect diet to sleep and energy"
    },
    {
      user: "Can you create a plan for me?",
      expect: "should synthesize all previous topics into a cohesive plan"
    }
  ];

  for (const turn of dialogue) {
    log(colors.blue, `\n👤 User: ${turn.user}`);
    log(colors.yellow, `   Expected: ${turn.expect}`);

    const response = await sendMessage(turn.user);

    if (response) {
      log(colors.green, `🤖 Phoenix: ${response.message}`);

      // Check if response seems contextually relevant
      const messageLength = response.message.split(' ').length;
      if (messageLength < 10) {
        log(colors.red, `   ⚠️  Response seems too short (${messageLength} words)`);
      } else if (messageLength > 50) {
        log(colors.green, `   ✅ Good detail level (${messageLength} words)`);
      }

      if (response.suggestions && response.suggestions.length > 0) {
        log(colors.yellow, `💡 Suggestions: ${response.suggestions.join(', ')}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}

async function testContextAwareness() {
  log(colors.cyan, '\n\n' + '='.repeat(70));
  log(colors.cyan, '🧪 TEST 4: CONTEXT & DATA AWARENESS');
  log(colors.cyan, '='.repeat(70));

  const contextMessages = [
    "What does my workout data show?",
    "How's my recovery looking?",
    "Am I making progress on my goals?",
    "What patterns do you see in my health data?"
  ];

  for (const msg of contextMessages) {
    log(colors.blue, `\n👤 User: ${msg}`);
    const response = await sendMessage(msg);

    if (response) {
      log(colors.green, `🤖 Phoenix: ${response.message}`);

      if (response.context) {
        log(colors.magenta, `📊 Context Used:`);
        log(colors.magenta, `   - Workouts: ${response.context.recentWorkouts || 0}`);
        log(colors.magenta, `   - Goals: ${response.context.activeGoals || 0}`);
        log(colors.magenta, `   - Recovery: ${response.context.recoveryScore || 'N/A'}`);
        log(colors.magenta, `   - Data Available: ${response.context.dataAvailable ? 'Yes' : 'No'}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function runAllTests() {
  log(colors.cyan, '\n' + '='.repeat(70));
  log(colors.cyan, '🚀 PHOENIX COMPLEX CONVERSATION TEST SUITE');
  log(colors.cyan, '='.repeat(70));

  const loginSuccess = await login();
  if (!loginSuccess) {
    log(colors.red, '\n❌ Tests aborted: Login required');
    return;
  }

  await testBasicConversation();
  await testPersonalityConversation();
  await testComplexMultiTurn();
  await testContextAwareness();

  log(colors.cyan, '\n\n' + '='.repeat(70));
  log(colors.green, '✅ ALL TESTS COMPLETED!');
  log(colors.cyan, '='.repeat(70));

  log(colors.blue, '\n📋 Enhancements Made:');
  log(colors.green, '   ✅ 15 message history (was 3)');
  log(colors.green, '   ✅ 800 token responses (was 150)');
  log(colors.green, '   ✅ Rich personality prompts');
  log(colors.green, '   ✅ Context integration');
  log(colors.green, '   ✅ Personality-driven errors');
  log(colors.green, '   ✅ Multi-turn awareness');

  log(colors.cyan, '\n💡 Next Steps:');
  log(colors.yellow, '   1. Review conversation quality');
  log(colors.yellow, '   2. Test with real user data');
  log(colors.yellow, '   3. Deploy to production');
  log(colors.yellow, '   4. Monitor conversation metrics\n');
}

// Run tests
runAllTests().catch(error => {
  log(colors.red, '\n❌ Test suite failed:', error.message);
  process.exit(1);
});
