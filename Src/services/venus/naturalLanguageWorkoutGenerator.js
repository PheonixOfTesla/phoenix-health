// Natural Language Workout Generator
// Converts user requests like "give me a workout to get a fat ass" into quantum workout parameters
// Uses Gemini AI for intent parsing + existing quantum workout engine

const { GoogleGenerativeAI } = require('@google/generative-ai');
const quantumWorkouts = require('./quantumWorkouts');
const WearableData = require('../../models/mercury/WearableData');
const User = require('../../models/User');

class NaturalLanguageWorkoutGenerator {
  constructor() {
    this.genAI = process.env.GOOGLE_AI_API_KEY
      ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
      : null;

    // Goal → Muscle Group mapping
    this.goalToMuscleMap = {
      'fat ass': ['glutes', 'hamstrings'],
      'big booty': ['glutes', 'hamstrings'],
      'thick thighs': ['quadriceps', 'hamstrings', 'glutes'],
      'lose weight': ['full-body'],
      'burn fat': ['full-body'],
      'get shredded': ['full-body'],
      'build muscle': ['chest', 'back', 'shoulders', 'arms', 'legs'],
      'bulk up': ['chest', 'back', 'shoulders', 'arms', 'legs'],
      'abs': ['core', 'abs'],
      'six pack': ['core', 'abs'],
      'big arms': ['biceps', 'triceps', 'forearms'],
      'chest': ['chest', 'shoulders'],
      'back': ['back', 'lats'],
      'legs': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
      'cardio': ['full-body'],
      'endurance': ['full-body']
    };

    // Intent → Workout Type mapping
    this.intentToTypeMap = {
      'strength': 'strength',
      'muscle': 'hypertrophy',
      'fat loss': 'metabolic',
      'weight loss': 'metabolic',
      'cardio': 'endurance',
      'tone': 'hypertrophy',
      'power': 'power',
      'athletic': 'athletic'
    };

    // Mood/Energy → Intensity mapping
    this.moodToIntensityMap = {
      'tired': 0.6,
      'exhausted': 0.5,
      'low energy': 0.6,
      'energized': 0.9,
      'pumped': 1.0,
      'normal': 0.8,
      'sore': 0.7,
      'recovering': 0.6
    };
  }

  /**
   * Main entry point - parse natural language and generate workout
   */
  async generateFromNaturalLanguage(userId, userRequest, context = {}) {
    try {
      

      // Get user data for context
      const user = await User.findById(userId);
      const recentWearableData = await WearableData.findOne({ userId })
        .sort('-date')
        .limit(1)
        .lean();

      // Parse the user's request into structured parameters
      const parsedIntent = await this.parseIntent(userRequest, {
        user,
        wearableData: recentWearableData,
        ...context
      });

      

      // Validate and enhance parameters
      const workoutParams = this.buildWorkoutParameters(parsedIntent, user, recentWearableData);

      // Generate the quantum workout
      const workout = await quantumWorkouts.generateQuantumWorkout(
        userId,
        workoutParams.targetMuscles,
        workoutParams.workoutType
      );

      // Add natural language explanation
      workout.userFriendlyExplanation = this.generateExplanation(
        userRequest,
        parsedIntent,
        workout
      );

      return {
        success: true,
        originalRequest: userRequest,
        parsedIntent,
        workout,
        explanation: workout.userFriendlyExplanation
      };

    } catch (error) {
      console.error('❌ Natural language workout generation failed:', error);
      throw error;
    }
  }

  /**
   * Parse natural language using Gemini AI
   */
  async parseIntent(userRequest, context) {
    // Try AI parsing first
    if (this.genAI) {
      try {
        return await this.parseWithAI(userRequest, context);
      } catch (error) {
        console.warn('⚠️  AI parsing failed, falling back to rule-based:', error.message);
      }
    }

    // Fallback to rule-based parsing
    return this.parseWithRules(userRequest, context);
  }

