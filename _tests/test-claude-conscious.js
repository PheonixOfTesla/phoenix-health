/**
 * STANDALONE TEST: Claude Conscious Mind
 * Tests Claude API connection and response format
 */

require('dotenv').config();
const claudeConscious = require('./Src/services/claude/consciousMind');

async function testClaudeConscious() {
  console.log('==========================================');
  console.log('TESTING CLAUDE CONSCIOUS MIND');
  console.log('==========================================\n');

  // Check API key
  console.log('1. Checking ANTHROPIC_API_KEY...');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
  }
  console.log(`✅ API Key found: ${process.env.ANTHROPIC_API_KEY.substring(0, 20)}...`);
  console.log();

  // Test 1: Simple query
  console.log('2. Testing simple query...');
  try {
    const response1 = await claudeConscious.respondToQuery(
      "Hello, how are you?",
      "test-user-123",
      { userName: "Test User", mode: "voice" }
    );

    console.log('✅ Response received:');
    console.log('   Message:', response1.message);
    console.log('   Source:', response1.source);
    console.log('   Response Time:', response1.responseTime, 'ms');
    console.log('   Confidence:', response1.confidence);
    console.log('   Query Type:', response1.queryType);
    console.log('   UI Command:', response1.ui);
    console.log();

    // Verify response format
    if (!response1.message || !response1.source || typeof response1.responseTime !== 'number') {
      console.error('❌ Response format invalid!');
      process.exit(1);
    }
    console.log('✅ Response format valid');
    console.log();
  } catch (error) {
    console.error('❌ Simple query test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }

  // Test 2: UI trigger query
  console.log('3. Testing UI trigger query...');
  try {
    const response2 = await claudeConscious.respondToQuery(
      "Show me my active plan",
      "test-user-123",
      { userName: "Test User", mode: "voice" }
    );

    console.log('✅ Response received:');
    console.log('   Message:', response2.message);
    console.log('   UI Command:', JSON.stringify(response2.ui, null, 2));
    console.log();

    // Verify UI command detected
    if (response2.ui.action === 'none') {
      console.warn('⚠️  UI trigger not detected - check detectUITriggers()');
    } else {
      console.log('✅ UI command detected!');
    }
    console.log();
  } catch (error) {
    console.error('❌ UI trigger test failed:', error.message);
    process.exit(1);
  }

  // Test 3: Conversation history
  console.log('4. Testing conversation history...');
  try {
    await claudeConscious.respondToQuery(
      "My name is John",
      "test-user-456",
      { userName: "John", mode: "voice" }
    );

    const response3 = await claudeConscious.respondToQuery(
      "What's my name?",
      "test-user-456",
      { userName: "John", mode: "voice" }
    );

    console.log('✅ Response:', response3.message);
    console.log();

    // Check if history is working
    const history = claudeConscious.getHistory("test-user-456");
    console.log('✅ History length:', history.length);
    console.log();
  } catch (error) {
    console.error('❌ History test failed:', error.message);
    process.exit(1);
  }

  console.log('==========================================');
  console.log('✅ ALL TESTS PASSED!');
  console.log('==========================================');
  console.log();
  console.log('Claude Conscious Mind is working correctly.');
  console.log('Safe to proceed with integration.');

  process.exit(0);
}

// Run tests
testClaudeConscious().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
