// ============================================
// UNIVERSAL NATURAL LANGUAGE INTENT DETECTION TEST
// ============================================
// Tests intent detection WITHOUT requiring MongoDB
// Tests the AI and rule-based routing logic
// Run with: node test-nl-intent-detection.js
// ============================================

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Test requests for each planetary system
const testRequests = [
  // Venus (Fitness)
  { message: "I want a fat ass", expected: "venus", category: "Fitness" },
  { message: "Generate a chest workout", expected: "venus", category: "Fitness" },
  { message: "Help me lose weight", expected: "venus", category: "Fitness" },
  { message: "Create a meal plan", expected: "venus", category: "Fitness" },

  // Mercury (Health)
  { message: "What's my recovery score?", expected: "mercury", category: "Health" },
  { message: "How's my sleep?", expected: "mercury", category: "Health" },
  { message: "Am I overtraining?", expected: "mercury", category: "Health" },
  { message: "Show my HRV", expected: "mercury", category: "Health" },

  // Mars (Goals)
  { message: "Show my progress", expected: "mars", category: "Goals" },
  { message: "Help me wake up at 6am", expected: "mars", category: "Goals" },
  { message: "Track my meditation", expected: "mars", category: "Goals" },

  // Jupiter (Finance)
  { message: "Where am I overspending?", expected: "jupiter", category: "Finance" },
  { message: "Show my budget", expected: "jupiter", category: "Finance" },
  { message: "How much did I spend on food?", expected: "jupiter", category: "Finance" },

  // Earth (Calendar)
  { message: "When should I schedule my meeting?", expected: "earth", category: "Calendar" },
  { message: "Optimize my calendar", expected: "earth", category: "Calendar" },
  { message: "What's on my schedule?", expected: "earth", category: "Calendar" },

  // Saturn (Legacy)
  { message: "Show my life vision", expected: "saturn", category: "Legacy" },
  { message: "Quarterly review", expected: "saturn", category: "Legacy" },

  // Phoenix (AI/Predictions)
  { message: "What patterns do you see?", expected: "phoenix", category: "AI/Predictions" },
  { message: "Find correlations", expected: "phoenix", category: "AI/Predictions" }
];

// Simple rule-based intent detection
function detectIntentRuleBased(message) {
  const lowerMessage = message.toLowerCase();

  const intentPatterns = {
    venus: ['workout', 'exercise', 'train', 'muscle', 'fat ass', 'booty', 'arms', 'legs', 'chest',
            'lose weight', 'gain muscle', 'bulk', 'cut', 'shredded', 'fitness', 'gym', 'lift',
            'nutrition', 'meal', 'diet', 'calories', 'protein', 'food'],
    mercury: ['health', 'hrv', 'recovery', 'sleep', 'stress', 'heart rate', 'sick', 'injury',
              'biometrics', 'vital', 'wellness', 'tired', 'energy', 'fatigue', 'rest'],
    mars: ['goal', 'habit', 'routine', 'motivation', 'progress', 'achieve', 'target',
           'wake up', 'morning routine', 'daily', 'weekly', 'milestone', 'improve'],
    jupiter: ['money', 'spending', 'budget', 'save', 'savings', 'expense', 'income', 'debt',
              'overspending', 'afford', 'financial', 'bill', 'transaction', 'purchase', 'cost'],
    earth: ['schedule', 'calendar', 'meeting', 'appointment', 'event', 'time', 'when',
            'energy', 'productive', 'focus', 'optimal time', 'availability', 'busy'],
    saturn: ['legacy', 'long term', 'future', 'vision', 'life goals', 'purpose', 'meaning',
             'quarterly', 'annual', 'reflection', 'big picture', 'life review'],
    phoenix: ['predict', 'correlation', 'pattern', 'trend', 'forecast', 'insight']
  };

  // Score each planet
  const scores = {};
  for (const [planet, keywords] of Object.entries(intentPatterns)) {
    scores[planet] = 0;
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[planet] += 1;
      }
    }
  }

  // Find highest scoring planet
  const sortedPlanets = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topPlanet = sortedPlanets[0][0];
  const topScore = sortedPlanets[0][1];

  return {
    planet: topPlanet,
    confidence: Math.min(topScore * 0.2, 0.85),
    method: 'rule-based'
  };
}

// AI-based intent detection
async function detectIntentAI(message) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found in environment');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are Phoenix, an AI assistant with 7 specialized modules (planets):

**VENUS (Fitness/Training)**: Workouts, exercise, muscle building, weight loss, nutrition
**MERCURY (Health/Biometrics)**: HRV, recovery, sleep, health metrics, illness prediction
**MARS (Goals/Habits)**: Goal setting, habit tracking, motivation, routines
**JUPITER (Finance)**: Spending, budgets, savings, financial analysis
**EARTH (Calendar/Energy)**: Scheduling, meetings, energy optimization, time management
**SATURN (Legacy)**: Long-term vision, quarterly reviews, life purpose, reflection
**PHOENIX (AI/Butler)**: Predictions, correlations, automation

User message: "${message}"

