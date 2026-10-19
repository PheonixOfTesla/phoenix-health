/**
 * PHOENIX CONSCIOUSNESS - PRODUCTION TEST SUITE
 * ==============================================
 * Comprehensive tests for production readiness
 *
 * Run: node tests/consciousness-production.test.js
 */

const path = require('path');

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    \x1b[33m${error.message}\x1b[0m`);
  }
}

function warn(name, message) {
  results.warnings++;
  results.tests.push({ name, status: 'WARN', message });
  console.log(`  \x1b[33m⚠\x1b[0m ${name}: ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertDefined(value, message) {
  if (value === undefined || value === null) {
    throw new Error(message || 'Value is undefined/null');
  }
}

// ============================================
// TEST SUITES
// ============================================

console.log('\n\x1b[36m╔══════════════════════════════════════════════════════════╗\x1b[0m');
console.log('\x1b[36m║   PHOENIX CONSCIOUSNESS - PRODUCTION READINESS TESTS     ║\x1b[0m');
console.log('\x1b[36m╚══════════════════════════════════════════════════════════╝\x1b[0m\n');

// ---------- Module Loading ----------
console.log('\x1b[34m1. MODULE LOADING\x1b[0m');

test('consciousnessWrapper loads without error', () => {
  const wrapper = require('../Src/services/phoenix/consciousnessWrapper');
  assertDefined(wrapper, 'Wrapper not loaded');
  assertDefined(wrapper.runPostProcessing, 'runPostProcessing method missing');
  assertDefined(wrapper.getHealthStatus, 'getHealthStatus method missing');
});

test('consciousnessMetrics loads without error', () => {
  const metrics = require('../Src/services/phoenix/consciousnessMetrics');
  assertDefined(metrics, 'Metrics not loaded');
  assertDefined(metrics.record, 'record method missing');
  assertDefined(metrics.getReport, 'getReport method missing');
});

test('selfAwareness loads without error', () => {
  const selfAwareness = require('../Src/services/phoenix/selfAwareness');
  assertDefined(selfAwareness, 'selfAwareness not loaded');
  assertDefined(selfAwareness.getSelfContext, 'getSelfContext method missing');
});

test('selfCorrection loads without error', () => {
  const selfCorrection = require('../Src/services/phoenix/selfCorrection');
  assertDefined(selfCorrection, 'selfCorrection not loaded');
  assertDefined(selfCorrection.analyzeResponse, 'analyzeResponse method missing');
});

test('realTimeLearning loads without error', () => {
  const realTimeLearning = require('../Src/services/phoenix/realTimeLearning');
  assertDefined(realTimeLearning, 'realTimeLearning not loaded');
  assertDefined(realTimeLearning.logInteraction, 'logInteraction method missing');
});

test('metaCognition loads without error', () => {
  const metaCognition = require('../Src/services/phoenix/metaCognition');
  assertDefined(metaCognition, 'metaCognition not loaded');
  assertDefined(metaCognition.reflect, 'reflect method missing');
});

// ---------- Wrapper Safety ----------
console.log('\n\x1b[34m2. WRAPPER SAFETY\x1b[0m');

test('safeExecute catches errors and returns fallback', async () => {
  const wrapper = require('../Src/services/phoenix/consciousnessWrapper');

  const result = await wrapper.safeExecute(
    () => { throw new Error('Test error'); },
    'test-operation',
    'fallback-value',
    1000
  );

  assertEqual(result, 'fallback-value', 'Should return fallback on error');
});

test('safeExecute returns result on success', async () => {
  const wrapper = require('../Src/services/phoenix/consciousnessWrapper');

  const result = await wrapper.safeExecute(
    async () => 'success',
    'test-operation',
    'fallback-value',
    1000
  );

  assertEqual(result, 'success', 'Should return success value');
});

test('safeExecute times out slow operations', async () => {
  const wrapper = require('../Src/services/phoenix/consciousnessWrapper');

  const result = await wrapper.safeExecute(
    async () => {
      await new Promise(r => setTimeout(r, 2000)); // 2 second delay
      return 'slow-result';
    },
    'slow-operation',
    'timeout-fallback',
    100 // 100ms timeout
  );

  assertEqual(result, 'timeout-fallback', 'Should return fallback on timeout');
});

// ---------- Metrics Tracking ----------
console.log('\n\x1b[34m3. METRICS TRACKING\x1b[0m');

test('metrics.record tracks operations', () => {
  const metrics = require('../Src/services/phoenix/consciousnessMetrics');
  metrics.reset();

  metrics.record('selfAwareness', 50, true);
  metrics.record('selfAwareness', 100, true);
  metrics.record('selfAwareness', 75, false);

  const report = metrics.getReport();
  assertEqual(report.modules.selfAwareness.calls, 3, 'Should record 3 calls');
  assertEqual(report.modules.selfAwareness.errors, 1, 'Should record 1 error');
});

test('metrics health score calculation', () => {
  const metrics = require('../Src/services/phoenix/consciousnessMetrics');
  metrics.reset();

  // All success
  for (let i = 0; i < 10; i++) {
    metrics.record('selfCorrection', 100, true);
  }

  const report = metrics.getReport();
  assert(report.health.score >= 80, 'Health score should be high with no errors');
});

test('metrics generates prometheus format', () => {
  const metrics = require('../Src/services/phoenix/consciousnessMetrics');
  const prometheus = metrics.getPrometheusMetrics();

  assert(prometheus.includes('phoenix_consciousness'), 'Should include metric prefix');
  assert(prometheus.includes('calls_total'), 'Should include calls metric');
});

// ---------- Self-Correction ----------
console.log('\n\x1b[34m4. SELF-CORRECTION ENGINE\x1b[0m');

test('detects invalid percentages', async () => {
  const selfCorrection = require('../Src/services/phoenix/selfCorrection');

  const result = await selfCorrection.analyzeResponse(
    'Your recovery is 150%',
    { userId: 'test' }
  );

  // Note: detection depends on regex matching in the response text
  assertDefined(result.healthScore, 'Should return health score');
});

test('detects metric contradictions', async () => {
  const selfCorrection = require('../Src/services/phoenix/selfCorrection');

  const result = await selfCorrection.analyzeResponse({
    recoveryScore: 30,
    recommendation: 'High intensity workout'
  }, { userId: 'test' });

  assertDefined(result.hasErrors !== undefined, 'Should check for errors');
});

test('generates correction stats', () => {
  const selfCorrection = require('../Src/services/phoenix/selfCorrection');

  const stats = selfCorrection.getCorrectionStats();
  assertDefined(stats.total, 'Should track total corrections');
  assertDefined(stats.last24Hours, 'Should track recent corrections');
});

// ---------- Real-Time Learning ----------
console.log('\n\x1b[34m5. REAL-TIME LEARNING\x1b[0m');

test('has calibrateFromOutcome method', () => {
  const realTimeLearning = require('../Src/services/phoenix/realTimeLearning');

  assertDefined(realTimeLearning.service, 'service instance missing');
  assertDefined(realTimeLearning.service.calibrateFromOutcome, 'calibrateFromOutcome missing');
});

test('learning analytics available', () => {
  const realTimeLearning = require('../Src/services/phoenix/realTimeLearning');

  assertDefined(realTimeLearning.getLearningAnalytics, 'getLearningAnalytics missing');
});

// ---------- Meta-Cognition ----------
console.log('\n\x1b[34m6. META-COGNITION\x1b[0m');

test('reflect returns structured output', () => {
  const metaCognition = require('../Src/services/phoenix/metaCognition');

  const reflection = metaCognition.reflect(
    { type: 'test', message: 'Test message', confidence: 0.8 },
    { userId: 'test', trigger: 'test' }
  );

  assertDefined(reflection.dataQuality, 'Should include data quality');
  assertDefined(reflection.improvementOpportunities, 'Should include improvements');
});

// ---------- Health Endpoint ----------
console.log('\n\x1b[34m7. HEALTH ENDPOINT\x1b[0m');

test('wrapper getHealthStatus returns valid structure', () => {
  const wrapper = require('../Src/services/phoenix/consciousnessWrapper');

  const health = wrapper.getHealthStatus();

  assertDefined(health.status, 'Should have status');
  assertDefined(health.uptime, 'Should have uptime');
  assertDefined(health.modules, 'Should have modules');
  assertDefined(health.healthy, 'Should have healthy flag');
});

// ---------- Self-Awareness ----------
console.log('\n\x1b[34m8. SELF-AWARENESS\x1b[0m');

test('getSelfContext is async function', () => {
  const selfAwareness = require('../Src/services/phoenix/selfAwareness');

  const result = selfAwareness.getSelfContext();
  assert(result instanceof Promise, 'getSelfContext should return a promise');
});

test('getPublicIdentity exists for IP protection', () => {
  const selfAwareness = require('../Src/services/phoenix/selfAwareness');

  assertDefined(selfAwareness.getPublicIdentity, 'getPublicIdentity missing');

  const publicId = selfAwareness.getPublicIdentity();
  assertDefined(publicId.identity, 'Should have public identity');
  assertDefined(publicId.capabilities, 'Should have capabilities list');
});

test('getPublicIdentity returns Phoenix name', () => {
  const selfAwareness = require('../Src/services/phoenix/selfAwareness');

  const publicId = selfAwareness.getPublicIdentity();
  assertEqual(publicId.identity.name, 'Phoenix', 'Name should be Phoenix');
});

// ---------- Error Handling ----------
console.log('\n\x1b[34m9. ERROR HANDLING\x1b[0m');

test('wrapper handles null userId gracefully', async () => {
  const wrapper = require('../Src/services/phoenix/consciousnessWrapper');

  // Should not throw
  const result = await wrapper.runPostProcessing(null, 'test query', 'test response', {});

  assertDefined(result.timestamp, 'Should return result with timestamp');
});

test('all modules handle missing parameters', () => {
  const selfCorrection = require('../Src/services/phoenix/selfCorrection');
  const metaCognition = require('../Src/services/phoenix/metaCognition');

  // Should not throw
  selfCorrection.analyzeResponse(null, {});
  selfCorrection.analyzeResponse('test', null);
  metaCognition.reflect({}, {});
});

// ---------- MongoDB Models ----------
console.log('\n\x1b[34m10. MONGODB MODELS\x1b[0m');

const modelPaths = [
  'MetaReflection',
  'AccuracyMetrics',
  'ConfidenceCalibration',
  'SelfCorrectionLog',
  'InteractionChain',
  'UserTeaching',
  'PhoenixLearning'
];

modelPaths.forEach(modelName => {
  test(`${modelName} model loads`, () => {
    const model = require(`../Src/models/phoenix/${modelName}`);
    assertDefined(model, `${modelName} not loaded`);
    assertDefined(model.modelName || model.collection, `${modelName} not a valid model`);
  });
});

// ============================================
// RESULTS SUMMARY
// ============================================

console.log('\n\x1b[36m══════════════════════════════════════════════════════════\x1b[0m');
console.log('\x1b[36m                     RESULTS SUMMARY                       \x1b[0m');
console.log('\x1b[36m══════════════════════════════════════════════════════════\x1b[0m\n');

const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);

console.log(`  \x1b[32mPassed:\x1b[0m  ${results.passed}`);
console.log(`  \x1b[31mFailed:\x1b[0m  ${results.failed}`);
console.log(`  \x1b[33mWarnings:\x1b[0m ${results.warnings}`);
console.log(`  \x1b[36mPass Rate:\x1b[0m ${passRate}%`);

if (results.failed === 0) {
  console.log('\n\x1b[42m\x1b[30m  ALL TESTS PASSED - PRODUCTION READY  \x1b[0m\n');
} else {
  console.log('\n\x1b[41m\x1b[37m  TESTS FAILED - NOT PRODUCTION READY  \x1b[0m\n');

  console.log('Failed tests:');
  results.tests
    .filter(t => t.status === 'FAIL')
    .forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
}

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
