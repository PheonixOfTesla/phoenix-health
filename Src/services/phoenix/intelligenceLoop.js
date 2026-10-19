/**
 * ==================================================================
 * PHOENIX INTELLIGENCE LOOP
 * ==================================================================
 * The Living Consciousness - Continuous Background Processing
 *
 * Purpose: Make Phoenix ALIVE by continuously:
 * - Observing: Fetch latest data from all 8 planetary domains
 * - Analyzing: Run pattern detection across all data
 * - Understanding: Generate insights and correlations
 * - Acting: Update plans, create interventions, send proactive alerts
 * - Evolving: Learn from patterns and improve over time
 *
 * This is what makes Phoenix different from every other AI.
 * ==================================================================
 */

const EventEmitter = require('events');
const PhoenixCache = require('../../models/PhoenixCache');
const PatternEngine = require('./patternDetectionEngine');
const consciousnessStream = require('../consciousness/realtimeConsciousnessStream');
const domainEvents = require('./domainEventEmitter');

// Models for fetching latest data
const MercuryData = require('../../models/mercury/WearableData');
const VenusWorkout = require('../../models/venus/Workout');
const EarthCalendar = require('../../models/earth/CalendarEvent');
const MarsGoal = require('../../models/mars/Goal');
const JupiterTransaction = require('../../models/jupiter/Transaction');
const SaturnReflection = require('../../models/saturn/QuarterlyReview');
// Uranus and Neptune models not yet implemented
const UranusSkill = null;
const NeptuneMeditation = null;

class PhoenixIntelligenceLoop extends EventEmitter {
  constructor() {
    super();

    this.isRunning = false;
    this.interval = null;
    this.processInterval = 5 * 60 * 1000; // 5 minutes
    this.activeUsers = new Set();
    this.processingQueue = new Set(); // Prevent duplicate processing

    // ✨ EVENT-DRIVEN ARCHITECTURE
    // Listen for real-time domain events
    this.setupEventListeners();

    
  }

  /**
   * SETUP EVENT LISTENERS
   * Connect to domain events for real-time processing
   */
  setupEventListeners() {
    

    // Listen to ALL domain changes
    domainEvents.on('domain:change', async (event) => {
      const { planet, eventType, userId, data } = event;

      // Only process if user is registered
      if (!this.activeUsers.has(userId.toString())) {
        return;
      }

      // Prevent duplicate processing (debounce)
      const processingKey = `${userId}_${Date.now()}`;
      if (this.processingQueue.has(userId.toString())) {
        
        return;
      }

      

      // Process user immediately (real-time consciousness)
      try {
        this.processingQueue.add(userId.toString());
        await this.processUser(userId.toString());
      } catch (error) {
        console.error(`[Intelligence Loop] Error in reactive processing:`, error.message);
      } finally {
        // Remove from queue after 10 seconds
        setTimeout(() => {
          this.processingQueue.delete(userId.toString());
        }, 10000);
      }
    });

    // Listen to specific high-priority events
    this.setupHighPriorityListeners();

    
  }

  /**
   * SETUP HIGH-PRIORITY LISTENERS
   * Certain events trigger immediate interventions
   */
  setupHighPriorityListeners() {
    // HRV Drop Detection (illness predictor)
    domainEvents.on('mercury:biometric_update', async (event) => {
      const { userId, data } = event;
      if (data.hrv && data.hrv < 40) {
        
        // Immediate processing
        await this.triggerUserProcessing(userId);
      }
    });

    // High-Intensity Workout (recovery alert)
    domainEvents.on('venus:workout_logged', async (event) => {
      const { userId, data } = event;
      if (data.intensity === 'high' && data.duration > 90) {
        
      }
    });

    // Goal Completion (celebration trigger)
    domainEvents.on('mars:goal_completed', async (event) => {
      const { userId, data } = event;
      

      // ✨ Push celebration via Phoenix WebSocket (real-time widget)
      const phoenixSocket = global.phoenixSocket;
      if (phoenixSocket) {
        phoenixSocket.pushCelebration(userId, {
          title: data.title,
          message: `Woahhh you did that?? ${data.title} - that's genuinely marvel! 🎉`
        });
      }

      // Also push to old consciousness stream for backwards compatibility
      consciousnessStream.queueUpdate(userId, {
        type: 'CELEBRATION',
        timestamp: Date.now(),
        data: {
          message: `Woahhh you did that?? ${data.title} - that's genuinely marvel! 🎉`,
          achievement: data.title
        }
      });
    });

    // Budget Alert (stress-spending pattern)
    domainEvents.on('jupiter:budget_alert', async (event) => {
      const { userId, data } = event;
      
    });
  }

