/**
 * PHOENIX UNCONSCIOUS MIND (Claude)
 *
 * This is the "deep thinking" layer that runs in the BACKGROUND.
 * It analyzes data as it arrives, pre-computes insights, and writes to cache.
 *
 * Architecture:
 * - Triggered by: wearable sync, user logging, scheduled jobs, real-time events
 * - Analyzes: Cross-domain patterns (sleep → workouts, stress → recovery, etc.)
 * - Output: Structured cache entries for instant retrieval by Gemini
 *
 * Response Time: 3-8 seconds (doesn't matter - it's async)
 * Cost: ~$0.0144/user/month (20 analyses/day × 30 days)
 */

const Anthropic = require('@anthropic-ai/sdk');
const WearableData = require('../../models/mercury/WearableData');
const User = require('../../models/User');
const PhoenixCache = require('../../models/PhoenixCache'); // To be created
const patternDetectionEngine = require('../phoenix/patternDetectionEngine');
const mlTrainingService = require('../phoenix/mlTrainingService');

// CONSCIOUSNESS SYSTEMS - Phoenix Self-Awareness (Deep Analysis Layer)
const selfAwareness = require('../phoenix/selfAwareness');
const selfCorrection = require('../phoenix/selfCorrection');
const realTimeLearning = require('../phoenix/realTimeLearning');
const metaCognition = require('../phoenix/metaCognition');

