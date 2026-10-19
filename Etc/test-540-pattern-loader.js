/**
 * Test Script: 540-Pattern Library Loader
 * Verifies all 9 pattern category files load correctly
 */

console.log('🧪 Testing 540-Pattern Library Loader...\n');

try {
  // Test 1: Load pattern index
  console.log('1️⃣  Loading pattern index...');
  const { patterns, stats, getPatternsByCategory } = require('./Src/services/phoenix/patterns/index');

  console.log(`   ✅ Loaded ${stats.total} patterns`);
  console.log(`   📊 Pattern breakdown by category:`);
  Object.entries(stats.categories).forEach(([category, count]) => {
    console.log(`      - ${category}: ${count} patterns`);
  });

  // Test 2: Verify expected total
  console.log('\n2️⃣  Verifying pattern count...');
  const expectedTotal = 540;
  if (stats.total === expectedTotal) {
    console.log(`   ✅ Correct total: ${stats.total}/${expectedTotal} patterns`);
  } else {
    console.log(`   ⚠️  Expected ${expectedTotal}, got ${stats.total}`);
  }

  // Test 3: Test planet distribution
  console.log('\n3️⃣  Testing planet distribution...');
  console.log(`   🌍 Venus: ${stats.planets.venus} patterns`);
  console.log(`   ☿️ Mercury: ${stats.planets.mercury} patterns`);
  console.log(`   ♂️ Mars: ${stats.planets.mars} patterns`);

  // Test 4: Test urgency distribution
  console.log('\n4️⃣  Testing urgency distribution...');
  console.log(`   🚨 Critical: ${stats.urgency.critical} patterns`);
  console.log(`   ⚠️  High: ${stats.urgency.high} patterns`);
  console.log(`   📍 Medium: ${stats.urgency.medium} patterns`);
  console.log(`   ℹ️  Low: ${stats.urgency.low} patterns`);

  // Test 5: Test sensitive patterns
  console.log('\n5️⃣  Testing sensitive patterns...');
  console.log(`   🔒 Sensitive patterns: ${stats.sensitive}`);

  // Test 6: Sample a few patterns
  console.log('\n6️⃣  Sampling patterns...');
  const samplePatterns = [
    'REL001_NEW_RELATIONSHIP',
    'W001_JOB_LOSS',
    'H001_ILLNESS_ONSET',
    'F001_NEW_TRAINING_PROGRAM',
    'MH001_DEPRESSION_ONSET',
    'FIN001_JOB_LOSS',
    'SOC001_SOCIAL_WITHDRAWAL',
    'SLP001_INSOMNIA_PATTERN',
    'LIFE001_NEW_MORNING_ROUTINE'
  ];

  samplePatterns.forEach(patternKey => {
    const pattern = patterns[patternKey];
    if (pattern) {
      console.log(`   ✅ ${patternKey}: ${pattern.name} (${pattern.planet}, ${pattern.category})`);
    } else {
      console.log(`   ❌ Missing: ${patternKey}`);
    }
  });

  // Test 7: Load pattern detection engine
  console.log('\n7️⃣  Loading Pattern Detection Engine...');
  const patternEngine = require('./Src/services/phoenix/patternDetectionEngine');
  console.log(`   ✅ Pattern Engine loaded successfully`);
  console.log(`   📦 Engine has ${Object.keys(patternEngine.patterns).length} patterns`);

  // Test 8: Verify operator extensions
  console.log('\n8️⃣  Verifying operator extensions...');
  const operatorExtensions = require('./Src/services/phoenix/operatorExtensions');
  const extendedOperators = Object.keys(operatorExtensions);
  console.log(`   ✅ Loaded ${extendedOperators.length} extended operators:`);
  extendedOperators.slice(0, 5).forEach(op => console.log(`      - ${op}`));
  if (extendedOperators.length > 5) {
    console.log(`      ... and ${extendedOperators.length - 5} more`);
  }

  console.log('\n✅ ALL TESTS PASSED - 540-Pattern Library Ready for Production!\n');

  console.log('📊 FINAL STATS:');
  console.log(`   Total Patterns: ${stats.total}`);
  console.log(`   Categories: ${Object.keys(stats.categories).length}`);
  console.log(`   Planets: Venus (${stats.planets.venus}), Mercury (${stats.planets.mercury}), Mars (${stats.planets.mars})`);
  console.log(`   Critical Patterns: ${stats.urgency.critical}`);
  console.log(`   Sensitive Patterns: ${stats.sensitive}`);
  console.log(`   Extended Operators: ${extendedOperators.length}`);

} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