  /**
   * START THE CONSCIOUSNESS
   * Begin continuous processing loop
   */
  start() {
    if (this.isRunning) {
      
      return;
    }

    this.isRunning = true;
    

    // Run immediately on start
    this.processAllUsers();

    // Then run every 5 minutes
    this.interval = setInterval(() => {
      this.processAllUsers();
    }, this.processInterval);
  }

  /**
   * STOP THE CONSCIOUSNESS
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    
  }

  /**
   * REGISTER USER FOR PROCESSING
   * Add user to active processing list
   */
  registerUser(userId) {
    this.activeUsers.add(userId.toString());
    
  }

  /**
   * UNREGISTER USER
   */
  unregisterUser(userId) {
    this.activeUsers.delete(userId.toString());
    
  }

  /**
   * PROCESS ALL ACTIVE USERS
   * Main consciousness loop
   */
  async processAllUsers() {
    if (this.activeUsers.size === 0) {
      
      return;
    }

    

    const startTime = Date.now();
    let processedCount = 0;

    for (const userId of this.activeUsers) {
      try {
        await this.processUser(userId);
        processedCount++;
      } catch (error) {
        console.error(`[Intelligence Loop] Error processing user ${userId}:`, error.message);
      }
    }

    const duration = Date.now() - startTime;
    
  }

  /**
   * PROCESS SINGLE USER
   * Full consciousness cycle for one user
   */
  async processUser(userId) {
    

    try {
      // 1. OBSERVE: Fetch latest data from all domains
      const domainData = await this.fetchAllDomains(userId);

      // 2. ANALYZE: Run pattern detection
      const patterns = await this.analyzePatterns(userId, domainData);

      // 3. UNDERSTAND: Generate insights
      const insights = await this.generateInsights(userId, patterns, domainData);

      // 4. UPDATE: Save to PhoenixCache
      await this.updateCache(userId, insights, patterns);

      // 5. ACT: Send proactive alerts if needed
      await this.sendProactiveAlerts(userId, insights);

      // 6. PLAN: Update master optimization plan
      await this.updateMasterPlan(userId, insights);

      

    } catch (error) {
      console.error(`[Intelligence Loop] Error in user ${userId} processing:`, error);
      throw error;
    }
  }

