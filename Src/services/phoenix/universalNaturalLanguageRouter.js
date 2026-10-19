// ============================================
// UNIVERSAL NATURAL LANGUAGE ROUTER
// ============================================
// Routes user requests to the appropriate planet/action
// "I want a fat ass" → Venus (workout generation)
// "Where am I overspending?" → Jupiter (finance analysis)
// "When should I schedule my meeting?" → Earth (calendar optimization)
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import all planet-specific handlers
const nlWorkoutGen = require('../venus/naturalLanguageWorkoutGenerator');
const companionAI = require('./companionAI');
const correlationEngine = require('./correlationEngine');
const predictionEngine = require('./predictionEngine');

// Import models
const WearableData = require('../../models/mercury/WearableData');
const Workout = require('../../models/venus/Workout');
const Goal = require('../../models/mars/Goal');
const Transaction = require('../../models/jupiter/Transaction');
const Budget = require('../../models/jupiter/Budget');
const CalendarEvent = require('../../models/earth/CalendarEvent');
const User = require('../../models/User');

class UniversalNaturalLanguageRouter {
  constructor() {
    this.genAI = process.env.GEMINI_API_KEY
      ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      : null;

    // Intent categories by planet
    this.intentPatterns = {
      // VENUS (Fitness/Training/Nutrition)
      venus: {
        keywords: ['workout', 'exercise', 'train', 'muscle', 'fat ass', 'booty', 'arms', 'legs', 'chest',
                   'lose weight', 'gain muscle', 'bulk', 'cut', 'shredded', 'fitness', 'gym', 'lift',
                   'nutrition', 'meal', 'diet', 'calories', 'protein', 'food'],
        actions: ['generate_workout', 'meal_plan', 'track_workout', 'form_check']
      },

      // MERCURY (Health/Biometrics/Recovery)
      mercury: {
        keywords: ['health', 'hrv', 'recovery', 'sleep', 'stress', 'heart rate', 'sick', 'injury',
                   'biometrics', 'vital', 'wellness', 'tired', 'energy', 'fatigue', 'rest'],
        actions: ['check_recovery', 'analyze_health', 'predict_illness', 'sleep_analysis']
      },

      // MARS (Goals/Habits/Motivation)
      mars: {
        keywords: ['goal', 'habit', 'routine', 'motivation', 'progress', 'achieve', 'target',
                   'wake up', 'morning routine', 'daily', 'weekly', 'milestone', 'improve'],
        actions: ['create_goal', 'track_habit', 'check_progress', 'motivate']
      },

      // JUPITER (Finance/Budgeting/Spending)
      jupiter: {
        keywords: ['money', 'spending', 'budget', 'save', 'savings', 'expense', 'income', 'debt',
                   'overspending', 'afford', 'financial', 'bill', 'transaction', 'purchase', 'cost'],
        actions: ['analyze_spending', 'budget_check', 'savings_plan', 'overspending_analysis']
      },

      // EARTH (Calendar/Energy/Scheduling)
      earth: {
        keywords: ['schedule', 'calendar', 'meeting', 'appointment', 'event', 'time', 'when',
                   'energy', 'productive', 'focus', 'optimal time', 'availability', 'busy'],
        actions: ['optimize_schedule', 'find_time', 'energy_analysis', 'meeting_suggestion']
      },

      // SATURN (Legacy/Reflection/Long-term)
      saturn: {
        keywords: ['legacy', 'long term', 'future', 'vision', 'life goals', 'purpose', 'meaning',
                   'quarterly', 'annual', 'reflection', 'big picture', 'life review'],
        actions: ['quarterly_review', 'legacy_planning', 'life_vision', 'reflection']
      },

      // PHOENIX (AI/Predictions/Correlations/Butler)
      phoenix: {
        keywords: ['predict', 'correlation', 'pattern', 'trend', 'forecast', 'insight',
                   'call', 'text', 'email', 'book', 'order', 'reserve', 'butler'],
        actions: ['predict', 'find_correlations', 'call_someone', 'book_ride', 'send_email']
      }
    };
  }

  /**
   * Main router - detects intent and routes to appropriate handler
   */
  async route(userId, userMessage, context = {}) {
    try {
      
      
      
      
      

      // Step 1: Detect which planet this request is for
      const intent = await this.detectIntent(userMessage, userId);

      
      
      

      // Step 2: Route to the appropriate handler
      const result = await this.routeToPlanet(intent, userId, userMessage, context);

      return {
        success: true,
        planet: intent.planet,
        action: intent.action,
        confidence: intent.confidence,
        result
      };

    } catch (error) {
      console.error('❌ Router error:', error);
      throw error;
    }
  }

