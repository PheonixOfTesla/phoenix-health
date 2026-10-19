/**
 * ==================================================================
 * CONVERSATIONAL DATA EXTRACTOR
 * ==================================================================
 * Extract structured data from natural language conversations
 *
 * Purpose: Enable zero-friction data logging
 * - "I slept 5 hours" → Extract: 5 hours → Log to Mercury
 * - "I spent $45 at Starbucks" → Extract: $45, Starbucks → Log to Jupiter
 * - "Worked out for 90 minutes" → Extract: 90 min → Log to Venus
 *
 * This is what makes Phoenix conversational instead of manual
 * ==================================================================
 */

const intentDetector = require('./intentDepthDetector');

class ConversationalDataExtractor {
  constructor() {
    // Entity extraction patterns with domain mapping
    this.extractors = {
      // MERCURY (Health & Biometrics)
      SLEEP: {
        domain: 'mercury',
        patterns: [
          /(?:slept|sleep|sleeping)\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)/i,
          /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\s+(?:of\s+)?sleep/i,
          /got\s+(\d+)\s+hours?\s+(?:of\s+)?sleep/i
        ],
        extract: (match) => ({
          type: 'sleep_duration',
          value: parseFloat(match[1]),
          unit: 'hours',
          domain: 'mercury',
          action: 'log_sleep'
        })
      },

      HRV: {
        domain: 'mercury',
        patterns: [
          /(?:hrv|heart\s+rate\s+variability)\s+(?:is\s+)?(\d+)/i,
          /my\s+hrv\s+(?:was\s+)?(\d+)/i
        ],
        extract: (match) => ({
          type: 'hrv',
          value: parseInt(match[1]),
          unit: 'ms',
          domain: 'mercury',
          action: 'log_biometric'
        })
      },

      RESTING_HR: {
        domain: 'mercury',
        patterns: [
          /resting\s+(?:heart\s+)?rate\s+(?:is\s+)?(\d+)/i,
          /my\s+rhr\s+(?:is\s+)?(\d+)/i
        ],
        extract: (match) => ({
          type: 'resting_hr',
          value: parseInt(match[1]),
          unit: 'bpm',
          domain: 'mercury',
          action: 'log_biometric'
        })
      },

      // VENUS (Fitness & Nutrition)
      WORKOUT: {
        domain: 'venus',
        patterns: [
          /(?:worked out|exercised|trained)\s+(?:for\s+)?(\d+)\s*(minutes?|mins?|hours?|hrs?)/i,
          /(\d+)\s*(minute|hour)\s+workout/i,
          /did\s+a\s+(\d+)\s*(min|minute|hour)\s+workout/i
        ],
        extract: (match) => ({
          type: 'workout_duration',
          value: parseInt(match[1]),
          unit: match[2].startsWith('h') ? 'hours' : 'minutes',
          domain: 'venus',
          action: 'log_workout'
        })
      },

      MEAL_CALORIES: {
        domain: 'venus',
        patterns: [
          /(?:ate|had|consumed)\s+(?:a\s+)?(?:meal\s+with\s+)?(\d+)\s*(?:calories|cals|kcal)/i,
          /(\d+)\s*(?:calorie|cal)\s+(?:meal|food)/i
        ],
        extract: (match) => ({
          type: 'meal_calories',
          value: parseInt(match[1]),
          unit: 'calories',
          domain: 'venus',
          action: 'log_meal'
        })
      },

      MEAL_DESCRIPTION: {
        domain: 'venus',
        patterns: [
          /(?:ate|had|just\s+ate)\s+(?:a\s+)?(.+?)(?:\s+at\s+|\s+from\s+|$)/i,
          /i\s+ate\s+(.+)/i
        ],
        extract: (match) => ({
          type: 'meal_description',
          value: match[1].trim(),
          domain: 'venus',
          action: 'log_meal_description'
        })
      },

      BODY_WEIGHT: {
        domain: 'venus',
        patterns: [
          /(?:weigh|weight)\s+(?:is\s+)?(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg)/i,
          /my\s+weight\s+(?:is\s+)?(\d+(?:\.\d+)?)/i
        ],
        extract: (match) => ({
          type: 'body_weight',
          value: parseFloat(match[1]),
          unit: match[2] ? (match[2].startsWith('k') ? 'kg' : 'lbs') : 'lbs',
          domain: 'venus',
          action: 'log_body_measurement'
        })
      },

      // JUPITER (Finance)
      TRANSACTION: {
        domain: 'jupiter',
        patterns: [
          /(?:spent|paid|bought)\s+\$?(\d+(?:\.\d{2})?)\s*(?:at\s+|on\s+)?(.+)?/i,
          /\$(\d+(?:\.\d{2})?)\s+(?:at\s+|on\s+)?(.+)/i
        ],
        extract: (match) => ({
          type: 'transaction',
          value: parseFloat(match[1]),
          unit: 'USD',
          merchant: match[2] ? match[2].trim() : null,
          domain: 'jupiter',
          action: 'log_transaction'
        })
      },

      // MARS (Goals & Progress)
      PROGRESS_PERCENT: {
        domain: 'mars',
        patterns: [
          /(?:progress|done|complete)\s+(?:is\s+)?(\d+)%/i,
          /(\d+)%\s+(?:done|complete|progress)/i
        ],
        extract: (match) => ({
          type: 'progress_percent',
          value: parseInt(match[1]),
          unit: 'percent',
          domain: 'mars',
          action: 'log_progress'
        })
      },

      // SATURN (Reflection & Mood)
      MOOD: {
        domain: 'saturn',
        patterns: [
          /(?:feeling|feel)\s+(great|good|okay|meh|bad|terrible|stressed|anxious|happy|sad)/i,
          /i\s+feel\s+(.+)/i
        ],
        extract: (match) => ({
          type: 'mood',
          value: match[1].trim().toLowerCase(),
          domain: 'saturn',
          action: 'log_mood'
        })
      },

      STRESS_LEVEL: {
        domain: 'saturn',
        patterns: [
          /stress\s+(?:level\s+)?(?:is\s+)?(\d+)(?:\/10)?/i,
          /feeling\s+stressed\s+(?:at\s+)?(\d+)/i
        ],
        extract: (match) => ({
          type: 'stress_level',
          value: parseInt(match[1]),
          unit: 'scale_10',
          domain: 'saturn',
          action: 'log_reflection'
        })
      },

      // NEPTUNE (Mindfulness)
      MEDITATION: {
        domain: 'neptune',
        patterns: [
          /(?:meditated|meditation)\s+(?:for\s+)?(\d+)\s*(minutes?|mins?)/i,
          /(\d+)\s*(?:minute|min)\s+meditation/i
        ],
        extract: (match) => ({
          type: 'meditation_duration',
          value: parseInt(match[1]),
          unit: 'minutes',
          domain: 'neptune',
          action: 'log_meditation'
        })
      }
    };

    
  }

  /**
   * EXTRACT FROM TRANSCRIPT
   * Main extraction method
   */
  extract(transcript) {
    if (!transcript || typeof transcript !== 'string') {
      return {
        success: false,
        extractions: [],
        confidence: 0
      };
    }

    const extractions = [];
    const cleanedTranscript = transcript.trim();

    // Try each extractor
    for (const [extractorName, config] of Object.entries(this.extractors)) {
      for (const pattern of config.patterns) {
        const match = cleanedTranscript.match(pattern);

        if (match) {
          try {
            const extracted = config.extract(match);
            extracted.extractorName = extractorName;
            extracted.confidence = this.calculateConfidence(match, pattern);
            extracted.rawMatch = match[0];
            extractions.push(extracted);
          } catch (error) {
            console.error(`[Data Extractor] Error in ${extractorName}:`, error.message);
          }
        }
      }
    }

    // Calculate overall confidence
    const overallConfidence = extractions.length > 0
      ? extractions.reduce((sum, e) => sum + e.confidence, 0) / extractions.length
      : 0;

    return {
      success: extractions.length > 0,
      extractions: extractions,
      confidence: overallConfidence,
      rawTranscript: transcript
    };
  }

  /**
   * CALCULATE CONFIDENCE
   * How sure are we about this extraction?
   */
  calculateConfidence(match, pattern) {
    let confidence = 0.7; // Base confidence

    // Longer matches = higher confidence
    if (match[0].length > 20) confidence += 0.1;

    // Number extracted = higher confidence
    if (/\d+/.test(match[0])) confidence += 0.1;

    // Unit specified = higher confidence
    if (/(hours?|minutes?|lbs?|kg|dollars?|\$|calories?)/.test(match[0])) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * EXTRACT AND LOG
   * Extract data and immediately log to appropriate domain
   */
  async extractAndLog(userId, transcript) {
    const result = this.extract(transcript);

    if (!result.success || result.extractions.length === 0) {
      return {
        success: false,
        message: 'No data extracted',
        extractions: []
      };
    }

    const logged = [];

    // Log each extraction to its domain
    for (const extraction of result.extractions) {
      try {
        const logResult = await this.logToDomain(userId, extraction);
        logged.push({
          ...extraction,
          logged: logResult.success,
          logMessage: logResult.message
        });
      } catch (error) {
        console.error(`[Data Extractor] Logging error:`, error.message);
        logged.push({
          ...extraction,
          logged: false,
          logMessage: error.message
        });
      }
    }

    return {
      success: true,
      extractions: logged,
      confidence: result.confidence
    };
  }

  /**
   * LOG TO DOMAIN
   * Save extracted data to appropriate planet
   */
  async logToDomain(userId, extraction) {
    const { domain, action, type, value, unit } = extraction;

    // Import domain events
    const domainEvents = require('./domainEventEmitter');

    switch (domain) {
      case 'mercury':
        if (action === 'log_sleep') {
          // Emit sleep logged event
          domainEvents.emitSleepLogged(userId, {
            duration: value,
            quality: 'auto_logged',
            date: new Date()
          });
          return { success: true, message: `Sleep logged: ${value} hours` };
        }

        if (action === 'log_biometric') {
          domainEvents.emitBiometricUpdate(userId, {
            [type]: value,
            timestamp: new Date()
          });
          return { success: true, message: `${type} logged: ${value} ${unit}` };
        }
        break;

      case 'venus':
        if (action === 'log_workout') {
          domainEvents.emitWorkoutLogged(userId, {
            duration: value,
            type: 'auto_logged',
            date: new Date()
          });
          return { success: true, message: `Workout logged: ${value} ${unit}` };
        }

        if (action === 'log_meal' || action === 'log_meal_description') {
          domainEvents.emitMealLogged(userId, {
            calories: type === 'meal_calories' ? value : null,
            description: type === 'meal_description' ? value : null,
            timestamp: new Date()
          });
          return { success: true, message: `Meal logged` };
        }

        if (action === 'log_body_measurement') {
          domainEvents.emitBodyMeasurement(userId, {
            weight: value,
            unit: unit,
            date: new Date()
          });
          return { success: true, message: `Weight logged: ${value} ${unit}` };
        }
        break;

      case 'jupiter':
        if (action === 'log_transaction') {
          domainEvents.emitTransactionDetected(userId, {
            amount: -value, // Negative for spending
            merchant: extraction.merchant || 'Unknown',
            category: 'auto_logged',
            date: new Date()
          });
          return { success: true, message: `Transaction logged: $${value}` };
        }
        break;

      case 'mars':
        if (action === 'log_progress') {
          domainEvents.emitProgressLogged(userId, {
            value: value,
            percentComplete: value,
            date: new Date()
          });
          return { success: true, message: `Progress logged: ${value}%` };
        }
        break;

      case 'saturn':
        if (action === 'log_mood' || action === 'log_reflection') {
          domainEvents.emitReflectionLogged(userId, {
            type: type,
            mood: type === 'mood' ? value : null,
            stressLevel: type === 'stress_level' ? value : null,
            timestamp: new Date()
          });
          return { success: true, message: `${type} logged` };
        }
        break;

      case 'neptune':
        if (action === 'log_meditation') {
          domainEvents.emitMeditationLogged(userId, {
            duration: value,
            type: 'auto_logged',
            date: new Date()
          });
          return { success: true, message: `Meditation logged: ${value} minutes` };
        }
        break;
    }

    return { success: false, message: 'Action not recognized' };
  }

  /**
   * GENERATE CONFIRMATION MESSAGE
   * Phoenix confirms what it extracted
   */
  generateConfirmation(extractions) {
    if (extractions.length === 0) {
      return null;
    }

    if (extractions.length === 1) {
      const e = extractions[0];
      return `Got it - ${e.rawMatch}. Logged to ${e.domain}.`;
    }

    // Multiple extractions
    const summary = extractions.map(e => e.rawMatch).join(', ');
    return `Got it - ${summary}. All logged.`;
  }

  /**
   * SUGGEST FOLLOW-UP QUESTION
   * Phoenix asks for more context if needed
   */
  suggestFollowUp(extractions, transcript) {
    // If sleep was logged, ask about quality
    if (extractions.some(e => e.type === 'sleep_duration')) {
      return "How was the quality? Any trouble falling asleep?";
    }

    // If workout was logged, ask about intensity
    if (extractions.some(e => e.type === 'workout_duration')) {
      return "How intense was it? Light, moderate, or heavy?";
    }

    // If meal was logged without calories, ask about it
    if (extractions.some(e => e.type === 'meal_description') &&
        !extractions.some(e => e.type === 'meal_calories')) {
      return "Want me to estimate the calories?";
    }

    // If transaction logged, ask about category
    if (extractions.some(e => e.type === 'transaction')) {
      return "What category should this go under?";
    }

    return null;
  }
}

// Export singleton instance
const conversationalExtractor = new ConversationalDataExtractor();

module.exports = conversationalExtractor;
