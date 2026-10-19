/**
 * Intent Router Demo - Show before/after confidence improvements
 */

const { classifyIntent } = require('./intentRouter.js');

console.log('\n' + '='.repeat(70));
console.log('INTENT ROUTER CONFIDENCE IMPROVEMENTS DEMO');
console.log('='.repeat(70));
console.log();

// Calculate what the old scoring would have been
function calculateOldScore(message) {
  const normalizedMessage = message.toLowerCase().trim();
  const words = normalizedMessage.split(/\s+/);

  let score = 0;

  // Old scoring logic
  if (message.includes('order') && message.includes('pizza')) {
    score = 2 + 2; // Two exact matches
    if (words[0] === 'order') {
      score += 1.5; // Old action verb boost
    }
  } else if (message.includes('book') && message.includes('uber')) {
    score = 2; // One exact match for 'uber'
    if (words[0] === 'book') {
      score += 1.5; // Old action verb boost
    }
  }

  // Old confidence calculation (no command mode multiplier)
  return Math.min(score / 10, 1.0);
}

const demos = [
  {
    message: 'order me pizza',
    oldConfidence: 0.55, // What it was before (4 + 1.5 = 5.5 / 10 = 55%)
    description: 'Food ordering command'
  },
  {
    message: 'book me an uber',
    oldConfidence: 0.35, // What it was before (2 + 1.5 = 3.5 / 10 = 35%)
    description: 'Ride booking command'
  }
];

demos.forEach((demo, index) => {
  const result = classifyIntent(demo.message);
  const improvement = ((result.confidence - demo.oldConfidence) / demo.oldConfidence * 100);

  console.log(`Example ${index + 1}: "${demo.message}"`);
  console.log(`  ${demo.description}`);
  console.log(`  Old Confidence: ${(demo.oldConfidence * 100).toFixed(1)}%`);
  console.log(`  New Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`  Improvement: +${improvement.toFixed(1)}%`);
  console.log(`  Action: ${result.action}`);
  console.log(`  Status: ${result.confidence >= 0.60 ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log();
});

console.log('='.repeat(70));
console.log('IMPROVEMENTS APPLIED:');
console.log('='.repeat(70));
console.log('1. Action verb boost increased from 1.5 to 3.0');
console.log('2. Command mode detection added (starts with action verb)');
console.log('3. Command mode multiplier of 1.5x applied to total score');
console.log('='.repeat(70));
console.log();

// Show scoring breakdown
console.log('='.repeat(70));
console.log('SCORING BREAKDOWN: "order me pizza"');
console.log('='.repeat(70));
console.log();
console.log('Keywords matched: "order" (2 points) + "pizza" (2 points) = 4 points');
console.log('Action verb boost: +3.0 points (starts with "order")');
console.log('Subtotal: 7.0 points');
console.log('Command mode multiplier: 7.0 × 1.5 = 10.5 points');
console.log('Confidence: min(10.5 / 10, 1.0) = 100%');
console.log();

console.log('='.repeat(70));
console.log('SCORING BREAKDOWN: "book me an uber"');
console.log('='.repeat(70));
console.log();
console.log('Keywords matched: "uber" (2 points) = 2 points');
console.log('Action verb boost: +3.0 points (starts with "book")');
console.log('Subtotal: 5.0 points');
console.log('Command mode multiplier: 5.0 × 1.5 = 7.5 points');
console.log('Confidence: min(7.5 / 10, 1.0) = 75%');
console.log();
