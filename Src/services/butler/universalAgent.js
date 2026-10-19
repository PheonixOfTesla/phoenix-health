/**
 * ================================================================
 * PHOENIX BUTLER - UNIVERSAL AGENT
 * ================================================================
 *
 * The ultimate browser automation engine that can execute ANY task.
 * This agent combines AI planning with vision-guided execution to
 * handle requests it has never seen before.
 *
 * CAPABILITIES:
 * - Natural language task understanding
 * - AI-powered step decomposition
 * - Vision-based element detection
 * - Credential management from vault
 * - Live screenshot streaming
 * - Self-learning workflow storage
 *
 * EXAMPLES:
 * - "Create a Facebook account"
 * - "Book a flight to Miami next Tuesday"
 * - "Order groceries from Instacart"
 * - "Send $50 to John on Venmo"
 * - "Find the cheapest hotel in NYC"
 *
 * ================================================================
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { EventEmitter } = require('events');
const sessionManager = require('./sessionManager');
const User = require('../../models/User');
const LearnedWorkflow = require('../../models/phoenix/LearnedWorkflow');
const { browserlessService } = require('./browserless');

// AI providers
let claudeConscious, optimalMind;
try {
  claudeConscious = require('../claude/consciousMind');
  optimalMind = require('../ai/optimalMind');
} catch (e) {
  console.warn('[UniversalAgent] AI providers not fully available');
}

// Capability manifest for AI-first routing
const { CAPABILITY_MANIFEST, getCapabilityPrompt } = require('./capabilityManifest');

// CONSCIOUSNESS INTEGRATION - Butler uses the BRAIN for intelligent failure handling
let brain, causalReasoning, decisionEngine, metaCognition, proceduralMemory;
try {
  brain = require('../consciousness/brain');
  causalReasoning = brain.causalReasoning;
  decisionEngine = brain.decisionEngine;
  metaCognition = brain.metaCognition;
  proceduralMemory = brain.memory.proceduralMemory;
  console.log('[UniversalAgent] Consciousness brain modules loaded - INTELLIGENT MODE');
} catch (e) {
  console.warn('[UniversalAgent] Brain modules not available, using basic mode');
}

puppeteer.use(StealthPlugin());

// Constants
const MAX_STEPS = 50;
const STEP_TIMEOUT = 30000;
const VISION_RETRY_ATTEMPTS = 3;
const CONSCIOUS_RETRY_ATTEMPTS = 3; // Retry with consciousness analysis

/**
 * ================================================================
 * COMPREHENSIVE TASK ANALYZER - Smart Question Generation
 * ================================================================
 * Analyzes ANY task and identifies what info is needed BEFORE execution.
 * This ensures Butler always asks clarifying questions.
 */
const TASK_PATTERNS = {
  // Food/Delivery tasks
  food: {
    patterns: ['order', 'pizza', 'food', 'doordash', 'ubereats', 'grubhub', 'postmates', 'delivery', 'restaurant', 'takeout', 'pickup'],
    requiredFields: [
      { field: 'what_to_order', question: 'What would you like to order?', type: 'text', detectIn: ['order', 'pizza', 'food'] },
      { field: 'restaurant', question: 'From which restaurant or place?', type: 'text', optional: true },
      { field: 'delivery_address', question: "What's the delivery address?", type: 'address' }
    ]
  },
  // Ride/Transportation tasks
  ride: {
    patterns: ['uber', 'lyft', 'ride', 'taxi', 'cab', 'car service', 'pick me up', 'drop me off', 'take me to'],
    requiredFields: [
      { field: 'pickup_address', question: 'Where should I pick you up from?', type: 'address' },
      { field: 'destination', question: 'Where are you heading to?', type: 'address' },
      { field: 'ride_type', question: 'What type of ride? (Standard, XL, Black, etc.)', type: 'text', optional: true }
    ]
  },
  // Restaurant reservation tasks
  reservation: {
    patterns: ['reservation', 'book a table', 'opentable', 'resy', 'dinner reservation', 'restaurant booking'],
    requiredFields: [
      { field: 'restaurant_name', question: 'Which restaurant?', type: 'text' },
      { field: 'date', question: 'What date?', type: 'date' },
      { field: 'time', question: 'What time?', type: 'time' },
      { field: 'party_size', question: 'How many people in your party?', type: 'number' }
    ]
  },
  // Flight/Travel booking
  flight: {
    patterns: ['flight', 'book a flight', 'fly to', 'airline', 'plane ticket', 'travel to'],
    requiredFields: [
      { field: 'departure_city', question: 'Where are you departing from?', type: 'text' },
      { field: 'destination_city', question: 'Where are you flying to?', type: 'text' },
      { field: 'departure_date', question: 'When do you want to depart?', type: 'date' },
      { field: 'return_date', question: 'When do you want to return? (Leave blank for one-way)', type: 'date', optional: true },
      { field: 'passengers', question: 'How many passengers?', type: 'number', optional: true }
    ]
  },
  // Hotel booking
  hotel: {
    patterns: ['hotel', 'book a room', 'accommodation', 'airbnb', 'stay in', 'lodging'],
    requiredFields: [
      { field: 'location', question: 'What city/location?', type: 'text' },
      { field: 'checkin_date', question: 'Check-in date?', type: 'date' },
      { field: 'checkout_date', question: 'Check-out date?', type: 'date' },
      { field: 'guests', question: 'How many guests?', type: 'number', optional: true }
    ]
  },
  // Shopping/Purchase tasks
  shopping: {
    patterns: ['buy', 'purchase', 'order from amazon', 'shop for', 'add to cart', 'checkout'],
    requiredFields: [
      { field: 'item', question: 'What would you like to buy?', type: 'text' },
      { field: 'quantity', question: 'How many?', type: 'number', optional: true },
      { field: 'shipping_address', question: 'What shipping address?', type: 'address' }
    ]
  },
  // Email tasks
  email: {
    patterns: ['send email', 'compose email', 'write email', 'email to', 'send message to'],
    requiredFields: [
      { field: 'recipient', question: 'Who should I send this to? (email address)', type: 'email' },
      { field: 'subject', question: "What's the subject line?", type: 'text', optional: true },
      { field: 'message', question: 'What should the message say?', type: 'text' }
    ]
  },
  // SMS/Text tasks
  sms: {
    patterns: ['send text', 'text to', 'send sms', 'message to', 'send a message'],
    requiredFields: [
      { field: 'phone_number', question: 'What phone number should I text?', type: 'phone' },
      { field: 'message', question: 'What should the message say?', type: 'text' }
    ]
  },
  // Call tasks
  call: {
    patterns: ['call', 'phone call', 'dial', 'ring'],
    requiredFields: [
      { field: 'phone_number', question: 'What number should I call?', type: 'phone' },
      { field: 'purpose', question: "What's the purpose of the call?", type: 'text', optional: true }
    ]
  },
  // Appointment/Calendar tasks
  appointment: {
    patterns: ['schedule', 'appointment', 'meeting', 'calendar', 'set up a call', 'book time'],
    requiredFields: [
      { field: 'event_title', question: 'What should I call this event?', type: 'text' },
      { field: 'date', question: 'What date?', type: 'date' },
      { field: 'time', question: 'What time?', type: 'time' },
      { field: 'duration', question: 'How long? (e.g., 30 min, 1 hour)', type: 'text', optional: true },
      { field: 'attendees', question: 'Who should I invite? (email addresses)', type: 'text', optional: true }
    ]
  },
  // Search/Research tasks
  search: {
    patterns: ['search for', 'find', 'look up', 'research', 'google'],
    requiredFields: [
      { field: 'search_query', question: 'What should I search for?', type: 'text' }
    ]
  },
  // Send flowers/gifts
  flowers: {
    patterns: ['flowers', 'send flowers', 'bouquet', 'gift', 'send a gift'],
    requiredFields: [
      { field: 'recipient_name', question: "Who is this for?", type: 'text' },
      { field: 'delivery_address', question: "What's the delivery address?", type: 'address' },
      { field: 'delivery_date', question: 'When should it arrive?', type: 'date' },
      { field: 'message', question: 'What should the card say?', type: 'text', optional: true }
    ]
  }
};

