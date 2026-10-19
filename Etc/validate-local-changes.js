/**
 * PRE-DEPLOYMENT VALIDATION SCRIPT
 * Checks all local changes before pushing to production
 */

console.log('🧪 VALIDATING LOCAL CHANGES...\n');

let errors = 0;
let warnings = 0;

// Test 1: Check new files exist
console.log('1️⃣  Checking new foundation files...');
const newFiles = [
  './Src/services/phoenix/personalBaselineEngine.js',
  './Src/services/phoenix/volatilityAnalyzer.js',
  './Src/services/phoenix/confidenceScorer.js',
  './Src/services/phoenix/patterns/index.js',
  './Src/services/phoenix/patterns/sleep.js',
  './Src/services/phoenix/patterns/lifestyle.js'
];

newFiles.forEach(file => {
  try {
    require(file);
    console.log(`   ✅ ${file}`);
  } catch (e) {
    console.log(`   ❌ Missing: ${file}`);
    errors++;
  }
});

// Test 2: Load pattern detection engine
console.log('\n2️⃣  Loading pattern detection engine...');
try {
  const engine = require('./Src/services/phoenix/patternDetectionEngine');
  console.log(`   ✅ Pattern engine loaded`);
} catch (e) {
  console.log(`   ❌ Pattern engine error: ${e.message}`);
  errors++;
}

// Test 3: Load 540 patterns
console.log('\n3️⃣  Loading 540-pattern library...');
try {
  const { patterns, stats } = require('./Src/services/phoenix/patterns/index');
  console.log(`   ✅ Loaded ${stats.total} patterns`);

  if (stats.total !== 540) {
    console.log(`   ⚠️  Expected 540 patterns, got ${stats.total}`);
    warnings++;
  }

  console.log(`   📊 Categories: ${Object.keys(stats.categories).length}`);
  console.log(`   🌍 Planets: Venus (${stats.planets.venus}), Mercury (${stats.planets.mercury}), Mars (${stats.planets.mars})`);
} catch (e) {
  console.log(`   ❌ Pattern library error: ${e.message}`);
  errors++;
}

// Test 4: Check operator extensions
console.log('\n4️⃣  Checking operator extensions...');
try {
  const operators = require('./Src/services/phoenix/operatorExtensions');
  const operatorCount = Object.keys(operators).length;
  console.log(`   ✅ Loaded ${operatorCount} operators`);

  // Check for baseline operators
  const hasDropsFromBaseline = operators.evaluateDropsFromBaselineCondition !== undefined;
  const hasIncreasesFromBaseline = operators.evaluateIncreasesFromBaselineCondition !== undefined;
  const hasSpikeFromBaseline = operators.evaluateSpikesFromBaselineCondition !== undefined;

  if (hasDropsFromBaseline && hasIncreasesFromBaseline && hasSpikeFromBaseline) {
    console.log(`   ✅ Baseline operators present (DROPS_FROM_BASELINE, INCREASES_FROM_BASELINE, SPIKES_FROM_BASELINE)`);
  } else {
    console.log(`   ❌ Missing baseline operators`);
    errors++;
  }
} catch (e) {
  console.log(`   ❌ Operator extensions error: ${e.message}`);
  errors++;
}

// Test 5: Check pattern definitions
console.log('\n5️⃣  Checking pattern definitions...');
try {
  const { LIFE_PATTERNS } = require('./Src/services/phoenix/patternDefinitions');
  const patternCount = Object.keys(LIFE_PATTERNS).length;
  console.log(`   ✅ Loaded ${patternCount} pattern definitions`);

  // Check for new patterns (P051-P055)
  const hasP051 = LIFE_PATTERNS.P051_SLEEP_DEBT_ACCUMULATION !== undefined;
  const hasP052 = LIFE_PATTERNS.P052_WEEKEND_RECOVERY_EFFECT !== undefined;
  const hasP053 = LIFE_PATTERNS.P053_HRV_VOLATILITY_STRESS !== undefined;
  const hasP054 = LIFE_PATTERNS.P054_ACTIVITY_SLEEP_SPIRAL !== undefined;
  const hasP055 = LIFE_PATTERNS.P055_RHR_ILLNESS_PREDICTOR !== undefined;

  const newPatternsCount = [hasP051, hasP052, hasP053, hasP054, hasP055].filter(Boolean).length;

  if (newPatternsCount === 5) {
    console.log(`   ✅ All 5 new patterns present (P051-P055)`);
  } else {
    console.log(`   ⚠️  Only ${newPatternsCount}/5 new patterns found`);
    warnings++;
  }
} catch (e) {
  console.log(`   ❌ Pattern definitions error: ${e.message}`);
  errors++;
}

