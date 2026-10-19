// ============================================
// UNIVERSAL NATURAL LANGUAGE CONTROLLER
// ============================================
// Single endpoint that accepts ANY user request
// Routes to appropriate planetary system
// Returns conversational response + structured data
// ============================================

const router = require('../services/phoenix/universalNaturalLanguageRouter');
const companionAI = require('../services/phoenix/companionAI');

/**
 * Universal Natural Language Endpoint
 * POST /api/phoenix/universal
 * Body: {
 *   message: "I want a fat ass",
 *   conversationHistory: [...], // Optional
 *   timezone: "America/New_York" // Optional
 * }
 */
exports.processUniversalRequest = async (req, res) => {
  try {
    const { message, conversationHistory = [], timezone } = req.body;
    const userId = req.user._id;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
        examples: [
          "I want a fat ass",
          "What's my recovery score?",
          "Where am I overspending?",
          "Show my goals",
          "When should I schedule my meeting?",
          "How's my sleep?",
          "Call my dentist"
        ]
      });
    }

    // Check message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long (max 1000 characters)'
      });
    }

    
    
    
    
    
    

    // Route the request
    const routerResult = await router.route(userId, message, {
      conversationHistory,
      timezone,
      user: req.user
    });

    // Generate conversational response using companion AI
    const conversationalResponse = await generateConversationalResponse(
      routerResult,
      message,
      userId,
      conversationHistory
    );

    // Build final response
    const finalResponse = {
      success: true,

      // Intent detection results
      intent: {
        planet: routerResult.planet,
        action: routerResult.action,
        confidence: routerResult.confidence
      },

      // Conversational response (for TTS and display)
      response: conversationalResponse,

      // Structured data from planetary system
      data: routerResult.result,

      // For frontend to know how to handle
      actionType: routerResult.action,

      // Timestamp
      timestamp: new Date().toISOString()
    };

    // Log success
    
    
    
    
    

    return res.status(200).json(finalResponse);

  } catch (error) {
    console.error('❌ Universal NL processing error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to process request',
      message: error.message,
      suggestion: 'Try rephrasing your request or use more specific terms'
    });
  }
};

/**
 * Get example requests for each planet
 * GET /api/phoenix/universal/examples
 */
exports.getExamples = async (req, res) => {
  try {
    const examples = {
      venus: {
        planet: "Venus (Fitness & Nutrition)",
        icon: "♀️",
        examples: [
          "I want a fat ass",
          "Generate a chest workout",
          "Help me lose 10 pounds",
          "Build muscle in my arms",
          "Create a meal plan for cutting",
          "I'm tired, give me something light",
          "Give me a leg day that will destroy me"
        ]
      },
      mercury: {
        planet: "Mercury (Health & Biometrics)",
        icon: "☿️",
        examples: [
          "What's my recovery score?",
          "How's my sleep?",
          "Am I overtraining?",
          "Show my HRV trend",
          "Am I recovering well?",
          "What's my heart rate?",
          "Should I train today?"
        ]
      },
      mars: {
        planet: "Mars (Goals & Habits)",
        icon: "♂️",
        examples: [
          "Show my progress",
          "Help me wake up at 6am",
          "I want to save $5000",
          "Track my meditation habit",
          "What are my goals?",
          "Am I on track?"
        ]
      },
      jupiter: {
        planet: "Jupiter (Finance)",
        icon: "♃",
        examples: [
          "Where am I overspending?",
          "Show my budget status",
          "How much did I spend on food?",
          "Do I have a subscription problem?",
          "Analyze my spending",
          "What's my biggest expense?"
        ]
      },
      earth: {
        planet: "Earth (Calendar & Energy)",
        icon: "🌍",
        examples: [
          "When should I schedule my meeting?",
          "Optimize my calendar",
          "Find time for a workout",
          "When am I most productive?",
          "What's on my schedule?",
          "When's my next meeting?"
        ]
      },
      saturn: {
        planet: "Saturn (Legacy Planning)",
        icon: "♄",
        examples: [
          "Show my life vision",
          "Quarterly review",
          "What's my life purpose?",
          "Long-term goals"
        ]
      },
      phoenix: {
        planet: "Phoenix (AI & Automation)",
        icon: "🔥",
        examples: [
          "What patterns do you see?",
          "Predict my recovery tomorrow",
          "Will I complete my goal?",
          "Am I at risk of burnout?",
          "Call my dentist",
          "Send a text to Mom",
          "Order me an Uber"
        ]
      }
    };

    res.status(200).json({
      success: true,
      data: examples,
      totalPlanets: Object.keys(examples).length,
      totalExamples: Object.values(examples).reduce((sum, p) => sum + p.examples.length, 0)
    });

  } catch (error) {
    console.error('Error getting examples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Helper: Generate conversational response from router result
 */
async function generateConversationalResponse(routerResult, originalMessage, userId, conversationHistory) {
  // If router result already has a message, use it
  if (routerResult.result && routerResult.result.message) {
    return routerResult.result.message;
  }

  // Otherwise, use companion AI to generate a natural response
  try {
    const context = await companionAI.buildUserContext(userId);

    const prompt = `User asked: "${originalMessage}"

The system routed this to ${routerResult.planet.toUpperCase()} and performed action: ${routerResult.action}.

Result data: ${JSON.stringify(routerResult.result, null, 2)}

Generate a brief, friendly conversational response (2-3 sentences max) that:
1. Acknowledges what the user asked
2. Summarizes the key information from the result
3. Offers a helpful next step or insight

Be conversational and warm, like talking to a friend.`;

    const aiResponse = await companionAI.chat(userId, prompt, {
      personality: 'phoenix',
      context: context.summary
    });

    return aiResponse.reply;

  } catch (error) {
    console.error('Error generating conversational response:', error);

    // Fallback: simple generic response
    return `I processed your request "${originalMessage}" successfully. ` +
           `The ${routerResult.planet} system handled this as a ${routerResult.action} action.`;
  }
}

/**
 * Get current conversation context for debugging
 * GET /api/phoenix/universal/context
 */
exports.getContext = async (req, res) => {
  try {
    const userId = req.user._id;
    const context = await companionAI.buildUserContext(userId);

    res.status(200).json({
      success: true,
      data: context
    });

  } catch (error) {
    console.error('Error getting context:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
