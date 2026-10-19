/**
 * Intent Router Tests - Verify confidence scoring improvements
 */

const { classifyIntent } = require('./intentRouter.js');

console.log('='.repeat(60));
console.log('INTENT ROUTER CONFIDENCE TESTS');
console.log('='.repeat(60));
console.log();

const testCases = [
  {
    message: 'order me pizza',
    expectedAction: 'order_food',
    minConfidence: 0.70,
    description: 'Primary test case - must get 70%+ confidence'
  },
  {
    message: 'book me an uber',
    expectedAction: 'book_ride',
    minConfidence: 0.60,
    description: 'Secondary test case - must get 60%+ confidence'
  },
  {
    message: 'reserve a table at The Italian Kitchen',
    expectedAction: 'reservation',
    minConfidence: 0.60,
    description: 'Reservation with action verb start'
  },
  {
    message: 'send an email to John',
    expectedAction: 'email',
    minConfidence: 0.60,
    description: 'Email with action verb start'
  },
  {
    message: 'order sushi from downtown',
    expectedAction: 'order_food',
    minConfidence: 0.70,
    description: 'Food order variant'
  },
  {
    message: 'book a flight to San Francisco',
    expectedAction: 'reservation',
    minConfidence: 0.60,
    description: 'Travel booking with action verb (book matches reservation due to keyword overlap)'
  },
  {
    message: 'I am hungry for pizza',
    expectedAction: 'order_food',
    minConfidence: 0.15,
    description: 'Non-command mode - should have lower confidence'
  },
  {
    message: 'what is the weather like',
    expectedAction: 'ai_response',
    minConfidence: 0.15,
    description: 'Non-actionable query - should route to AI'
  },
  {
    message: 'deploy the backend',
    expectedAction: 'deploy',
    minConfidence: 0.60,
    description: 'Deploy command'
  },
  {
    message: 'pay my electricity bill',
    expectedAction: 'finance',
    minConfidence: 0.60,
    description: 'Finance action with command mode'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = classifyIntent(testCase.message);
  const actionMatch = result.action === testCase.expectedAction;
  const confidencePass = result.confidence >= testCase.minConfidence;
  const testPassed = actionMatch && confidencePass;

  if (testPassed) {
    passed++;
  } else {
    failed++;
  }

  const status = testPassed ? '\u2713 PASS' : '\u2717 FAIL';
  const statusColor = testPassed ? '' : '';

  console.log(`Test ${index + 1}: ${status}`);
  console.log(`  Message: "${testCase.message}"`);
  console.log(`  Description: ${testCase.description}`);
  console.log(`  Expected Action: ${testCase.expectedAction}`);
  console.log(`  Actual Action: ${result.action} ${actionMatch ? '\u2713' : '\u2717'}`);
  console.log(`  Expected Min Confidence: ${(testCase.minConfidence * 100).toFixed(1)}%`);
  console.log(`  Actual Confidence: ${(result.confidence * 100).toFixed(1)}% ${confidencePass ? '\u2713' : '\u2717'}`);

  if (result.matchedKeywords && result.matchedKeywords.length > 0) {
    console.log(`  Matched Keywords: ${result.matchedKeywords.join(', ')}`);
  }

  if (Object.keys(result.entities || {}).length > 0) {
    console.log(`  Entities: ${JSON.stringify(result.entities)}`);
  }

  console.log();
});

console.log('='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

// Detailed confidence analysis for key test cases
console.log();
console.log('='.repeat(60));
console.log('KEY TEST CASES DETAILED ANALYSIS');
console.log('='.repeat(60));
console.log();

const keyTests = [
  'order me pizza',
  'book me an uber'
];

keyTests.forEach(message => {
  const result = classifyIntent(message);
  console.log(`Message: "${message}"`);
  console.log(`  Action: ${result.action}`);
  console.log(`  Confidence: ${(result.confidence * 100).toFixed(2)}%`);
  console.log(`  Matched Keywords: ${result.matchedKeywords ? result.matchedKeywords.join(', ') : 'none'}`);
  console.log(`  Entities: ${JSON.stringify(result.entities || {})}`);
  console.log();
});

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