/**
 * Analyze a task and return what information is needed
 * @param {string} task - The task description
 * @param {Object} providedInfo - Info already provided by user
 * @returns {Object} Analysis result with missing info
 */
function analyzeTaskRequirements(task, providedInfo = {}) {
  const lowerTask = task.toLowerCase();
  const providedFields = Object.keys(providedInfo);
  const missingInfo = [];
  let matchedCategory = null;
  let confidence = 0;

  // Check each task pattern
  for (const [category, config] of Object.entries(TASK_PATTERNS)) {
    const matchCount = config.patterns.filter(p => lowerTask.includes(p)).length;
    if (matchCount > 0 && matchCount >= confidence) {
      confidence = matchCount;
      matchedCategory = category;
    }
  }

  if (!matchedCategory) {
    // Generic unknown task - ask for clarification
    return {
      category: 'unknown',
      missingInfo: [{
        field: 'clarification',
        question: `I want to help you with "${task}". Can you provide more details about what you'd like me to do?`,
        type: 'text'
      }],
      summary: 'Task needs clarification'
    };
  }

  const taskConfig = TASK_PATTERNS[matchedCategory];

  // Check which required fields are missing
  for (const field of taskConfig.requiredFields) {
    // Skip optional fields initially
    if (field.optional) continue;

    // Check if already provided in additionalInfo
    if (providedFields.includes(field.field)) continue;

    // Check if the info is embedded in the task description
    let foundInTask = false;

    // Smart extraction based on field type
    if (field.type === 'address') {
      // Check for address-like patterns
      const addressPatterns = [
        /(?:to|at|from)\s+(\d+[^,]+(?:street|st|ave|avenue|road|rd|blvd|boulevard|way|drive|dr|lane|ln|court|ct|place|pl)[^,]*)/i,
        /(\d+\s+\w+\s+(?:street|st|ave|avenue|road|rd|blvd|boulevard|way|drive|dr|lane|ln)[^,]*,?\s*[^,]*)/i
      ];
      foundInTask = addressPatterns.some(p => p.test(task));
    } else if (field.type === 'email') {
      foundInTask = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(task);
    } else if (field.type === 'phone') {
      foundInTask = /[\d\s\-\(\)]{10,}/.test(task);
    } else if (field.type === 'date') {
      const datePatterns = [
        /today|tomorrow|next\s+\w+day|this\s+\w+day/i,
        /\d{1,2}\/\d{1,2}(\/\d{2,4})?/,
        /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i
      ];
      foundInTask = datePatterns.some(p => p.test(task));
    } else if (field.type === 'time') {
      foundInTask = /\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i.test(task);
    } else if (field.type === 'number') {
      // Check for explicit numbers
      foundInTask = /\d+\s*(people|person|guests?|party|passengers?|items?|tickets?)/i.test(task);
    } else if (field.type === 'text' && field.detectIn) {
      // For general text fields, check if specific words suggest it's already in the task
      // Example: "order pizza" already contains "pizza" which answers "what to order"
      foundInTask = field.detectIn.some(word => !lowerTask.includes(word));
    }

    if (!foundInTask) {
      missingInfo.push({
        field: field.field,
        question: field.question,
        type: field.type
      });
    }
  }

  return {
    category: matchedCategory,
    missingInfo,
    summary: `${matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1)} task detected`,
    allFieldsProvided: missingInfo.length === 0
  };
}

/**
 * ================================================================
 * AUTOMATION FEASIBILITY DATABASE
 * ================================================================
 * Known limitations for sites/actions that are hard or impossible to automate.
 * Butler will warn users BEFORE attempting these tasks.
 */
const AUTOMATION_BLOCKERS = {
  // Sites with aggressive anti-bot protection
  hardSites: {
    facebook: {
      patterns: ['facebook', 'fb.com', 'meta.com'],
      actions: ['create account', 'sign up', 'register', 'new account'],
      blockers: ['CAPTCHA (reCAPTCHA v3)', 'Phone verification required', 'Device fingerprinting', 'Behavior analysis'],
      successRate: 5,
      recommendation: 'Create Facebook accounts manually - takes 2-3 minutes. Facebook specifically blocks automation.'
    },
    google: {
      patterns: ['google', 'gmail', 'youtube account'],
      actions: ['create account', 'sign up', 'register', 'new account'],
      blockers: ['CAPTCHA', 'Phone verification required', 'Advanced bot detection'],
      successRate: 5,
      recommendation: 'Create Google accounts manually at accounts.google.com'
    },
    instagram: {
      patterns: ['instagram', 'ig.com'],
      actions: ['create account', 'sign up', 'register', 'new account'],
      blockers: ['Phone verification required', 'Email verification', 'Rate limiting', 'IP blocking'],
      successRate: 10,
      recommendation: 'Instagram requires phone verification for new accounts.'
    },
    twitter: {
      patterns: ['twitter', 'x.com'],
      actions: ['create account', 'sign up', 'register', 'new account'],
      blockers: ['Phone verification required', 'CAPTCHA', 'Email verification'],
      successRate: 15,
      recommendation: 'Twitter/X requires phone or email verification.'
    },
    linkedin: {
      patterns: ['linkedin'],
      actions: ['create account', 'sign up', 'register', 'new account'],
      blockers: ['Email verification', 'Phone verification on suspicious activity', 'CAPTCHA'],
      successRate: 20,
      recommendation: 'LinkedIn may work but often requires email verification.'
    },
    banking: {
      patterns: ['bank', 'chase', 'wells fargo', 'bofa', 'citi', 'capital one', 'venmo', 'paypal', 'zelle'],
      actions: ['create account', 'sign up', 'open account', 'transfer', 'send money'],
      blockers: ['2FA required', 'SSN verification', 'Identity verification', 'Security questions'],
      successRate: 0,
      recommendation: 'Banking requires identity verification and 2FA. Must be done manually for security.'
    },
    amazon: {
      patterns: ['amazon'],
      actions: ['create account', 'sign up', 'register'],
      blockers: ['CAPTCHA', 'Email verification', 'Phone verification for purchases'],
      successRate: 25,
      recommendation: 'Amazon account creation may work but purchases require verification.'
    }
  },

  // Actions that generally require human interaction
  hardActions: {
    captcha: {
      patterns: ['captcha', 'verify human', 'not a robot'],
      blockers: ['No CAPTCHA solving service integrated'],
      successRate: 0,
      recommendation: 'CAPTCHA solving is not supported. Tasks requiring CAPTCHA will fail.'
    },
    phoneVerification: {
      patterns: ['phone verification', 'sms code', 'verify phone', 'text code'],
      blockers: ['No phone/SMS integration for receiving codes'],
      successRate: 0,
      recommendation: 'Butler cannot receive SMS verification codes.'
    },
    twoFactor: {
      patterns: ['2fa', 'two factor', 'authenticator', 'security code'],
      blockers: ['Cannot access authenticator apps'],
      successRate: 0,
      recommendation: '2FA requires manual intervention with your authenticator app.'
    },
    payment: {
      patterns: ['pay', 'checkout', 'purchase', 'buy', 'order'],
      blockers: ['Requires payment confirmation', 'May trigger fraud detection'],
      successRate: 50,
      recommendation: 'Payments may work but often require additional verification. Confirm you want to proceed.',
      requiresConfirmation: true
    }
  },

  // Sites that work well with automation
  easySites: ['wikipedia', 'reddit', 'yelp', 'tripadvisor', 'weather', 'news sites', 'blogs']
};

/**
 * Check if a task is likely to fail and return warnings
 * @param {string} task - The task description
 * @returns {Object} Feasibility assessment
 */
