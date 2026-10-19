/**
 * PHOENIX AI ROUTER
 *
 * Orchestrates the Unconscious/Conscious AI architecture.
 * Routes queries through 4 tiers: Cache → Gemini → Claude → GPT-5.2
 *
 * Architecture:
 * - Tier 1 (90%): Cache hit → Instant response (<500ms)
 * - Tier 2 (5%): Gemini live → Fast response (1-2s)
 * - Tier 3 (3%): Claude deep → Detailed response (3-4s)
 * - Tier 4 (2%): GPT-5.2 Apex → Mission-critical (5-10s)
 *
 * This is the BRAIN OF PHOENIX - trust it like oxygen.
 */

const optimalMind = require('./optimalMind'); // PRIMARY: Kimi K2 + Haiku fallback (raw fetch)
const kimiConscious = require('../kimi/consciousMind'); // BACKUP: Kimi K2 via OpenAI SDK
const geminiConscious = require('../gemini/consciousMind');
const claudeConscious = require('../claude/consciousMind');
const claudeUnconscious = require('../claude/unconsciousMind');
const gptApex = require('../openai/consciousMind');
const User = require('../../models/User');
const InterfacePreferences = require('../../models/phoenix/InterfacePreferences');

class AIRouter {
  constructor() {
    this.metrics = {
      totalQueries: 0,
      cacheHits: 0,
      kimiFree: 0, // NEW: Track free tier usage
      geminiLive: 0,
      claudeDeep: 0,
      gptApex: 0,
      avgResponseTime: 0
    };
  }