// Test 6: Check baseline engine
console.log('\n6️⃣  Testing personal baseline engine...');
try {
  const baselineEngine = require('./Src/services/phoenix/personalBaselineEngine');

  // Test with mock data
  const mockBaseline = { hrv: { mean: 60, std: 10 } };
  const drop = baselineEngine.isSignificantDrop(51, mockBaseline.hrv, 15);
  const increase = baselineEngine.isSignificantIncrease(69, mockBaseline.hrv, 15);

  if (drop && increase) {
    console.log(`   ✅ Baseline calculations working`);
  } else {
    console.log(`   ❌ Baseline calculations failed`);
    errors++;
  }
} catch (e) {
  console.log(`   ❌ Baseline engine error: ${e.message}`);
  errors++;
}

// Test 7: Check volatility analyzer
console.log('\n7️⃣  Testing volatility analyzer...');
try {
  const volatilityAnalyzer = require('./Src/services/phoenix/volatilityAnalyzer');

  // Test with mock data
  const volatility = volatilityAnalyzer.calculateVolatility([50, 60, 55, 65, 58]);
  const isHigh = volatilityAnalyzer.isHighVolatility(volatility, 14);

  if (volatility !== undefined && typeof isHigh === 'boolean') {
    console.log(`   ✅ Volatility calculations working (${volatility.toFixed(1)}%)`);
  } else {
    console.log(`   ❌ Volatility calculations failed`);
    errors++;
  }
} catch (e) {
  console.log(`   ❌ Volatility analyzer error: ${e.message}`);
  errors++;
}

// Test 8: Check confidence scorer
console.log('\n8️⃣  Testing confidence scorer...');
try {
  const confidenceScorer = require('./Src/services/phoenix/confidenceScorer');

  // Test with mock data
  const mockMetrics = {
    hrv: 50,
    sleepScore: 60,
    restingHeartRate: 70,
    steps: 8000,
    sustainedDays: 5,
    hrvVolatility: 15
  };

  const mockPattern = { category: 'stress' };
  const mockBaseline = {
    hrv: { mean: 60, std: 10 },
    sleepScore: { mean: 75, std: 8 },
    restingHeartRate: { mean: 65, std: 3 },
    steps: { mean: 10000, std: 2000 }
  };

  const result = confidenceScorer.calculateConfidence(mockMetrics, mockPattern, mockBaseline);

  if (result && result.confidence !== undefined && result.shouldSurface !== undefined) {
    console.log(`   ✅ Confidence scoring working (${(result.confidence * 100).toFixed(0)}% confidence, ${result.metricsChanging} metrics)`);
  } else {
    console.log(`   ❌ Confidence scoring failed`);
    errors++;
  }
} catch (e) {
  console.log(`   ❌ Confidence scorer error: ${e.message}`);
  errors++;
}

// Final Report
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors === 0 && warnings === 0) {
  console.log('✅ ALL TESTS PASSED - READY FOR PRODUCTION DEPLOYMENT');
  console.log('\n🚀 Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "Week 1-2 Foundation Complete"');
  console.log('   3. git push origin main');
  console.log('   4. Monitor Railway deployment');
  process.exit(0);
} else if (errors === 0 && warnings > 0) {
  console.log(`⚠️  ${warnings} WARNING(S) - Review before deploying`);
  console.log('\nYou can proceed, but check the warnings above.');
  process.exit(0);
} else {
  console.log(`❌ ${errors} ERROR(S) - FIX BEFORE DEPLOYING`);
  console.log(`⚠️  ${warnings} WARNING(S)`);
  console.log('\nFix the errors above before pushing to production.');
  process.exit(1);
}