function checkFeasibility(task) {
  const lowerTask = task.toLowerCase();
  const warnings = [];
  let overallSuccessRate = 80; // Default optimistic
  let canProceed = true;
  let requiresConfirmation = false;
  let recommendation = null;

  // Check hard sites
  for (const [siteName, config] of Object.entries(AUTOMATION_BLOCKERS.hardSites)) {
    const matchesSite = config.patterns.some(p => lowerTask.includes(p));
    const matchesAction = config.actions.some(a => lowerTask.includes(a));

    if (matchesSite && matchesAction) {
      warnings.push({
        type: 'hard_site',
        site: siteName,
        blockers: config.blockers,
        successRate: config.successRate,
        recommendation: config.recommendation
      });
      overallSuccessRate = Math.min(overallSuccessRate, config.successRate);
      recommendation = config.recommendation;

      if (config.successRate === 0) {
        canProceed = false;
      }
    }
  }

  // Check hard actions
  for (const [actionName, config] of Object.entries(AUTOMATION_BLOCKERS.hardActions)) {
    const matchesAction = config.patterns.some(p => lowerTask.includes(p));

    if (matchesAction) {
      warnings.push({
        type: 'hard_action',
        action: actionName,
        blockers: config.blockers,
        successRate: config.successRate,
        recommendation: config.recommendation
      });
      overallSuccessRate = Math.min(overallSuccessRate, config.successRate);

      if (config.requiresConfirmation) {
        requiresConfirmation = true;
      }

      if (config.successRate === 0 && !recommendation) {
        recommendation = config.recommendation;
      }
    }
  }

  return {
    feasible: canProceed,
    successRate: overallSuccessRate,
    warnings,
    requiresConfirmation,
    recommendation,
    message: warnings.length > 0
      ? `This task has a ${overallSuccessRate}% chance of success due to: ${warnings.map(w => w.blockers[0]).join(', ')}`
      : null
  };
}

/**
 * ================================================================
 * UNIVERSAL AGENT CLASS
 * ================================================================
 */
