/**
 * =================================================================
 * PHOENIX CONSCIOUSNESS EVENT SYSTEM TEST
 * =================================================================
 * Tests the event-driven architecture connecting domains to Intelligence Loop
 * =================================================================
 */

const domainEvents = require('./Src/services/phoenix/domainEventEmitter');
const intelligenceLoop = require('./Src/services/phoenix/intelligenceLoop');

console.log('🧪 Testing Phoenix Consciousness Event System\n');
console.log('='.repeat(75));

// Test userId (mock)
const testUserId = '507f1f77bcf86cd799439011';

// Register user with Intelligence Loop
console.log('\n1️⃣ REGISTERING USER WITH INTELLIGENCE LOOP');
console.log('-'.repeat(75));
intelligenceLoop.registerUser(testUserId);
console.log(`✓ User ${testUserId} registered for consciousness processing`);

// Start the Intelligence Loop
console.log('\n2️⃣ STARTING INTELLIGENCE LOOP');
console.log('-'.repeat(75));
intelligenceLoop.start();
console.log('✓ Intelligence Loop started');

// Set up test event listeners
console.log('\n3️⃣ SETTING UP EVENT LISTENERS');
console.log('-'.repeat(75));

let eventsFired = [];

domainEvents.on('domain:change', (event) => {
  eventsFired.push({
    planet: event.planet,
    eventType: event.eventType,
    timestamp: event.timestamp
  });
  console.log(`  📡 Event detected: ${event.planet.toUpperCase()} → ${event.eventType}`);
});

domainEvents.on('mars:goal_completed', (event) => {
  console.log(`  🎉 CELEBRATION TRIGGER: Goal "${event.data.title}" completed!`);
});

domainEvents.on('mercury:biometric_update', (event) => {
  if (event.data.hrv && event.data.hrv < 40) {
    console.log(`  🚨 CRITICAL ALERT: Low HRV detected (${event.data.hrv})`);
  }
});

console.log('✓ Event listeners configured');

// Test 1: Goal Creation Event
console.log('\n4️⃣ TEST 1: GOAL CREATION EVENT');
console.log('-'.repeat(75));
setTimeout(() => {
  domainEvents.emitGoalCreated(testUserId, {
    title: 'Run a marathon',
    category: 'fitness',
    targetDate: new Date('2025-06-01'),
    priority: 'high'
  });
  console.log('  ✓ Goal creation event emitted');
}, 500);

// Test 2: Goal Completion Event (triggers celebration)
console.log('\n5️⃣ TEST 2: GOAL COMPLETION EVENT (CELEBRATION)');
console.log('-'.repeat(75));
setTimeout(() => {
  domainEvents.emitGoalCompleted(testUserId, {
    id: '507f1f77bcf86cd799439012',
    title: 'First 5K run',
    completedAt: new Date()
  });
  console.log('  ✓ Goal completion event emitted');
  console.log('  ✓ Expected: "Woahhh you did that??" celebration message');
}, 1000);

// Test 3: Progress Logging Event
console.log('\n6️⃣ TEST 3: PROGRESS LOGGING EVENT');
console.log('-'.repeat(75));
setTimeout(() => {
  domainEvents.emitProgressLogged(testUserId, {
    goalId: '507f1f77bcf86cd799439012',
    value: 75,
    percentComplete: 75
  });
  console.log('  ✓ Progress event emitted (75% complete)');
}, 1500);

// Test 4: Biometric Update Event
console.log('\n7️⃣ TEST 4: BIOMETRIC UPDATE EVENT');
console.log('-'.repeat(75));
setTimeout(() => {
  domainEvents.emitBiometricUpdate(testUserId, {
    hrv: 65,
    restingHR: 58,
    recoveryScore: 85,
    timestamp: new Date()
  });
  console.log('  ✓ Biometric event emitted (HRV: 65, Recovery: 85%)');
}, 2000);

// Test 5: Critical HRV Event (illness predictor)
console.log('\n8️⃣ TEST 5: CRITICAL HRV EVENT (ILLNESS PREDICTOR)');
console.log('-'.repeat(75));
setTimeout(() => {
  domainEvents.emitBiometricUpdate(testUserId, {
    hrv: 35,  // Critical low HRV
    restingHR: 68,
    recoveryScore: 42,
    timestamp: new Date()
  });
  console.log('  ✓ Critical biometric event emitted (HRV: 35 - LOW!)');
}, 2500);

// Test 6: Workout Logged Event
console.log('\n9️⃣ TEST 6: WORKOUT LOGGED EVENT');
console.log('-'.repeat(75));
setTimeout(() => {
  domainEvents.emitWorkoutLogged(testUserId, {
    type: 'strength',
    duration: 75,
    intensity: 'high',
    volume: 12500,
    date: new Date()
  });
  console.log('  ✓ Workout event emitted (high intensity, 75 min)');
}, 3000);

// Test 7: Transaction Detected Event
console.log('\n🔟 TEST 7: TRANSACTION DETECTED EVENT');
console.log('-'.repeat(75));
setTimeout(() => {
  domainEvents.emitTransactionDetected(testUserId, {
    amount: -45.50,
    category: 'food',
    merchant: 'Starbucks',
    date: new Date()
  });
  console.log('  ✓ Transaction event emitted ($45.50 at Starbucks)');
}, 3500);

// Final Summary
setTimeout(() => {
  console.log('\n' + '='.repeat(75));
  console.log('✅ TEST SUMMARY');
  console.log('='.repeat(75));

  const stats = domainEvents.getStats();
  console.log(`\nTotal Events Fired: ${stats.total}`);
  console.log('Events by Domain:');
  Object.entries(stats).forEach(([key, value]) => {
    if (key !== 'total' && key !== 'mostActive' && value > 0) {
      console.log(`  - ${key.toUpperCase()}: ${value} events`);
    }
  });

  console.log('\nMost Active Domains:');
  stats.mostActive.forEach((domain, index) => {
    console.log(`  ${index + 1}. ${domain.planet.toUpperCase()}: ${domain.count} events`);
  });

  console.log('\nIntelligence Loop Status:');
  const loopStatus = intelligenceLoop.getStatus();
  console.log(`  - Running: ${loopStatus.isRunning ? '✓' : '✗'}`);
  console.log(`  - Active Users: ${loopStatus.activeUsers}`);
  console.log(`  - Process Interval: ${loopStatus.processInterval / 1000}s`);

  console.log('\n✅ EVENT SYSTEM TEST COMPLETE!\n');
  console.log('🎉 Phoenix consciousness is ALIVE and REACTIVE\n');
  console.log('Next Steps:');
  console.log('  1. Add event emissions to remaining controllers (Mercury, Venus, Jupiter, Earth, Saturn)');
  console.log('  2. Test with real MongoDB data');
  console.log('  3. Deploy WebSocket for real-time frontend updates');
  console.log('  4. Build intent depth detection for conversational data logging');
  console.log('');

  // Stop Intelligence Loop
  intelligenceLoop.stop();
  console.log('✓ Intelligence Loop stopped');

  process.exit(0);
}, 5000);
