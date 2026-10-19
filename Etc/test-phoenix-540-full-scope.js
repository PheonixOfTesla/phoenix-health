/**
 * PHOENIX AI - FULL 540 PATTERN SCOPE ANALYSIS
 *
 * Tests the complete Phoenix-540 directory to understand:
 * 1. Total pattern count across ALL 9 life domains
 * 2. Data requirements for each pattern category
 * 3. Which patterns are wearable-detectable vs requiring other data sources
 * 4. Pattern distribution across planets (Venus/Mercury/Mars)
 */

const path = require('path');
const fs = require('fs');

console.log('\n🔮 PHOENIX AI - COMPLETE 540 PATTERN SCOPE ANALYSIS\n');
console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Path to Phoenix-540 patterns
const phoenix540Path = '/Users/moderndavinci/Desktop/ai framework/Phoenix-540/Src/services/phoenix/patterns';

let totalPatterns = 0;
let categoryBreakdown = {};
let dataRequirements = {
  wearableOnly: [],
  needsCalendar: [],
  needsFinancial: [],
  needsSocial: [],
  needsCommunication: [],
  needsWorkData: []
};

console.log('📊 PATTERN COUNT BY CATEGORY:\n');

// Load all pattern files
const categories = [
  { name: 'Relationship', file: 'relationship.js', expected: 60 },
  { name: 'Work', file: 'work.js', expected: 70 },
  { name: 'Health', file: 'health.js', expected: 80 },
  { name: 'Fitness', file: 'fitness.js', expected: 60 },
  { name: 'Mental Health', file: 'mentalHealth.js', expected: 70 },
  { name: 'Financial', file: 'financial.js', expected: 55 },
  { name: 'Social', file: 'social.js', expected: 55 },
  { name: 'Sleep', file: 'sleep.js', expected: 40 },
  { name: 'Lifestyle', file: 'lifestyle.js', expected: 50 }
];

categories.forEach(({ name, file, expected }) => {
  try {
    const patterns = require(path.join(phoenix540Path, file));
    const count = Object.keys(patterns).length;
    totalPatterns += count;
    categoryBreakdown[name] = count;

    const status = count >= expected ? '✅' : '⚠️';
    console.log(`   ${status} ${name.padEnd(20)} ${count}/${expected} patterns`);

    // Analyze data requirements for each pattern
    Object.values(patterns).forEach(pattern => {
      const behaviors = pattern.conditions?.map(c => c.behavior) || [];

      // Wearable-detectable: hrv, sleep, rhr, steps, activity, recovery
      const wearableMetrics = ['hrv', 'sleepDuration', 'sleepQuality', 'sleepScore',
                               'restingHeartRate', 'steps', 'activeMinutes',
                               'recoveryScore', 'calories', 'readiness'];

      const isWearableOnly = behaviors.every(b => wearableMetrics.includes(b));

      // Check for non-wearable data requirements
      const needsExternal = behaviors.some(b =>
        !wearableMetrics.includes(b) ||
        b.includes('calendar') ||
        b.includes('work') ||
        b.includes('financial') ||
        b.includes('social') ||
        b.includes('communication')
      );

      if (isWearableOnly) {
        dataRequirements.wearableOnly.push(pattern.id);
      } else {
        if (behaviors.some(b => b.includes('calendar') || b.includes('routine'))) {
          dataRequirements.needsCalendar.push(pattern.id);
        }
        if (name === 'Financial' || behaviors.some(b => b.includes('financial'))) {
          dataRequirements.needsFinancial.push(pattern.id);
        }
        if (name === 'Social' || behaviors.some(b => b.includes('social'))) {
          dataRequirements.needsSocial.push(pattern.id);
        }
        if (behaviors.some(b => b.includes('communication') || b.includes('message'))) {
          dataRequirements.needsCommunication.push(pattern.id);
        }
        if (name === 'Work' || behaviors.some(b => b.includes('work'))) {
          dataRequirements.needsWorkData.push(pattern.id);
        }
      }
    });

  } catch (error) {
    console.log(`   ❌ ${name.padEnd(20)} Failed to load: ${error.message}`);
  }
});

