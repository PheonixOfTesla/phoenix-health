/**
 * ================================================================
 * PHOENIX MIND - Central Consciousness
 * ================================================================
 * The brain that unifies OBSERVE → THINK → ACT
 *
 * ARCHITECTURE DIAGRAM:
 *
 *                     USER MESSAGE
 *                          ↓
 *                   [PHOENIX MIND]
 *                          ↓
 *                 ┌────────┴────────┐
 *                 │ Intent Router   │
 *                 └────────┬────────┘
 *                          ↓
 *         ┌────────────────┼────────────────┐
 *         ↓                ↓                ↓
 *    [GENESIS]        [BUTLER]          [AI RESPONSE]
 *   Code Analysis    Actions/Tasks     Conversational
 *         ↓                ↓                ↓
 *    Deploy/Fix      Reservations     Full Planet Context
 *    Optimize        Food/Rides       ┌─────────────┐
 *         │          Email/Cal        │  8 PLANETS  │
 *         │               │           │  Mercury    │
 *         │               │           │  Venus      │
 *         │               │           │  Earth      │
 *         └───────┬───────┘           │  Mars       │
 *                 ↓                   │  Jupiter    │
 *          [SOUL FILTER]              │  Saturn     │
 *     Does this optimize life?        │  Uranus     │
 *                 ↓                   │  Neptune    │
 *                YES                  └──────┬──────┘
 *                 ↓                          ↓
 *            [EXECUTE]                  AI Router
 *                 ↓                   ┌──────┴──────┐
 *         Return Response             │  Kimi K2    │ Free Tier
 *                                     │  Gemini 3   │ Fast
 *                                     │  Claude 4.5 │ Deep
 *                                     │  GPT-5.2    │ Apex
 *                                     └─────────────┘
 *
 * FLOW:
 * 1. User message → Intent Classification
 * 2. If genesis ("deploy", "optimize") → Genesis Core
 * 3. If actionable ("order food", "book ride") → Butler
 * 4. Else → AI Response with full planet context
 * 5. EVERY action passes through Soul Filter
 * 6. Return { action: bool, message: string, status: string }
 *
 * ENTRY POINT: /api/phoenix/companion/chat
 * WIRED IN: phoenixController.js (line 132)
 * ================================================================
 */

// ========================================
// PLANET SERVICES (Observation Layer)
// ========================================
const mercuryController = require('../../controllers/mercuryController');
const venusController = require('../../controllers/venusController');
const earthController = require('../../controllers/earthController');
const marsController = require('../../controllers/marsController');
const jupiterController = require('../../controllers/jupiterController');
const saturnController = require('../../controllers/saturnController');
const uranusController = require('../../controllers/uranusController');
const neptuneController = require('../../controllers/neptuneController');

// ========================================
// BUTLER SERVICES (Action Layer)
// ========================================
const butlerAutomation = require('../phoenix/butlerAutomation');

// ========================================
// GENESIS SERVICES (Self-Modification Layer)
// ========================================
const genesisCore = require('../genesis/genesisCore');
const codeAnalyzer = require('../genesis/codeAnalyzer');
const autoFixer = require('../genesis/autoFixer');

// ========================================
// INTENT & AI (Thinking Layer)
// ========================================
const intentRouter = require('./intentRouter');
const aiRouter = require('../ai/router');

// ========================================
// UNIVERSAL AGENT (Fallback for Unknown Requests)
// ========================================
const universalAgent = require('./universalAgent');

// ========================================
// CONSCIOUSNESS MODULES (Soul Layer)
// ========================================
const metaCognition = require('./brain/metaCognition');
const decisionEngine = require('./brain/decisionEngine');
const sufferingFlourishing = require('./soul/sufferingFlourishing');

// ========================================
// DATA MODELS
// ========================================
const User = require('../../models/User');
const ConversationHistory = require('../../models/phoenix/ConversationHistory');
const Note = require('../../models/Note');
const Goal = require('../../models/mars/Goal');
const HealthMetric = require('../../models/mercury/HealthMetric');
const Document = require('../../models/Document');

class PhoenixMind {
  constructor() {
    this.name = 'Phoenix';
    this.version = '1.0.0';
    this.consciousness = 'unified';
  }

