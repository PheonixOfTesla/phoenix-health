// Quick test of intent router
const intentRouter = require('./Src/services/consciousness/intentRouter');

const testMessages = [
  'order me pizza',
  'order pizza from Dominos',
  'I want to order food',
  'book me an uber',
  'hello',
  'how are you'
];

console.log('Intent Router Test:\n');

testMessages.forEach(msg => {
  const result = intentRouter.classifyIntent(msg);
  console.log(`"${msg}"`);
  console.log(`  → Action: ${result.action}`);
  console.log(`  → Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`  → Entities:`, JSON.stringify(result.entities));
  console.log(`  → Routes to Butler: ${result.action !== 'ai_response' && result.confidence > 0.4 ? 'YES' : 'NO'}`);
  console.log('');
});
