/**
 * BUTLER AUTOMATION TEST - 20 REQUESTS
 * Don't stop until it works!
 */

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDg5ZGY0NDZhNDA5M2NiNjRhZTg4ZCIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY0MjkwNjcsImV4cCI6MTc2NzAzMzg2N30.gHubObPgWTgghkW-hFtzl_1GM3MVdxFKtDP9_vX3l2w';
const BACKEND = 'https://pal-backend-production.up.railway.app';

const TASKS = [
  // Food ordering
  'Order me a pizza from DoorDash',
  'Get me sushi from Uber Eats',
  'Order coffee from Starbucks',

  // Rides
  'Get me an Uber to LAX airport',
  'Book a Lyft to downtown',

  // Reservations
  'Book a table at Nobu for 2 at 7pm',
  'Make a reservation at OpenTable for tonight',

  // Shopping
  'Buy me AirPods from Amazon',
  'Order groceries from Instacart',

  // Productivity
  'Check my email',
  'Send an email to john@test.com saying hello',
  'Schedule a meeting for tomorrow at 2pm',
  'Add milk to my shopping list',

  // Search/Research
  'Search Google for best restaurants near me',
  'Find flights to Miami',
  'Look up movie times',

  // Social
  'Post on Twitter: Having a great day!',
  'Check my Instagram notifications',

  // Finance
  'Check my bank balance',
  'Pay my electric bill'
];

async function testButler(task, index) {
  const start = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${index + 1}/20: "${task}"`);
  console.log('='.repeat(60));

  try {
    // Test 1: Universal Butler endpoint
    const res = await fetch(`${BACKEND}/api/butler/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({ task, confirmed: false })
    });

    const data = await res.json();
    const elapsed = Date.now() - start;

    console.log(`Status: ${res.status}`);
    console.log(`Time: ${elapsed}ms`);
    console.log(`Response:`, JSON.stringify(data, null, 2).substring(0, 500));

    return {
      task,
      status: res.status,
      success: data.success || data.needsConfirmation,
      elapsed,
      response: data
    };
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    return {
      task,
      status: 'error',
      success: false,
      error: err.message
    };
  }
}

async function runAllTests() {
  console.log('🤖 BUTLER AUTOMATION TEST - 20 REQUESTS');
  console.log('========================================\n');

  const results = [];

  for (let i = 0; i < TASKS.length; i++) {
    const result = await testButler(TASKS[i], i);
    results.push(result);

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/20`);
  console.log(`❌ Failed: ${failed}/20`);
  console.log(`📊 Success Rate: ${(successful/20*100).toFixed(1)}%`);

  console.log('\nFailed tasks:');
  results.filter(r => !r.success).forEach(r => {
    console.log(`  - ${r.task}: ${r.error || r.status}`);
  });

  console.log('\nSuccessful tasks:');
  results.filter(r => r.success).forEach(r => {
    console.log(`  - ${r.task} (${r.elapsed}ms)`);
  });
}

runAllTests();