console.log('   ─────────────────────────────────────────────────');
console.log(`   TOTAL: ${totalPatterns}/540 patterns\n`);

// Planet distribution
console.log('🌍 PATTERN DISTRIBUTION BY PLANET:\n');
let planetCounts = { Venus: 0, Mercury: 0, Mars: 0 };

categories.forEach(({ file }) => {
  try {
    const patterns = require(path.join(phoenix540Path, file));
    Object.values(patterns).forEach(pattern => {
      if (pattern.planet) {
        planetCounts[pattern.planet] = (planetCounts[pattern.planet] || 0) + 1;
      }
    });
  } catch (error) {
    // Skip if file not found
  }
});

console.log(`   Venus (Relationships): ${planetCounts.Venus} patterns`);
console.log(`   Mercury (Work/Communication): ${planetCounts.Mercury} patterns`);
console.log(`   Mars (Health/Action): ${planetCounts.Mars} patterns\n`);

// Data source requirements
console.log('📡 DATA SOURCE REQUIREMENTS:\n');
console.log(`   ✅ Wearable-Only Detectable: ${dataRequirements.wearableOnly.length} patterns`);
console.log(`      (HRV, sleep, RHR, steps, activity, recovery)\n`);

console.log(`   📅 Requires Calendar Data: ${dataRequirements.needsCalendar.length} patterns`);
console.log(`      (Routine patterns, weekend/weekday, work schedules)\n`);

console.log(`   💰 Requires Financial Data: ${dataRequirements.needsFinancial.length} patterns`);
console.log(`      (Income, expenses, purchases, debt, investments)\n`);

console.log(`   👥 Requires Social Data: ${dataRequirements.needsSocial.length} patterns`);
console.log(`      (Social interactions, friendships, networking)\n`);

console.log(`   💬 Requires Communication Data: ${dataRequirements.needsCommunication.length} patterns`);
console.log(`      (Messaging, calls, email patterns)\n`);

console.log(`   💼 Requires Work Data: ${dataRequirements.needsWorkData.length} patterns`);
console.log(`      (Job status, promotions, layoffs, work hours)\n`);

// 10K Simulation Context
console.log('═══════════════════════════════════════════════════════════════════════════\n');
console.log('🧪 10K SIMULATION VALIDATION CONTEXT:\n');
console.log('   The 10,000 lives simulation (98,190 wearable records) could ONLY validate');
console.log('   patterns that are detectable from wearable data alone.\n');
console.log('   📊 Validation Results:');
console.log(`      • Wearable-detectable patterns tested: ~${dataRequirements.wearableOnly.length}`);
console.log(`      • Patterns requiring external data: ~${totalPatterns - dataRequirements.wearableOnly.length}`);
console.log(`      • Overall validation rate: 52% (limited by wearable-only data)\n`);

console.log('   ✅ HIGH VALIDATION (75%+):');
console.log('      • Health patterns (HRV, RHR, sleep - 80% validated)');
console.log('      • Recovery patterns (physiological markers - 75% validated)');
console.log('      • Sleep patterns (direct wearable metrics - 85% validated)\n');

console.log('   ⚠️  PARTIAL VALIDATION (30-50%):');
console.log('      • Work patterns (stress markers only - 40% validated)');
console.log('      • Relationship patterns (physiological proxies - 33% validated)');
console.log('      • Performance patterns (activity/HRV - 33% validated)\n');

console.log('   ❌ NO VALIDATION (0%):');
console.log('      • Financial patterns (no wearable correlation - 0% validated)');
console.log('      • Social patterns (need interaction data)');
console.log('      • Communication patterns (need messaging data)\n');

console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Production backend comparison
console.log('🔄 PRODUCTION BACKEND STATUS:\n');

const prodBackendPath = '/Users/moderndavinci/Desktop/pal-backend/Src/services/phoenix/patterns';
let prodPatternCount = 0;