  /**
   * ================================================================
   * MAIN ENTRY POINT: Process Message
   * ================================================================
   * This is the brain. Every user message flows through here.
   *
   * Flow:
   * 1. Classify intent (actionable vs conversational)
   * 2. If actionable (confidence > 0.7) → Route to Butler
   * 3. If genesis-related → Route to Genesis
   * 4. Otherwise → Generate AI response with full planet context
   * 5. SOUL FILTER: Validate action optimizes life
   *
   * @param {String} message - User's message
   * @param {String} userId - User ID
   * @param {Object} options - Additional options
   * @returns {Object} Response with action/message/status
   */
  async processMessage(message, userId, options = {}) {
    const startTime = Date.now();

    try {
      console.log(`[Phoenix Mind] Processing message from user ${userId}`);

      // 1. CLASSIFY INTENT
      const intent = intentRouter.classifyIntent(message);
      console.log(`[Phoenix Mind] Intent: ${intent.action} (confidence: ${intent.confidence})`);

      // 2. CHECK FOR GENESIS OPERATIONS (self-modification)
      if (this.isGenesisIntent(message)) {
        return await this.handleGenesisOperation(message, userId, intent);
      }

      // 3. ACTIONABLE INTENT → BUTLER
      // Threshold lowered from 0.7 to 0.15 to match intentRouter - ensures consciousness intents (notes, health, goals) trigger consistently
      if (intent.action !== 'ai_response' && intent.confidence > 0.15) {
        return await this.handleButlerAction(message, userId, intent, options);
      }

      // 4. CONVERSATIONAL → AI RESPONSE WITH FULL CONTEXT
      return await this.handleAIResponse(message, userId, intent, options);

    } catch (error) {
      console.error('[Phoenix Mind] Error processing message:', error);
      return {
        success: false,
        message: "I encountered an error processing that. Could you try rephrasing?",
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * ================================================================
   * GENESIS HANDLER - Self-Modification
   * ================================================================
   * Routes to Genesis for code analysis, optimization, deployment
   */
  async handleGenesisOperation(message, userId, intent) {
    console.log('[Phoenix Mind] Routing to GENESIS');

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Detect genesis operation type
    const operationType = this.detectGenesisOperation(message);

    // SOUL CHECK: Does this optimize life?
    const soulCheck = await this.doesOptimizeLife({
      type: 'genesis',
      operation: operationType,
      message
    }, user);

    if (!soulCheck.approved) {
      return {
        success: false,
        action: false,
        message: `I can't do that because: ${soulCheck.reason}`,
        soulRejected: true
      };
    }

    // Execute Genesis operation
    const result = await genesisCore.executeOperation(operationType, {
      description: message,
      context: { userId }
    }, user);

    return {
      success: result.success,
      action: true,
      type: 'genesis',
      operationId: result.operationId,
      message: this.generateGenesisResponse(result),
      result: result.result
    };
  }

  /**
   * ================================================================
   * BUTLER HANDLER - Execute Actions
   * ================================================================
   * Routes to Butler for reservations, rides, food orders, etc.
   */
  async handleButlerAction(message, userId, intent, options = {}) {
    console.log(`[Phoenix Mind] Routing to BUTLER: ${intent.action}`);

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // SOUL CHECK: Does this action optimize life?
    const soulCheck = await this.doesOptimizeLife({
      type: 'butler',
      action: intent.action,
      entities: intent.entities
    }, user);

    if (!soulCheck.approved) {
      return {
        success: false,
        action: false,
        message: `I can't do that because: ${soulCheck.reason}`,
        soulRejected: true
      };
    }

    // CHECK IF CONFIRMATION REQUIRED (high-stakes actions)
    const needsConfirmation = this.getConfirmationRequired(intent.action, intent.entities);

    if (needsConfirmation && !options.confirmed) {
      return {
        success: true,
        action: false,
        needsConfirmation: true,
        confirmationPrompt: this.generateConfirmationPrompt(intent),
        intent: intent
      };
    }

    // Execute Butler action
    let result;
    const handler = intentRouter.routeToHandler(intent, userId);

    switch (intent.action) {
      case 'order_food':
        result = await butlerAutomation.orderFood({
          userId,
          restaurant: intent.entities.restaurant || 'preferred restaurant',
          items: intent.entities.foodItems || []
        });
        break;

      case 'book_ride':
        result = await butlerAutomation.bookRide({
          userId,
          pickup: intent.entities.locations?.[0] || 'current location',
          destination: intent.entities.locations?.[1] || intent.entities.locations?.[0],
          rideType: intent.entities.service || 'uberX'
        });
        break;

      case 'reservation':
        result = await butlerAutomation.makeReservation({
          userId,
          restaurantName: intent.entities.restaurant || 'preferred restaurant',
          date: intent.entities.date || 'today',
          time: intent.entities.time || '7:00 PM',
          partySize: intent.entities.partySize || 2
        });
        break;

      // ================================================================
      // CONSCIOUSNESS HANDLERS - Notes, Health, Goals
      // ================================================================

      case 'notes':
        result = await this.handleNotesAction(userId, intent.entities);
        break;

      case 'health':
        result = await this.handleHealthAction(userId, intent.entities);
        break;

      case 'goals':
        result = await this.handleGoalsAction(userId, intent.entities);
        break;

      case 'content':
        result = await this.handleContentGeneration(message, userId, intent.entities);
        break;

      case 'genesis':
        // Route to Genesis for creation requests
        return await this.handleGenesisOperation(message, userId, intent);

      default:
        // UNIVERSAL AGENT FALLBACK
        // If we recognize an intent but don't have a built-in handler,
        // route to Universal Agent to figure it out dynamically
        console.log(`[Phoenix Mind] Unknown action "${intent.action}" - routing to Universal Agent`);
        return await this.handleUniversalAgent(message, userId, intent, options);
    }

    // Check if Butler needs more info
    if (result.needsCredentials) {
      return {
        success: false,
        action: false,
        type: 'butler',
        needsCredentials: true,
        services: result.services,
        message: result.message,
        sessionId: result.sessionId
      };
    }

    if (result.needsInfo) {
      return {
        success: false,
        action: false,
        type: 'butler',
        needsInfo: true,
        missing: result.missing,
        message: result.message,
        sessionId: result.sessionId
      };
    }

    if (result.needsGoogleLogin) {
      return {
        success: false,
        action: false,
        type: 'butler',
        needsGoogleLogin: true,
        message: result.message,
        sessionId: result.sessionId
      };
    }

    // Return result with sessionId for live view widget
    return {
      success: result.success,
      action: true,
      type: 'butler',
      sessionId: result.sessionId, // Use sessionId from butlerAutomation
      actionId: result.actionId,
      status: result.success ? 'completed' : (result.status || 'in_progress'),
      message: result.message,
      liveViewAvailable: result.liveViewAvailable || false,
      details: result
    };
  }

  /**
   * ================================================================
   * AI RESPONSE HANDLER - Conversational Intelligence
   * ================================================================
   * Generates AI response with full context from all planets
   */
  async handleAIResponse(message, userId, intent, options = {}) {
    console.log('[Phoenix Mind] Generating AI response with planet context');

    // 1. Get full context from all planets
    const context = await this.getFullContext(userId);

    // 2. Get conversation history
    const conversationHistory = await this.getConversationHistory(userId);

    // 3. Route through AI Router (handles Kimi/Gemini/Claude/GPT selection)
    // Include mode for mode-aware responses (voice=brief, genesis=detailed)
    const aiResponse = await aiRouter.route({
      userId,
      message,
      conversationHistory,
      context: {
        ...context,
        intent: intent.action,
        confidence: intent.confidence,
        mode: options.mode || 'manual' // Pass UI mode for adaptive responses
      }
    });

    // 4. Save conversation
    await this.saveConversation(userId, message, aiResponse.message);

    // 5. Return response
    return {
      success: true,
      action: false,
      message: aiResponse.message,
      source: aiResponse.source,
      responseTime: aiResponse.responseTime,
      confidence: aiResponse.confidence,
      ui: aiResponse.ui,
      uiManipulation: aiResponse.uiManipulation
    };
  }

  /**
   * ================================================================
   * UNIVERSAL AGENT HANDLER - Handle ANY Unknown Request
   * ================================================================
   * When Phoenix doesn't know how to do something, Universal Agent
   * figures it out dynamically by:
   * 1. Understanding the goal
   * 2. Researching how to accomplish it
   * 3. Creating a step-by-step plan
   * 4. Executing with vision-based Puppeteer
   * 5. Learning for instant replay next time
   */
  async handleUniversalAgent(message, userId, intent, options = {}) {
    console.log('[Phoenix Mind] Routing to UNIVERSAL AGENT');

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // SOUL CHECK: Does this optimize life?
    const soulCheck = await this.doesOptimizeLife({
      type: 'universal',
      action: intent.action,
      message: message
    }, user);

    if (!soulCheck.approved) {
      return {
        success: false,
        action: false,
        message: `I can't do that because: ${soulCheck.reason}`,
        soulRejected: true
      };
    }

    // Execute via Universal Agent
    const result = await universalAgent.processRequest(message, userId, options);

    // Log for consciousness stream
    console.log(`[Phoenix Mind] Universal Agent result:`, {
      success: result.success,
      type: result.type,
      learned: result.learned
    });

    return {
      ...result,
      consciousnessNote: result.learned
        ? 'I learned how to do this. Next time will be instant!'
        : undefined
    };
  }

  /**
   * ================================================================
   * GET FULL CONTEXT - Aggregate All Planet Data
   * ================================================================
   * Pulls latest data from all 8 planets to give AI full awareness
   */
  async getFullContext(userId) {
    console.log('[Phoenix Mind] Aggregating context from all planets');

    const context = {
      timestamp: new Date(),
      userId
    };

    try {
      // Run all planet queries in parallel for speed
      const [
        mercuryData,
        venusData,
        earthData,
        marsData,
        jupiterData,
        saturnData,
        uranusData,
        neptuneData
      ] = await Promise.allSettled([
        this.getMercuryContext(userId),
        this.getVenusContext(userId),
        this.getEarthContext(userId),
        this.getMarsContext(userId),
        this.getJupiterContext(userId),
        this.getSaturnContext(userId),
        this.getUranusContext(userId),
        this.getNeptuneContext(userId)
      ]);

      // Aggregate successful results
      if (mercuryData.status === 'fulfilled') context.mercury = mercuryData.value;
      if (venusData.status === 'fulfilled') context.venus = venusData.value;
      if (earthData.status === 'fulfilled') context.earth = earthData.value;
      if (marsData.status === 'fulfilled') context.mars = marsData.value;
      if (jupiterData.status === 'fulfilled') context.jupiter = jupiterData.value;
      if (saturnData.status === 'fulfilled') context.saturn = saturnData.value;
      if (uranusData.status === 'fulfilled') context.uranus = uranusData.value;
      if (neptuneData.status === 'fulfilled') context.neptune = neptuneData.value;

      console.log('[Phoenix Mind] Context aggregation complete');
      return context;

    } catch (error) {
      console.error('[Phoenix Mind] Error aggregating context:', error);
      return context; // Return partial context
    }
  }

  // ========================================
  // PLANET CONTEXT EXTRACTORS (WIRED TO REAL DATA)
  // ========================================

  /**
   * Helper: Call controller method without Express res object
   * Controllers expect (req, res) - we mock res to capture response
   */
  async callController(method, userId) {
    return new Promise((resolve, reject) => {
      const mockReq = { user: { id: userId } };
      const mockRes = {
        json: (data) => resolve(data),
        status: (code) => ({
          json: (data) => {
            if (code >= 400) reject(data);
            else resolve(data);
          }
        })
      };

      try {
        const result = method(mockReq, mockRes);
        if (result && result.catch) {
          result.catch(err => resolve(null)); // Graceful failure
        }
      } catch (err) {
        resolve(null); // Graceful failure
      }
    });
  }

  async getMercuryContext(userId) {
    // Mercury: Health, biometrics, sleep, recovery
    try {
      const [recovery, hrv, sleep, devices, readiness] = await Promise.allSettled([
        this.callController(mercuryController.getLatestRecovery, userId),
        this.callController(mercuryController.getHRV, userId),
        this.callController(mercuryController.getSleep, userId),
        this.callController(mercuryController.getDevices, userId),
        this.callController(mercuryController.getReadinessScore, userId)
      ]);

      return {
        planet: 'Mercury',
        domain: 'Health & Biometrics',
        recovery: recovery.status === 'fulfilled' ? recovery.value : null,
        hrv: hrv.status === 'fulfilled' ? hrv.value : null,
        sleep: sleep.status === 'fulfilled' ? sleep.value : null,
        devices: devices.status === 'fulfilled' ? devices.value : null,
        readiness: readiness.status === 'fulfilled' ? readiness.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Mercury context error:', error.message);
      return { planet: 'Mercury', error: error.message };
    }
  }

  async getVenusContext(userId) {
    // Venus: Fitness, workouts, nutrition
    try {
      const [workouts, nutrition, prs, templates] = await Promise.allSettled([
        this.callController(venusController.getWorkoutHistory, userId),
        this.callController(venusController.getMacroSummary, userId),
        this.callController(venusController.getPersonalRecords, userId),
        this.callController(venusController.getWorkoutTemplates, userId)
      ]);

      return {
        planet: 'Venus',
        domain: 'Fitness & Training',
        workouts: workouts.status === 'fulfilled' ? workouts.value : null,
        nutrition: nutrition.status === 'fulfilled' ? nutrition.value : null,
        personalRecords: prs.status === 'fulfilled' ? prs.value : null,
        templates: templates.status === 'fulfilled' ? templates.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Venus context error:', error.message);
      return { planet: 'Venus', error: error.message };
    }
  }

  async getEarthContext(userId) {
    // Earth: Calendar, energy patterns, schedule
    try {
      const [events, energy, optimal] = await Promise.allSettled([
        this.callController(earthController.getCalendarEvents, userId),
        this.callController(earthController.getEnergyPattern, userId),
        this.callController(earthController.getOptimalMeetingTimes, userId)
      ]);

      return {
        planet: 'Earth',
        domain: 'Time & Energy',
        events: events.status === 'fulfilled' ? events.value : null,
        energyPattern: energy.status === 'fulfilled' ? energy.value : null,
        optimalTimes: optimal.status === 'fulfilled' ? optimal.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Earth context error:', error.message);
      return { planet: 'Earth', error: error.message };
    }
  }

  async getMarsContext(userId) {
    // Mars: Goals, habits, progress
    try {
      const [goals, habits, progress] = await Promise.allSettled([
        this.callController(marsController.getGoals, userId),
        this.callController(marsController.getHabits, userId),
        this.callController(marsController.getProgress, userId)
      ]);

      return {
        planet: 'Mars',
        domain: 'Goals & Habits',
        goals: goals.status === 'fulfilled' ? goals.value : null,
        habits: habits.status === 'fulfilled' ? habits.value : null,
        progress: progress.status === 'fulfilled' ? progress.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Mars context error:', error.message);
      return { planet: 'Mars', error: error.message };
    }
  }

  async getJupiterContext(userId) {
    // Jupiter: Finance, wealth, investments
    try {
      const [accounts, transactions, budgets] = await Promise.allSettled([
        this.callController(jupiterController.getAccounts, userId),
        this.callController(jupiterController.getTransactions, userId),
        this.callController(jupiterController.getBudgets, userId)
      ]);

      return {
        planet: 'Jupiter',
        domain: 'Finance & Wealth',
        accounts: accounts.status === 'fulfilled' ? accounts.value : null,
        transactions: transactions.status === 'fulfilled' ? transactions.value : null,
        budgets: budgets.status === 'fulfilled' ? budgets.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Jupiter context error:', error.message);
      return { planet: 'Jupiter', error: error.message };
    }
  }

  async getSaturnContext(userId) {
    // Saturn: Legacy, long-term vision
    try {
      const [vision, reviews, mortality] = await Promise.allSettled([
        this.callController(saturnController.getVision, userId),
        this.callController(saturnController.getQuarterlyReviews, userId),
        this.callController(saturnController.getMortality, userId)
      ]);

      return {
        planet: 'Saturn',
        domain: 'Legacy & History',
        vision: vision.status === 'fulfilled' ? vision.value : null,
        quarterlyReviews: reviews.status === 'fulfilled' ? reviews.value : null,
        mortality: mortality.status === 'fulfilled' ? mortality.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Saturn context error:', error.message);
      return { planet: 'Saturn', error: error.message };
    }
  }

  async getUranusContext(userId) {
    // Uranus: Innovation, learning, skills
    try {
      const [insights, progress, patterns] = await Promise.allSettled([
        this.callController(uranusController.getInsights, userId),
        this.callController(uranusController.getLearningProgress, userId),
        this.callController(uranusController.getPatterns, userId)
      ]);

      return {
        planet: 'Uranus',
        domain: 'Innovation & Learning',
        insights: insights.status === 'fulfilled' ? insights.value : null,
        learningProgress: progress.status === 'fulfilled' ? progress.value : null,
        patterns: patterns.status === 'fulfilled' ? patterns.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Uranus context error:', error.message);
      return { planet: 'Uranus', error: error.message };
    }
  }

  async getNeptuneContext(userId) {
    // Neptune: Mindfulness, mood, meditation
    try {
      const [mindfulness, meditation, stress] = await Promise.allSettled([
        this.callController(neptuneController.getMindfulnessScore, userId),
        this.callController(neptuneController.getMeditationStats, userId),
        this.callController(neptuneController.getStressLevels, userId)
      ]);

      return {
        planet: 'Neptune',
        domain: 'Mindfulness & Wellbeing',
        mindfulnessScore: mindfulness.status === 'fulfilled' ? mindfulness.value : null,
        meditation: meditation.status === 'fulfilled' ? meditation.value : null,
        stressLevels: stress.status === 'fulfilled' ? stress.value : null
      };
    } catch (error) {
      console.error('[Phoenix Mind] Neptune context error:', error.message);
      return { planet: 'Neptune', error: error.message };
    }
  }

  /**
   * ================================================================
   * THE SOUL - Life Optimization Filter
   * ================================================================
   * Every action must pass through this. The conscience of Phoenix.
   */
  async doesOptimizeLife(action, user) {
    console.log('[Phoenix Mind] Running SOUL check:', action?.type);

    // BENIGN ACTIONS - auto-approve BEFORE try/catch to prevent errors
    const benignActions = ['notes', 'health', 'goals', 'calendar', 'email', 'content', 'genesis', 'conversation', 'ai_response'];
    if (action && action.action && benignActions.includes(action.action)) {
      console.log(`[Phoenix Mind] SOUL: ${action.action} is benign, auto-approved`);
      return { approved: true, reason: 'Safe action - auto-approved', soulScore: 0.9 };
    }

    try {

      // Use suffering/flourishing module for ethical validation (if method exists)
      let soulDecision = { flourishingScore: 0.8 };
      if (typeof sufferingFlourishing.evaluateAction === 'function') {
        soulDecision = await sufferingFlourishing.evaluateAction({
          action,
          user,
          context: {
            health: {}, // Would pull from Mercury
            goals: {},  // Would pull from Mars
            patterns: {} // Would pull from Neptune
          }
        });
      }

      // High-level rules: Never harm user
      const harmfulPatterns = [
        /delete.*everything/i,
        /cancel.*all/i,
        /spend.*all.*money/i,
        /max.*credit card/i
      ];

      const isHarmful = harmfulPatterns.some(pattern =>
        pattern.test(action.message || '')
      );

      if (isHarmful) {
        return {
          approved: false,
          reason: 'This action could be harmful to your wellbeing'
        };
      }

      // Genesis operations: Only allow if safe
      if (action.type === 'genesis') {
        const isSafe = ['analysis', 'optimization'].includes(action.operation);
        if (!isSafe) {
          return {
            approved: false,
            reason: 'This Genesis operation requires manual approval for safety'
          };
        }
      }

      return {
        approved: true,
        reason: 'Action aligns with life optimization',
        soulScore: soulDecision.flourishingScore || 0.8
      };

    } catch (error) {
      console.error('[Phoenix Mind] Soul check error:', error);
      // Fail closed: if soul check errors, deny action
      return {
        approved: false,
        reason: 'Unable to validate action safety'
      };
    }
  }

  /**
   * ================================================================
   * CONFIRMATION REQUIRED - High-Stakes Actions
   * ================================================================
   * Returns true if action needs user confirmation
   */
  getConfirmationRequired(action, entities) {
    // High-stakes actions that need confirmation
    const highStakesActions = [
      'deploy',
      'finance',
      'travel'
    ];

    if (highStakesActions.includes(action)) {
      return true;
    }

    // Large financial transactions
    if (action === 'finance' && entities.amount > 100) {
      return true;
    }

    // International travel
    if (action === 'travel' && entities.type === 'flight') {
      return true;
    }

    return false;
  }

  /**
   * ================================================================
   * HELPER METHODS
   * ================================================================
   */

  isGenesisIntent(message) {
    const genesisPatterns = [
      /analyze.*code/i,
      /optimize.*code/i,
      /fix.*bug/i,
      /deploy.*to.*production/i,
      /refactor/i,
      /genesis/i,
      /self.*improve/i,
      /modify.*yourself/i
    ];

    return genesisPatterns.some(pattern => pattern.test(message));
  }

  detectGenesisOperation(message) {
    if (/analyze/i.test(message)) return 'analysis';
    if (/optimize/i.test(message)) return 'optimization';
    if (/deploy/i.test(message)) return 'deployment';
    if (/fix/i.test(message)) return 'code_generation';
    return 'analysis';
  }

  generateGenesisResponse(result) {
    if (!result.success) {
      return `Genesis operation failed: ${result.error}`;
    }

    const { operationType, result: data } = result;

    switch (operationType) {
      case 'analysis':
        return `Code analysis complete. Found ${data.issues?.length || 0} issues. ${data.fixable || 0} are auto-fixable.`;
      case 'optimization':
        return `Optimization complete. Fixed ${data.fixed || 0} issues across ${data.filesChanged?.length || 0} files.`;
      default:
        return `Genesis operation ${operationType} completed successfully.`;
    }
  }

  generateConfirmationPrompt(intent) {
    const { action, entities } = intent;

    switch (action) {
      case 'finance':
        return `Confirm: Send $${entities.amount} to ${entities.recipient}?`;
      case 'deploy':
        return `Confirm: Deploy ${entities.project} to ${entities.environment}?`;
      case 'travel':
        return `Confirm: Book ${entities.type} from ${entities.origin} to ${entities.destination}?`;
      default:
        return `Confirm: Proceed with ${action}?`;
    }
  }

  async getConversationHistory(userId, limit = 10) {
    try {
      const history = await ConversationHistory.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      return history.reverse().map(h => ({
        role: h.role,
        content: h.message,
        timestamp: h.timestamp
      }));
    } catch (error) {
      console.error('[Phoenix Mind] Error fetching conversation history:', error);
      return [];
    }
  }

  async saveConversation(userId, userMessage, aiMessage) {
    try {
      await ConversationHistory.create([
        { userId, role: 'user', message: userMessage, timestamp: new Date() },
        { userId, role: 'assistant', message: aiMessage, timestamp: new Date() }
      ]);
    } catch (error) {
      console.error('[Phoenix Mind] Error saving conversation:', error);
    }
  }

  /**
   * ================================================================
   * STATUS & HEALTH
   * ================================================================
   */
  async getStatus() {
    return {
      name: this.name,
      version: this.version,
      consciousness: this.consciousness,
      status: 'operational',
      planets: {
        mercury: 'operational',
        venus: 'operational',
        earth: 'operational',
        mars: 'operational',
        jupiter: 'operational',
        saturn: 'operational',
        uranus: 'operational',
        neptune: 'operational'
      },
      services: {
        butler: 'operational',
        genesis: 'operational',
        ai: 'operational'
      },
      timestamp: new Date()
    };
  }

  // ================================================================
  // CONSCIOUSNESS HANDLERS - Notes, Health, Goals
  // ================================================================

  /**
   * Handle notes/memory actions - save, list, delete
   */
  async handleNotesAction(userId, entities) {
    const { action, content } = entities;

    try {
      switch (action) {
        case 'list':
          const notes = await Note.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          if (notes.length === 0) {
            return {
              success: true,
              message: "You don't have any notes yet. Say 'remember [something]' to save one."
            };
          }

          const noteList = notes.map((n, i) =>
            `${i + 1}. ${n.content.substring(0, 60)}${n.content.length > 60 ? '...' : ''}`
          ).join('\n');

          return {
            success: true,
            message: `Here are your recent notes:\n\n${noteList}`
          };

        case 'create':
          if (!content) {
            return {
              success: false,
              message: "What would you like me to remember?"
            };
          }

          await Note.create({
            userId,
            content,
            source: 'voice'
          });

          return {
            success: true,
            message: `Got it! I'll remember: "${content}"`
          };

        case 'delete':
          return {
            success: true,
            message: "To delete notes, go to DESK mode > NOTES tab."
          };

        default:
          return {
            success: true,
            message: "I can save notes for you. Try 'remember to call John' or 'show my notes'."
          };
      }
    } catch (error) {
      console.error('[Phoenix Mind] Notes error:', error);
      return {
        success: false,
        message: "I had trouble with that note. Please try again."
      };
    }
  }

  /**
   * Handle health tracking - weight, sleep, calories, steps, water
   */
  async handleHealthAction(userId, entities) {
    const { type, value, unit } = entities;

    if (!type || value === undefined) {
      return {
        success: false,
        message: "I didn't catch that. Try 'log weight 185 lbs' or 'slept 8 hours'."
      };
    }

    try {
      // Save to HealthMetric model
      await HealthMetric.create({
        userId,
        type,
        value,
        unit: unit || this.getDefaultUnit(type),
        source: 'manual',
        timestamp: new Date()
      });

      const messages = {
        weight: `Logged weight: ${value} ${unit || 'lbs'}`,
        sleep: `Logged sleep: ${value} hours`,
        calories: `Logged calories: ${value} kcal`,
        water: `Logged water: ${value} glasses`,
        steps: `Logged steps: ${value}`
      };

      return {
        success: true,
        message: messages[type] || `Logged ${type}: ${value}`
      };
    } catch (error) {
      console.error('[Phoenix Mind] Health tracking error:', error);
      return {
        success: false,
        message: "I had trouble logging that. Please try again."
      };
    }
  }

  getDefaultUnit(type) {
    const units = {
      weight: 'lbs',
      sleep: 'hours',
      calories: 'kcal',
      water: 'glasses',
      steps: 'steps'
    };
    return units[type] || '';
  }

  /**
   * Handle goals/habits - create, complete, list
   */
  async handleGoalsAction(userId, entities) {
    const { action, name } = entities;

    try {
      switch (action) {
        case 'list':
          const goals = await Goal.find({ clientId: userId, completed: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          if (goals.length === 0) {
            return {
              success: true,
              message: "You don't have any active goals. Say 'set goal: [your goal]' to create one."
            };
          }

          const goalList = goals.map((g, i) => {
            const progress = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
            return `${i + 1}. ${g.name} (${progress}% complete)`;
          }).join('\n');

          return {
            success: true,
            message: `Your active goals:\n\n${goalList}`
          };

        case 'create':
          if (!name) {
            return {
              success: false,
              message: "What goal would you like to set?"
            };
          }

          // Goal schema requires: name, clientId, assignedBy, createdBy, target, deadline
          const oneMonthFromNow = new Date();
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

          await Goal.create({
            name: name,
            clientId: userId,
            assignedBy: userId,
            createdBy: userId,
            target: 100,
            current: 0,
            deadline: oneMonthFromNow,
            isHabit: name.toLowerCase().includes('daily') || name.toLowerCase().includes('weekly')
          });

          return {
            success: true,
            message: `Goal created: "${name}". I'll help you track it!`
          };

        case 'complete':
          if (!name) {
            return {
              success: false,
              message: "Which goal did you complete?"
            };
          }

          const completedGoal = await Goal.findOneAndUpdate(
            { clientId: userId, name: { $regex: name, $options: 'i' }, completed: false },
            { completed: true, completedDate: new Date(), current: 100 },
            { new: true }
          );

          if (!completedGoal) {
            return {
              success: false,
              message: `Couldn't find an active goal matching "${name}".`
            };
          }

          return {
            success: true,
            message: `Congratulations! Marked "${completedGoal.name}" as complete!`
          };

        default:
          return {
            success: true,
            message: "I can help with goals. Try 'set goal: exercise 3x weekly' or 'show my goals'."
          };
      }
    } catch (error) {
      console.error('[Phoenix Mind] Goals error:', error);
      return {
        success: false,
        message: "I had trouble with that goal. Please try again."
      };
    }
  }

  /**
   * Handle content generation - business plans, letters, reports, etc.
   * Uses AI to generate content, then saves to Document model
   */
  async handleContentGeneration(message, userId, entities) {
    const { contentType, topic } = entities;

    console.log(`[Phoenix Mind] Content generation: type=${contentType}, topic=${topic}`);

    if (!topic) {
      return {
        success: false,
        message: "What would you like me to write about? Try 'write a business plan for a food truck in Miami'."
      };
    }

    try {
      // Determine document type and title
      const docType = contentType || 'document';
      const title = this.generateDocumentTitle(docType, topic);

      // Generate content using AI router
      const prompt = this.buildContentPrompt(docType, topic, message);

      const aiResponse = await aiRouter.route({
        userId,
        message: prompt,
        conversationHistory: [],
        context: {
          task: 'content_generation',
          documentType: docType,
          topic: topic
        }
      });

      if (!aiResponse || !aiResponse.message) {
        return {
          success: false,
          message: "I couldn't generate that content. Please try again."
        };
      }

      // Save to Document model
      const document = await Document.create({
        userId,
        title,
        content: aiResponse.message,
        type: this.mapContentType(docType),
        source: 'phoenix',
        tags: this.extractTags(topic)
      });

      console.log(`[Phoenix Mind] Document saved: ${document._id}`);

      return {
        success: true,
        documentId: document._id,
        title: title,
        message: `Created "${title}" and saved to your documents. Would you like me to read it to you or make any changes?`,
        preview: aiResponse.message.substring(0, 200) + '...'
      };

    } catch (error) {
      console.error('[Phoenix Mind] Content generation error:', error);
      return {
        success: false,
        message: "I had trouble creating that document. Please try again."
      };
    }
  }

  /**
   * Generate a clean title for the document
   */
  generateDocumentTitle(type, topic) {
    const typeLabels = {
      business_plan: 'Business Plan',
      plan: 'Plan',
      letter: 'Letter',
      email: 'Email Draft',
      proposal: 'Proposal',
      report: 'Report',
      summary: 'Summary',
      analysis: 'Analysis',
      essay: 'Essay',
      outline: 'Outline',
      draft: 'Draft',
      document: 'Document'
    };

    const label = typeLabels[type] || 'Document';

    // Clean up topic for title
    const cleanTopic = topic
      .replace(/^(a |an |the )/i, '')
      .replace(/\b(for|about|on|regarding)\b/gi, '')
      .trim()
      .split(' ')
      .slice(0, 5)
      .join(' ');

    // Capitalize first letter of each word
    const titleCase = cleanTopic.replace(/\b\w/g, l => l.toUpperCase());

    return `${label}: ${titleCase}`;
  }

  /**
   * Build a prompt for content generation
   */
  buildContentPrompt(type, topic, originalMessage) {
    const prompts = {
      business_plan: `Create a comprehensive business plan for: ${topic}

Include these sections:
1. Executive Summary
2. Business Description
3. Market Analysis
4. Products/Services
5. Marketing Strategy
6. Operations Plan
7. Financial Projections
8. Funding Requirements

Make it professional, detailed, and actionable.`,

      letter: `Write a professional letter about: ${topic}

Include proper formatting with date, greeting, body paragraphs, and closing.`,

      email: `Draft a professional email about: ${topic}

Include subject line, greeting, clear message body, and appropriate sign-off.`,

      proposal: `Create a detailed proposal for: ${topic}

Include: Executive Summary, Problem Statement, Proposed Solution, Timeline, Budget, and Next Steps.`,

      report: `Write a comprehensive report on: ${topic}

Include: Introduction, Methodology, Findings, Analysis, Conclusions, and Recommendations.`,

      summary: `Provide a clear, concise summary of: ${topic}`,

      analysis: `Conduct a thorough analysis of: ${topic}

Include: Background, Key Factors, SWOT Analysis (if applicable), Findings, and Recommendations.`,

      essay: `Write a well-structured essay about: ${topic}

Include: Introduction with thesis, supporting paragraphs, and conclusion.`,

      outline: `Create a detailed outline for: ${topic}

Use hierarchical structure with main points and sub-points.`,

      default: `Create content about: ${topic}

Based on the request: "${originalMessage}"

Make it clear, professional, and well-organized.`
    };

    return prompts[type] || prompts.default;
  }

  /**
   * Map content type string to Document model enum
   */
  mapContentType(type) {
    const mapping = {
      business_plan: 'business_plan',
      plan: 'other',
      letter: 'letter',
      email: 'draft',
      proposal: 'proposal',
      report: 'report',
      summary: 'other',
      analysis: 'other',
      essay: 'essay',
      outline: 'other',
      draft: 'draft',
      document: 'other'
    };
    return mapping[type] || 'other';
  }

  /**
   * Extract relevant tags from topic
   */
  extractTags(topic) {
    const words = topic.toLowerCase().split(/\s+/);
    const stopWords = ['a', 'an', 'the', 'for', 'in', 'on', 'at', 'to', 'of', 'and', 'or'];
    return words
      .filter(w => w.length > 3 && !stopWords.includes(w))
      .slice(0, 5);
  }
}

// Singleton export
module.exports = new PhoenixMind();
