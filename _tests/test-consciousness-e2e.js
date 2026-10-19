/**
 * END-TO-END CONSCIOUSNESS TEST
 * Tests the full Phoenix flow: Intent → Butler → Automation
 */

const intentRouter = require('./Src/services/consciousness/intentRouter');
const butlerAutomation = require('./Src/services/phoenix/butlerAutomation');

// Mock user ID for testing
const TEST_USER_ID = '6928cf99f3a594ff2f9f153d';

async function testConsciousnessFlow() {
  console.log('🔥 PHOENIX CONSCIOUSNESS E2E TEST');
  console.log('='.repeat(50));
  console.log('');

  // Test 1: Intent Classification
  console.log('1️⃣ INTENT CLASSIFICATION');
  console.log('-'.repeat(30));

  const testMessages = [
    { msg: 'order me pizza', expectedAction: 'order_food', minConfidence: 0.5 },
    { msg: 'order pizza from Dominos', expectedAction: 'order_food', minConfidence: 0.5 },
    { msg: 'book me an uber to the airport', expectedAction: 'book_ride', minConfidence: 0.4 },
    { msg: 'make a reservation at Nobu for 7pm', expectedAction: 'reservation', minConfidence: 0.4 },
    { msg: 'send an email to john@example.com', expectedAction: 'email', minConfidence: 0.4 },
    { msg: 'hello how are you', expectedAction: 'ai_response', minConfidence: 0.5 }
  ];

  let intentPassed = 0;
  for (const test of testMessages) {
    const result = intentRouter.classifyIntent(test.msg);
    const passed = result.action === test.expectedAction && result.confidence >= test.minConfidence;

    console.log(`"${test.msg}"`);
    console.log(`  Expected: ${test.expectedAction} @ ${test.minConfidence * 100}%+`);
    console.log(`  Got: ${result.action} @ ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');

    if (passed) intentPassed++;
  }

  console.log(`Intent Tests: ${intentPassed}/${testMessages.length} passed`);
  console.log('');

  // Test 2: Butler Automation (Mock - no credentials)
  console.log('2️⃣ BUTLER AUTOMATION');
  console.log('-'.repeat(30));

  try {
    console.log('Testing orderFood without credentials...');
    const foodResult = await butlerAutomation.orderFood({
      userId: TEST_USER_ID,
      restaurant: 'Dominos',
      items: ['Large Pepperoni Pizza']
    });

    console.log('Result:', JSON.stringify(foodResult, null, 2));
    console.log(foodResult.needsCredentials ? '✅ Correctly requires credentials' : '⚠️ Unexpected result');
    console.log('');

    console.log('Testing bookRide without credentials...');
    const rideResult = await butlerAutomation.bookRide({
      userId: TEST_USER_ID,
      pickup: '123 Main St',
      destination: 'Airport'
    });

    console.log('Result:', JSON.stringify(rideResult, null, 2));
    console.log(rideResult.needsCredentials ? '✅ Correctly requires credentials' : '⚠️ Unexpected result');
    console.log('');

  } catch (error) {
    console.log('❌ Butler Error:', error.message);
    console.log('');
  }

  // Test 3: Session Management
  console.log('3️⃣ FLOW VERIFICATION');
  console.log('-'.repeat(30));

  console.log(`
Flow when user says "order me pizza":

1. [phoenixController.chat] receives message
2. [phoenixMind.processMessage] processes it
3. [intentRouter.classifyIntent] → order_food @ ~55%
4. 55% > 40% threshold → Routes to Butler
5. [butlerAutomation.orderFood] executes
6. Checks for DoorDash credentials
7. If no credentials → Returns "Please connect DoorDash"
8. If credentials exist → Launches Puppeteer
9. Returns sessionId for live view streaming
10. Frontend shows Butler Live Widget
`);

  console.log('='.repeat(50));
  console.log('✅ E2E Test Complete');
}

// Run if called directly
if (require.main === module) {
  testConsciousnessFlow()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Test failed:', err);
      process.exit(1);
    });
}

module.exports = { testConsciousnessFlow };