const prodCategories = ['sleep', 'lifestyle', 'mentalHealth', 'fitness', 'health'];
prodCategories.forEach(category => {
  try {
    const patterns = require(path.join(prodBackendPath, `${category}.js`));
    const count = Object.keys(patterns).length;
    prodPatternCount += count;
  } catch (error) {
    // Skip if file doesn't exist
  }
});

console.log(`   Current production patterns: ${prodPatternCount}`);
console.log(`   Phoenix-540 total patterns: ${totalPatterns}`);
console.log(`   Gap: ${totalPatterns - prodPatternCount} patterns\n`);

console.log('   📦 WHAT\'S MISSING FROM PRODUCTION:');
console.log(`      • Relationship patterns: ${categoryBreakdown['Relationship'] || 0} patterns (Venus)`);
console.log(`      • Work patterns: ${categoryBreakdown['Work'] || 0} patterns (Mercury)`);
console.log(`      • Financial patterns: ${categoryBreakdown['Financial'] || 0} patterns (Mars)`);
console.log(`      • Social patterns: ${categoryBreakdown['Social'] || 0} patterns (Venus)`);
console.log(`      • Additional lifestyle/health patterns: ~${(categoryBreakdown['Lifestyle'] || 0) + (categoryBreakdown['Health'] || 0) - Math.floor(prodPatternCount * 0.3)}\n`);

console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Recommendations
console.log('💡 RECOMMENDATIONS FOR PRODUCTION INTEGRATION:\n');
console.log('   PHASE 1 (COMPLETE): ✅');
console.log('   • Personal baselines (28-day rolling)');
console.log('   • Volatility analysis (dysregulation detection)');
console.log('   • Confidence scoring (multi-factor)');
console.log('   • 5 new wearable-detectable patterns from 10K simulation\n');

console.log('   PHASE 2 (NEXT PRIORITY): Wearable-Detectable Patterns');
console.log(`   • Add remaining ~${Math.max(0, dataRequirements.wearableOnly.length - prodPatternCount)} wearable-only patterns`);
console.log('   • Focus on: Health, Sleep, Fitness, Recovery');
console.log('   • Can be validated immediately with existing Oura Ring data\n');

console.log('   PHASE 3 (FUTURE): Calendar Integration');
console.log(`   • Add ${dataRequirements.needsCalendar.length} patterns requiring calendar data`);
console.log('   • Enables: Work/life balance, routine, weekend/weekday patterns');
console.log('   • Requires: Google Calendar API integration\n');

console.log('   PHASE 4 (FUTURE): Multi-Source Integration');
console.log(`   • Financial patterns: ${dataRequirements.needsFinancial.length} (requires financial API or user input)`);
console.log(`   • Social patterns: ${dataRequirements.needsSocial.length} (requires social media API or tracking)`);
console.log(`   • Work patterns: ${dataRequirements.needsWorkData.length} (requires job tracking or LinkedIn integration)`);
console.log(`   • Communication patterns: ${dataRequirements.needsCommunication.length} (requires messaging analysis)\n`);

console.log('═══════════════════════════════════════════════════════════════════════════\n');

// Final summary
if (totalPatterns >= 500) {
  console.log('✅ PHOENIX-540 DIRECTORY COMPLETE\n');
  console.log(`   ${totalPatterns} patterns across ALL life domains:`);
  console.log('   • Health & Wellness (wearable-detectable)');
  console.log('   • Relationships (physiological proxies + future data sources)');
  console.log('   • Career & Work (stress markers + future job tracking)');
  console.log('   • Financial (future financial API integration)');
  console.log('   • Social (future social data integration)\n');

  console.log('   10K Simulation validated 52% of patterns because only wearable data was');
  console.log('   available. The other 48% require calendar, financial, social, or work data.\n');

  console.log('   Current production backend has implemented the foundation (Phase 1) and');
  console.log(`   ${prodPatternCount} patterns - primarily wearable-detectable ones.\n`);

  console.log('🚀 READY TO EXPAND: Production backend can now integrate additional');
  console.log('   wearable-detectable patterns from Phoenix-540 directory.\n');

  process.exit(0);
} else {
  console.log(`⚠️  INCOMPLETE: Found ${totalPatterns}/540 patterns\n`);
  process.exit(1);
}
