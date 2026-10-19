/**
 * ==================================================================
 * INTENT DEPTH DETECTOR
 * ==================================================================
 * Classifies user intent to route to appropriate AI tier or UI action
 *
 * Purpose: Understand WHAT the user wants and HOW to respond
 * - QUESTION → Answer with cached insights or Gemini
 * - REQUEST → Execute action (show widget, optimize calendar)
 * - COMPLEX_QUERY → Deep analysis with Claude
 * - DATA_ENTRY → Extract and log data
 *
 * This is the routing gate that makes Phoenix intelligent about responses
 * ==================================================================
 */

class IntentDepthDetector {
  constructor() {
    // Intent patterns with confidence scoring
    this.patterns = {
      // QUESTIONS (seeking information)
      QUESTION: {
        verbs: ['how', 'what', 'why', 'when', 'where', 'who', 'is', 'are', 'can', 'do', 'does', 'did'],
        patterns: [
          /^(how|what|why|when|where|who)\s/i,
          /\b(is|are|can|do|does|did)\s+\w+/i,
          /\?$/,
          /tell me about/i,
          /explain/i
        ],
        confidence: 0.8
      },

      // REQUESTS (action commands)
      REQUEST: {
        verbs: ['show', 'display', 'open', 'create', 'add', 'log', 'optimize', 'schedule', 'calculate'],
        patterns: [
          /^(show|display|open|create|add|log)\s/i,
          /optimize (my|the)/i,
          /schedule (a|an|my)/i,
          /give me/i,
          /i want to see/i,
          /can you (show|display|create)/i
        ],
        confidence: 0.85
      },

      // COMPLEX QUERIES (scenario simulation, God Mode)
      COMPLEX_QUERY: {
        verbs: ['what if', 'predict', 'simulate', 'forecast', 'analyze'],
        patterns: [
          /^what if/i,
          /what would happen if/i,
          /predict (my|the)/i,
          /simulate/i,
          /how will .* affect/i,
          /impact of/i,
          /correlation between/i
        ],
        confidence: 0.9
      },

      // DATA ENTRY (conversational logging)
      DATA_ENTRY: {
        verbs: ['i slept', 'i ate', 'i worked out', 'i spent', 'i feel', 'i did'],
        patterns: [
          /^i (slept|ate|worked out|exercised|spent|feel|did)/i,
          /just (ate|finished|completed|logged)/i,
          /today i/i,
          /\d+\s+(hours|minutes|calories|dollars|pounds)/i,
          /my (weight|sleep|workout|meal) (is|was)/i
        ],
        confidence: 0.85
      },

      // CONVERSATIONAL (casual chat, needs context)
      CONVERSATIONAL: {
        verbs: ['hey', 'hi', 'hello', 'thanks', 'thank you', 'okay', 'yes', 'no'],
        patterns: [
          /^(hey|hi|hello|sup|yo)\b/i,
          /^(thanks|thank you)/i,
          /^(okay|ok|sure|yes|yeah|yep|no|nope)\b/i,
          /how are you/i,
          /good (morning|afternoon|evening)/i
        ],
        confidence: 0.7
      },

      // FEEDBACK (user responding to Phoenix question)
      FEEDBACK: {
        verbs: ['because', 'since', 'due to'],
        patterns: [
          /^(because|since|due to)/i,
          /^(work|stress|busy|tired|sick)/i,
          /it('s| is) (because|due to)/i
        ],
        confidence: 0.75
      }
    };

    // Entity types for data extraction
    this.entities = {
      TIME: /\b(\d+)\s*(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/i,
      MONEY: /\$(\d+(?:\.\d{2})?|\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/,
      CALORIES: /\b(\d+)\s*(calories|cals|kcal)\b/i,
      WEIGHT: /\b(\d+(?:\.\d+)?)\s*(lbs?|pounds?|kg|kilograms?)\b/i,
      DISTANCE: /\b(\d+(?:\.\d+)?)\s*(miles?|mi|kilometers?|km)\b/i,
      PERCENTAGE: /\b(\d+(?:\.\d+)?)%/,
      DATE: /\b(today|yesterday|tomorrow|last\s+\w+|next\s+\w+)\b/i
    };

    
  }

  /**
   * DETECT INTENT
   * Main classification method
   */
  detect(transcript) {
    if (!transcript || typeof transcript !== 'string') {
      return {
        intent: 'UNKNOWN',
        confidence: 0,
        entities: []
      };
    }

    const cleanedTranscript = transcript.trim().toLowerCase();
    let scores = {};

    // Calculate confidence scores for each intent type
    for (const [intentType, config] of Object.entries(this.patterns)) {
      let score = 0;
      let matchCount = 0;

      // Check verb matches
      for (const verb of config.verbs) {
        if (cleanedTranscript.includes(verb)) {
          score += 0.3;
          matchCount++;
        }
      }

      // Check pattern matches
      for (const pattern of config.patterns) {
        if (pattern.test(transcript)) {
          score += 0.5;
          matchCount++;
        }
      }

      // Normalize score
      if (matchCount > 0) {
        scores[intentType] = Math.min(score * config.confidence, 1.0);
      }
    }

    // Get highest scoring intent
    let detectedIntent = 'CONVERSATIONAL'; // Default
    let maxScore = 0;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedIntent = intent;
      }
    }

    // Extract entities
    const entities = this.extractEntities(transcript);

    // Get routing recommendation
    const routing = this.getRouting(detectedIntent, maxScore, entities);

    return {
      intent: detectedIntent,
      confidence: maxScore,
      entities: entities,
      routing: routing,
      rawTranscript: transcript
    };
  }

  /**
   * EXTRACT ENTITIES
   * Pull out numbers, dates, amounts from text
   */
  extractEntities(transcript) {
    const entities = [];

    for (const [entityType, pattern] of Object.entries(this.entities)) {
      const matches = transcript.matchAll(new RegExp(pattern, 'gi'));

      for (const match of matches) {
        entities.push({
          type: entityType,
          value: match[1] || match[0],
          raw: match[0],
          index: match.index
        });
      }
    }

    return entities;
  }

  /**
   * GET ROUTING RECOMMENDATION
   * Decide which AI tier or action to use
   */
  getRouting(intent, confidence, entities) {
    const routing = {
      aiTier: 'CACHE', // Default to cached responses
      action: null,
      uiUpdate: null,
      dataExtraction: false
    };

    switch (intent) {
      case 'QUESTION':
        // Simple questions → Gemini or cached
        routing.aiTier = confidence > 0.7 ? 'CACHE' : 'GEMINI';
        break;

      case 'REQUEST':
        // Action commands → Execute + UI update
        routing.action = this.detectAction(entities);
        routing.uiUpdate = this.detectUIUpdate(entities);
        routing.aiTier = 'GEMINI'; // Use Gemini for conversational response
        break;

      case 'COMPLEX_QUERY':
        // God Mode predictions → Claude deep analysis
        routing.aiTier = 'CLAUDE';
        routing.action = 'SIMULATE_SCENARIO';
        break;

      case 'DATA_ENTRY':
        // Conversational logging → Extract and save
        routing.dataExtraction = true;
        routing.aiTier = 'GEMINI'; // Use Gemini to confirm extraction
        break;

      case 'CONVERSATIONAL':
        // Casual chat → Gemini for natural response
        routing.aiTier = 'GEMINI';
        break;

      case 'FEEDBACK':
        // User responding to Phoenix question → Context-aware
        routing.aiTier = 'GEMINI';
        routing.dataExtraction = true; // Might contain data
        break;

      default:
        routing.aiTier = 'GEMINI';
    }

    return routing;
  }

  /**
   * DETECT ACTION
   * What action should be executed?
   */
  detectAction(transcript) {
    const lower = transcript.toLowerCase();

    if (/optimize (my )?day/.test(lower)) {
      return 'OPTIMIZE_CALENDAR';
    }

    if (/show (me )?(my )?recovery/.test(lower)) {
      return 'SHOW_RECOVERY';
    }

    if (/show (me )?(my )?goals/.test(lower)) {
      return 'SHOW_GOALS';
    }

    if (/schedule (a )?workout/.test(lower)) {
      return 'SCHEDULE_WORKOUT';
    }

    if (/analyze (my )?spending/.test(lower)) {
      return 'ANALYZE_SPENDING';
    }

    return null;
  }

  /**
   * DETECT UI UPDATE
   * What widget should be shown?
   */
  detectUIUpdate(transcript) {
    const lower = transcript.toLowerCase();

    if (/show.*recovery/.test(lower)) {
      return {
        widget: 'recovery',
        priority: 0,
        size: 'large'
      };
    }

    if (/show.*goals/.test(lower)) {
      return {
        widget: 'goals',
        priority: 1,
        size: 'medium'
      };
    }

    if (/show.*budget/.test(lower)) {
      return {
        widget: 'budget',
        priority: 1,
        size: 'medium'
      };
    }

    if (/show.*calendar/.test(lower)) {
      return {
        widget: 'calendar',
        priority: 1,
        size: 'large'
      };
    }

    return null;
  }

  /**
   * BATCH DETECTION
   * Process multiple transcripts at once
   */
  detectBatch(transcripts) {
    return transcripts.map(transcript => this.detect(transcript));
  }

  /**
   * GET INTENT STATISTICS
   */
  getStats(detections) {
    const stats = {};

    for (const detection of detections) {
      if (!stats[detection.intent]) {
        stats[detection.intent] = 0;
      }
      stats[detection.intent]++;
    }

    return stats;
  }
}

// Export singleton instance
const intentDetector = new IntentDepthDetector();

module.exports = intentDetector;