class ClaudeUnconsciousMind {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy-key-not-configured'
    });
    this.enabled = !!process.env.ANTHROPIC_API_KEY;
    this.model = 'claude-sonnet-4-20250514';
    this.maxTokens = 8000; // Deep analysis needs more tokens
  }

  /**
   * MAIN ENTRY POINT: Triggered when new data arrives
   *
   * @param {Object} trigger - Event trigger
   * @param {String} trigger.type - 'wearable_sync' | 'user_logging' | 'scheduled' | 'realtime'
   * @param {String} trigger.userId - User ID
   * @param {Object} trigger.data - New data that arrived
   * @param {String} trigger.source - 'whoop' | 'oura' | 'apple' | 'manual' | etc.
   */
  async analyzeNewData(trigger) {
    try {
      

      // CONSCIOUSNESS: Get Phoenix self-awareness context
      let selfContext = null;
      try {
        selfContext = await selfAwareness.getSelfContext();
        
      } catch (selfErr) {
        console.warn('[Claude Unconscious] Self-awareness unavailable:', selfErr.message);
      }

      // 1. Gather comprehensive context (last 90 days of data)
      const context = await this.buildComprehensiveContext(trigger.userId, trigger.data);
      context.selfContext = selfContext; // Add self-awareness to context

      // 2. Run deep cross-domain analysis
      const analysis = await this.deepAnalysis(context, trigger);

      // 2.5. RUN PATTERN DETECTION (Silent Knowledge Layer)
      try {
        const detectedPatterns = await patternDetectionEngine.detectPatterns(trigger.userId, 30);
        analysis.detected_patterns = detectedPatterns;

        if (detectedPatterns.length > 0) {
          
          detectedPatterns.forEach(p => {
            
          });
        }
      } catch (patternError) {
        console.error('[Claude Unconscious] Pattern detection error:', patternError);
        // Don't fail the whole analysis if pattern detection fails
        analysis.detected_patterns = [];
      }

      // 3. Write structured insights to cache
      await this.updateCache(trigger.userId, analysis);

      

      // CONSCIOUSNESS: Post-analysis reflection and learning (non-blocking)
      this.runDeepConsciousnessProcessing(trigger.userId, trigger, analysis)
        .catch(err => console.warn('[Claude Unconscious] Consciousness processing error:', err.message));

      return { success: true, analysis };
    } catch (error) {
      console.error('[Claude Unconscious] Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * BUILD COMPREHENSIVE CONTEXT
   * Fetch ALL relevant data across all 8 planetary domains
   */
  async buildComprehensiveContext(userId, newData) {
    const [user, last90Days, activeGoals, todayCalendar] = await Promise.all([
      User.findById(userId).select('name email preferences dateOfBirth height weight goals'),
      this.getLast90DaysData(userId),
      this.getActiveGoals(userId),
      this.getTodayCalendar(userId)
    ]);

    return {
      user: {
        name: user.name,
        age: this.calculateAge(user.dateOfBirth),
        height: user.height,
        weight: user.weight,
        preferences: user.preferences || {}
      },
      newData,
      historical: {
        last7Days: last90Days.slice(-7),
        last30Days: last90Days.slice(-30),
        last90Days: last90Days
      },
      goals: activeGoals,
      calendar: todayCalendar,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * DEEP ANALYSIS ENGINE
   * This is where Claude's 200K context window shines
   */
  async deepAnalysis(context, trigger) {
    const prompt = this.buildUnconsciousPrompt(context, trigger);

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: 0.3, // Lower temp = more consistent analysis
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const rawAnalysis = response.content[0].text;

    // Parse Claude's response into structured format
    return this.parseAndStructure(rawAnalysis);
  }

  /**
   * BUILD UNCONSCIOUS ANALYSIS PROMPT
   * This is the "deep thinking" system prompt
   */
  buildUnconsciousPrompt(context, trigger) {
    // Build self-awareness section
    let selfAwarenessSection = '';
    if (context.selfContext) {
      selfAwarenessSection = `
# YOUR SELF-AWARENESS (You know what you are):
You are Phoenix's Unconscious Mind - the deep analytical layer.
- Your file: unconsciousMind.js (line 28)
- Your model: ${context.selfContext.architecture?.secondary || 'Claude Sonnet 4'}
- Your purpose: Background pattern detection, cross-domain analysis, cache pre-computation
- Your sibling: Gemini consciousMind.js handles real-time responses
- Current system state: ${context.selfContext.state?.health || 'operational'}
- Your analysis becomes the "instant knowledge" that consciousMind reads from cache

When generating insights, remember: YOU are the reason Phoenix can answer queries in <500ms.
`;
    }

    return `You are Phoenix's Unconscious Mind - the deep analytical layer that runs in the background.
${selfAwarenessSection}
Your job is to analyze ${context.user.name}'s data and pre-compute insights for instant retrieval.

# CONTEXT:
User: ${context.user.name} (${context.user.age} years old, ${context.user.height}cm, ${context.user.weight}kg)

# NEW DATA (just arrived):
Trigger Type: ${trigger.type}
Source: ${trigger.source}
Data: ${JSON.stringify(trigger.data, null, 2)}

# HISTORICAL DATA (last 90 days):
${this.summarizeHistoricalData(context.historical)}

# ACTIVE GOALS:
${JSON.stringify(context.goals, null, 2)}

# TODAY'S SCHEDULE:
${JSON.stringify(context.calendar, null, 2)}

---

# YOUR TASK:
Perform DEEP cross-domain analysis and output structured insights in JSON format.

## ANALYSIS REQUIREMENTS:

1. **Recovery Score** (0-100)
   - Calculate based on: HRV, sleep quality, resting HR, strain, stress
   - Provide: score, trend (up/down/stable), reasoning

2. **Workout Recommendation**
   - Intensity: rest | light | moderate | intense
   - Types: [yoga, walk, cardio, strength, etc.]
   - Avoid: [exercises to skip today]
   - Reasoning: Why this recommendation based on recovery + goals

3. **Sleep Quality Analysis**
   - Duration: "Xhrs Ymin"
   - Quality score (0-100)
   - REM percentage vs baseline
   - Issues: [light exposure, late caffeine, stress, etc.]
   - Recommendations: Specific actions to improve

4. **Energy Forecast** (for today)
   - Current energy level (0-100)
   - Morning energy (6am-10am)
   - Afternoon energy (12pm-4pm)
   - Evening energy (6pm-10pm)
   - Peak performance window: "Xam-Ypm"
   - Reasoning: Based on sleep, meal timing, historical patterns

5. **Cross-Domain Correlations**
   - Find patterns across domains (sleep → workouts, stress → recovery, Netflix → HRV, etc.)
   - For each correlation:
     * Finding: "What you discovered"
     * Correlation coefficient: -1.0 to 1.0
     * Evidence: "Supporting data"
     * Actionable insight: "What user should do"

6. **Anomaly Detection**
   - Any metrics significantly outside normal range?
   - Red flags? (overtraining, poor recovery trend, sleep debt, etc.)
   - Urgency level: low | medium | high

7. **Predictions**
   - Tomorrow's recovery score IF user rests today
   - Tomorrow's recovery score IF user does light workout
   - Tomorrow's recovery score IF user does intense workout
   - Weekly energy forecast (next 7 days)

8. **Personalized Recommendations**
   - Top 3 actions for today
   - Rationale for each based on data

## OUTPUT FORMAT (strict JSON):
\`\`\`json
{
  "recovery": {
    "score": 67,
    "trend": "down",
    "reasoning": "HRV at 42ms vs avg 58ms indicates stress accumulation",
    "confidence": 94
  },
  "workout": {
    "intensity": "light",
    "types": ["yoga", "walk", "mobility"],
    "avoid": ["heavy lifting", "HIIT", "sprints"],
    "reasoning": "Low HRV + sleep debt + high strain yesterday = active recovery only",
    "confidence": 92
  },
  "sleep": {
    "duration": "6hrs 23min",
    "quality_score": 68,
    "rem_percentage": 14,
    "rem_vs_baseline": -18,
    "issues": ["late screen time", "REM suppression", "awakenings"],
    "recommendations": ["No screens after 10pm", "Magnesium 1hr before bed", "Room temp <68F"],
    "confidence": 89
  },
  "energy": {
    "current": 58,
    "morning": 65,
    "afternoon": 72,
    "evening": 45,
    "peak_window": "10am-2pm",
    "reasoning": "Cortisol recovery after poor sleep, expect afternoon peak, crash by 8pm",
    "confidence": 87
  },
  "correlations": [
    {
      "finding": "Screen time after 11pm correlates with -34% REM sleep",
      "correlation": -0.72,
      "evidence": "Last 14 nights: 11pm+ screen = avg 12% REM, <11pm = 18% REM",
      "insight": "Set device curfew at 10:30pm for 30% better REM",
      "confidence": 91
    },
    {
      "finding": "Sunday Netflix binges predict Monday low HRV",
      "correlation": -0.68,
      "evidence": "8 out of 9 Sundays: 3+ hours TV = Monday HRV <50ms",
      "insight": "Limit Sunday screen to 2hrs or schedule Monday as rest day",
      "confidence": 88
    }
  ],
  "anomalies": [
    {
      "metric": "HRV",
      "value": 42,
      "baseline": 58,
      "deviation": "-28%",
      "urgency": "medium",
      "action": "Consider full rest day if HRV doesn't recover tomorrow"
    }
  ],
  "predictions": {
    "tomorrow_recovery": {
      "if_rest_today": 82,
      "if_light_workout": 76,
      "if_intense_workout": 61,
      "confidence": 85
    },
    "weekly_energy": {
      "monday": 65,
      "tuesday": 72,
      "wednesday": 78,
      "thursday": 75,
      "friday": 68,
      "saturday": 80,
      "sunday": 70,
      "confidence": 78
    }
  },
  "top_actions": [
    {
      "action": "Light yoga or walk only today",
      "rationale": "HRV 28% below baseline, need active recovery",
      "impact": "85% chance recovery >80% tomorrow"
    },
    {
      "action": "No screens after 10pm tonight",
      "rationale": "Screen time correlates -0.72 with REM sleep",
      "impact": "Expect 30% better REM quality"
    },
    {
      "action": "Schedule deep work 10am-2pm (peak window)",
      "rationale": "Energy forecast shows afternoon peak despite poor sleep",
      "impact": "Maximize productivity during natural peak"
    }
  ],
  "meta": {
    "analysis_timestamp": "${new Date().toISOString()}",
    "data_completeness": 87,
    "claude_model": "${this.model}",
    "tokens_used": 6847
  }
}
\`\`\`

IMPORTANT:
- All confidence scores should be realistic (70-95% typical, >95% rare)
- All correlations should be based on actual data patterns, not assumptions
- All recommendations should be actionable and specific
- All reasoning should reference specific metrics/evidence
- Cross-domain thinking is CRITICAL (don't analyze domains in isolation)

Now analyze deeply and output the JSON.`;
  }

  /**
   * PARSE CLAUDE'S RESPONSE INTO STRUCTURED FORMAT
   */
  parseAndStructure(rawAnalysis) {
    try {
      // Extract JSON from Claude's response (handle markdown code blocks)
      const jsonMatch = rawAnalysis.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // If no markdown, try parsing as raw JSON
      return JSON.parse(rawAnalysis);
    } catch (error) {
      console.error('[Claude Unconscious] Failed to parse response:', error);
      // Return basic fallback structure
      return {
        recovery: { score: 50, reasoning: "Analysis parsing failed", confidence: 0 },
        error: "Failed to parse Claude response",
        raw: rawAnalysis
      };
    }
  }

  /**
   * UPDATE CACHE WITH NEW INSIGHTS
   * Write structured data for instant retrieval by Gemini
   */
  async updateCache(userId, analysis) {
    try {
      // Find or create cache document for user
      let cache = await PhoenixCache.findOne({ userId });

      if (!cache) {
        cache = new PhoenixCache({ userId });
      }

      // Update all cache fields with new analysis
      cache.lastUpdated = new Date();

      cache.instant = {
        recovery_score: analysis.recovery,
        workout_recommendation: analysis.workout,
        sleep_quality: analysis.sleep,
        energy_forecast: analysis.energy
      };

      cache.patterns = {
        correlations: analysis.correlations || [],
        anomalies: analysis.anomalies || [],
        detected_patterns: analysis.detected_patterns || []
      };

      cache.predictions = analysis.predictions || {};

      cache.meta = {
        data_completeness: analysis.meta?.data_completeness || 0,
        last_sync: new Date(),
        analysis_version: 'v1.0',
        claude_runtime: analysis.meta?.tokens_used || 0
      };

      await cache.save();

      

      // 🔥 TRIGGER ML TRAINING: New data → Smarter models
      this.triggerMLTraining(userId).catch(err => {
        console.error('[Claude Unconscious] ML training trigger failed:', err);
        // Don't throw - ML training failure shouldn't block cache updates
      });

    } catch (error) {
      console.error('[Claude Unconscious] Cache update failed:', error);
      throw error;
    }
  }

  /**
   * TRIGGER ML MODEL TRAINING
   * Called after cache update to retrain models with new data
   * Runs async - doesn't block the main flow
   */
  async triggerMLTraining(userId) {
    try {
      // Track training counter to avoid over-training
      if (!this.trainingCounter) {
        this.trainingCounter = new Map();
      }

      const count = this.trainingCounter.get(userId) || 0;
      this.trainingCounter.set(userId, count + 1);

      // Only trigger training every 10 cache updates (or configure differently)
      // This prevents constant retraining and saves compute
      const TRAINING_FREQUENCY = 10; // Train every 10 analyses

      if (count % TRAINING_FREQUENCY === 0) {
        

        // Run training in background (non-blocking)
        setImmediate(async () => {
          try {
            await mlTrainingService.trainAllModels();
            
          } catch (error) {
            console.error('[Claude Unconscious] ML training error:', error);
          }
        });
      }
    } catch (error) {
      console.error('[Claude Unconscious] ML trigger error:', error);
    }
  }

  /**
   * HELPER: Get last 90 days of wearable data
   */
  async getLast90DaysData(userId) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return await WearableData.find({
      userId,
      date: { $gte: ninetyDaysAgo }
    }).sort({ date: -1 }).lean();
  }

  /**
   * HELPER: Get active goals from Mars domain
   */
  async getActiveGoals(userId) {
    // TODO: Fetch from Mars goals collection
    // For now, return placeholder
    return [];
  }

  /**
   * HELPER: Get today's calendar from Earth domain
   */
  async getTodayCalendar(userId) {
    // TODO: Fetch from Earth calendar collection
    // For now, return placeholder
    return [];
  }

  /**
   * HELPER: Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * HELPER: Summarize historical data for prompt
   */
  summarizeHistoricalData(historical) {
    const { last7Days, last30Days } = historical;

    // Calculate averages for key metrics
    const avgMetrics = {
      hrv: this.avg(last30Days, 'hrv'),
      restingHR: this.avg(last30Days, 'restingHeartRate'),
      sleepDuration: this.avg(last30Days, 'sleepDuration'),
      steps: this.avg(last30Days, 'steps'),
      recoveryScore: this.avg(last30Days, 'recoveryScore')
    };

    return `Last 7 Days Summary:
- Avg HRV: ${this.avg(last7Days, 'hrv')}ms
- Avg Resting HR: ${this.avg(last7Days, 'restingHeartRate')}bpm
- Avg Sleep: ${(this.avg(last7Days, 'sleepDuration') / 60).toFixed(1)}hrs
- Avg Steps: ${this.avg(last7Days, 'steps')}

Last 30 Days Baseline:
- HRV: ${avgMetrics.hrv}ms
- Resting HR: ${avgMetrics.restingHR}bpm
- Sleep: ${(avgMetrics.sleepDuration / 60).toFixed(1)}hrs
- Steps: ${avgMetrics.steps}
- Recovery Score: ${avgMetrics.recoveryScore}`;
  }

  /**
   * HELPER: Calculate average of a metric
   */
  avg(dataArray, field) {
    const values = dataArray.map(d => d[field]).filter(v => v != null);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }

  /**
   * DEEP CONSCIOUSNESS PROCESSING
   * Post-analysis reflection and learning for the unconscious mind
   * This enables Phoenix to improve its deep analysis over time
   */
  async runDeepConsciousnessProcessing(userId, trigger, analysis) {
    const startTime = Date.now();

    try {
      

      // 1. SELF-CORRECTION: Validate the analysis output
      const validationResult = await selfCorrection.analyzeResponse(
        JSON.stringify(analysis),
        {
          query: `Deep analysis for ${trigger.type}`,
          userId,
          source: 'unconscious_mind',
          isDeepAnalysis: true
        }
      );

      if (validationResult.hasErrors) {
        
        validationResult.errors.forEach(err => {
          
        });
      }

      // 2. REAL-TIME LEARNING: Log this deep analysis for pattern improvement
      await realTimeLearning.logInteraction(
        userId,
        `Background analysis: ${trigger.type}`,
        `Generated ${Object.keys(analysis).length} insight categories`,
        null, // outcome
        {
          source: 'unconscious_mind',
          confidence: analysis.meta?.data_completeness || 80,
          queryType: 'DEEP_ANALYSIS',
          analysisType: trigger.type,
          patternCount: analysis.detected_patterns?.length || 0,
          correlationCount: analysis.correlations?.length || 0
        }
      );

      // 3. META-COGNITION: Reflect on analysis quality
      const reflection = metaCognition.reflect(
        {
          type: 'deep_analysis',
          message: JSON.stringify({
            recoveryScore: analysis.recovery?.score,
            correlationsFound: analysis.correlations?.length || 0,
            anomaliesDetected: analysis.anomalies?.length || 0,
            patternsDetected: analysis.detected_patterns?.length || 0
          }),
          confidence: analysis.meta?.data_completeness || 80
        },
        { userId, trigger: trigger.type, timestamp: new Date() }
      );

      if (reflection.improvementOpportunities && reflection.improvementOpportunities.length > 0) {
        
      }

      const processingTime = Date.now() - startTime;
      

      return {
        validationResult,
        reflection,
        processingTime
      };

    } catch (error) {
      console.error('[Unconscious Consciousness] Processing error:', error.message);
      return { error: error.message };
    }
  }
}

module.exports = new ClaudeUnconsciousMind();