  /**
   * 1. OBSERVE: FETCH LATEST DATA FROM ALL 8 DOMAINS
   */
  async fetchAllDomains(userId) {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    try {
      const [
        mercuryData,
        venusWorkouts,
        earthEvents,
        marsGoals,
        jupiterTransactions,
        saturnReflections
      ] = await Promise.all([
        // Mercury: Last 24 hours of biometrics
        MercuryData.find({ userId, timestamp: { $gte: oneDayAgo } })
          .sort({ timestamp: -1 })
          .limit(100)
          .lean(),

        // Venus: Last 7 days of workouts
        VenusWorkout.find({ userId, date: { $gte: oneWeekAgo } })
          .sort({ date: -1 })
          .lean(),

        // Earth: Next 7 days of calendar events
        EarthCalendar.find({
          userId,
          startTime: {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        })
          .sort({ startTime: 1 })
          .lean(),

        // Mars: Active goals
        MarsGoal.find({ userId, status: 'active' })
          .lean(),

        // Jupiter: Last 7 days of transactions
        JupiterTransaction.find({ userId, date: { $gte: oneWeekAgo } })
          .sort({ date: -1 })
          .lean(),

        // Saturn: Recent reflections
        SaturnReflection.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      ]);

      // Uranus and Neptune not yet implemented
      const uranusSkills = [];
      const neptuneMeditations = [];

      return {
        mercury: mercuryData,
        venus: venusWorkouts,
        earth: earthEvents,
        mars: marsGoals,
        jupiter: jupiterTransactions,
        saturn: saturnReflections,
        uranus: uranusSkills,
        neptune: neptuneMeditations,
        timestamp: now
      };

    } catch (error) {
      console.error('[Intelligence Loop] Error fetching domain data:', error);
      throw error;
    }
  }

  /**
   * 2. ANALYZE: RUN PATTERN DETECTION
   */
  async analyzePatterns(userId, domainData) {
    try {
      // Use existing PatternEngine
      const detectedPatterns = [];

      // Check for recovery patterns
      if (domainData.mercury.length > 0) {
        const latestBiometric = domainData.mercury[0];

        // HRV trends
        if (latestBiometric.hrv) {
          const avgHRV = domainData.mercury
            .filter(d => d.hrv)
            .slice(0, 7)
            .reduce((sum, d) => sum + d.hrv, 0) / Math.min(7, domainData.mercury.length);

          if (latestBiometric.hrv < avgHRV * 0.85) {
            detectedPatterns.push({
              type: 'hrv_drop',
              severity: 'warning',
              confidence: 0.85,
              message: `HRV ${Math.round((1 - latestBiometric.hrv / avgHRV) * 100)}% below baseline`,
              data: { current: latestBiometric.hrv, baseline: avgHRV }
            });
          }
        }

        // Resting HR elevation (illness predictor)
        if (latestBiometric.restingHR) {
          const avgRHR = domainData.mercury
            .filter(d => d.restingHR)
            .slice(0, 7)
            .reduce((sum, d) => sum + d.restingHR, 0) / Math.min(7, domainData.mercury.length);

          if (latestBiometric.restingHR > avgRHR + 10) {
            detectedPatterns.push({
              type: 'illness_prediction',
              severity: 'high',
              confidence: 0.88,
              message: `Resting HR elevated ${latestBiometric.restingHR - avgRHR}bpm - illness likely in 2-3 days`,
              data: { current: latestBiometric.restingHR, baseline: avgRHR }
            });
          }
        }
      }

      // Check for workout consistency patterns
      if (domainData.venus.length > 0) {
        const workoutsThisWeek = domainData.venus.length;
        if (workoutsThisWeek < 2) {
          detectedPatterns.push({
            type: 'workout_consistency_low',
            severity: 'warning',
            confidence: 0.75,
            message: `Only ${workoutsThisWeek} workouts this week`,
            data: { count: workoutsThisWeek, target: 4 }
          });
        }
      }

      // Check for spending spikes
      if (domainData.jupiter.length > 0) {
        const totalSpentThisWeek = domainData.jupiter
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Compare to cached average (if available)
        const cache = await PhoenixCache.findOne({ userId }).lean();
        if (cache && cache.insights && cache.insights.length > 0) {
          const avgWeeklySpending = cache.insights
            .filter(i => i.type === 'weekly_spending')
            .map(i => i.value)[0] || totalSpentThisWeek;

          if (totalSpentThisWeek > avgWeeklySpending * 1.3) {
            detectedPatterns.push({
              type: 'spending_spike',
              severity: 'info',
              confidence: 0.80,
              message: `Spending up ${Math.round((totalSpentThisWeek / avgWeeklySpending - 1) * 100)}% this week`,
              data: { current: totalSpentThisWeek, baseline: avgWeeklySpending }
            });
          }
        }
      }

      // Cross-domain pattern: Stress + spending correlation
      if (domainData.mercury.length > 0 && domainData.jupiter.length > 0) {
        const avgHRV = domainData.mercury
          .filter(d => d.hrv)
          .reduce((sum, d) => sum + d.hrv, 0) / domainData.mercury.filter(d => d.hrv).length;

        const recentHRV = domainData.mercury.slice(0, 3)
          .filter(d => d.hrv)
          .reduce((sum, d) => sum + d.hrv, 0) / 3;

        if (recentHRV < avgHRV * 0.9 && domainData.jupiter.length > 5) {
          detectedPatterns.push({
            type: 'stress_spending_correlation',
            severity: 'info',
            confidence: 0.75,
            message: 'Higher spending detected during low HRV period',
            data: { hrv_ratio: recentHRV / avgHRV, transactions: domainData.jupiter.length }
          });
        }
      }

      return detectedPatterns;

    } catch (error) {
      console.error('[Intelligence Loop] Pattern analysis error:', error);
      return [];
    }
  }

  /**
   * 3. UNDERSTAND: GENERATE INSIGHTS
   */
  async generateInsights(userId, patterns, domainData) {
    const insights = [];
    const now = new Date();

    // Convert patterns to actionable insights
    for (const pattern of patterns) {
      insights.push({
        type: pattern.type,
        severity: pattern.severity,
        message: pattern.message,
        confidence: pattern.confidence,
        actionable: this.getActionableRecommendation(pattern),
        timestamp: now,
        data: pattern.data
      });
    }

    // Generate summary insights
    if (domainData.mercury.length > 0) {
      const latestBiometric = domainData.mercury[0];
      if (latestBiometric.recoveryScore) {
        insights.push({
          type: 'recovery_status',
          severity: latestBiometric.recoveryScore < 60 ? 'warning' : 'info',
          message: `Recovery at ${latestBiometric.recoveryScore}%`,
          confidence: 0.90,
          actionable: latestBiometric.recoveryScore < 60 ? 'Consider rest day or light activity' : 'Good to train',
          timestamp: now
        });
      }
    }

    return insights;
  }

  /**
   * GET ACTIONABLE RECOMMENDATION
   */
  getActionableRecommendation(pattern) {
    const recommendations = {
      'hrv_drop': 'Consider stress management: meditation, extra sleep, or lighter training',
      'illness_prediction': 'Load up on vitamin C, prioritize sleep, reduce training intensity',
      'workout_consistency_low': 'Schedule 2-3 workouts for the week ahead',
      'spending_spike': 'Review recent purchases and check budget alignment',
      'stress_spending_correlation': 'Try stress reduction techniques before making purchases'
    };

    return recommendations[pattern.type] || 'Monitor and assess';
  }

  /**
   * 4. UPDATE: SAVE TO PHOENIX CACHE
   */
  async updateCache(userId, insights, patterns) {
    try {
      let cache = await PhoenixCache.findOne({ userId });

      if (!cache) {
        cache = new PhoenixCache({
          userId,
          insights: [],
          patterns: [],
          lastUpdated: new Date()
        });
      }

      // Add new insights (keep last 50)
      // Ensure both insights arrays are iterable (fix for "cache.insights is not iterable")
      const existingInsights = Array.isArray(cache.insights) ? cache.insights : [];
      const newInsights = Array.isArray(insights) ? insights : [];
      cache.insights = [...newInsights, ...existingInsights].slice(0, 50);

      // Add patterns (keep last 100)
      // Ensure both patterns arrays are iterable
      const existingPatterns = Array.isArray(cache.patterns) ? cache.patterns : [];
      const newPatterns = Array.isArray(patterns) ? patterns : [];
      cache.patterns = [...newPatterns, ...existingPatterns].slice(0, 100);

      cache.lastUpdated = new Date();
      await cache.save();

      

    } catch (error) {
      console.error('[Intelligence Loop] Cache update error:', error);
    }
  }

  /**
   * 5. ACT: SEND PROACTIVE ALERTS
   */
  async sendProactiveAlerts(userId, insights) {
    // Filter for high-severity insights that warrant immediate alerts
    const alertableInsights = insights.filter(i =>
      i.severity === 'high' || i.severity === 'warning'
    );

    if (alertableInsights.length === 0) {
      return;
    }

    // ✨ Broadcast via Phoenix WebSocket (real-time widget creation)
    const phoenixSocket = global.phoenixSocket;

    for (const insight of alertableInsights) {
      try {
        // Push to WebSocket for real-time widget creation
        if (phoenixSocket) {
          if (insight.severity === 'high') {
            phoenixSocket.pushCriticalAlert(userId, {
              message: insight.message,
              recommendation: insight.actionable,
              confidence: insight.confidence
            });
          } else {
            phoenixSocket.pushPatternDetected(userId, insight);
          }
        }

        // Also push to old consciousness stream for backwards compatibility
        consciousnessStream.queueUpdate(userId, {
          type: 'PROACTIVE_INSIGHT',
          timestamp: Date.now(),
          data: {
            insight: insight.message,
            actionable: insight.actionable,
            severity: insight.severity,
            confidence: insight.confidence
          }
        });

        
      } catch (error) {
        console.error('[Intelligence Loop] Error sending alert:', error);
      }
    }
  }

  /**
   * 6. PLAN: UPDATE MASTER OPTIMIZATION PLAN
   */
  async updateMasterPlan(userId, insights) {
    try {
      // This would integrate with the orchestrator service
      // For now, just log that plan update would happen
      

      // TODO: Call orchestrator.updateMasterPlan(userId, insights)

    } catch (error) {
      console.error('[Intelligence Loop] Master plan update error:', error);
    }
  }

  /**
   * MANUAL TRIGGER
   * Process specific user immediately
   */
  async triggerUserProcessing(userId) {
    
    return await this.processUser(userId);
  }

  /**
   * GET STATUS
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeUsers: this.activeUsers.size,
      processInterval: this.processInterval,
      users: Array.from(this.activeUsers)
    };
  }
}

// Export singleton instance
const intelligenceLoop = new PhoenixIntelligenceLoop();

// Auto-start on server start
if (process.env.NODE_ENV !== 'test') {
  intelligenceLoop.start();
}

module.exports = intelligenceLoop;