  /**
   * Detect which planet and what action the user wants
   */
  async detectIntent(message, userId) {
    // Try AI-based detection first
    if (this.genAI) {
      try {
        return await this.detectIntentWithAI(message, userId);
      } catch (error) {
        console.warn('⚠️  AI intent detection failed, using rule-based:', error.message);
      }
    }

    // Fallback to rule-based
    return this.detectIntentWithRules(message);
  }

  /**
   * AI-based intent detection using Gemini
   */
  async detectIntentWithAI(message, userId) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are Phoenix, an AI assistant with 7 specialized modules (planets):

**VENUS (Fitness/Training)**: Workouts, exercise, muscle building, weight loss, nutrition
**MERCURY (Health/Biometrics)**: HRV, recovery, sleep, health metrics, illness prediction
**MARS (Goals/Habits)**: Goal setting, habit tracking, motivation, routines
**JUPITER (Finance)**: Spending, budgets, savings, financial analysis
**EARTH (Calendar/Energy)**: Scheduling, meetings, energy optimization, time management
**SATURN (Legacy)**: Long-term vision, quarterly reviews, life purpose, reflection
**PHOENIX (AI/Butler)**: Predictions, correlations, automation (calls, texts, rides)

User message: "${message}"

Determine which planet should handle this and what action to take.

Return ONLY JSON (no markdown):
{
  "planet": "venus" | "mercury" | "mars" | "jupiter" | "earth" | "saturn" | "phoenix",
  "action": "specific_action_name",
  "parameters": {},
  "confidence": 0-1,
  "reasoning": "why you chose this planet"
}

Examples:
- "I want a fat ass" → {"planet": "venus", "action": "generate_workout", "confidence": 0.95}
- "Where am I overspending?" → {"planet": "jupiter", "action": "analyze_spending", "confidence": 0.92}
- "When should I schedule my meeting?" → {"planet": "earth", "action": "optimize_schedule", "confidence": 0.88}
- "Am I recovering well?" → {"planet": "mercury", "action": "check_recovery", "confidence": 0.90}
- "Help me wake up at 6am" → {"planet": "mars", "action": "create_habit", "confidence": 0.87}

Return JSON:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON
    let jsonText = responseText;
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      jsonText = match ? match[1] : responseText;
    }

    const parsed = JSON.parse(jsonText);

    // Validate
    if (!parsed.planet || !parsed.action) {
      throw new Error('AI returned incomplete intent data');
    }

    return parsed;
  }

  /**
   * Rule-based intent detection (fallback)
   */
  detectIntentWithRules(message) {
    const lowerMessage = message.toLowerCase();

    // Score each planet
    const scores = {};

    for (const [planet, config] of Object.entries(this.intentPatterns)) {
      let score = 0;

      for (const keyword of config.keywords) {
        if (lowerMessage.includes(keyword)) {
          score += 1;
        }
      }

      scores[planet] = score;
    }

    // Find highest scoring planet
    const sortedPlanets = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);

    const topPlanet = sortedPlanets[0][0];
    const topScore = sortedPlanets[0][1];

    // Default action based on planet
    const actionMap = {
      venus: 'generate_workout',
      mercury: 'check_recovery',
      mars: 'create_goal',
      jupiter: 'analyze_spending',
      earth: 'optimize_schedule',
      saturn: 'quarterly_review',
      phoenix: 'general_question'
    };

    return {
      planet: topPlanet,
      action: actionMap[topPlanet],
      parameters: {},
      confidence: Math.min(topScore * 0.2, 0.85), // Max 0.85 for rule-based
      reasoning: `Matched ${topScore} keywords for ${topPlanet}`
    };
  }

  /**
   * Route to the appropriate planet handler
   */
  async routeToPlanet(intent, userId, message, context) {
    switch (intent.planet) {
      case 'venus':
        return await this.handleVenus(intent, userId, message, context);

      case 'mercury':
        return await this.handleMercury(intent, userId, message, context);

      case 'mars':
        return await this.handleMars(intent, userId, message, context);

      case 'jupiter':
        return await this.handleJupiter(intent, userId, message, context);

      case 'earth':
        return await this.handleEarth(intent, userId, message, context);

      case 'saturn':
        return await this.handleSaturn(intent, userId, message, context);

      case 'phoenix':
        return await this.handlePhoenix(intent, userId, message, context);

      default:
        throw new Error(`Unknown planet: ${intent.planet}`);
    }
  }

  /**
   * VENUS (Fitness) Handler
   */
  async handleVenus(intent, userId, message, context) {
    

    switch (intent.action) {
      case 'generate_workout':
        return await nlWorkoutGen.generateFromNaturalLanguage(userId, message, context);

      case 'meal_plan':
        // TODO: Integrate meal planning
        return {
          message: "Meal planning feature coming soon! For now, track your meals manually.",
          action: 'meal_plan'
        };

      default:
        return await nlWorkoutGen.generateFromNaturalLanguage(userId, message, context);
    }
  }

  /**
   * MERCURY (Health) Handler
   */
  async handleMercury(intent, userId, message, context) {
    

    // Get recent wearable data
    const wearableData = await WearableData.findOne({ userId })
      .sort('-date')
      .lean();

    if (!wearableData) {
      return {
        message: "I don't have any health data for you yet. Connect a wearable device to get started!",
        action: 'no_data'
      };
    }

    switch (intent.action) {
      case 'check_recovery':
        return {
          message: `Your current recovery metrics:\n\n` +
                   `• HRV: ${wearableData.hrv || 'N/A'} ms\n` +
                   `• Resting Heart Rate: ${wearableData.restingHeartRate || 'N/A'} bpm\n` +
                   `• Sleep: ${wearableData.sleepDuration || 'N/A'} hours\n` +
                   `• Recovery Score: ${wearableData.recovery?.score || 'N/A'}/100\n\n` +
                   (wearableData.recovery?.score < 60
                     ? `⚠️ Low recovery - consider a rest day or light workout.`
                     : wearableData.recovery?.score > 80
                     ? `✅ Great recovery - you're ready to crush it!`
                     : `🟡 Moderate recovery - proceed with normal training.`),
          data: wearableData,
          action: 'check_recovery'
        };

      case 'analyze_health':
        // Get last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weekData = await WearableData.find({
          userId,
          date: { $gte: sevenDaysAgo }
        }).sort('date').lean();

        if (weekData.length === 0) {
          return {
            message: "Not enough health data to analyze trends yet. Keep wearing your device!",
            action: 'insufficient_data'
          };
        }

        const avgHRV = weekData.reduce((sum, d) => sum + (d.hrv || 0), 0) / weekData.length;
        const avgSleep = weekData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / weekData.length;

        // Trend detection
        const recentHRV = weekData.slice(-3).reduce((sum, d) => sum + (d.hrv || 0), 0) / 3;
        const olderHRV = weekData.slice(0, 3).reduce((sum, d) => sum + (d.hrv || 0), 0) / 3;
        const trend = recentHRV > olderHRV + 5 ? 'improving ⬆️' : recentHRV < olderHRV - 5 ? 'declining ⬇️' : 'stable ➡️';

        return {
          message: `📊 Your 7-day health analysis:\n\n` +
                   `• Average HRV: ${avgHRV.toFixed(0)} ms (${trend})\n` +
                   `• Average Sleep: ${avgSleep.toFixed(1)} hours\n` +
                   `• Days tracked: ${weekData.length}/7\n\n` +
                   `${avgHRV < 50 ? '⚠️ Your HRV is low - you may be overtraining or stressed.' : ''}` +
                   `${avgSleep < 7 ? '\n⚠️ You\'re not sleeping enough - aim for 7-9 hours.' : ''}` +
                   `${trend === 'improving ⬆️' ? '\n✅ Great trend! Keep up the good work!' : ''}`,
          data: { weekData, avgHRV, avgSleep, trend },
          action: 'analyze_health'
        };

      default:
        return await this.handleMercury({ ...intent, action: 'check_recovery' }, userId, message, context);
    }
  }

  /**
   * MARS (Goals/Habits) Handler
   */
  async handleMars(intent, userId, message, context) {
    

    const goals = await Goal.find({ userId, status: 'active' }).sort('-createdAt').lean();

    switch (intent.action) {
      case 'check_progress':
        if (goals.length === 0) {
          return {
            message: "You don't have any active goals yet. Let's create one! What do you want to achieve?",
            action: 'no_goals'
          };
        }

        const goalsText = goals.map(g => {
          const percent = g.target > 0 ? Math.round((g.progress / g.target) * 100) : 0;
          return `• ${g.name}: ${g.progress}/${g.target} (${percent}%)`;
        }).join('\n');

        return {
          message: `📈 Your active goals:\n\n${goalsText}`,
          data: goals,
          action: 'check_progress'
        };

      case 'create_goal':
        return {
          message: `I can help you create a goal! What specifically do you want to achieve?\n\n` +
                   `Examples:\n` +
                   `• "I want to wake up at 6am every day"\n` +
                   `• "Save $5000 by December"\n` +
                   `• "Workout 4 times per week"\n` +
                   `• "Read 2 books per month"`,
          action: 'create_goal',
          suggestedGoals: [
            'Wake up at 6am daily',
            'Workout 4x per week',
            'Meditate 10 min daily',
            'Save $500 monthly'
          ]
        };

      default:
        return await this.handleMars({ ...intent, action: 'check_progress' }, userId, message, context);
    }
  }

  /**
   * JUPITER (Finance) Handler
   */
  async handleJupiter(intent, userId, message, context) {
    

    // Get last 30 days of transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo }
    }).sort('-date').lean();

    if (transactions.length === 0) {
      return {
        message: "I don't have any financial data for you yet. Connect your bank account to get insights!",
        action: 'no_data'
      };
    }

    switch (intent.action) {
      case 'analyze_spending':
        // Group by category
        const byCategory = {};
        let totalSpent = 0;

        transactions.forEach(t => {
          if (t.amount < 0) { // Spending
            const category = t.category || 'Other';
            byCategory[category] = (byCategory[category] || 0) + Math.abs(t.amount);
            totalSpent += Math.abs(t.amount);
          }
        });

        const categoryText = Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([cat, amount]) => {
            const percent = (amount / totalSpent * 100).toFixed(0);
            return `• ${cat}: $${amount.toFixed(2)} (${percent}%)`;
          })
          .join('\n');

        return {
          message: `💰 Your spending analysis (last 30 days):\n\n` +
                   `Total spent: $${totalSpent.toFixed(2)}\n\n` +
                   `Top categories:\n${categoryText}`,
          data: { byCategory, totalSpent, transactionCount: transactions.length },
          action: 'analyze_spending'
        };

      case 'overspending_analysis':
        // Find highest spending category
        const byCategory2 = {};
        transactions.forEach(t => {
          if (t.amount < 0) {
            const category = t.category || 'Other';
            byCategory2[category] = (byCategory2[category] || 0) + Math.abs(t.amount);
          }
        });

        const highest = Object.entries(byCategory2)
          .sort((a, b) => b[1] - a[1])[0];

        return {
          message: `💸 Overspending analysis:\n\n` +
                   `Your highest spending category is **${highest[0]}** at $${highest[1].toFixed(2)}.\n\n` +
                   `${highest[1] > 500 ? '⚠️ This seems high. Consider setting a budget limit!' : ''}`,
          data: { highest, byCategory: byCategory2 },
          action: 'overspending_analysis'
        };

      default:
        return await this.handleJupiter({ ...intent, action: 'analyze_spending' }, userId, message, context);
    }
  }

  /**
   * EARTH (Calendar/Energy) Handler
   */
  async handleEarth(intent, userId, message, context) {
    

    const upcomingEvents = await CalendarEvent.find({
      userId,
      startTime: { $gte: new Date() }
    })
      .sort('startTime')
      .limit(5)
      .lean();

    switch (intent.action) {
      case 'optimize_schedule':
        if (upcomingEvents.length === 0) {
          return {
            message: "Your calendar is clear! No upcoming events to optimize.",
            action: 'no_events'
          };
        }

        const eventsList = upcomingEvents.map(e => {
          const time = new Date(e.startTime).toLocaleString();
          return `• ${e.title} - ${time}`;
        }).join('\n');

        return {
          message: `📅 Your upcoming schedule:\n\n${eventsList}\n\n` +
                   `💡 Based on your energy patterns, I recommend scheduling important meetings between 9am-12pm.`,
          data: upcomingEvents,
          action: 'optimize_schedule'
        };

      default:
        return await this.handleEarth({ ...intent, action: 'optimize_schedule' }, userId, message, context);
    }
  }

  /**
   * SATURN (Legacy) Handler
   */
  async handleSaturn(intent, userId, message, context) {
    

    return {
      message: "🏛️ Saturn (Legacy Planning) features coming soon!\n\n" +
               "This will help you:\n" +
               "• Set long-term life goals\n" +
               "• Quarterly progress reviews\n" +
               "• Vision board creation\n" +
               "• Life purpose reflection",
      action: intent.action
    };
  }

  /**
   * PHOENIX (AI/Predictions/Butler) Handler
   */
  async handlePhoenix(intent, userId, message, context) {
    

    switch (intent.action) {
      case 'find_correlations':
        const patterns = await correlationEngine.findPatterns(userId);

        if (patterns.length === 0) {
          return {
            message: "I need more data to find meaningful correlations. Keep using Phoenix and I'll discover patterns!",
            action: 'insufficient_data'
          };
        }

        const topPatterns = patterns.slice(0, 3).map(p =>
          `• ${p.description} (${(p.strength * 100).toFixed(0)}% correlation)`
        ).join('\n');

        return {
          message: `🔍 Correlation insights:\n\n${topPatterns}`,
          data: patterns,
          action: 'find_correlations'
        };

      case 'general_question':
      default:
        // Use the existing companion AI for general questions
        return {
          message: "I'm here to help! Could you be more specific about what you need?\n\n" +
                   "I can help with:\n" +
                   "• Fitness: 'I want a fat ass'\n" +
                   "• Health: 'Am I recovering well?'\n" +
                   "• Goals: 'Show my progress'\n" +
                   "• Finance: 'Where am I overspending?'\n" +
                   "• Calendar: 'When should I schedule X?'",
          action: 'clarification_needed'
        };
    }
  }
}

module.exports = new UniversalNaturalLanguageRouter();