class UniversalAgent extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map();
    this.executionHistory = new Map();
  }

  /**
   * ================================================================
   * MAIN ENTRY POINT: Execute ANY browser task
   * ================================================================
   *
   * @param {String} userId - User ID
   * @param {String} taskDescription - Natural language task description
   * @param {Object} options - Execution options
   * @returns {Object} Execution result
   */
  async executeTask(userId, taskDescription, options = {}) {
    const startTime = Date.now();
    const sessionId = `universal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[UniversalAgent] NEW TASK: "${taskDescription}"`);
    console.log(`[UniversalAgent] User: ${userId} | Session: ${sessionId}`);
    console.log(`${'='.repeat(70)}\n`);

    this.emit('task:started', { userId, sessionId, taskDescription });

    try {
      // Step 0: FEASIBILITY CHECK - Warn user about likely failures BEFORE attempting
      const feasibility = checkFeasibility(taskDescription);

      if (feasibility.warnings.length > 0) {
        console.log(`[UniversalAgent] ⚠️  FEASIBILITY WARNING: ${feasibility.message}`);
        console.log(`[UniversalAgent] Success rate: ${feasibility.successRate}%`);
        feasibility.warnings.forEach(w => {
          console.log(`[UniversalAgent]   - ${w.type}: ${w.blockers.join(', ')}`);
        });

        // If success rate is very low and user hasn't acknowledged, warn them
        if (feasibility.successRate <= 20 && !options.acknowledgedWarning) {
          return {
            success: false,
            feasibilityWarning: true,
            successRate: feasibility.successRate,
            warnings: feasibility.warnings,
            message: feasibility.message,
            recommendation: feasibility.recommendation,
            blockers: feasibility.warnings.flatMap(w => w.blockers),
            canProceed: feasibility.feasible,
            sessionId,
            // Tell frontend how to proceed anyway
            proceedOption: feasibility.feasible
              ? 'Add "acknowledgedWarning: true" to proceed despite low success rate'
              : 'This task cannot be automated. Please complete it manually.'
          };
        }

        // If completely infeasible, don't even try
        if (!feasibility.feasible) {
          return {
            success: false,
            feasibilityWarning: true,
            successRate: 0,
            message: `Cannot automate this task: ${feasibility.recommendation}`,
            recommendation: feasibility.recommendation,
            blockers: feasibility.warnings.flatMap(w => w.blockers),
            canProceed: false,
            sessionId
          };
        }
      }

      // Step 1: Check for existing learned workflow (skip if option set or workflow is bad)
      if (!options.skipLearned) {
        const learned = await this.checkLearnedWorkflows(taskDescription, userId);
        if (learned && learned.steps?.length > 0 && learned.metrics?.successRate > 0.3) {
          console.log(`[UniversalAgent] Found learned workflow: ${learned.name} (success rate: ${(learned.metrics.successRate * 100).toFixed(0)}%)`);
          return await this.executeLearnedWorkflow(learned, userId, sessionId, options);
        } else if (learned) {
          console.log(`[UniversalAgent] Skipping low-quality workflow: ${learned.name} (success rate: ${(learned.metrics?.successRate * 100 || 0).toFixed(0)}%)`);
        }
      } else {
        console.log('[UniversalAgent] Skipping learned workflows (skipLearned=true)');
      }

      // Step 2: Plan the task using AI
      const plan = await this.planTask(taskDescription, userId, options);
      console.log(`[UniversalAgent] Generated ${plan.steps?.length || 0}-step plan`);
      this.emit('task:planned', { userId, sessionId, plan });

      // Step 3: Check if more information is needed
      if (plan.needsMoreInfo && plan.missingInfo?.length > 0) {
        console.log(`[UniversalAgent] Missing info: ${plan.missingInfo.map(m => m.field).join(', ')}`);
        return {
          success: false,
          needsMoreInfo: true,
          questions: plan.missingInfo.map(info => ({
            field: info.field,
            question: info.question,
            type: info.type || 'text'
          })),
          message: `I need a bit more information to help you with "${taskDescription}":`,
          plan: plan.summary,
          sessionId
        };
      }

      // Step 3b: Check if user confirmation is needed (for high-risk actions)
      if (plan.needsConfirmation && !options.confirmed) {
        return {
          success: false,
          needsConfirmation: true,
          confirmationPrompt: plan.confirmationMessage,
          plan: plan.summary,
          steps: plan.steps?.map(s => s.description) || [],
          sessionId
        };
      }

      // Step 4: Execute the plan
      const result = await this.executePlan(plan, userId, sessionId, options);

      // Step 5: Verify success
      const verified = await this.verifyExecution(result, plan.goal);

      // Step 6: Learn from successful execution
      if (verified.success && options.learn !== false) {
        await this.learnWorkflow(taskDescription, plan, userId);
      }

      const executionTime = Date.now() - startTime;
      this.emit('task:completed', { userId, sessionId, success: verified.success, executionTime });

      return {
        success: verified.success,
        message: verified.message,
        sessionId,
        executionTime,
        steps: result.steps?.length || 0,
        finalScreenshot: result.finalScreenshot,
        finalUrl: result.finalUrl,
        validation: result.validation,
        learned: verified.success
      };

    } catch (error) {
      console.error(`[UniversalAgent] Task failed:`, error);
      this.emit('task:failed', { userId, sessionId, error: error.message });

      return {
        success: false,
        message: `I encountered an issue: ${error.message}`,
        error: error.message,
        sessionId,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * ================================================================
   * STEP 1: PLAN TASK - AI decomposes task into executable steps
   * ================================================================
   */
  async planTask(taskDescription, userId, options = {}) {
    console.log(`[UniversalAgent] Planning task...`);

    // STEP 0: Use smart task analyzer FIRST to detect missing info
    const taskAnalysis = analyzeTaskRequirements(taskDescription, options.additionalInfo || {});
    console.log(`[UniversalAgent] Task analysis: category=${taskAnalysis.category}, missing=${taskAnalysis.missingInfo?.length || 0}`);

    // If we detected missing required info, return immediately with questions
    if (taskAnalysis.missingInfo && taskAnalysis.missingInfo.length > 0) {
      console.log(`[UniversalAgent] Missing info detected: ${taskAnalysis.missingInfo.map(m => m.field).join(', ')}`);
      return {
        goal: taskDescription,
        service: 'pending',
        url: null,
        requiresAuth: false,
        steps: [],
        summary: taskAnalysis.summary,
        needsMoreInfo: true,
        missingInfo: taskAnalysis.missingInfo,
        riskLevel: 'low',
        category: taskAnalysis.category
      };
    }

    console.log(`[UniversalAgent] All required info provided, proceeding with planning...`);

    // For KNOWN task types (food, ride), skip Claude and use direct execution plan
    // Claude tends to ask MORE questions even when we have everything
    const knownCategories = ['food', 'ride'];
    if (knownCategories.includes(taskAnalysis.category)) {
      console.log(`[UniversalAgent] Known category '${taskAnalysis.category}' - using direct execution plan`);
      return this.generateFallbackPlan(taskDescription, options);
    }

    const user = await User.findById(userId).select('name email butlerCredentials');
    const credentials = user?.butlerCredentials || {};

    // Build additional info context if answers were provided
    let additionalInfoContext = '';
    if (options.additionalInfo && Object.keys(options.additionalInfo).length > 0) {
      const infoLines = Object.entries(options.additionalInfo)
        .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
        .join('\n');
      additionalInfoContext = `\n\nADDITIONAL INFO PROVIDED:\n${infoLines}`;
      console.log(`[UniversalAgent] Planning with additionalInfo: ${JSON.stringify(options.additionalInfo)}`);
    }

    // Build capability context from manifest
    const capabilityContext = Object.entries(CAPABILITY_MANIFEST.capabilities)
      .map(([key, cap]) => `- ${key}: ${cap.description} (triggers: ${cap.triggers?.slice(0, 5).join(', ')}...)`)
      .join('\n');

    const planningPrompt = `You are Phoenix Butler, an AI that can automate ANY browser task.

TASK: "${taskDescription}"${additionalInfoContext}

USER CONTEXT:
- Name: ${user?.name || 'User'}
- Available credentials: ${Object.keys(credentials).join(', ') || 'None'}

AVAILABLE CAPABILITIES:
${capabilityContext}

Your job is to create a detailed browser automation plan. Match the task to one of the capabilities above and plan accordingly. Think step-by-step:

1. What website/service is needed?
2. Does the user need to be logged in?
3. What are the exact steps to complete this task?
4. What elements need to be clicked/filled?
5. Are there any confirmations or verifications needed?

Return a JSON plan with this structure:
{
  "goal": "Clear one-sentence goal",
  "service": "Primary website/service name",
  "url": "Starting URL",
  "requiresAuth": true/false,
  "credentialKey": "key in user's vault (if auth needed)",
  "steps": [
    {
      "stepNumber": 1,
      "action": "navigate|click|type|wait|screenshot|verify",
      "description": "Human-readable description",
      "target": {
        "type": "url|selector|description",
        "value": "The URL, CSS selector, or natural language element description"
      },
      "input": "Text to type (if action is 'type')",
      "waitAfter": 1000,
      "screenshot": true/false,
      "critical": true/false
    }
  ],
  "summary": "Brief summary of the plan",
  "estimatedTime": "1-2 minutes",
  "needsMoreInfo": true/false,
  "missingInfo": [
    {
      "field": "delivery_address",
      "question": "What's your delivery address?",
      "type": "address|phone|email|text|date|time|number"
    }
  ],
  "riskLevel": "low|medium|high"
}

IMPORTANT: If the task requires specific information that wasn't provided (like an address, phone number, date, time, quantity, etc.), set "needsMoreInfo": true and list what's missing in "missingInfo" with clear questions to ask the user. For example:
- "Order pizza" → needs delivery address
- "Book a ride" → needs pickup and destination addresses
- "Make a reservation" → needs date, time, party size
- "Send flowers" → needs recipient address

RULES:
- Keep steps simple and atomic
- Include waits between actions for page loads
- Use vision-based targeting (descriptions) when selectors might change
- Be conservative with critical steps (login, payments, etc.)
- For complex forms, break into multiple type actions

EXAMPLES:

Task: "Create a Facebook account"
Steps:
1. Navigate to facebook.com/r.php
2. Wait for page load
3. Type user's email into email field
4. Type generated password into password field
5. Type user's name into name fields
6. Click sign up button
7. Screenshot for verification

Task: "Book a flight to Miami"
Steps:
1. Navigate to google.com/travel/flights
2. Click one-way/round-trip selector
3. Type "Miami" into destination field
4. Click date picker
5. Select departure date
6. Click search button
7. Screenshot results

Return ONLY valid JSON, no explanation.`;

    // Try Claude first (better reasoning)
    if (claudeConscious) {
      try {
        console.log('[UniversalAgent] Trying Claude for planning...');
        const response = await claudeConscious.respondToQuery(planningPrompt, userId, {
          mode: 'json_parse',
          maxTokens: 2048
        });
        const plan = this.parsePlanResponse(response.message);
        console.log('[UniversalAgent] Claude planning succeeded');
        return plan;
      } catch (claudeError) {
        console.warn('[UniversalAgent] Claude failed, trying OpenRouter:', claudeError.message);
      }
    }

    // Try OpenRouter (optimalMind) as second option
    if (optimalMind) {
      try {
        console.log('[UniversalAgent] Trying OpenRouter for planning...');
        const response = await optimalMind.respondToQuery(planningPrompt, userId, {
          mode: 'json_parse'
        });
        const plan = this.parsePlanResponse(response.message);
        console.log('[UniversalAgent] OpenRouter planning succeeded');
        return plan;
      } catch (openrouterError) {
        console.warn('[UniversalAgent] OpenRouter failed:', openrouterError.message);
      }
    }

    // Final fallback: Pattern-based planning
    console.log('[UniversalAgent] All AI providers failed, using pattern fallback');
    return this.generateFallbackPlan(taskDescription, options);
  }

  /**
   * Parse AI response and extract JSON plan
   */
  parsePlanResponse(responseText) {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in planning response');
    }

    const plan = JSON.parse(jsonMatch[0]);

    // Validate plan structure
    if (!plan.steps || !Array.isArray(plan.steps)) {
      throw new Error('Invalid plan structure: missing steps array');
    }

    return plan;
  }

  /**
   * Detect which service a plan is targeting based on URL/steps
   * Used to load saved session cookies for bypassing CAPTCHA
   */
  detectServiceFromPlan(plan) {
    if (!plan || !plan.steps) return null;

    // URL patterns to service mappings
    const servicePatterns = {
      doordash: ['doordash.com'],
      ubereats: ['ubereats.com'],
      uber: ['uber.com', 'auth.uber.com', 'riders.uber.com'],
      lyft: ['lyft.com'],
      grubhub: ['grubhub.com'],
      postmates: ['postmates.com'],
      instacart: ['instacart.com'],
      opentable: ['opentable.com'],
      resy: ['resy.com'],
      amazon: ['amazon.com'],
      walmart: ['walmart.com'],
      target: ['target.com'],
      google: ['google.com', 'accounts.google.com'],
      airbnb: ['airbnb.com'],
      booking: ['booking.com'],
      expedia: ['expedia.com']
    };

    // Check plan steps for URLs
    for (const step of plan.steps) {
      if (step.url) {
        for (const [service, patterns] of Object.entries(servicePatterns)) {
          if (patterns.some(pattern => step.url.includes(pattern))) {
            return service;
          }
        }
      }
    }

    // Check plan goal or description
    const planText = `${plan.goal || ''} ${plan.summary || ''} ${plan.description || ''}`.toLowerCase();

    for (const [service, patterns] of Object.entries(servicePatterns)) {
      if (patterns.some(pattern => planText.includes(pattern.replace('.com', '')))) {
        return service;
      }
    }

    // Check for common keywords
    if (planText.includes('doordash') || (planText.includes('food') && planText.includes('order'))) {
      return 'doordash';
    }
    if (planText.includes('uber') && !planText.includes('eats')) {
      return 'uber';
    }
    if (planText.includes('lyft')) {
      return 'lyft';
    }
    if (planText.includes('instacart') || planText.includes('groceries')) {
      return 'instacart';
    }
    if (planText.includes('amazon')) {
      return 'amazon';
    }

    return null;
  }

  /**
   * Generate a basic fallback plan when AI planning fails
   * Uses capability manifest for dynamic routing - NO HARDCODING
   */
  generateFallbackPlan(taskDescription, options = {}) {
    const lowerTask = taskDescription.toLowerCase();
    const providedInfo = options.additionalInfo || {};
    const providedFields = Object.keys(providedInfo);

    console.log(`[UniversalAgent] Manifest-based fallback for: "${lowerTask}"`);
    console.log(`[UniversalAgent] Provided fields: ${providedFields.join(', ') || 'none'}`);

    // STEP 1: Match task to capability using manifest triggers
    let matchedCapability = null;
    let matchedCapabilityKey = null;
    let matchScore = 0;

    for (const [capKey, capability] of Object.entries(CAPABILITY_MANIFEST.capabilities)) {
      if (!capability.triggers) continue;

      // Count how many triggers match
      const matches = capability.triggers.filter(trigger => lowerTask.includes(trigger.toLowerCase()));
      if (matches.length > matchScore) {
        matchScore = matches.length;
        matchedCapability = capability;
        matchedCapabilityKey = capKey;
      }
    }

    if (matchedCapability) {
      console.log(`[UniversalAgent] Matched capability: ${matchedCapabilityKey} (score: ${matchScore})`);
    } else {
      console.log(`[UniversalAgent] No capability match, defaulting to research`);
      matchedCapability = CAPABILITY_MANIFEST.capabilities.research;
      matchedCapabilityKey = 'research';
    }

    // STEP 2: Check for missing required info
    const missingInfo = [];

    // Helper to check if field was already provided
    const isProvided = (field) => {
      if (providedFields.includes(field)) return true;
      const providedValue = providedInfo[field];
      if (providedValue && typeof providedValue === 'string' && providedValue.length > 0) {
        return lowerTask.includes(providedValue.toLowerCase());
      }
      return false;
    };

    // Check required info from matched capability
    if (matchedCapability.requiredInfo) {
      for (const field of matchedCapability.requiredInfo) {
        if (!isProvided(field)) {
          missingInfo.push({
            field: field,
            question: `What's your ${field.replace(/_/g, ' ')}?`,
            type: field.includes('address') ? 'address' : field.includes('phone') ? 'phone' : 'text'
          });
        }
      }
    }

    console.log(`[UniversalAgent] Missing info detected: ${missingInfo.map(m => m.field).join(', ') || 'none'}`);

    // If we detected missing info, return a plan that asks for it
    if (missingInfo.length > 0) {
      console.log(`[UniversalAgent] Returning ${missingInfo.length} questions`);
      return {
        goal: taskDescription,
        service: matchedCapabilityKey,
        url: null,
        requiresAuth: false,
        steps: [],
        summary: `Need more details to ${taskDescription}`,
        needsMoreInfo: true,
        missingInfo: missingInfo,
        riskLevel: 'low'
      };
    }

    console.log('[UniversalAgent] All info provided, generating plan from capability manifest');

    // STEP 3: Generate plan from matched capability
    const address = providedInfo.delivery_address || providedInfo.pickup_address || providedInfo.shipping_address || '';
    const destination = providedInfo.destination || '';

    // Determine which service to use from the capability
    let selectedService = null;
    let serviceUrl = null;
    let serviceName = null;

    if (matchedCapability.services) {
      // Check if a specific service was mentioned in the task
      for (const [svcKey, svc] of Object.entries(matchedCapability.services)) {
        if (lowerTask.includes(svcKey)) {
          selectedService = svcKey;
          serviceUrl = svc.url;
          serviceName = svc.name;
          break;
        }
      }
      // Fall back to default service
      if (!selectedService && matchedCapability.defaultService) {
        selectedService = matchedCapability.defaultService;
        const defaultSvc = matchedCapability.services[selectedService];
        serviceUrl = defaultSvc?.url;
        serviceName = defaultSvc?.name;
      }
    }

    // Build search query if applicable
    let searchQuery = lowerTask.replace(/doordash|ubereats|uber eats|grubhub|order|me|please|get|i want|some/gi, '').trim();

    // For food, detect specific cuisine
    if (matchedCapabilityKey === 'food_delivery') {
      const cuisines = ['pizza', 'chinese', 'sushi', 'burger', 'tacos', 'mexican', 'thai', 'indian', 'italian', 'japanese', 'korean', 'vietnamese'];
      const foundCuisine = cuisines.find(c => lowerTask.includes(c));
      if (foundCuisine) searchQuery = foundCuisine;
    }

    // Build the URL with search if applicable
    if (matchedCapability.services?.[selectedService]?.searchUrl && searchQuery) {
      serviceUrl = matchedCapability.services[selectedService].searchUrl.replace('{query}', encodeURIComponent(searchQuery));
    }

    // Generate dynamic steps based on capability type
    const steps = this.generateDynamicSteps(matchedCapabilityKey, {
      serviceUrl,
      serviceName,
      searchQuery,
      address,
      destination,
      providedInfo
    });

    return {
      goal: `${matchedCapability.description}: ${taskDescription}`,
      service: selectedService || matchedCapabilityKey,
      url: serviceUrl,
      requiresAuth: matchedCapability.services?.[selectedService]?.requiresAuth || false,
      steps: steps,
      summary: `${serviceName || matchedCapabilityKey}: ${taskDescription}`,
      estimatedTime: '30 seconds',
      needsConfirmation: true,
      confirmationMessage: `I'll open ${serviceName || matchedCapabilityKey} to ${taskDescription}. Proceed?`,
      riskLevel: matchedCapability.riskLevel || 'low'
    };
  }

  /**
   * Generate dynamic steps based on capability type
   */
  generateDynamicSteps(capabilityKey, context) {
    const { serviceUrl, serviceName, searchQuery, address, destination, providedInfo } = context;

    // Base navigation step
    const steps = [
      {
        stepNumber: 1,
        action: 'navigate',
        description: `Opening ${serviceName || capabilityKey}`,
        target: { type: 'url', value: serviceUrl },
        waitAfter: 3000,
        screenshot: true,
        critical: true
      }
    ];

    // Add capability-specific steps
    switch (capabilityKey) {
      case 'food_delivery':
        steps.push(
          {
            stepNumber: 2,
            action: 'click',
            description: 'Click on address/location field',
            target: { type: 'description', value: 'delivery address input field or location button' },
            waitAfter: 1000,
            screenshot: true
          },
          {
            stepNumber: 3,
            action: 'type',
            description: `Enter delivery address: ${address}`,
            target: { type: 'description', value: 'address input field' },
            input: address,
            waitAfter: 2000,
            screenshot: true
          },
          {
            stepNumber: 4,
            action: 'screenshot',
            description: 'Showing available restaurants',
            screenshot: true
          }
        );
        break;

      case 'rides':
        steps.push(
          {
            stepNumber: 2,
            action: 'click',
            description: 'Click on pickup location field',
            target: { type: 'description', value: 'pickup location input or where from field' },
            waitAfter: 1000,
            screenshot: true
          },
          {
            stepNumber: 3,
            action: 'type',
            description: `Enter pickup: ${address}`,
            target: { type: 'description', value: 'pickup address input' },
            input: address,
            waitAfter: 2000,
            screenshot: true
          },
          {
            stepNumber: 4,
            action: 'click',
            description: 'Click on destination field',
            target: { type: 'description', value: 'destination input or where to field' },
            waitAfter: 1000,
            screenshot: true
          },
          {
            stepNumber: 5,
            action: 'type',
            description: `Enter destination: ${destination}`,
            target: { type: 'description', value: 'destination address input' },
            input: destination,
            waitAfter: 2000,
            screenshot: true
          },
          {
            stepNumber: 6,
            action: 'screenshot',
            description: 'Showing ride options',
            screenshot: true
          }
        );
        break;

      case 'shopping':
        steps.push(
          {
            stepNumber: 2,
            action: 'click',
            description: 'Click on search field',
            target: { type: 'description', value: 'search input field or search box' },
            waitAfter: 1000,
            screenshot: true
          },
          {
            stepNumber: 3,
            action: 'type',
            description: `Search for: ${searchQuery || providedInfo.product_description}`,
            target: { type: 'description', value: 'search input' },
            input: searchQuery || providedInfo.product_description || '',
            waitAfter: 2000,
            screenshot: true
          },
          {
            stepNumber: 4,
            action: 'click',
            description: 'Click search button',
            target: { type: 'description', value: 'search button or submit button' },
            waitAfter: 3000,
            screenshot: true
          },
          {
            stepNumber: 5,
            action: 'screenshot',
            description: 'Showing search results',
            screenshot: true
          }
        );
        break;

      case 'reservations':
        steps.push(
          {
            stepNumber: 2,
            action: 'click',
            description: 'Click on restaurant search',
            target: { type: 'description', value: 'restaurant search field' },
            waitAfter: 1000,
            screenshot: true
          },
          {
            stepNumber: 3,
            action: 'type',
            description: `Search for restaurant`,
            target: { type: 'description', value: 'restaurant search input' },
            input: providedInfo.restaurant_name || '',
            waitAfter: 2000,
            screenshot: true
          },
          {
            stepNumber: 4,
            action: 'screenshot',
            description: 'Showing reservation options',
            screenshot: true
          }
        );
        break;

      default:
        // Generic browse/search pattern
        steps.push(
          {
            stepNumber: 2,
            action: 'screenshot',
            description: 'Showing page for review',
            screenshot: true
          }
        );
    }

    return steps;
  }

  /**
   * ================================================================
   * STEP 2: EXECUTE PLAN - Recursive Vision-First Loop
   * ================================================================
   */
  async executePlan(plan, userId, sessionId, options = {}) {
    console.log(`\n[UniversalAgent] Starting RECURSIVE loop: ${plan.goal}`);

    let browser = null;
    let page = null;
    let iterations = 0;
    const MAX_ITERATIONS = 30; // Safety limit
    let taskComplete = false;

    try {
      // 1. Launch Browser (Browserless or Local)
      if (process.env.BROWSERLESS_TOKEN) {
        const connection = await browserlessService.connectWithSession(userId, plan.service, {
          stealth: true,
          viewport: { width: 1280, height: 800 }
        });
        browser = connection.browser;
        page = connection.page;
        console.log(`[UniversalAgent] Connected to Cloud Browser. Live view enabled.`);
      } else {
        browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
        page = await browser.newPage();
      }

      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // 2. Initial Navigation
      if (plan.url) {
        this.emit('status', { sessionId, message: `Navigating to ${plan.service}...` });
        await page.goto(plan.url, { waitUntil: 'networkidle2', timeout: 60000 });
      }

      // 3. THE RECURSIVE LOOP
      while (!taskComplete && iterations < MAX_ITERATIONS) {
        iterations++;
        console.log(`[Loop ${iterations}] Analyzing page state...`);

        // A. Capture current state
        const screenshot = await page.screenshot({ encoding: 'base64' });
        const currentUrl = page.url();
        this.emit('screenshot', { userId, sessionId, screenshot });

        // B. Consult the Brain (Vision AI)
        this.emit('status', { sessionId, message: 'Thinking...' });
        
        const brainPrompt = `You are the Phoenix Butler Brain. Your current goal is: "${plan.goal}"
Current URL: ${currentUrl}

Analyze the provided screenshot. What is the single most logical next step to reach the goal?
If the task is finished, return TASK_COMPLETE.
If you see a blocking pop-up or cookie banner, handle it first.

Return ONLY a JSON response:
{
  "action": "click|type|navigate|wait|TASK_COMPLETE",
  "description": "What I'm doing and why",
  "target": "natural language description of element or URL",
  "input": "text to type if applicable",
  "critical": true
}`;

        const brainResponse = await claudeConscious.respondToQuery(brainPrompt, userId, {
          mode: 'vision',
          image: screenshot,
          maxTokens: 512
        });

        const decision = this.parseVisionResponse(brainResponse.message);
        console.log(`[Decision] ${decision.description}`);
        this.emit('status', { sessionId, message: decision.description });

        if (decision.action === 'TASK_COMPLETE') {
          taskComplete = true;
          break;
        }

        // C. Execute Decision
        const step = {
          stepNumber: iterations,
          action: decision.action,
          description: decision.description,
          target: { type: 'description', value: decision.target },
          input: decision.input,
          critical: decision.critical,
          screenshot: true
        };

        const result = await this.executeStep(page, step, userId, sessionId);
        
        if (!result.success && decision.critical) {
          console.warn(`[Loop] Critical step failed. Retrying...`);
          // Loop will retry automatically in next iteration
        }

        // D. Short wait for UI stability
        await new Promise(r => setTimeout(r, 1500));
      }

      return {
        success: taskComplete,
        iterations,
        finalUrl: page.url(),
        message: taskComplete ? "Goal achieved." : "Max iterations reached."
      };

    } catch (error) {
      console.error(`[UniversalAgent] Loop error:`, error.message);
      return { success: false, error: error.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * ================================================================
   * EXECUTE SINGLE STEP - Vision-based element interaction
   * ================================================================
   */
  async executeStep(page, step, userId, sessionId) {
    const startTime = Date.now();

    try {
      switch (step.action) {
        case 'navigate':
          console.log(`[Navigate] Going to: ${step.target?.value || step.target?.url || step.target}`);
          await page.goto(step.target?.value || step.target?.url || step.target, {
            waitUntil: 'networkidle2',
            timeout: STEP_TIMEOUT
          });
          console.log(`[Navigate] Arrived at: ${page.url()}`);
          break;

        case 'click':
          await this.smartClick(page, step.target, userId, sessionId);
          break;

        case 'type':
          await this.smartType(page, step.target, step.input, userId, sessionId);
          break;

        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.input || 1000));
          break;

        case 'scroll':
          await page.evaluate(() => window.scrollBy(0, 500));
          break;

        case 'screenshot':
          // Screenshot will be taken at end
          break;

        case 'verify':
          const verified = await this.verifyElement(page, step.target);
          if (!verified) {
            throw new Error(`Verification failed: ${step.description}`);
          }
          break;

        default:
          console.warn(`[UniversalAgent] Unknown action: ${step.action}`);
      }

      // Take screenshot if requested
      let screenshot = null;
      if (step.screenshot) {
        screenshot = await page.screenshot({ encoding: 'base64' });
        this.emit('screenshot', { userId, sessionId, stepNumber: step.stepNumber, screenshot });
      }

      return {
        success: true,
        stepNumber: step.stepNumber,
        action: step.action,
        description: step.description,
        screenshot,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[UniversalAgent] Step ${step.stepNumber} failed:`, error.message);

      // Take error screenshot
      let errorScreenshot = null;
      try {
        errorScreenshot = await page.screenshot({ encoding: 'base64' });
      } catch (e) {}

      return {
        success: false,
        stepNumber: step.stepNumber,
        action: step.action,
        description: step.description,
        error: error.message,
        screenshot: errorScreenshot,
        duration: Date.now() - startTime,
        critical: step.critical || false
      };
    }
  }

  /**
   * ================================================================
   * SMART CLICK - Vision-based element finding
   * ================================================================
   */
  async smartClick(page, target, userId, sessionId) {
    console.log(`[SmartClick] Target: ${target.value}`);

    // Try selector first if available
    if (target.type === 'selector') {
      try {
        await page.waitForSelector(target.value, { timeout: 5000 });
        await page.click(target.value);
        console.log(`[SmartClick] Clicked via selector: ${target.value}`);
        return;
      } catch (e) {
        console.warn(`[SmartClick] Selector failed, trying vision: ${e.message}`);
      }
    }

    // Use vision-based approach
    const element = await this.findElement(page, target.value, userId, sessionId);
    if (element) {
      await page.mouse.click(element.x, element.y);
      console.log(`[SmartClick] Clicked via vision at (${element.x}, ${element.y})`);
    } else {
      throw new Error(`Could not find element: ${target.value}`);
    }
  }

  /**
   * ================================================================
   * SMART TYPE - Vision-based input field detection
   * ================================================================
   */
  async smartType(page, target, text, userId, sessionId) {
    console.log(`[SmartType] Target: ${target.value}, Text: ${text}`);

    // Try selector first
    if (target.type === 'selector') {
      try {
        await page.waitForSelector(target.value, { timeout: 5000 });
        await page.click(target.value);
        await page.type(target.value, text, { delay: 50 });
        console.log(`[SmartType] Typed via selector: ${target.value}`);
        return;
      } catch (e) {
        console.warn(`[SmartType] Selector failed, trying vision: ${e.message}`);
      }
    }

    // Use vision to find and click input field
    const element = await this.findElement(page, target.value, userId, sessionId);
    if (element) {
      await page.mouse.click(element.x, element.y);
      await new Promise(resolve => setTimeout(resolve, 300));
      await page.keyboard.type(text, { delay: 50 });
      console.log(`[SmartType] Typed via vision at (${element.x}, ${element.y})`);
    } else {
      throw new Error(`Could not find input field: ${target.value}`);
    }
  }

  /**
   * ================================================================
   * FIND ELEMENT - Use AI vision to locate element on page
   * ================================================================
   */
  async findElement(page, description, userId, sessionId) {
    console.log(`[FindElement] Looking for: "${description}"`);

    for (let attempt = 1; attempt <= VISION_RETRY_ATTEMPTS; attempt++) {
      try {
        // Take screenshot
        const screenshot = await page.screenshot({ encoding: 'base64' });
        this.emit('vision:analyzing', { userId, sessionId, description, attempt });

        // Ask AI to find element
        const visionPrompt = `Analyze this webpage screenshot and find the element described as: "${description}"

Return ONLY a JSON object with the click coordinates:
{
  "found": true,
  "x": 640,
  "y": 400,
  "confidence": 0.95,
  "reasoning": "Brief explanation of what you found"
}

If you cannot find the element, return:
{
  "found": false,
  "reason": "Why you couldn't find it"
}

Be precise with coordinates. Consider the viewport is 1280x800.`;

        let response;
        if (claudeConscious) {
          response = await claudeConscious.respondToQuery(visionPrompt, userId, {
            mode: 'vision',
            image: screenshot,
            maxTokens: 512
          });
        } else if (optimalMind) {
          response = await optimalMind.respondToQuery(visionPrompt, userId, {
            mode: 'vision',
            image: screenshot
          });
        } else {
          throw new Error('No AI vision provider available');
        }

        // Parse response
        const result = this.parseVisionResponse(response.message);

        if (result.found) {
          console.log(`[FindElement] Found at (${result.x}, ${result.y}) - ${result.reasoning}`);
          return { x: result.x, y: result.y, confidence: result.confidence };
        } else {
          console.warn(`[FindElement] Attempt ${attempt} failed: ${result.reason}`);

          if (attempt < VISION_RETRY_ATTEMPTS) {
            // Scroll down and try again
            await page.evaluate(() => window.scrollBy(0, 300));
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

      } catch (error) {
        console.error(`[FindElement] Attempt ${attempt} error:`, error.message);
      }
    }

    return null;
  }

  /**
   * Parse vision AI response
   */
  parseVisionResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[ParseVision] JSON parse error:', e);
    }

    return { found: false, reason: 'Failed to parse vision response' };
  }

  /**
   * ================================================================
   * HANDLE AUTHENTICATION - Use credentials from vault
   * ================================================================
   */
  async handleAuthentication(page, plan, userId) {
    console.log(`[Auth] Handling authentication for ${plan.service}`);

    const user = await User.findById(userId).select('butlerCredentials');
    const credentials = user?.butlerCredentials?.[plan.credentialKey];

    if (!credentials) {
      throw new Error(`No credentials found for ${plan.service}. User must connect this service first.`);
    }

    // Navigate to login page if specified
    if (credentials.loginUrl) {
      await page.goto(credentials.loginUrl, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Use vision to find and fill login fields
    if (credentials.username) {
      const usernameField = await this.findElement(
        page,
        'username field, email field, or login identifier',
        userId,
        'auth'
      );
      if (usernameField) {
        await page.mouse.click(usernameField.x, usernameField.y);
        await page.keyboard.type(credentials.username, { delay: 50 });
      }
    }

    if (credentials.password) {
      const passwordField = await this.findElement(
        page,
        'password field or password input',
        userId,
        'auth'
      );
      if (passwordField) {
        await page.mouse.click(passwordField.x, passwordField.y);
        await page.keyboard.type(credentials.password, { delay: 50 });
      }
    }

    // Find and click login button
    const loginButton = await this.findElement(
      page,
      'login button, sign in button, or submit button',
      userId,
      'auth'
    );
    if (loginButton) {
      await page.mouse.click(loginButton.x, loginButton.y);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    }

    console.log(`[Auth] Authentication completed`);
  }

  /**
   * ================================================================
   * VERIFY EXECUTION - Check if goal was achieved
   * ================================================================
   */
  async verifyExecution(executionResult, goal) {
    console.log(`[Verify] Checking if goal achieved: "${goal}"`);

    // Basic verification: check if all steps succeeded
    const allStepsSucceeded = executionResult.steps.every(s => s.success);

    if (!allStepsSucceeded) {
      const failedSteps = executionResult.steps.filter(s => !s.success);
      return {
        success: false,
        message: `Some steps failed: ${failedSteps.map(s => s.description).join(', ')}`
      };
    }

    // TODO: Enhanced verification with vision AI analyzing final screenshot
    // For now, assume success if all steps completed

    return {
      success: true,
      message: `Successfully completed: ${goal}`
    };
  }

  /**
   * ================================================================
   * VERIFY ELEMENT - Check if element exists
   * ================================================================
   */
  async verifyElement(page, target) {
    if (target.type === 'selector') {
      try {
        await page.waitForSelector(target.value, { timeout: 5000 });
        return true;
      } catch (e) {
        return false;
      }
    }
    return true; // For description-based targets, assume verified if we reached this point
  }

  /**
   * ================================================================
   * CHECK LEARNED WORKFLOWS - Search for existing automation
   * ================================================================
   */
  async checkLearnedWorkflows(taskDescription, userId) {
    try {
      const workflow = await LearnedWorkflow.findMatchingWorkflow(taskDescription, userId);
      return workflow;
    } catch (error) {
      console.error('[CheckLearned] Error:', error);
      return null;
    }
  }

  /**
   * ================================================================
   * EXECUTE LEARNED WORKFLOW - Run previously saved automation
   * ================================================================
   */
  async executeLearnedWorkflow(workflow, userId, sessionId, options = {}) {
    console.log(`[LearnedWorkflow] Executing: ${workflow.name}`);

    // Convert workflow to plan format
    const plan = {
      goal: workflow.name,
      service: workflow.service.name,
      url: workflow.service.baseUrl,
      requiresAuth: workflow.service.loginRequired,
      steps: workflow.steps.map((s, i) => ({
        stepNumber: i + 1,
        action: s.action,
        description: s.target.description || s.action,
        target: s.target,
        input: s.value,
        waitAfter: s.waitCondition?.type === 'timeout' ? parseInt(s.waitCondition.value) : 1000,
        screenshot: s.screenshot,
        critical: false
      })),
      summary: workflow.name
    };

    // Execute the plan
    const result = await this.executePlan(plan, userId, sessionId, options);

    // Update workflow stats
    await workflow.recordExecution(result.success, Date.now() - this.activeSessions.get(sessionId)?.startTime || 0);

    return {
      success: result.success,
      message: result.success ? `Completed ${workflow.name}` : `Failed to complete ${workflow.name}`,
      sessionId,
      workflowId: workflow._id,
      learned: true,
      steps: result.steps?.length || 0,
      finalScreenshot: result.finalScreenshot,
      finalUrl: result.finalUrl,
      validation: result.validation
    };
  }

  /**
   * ================================================================
   * LEARN WORKFLOW - Save successful execution for future use
   * ================================================================
   */
  async learnWorkflow(taskDescription, plan, userId) {
    console.log(`[Learn] Saving workflow: ${plan.goal}`);

    try {
      const workflow = new LearnedWorkflow({
        name: plan.goal,
        category: 'custom',
        triggers: [
          { phrase: taskDescription, confidence: 1.0 },
          { phrase: plan.goal, confidence: 0.9 }
        ],
        requiredParams: [],
        steps: plan.steps.map(s => ({
          stepNumber: s.stepNumber,
          action: s.action,
          target: s.target,
          value: s.input,
          waitCondition: s.waitAfter ? { type: 'timeout', value: s.waitAfter.toString() } : undefined,
          screenshot: s.screenshot
        })),
        service: {
          name: plan.service,
          baseUrl: plan.url,
          loginRequired: plan.requiresAuth
        },
        learned: {
          fromUserId: userId,
          originalRequest: taskDescription,
          aiModel: 'claude'
        },
        scope: 'global',
        status: 'active'
      });

      await workflow.save();
      console.log(`[Learn] Workflow saved: ${workflow._id}`);

      this.emit('workflow:learned', { userId, workflowId: workflow._id, name: workflow.name });

      return workflow;
    } catch (error) {
      console.error('[Learn] Failed to save workflow:', error);
      return null;
    }
  }

  /**
   * ================================================================
   * GET SESSION STATUS - Live view support
   * ================================================================
   */
  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      status: session.status,
      userId: session.userId,
      goal: session.plan?.goal,
      uptime: Date.now() - session.startTime,
      currentUrl: session.page?.url()
    };
  }

  /**
   * ================================================================
   * GET LIVE SCREENSHOT - For real-time monitoring
   * ================================================================
   */
  async getLiveScreenshot(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session?.page) return null;

    try {
      return await session.page.screenshot({ encoding: 'base64' });
    } catch (error) {
      console.error('[LiveScreenshot] Error:', error);
      return null;
    }
  }

  /**
   * ================================================================
   * STOP SESSION - Cancel running automation
   * ================================================================
   */
  async stopSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    try {
      if (session.browser) {
        await session.browser.close();
      }
      this.activeSessions.delete(sessionId);
      this.emit('session:stopped', { sessionId });
      return true;
    } catch (error) {
      console.error('[StopSession] Error:', error);
      return false;
    }
  }

  /**
   * ================================================================
   * CONSCIOUS FAILURE ANALYSIS - Uses brain to understand and fix failures
   * ================================================================
   * This is what makes Butler CONSCIOUS - it THINKS about failures instead of
   * just giving up. Uses:
   * - Claude Vision to see what's on screen
   * - Causal Reasoning to understand WHY it failed
   * - Decision Engine to pick the best alternative
   */
  async consciousAnalyzeFailure(step, stepResult, screenshot, consoleErrors, userId) {
    console.log(`[Consciousness] Analyzing failure for: ${step.description}`);

    try {
      // Build analysis prompt for Claude
      const analysisPrompt = `You are a conscious AI analyzing a browser automation failure.

STEP THAT FAILED:
- Action: ${step.action}
- Description: ${step.description}
- Target: ${JSON.stringify(step.target)}
- Error: ${stepResult.error || 'Unknown'}

CONSOLE ERRORS:
${consoleErrors.length > 0 ? consoleErrors.join('\n') : 'None captured'}

TASK: Analyze this failure and propose an alternative approach.

Think step by step:
1. Why might this have failed? (element not found, page not loaded, wrong selector, etc.)
2. What's visible in the screenshot that could help?
3. What alternative approach could work?

Respond with JSON:
{
  "diagnosis": "Brief explanation of why it failed",
  "cause": "root_cause_category",
  "alternativeStep": {
    "action": "click|type|wait|navigate",
    "description": "What this step does",
    "target": {
      "type": "description|selector|url",
      "value": "The new target"
    },
    "input": "text to type if action is type",
    "waitAfter": 2000
  },
  "confidence": 0.8
}`;

      // Use Claude Vision to analyze screenshot + think
      let analysis = null;

      if (claudeConscious && screenshot) {
        try {
          const response = await claudeConscious.respondToQuery(analysisPrompt, userId, {
            mode: 'vision',
            image: screenshot,
            maxTokens: 1024
          });

          // Parse JSON from response
          const jsonMatch = response.message?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('[Consciousness] Claude analysis failed:', e.message);
        }
      }

      // Fallback: Use causal reasoning patterns if Claude failed
      if (!analysis && causalReasoning) {
        const causeAnalysis = await causalReasoning.whyCausedThis({
          type: 'step_failure',
          action: step.action,
          error: stepResult.error
        });

        analysis = {
          diagnosis: causeAnalysis.explanation || 'Element may not be visible or page not fully loaded',
          cause: 'element_not_found',
          alternativeStep: this.generateAlternativeStep(step, causeAnalysis),
          confidence: 0.6
        };
      }

      // Final fallback: Simple heuristics
      if (!analysis) {
        analysis = {
          diagnosis: 'Step failed - trying with longer wait and broader selector',
          cause: 'unknown',
          alternativeStep: {
            ...step,
            description: `Retry: ${step.description}`,
            waitAfter: (step.waitAfter || 1000) * 2,
            target: step.target?.type === 'selector'
              ? { type: 'description', value: step.description }
              : step.target
          },
          confidence: 0.4
        };
      }

      return analysis;

    } catch (error) {
      console.error('[Consciousness] Analysis error:', error.message);
      return {
        diagnosis: 'Analysis failed, using simple retry',
        cause: 'analysis_error',
        alternativeStep: null,
        confidence: 0
      };
    }
  }

  /**
   * Generate alternative step based on causal analysis
   */
  generateAlternativeStep(originalStep, causeAnalysis) {
    const step = { ...originalStep };

    // Common fixes based on cause
    switch (causeAnalysis.topCause?.cause || 'unknown') {
      case 'element_not_visible':
        // Wait longer for element
        step.waitAfter = (step.waitAfter || 1000) * 3;
        step.description = `Wait and retry: ${originalStep.description}`;
        break;

      case 'wrong_selector':
        // Switch to description-based targeting
        step.target = {
          type: 'description',
          value: originalStep.description
        };
        break;

      case 'page_not_loaded':
        // Add explicit wait
        step.action = 'wait';
        step.waitAfter = 5000;
        step.description = 'Wait for page to fully load';
        break;

      default:
        // Generic retry with description targeting
        step.target = {
          type: 'description',
          value: originalStep.description
        };
        step.waitAfter = (step.waitAfter || 1000) * 2;
    }

    return step;
  }
}

// Export singleton
module.exports = new UniversalAgent();
