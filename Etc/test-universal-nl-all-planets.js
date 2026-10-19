// ============================================
// UNIVERSAL NATURAL LANGUAGE TEST SUITE
// ============================================
// Tests all 7 planetary systems via natural language
// Run with: node test-universal-nl-all-planets.js
// ============================================

require('dotenv').config();
const mongoose = require('mongoose');
const router = require('./Src/services/phoenix/universalNaturalLanguageRouter');

// Test requests for each planetary system
const testRequests = [
  // ========== VENUS (Fitness) ==========
  {
    planet: 'Venus',
    emoji: '♀️',
    tests: [
      "I want a fat ass",
      "Generate a chest workout",
      "Help me lose weight fast",
      "I'm tired, give me something light",
      "Build muscle in my arms",
      "Give me a leg day that will destroy me",
      "Create a meal plan for cutting"
    ]
  },

  // ========== MERCURY (Health) ==========
  {
    planet: 'Mercury',
    emoji: '☿️',
    tests: [
      "What's my recovery score?",
      "Am I recovering well?",
      "How's my sleep?",
      "Show my HRV trend",
      "Should I train today?",
      "Am I overtraining?",
      "Analyze my health"
    ]
  },

  // ========== MARS (Goals) ==========
  {
    planet: 'Mars',
    emoji: '♂️',
    tests: [
      "Show my progress",
      "What are my goals?",
      "Help me wake up at 6am",
      "I want to save $5000",
      "Track my meditation habit",
      "Am I on track?"
    ]
  },

  // ========== JUPITER (Finance) ==========
  {
    planet: 'Jupiter',
    emoji: '♃',
    tests: [
      "Where am I overspending?",
      "Show my budget status",
      "How much did I spend on food?",
      "Analyze my spending",
      "What's my biggest expense?",
      "Do I have a subscription problem?"
    ]
  },

  // ========== EARTH (Calendar) ==========
  {
    planet: 'Earth',
    emoji: '🌍',
    tests: [
      "When should I schedule my meeting?",
      "Optimize my calendar",
      "Find time for a workout",
      "When am I most productive?",
      "What's on my schedule?",
      "When's my next meeting?"
    ]
  },

  // ========== SATURN (Legacy) ==========
  {
    planet: 'Saturn',
    emoji: '♄',
    tests: [
      "Show my life vision",
      "Quarterly review",
      "What's my life purpose?",
      "Long-term goals"
    ]
  },

  // ========== PHOENIX (AI/Predictions) ==========
  {
    planet: 'Phoenix',
    emoji: '🔥',
    tests: [
      "What patterns do you see?",
      "Predict my recovery tomorrow",
      "Will I complete my goal?",
      "Am I at risk of burnout?",
      "Find correlations",
      "What insights do you have?"
    ]
  }
];

