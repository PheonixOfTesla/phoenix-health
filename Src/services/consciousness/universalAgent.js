/**
 * ================================================================
 * UNIVERSAL AGENT - Handle ANY Request
 * ================================================================
 *
 * Phoenix's fallback brain for unknown requests. When the user asks
 * for something we've never seen before, this agent:
 *
 * 1. UNDERSTAND - Parse what the user actually wants
 * 2. RESEARCH - Search the web / internal knowledge for how to do it
 * 3. PLAN - Create a step-by-step execution plan
 * 4. EXECUTE - Run the plan with vision-based Puppeteer
 * 5. VERIFY - Check if the goal was achieved
 * 6. LEARN - Save successful workflows for instant replay
 *
 * This makes Phoenix capable of handling ANY request, even ones
 * it has never encountered before.
 * ================================================================
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const LearnedWorkflow = require('../../models/phoenix/LearnedWorkflow');
const ButlerAction = require('../../models/phoenix/ButlerAction');
const User = require('../../models/User');

// AI providers for reasoning
let aiRouter;
try {
  aiRouter = require('../ai/router');
} catch (e) {
  console.warn('[UniversalAgent] AI router not available, using fallback');
}

puppeteer.use(StealthPlugin());

// Maximum steps to prevent infinite loops
const MAX_STEPS = 50;
const STEP_TIMEOUT = 30000; // 30 seconds per step

class UniversalAgent {
  constructor() {
    this.activeSessions = new Map();
    this.name = 'UniversalAgent';
  }

  /**
   * ================================================================
   * MAIN ENTRY: Process Unknown Request
   * ================================================================
   * Called when phoenixMind doesn't know how to handle a request
   */
  async processRequest(message, userId, options = {}) {
    const startTime = Date.now();
    const sessionId = `universal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[UniversalAgent] Processing unknown request: "${message}"`);

    try {
      // 1. UNDERSTAND - Parse the goal
      const goal = await this.understandGoal(message, userId);
      console.log(`[UniversalAgent] Understood goal:`, goal);

      // 2. CHECK LEARNED WORKFLOWS - Do we already know how to do this?
      const existingWorkflow = await LearnedWorkflow.findMatchingWorkflow(message, userId);

      if (existingWorkflow) {
        console.log(`[UniversalAgent] Found existing workflow: ${existingWorkflow.name}`);
        return await this.executeLearnedWorkflow(existingWorkflow, goal.params, userId, sessionId);
      }

      // 3. RESEARCH - Figure out how to accomplish this
      const research = await this.researchTask(goal, userId);
      console.log(`[UniversalAgent] Research complete:`, research.summary);

      // 4. CREATE PLAN - Build step-by-step execution plan
      const plan = await this.createPlan(goal, research, userId);
      console.log(`[UniversalAgent] Created ${plan.steps.length} step plan`);

      // 5. CHECK - Does this need user confirmation?
      if (plan.needsConfirmation && !options.confirmed) {
        return {
          success: true,
          action: false,
          needsConfirmation: true,
          confirmationPrompt: plan.confirmationMessage,
          plan: plan.summary,
          sessionId,
          goal
        };
      }

      // 6. EXECUTE - Run the plan
      const result = await this.executePlan(plan, userId, sessionId);

      // 7. VERIFY - Did we achieve the goal?
      const verified = await this.verifySuccess(result, goal);

      // 8. LEARN - If successful, save the workflow
      if (verified.success) {
        await this.saveWorkflow(goal, plan, message, userId);
      }

      return {
        success: verified.success,
        action: true,
        type: 'universal_agent',
        sessionId,
        message: verified.message,
        result: result,
        executionTime: Date.now() - startTime,
        learned: verified.success
      };

    } catch (error) {
      console.error('[UniversalAgent] Error:', error);

      // Attempt recovery
      const recovery = await this.attemptRecovery(error, message, userId);
      if (recovery.recovered) {
        return recovery.result;
      }

      return {
        success: false,
        action: false,
        type: 'universal_agent',
        sessionId,
        message: `I tried to figure out how to "${message}" but ran into an issue: ${error.message}. Can you give me more details?`,
        error: error.message,
        executionTime: Date.now() - startTime,
        needsMoreInfo: true
      };
    }
  }

  /**
   * ================================================================
   * STEP 1: UNDERSTAND - Parse the user's goal
   * ================================================================
   */
  async understandGoal(message, userId) {
    const prompt = `You are Phoenix, an AI that can automate ANY task.

User request: "${message}"

Parse this request and return a JSON object with:
{
  "action": "what the user wants to do (verb phrase)",
  "target": "what service/website/app is involved",
  "params": {
    // extracted parameters like names, amounts, dates, etc.
  },
  "clarifications": ["list of things you need to ask to complete this"],
  "complexity": "simple|medium|complex",
  "category": "food|ride|shopping|finance|travel|communication|productivity|entertainment|custom"
}

Examples:
- "order groceries from instacart" -> action: "order groceries", target: "instacart", params: {}
- "book a flight to NYC next friday" -> action: "book flight", target: "airline", params: {destination: "NYC", date: "next friday"}
- "send $50 to John on Venmo" -> action: "send money", target: "venmo", params: {amount: 50, recipient: "John"}

Return ONLY valid JSON, no explanation.`;

    try {
      if (aiRouter) {
        const response = await aiRouter.route({
          userId,
          message: prompt,
          context: { mode: 'json_parse' }
        });
        return JSON.parse(response.message);
      }
    } catch (e) {
      console.warn('[UniversalAgent] AI parse failed, using heuristics');
    }

    // Fallback: Simple heuristic parsing
    return {
      action: message,
      target: 'unknown',
      params: {},
      clarifications: [],
      complexity: 'medium',
      category: 'custom'
    };
  }

  /**
   * ================================================================
   * STEP 2: RESEARCH - Figure out how to accomplish the task
   * ================================================================
   */
  async researchTask(goal, userId) {
    console.log(`[UniversalAgent] Researching: ${goal.action} on ${goal.target}`);

    // Build research query
    const searchQuery = `how to ${goal.action} on ${goal.target} programmatically automation`;

    // Get user context for personalization
    const user = await User.findById(userId).select('preferences butlerCredentials');

    // Check what services user has connected
    const connectedServices = Object.keys(user?.butlerCredentials || {});

    const research = {
      goal: goal.action,
      target: goal.target,
      sources: [],
      steps: [],
      summary: '',
      requiresLogin: true,
      connectedServices,
      suggestedApproach: 'puppeteer'
    };

    // Known service configurations
    const serviceConfigs = {
      instacart: {
        url: 'https://www.instacart.com',
        loginRequired: true,
        approach: 'Search -> Add to cart -> Checkout'
      },
      amazon: {
        url: 'https://www.amazon.com',
        loginRequired: true,
        approach: 'Search -> Add to cart -> Checkout'
      },
      venmo: {
        url: 'https://venmo.com',
        loginRequired: true,
        approach: 'Pay/Request -> Enter recipient -> Enter amount -> Confirm'
      },
      spotify: {
        url: 'https://open.spotify.com',
        loginRequired: true,
        approach: 'Search -> Play'
      },
      airbnb: {
        url: 'https://www.airbnb.com',
        loginRequired: true,
        approach: 'Search location -> Select dates -> Filter -> Book'
      },
      expedia: {
        url: 'https://www.expedia.com',
        loginRequired: false,
        approach: 'Search flights/hotels -> Select -> Book'
      },
      gmail: {
        url: 'https://mail.google.com',
        loginRequired: true,
        approach: 'Compose -> Enter recipient -> Write message -> Send'
      }
    };

    // Match target to known service
    const targetLower = goal.target.toLowerCase();
    for (const [service, config] of Object.entries(serviceConfigs)) {
      if (targetLower.includes(service)) {
        research.serviceConfig = config;
        research.summary = `Use ${service} via ${config.approach}`;
        research.sources.push(config.url);
        break;
      }
    }

    // If no match, suggest web search approach
    if (!research.serviceConfig) {
      research.summary = `Navigate to ${goal.target}, find the relevant feature, and complete ${goal.action}`;
      research.suggestedApproach = 'vision_guided';
    }

    return research;
  }

  /**
   * ================================================================
   * STEP 3: CREATE PLAN - Build execution steps
   * ================================================================
   */
  async createPlan(goal, research, userId) {
    console.log(`[UniversalAgent] Creating plan for: ${goal.action}`);

    const prompt = `You are Phoenix, creating an automation plan.

Goal: ${goal.action}
Target: ${goal.target}
Parameters: ${JSON.stringify(goal.params)}
Research: ${research.summary}
${research.serviceConfig ? `Service URL: ${research.serviceConfig.url}` : ''}

Create a step-by-step browser automation plan. Each step should be:
{
  "stepNumber": 1,
  "action": "navigate|click|type|select|scroll|wait|screenshot|extract|verify",
  "target": {
    "selector": "CSS selector or description",
    "url": "URL if navigating",
    "description": "human readable description"
  },
  "value": "text to type or value to select",
  "waitAfter": 1000,
  "screenshot": true/false
}

Return JSON:
{
  "steps": [...],
  "summary": "brief description",
  "needsConfirmation": true/false,
  "confirmationMessage": "what to ask user if confirmation needed",
  "estimatedTime": "30 seconds"
}

Focus on reliability - include waits between steps.
Return ONLY valid JSON.`;

    try {
      if (aiRouter) {
        const response = await aiRouter.route({
          userId,
          message: prompt,
          context: { mode: 'json_parse' }
        });
        return JSON.parse(response.message);
      }
    } catch (e) {
      console.warn('[UniversalAgent] AI plan failed, using generic plan');
    }

    // Fallback: Generic plan
    const baseUrl = research.serviceConfig?.url || `https://www.google.com/search?q=${encodeURIComponent(goal.target)}`;

    return {
      steps: [
        {
          stepNumber: 1,
          action: 'navigate',
          target: { url: baseUrl, description: `Go to ${goal.target}` },
          waitAfter: 2000,
          screenshot: true
        },
        {
          stepNumber: 2,
          action: 'screenshot',
          target: { description: 'Capture current state for vision analysis' },
          screenshot: true
        }
      ],
      summary: `Navigate to ${goal.target} and attempt ${goal.action}`,
      needsConfirmation: goal.complexity === 'complex',
      confirmationMessage: `I'll try to ${goal.action} on ${goal.target}. Should I proceed?`,
      estimatedTime: '1-2 minutes'
    };
  }

  /**
   * ================================================================
   * STEP 4: EXECUTE PLAN - Run with Puppeteer
   * ================================================================
   */
  async executePlan(plan, userId, sessionId) {
    console.log(`[UniversalAgent] Executing ${plan.steps.length} step plan`);

    const user = await User.findById(userId).select('butlerCredentials');
    let browser = null;
    let page = null;
    const results = [];

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Store session for live view
      this.activeSessions.set(sessionId, { browser, page, status: 'running' });

      // Execute each step
      for (let i = 0; i < Math.min(plan.steps.length, MAX_STEPS); i++) {
        const step = plan.steps[i];
        console.log(`[UniversalAgent] Step ${step.stepNumber}: ${step.action}`);

        const stepResult = await this.executeStep(page, step, userId);
        results.push(stepResult);

        if (!stepResult.success && stepResult.critical) {
          console.log(`[UniversalAgent] Critical step failed, aborting`);
          break;
        }

        // Wait between steps
        if (step.waitAfter) {
          await new Promise(r => setTimeout(r, step.waitAfter));
        }
      }

      // Take final screenshot
      const finalScreenshot = await page.screenshot({ encoding: 'base64' });

      return {
        success: results.every(r => r.success),
        steps: results,
        finalScreenshot,
        finalUrl: page.url()
      };

    } finally {
      // Cleanup
      if (browser) {
        await browser.close();
      }
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Execute a single step with vision-based fallback
   */
  async executeStep(page, step, userId) {
    const startTime = Date.now();

    try {
      switch (step.action) {
        case 'navigate':
          await page.goto(step.target.url, { waitUntil: 'networkidle2', timeout: STEP_TIMEOUT });
          break;

        case 'click':
          // Try selector first
          if (step.target.selector) {
            try {
              await page.waitForSelector(step.target.selector, { timeout: 5000 });
              await page.click(step.target.selector);
            } catch (e) {
              // Fallback: Vision-based click
              await this.visionClick(page, step.target.description, userId);
            }
          } else {
            // Pure vision-based click
            await this.visionClick(page, step.target.description, userId);
          }
          break;

        case 'type':
          if (step.target.selector) {
            await page.waitForSelector(step.target.selector, { timeout: 5000 });
            await page.type(step.target.selector, step.value, { delay: 50 });
          } else {
            // Vision-based: find input field then type
            await this.visionType(page, step.target.description, step.value, userId);
          }
          break;

        case 'select':
          await page.waitForSelector(step.target.selector, { timeout: 5000 });
          await page.select(step.target.selector, step.value);
          break;

        case 'scroll':
          await page.evaluate(() => window.scrollBy(0, 500));
          break;

        case 'wait':
          await new Promise(r => setTimeout(r, step.value || 1000));
          break;

        case 'screenshot':
          // Screenshot is taken in result
          break;

        case 'extract':
          const extractedData = await page.evaluate((selectors) => {
            const data = {};
            for (const sel of selectors) {
              const el = document.querySelector(sel);
              if (el) data[sel] = el.textContent;
            }
            return data;
          }, step.extractData?.selectors || []);
          return { success: true, data: extractedData, duration: Date.now() - startTime };

        case 'verify':
          const verified = await page.evaluate((selector) => {
            return !!document.querySelector(selector);
          }, step.target.selector);
          return { success: verified, duration: Date.now() - startTime };
      }

      // Take screenshot if requested
      let screenshot = null;
      if (step.screenshot) {
        screenshot = await page.screenshot({ encoding: 'base64' });
      }

      return {
        success: true,
        stepNumber: step.stepNumber,
        action: step.action,
        screenshot,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[UniversalAgent] Step ${step.stepNumber} failed:`, error.message);
      return {
        success: false,
        stepNumber: step.stepNumber,
        action: step.action,
        error: error.message,
        duration: Date.now() - startTime,
        critical: step.action === 'navigate' // Navigation failures are critical
      };
    }
  }

  /**
   * Vision-based click - use AI to find element by description
   */
  async visionClick(page, description, userId) {
    console.log(`[UniversalAgent] Vision click: "${description}"`);

    // Take screenshot
    const screenshot = await page.screenshot({ encoding: 'base64' });

    // Ask AI to find the element
    const prompt = `You are analyzing a webpage screenshot to find a clickable element.

Target: "${description}"

Look at the screenshot and return the approximate coordinates (x, y) of where to click.
Return JSON: {"x": 640, "y": 400, "confidence": 0.9, "found": true}

If you can't find the element, return: {"found": false, "reason": "why"}`;

    try {
      if (aiRouter) {
        const response = await aiRouter.route({
          userId,
          message: prompt,
          context: {
            mode: 'vision',
            image: screenshot
          }
        });

        const coords = JSON.parse(response.message);
        if (coords.found) {
          await page.mouse.click(coords.x, coords.y);
          return;
        }
      }
    } catch (e) {
      console.warn('[UniversalAgent] Vision click failed:', e.message);
    }

    throw new Error(`Could not find element: ${description}`);
  }

  /**
   * Vision-based type - find input field and type
   */
  async visionType(page, description, value, userId) {
    console.log(`[UniversalAgent] Vision type: "${description}" = "${value}"`);

    // First try to find and click the input
    await this.visionClick(page, description, userId);
    await new Promise(r => setTimeout(r, 500));

    // Then type
    await page.keyboard.type(value, { delay: 50 });
  }

  /**
   * ================================================================
   * STEP 5: VERIFY - Check if goal was achieved
   * ================================================================
   */
  async verifySuccess(result, goal) {
    console.log(`[UniversalAgent] Verifying success for: ${goal.action}`);

    // Check if all steps succeeded
    const allStepsSucceeded = result.steps.every(s => s.success);

    if (!allStepsSucceeded) {
      const failedSteps = result.steps.filter(s => !s.success);
      return {
        success: false,
        message: `Some steps failed: ${failedSteps.map(s => s.error).join(', ')}`
      };
    }

    // Use AI to verify final state if we have a screenshot
    if (result.finalScreenshot && aiRouter) {
      try {
        const prompt = `Look at this screenshot. Was the goal "${goal.action}" successfully completed?
Return JSON: {"success": true/false, "evidence": "what you see", "message": "friendly message to user"}`;

        const response = await aiRouter.route({
          userId: 'system',
          message: prompt,
          context: {
            mode: 'vision',
            image: result.finalScreenshot
          }
        });

        return JSON.parse(response.message);
      } catch (e) {
        console.warn('[UniversalAgent] Vision verification failed');
      }
    }

    // Default: assume success if steps completed
    return {
      success: true,
      message: `I completed ${goal.action}. Please verify the result.`
    };
  }

  /**
   * ================================================================
   * STEP 6: LEARN - Save successful workflow for future use
   * ================================================================
   */
  async saveWorkflow(goal, plan, originalMessage, userId) {
    console.log(`[UniversalAgent] Saving learned workflow: ${goal.action}`);

    try {
      const workflow = new LearnedWorkflow({
        name: `${goal.action} on ${goal.target}`,
        category: goal.category || 'custom',
        triggers: [
          { phrase: originalMessage, confidence: 1.0 },
          { phrase: goal.action, confidence: 0.8 }
        ],
        requiredParams: Object.keys(goal.params).map(key => ({
          name: key,
          type: 'string',
          description: `The ${key} for this action`
        })),
        steps: plan.steps.map(s => ({
          stepNumber: s.stepNumber,
          action: s.action,
          target: s.target,
          value: s.value,
          waitCondition: s.waitAfter ? { type: 'timeout', value: s.waitAfter.toString() } : undefined,
          screenshot: s.screenshot
        })),
        service: {
          name: goal.target,
          baseUrl: plan.steps.find(s => s.action === 'navigate')?.target?.url,
          loginRequired: true
        },
        learned: {
          fromUserId: userId,
          originalRequest: originalMessage,
          aiModel: 'claude'
        },
        scope: 'global',
        status: 'active'
      });

      await workflow.save();
      console.log(`[UniversalAgent] Workflow saved with ID: ${workflow._id}`);
      return workflow;

    } catch (error) {
      console.error('[UniversalAgent] Failed to save workflow:', error);
    }
  }

  /**
   * Execute a previously learned workflow
   */
  async executeLearnedWorkflow(workflow, params, userId, sessionId) {
    console.log(`[UniversalAgent] Executing learned workflow: ${workflow.name}`);

    const startTime = Date.now();

    // Convert workflow steps to plan format
    const plan = {
      steps: workflow.steps.map(s => ({
        stepNumber: s.stepNumber,
        action: s.action,
        target: s.target,
        value: this.interpolateParams(s.value, params),
        waitAfter: s.waitCondition?.type === 'timeout' ? parseInt(s.waitCondition.value) : 1000,
        screenshot: s.screenshot
      })),
      summary: workflow.name
    };

    // Execute the plan
    const result = await this.executePlan(plan, userId, sessionId);

    // Record execution metrics
    const executionTime = Date.now() - startTime;
    await workflow.recordExecution(result.success, executionTime);

    return {
      success: result.success,
      action: true,
      type: 'learned_workflow',
      workflowId: workflow._id,
      workflowName: workflow.name,
      sessionId,
      message: result.success
        ? `Done! I ${workflow.name}.`
        : `I tried to ${workflow.name} but encountered an issue.`,
      result,
      executionTime
    };
  }

  /**
   * Interpolate parameters into step values
   */
  interpolateParams(value, params) {
    if (!value || typeof value !== 'string') return value;

    let result = value;
    for (const [key, val] of Object.entries(params)) {
      result = result.replace(`{{${key}}}`, val);
    }
    return result;
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error, message, userId) {
    console.log(`[UniversalAgent] Attempting recovery from: ${error.message}`);

    // Common recovery strategies
    const recoveryStrategies = [
      {
        pattern: /timeout|navigation/i,
        fix: 'The website might be slow. Let me try again with more patience.'
      },
      {
        pattern: /selector|element/i,
        fix: 'The page layout might have changed. Let me try finding the element differently.'
      },
      {
        pattern: /login|auth/i,
        fix: 'I need you to log in first. Would you like to connect this service?'
      }
    ];

    for (const strategy of recoveryStrategies) {
      if (strategy.pattern.test(error.message)) {
        return {
          recovered: false,
          result: {
            success: false,
            action: false,
            message: strategy.fix,
            recoveryHint: true
          }
        };
      }
    }

    return { recovered: false };
  }

  /**
   * Get status of an active session
   */
  getSessionStatus(sessionId) {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Check if Universal Agent can handle a request
   * Returns true for ANY request (that's the point)
   */
  canHandle(message) {
    // Universal Agent can attempt to handle anything
    return true;
  }
}

module.exports = new UniversalAgent();