  /**
   * Use Gemini AI to parse user intent
   */
  async parseWithAI(userRequest, context) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a fitness AI. Parse this workout request into structured data.

User request: "${userRequest}"

User context:
${context.user ? `- Name: ${context.user.name}` : ''}
${context.wearableData ? `- Recent HRV: ${context.wearableData.hrv?.value || 'N/A'}` : ''}
${context.wearableData ? `- Sleep: ${context.wearableData.sleep?.hours || 'N/A'} hours` : ''}
${context.wearableData ? `- Recovery: ${context.wearableData.recovery?.score || 'N/A'}/100` : ''}

Extract and return ONLY a JSON object (no markdown, no explanations):
{
  "primaryGoal": "fat loss" | "muscle gain" | "strength" | "endurance" | "athletic performance" | "general fitness",
  "targetMuscles": ["glutes", "hamstrings", "quadriceps", "chest", "back", "shoulders", "arms", "core", "full-body"],
  "workoutType": "strength" | "hypertrophy" | "metabolic" | "endurance" | "power" | "athletic" | "auto",
  "intensity": 0.5-1.0,
  "duration": minutes (30-90),
  "mood": "tired" | "energized" | "normal" | "sore" | "recovering",
  "specificRequests": ["any special requests like 'no jumping', 'home workout', etc"],
  "confidence": 0-1
}

Examples:
- "I want a fat ass" → primaryGoal: "muscle gain", targetMuscles: ["glutes", "hamstrings"], workoutType: "hypertrophy"
- "I'm tired, give me something light" → intensity: 0.6, mood: "tired", duration: 30
- "Lose weight fast" → primaryGoal: "fat loss", workoutType: "metabolic", intensity: 0.9
- "Build my chest" → targetMuscles: ["chest", "shoulders"], workoutType: "hypertrophy"

Return JSON only:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON (handle markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```')) {
      const match = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      jsonText = match ? match[1] : responseText;
    }

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.primaryGoal || !parsed.targetMuscles || !parsed.workoutType) {
      throw new Error('AI parsing returned incomplete data');
    }

    return parsed;
  }

  /**
   * Fallback rule-based parsing (when AI fails or is unavailable)
   */
  parseWithRules(userRequest, context) {
    const lowerRequest = userRequest.toLowerCase();

    // Detect goal
    let primaryGoal = 'general fitness';
    let targetMuscles = ['full-body'];
    let workoutType = 'auto';
    let intensity = 0.8;
    let duration = 45;
    let mood = 'normal';
    let specificRequests = [];

    // Goal detection
    if (/(fat ass|big booty|glutes|butt)/i.test(lowerRequest)) {
      primaryGoal = 'muscle gain';
      targetMuscles = ['glutes', 'hamstrings'];
      workoutType = 'hypertrophy';
    } else if (/(lose weight|fat loss|burn fat|shred)/i.test(lowerRequest)) {
      primaryGoal = 'fat loss';
      targetMuscles = ['full-body'];
      workoutType = 'metabolic';
      intensity = 0.9;
    } else if (/(build muscle|bulk|gain mass|hypertrophy)/i.test(lowerRequest)) {
      primaryGoal = 'muscle gain';
      workoutType = 'hypertrophy';
    } else if (/(strong|strength|power)/i.test(lowerRequest)) {
      primaryGoal = 'strength';
      workoutType = 'strength';
    } else if (/(cardio|endurance|run|conditioning)/i.test(lowerRequest)) {
      primaryGoal = 'endurance';
      workoutType = 'endurance';
    }

    // Muscle group detection
    for (const [keyword, muscles] of Object.entries(this.goalToMuscleMap)) {
      if (lowerRequest.includes(keyword)) {
        targetMuscles = muscles;
        break;
      }
    }

    // Mood/energy detection
    for (const [keyword, intensityValue] of Object.entries(this.moodToIntensityMap)) {
      if (lowerRequest.includes(keyword)) {
        mood = keyword;
        intensity = intensityValue;
        break;
      }
    }

    // Duration detection
    const durationMatch = lowerRequest.match(/(\d+)\s*(min|minute|hour)/i);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]);
      if (lowerRequest.includes('hour')) duration *= 60;
    } else if (/(quick|short)/i.test(lowerRequest)) {
      duration = 30;
    } else if (/(long|extended)/i.test(lowerRequest)) {
      duration = 75;
    }

    // Special requests
    if (/no jump/i.test(lowerRequest)) specificRequests.push('low-impact');
    if (/(home|no gym|no equipment)/i.test(lowerRequest)) specificRequests.push('bodyweight');
    if (/beginner/i.test(lowerRequest)) {
      specificRequests.push('beginner-friendly');
      intensity = 0.6;
    }

    return {
      primaryGoal,
      targetMuscles,
      workoutType,
      intensity,
      duration,
      mood,
      specificRequests,
      confidence: 0.75 // Rule-based is less confident than AI
    };
  }

  /**
   * Build final workout parameters from parsed intent
   */
  buildWorkoutParameters(parsedIntent, user, wearableData) {
    const params = {
      targetMuscles: parsedIntent.targetMuscles,
      workoutType: parsedIntent.workoutType
    };

    // Adjust intensity based on recovery data
    if (wearableData?.recovery?.score) {
      const recoveryScore = wearableData.recovery.score;
      if (recoveryScore < 60 && parsedIntent.intensity > 0.7) {
        
        params.reducedIntensityReason = `Low recovery score (${recoveryScore}/100)`;
        params.intensityOverride = 0.7;
      }
    }

    // Adjust for sleep
    if (wearableData?.sleep?.hours < 6) {
      
      params.sleepWarning = true;
    }

    return params;
  }

  /**
   * Generate user-friendly explanation of the workout
   */
  generateExplanation(userRequest, parsedIntent, workout) {
    let explanation = `Based on your request "${userRequest}", `;

    if (parsedIntent.primaryGoal === 'muscle gain' && parsedIntent.targetMuscles.includes('glutes')) {
      explanation += `I've created a glute-focused hypertrophy workout to help you build that booty! 🍑\n\n`;
    } else if (parsedIntent.primaryGoal === 'fat loss') {
      explanation += `I've designed a high-intensity metabolic workout to maximize fat burning! 🔥\n\n`;
    } else if (parsedIntent.primaryGoal === 'strength') {
      explanation += `I've programmed a strength-focused workout to build power! 💪\n\n`;
    } else {
      explanation += `I've generated a custom workout tailored to your goals!\n\n`;
    }

    explanation += `**Workout Details:**\n`;
    explanation += `- Type: ${workout.name}\n`;
    explanation += `- Exercises: ${workout.exercises?.length || 0}\n`;
    explanation += `- Chaos Level: ${(workout.chaosLevel * 100).toFixed(0)}% (prevents plateaus)\n`;

    if (workout.plateauBreakProtocol) {
      explanation += `- ⚡ Plateau Break Protocol ACTIVATED - extra variation to shock your muscles!\n`;
    }

    if (parsedIntent.mood === 'tired' || parsedIntent.intensity < 0.7) {
      explanation += `\n💡 Since you're ${parsedIntent.mood}, I've adjusted the intensity to be more manageable.\n`;
    }

    if (workout.aiOptimization) {
      explanation += `\n🤖 AI-optimized based on your recent wearable data for maximum results!\n`;
    }

    return explanation;
  }
}

module.exports = new NaturalLanguageWorkoutGenerator();