Determine which planet should handle this and what action to take.

Return ONLY JSON (no markdown):
{
  "planet": "venus" | "mercury" | "mars" | "jupiter" | "earth" | "saturn" | "phoenix",
  "action": "specific_action_name",
  "confidence": 0-1
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Extract JSON
  let jsonText = responseText;
  if (responseText.includes('```')) {
    const match = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    jsonText = match ? match[1] : responseText;
  }

  const parsed = JSON.parse(jsonText);

  return {
    planet: parsed.planet,
    action: parsed.action || 'unknown',
    confidence: parsed.confidence,
    method: 'ai'
  };
}

async function testIntentDetection() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING UNIVERSAL NATURAL LANGUAGE INTENT DETECTION');
  console.log('='.repeat(80) + '\n');

  const hasGeminiAPI = !!process.env.GEMINI_API_KEY;
  console.log(`🔑 Gemini API: ${hasGeminiAPI ? '✅ Available' : '❌ Not configured'}`);
  console.log(`📝 Testing ${hasGeminiAPI ? 'BOTH AI and Rule-Based' : 'Rule-Based ONLY'} methods\n`);

  const results = {
    total: testRequests.length,
    ruleBased: { correct: 0, incorrect: 0 },
    ai: { correct: 0, incorrect: 0 },
    tests: []
  };

  for (let i = 0; i < testRequests.length; i++) {
    const test = testRequests[i];

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`TEST ${i + 1}/${testRequests.length} - ${test.category}`);
    console.log(`${'─'.repeat(80)}`);
    console.log(`📝 Message: "${test.message}"`);
    console.log(`✓  Expected: ${test.expected.toUpperCase()}`);

    const testResult = {
      message: test.message,
      expected: test.expected,
      category: test.category
    };

    // Test 1: Rule-based
    try {
      const ruleResult = detectIntentRuleBased(test.message);
      const isCorrect = ruleResult.planet === test.expected;

      console.log(`\n📊 Rule-Based:`);
      console.log(`   Planet: ${ruleResult.planet.toUpperCase()} ${isCorrect ? '✅' : '❌'}`);
      console.log(`   Confidence: ${(ruleResult.confidence * 100).toFixed(0)}%`);

      testResult.ruleBased = {
        planet: ruleResult.planet,
        confidence: ruleResult.confidence,
        correct: isCorrect
      };

      if (isCorrect) results.ruleBased.correct++;
      else results.ruleBased.incorrect++;

    } catch (error) {
      console.log(`\n❌ Rule-based failed: ${error.message}`);
      testResult.ruleBased = { error: error.message };
      results.ruleBased.incorrect++;
    }

    // Test 2: AI-based (if available)
    if (hasGeminiAPI) {
      try {
        const aiResult = await detectIntentAI(test.message);
        const isCorrect = aiResult.planet === test.expected;

        console.log(`\n🤖 AI-Based:`);
        console.log(`   Planet: ${aiResult.planet.toUpperCase()} ${isCorrect ? '✅' : '❌'}`);
        console.log(`   Action: ${aiResult.action}`);
        console.log(`   Confidence: ${(aiResult.confidence * 100).toFixed(0)}%`);

        testResult.ai = {
          planet: aiResult.planet,
          action: aiResult.action,
          confidence: aiResult.confidence,
          correct: isCorrect
        };

        if (isCorrect) results.ai.correct++;
        else results.ai.incorrect++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`\n❌ AI-based failed: ${error.message}`);
        testResult.ai = { error: error.message };
        results.ai.incorrect++;
      }
    }

    results.tests.push(testResult);
  }

  // Final Report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80));

  console.log(`\n📈 Rule-Based Detection:`);
  const ruleAccuracy = (results.ruleBased.correct / results.total * 100).toFixed(1);
  console.log(`   ✅ Correct: ${results.ruleBased.correct}/${results.total} (${ruleAccuracy}%)`);
  console.log(`   ❌ Incorrect: ${results.ruleBased.incorrect}/${results.total}`);

  if (hasGeminiAPI) {
    console.log(`\n🤖 AI-Based Detection:`);
    const aiAccuracy = (results.ai.correct / results.total * 100).toFixed(1);
    console.log(`   ✅ Correct: ${results.ai.correct}/${results.total} (${aiAccuracy}%)`);
    console.log(`   ❌ Incorrect: ${results.ai.incorrect}/${results.total}`);

    console.log(`\n🏆 Winner: ${aiAccuracy > ruleAccuracy ? 'AI-Based 🤖' : 'Rule-Based 📊'}`);
    console.log(`   AI Improvement: +${(aiAccuracy - ruleAccuracy).toFixed(1)}%`);
  }

  console.log('\n' + '='.repeat(80));

  if (results.ruleBased.correct + results.ai.correct > results.total) {
    console.log('✅ INTENT DETECTION WORKING! Ready to integrate! 🎉');
  } else {
    console.log('⚠️  Some intent detection issues found. Review above.');
  }

  console.log('='.repeat(80) + '\n');
}

// Run tests
testIntentDetection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
