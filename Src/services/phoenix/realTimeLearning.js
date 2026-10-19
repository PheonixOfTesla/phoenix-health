/**
 * PHOENIX AI - REAL-TIME LEARNING SERVICE
 *
 * Enables Phoenix to learn from every interaction WITHOUT retraining.
 * The key insight: Phoenix gets smarter with every conversation, in real-time.
 *
 * CAPABILITIES:
 * - Log every query, response, and outcome
 * - Detect successful vs unsuccessful response patterns
 * - Track when Phoenix is right/wrong, adjust confidence
 * - Modify response strategies based on feedback
 *
 * This is Phoenix's "memory" and "learning system" - it remembers what works
 * and what doesn't for each individual user.
 *
 * @module RealTimeLearning
 */

const PhoenixLearning = require('../../models/phoenix/PhoenixLearning');
const BehaviorPattern = require('../../models/phoenix/BehaviorPattern');
const mongoose = require('mongoose');

// CONSCIOUSNESS PERSISTENCE MODELS
const InteractionChain = require('../../models/phoenix/InteractionChain');
const UserTeaching = require('../../models/phoenix/UserTeaching');

class RealTimeLearningService {
  constructor() {
    this.minSampleSize = 10;              // Minimum interactions to detect patterns
    this.confidenceThreshold = 0.7;       // Minimum confidence for pattern
    this.patternSimilarityThreshold = 0.6; // How similar must interactions be
    this.calibrationUpdateInterval = 100;  // Recalibrate after N interactions
  }

  // ========================================
  // INTERACTION LOGGING
  // ========================================

  /**
   * Log an interaction for learning
   * @param {String} userId - User ID
   * @param {String} query - User's query
   * @param {String} response - Phoenix's response
   * @param {Object} outcome - Outcome data (optional initially)
   * @param {Object} context - Additional context (optional)
   * @returns {Object} Created interaction record
   */
  async logInteraction(userId, query, response, outcome = null, context = {}) {
    try {
      // Validate inputs
      if (!userId || !query || !response) {
        throw new Error('userId, query, and response are required');
      }

      // Extract interaction type from context or query
      const interactionType = this._determineInteractionType(query, context);

      // Extract topic area
      const topicArea = this._extractTopicArea(query, context);

      // Build interaction record
      const interactionData = {
        userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId,
        interactionType,
        query: query.substring(0, 2000), // Enforce max length
        response: response.substring(0, 5000),
        context: {
          ...context,
          topicArea,
          timeOfDay: this._getTimeOfDay(),
          dayOfWeek: this._getDayOfWeek()
        },
        sessionId: context.sessionId || this._generateSessionId(),
        phoenixVersion: context.phoenixVersion || '1.0',
        responseTime: context.responseTime || null
      };

      // Add confidence calibration if confidence provided
      if (context.confidence !== undefined) {
        interactionData.confidenceCalibration = {
          predicted: context.confidence,
          calibrationGroup: topicArea
        };
      }

      // Add outcome if provided
      if (outcome) {
        interactionData.outcome = outcome.type || 'unknown';
        interactionData.userRating = outcome.rating || null;
        interactionData.userFeedback = outcome.feedback || null;
        interactionData.actionTaken = outcome.actionTaken || false;
        interactionData.actionDetails = outcome.actionDetails || null;

        // Update calibration actual if outcome is known
        if (interactionData.confidenceCalibration) {
          interactionData.confidenceCalibration.actual = this._outcomeToConfidence(outcome.type);
          interactionData.confidenceCalibration.error = Math.abs(
            interactionData.confidenceCalibration.predicted -
            interactionData.confidenceCalibration.actual
          );
        }
      }

      // OMEGA OPTIMIZATION: Non-blocking interaction logging (200ms → <20ms)
      // Create interaction record but DON'T WAIT for DB write
      const interaction = new PhoenixLearning(interactionData);

      // Fire-and-forget DB operations (async, non-blocking)
      interaction.save().catch(err => {
        console.error('[RealTimeLearning] Failed to save interaction:', err.message);
      });

      // CHAIN TRACKING: Link this interaction to the conversation chain
      this._addToInteractionChain(userId, interaction, context).catch(err => {
        console.warn('[RealTimeLearning] Failed to add to chain:', err.message);
      });

      // Trigger async pattern detection (don't wait)
      this._detectPatternsAsync(userId, interaction._id);

      return {
        success: true,
        interactionId: interaction._id,
        interactionType,
        topicArea
      };

    } catch (error) {
      console.error('[RealTimeLearning] Error logging interaction:', error);
      throw error;
    }
  }

