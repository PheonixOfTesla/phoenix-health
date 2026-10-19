/**
 * BUTLER EXECUTION TEST - CONFIRMED TASKS
 * Actually run the Puppeteer automation
 */

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NDg5ZGY0NDZhNDA5M2NiNjRhZTg4ZCIsInJvbGVzIjpbImNsaWVudCJdLCJpYXQiOjE3NjY0MjkwNjcsImV4cCI6MTc2NzAzMzg2N30.gHubObPgWTgghkW-hFtzl_1GM3MVdxFKtDP9_vX3l2w';
const BACKEND = 'https://pal-backend-production.up.railway.app';

const TASKS = [
  'Search Google for pizza near me',
  'Go to amazon.com',
  'Go to doordash.com',
  'Search for restaurants on Yelp',
  'Go to uber.com'
];

async function executeTask(task, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`EXECUTE ${index + 1}: "${task}"`);
  console.log('='.repeat(60));

  const start = Date.now();

  try {
    const res = await fetch(`${BACKEND}/api/butler/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      },
      body: JSON.stringify({
        task,
        confirmed: true,  // EXECUTE IT!
        headless: true    // Run headless on server
      })
    });

    const data = await res.json();
    const elapsed = Date.now() - start;

    console.log(`Status: ${res.status}`);
    console.log(`Time: ${elapsed}ms`);
    console.log(`Success: ${data.success}`);
    console.log(`Session: ${data.sessionId}`);

    if (data.steps) console.log(`Steps completed: ${data.steps}`);
    if (data.finalScreenshot) console.log(`Screenshot: ${data.finalScreenshot.substring(0, 50)}...`);
    if (data.message) console.log(`Message: ${data.message}`);
    if (data.error) console.log(`Error: ${data.error}`);

    return { task, success: data.success, elapsed, data };
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    return { task, success: false, error: err.message };
  }
}

async function streamSession(sessionId) {
  console.log(`\nStreaming session: ${sessionId}`);

  try {
    const res = await fetch(`${BACKEND}/api/butler/stream/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    console.log(`Stream status: ${res.status}`);
    const text = await res.text();
    console.log(`Stream response: ${text.substring(0, 200)}`);
  } catch (err) {
    console.log(`Stream error: ${err.message}`);
  }
}

async function run() {
  console.log('🤖 BUTLER EXECUTION TEST - CONFIRMED TASKS');
  console.log('==========================================\n');

  const results = [];

  for (let i = 0; i < TASKS.length; i++) {
    const result = await executeTask(TASKS[i], i);
    results.push(result);

    // If we got a sessionId, try to stream it
    if (result.data?.sessionId) {
      await streamSession(result.data.sessionId);
    }

    // Wait between tasks
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('EXECUTION SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  console.log(`✅ Successful: ${successful}/${TASKS.length}`);
  console.log(`❌ Failed: ${TASKS.length - successful}/${TASKS.length}`);

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.task} (${r.elapsed || 0}ms)`);
  });
}

run();