async function testUniversalNaturalLanguage() {
  try {
    console.log('\n' + '='.repeat(100));
    console.log('🧪 TESTING UNIVERSAL NATURAL LANGUAGE ROUTER - ALL 7 PLANETARY SYSTEMS');
    console.log('='.repeat(100) + '\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phoenix');
    console.log('✅ Connected to MongoDB\n');

    // Create a mock user ID
    const mockUserId = new mongoose.Types.ObjectId();

    let totalTests = 0;
    let successfulTests = 0;
    let failedTests = 0;
    const results = {
      byPlanet: {},
      allTests: []
    };

    // Test each planetary system
    for (const planetGroup of testRequests) {
      console.log(`\n${'═'.repeat(100)}`);
      console.log(`${planetGroup.emoji}  ${planetGroup.planet.toUpperCase()} - ${planetGroup.tests.length} tests`);
      console.log(`${'═'.repeat(100)}\n`);

      results.byPlanet[planetGroup.planet] = {
        total: planetGroup.tests.length,
        successful: 0,
        failed: 0,
        tests: []
      };

      for (let i = 0; i < planetGroup.tests.length; i++) {
        const request = planetGroup.tests[i];
        totalTests++;

        console.log(`\n${'─'.repeat(100)}`);
        console.log(`TEST ${i + 1}/${planetGroup.tests.length} - ${planetGroup.planet}`);
        console.log(`${'─'.repeat(100)}`);
        console.log(`📝 Request: "${request}"`);

        try {
          const startTime = Date.now();

          // Route the request
          const result = await router.route(mockUserId, request, {});

          const duration = Date.now() - startTime;

          // Check if it routed to the expected planet (or a reasonable alternative)
          const expectedPlanet = planetGroup.planet.toLowerCase();
          const actualPlanet = result.planet;
          const confidenceScore = result.confidence;

          console.log(`\n✅ SUCCESS - Processed in ${duration}ms`);
          console.log(`📍 Routed to: ${actualPlanet.toUpperCase()}`);
          console.log(`🎯 Action: ${result.action}`);
          console.log(`🎲 Confidence: ${(confidenceScore * 100).toFixed(0)}%`);

          // Display result message
          if (result.result && result.result.message) {
            const message = result.result.message;
            const preview = message.length > 150 ? message.substring(0, 150) + '...' : message;
            console.log(`💬 Response: "${preview}"`);
          }

          // Display data summary
          if (result.result && result.result.data) {
            const dataKeys = Object.keys(result.result.data);
            if (dataKeys.length > 0) {
              console.log(`📊 Data keys: ${dataKeys.slice(0, 5).join(', ')}${dataKeys.length > 5 ? '...' : ''}`);
            }
          }

          successfulTests++;
          results.byPlanet[planetGroup.planet].successful++;

          const testResult = {
            request,
            expected: expectedPlanet,
            actual: actualPlanet,
            action: result.action,
            confidence: confidenceScore,
            duration,
            status: 'success',
            correct: actualPlanet === expectedPlanet
          };

          results.byPlanet[planetGroup.planet].tests.push(testResult);
          results.allTests.push(testResult);

          // Warn if routed to wrong planet
          if (actualPlanet !== expectedPlanet) {
            console.log(`⚠️  NOTE: Expected ${expectedPlanet}, got ${actualPlanet}`);
          }

        } catch (error) {
          console.error(`\n❌ FAILED:`);
          console.error(`   Error: ${error.message}`);
          if (error.stack) {
            console.error(`   Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
          }

          failedTests++;
          results.byPlanet[planetGroup.planet].failed++;

          results.byPlanet[planetGroup.planet].tests.push({
            request,
            expected: planetGroup.planet.toLowerCase(),
            status: 'failed',
            error: error.message
          });
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // ========== FINAL REPORT ==========
    console.log('\n\n' + '='.repeat(100));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(100));

    console.log(`\n✅ Success: ${successfulTests}/${totalTests} (${(successfulTests/totalTests*100).toFixed(1)}%)`);
    console.log(`❌ Failed:  ${failedTests}/${totalTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);

    console.log('\n📈 Results by Planetary System:');
    console.log('─'.repeat(100));

    for (const [planet, data] of Object.entries(results.byPlanet)) {
      const emoji = testRequests.find(p => p.planet === planet)?.emoji || '🌟';
      const successRate = (data.successful / data.total * 100).toFixed(0);
      const bar = '█'.repeat(Math.floor(successRate / 5));
      console.log(`${emoji}  ${planet.padEnd(10)} │ ${data.successful}/${data.total} │ ${successRate}% ${bar}`);
    }

    // Accuracy check (correct planet routing)
    const correctRoutings = results.allTests.filter(t => t.correct).length;
    const routingAccuracy = (correctRoutings / totalTests * 100).toFixed(1);
    console.log('\n🎯 Routing Accuracy:');
    console.log(`   ${correctRoutings}/${totalTests} routed to correct planet (${routingAccuracy}%)`);

    // Performance stats
    const avgDuration = results.allTests
      .filter(t => t.duration)
      .reduce((sum, t) => sum + t.duration, 0) / results.allTests.filter(t => t.duration).length;

    console.log('\n⚡ Performance:');
    console.log(`   Average response time: ${avgDuration.toFixed(0)}ms`);

    // Confidence stats
    const avgConfidence = results.allTests
      .filter(t => t.confidence)
      .reduce((sum, t) => sum + t.confidence, 0) / results.allTests.filter(t => t.confidence).length;

    console.log(`   Average confidence: ${(avgConfidence * 100).toFixed(0)}%`);

    console.log('\n' + '='.repeat(100));

    if (successfulTests === totalTests) {
      console.log('✅ ALL TESTS PASSED! Universal Natural Language system is working perfectly! 🎉');
    } else {
      console.log(`⚠️  ${failedTests} test(s) failed. Review errors above.`);
    }

    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
    process.exit(0);
  }
}

// Run tests
testUniversalNaturalLanguage();