  /**
   * Update an interaction with outcome after the fact
   * @param {String} interactionId - Interaction ID
   * @param {Object} outcome - Outcome data
   * @returns {Object} Updated interaction
   */
  async updateInteractionOutcome(interactionId, outcome) {
    try {
      const interaction = await PhoenixLearning.findById(interactionId);

      if (!interaction) {
        throw new Error('Interaction not found');
      }

      await interaction.recordOutcome(
        outcome.type,
        outcome.rating,
        outcome.feedback
      );

      

      // Trigger learning from this outcome
      this._learnFromOutcomeAsync(interaction);

      return {
        success: true,
        outcome: interaction.outcome,
        confidence: interaction.confidenceCalibration
      };

    } catch (error) {
      console.error('[RealTimeLearning] Error updating outcome:', error);
      throw error;
    }
  }

  // ========================================
  // PATTERN DETECTION
  // ========================================

  /**
   * Detect patterns in user interactions over time range
   * @param {String} userId - User ID
   * @param {Object} timeRange - Time range {start, end} (optional)
   * @returns {Array} Detected patterns
   */
  async detectPatterns(userId, timeRange = null) {
    try {
      // Get interactions
      let interactions;
      if (timeRange) {
        interactions = await PhoenixLearning.getUserInteractions(
          userId,
          timeRange.start,
          timeRange.end
        );
      } else {
        // Default: last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        interactions = await PhoenixLearning.getUserInteractions(
          userId,
          thirtyDaysAgo,
          new Date()
        );
      }

      if (interactions.length < this.minSampleSize) {
        
        return [];
      }

      const patterns = [];

      // Pattern 1: Successful interaction patterns
      const successPatterns = await this._detectSuccessPatterns(userId, interactions);
      patterns.push(...successPatterns);

      // Pattern 2: Failure patterns (what NOT to do)
      const failurePatterns = await this._detectFailurePatterns(userId, interactions);
      patterns.push(...failurePatterns);

      // Pattern 3: Timing preferences
      const timingPatterns = await this._detectTimingPatterns(userId, interactions);
      patterns.push(...timingPatterns);

      // Pattern 4: Topic expertise levels
      const expertisePatterns = await this._detectExpertisePatterns(userId, interactions);
      patterns.push(...expertisePatterns);

      // Pattern 5: Communication style preferences
      const stylePatterns = await this._detectStylePatterns(userId, interactions);
      patterns.push(...stylePatterns);

      

      return patterns;

    } catch (error) {
      console.error('[RealTimeLearning] Error detecting patterns:', error);
      throw error;
    }
  }

  /**
   * Detect successful interaction patterns
   * @private
   */
  async _detectSuccessPatterns(userId, interactions) {
    const patterns = [];
    const successfulInteractions = interactions.filter(i =>
      i.outcome === 'success' || i.outcome === 'acted_upon'
    );

    if (successfulInteractions.length < this.minSampleSize) {
      return patterns;
    }

    // Group by topic
    const topicGroups = this._groupByTopic(successfulInteractions);

    for (const [topic, topicInteractions] of Object.entries(topicGroups)) {
      if (topicInteractions.length < 3) continue;

      // Analyze what makes these successful
      const commonalities = this._findCommonalities(topicInteractions);

      if (commonalities.confidence > this.confidenceThreshold) {
        patterns.push({
          patternType: 'effective_approach',
          topic,
          description: `Successful ${topic} interactions often ${commonalities.description}`,
          confidence: commonalities.confidence,
          frequency: topicInteractions.length,
          evidence: commonalities.evidence,
          recommendation: `Continue using ${commonalities.approach} for ${topic} topics`
        });
      }
    }

    return patterns;
  }

  /**
   * Detect failure patterns
   * @private
   */
  async _detectFailurePatterns(userId, interactions) {
    const patterns = [];
    const failedInteractions = interactions.filter(i =>
      i.outcome === 'failure' || i.outcome === 'dismissed'
    );

    if (failedInteractions.length < 3) {
      return patterns;
    }

    // Find common failure modes
    const topicGroups = this._groupByTopic(failedInteractions);

    for (const [topic, topicInteractions] of Object.entries(topicGroups)) {
      if (topicInteractions.length < 2) continue;

      const commonalities = this._findCommonalities(topicInteractions);

      patterns.push({
        patternType: 'failure_pattern',
        topic,
        description: `Failed ${topic} interactions often ${commonalities.description}`,
        confidence: commonalities.confidence,
        frequency: topicInteractions.length,
        evidence: commonalities.evidence,
        recommendation: `Avoid ${commonalities.approach} for ${topic} topics`
      });
    }

    return patterns;
  }

  /**
   * Detect timing preferences
   * @private
   */
  async _detectTimingPatterns(userId, interactions) {
    const patterns = [];
    const timeBuckets = {
      morning: [],
      afternoon: [],
      evening: [],
      night: []
    };

    // Group by time of day
    interactions.forEach(i => {
      const timeOfDay = i.context?.timeOfDay || 'unknown';
      if (timeBuckets[timeOfDay]) {
        timeBuckets[timeOfDay].push(i);
      }
    });

    // Find which times have best outcomes
    for (const [timeOfDay, timeInteractions] of Object.entries(timeBuckets)) {
      if (timeInteractions.length < 5) continue;

      const successRate = timeInteractions.filter(i =>
        i.outcome === 'success' || i.outcome === 'acted_upon'
      ).length / timeInteractions.length;

      if (successRate > 0.7) {
        patterns.push({
          patternType: 'timing_preference',
          topic: 'general',
          description: `User is most receptive in the ${timeOfDay}`,
          confidence: successRate,
          frequency: timeInteractions.length,
          evidence: [`${(successRate * 100).toFixed(1)}% success rate in ${timeOfDay}`],
          recommendation: `Prioritize ${timeOfDay} for important interactions`
        });
      }
    }

    return patterns;
  }

  /**
   * Detect user expertise levels by topic
   * @private
   */
  async _detectExpertisePatterns(userId, interactions) {
    const patterns = [];
    const topicGroups = this._groupByTopic(interactions);

    for (const [topic, topicInteractions] of Object.entries(topicGroups)) {
      if (topicInteractions.length < 5) continue;

      // Analyze query complexity and feedback
      const avgComplexity = this._calculateQueryComplexity(topicInteractions);
      const feedbackQuality = this._analyzeFeedbackQuality(topicInteractions);

      let expertiseLevel = 'beginner';
      if (avgComplexity > 0.7 && feedbackQuality > 0.6) {
        expertiseLevel = 'expert';
      } else if (avgComplexity > 0.4 || feedbackQuality > 0.4) {
        expertiseLevel = 'intermediate';
      }

      patterns.push({
        patternType: 'topic_expertise',
        topic,
        description: `User has ${expertiseLevel} level knowledge of ${topic}`,
        confidence: 0.8,
        frequency: topicInteractions.length,
        evidence: [
          `Average query complexity: ${(avgComplexity * 100).toFixed(1)}%`,
          `Feedback quality: ${(feedbackQuality * 100).toFixed(1)}%`
        ],
        recommendation: `Adjust explanation depth to ${expertiseLevel} level for ${topic}`
      });
    }

    return patterns;
  }

  /**
   * Detect communication style preferences
   * @private
   */
  async _detectStylePatterns(userId, interactions) {
    const patterns = [];

    // Analyze response characteristics of successful interactions
    const successfulInteractions = interactions.filter(i =>
      i.outcome === 'success' || i.outcome === 'acted_upon'
    );

    if (successfulInteractions.length < 5) {
      return patterns;
    }

    // Analyze response length preference
    const avgSuccessLength = successfulInteractions.reduce((sum, i) =>
      sum + i.response.length, 0
    ) / successfulInteractions.length;

    const failedInteractions = interactions.filter(i =>
      i.outcome === 'failure' || i.outcome === 'dismissed'
    );

    if (failedInteractions.length > 0) {
      const avgFailLength = failedInteractions.reduce((sum, i) =>
        sum + i.response.length, 0
      ) / failedInteractions.length;

      const lengthDiff = Math.abs(avgSuccessLength - avgFailLength);

      if (lengthDiff > 200) {
        const preferredStyle = avgSuccessLength < avgFailLength ? 'concise' : 'detailed';
        patterns.push({
          patternType: 'response_style',
          topic: 'general',
          description: `User prefers ${preferredStyle} responses`,
          confidence: 0.75,
          frequency: successfulInteractions.length,
          evidence: [
            `Successful responses avg ${Math.round(avgSuccessLength)} chars`,
            `Failed responses avg ${Math.round(avgFailLength)} chars`
          ],
          recommendation: `Use ${preferredStyle} response style`
        });
      }
    }

    return patterns;
  }

  // ========================================
  // CONFIDENCE CALIBRATION
  // ========================================

  /**
   * Get calibrated confidence for a topic
   * @param {String} userId - User ID
   * @param {String} topic - Topic area
   * @returns {Object} Calibration data
   */
  async calibrateConfidence(userId, topic) {
    try {
      const calibration = await PhoenixLearning.getConfidenceCalibration(userId, topic);

      if (!calibration) {
        return {
          topic,
          calibrated: false,
          message: 'Insufficient data for calibration',
          recommendation: 'Use default confidence levels'
        };
      }

      // Calculate adjustment factor
      let adjustmentFactor = 1.0;

      if (calibration.isOverconfident) {
        // Reduce confidence by error amount
        adjustmentFactor = 1.0 - (calibration.averageBias * 0.5);
      } else if (calibration.isUnderconfident) {
        // Increase confidence
        adjustmentFactor = 1.0 + (Math.abs(calibration.averageBias) * 0.5);
      }

      

      return {
        topic,
        calibrated: true,
        sampleSize: calibration.sampleSize,
        averageError: calibration.averageError,
        averageBias: calibration.averageBias,
        adjustmentFactor,
        recommendation: calibration.recommendation,
        isOverconfident: calibration.isOverconfident,
        isUnderconfident: calibration.isUnderconfident
      };

    } catch (error) {
      console.error('[RealTimeLearning] Error calibrating confidence:', error);
      throw error;
    }
  }

  /**
   * Get calibration for all topics
   * @param {String} userId - User ID
   * @returns {Object} All calibrations
   */
  async getAllCalibrations(userId) {
    try {
      const topics = ['health', 'productivity', 'recovery', 'mental_health', 'general'];
      const calibrations = {};

      for (const topic of topics) {
        calibrations[topic] = await this.calibrateConfidence(userId, topic);
      }

      return calibrations;

    } catch (error) {
      console.error('[RealTimeLearning] Error getting calibrations:', error);
      throw error;
    }
  }

  /**
   * Calibrate confidence from outcome
   * Called when we receive feedback on a prediction
   * @param {String} userId - User ID
   * @param {Object} learning - Learning record with outcome
   */
  async calibrateFromOutcome(userId, learning) {
    const ConfidenceCalibration = require('../../models/phoenix/ConfidenceCalibration');

    const wasSuccessful = learning.outcome === 'success' || learning.outcome === 'acted_upon';
    const predictedConfidence = learning.metadata?.confidence || learning.confidenceCalibration?.predicted || 0.7;
    const actualAccuracy = wasSuccessful ? 1.0 : 0.0;
    const errorDirection = predictedConfidence > actualAccuracy ? 'over' : 'under';

    try {
      const topic = learning.context?.topicArea || learning.metadata?.queryType || 'general';

      await ConfidenceCalibration.findOneAndUpdate(
        { userId, topic },
        {
          $push: {
            calibrationHistory: {
              timestamp: new Date(),
              predictedConfidence,
              actualOutcome: actualAccuracy,
              errorDirection,
              adjustmentMade: (actualAccuracy - predictedConfidence) * 0.1 // Learning rate
            }
          },
          $inc: { 'stats.totalCalibrations': 1 }
        },
        { upsert: true }
      );

      // Recalculate current calibration factor
      await this._recalculateCalibrationFactor(userId, topic);

      

    } catch (error) {
      console.error('[RealTimeLearning] Calibration failed:', error.message);
    }
  }

  /**
   * Recalculate calibration factor for a topic
   * @private
   */
  async _recalculateCalibrationFactor(userId, topic) {
    const ConfidenceCalibration = require('../../models/phoenix/ConfidenceCalibration');

    try {
      const calibration = await ConfidenceCalibration.findOne({ userId, topic });
      if (!calibration || !calibration.calibrationHistory || calibration.calibrationHistory.length < 5) {
        return; // Need minimum samples
      }

      // Get recent calibration history
      const recentHistory = calibration.calibrationHistory.slice(-50);

      // Calculate average error
      const avgError = recentHistory.reduce((sum, h) => {
        return sum + (h.predictedConfidence - h.actualOutcome);
      }, 0) / recentHistory.length;

      // Calculate new factor to correct the error
      const newFactor = 1.0 - (avgError * 0.5); // Damped adjustment

      await ConfidenceCalibration.updateOne(
        { userId, topic },
        {
          $set: {
            'currentCalibration.factor': Math.max(0.5, Math.min(1.5, newFactor)),
            'currentCalibration.lastUpdated': new Date()
          }
        }
      );

    } catch (error) {
      console.warn('[RealTimeLearning] Recalculation error:', error.message);
    }
  }

  // ========================================
  // LEARNED BEHAVIORS
  // ========================================

  /**
   * Get all learned behaviors/adjustments for user
   * @param {String} userId - User ID
   * @returns {Object} Learned behaviors
   */
  async getLearnedBehaviors(userId) {
    try {
      // Get recent interactions with adjustments
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const interactions = await PhoenixLearning.find({
        userId,
        interactionTimestamp: { $gte: thirtyDaysAgo },
        'adjustments.0': { $exists: true } // Has at least one adjustment
      }).sort({ interactionTimestamp: -1 }).lean();

      // Aggregate all adjustments
      const allAdjustments = [];
      const adjustmentsByType = {};

      interactions.forEach(interaction => {
        interaction.adjustments.forEach(adj => {
          allAdjustments.push({
            ...adj.toObject(),
            interactionId: interaction._id,
            interactionDate: interaction.interactionTimestamp
          });

          if (!adjustmentsByType[adj.adjustmentType]) {
            adjustmentsByType[adj.adjustmentType] = [];
          }
          adjustmentsByType[adj.adjustmentType].push(adj);
        });
      });

      // Get learned patterns
      const patterns = await this.detectPatterns(userId);

      // Get confidence calibrations
      const calibrations = await this.getAllCalibrations(userId);

      

      return {
        totalAdjustments: allAdjustments.length,
        adjustmentsByType,
        recentAdjustments: allAdjustments.slice(0, 10),
        patterns,
        calibrations,
        summary: this._generateBehaviorSummary(adjustmentsByType, patterns, calibrations)
      };

    } catch (error) {
      console.error('[RealTimeLearning] Error getting learned behaviors:', error);
      throw error;
    }
  }

  // ========================================
  // APPLY LEARNING
  // ========================================

  /**
   * Apply learned patterns to a new query
   * @param {String} userId - User ID
   * @param {String} query - New query
   * @param {Object} context - Query context
   * @returns {Object} Learning-enhanced context
   */
  async applyLearning(userId, query, context = {}) {
    try {
      // Determine topic
      const topic = this._extractTopicArea(query, context);

      // Get learned behaviors
      const behaviors = await this.getLearnedBehaviors(userId);

      // Apply calibration to confidence
      let adjustedConfidence = context.confidence || 0.5;
      if (behaviors.calibrations[topic] && behaviors.calibrations[topic].calibrated) {
        adjustedConfidence *= behaviors.calibrations[topic].adjustmentFactor;
        adjustedConfidence = Math.max(0, Math.min(1, adjustedConfidence));
      }

      // Find relevant patterns
      const relevantPatterns = behaviors.patterns.filter(p =>
        p.topic === topic || p.topic === 'general'
      );

      // Build recommendations
      const recommendations = {
        adjustedConfidence,
        originalConfidence: context.confidence || 0.5,
        confidenceAdjustment: adjustedConfidence - (context.confidence || 0.5),
        responseStyle: this._getPreferredStyle(relevantPatterns),
        timing: this._getTimingRecommendation(relevantPatterns, context),
        approach: this._getApproachRecommendation(relevantPatterns),
        avoidPatterns: relevantPatterns.filter(p => p.patternType === 'failure_pattern'),
        usePatterns: relevantPatterns.filter(p => p.patternType === 'effective_approach'),
        expertiseLevel: this._getExpertiseLevel(relevantPatterns),
        warnings: this._getWarnings(relevantPatterns)
      };

      

      return {
        enhancedContext: {
          ...context,
          confidence: adjustedConfidence,
          topicArea: topic,
          learnedBehaviors: recommendations
        },
        recommendations,
        patternsUsed: relevantPatterns.length
      };

    } catch (error) {
      console.error('[RealTimeLearning] Error applying learning:', error);
      // Return original context on error
      return {
        enhancedContext: context,
        recommendations: null,
        error: error.message
      };
    }
  }

  // ========================================
  // ANALYTICS & INSIGHTS
  // ========================================

  /**
   * Get learning analytics for user
   * @param {String} userId - User ID
   * @param {Number} days - Days to analyze (default 30)
   * @returns {Object} Analytics
   */
  async getLearningAnalytics(userId, days = 30) {
    try {
      const stats = await PhoenixLearning.getStatistics(userId, days);

      if (!stats) {
        return {
          message: 'No data available',
          totalInteractions: 0
        };
      }

      const patterns = await this.detectPatterns(userId);
      const calibrations = await this.getAllCalibrations(userId);

      return {
        ...stats,
        patternsDetected: patterns.length,
        calibrations,
        insights: this._generateInsights(stats, patterns, calibrations)
      };

    } catch (error) {
      console.error('[RealTimeLearning] Error getting analytics:', error);
      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Determine interaction type from query
   * @private
   */
  _determineInteractionType(query, context) {
    if (context.interactionType) {
      return context.interactionType;
    }

    const lowerQuery = query.toLowerCase();

    // Simple heuristics
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) {
      return 'prediction';
    }
    if (lowerQuery.includes('suggest') || lowerQuery.includes('recommend')) {
      return 'suggestion';
    }
    if (lowerQuery.includes('pattern') || lowerQuery.includes('trend')) {
      return 'pattern_detection';
    }
    if (context.isFeedback) {
      return 'feedback';
    }

    return 'query';
  }

  /**
   * Extract topic area from query
   * @private
   */
  _extractTopicArea(query, context) {
    if (context.topicArea) {
      return context.topicArea;
    }

    const lowerQuery = query.toLowerCase();

    // Topic detection
    if (lowerQuery.match(/\b(sleep|rest|recovery)\b/)) return 'recovery';
    if (lowerQuery.match(/\b(stress|anxiety|mental|mood)\b/)) return 'mental_health';
    if (lowerQuery.match(/\b(workout|exercise|fitness|train)\b/)) return 'health';
    if (lowerQuery.match(/\b(productivity|work|focus|energy)\b/)) return 'productivity';

    return 'general';
  }

  /**
   * Get time of day
   * @private
   */
  _getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get day of week
   * @private
   */
  _getDayOfWeek() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  }

  /**
   * Generate session ID
   * @private
   */
  _generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Convert outcome to confidence score
   * @private
   */
  _outcomeToConfidence(outcome) {
    const outcomeMap = {
      'success': 1.0,
      'acted_upon': 1.0,
      'partial_success': 0.6,
      'dismissed': 0.3,
      'failure': 0.0,
      'unknown': 0.5
    };
    return outcomeMap[outcome] || 0.5;
  }

  /**
   * Trigger async pattern detection
   * @private
   */
  _detectPatternsAsync(userId, interactionId) {
    // Run in background
    setImmediate(async () => {
      try {
        await this.detectPatterns(userId);
      } catch (error) {
        console.error('[RealTimeLearning] Async pattern detection failed:', error);
      }
    });
  }

  /**
   * Learn from outcome async
   * @private
   */
  _learnFromOutcomeAsync(interaction) {
    // Run in background
    setImmediate(async () => {
      try {
        // Check if we should create behavior pattern
        if (interaction.outcome === 'success' || interaction.outcome === 'acted_upon') {
          // Success - reinforce this pattern
          const pattern = await BehaviorPattern.findOne({
            userId: interaction.userId,
            patternType: 'productivity', // Default
            pattern: `Phoenix ${interaction.interactionType} interaction`
          });

          if (pattern) {
            await pattern.recordObservation({
              value: interaction.userRating || 5,
              context: interaction.context
            });
          }
        }
      } catch (error) {
        console.error('[RealTimeLearning] Async learning failed:', error);
      }
    });
  }

  /**
   * Group interactions by topic
   * @private
   */
  _groupByTopic(interactions) {
    const groups = {};
    interactions.forEach(i => {
      const topic = i.context?.topicArea || 'general';
      if (!groups[topic]) groups[topic] = [];
      groups[topic].push(i);
    });
    return groups;
  }

  /**
   * Find commonalities in interactions
   * @private
   */
  _findCommonalities(interactions) {
    // Simplified - in production, use NLP/clustering
    const avgRating = interactions
      .filter(i => i.userRating)
      .reduce((sum, i) => sum + i.userRating, 0) /
      interactions.filter(i => i.userRating).length;

    const avgResponseLength = interactions.reduce((sum, i) =>
      sum + i.response.length, 0
    ) / interactions.length;

    return {
      description: `have structured, ${avgResponseLength > 500 ? 'detailed' : 'concise'} responses`,
      confidence: Math.min(0.9, 0.5 + (interactions.length * 0.05)),
      evidence: [
        `${interactions.length} successful interactions`,
        `Average rating: ${avgRating?.toFixed(1) || 'N/A'}`
      ],
      approach: avgResponseLength > 500 ? 'detailed explanations' : 'concise answers'
    };
  }

  /**
   * Calculate query complexity
   * @private
   */
  _calculateQueryComplexity(interactions) {
    const avgLength = interactions.reduce((sum, i) =>
      sum + i.query.length, 0
    ) / interactions.length;

    // Simple heuristic: longer queries = more complex
    return Math.min(1, avgLength / 200);
  }

  /**
   * Analyze feedback quality
   * @private
   */
  _analyzeFeedbackQuality(interactions) {
    const withFeedback = interactions.filter(i => i.userFeedback);
    if (withFeedback.length === 0) return 0;

    const detailedFeedback = withFeedback.filter(i =>
      i.userFeedback.comments && i.userFeedback.comments.length > 20
    );

    return detailedFeedback.length / withFeedback.length;
  }

  /**
   * Generate behavior summary
   * @private
   */
  _generateBehaviorSummary(adjustments, patterns, calibrations) {
    const summary = [];

    // Calibration summary
    const wellCalibrated = Object.values(calibrations).filter(c =>
      c.calibrated && c.recommendation === 'WELL_CALIBRATED'
    ).length;

    if (wellCalibrated > 0) {
      summary.push(`Phoenix is well-calibrated on ${wellCalibrated} topics`);
    }

    // Pattern summary
    const effectivePatterns = patterns.filter(p => p.patternType === 'effective_approach');
    if (effectivePatterns.length > 0) {
      summary.push(`${effectivePatterns.length} effective approach patterns learned`);
    }

    return summary.join('. ');
  }

  /**
   * Get preferred response style
   * @private
   */
  _getPreferredStyle(patterns) {
    const stylePattern = patterns.find(p => p.patternType === 'response_style');
    return stylePattern?.description || 'balanced';
  }

  /**
   * Get timing recommendation
   * @private
   */
  _getTimingRecommendation(patterns, context) {
    const timingPattern = patterns.find(p => p.patternType === 'timing_preference');
    if (timingPattern) {
      return timingPattern.recommendation;
    }
    return 'No timing preference learned';
  }

  /**
   * Get approach recommendation
   * @private
   */
  _getApproachRecommendation(patterns) {
    const effectivePattern = patterns.find(p => p.patternType === 'effective_approach');
    return effectivePattern?.recommendation || 'Use standard approach';
  }

  /**
   * Get expertise level
   * @private
   */
  _getExpertiseLevel(patterns) {
    const expertisePattern = patterns.find(p => p.patternType === 'topic_expertise');
    if (expertisePattern) {
      return expertisePattern.description.match(/(beginner|intermediate|expert)/)?.[1] || 'intermediate';
    }
    return 'intermediate';
  }

  /**
   * Get warnings
   * @private
   */
  _getWarnings(patterns) {
    const failurePatterns = patterns.filter(p => p.patternType === 'failure_pattern');
    return failurePatterns.map(p => p.recommendation);
  }

  /**
   * Generate insights
   * @private
   */
  _generateInsights(stats, patterns, calibrations) {
    const insights = [];

    // Success rate insight
    if (parseFloat(stats.successRate) > 70) {
      insights.push(`High success rate (${stats.successRate}%) - Phoenix is learning effectively`);
    } else if (parseFloat(stats.successRate) < 50) {
      insights.push(`Low success rate (${stats.successRate}%) - Phoenix needs more learning data`);
    }

    // Pattern insight
    if (patterns.length > 5) {
      insights.push(`${patterns.length} behavioral patterns identified`);
    }

    // Calibration insight
    const overconfident = Object.values(calibrations).filter(c =>
      c.calibrated && c.isOverconfident
    ).length;

    if (overconfident > 0) {
      insights.push(`Phoenix is overconfident on ${overconfident} topics - adjusting confidence levels`);
    }

    return insights;
  }

  // ========================================
  // INTERACTION CHAIN METHODS
  // ========================================

  /**
   * Add interaction to conversation chain for context tracking
   * @private
   */
  async _addToInteractionChain(userId, interaction, context) {
    try {
      // Get or create chain for this session
      const chain = await InteractionChain.getOrCreateForSession(
        userId,
        context.sessionId || this._generateSessionId()
      );

      // Add interaction to chain
      await chain.addInteraction({
        interactionId: interaction._id,
        query: interaction.query,
        responseSnippet: interaction.response?.substring(0, 200),
        intent: this._detectInteractionIntent(interaction.query, context)
      });

      // Set topic if not already set
      if (!chain.context.topic && context.topicArea) {
        await chain.setTopic(context.topicArea);
      }

      
    } catch (error) {
      console.warn('[RealTimeLearning] Chain tracking error:', error.message);
    }
  }

  /**
   * Detect the intent of an interaction
   * @private
   */
  _detectInteractionIntent(query, context) {
    const queryLower = query.toLowerCase();

    if (context.previousInteractionId) {
      // It's a follow-up
      if (/\?$/.test(query) || /clarif|explain|what do you mean/i.test(queryLower)) {
        return 'clarification';
      }
      if (/no|wrong|incorrect|that's not/i.test(queryLower)) {
        return 'correction';
      }
      if (/ok|thanks|got it|understood/i.test(queryLower)) {
        return 'acknowledgment';
      }
      return 'follow_up';
    }

    if (/but |however |also |and /i.test(queryLower)) {
      return 'continuation';
    }

    return 'new_question';
  }

  /**
   * Get recent conversation chains for user
   */
  async getRecentChains(userId, limit = 10) {
    try {
      return await InteractionChain.getRecentActive(userId, limit);
    } catch (error) {
      console.warn('[RealTimeLearning] Error getting chains:', error.message);
      return [];
    }
  }

  /**
   * Mark a chain as resolved
   */
  async resolveChain(chainId, resolutionType = 'answered') {
    try {
      const chain = await InteractionChain.findOne({ chainId });
      if (chain) {
        await chain.resolve(resolutionType);
        
      }
    } catch (error) {
      console.warn('[RealTimeLearning] Error resolving chain:', error.message);
    }
  }

  // ========================================
  // USER TEACHING METHODS
  // ========================================

  /**
   * Record when user teaches/corrects Phoenix
   */
  async recordUserTeaching(userId, originalInteractionId, correction, mistakeType = 'other') {
    try {
      // Get the original interaction
      const original = await PhoenixLearning.findById(originalInteractionId);
      if (!original) {
        return { error: 'Original interaction not found' };
      }

      const teaching = new UserTeaching({
        userId,
        teachingId: `teaching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalInteractionId,
        mistakeType,
        phoenixSaid: original.response,
        userCorrection: correction,
        lessonLearned: {
          summary: `User corrected Phoenix about: ${mistakeType}`,
          rule: `When user asks about similar topics, remember this correction`,
          confidence: 0.5,
          appliedCount: 0,
          scope: 'user_specific'
        },
        context: {
          topic: original.context?.topicArea,
          sessionId: original.sessionId
        },
        active: true,
        timestamp: new Date()
      });

      await teaching.save();
      

      return {
        success: true,
        teachingId: teaching.teachingId
      };
    } catch (error) {
      console.error('[RealTimeLearning] Error recording teaching:', error);
      return { error: error.message };
    }
  }

  /**
   * Get teachings that apply to a query
   */
  async getApplicableTeachings(userId, query, topic = null) {
    try {
      return await UserTeaching.getApplicableTeachings(userId, query, topic);
    } catch (error) {
      console.warn('[RealTimeLearning] Error getting teachings:', error.message);
      return [];
    }
  }

  /**
   * Apply a teaching (increment usage counter)
   */
  async applyTeaching(teachingId) {
    try {
      const teaching = await UserTeaching.findOne({ teachingId });
      if (teaching) {
        await teaching.apply();
        
      }
    } catch (error) {
      console.warn('[RealTimeLearning] Error applying teaching:', error.message);
    }
  }

  /**
   * Validate a teaching (was it helpful?)
   */
  async validateTeaching(teachingId, wasSuccessful, feedback = null) {
    try {
      const teaching = await UserTeaching.findOne({ teachingId });
      if (teaching) {
        await teaching.recordValidation(wasSuccessful, feedback);
        
      }
    } catch (error) {
      console.warn('[RealTimeLearning] Error validating teaching:', error.message);
    }
  }

  /**
   * Get teaching statistics for user
   */
  async getTeachingStats(userId) {
    try {
      return await UserTeaching.getStats(userId);
    } catch (error) {
      console.warn('[RealTimeLearning] Error getting teaching stats:', error.message);
      return null;
    }
  }
}

// Export singleton instance
const realTimeLearningService = new RealTimeLearningService();

module.exports = {
  // Main service instance
  service: realTimeLearningService,

  // Direct method exports for convenience
  logInteraction: (userId, query, response, outcome, context) =>
    realTimeLearningService.logInteraction(userId, query, response, outcome, context),

  updateInteractionOutcome: (interactionId, outcome) =>
    realTimeLearningService.updateInteractionOutcome(interactionId, outcome),

  detectPatterns: (userId, timeRange) =>
    realTimeLearningService.detectPatterns(userId, timeRange),

  calibrateConfidence: (userId, topic) =>
    realTimeLearningService.calibrateConfidence(userId, topic),

  getLearnedBehaviors: (userId) =>
    realTimeLearningService.getLearnedBehaviors(userId),

  applyLearning: (userId, query, context) =>
    realTimeLearningService.applyLearning(userId, query, context),

  getLearningAnalytics: (userId, days) =>
    realTimeLearningService.getLearningAnalytics(userId, days),

  getAllCalibrations: (userId) =>
    realTimeLearningService.getAllCalibrations(userId)
};