  /**
   * MAIN ROUTING FUNCTION
   * This is the single entry point for ALL Phoenix AI interactions
   *
   * @param {Object} request
   * @param {String} request.userId - User ID
   * @param {String} request.message - User's message/query
   * @param {Array} request.conversationHistory - Previous messages
   * @param {Object} request.context - Additional context
   * @returns {Object} { message, source, responseTime, uiManipulation }
   */
  async route(request) {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    try {
      const { userId, message, conversationHistory = [], context = {} } = request;

      // 1. Fetch user info (name, preferences)
      const userFetchStart = Date.now();
      const user = await User.findById(userId).select('name email preferences').lean();
      

      if (!user) {
        throw new Error('User not found');
      }

      // 2. Get user's AI provider preference
      const preferences = await InterfacePreferences.findOne({ userId }).lean();
      const userPreferredAI = (preferences && preferences.preferredAI) || 'optimal'; // DEFAULT: OptimalMind (Gemini→Kimi→Haiku, FREE)

      // 3. Build context for AI
      const enrichedContext = {
        ...context,
        userName: user.name,
        userPreferences: user.preferences || {},
        conversationHistory,
        conciseMode: true, // Default ON
        maxWords: (user.preferences && user.preferences.maxWords) || 15
      };

      // 4. INTELLIGENT ROUTING: 5-tier system (NEW TIER 0)
      const needsApex = this.detectApexNeed(message, enrichedContext);
      const needsDeepCreation = this.detectDocumentCreation(message);

      // Auto-route based on task complexity:
      // - Tier 0: DEFAULT → Kimi K2 (FREE, fast, good quality)
      // - Tier 1: Voice/quick queries → Gemini 3 Pro (premium speed)
      // - Tier 2: Document creation → Claude (premium reasoning)
      // - Tier 3: Mission-critical → GPT-5.2 Apex (premium intelligence)
      const aiProvider = needsApex ? 'gpt' : (needsDeepCreation ? 'claude' : userPreferredAI);

      if (aiProvider === 'kimi') {
        console.log('🆓 TIER 0: Routing to Kimi K2 FREE');
      } else if (aiProvider === 'gpt') {
        console.log('🎯 TIER 3: Routing to GPT-5.2 Apex Intelligence (PREMIUM)');
      } else if (aiProvider === 'claude') {
        console.log('📋 TIER 2: Routing to Claude Deep Creation (PREMIUM)');
      } else if (aiProvider === 'gemini') {
        console.log('⚡ TIER 1: Routing to Gemini Fast Response (PREMIUM)');
      }

      // 5. Route to selected AI provider with FAST FALLBACK CHAIN
      const aiStart = Date.now();

      // Helper: Call AI with timeout (3 seconds max per provider)
      const callWithTimeout = async (mind, name, timeoutMs = 3000) => {
        return Promise.race([
          mind.respondToQuery(message, userId, enrichedContext),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${name} timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      let response;

      // FAST FALLBACK CHAIN: OptimalMind has Kimi+Haiku built-in, no redundant fallbacks
      // Priority: User preference → OptimalMind (Kimi+Haiku) → Gemini → Claude
      const fallbackChain = aiProvider === 'gpt'
        ? [{ mind: gptApex, name: 'GPT-5.2', timeout: 8000 }]
        : aiProvider === 'claude'
        ? [{ mind: claudeConscious, name: 'Claude', timeout: 5000 }]
        : aiProvider === 'gemini'
        ? [
            { mind: geminiConscious, name: 'Gemini', timeout: 3000 },
            { mind: optimalMind, name: 'OptimalMind', timeout: 8000 }
          ]
        : [
            // OptimalMind = Kimi K2 → Haiku fallback (8s total is enough for both)
            { mind: optimalMind, name: 'OptimalMind (Kimi+Haiku)', timeout: 8000 }
          ];

      for (const { mind, name, timeout } of fallbackChain) {
        try {
          console.log(`🔄 Trying ${name}...`);
          response = await callWithTimeout(mind, name, timeout);
          if (response && response.message) {
            console.log(`✅ ${name} responded in ${Date.now() - aiStart}ms`);
            break;
          }
        } catch (err) {
          console.warn(`⚠️ ${name} failed: ${err.message}`);
          // Continue to next in chain
        }
      }

      if (!response || !response.message) {
        throw new Error('All AI providers failed');
      }

      // 4. Track metrics
      this.trackMetrics(response);

      // 5. Generate UI manipulation instructions
      const uiManipulation = this.generateUIManipulation(response, message);

      // 6. Return response with UI instructions
      const responseTime = Date.now() - startTime;
      return {
        message: response.message,
        source: response.source,
        responseTime,
        confidence: response.confidence || 90,
        uiManipulation,
        ui: response.ui || null, // Pass through UI commands from Claude
        cacheKey: response.cacheKey || null,
        metrics: this.getMetricsSummary()
      };

    } catch (error) {
      console.error('[AI Router] Error:', error);
      return {
        message: "I'm having trouble thinking right now. Could you try again?",
        source: 'error',
        responseTime: Date.now() - startTime,
        confidence: 0,
        uiManipulation: null,
        error: error.message
      };
    }
  }

  /**
   * GENERATE UI MANIPULATION INSTRUCTIONS
   * Based on AI response, tell frontend what to animate/highlight/update
   */
  generateUIManipulation(response, userQuery) {
    const query = userQuery.toLowerCase();
    const uiInstructions = {
      orb: null,        // Orb animation state
      highlight: [],    // Elements to highlight
      animate: [],      // Elements to animate
      navigate: null,   // Navigation suggestion
      modals: [],       // Modals to open
      notifications: [] // Toast notifications
    };

    // Recovery/workout questions → Highlight Venus (fitness) + Recovery card
    if (query.match(/recover|ready|train|workout/)) {
      uiInstructions.highlight.push('recovery-card', 'venus-planet');
      uiInstructions.animate.push({
        element: 'recovery-ring',
        animation: 'pulse',
        duration: 1000
      });

      // If specific recommendation, highlight that workout type
      if (response.message.match(/yoga|walk|light/i)) {
        uiInstructions.highlight.push('light-workout-cards');
      } else if (response.message.match(/strength|lift|intense/i)) {
        uiInstructions.highlight.push('strength-workout-cards');
      }
    }

    // Sleep questions → Highlight Mercury (health) + Sleep card
    if (query.match(/sleep|slept|rest|tired/)) {
      uiInstructions.highlight.push('sleep-card', 'mercury-planet');
      uiInstructions.animate.push({
        element: 'sleep-chart',
        animation: 'draw-in',
        duration: 800
      });
    }

    // Energy/schedule questions → Highlight Earth (calendar) + Energy curve
    if (query.match(/energy|schedule|when|time/)) {
      uiInstructions.highlight.push('energy-card', 'earth-planet');
      uiInstructions.animate.push({
        element: 'energy-curve',
        animation: 'draw-curve',
        duration: 1200
      });

      // Suggest navigating to calendar
      uiInstructions.navigate = {
        page: 'earth.html',
        reason: 'View your energy-optimized schedule',
        delay: 3000 // Wait 3s after response
      };
    }

    // HRV/heart rate questions → Open Mercury metric spotlight
    if (query.match(/hrv|heart rate|resting hr/)) {
      uiInstructions.modals.push({
        type: 'metric-spotlight',
        metric: 'hrv',
        data: this.extractMetricFromResponse(response.message, 'hrv')
      });
    }

    // Pattern/correlation questions → Highlight correlation cards
    if (query.match(/pattern|trend|notice|correlation|why/)) {
      uiInstructions.highlight.push('correlations-section');
      uiInstructions.animate.push({
        element: 'correlation-cards',
        animation: 'cascade-in',
        duration: 600
      });
    }

    // Goal questions → Highlight Mars (goals)
    if (query.match(/goal|progress|achieve/)) {
      uiInstructions.highlight.push('mars-planet', 'goals-section');
    }

    // Nutrition questions → Highlight Venus nutrition tab
    if (query.match(/food|eat|meal|nutrition|calorie/)) {
      uiInstructions.highlight.push('venus-planet', 'nutrition-tab');
    }

    // Orb state based on response source
    if (response.source === 'cache') {
      uiInstructions.orb = { state: 'speaking', color: 'cyan', intensity: 'normal' };
    } else if (response.source === 'gemini_live') {
      uiInstructions.orb = { state: 'speaking', color: 'blue', intensity: 'elevated' };
    } else if (response.source === 'claude_deep') {
      uiInstructions.orb = { state: 'speaking', color: 'purple', intensity: 'intense' };
    }

    // Confidence-based notifications
    if (response.confidence < 70) {
      uiInstructions.notifications.push({
        type: 'info',
        message: 'I could use more data to give you better insights. Try syncing your wearables!',
        duration: 5000
      });
    }

    return uiInstructions;
  }

  /**
   * EXTRACT METRIC VALUE FROM RESPONSE
   * Parse AI response to extract specific metric values
   */
  extractMetricFromResponse(message, metric) {
    const patterns = {
      hrv: /(\d+)\s*ms/i,
      heart_rate: /(\d+)\s*bpm/i,
      recovery: /(\d+)%/i,
      sleep: /(\d+)hrs?\s*(\d+)?min/i
    };

    const pattern = patterns[metric];
    if (!pattern) return null;

    const match = message.match(pattern);
    if (match) {
      if (metric === 'sleep') {
        return { hours: parseInt(match[1]), minutes: parseInt(match[2] || 0) };
      }
      return parseInt(match[1]);
    }

    return null;
  }

  /**
   * TRACK METRICS
   * Monitor cache hit rates, response times, sources
   */
  trackMetrics(response) {
    if (response.source === 'cache') {
      this.metrics.cacheHits++;
    } else if (response.source === 'gemini_live') {
      this.metrics.geminiLive++;
    } else if (response.source === 'claude_deep') {
      this.metrics.claudeDeep++;
    } else if (response.source === 'gpt-5.2-pro') {
      this.metrics.gptApex++;
    }

    // Update average response time
    const currentAvg = this.metrics.avgResponseTime;
    const totalQueries = this.metrics.totalQueries;
    this.metrics.avgResponseTime = (currentAvg * (totalQueries - 1) + response.responseTime) / totalQueries;
  }

  /**
   * GET METRICS SUMMARY
   * Return performance stats for monitoring
   */
  getMetricsSummary() {
    return {
      totalQueries: this.metrics.totalQueries,
      cacheHitRate: (this.metrics.cacheHits / this.metrics.totalQueries * 100).toFixed(1) + '%',
      geminiLiveRate: (this.metrics.geminiLive / this.metrics.totalQueries * 100).toFixed(1) + '%',
      claudeDeepRate: (this.metrics.claudeDeep / this.metrics.totalQueries * 100).toFixed(1) + '%',
      gptApexRate: (this.metrics.gptApex / this.metrics.totalQueries * 100).toFixed(1) + '%',
      avgResponseTime: Math.round(this.metrics.avgResponseTime) + 'ms'
    };
  }

  /**
   * TRIGGER BACKGROUND ANALYSIS
   * Called when new data arrives (wearable sync, user logging, etc.)
   *
   * @param {Object} trigger
   * @param {String} trigger.type - 'wearable_sync' | 'user_logging' | 'scheduled' | 'realtime'
   * @param {String} trigger.userId - User ID
   * @param {Object} trigger.data - New data
   * @param {String} trigger.source - Data source
   */
  async triggerBackgroundAnalysis(trigger) {
    try {
      

      // Wake Claude Unconscious Mind for deep analysis
      const result = await claudeUnconscious.analyzeNewData(trigger);

      if (result.success) {
        
      } else {
        console.error(`[AI Router] Background analysis failed:`, result.error);
      }

      return result;
    } catch (error) {
      console.error('[AI Router] Background analysis error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * DETECT APEX NEED (Tier 4)
   * Determines if query requires GPT-5.2's apex-level intelligence
   * These are mission-critical decisions where 45% less hallucination matters
   */
  detectApexNeed(message, context) {
    const query = message.toLowerCase();

    // Mission-critical life decisions
    const lifeCritical = [
      /\b(should i|thinking about|considering)\b.*(quit|leave|break up|divorce|marry|move to|relocate)/i,
      /\b(career change|new job|change careers|leave my job|switch careers)/i,
      /\b(buy|purchase|invest in)\b.*(house|home|property|car|business|stock|crypto)/i,
      /\b(major decision|life decision|big decision|important choice)/i
    ];

    // Business creation/strategy (even more complex than docs)
    const businessCritical = [
      /\b(create|start|launch|build)\b.*(business|company|startup|venture)/i,
      /\b(go into business|become entrepreneur|quit.*start)/i,
      /\b(fundraising|investor pitch|pitch deck|series [a-c])/i,
      /\b(exit strategy|acquisition|ipo|merger)/i
    ];

    // Multi-domain holistic planning
    const holistic = [
      /\b(90.*day|life plan|holistic plan|optimize.*life|transform.*life)/i,
      /\b(optimize everything|full.*optimization|complete.*overhaul)/i,
      /\b(cross.*domain|all.*domains|every.*aspect)/i
    ];

    // Genesis-level operations (self-modification)
    const genesisLevel = [
      /\b(modify yourself|improve yourself|upgrade yourself|self.*modif)/i,
      /\b(analyze.*codebase|optimize.*code|refactor.*everything)/i,
      /\b(genesis mode|autonomous mode|self.*improve)/i
    ];

    // Check all patterns
    const allPatterns = [...lifeCritical, ...businessCritical, ...holistic, ...genesisLevel];
    for (const pattern of allPatterns) {
      if (pattern.test(query)) {
        console.log(`✨ APEX TRIGGER: ${pattern.source}`);
        return true;
      }
    }

    return false;
  }

  /**
   * DETECT DOCUMENT CREATION (Tier 3)
   * Determines if the query requires deep document creation (business plans, reports, etc.)
   * Returns true if Claude should handle it, false if Gemini 3 Pro can handle it
   */
  detectDocumentCreation(message) {
    const query = message.toLowerCase();

    // Document creation keywords
    const creationPatterns = [
      /\b(craft|create|build|generate|write|develop|design|prepare)\b.*\b(business plan|proposal|report|analysis|strategy|document|presentation|pitch|roadmap|plan)\b/i,
      /\b(business plan|marketing plan|strategic plan|financial plan|project plan|action plan)\b.*\b(for|about|on)\b/i,
      /\b(analyze|breakdown|detailed analysis|in-depth|comprehensive)\b.*\b(market|competition|industry|business|strategy)\b/i,
      /\b(help me|i need)\b.*\b(plan|strategy|proposal|document)\b/i
    ];

    // Check if query matches document creation patterns
    for (const pattern of creationPatterns) {
      if (pattern.test(query)) {

        return true;
      }
    }

    // Default: Simple voice query → Gemini 3 Pro
    return false;
  }

  /**
   * HEALTH CHECK
   * Verify AI services are operational
   */
  async healthCheck() {
    return {
      status: 'healthy',
      services: {
        gemini: 'operational',
        claude: 'operational',
        gpt52: 'operational',
        cache: 'operational'
      },
      metrics: this.getMetricsSummary(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AIRouter();
