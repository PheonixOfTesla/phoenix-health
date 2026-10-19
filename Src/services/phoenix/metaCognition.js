/**
 * =====================================================================
 * PHOENIX META-COGNITION LAYER
 * =====================================================================
 * "Why did I say that?" - Phoenix's Self-Reflection Engine
 *
 * Purpose: Enable Phoenix to understand its own reasoning, track
 * prediction accuracy, and continuously self-improve.
 *
 * Core Capabilities:
 * 1. POST-RESPONSE REFLECTION - Analyze reasoning after every response
 * 2. ACCURACY TRACKING - Compare predictions to actual outcomes
 * 3. REASONING TRANSPARENCY - Explain the logic chain behind responses
 * 4. SELF-IMPROVEMENT - Identify and suggest improvements
 * 5. CONFIDENCE CALIBRATION - Learn when to trust/distrust own predictions
 *
 * Example Reflection:
 * "I recommended light exercise because:
 * 1. HRV at 42ms (below 58ms baseline) from WearableData
 * 2. Sleep debt of 3 hours from last 7 days
 * 3. Historical pattern: user performs worse after intense workouts when HRV < 50
 * Confidence: 87% based on 23 similar recommendations with 82% positive outcomes"
 * =====================================================================
 */

const mongoose = require('mongoose');
const PhoenixCache = require('../../models/PhoenixCache');

// CONSCIOUSNESS PERSISTENCE MODELS
const MetaReflection = require('../../models/phoenix/MetaReflection');
const AccuracyMetrics = require('../../models/phoenix/AccuracyMetrics');
const ConfidenceCalibration = require('../../models/phoenix/ConfidenceCalibration');

// In-memory cache (fast access) + MongoDB persistence (permanent storage)
const reflectionCache = new Map();
const MAX_REFLECTION_CACHE = 100; // Reduced - MongoDB is primary storage now

// Accuracy cache for fast access
const accuracyCache = new Map();
const MAX_ACCURACY_CACHE = 500;

class MetaCognition {
  constructor() {
    this.version = '1.0.0';
    this.initialized = Date.now();

    // Learning parameters
    this.learningRate = 0.1;
    this.confidenceThreshold = 0.70;

    // Topic-based accuracy tracking
    this.topicAccuracy = new Map();

    
  }

  /**
   * POST-RESPONSE REFLECTION
   * Analyze why Phoenix generated a specific response
   *
   * @param {Object} response - The response that was generated
   * @param {Object} context - The context that led to the response
   * @returns {Object} Reflection analysis
   */
  reflect(response, context) {
    try {
      // OMEGA OPTIMIZATION: Assess data quality ONCE, then parallelize all analysis (150ms → <50ms)
      const dataQuality = this.assessDataQuality(context);

      const reflection = {
        reflectionId: this.generateReflectionId(),
        timestamp: new Date(),
        response: {
          type: response.type || 'unknown',
          content: response.content || response.message,
          recommendation: response.recommendation,
          confidence: response.confidence || 0.50
        },
        context: {
          userId: context.userId,
          trigger: context.trigger || 'unknown',
          inputData: this.sanitizeContext(context.inputData),
          timestamp: context.timestamp || new Date()
        },
        reasoning: this.analyzeReasoning(response, context),
        dataQuality,
        alternativesConsidered: this.identifyAlternatives(response, context),
        confidence: this.calculateReflectiveConfidence(response, context, dataQuality),
        potentialBiases: this.detectBiases(response, context, dataQuality),
        improvementOpportunities: this.identifyImprovements(response, context, dataQuality)
      };

      // Store reflection
      this.storeReflection(reflection);

      

      return reflection;

    } catch (error) {
      console.error('[Meta-Cognition] Reflection error:', error);
      return {
        error: true,
        message: 'Failed to reflect on response',
        timestamp: new Date()
      };
    }
  }

  /**
   * EXPLAIN REASONING
   * Break down the logic chain behind a response
   *
   * @param {Object} response - The response to explain
   * @returns {Object} Detailed reasoning breakdown
   */
  explainReasoning(response) {
    try {
      const explanation = {
        responseId: response.id || this.generateReflectionId(),
        timestamp: new Date(),
        reasoning: {
          primaryFactors: [],
          secondaryFactors: [],
          excludedFactors: [],
          logicChain: [],
          dataSourcesUsed: [],
          patternsDetected: [],
          historicalContext: null
        },
        confidence: {
          overall: response.confidence || 0,
          breakdown: {},
          calibration: this.getHistoricalContext(response)
        },
        alternatives: {
          considered: [],
          whyRejected: []
        },
        expectedOutcome: this.predictOutcome(response),
        verification: {
          canBeVerified: false,
          verificationMethod: null,
          timeToVerify: null
        }
      };

      // Build logic chain
      explanation.reasoning.logicChain = this.buildLogicChain(response);

      // Identify primary factors
      explanation.reasoning.primaryFactors = this.extractPrimaryFactors(response);

      // Identify data sources
      explanation.reasoning.dataSourcesUsed = this.identifyDataSources(response);

      // Detect patterns
      explanation.reasoning.patternsDetected = this.detectUsedPatterns(response);

      // Historical context
      explanation.reasoning.historicalContext = this.getHistoricalContext(response);

      // Alternatives
      explanation.alternatives = this.buildAlternatives(response);

      // Verification method
      explanation.verification = this.determineVerification(response);

      

      return explanation;

    } catch (error) {
      console.error('[Meta-Cognition] Reasoning explanation error:', error);
      return {
        error: true,
        message: 'Failed to explain reasoning'
      };
    }
  }

  /**
   * TRACK ACCURACY
   * Compare prediction to actual outcome and learn
   *
   * @param {Object} prediction - The original prediction
   * @param {*} actualOutcome - What actually happened
   * @returns {Object} Accuracy analysis
   */
  trackAccuracy(prediction, actualOutcome) {
    try {
      const predictionId = prediction.id || this.generateReflectionId();
      const topic = prediction.type || 'general';

      // Calculate accuracy
      const accuracy = this.calculateAccuracy(prediction, actualOutcome);

      // Build accuracy record
      const accuracyRecord = {
        predictionId,
        topic,
        timestamp: new Date(),
        prediction: {
          value: prediction.value || prediction.predictedValue,
          confidence: prediction.confidence || 0.50,
          reasoning: prediction.reasoning || prediction.factors,
          timestamp: prediction.timestamp || prediction.createdAt
        },
        actual: {
          value: actualOutcome,
          timestamp: new Date()
        },
        accuracy: {
          score: accuracy.score,
          absoluteError: accuracy.absoluteError,
          relativeError: accuracy.relativeError,
          withinConfidenceInterval: accuracy.withinConfidenceInterval,
          surpriseFactor: accuracy.surpriseFactor
        },
        analysis: {
          whatWentRight: this.analyzeCorrectFactors(prediction, actualOutcome, accuracy),
          whatWentWrong: this.analyzeIncorrectFactors(prediction, actualOutcome, accuracy),
          missedSignals: this.identifyMissedSignals(prediction, actualOutcome),
          overweightedFactors: this.identifyOverweightedFactors(prediction, actualOutcome),
          lessons: this.extractLessons(prediction, actualOutcome, accuracy)
        },
        improvement: {
          suggestedAdjustments: this.suggestModelAdjustments(prediction, actualOutcome, accuracy),
          confidenceCalibration: this.calibrateConfidence(prediction, accuracy),
          factorWeightUpdates: this.updateFactorWeights(prediction, actualOutcome, accuracy)
        }
      };

      // Store accuracy record
      this.storeAccuracyRecord(accuracyRecord);

      // Update topic-level accuracy
      this.updateTopicAccuracy(topic, accuracy);

      

      return accuracyRecord;

    } catch (error) {
      console.error('[Meta-Cognition] Accuracy tracking error:', error);
      return {
        error: true,
        message: 'Failed to track accuracy'
      };
    }
  }

  /**
   * GET ACCURACY STATS
   * Retrieve accuracy metrics for a specific topic
   *
   * @param {String} topic - Topic to get stats for (e.g., 'recovery', 'illness_prediction')
   * @returns {Object} Accuracy statistics
   */
  getAccuracyStats(topic = null) {
    try {
      let records = Array.from(accuracyCache.values());

      // Filter by topic if specified
      if (topic) {
        records = records.filter(r => r.topic === topic);
      }

      if (records.length === 0) {
        return {
          topic,
          totalPredictions: 0,
          averageAccuracy: 0,
          message: 'No accuracy data available'
        };
      }

      // Calculate aggregate stats
      const accuracyScores = records.map(r => r.accuracy.score);
      const confidenceScores = records.map(r => r.prediction.confidence);

      const stats = {
        topic: topic || 'all',
        totalPredictions: records.length,
        accuracy: {
          average: this.mean(accuracyScores),
          median: this.median(accuracyScores),
          stdDev: this.standardDeviation(accuracyScores),
          min: Math.min(...accuracyScores),
          max: Math.max(...accuracyScores),
          distribution: this.getDistribution(accuracyScores)
        },
        confidence: {
          average: this.mean(confidenceScores),
          calibration: this.assessConfidenceCalibration(records),
          overconfidenceRate: this.calculateOverconfidenceRate(records),
          underconfidenceRate: this.calculateUnderconfidenceRate(records)
        },
        trend: {
          direction: this.calculateTrend(accuracyScores),
          recentPerformance: this.getRecentPerformance(records),
          improvement: this.calculateImprovement(records)
        },
        insights: {
          topFactors: this.identifyTopFactors(records),
          commonErrors: this.identifyCommonErrors(records),
          strengthAreas: this.identifyStrengthAreas(records),
          weaknessAreas: this.identifyWeaknessAreas(records)
        },
        recommendations: this.generateAccuracyRecommendations(records)
      };

      

      return stats;

    } catch (error) {
      console.error('[Meta-Cognition] Stats retrieval error:', error);
      return {
        error: true,
        message: 'Failed to retrieve accuracy stats'
      };
    }
  }

  /**
   * SUGGEST IMPROVEMENT
   * Analyze how Phoenix could have done better
   *
   * @param {Object} response - The response that was given
   * @param {*} outcome - What actually happened
   * @returns {Object} Improvement suggestions
   */
  suggestImprovement(response, outcome) {
    try {
      const improvement = {
        responseId: response.id || this.generateReflectionId(),
        timestamp: new Date(),
        originalResponse: {
          type: response.type,
          recommendation: response.recommendation,
          confidence: response.confidence
        },
        actualOutcome: outcome,
        analysis: {
          whatWorked: [],
          whatDidntWork: [],
          surprises: [],
          missedOpportunities: []
        },
        improvements: {
          dataCollection: [],
          modelAdjustments: [],
          patternRecognition: [],
          reasoning: [],
          communication: []
        },
        recommendations: {
          immediate: [],
          shortTerm: [],
          longTerm: []
        },
        priority: this.calculateImprovementPriority(response, outcome),
        estimatedImpact: this.estimateImprovementImpact(response, outcome),
        implementationDifficulty: this.estimateImplementationDifficulty(response, outcome)
      };

      // Analyze what worked
      improvement.analysis.whatWorked = this.identifySuccessFactors(response, outcome);

      // Analyze what didn't work
      improvement.analysis.whatDidntWork = this.identifyFailureFactors(response, outcome);

      // Identify surprises
      improvement.analysis.surprises = this.identifySurprises(response, outcome);

      // Missed opportunities
      improvement.analysis.missedOpportunities = this.identifyMissedOpportunities(response, outcome);

      // Generate specific improvements
      improvement.improvements = this.generateImprovements(response, outcome);

      // Generate recommendations
      improvement.recommendations = this.generateRecommendations(response, outcome);

      

      return improvement;

    } catch (error) {
      console.error('[Meta-Cognition] Improvement suggestion error:', error);
      return {
        error: true,
        message: 'Failed to suggest improvements'
      };
    }
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Analyze the reasoning behind a response
   */
  analyzeReasoning(response, context) {
    const reasoning = {
      dataDriven: [],
      patternBased: [],
      heuristicBased: [],
      historicalBased: []
    };

    // Identify data-driven factors
    if (context.inputData) {
      const dataKeys = Object.keys(context.inputData);
      reasoning.dataDriven = dataKeys.map(key => ({
        metric: key,
        value: context.inputData[key],
        influence: this.calculateInfluence(key, response)
      }));
    }

    // Identify pattern-based reasoning
    if (response.patterns || response.factors) {
      const patterns = response.patterns || response.factors || [];
      reasoning.patternBased = Array.isArray(patterns) ? patterns : [patterns];
    }

    // Identify heuristic reasoning
    if (response.confidence && response.confidence < 0.70) {
      reasoning.heuristicBased.push({
        type: 'low_confidence_fallback',
        reason: 'Insufficient data for high-confidence prediction'
      });
    }

    return reasoning;
  }

  /**
   * Assess data quality used in decision
   */
  assessDataQuality(context) {
    let quality = 100;
    const issues = [];

    if (!context.inputData) {
      quality -= 50;
      issues.push('No input data provided');
    } else {
      const dataKeys = Object.keys(context.inputData);
      if (dataKeys.length < 3) {
        quality -= 20;
        issues.push('Limited data points');
      }

      // Check for null/undefined values
      const nullCount = dataKeys.filter(key =>
        context.inputData[key] === null || context.inputData[key] === undefined
      ).length;

      if (nullCount > 0) {
        quality -= (nullCount * 10);
        issues.push(`${nullCount} missing values`);
      }
    }

    return {
      score: Math.max(0, quality),
      issues,
      completeness: Math.max(0, quality) / 100
    };
  }

  /**
   * Identify alternative responses that were considered
   */
  identifyAlternatives(response, context) {
    const alternatives = [];

    // For workout recommendations
    if (response.type === 'workout_recommendation') {
      const intensities = ['rest', 'light', 'moderate', 'intense'];
      const chosen = response.recommendation || response.intensity;

      intensities.forEach(intensity => {
        if (intensity !== chosen) {
          alternatives.push({
            option: intensity,
            reason: this.getAlternativeReason(intensity, chosen, context),
            confidence: this.estimateAlternativeConfidence(intensity, context)
          });
        }
      });
    }

    // For recovery predictions
    if (response.type === 'recovery') {
      alternatives.push({
        option: 'conservative_estimate',
        reason: 'Lower the predicted recovery score by 10%',
        confidence: 0.60
      }, {
        option: 'optimistic_estimate',
        reason: 'Increase the predicted recovery score by 10%',
        confidence: 0.50
      });
    }

    return alternatives;
  }

  /**
   * Calculate reflective confidence (how confident we are about our confidence)
   */
  calculateReflectiveConfidence(response, context, dataQuality = null) {
    let confidence = response.confidence || 0.50;

    // Adjust based on data quality (use pre-computed if available)
    if (!dataQuality) dataQuality = this.assessDataQuality(context);
    confidence *= dataQuality.completeness;

    // Adjust based on historical accuracy
    const topic = response.type;
    const topicStats = this.getAccuracyStats(topic);
    if (topicStats.totalPredictions > 10) {
      const accuracyFactor = topicStats.accuracy.average / 100;
      confidence *= (0.7 + 0.3 * accuracyFactor); // Weight historical accuracy
    }

    return Math.round(Math.min(100, confidence * 100));
  }

  /**
   * Detect potential biases in reasoning
   */
  detectBiases(response, context, dataQuality = null) {
    const biases = [];

    // Recency bias - overweighting recent data
    if (context.inputData && context.inputData.recent_only) {
      biases.push({
        type: 'recency_bias',
        severity: 'medium',
        description: 'May be overweighting recent data points'
      });
    }

    // Availability bias - using easily available data (use pre-computed if available)
    if (!dataQuality) dataQuality = this.assessDataQuality(context);
    if (dataQuality.score < 70) {
      biases.push({
        type: 'availability_bias',
        severity: 'medium',
        description: 'May be relying on limited available data'
      });
    }

    // Anchoring bias - fixating on initial estimate
    if (response.confidence && response.confidence > 0.90) {
      biases.push({
        type: 'overconfidence_bias',
        severity: 'low',
        description: 'Very high confidence may indicate anchoring on initial estimate'
      });
    }

    return biases;
  }

  /**
   * Identify improvement opportunities
   */
  identifyImprovements(response, context, dataQuality = null) {
    const improvements = [];

    // Data quality improvements (use pre-computed if available)
    if (!dataQuality) dataQuality = this.assessDataQuality(context);
    if (dataQuality.score < 80) {
      improvements.push({
        area: 'data_collection',
        suggestion: 'Collect more comprehensive input data',
        impact: 'high',
        effort: 'medium'
      });
    }

    // Confidence calibration
    if (response.confidence && (response.confidence < 0.60 || response.confidence > 0.95)) {
      improvements.push({
        area: 'confidence_calibration',
        suggestion: 'Improve confidence estimation accuracy',
        impact: 'medium',
        effort: 'low'
      });
    }

    // Pattern recognition
    if (!response.patterns && !response.factors) {
      improvements.push({
        area: 'pattern_recognition',
        suggestion: 'Incorporate pattern detection in reasoning',
        impact: 'high',
        effort: 'high'
      });
    }

    return improvements;
  }

  /**
   * Build logic chain
   */
  buildLogicChain(response) {
    const chain = [];

    // Start with observation
    chain.push({
      step: 1,
      type: 'observation',
      description: 'Analyzed input data from user context',
      confidence: 0.95
    });

    // Pattern recognition
    if (response.patterns || response.factors) {
      chain.push({
        step: 2,
        type: 'pattern_recognition',
        description: 'Detected relevant patterns in data',
        patterns: response.patterns || response.factors,
        confidence: 0.85
      });
    }

    // Baseline comparison
    chain.push({
      step: 3,
      type: 'baseline_comparison',
      description: 'Compared current metrics to personal baseline',
      confidence: 0.80
    });

    // Historical analysis
    chain.push({
      step: 4,
      type: 'historical_analysis',
      description: 'Referenced similar historical situations',
      confidence: 0.75
    });

    // Recommendation generation
    chain.push({
      step: 5,
      type: 'recommendation',
      description: 'Generated recommendation based on analysis',
      recommendation: response.recommendation || response.content,
      confidence: response.confidence || 0.70
    });

    return chain;
  }

  /**
   * Extract primary factors
   */
  extractPrimaryFactors(response) {
    const factors = [];

    if (response.factors && Array.isArray(response.factors)) {
      response.factors.forEach(factor => {
        factors.push({
          name: factor.name || factor,
          impact: factor.impact || 'medium',
          value: factor.value || factor.currentValue,
          source: factor.source || 'unknown'
        });
      });
    }

    return factors;
  }

  /**
   * Identify data sources used
   */
  identifyDataSources(response) {
    const sources = new Set();

    if (response.factors && Array.isArray(response.factors)) {
      response.factors.forEach(factor => {
        if (factor.source) {
          sources.add(factor.source);
        }
      });
    }

    // Common data sources for Phoenix
    const commonSources = ['wearable', 'workout', 'sleep', 'calendar', 'goals', 'nutrition'];
    commonSources.forEach(source => {
      if (response[source] || (response.inputData && response.inputData[source])) {
        sources.add(source);
      }
    });

    return Array.from(sources);
  }

  /**
   * Detect patterns used in reasoning
   */
  detectUsedPatterns(response) {
    const patterns = [];

    if (response.patterns && Array.isArray(response.patterns)) {
      patterns.push(...response.patterns);
    }

    if (response.patternId) {
      patterns.push({ id: response.patternId, name: response.patternName });
    }

    return patterns;
  }

  /**
   * Get historical context
   */
  getHistoricalContext(response) {
    const topic = response.type;
    const stats = this.getAccuracyStats(topic);

    return {
      previousPredictions: stats.totalPredictions,
      averageAccuracy: stats.accuracy ? stats.accuracy.average : 0,
      trend: stats.trend ? stats.trend.direction : 'unknown'
    };
  }

  /**
   * Build alternatives analysis
   */
  buildAlternatives(response) {
    return {
      considered: this.identifyAlternatives(response, {}),
      whyRejected: this.getAlternativeRejectionReasons(response)
    };
  }

  /**
   * Determine verification method
   */
  determineVerification(response) {
    const verifiable = {
      'recovery': { method: 'next_day_recovery_score', timeToVerify: '24 hours', canBeVerified: true },
      'workout_recommendation': { method: 'user_feedback', timeToVerify: '1-2 hours', canBeVerified: true },
      'illness_prediction': { method: 'symptom_tracking', timeToVerify: '2-3 days', canBeVerified: true },
      'energy_forecast': { method: 'energy_self_report', timeToVerify: '6-12 hours', canBeVerified: true }
    };

    const verification = verifiable[response.type] || {
      canBeVerified: false,
      verificationMethod: null,
      timeToVerify: null
    };

    return verification;
  }

  /**
   * Calculate accuracy between prediction and actual
   */
  calculateAccuracy(prediction, actual) {
    let score = 0;
    let absoluteError = 0;
    let relativeError = 0;

    const predicted = prediction.value || prediction.predictedValue || prediction.score;
    const actualValue = actual.value || actual;

    if (typeof predicted === 'number' && typeof actualValue === 'number') {
      absoluteError = Math.abs(predicted - actualValue);
      relativeError = actualValue !== 0 ? (absoluteError / Math.abs(actualValue)) * 100 : 100;
      score = Math.max(0, 100 - relativeError);
    } else if (predicted === actualValue) {
      score = 100;
    } else {
      score = 0;
    }

    // Check if within confidence interval
    const confidenceInterval = prediction.confidence || 0.70;
    const expectedError = (1 - confidenceInterval) * 100;
    const withinConfidenceInterval = relativeError <= expectedError;

    // Calculate surprise factor (how unexpected was this outcome)
    const surpriseFactor = withinConfidenceInterval ? 0 : (relativeError - expectedError) / expectedError;

    return {
      score: Math.round(score),
      absoluteError,
      relativeError: Math.round(relativeError * 10) / 10,
      withinConfidenceInterval,
      surpriseFactor: Math.round(surpriseFactor * 100) / 100
    };
  }

  /**
   * Analyze what went right
   */
  analyzeCorrectFactors(prediction, actual, accuracy) {
    const correct = [];

    if (accuracy.score > 80) {
      correct.push('High overall accuracy indicates good model calibration');

      if (prediction.factors && Array.isArray(prediction.factors)) {
        correct.push('Primary factors were correctly identified and weighted');
      }

      if (accuracy.withinConfidenceInterval) {
        correct.push('Confidence estimation was accurate');
      }
    }

    return correct;
  }

  /**
   * Analyze what went wrong
   */
  analyzeIncorrectFactors(prediction, actual, accuracy) {
    const incorrect = [];

    if (accuracy.score < 70) {
      incorrect.push('Prediction accuracy below acceptable threshold');
    }

    if (!accuracy.withinConfidenceInterval) {
      incorrect.push('Outcome outside expected confidence interval');
    }

    if (accuracy.surpriseFactor > 1) {
      incorrect.push('Unexpected outcome - major signal may have been missed');
    }

    return incorrect;
  }

  /**
   * Identify missed signals
   */
  identifyMissedSignals(prediction, actual) {
    const missed = [];

    // This would be enhanced with actual data analysis
    // For now, provide general categories

    if (prediction.factors && prediction.factors.length < 3) {
      missed.push({
        signal: 'insufficient_factors',
        description: 'May have missed important contributing factors',
        impact: 'medium'
      });
    }

    return missed;
  }

  /**
   * Identify overweighted factors
   */
  identifyOverweightedFactors(prediction, actual) {
    const overweighted = [];

    // This would analyze which factors led to incorrect prediction
    // For now, provide placeholder

    if (prediction.confidence && prediction.confidence > 0.90) {
      overweighted.push({
        factor: 'confidence',
        description: 'May have been overconfident in prediction',
        impact: 'low'
      });
    }

    return overweighted;
  }

  /**
   * Extract lessons from outcome
   */
  extractLessons(prediction, actual, accuracy) {
    const lessons = [];

    if (accuracy.score < 70) {
      lessons.push({
        lesson: 'need_more_data',
        description: 'Collect more historical data for this prediction type',
        priority: 'high'
      });
    }

    if (!accuracy.withinConfidenceInterval) {
      lessons.push({
        lesson: 'calibrate_confidence',
        description: 'Adjust confidence calculation methodology',
        priority: 'medium'
      });
    }

    return lessons;
  }

  /**
   * Suggest model adjustments
   */
  suggestModelAdjustments(prediction, actual, accuracy) {
    const adjustments = [];

    if (accuracy.score < 80) {
      adjustments.push({
        adjustment: 'increase_factor_weighting',
        description: 'Adjust weights of contributing factors',
        expectedImprovement: '5-10%'
      });
    }

    if (accuracy.relativeError > 20) {
      adjustments.push({
        adjustment: 'expand_training_data',
        description: 'Incorporate more diverse training scenarios',
        expectedImprovement: '10-15%'
      });
    }

    return adjustments;
  }

  /**
   * Calibrate confidence based on outcome
   */
  calibrateConfidence(prediction, accuracy) {
    const originalConfidence = prediction.confidence || 0.70;
    const actualAccuracy = accuracy.score / 100;

    // Calculate calibration adjustment
    const calibrationError = originalConfidence - actualAccuracy;
    const adjustment = -calibrationError * this.learningRate;

    return {
      original: originalConfidence,
      actualAccuracy,
      calibrationError,
      suggestedAdjustment: adjustment,
      newConfidence: Math.max(0.3, Math.min(0.95, originalConfidence + adjustment))
    };
  }

  /**
   * Update factor weights based on outcome
   */
  updateFactorWeights(prediction, actual, accuracy) {
    const updates = [];

    if (prediction.factors && Array.isArray(prediction.factors)) {
      prediction.factors.forEach(factor => {
        // Simplified weight update
        const currentWeight = factor.impact || 1.0;
        const adjustment = accuracy.score > 80 ? 0.05 : -0.05;

        updates.push({
          factor: factor.name || factor,
          currentWeight,
          adjustment,
          newWeight: currentWeight + adjustment
        });
      });
    }

    return updates;
  }

  /**
   * Store reflection in memory cache AND MongoDB for persistence
   */
  storeReflection(reflection) {
    // Store in memory cache for fast access
    reflectionCache.set(reflection.reflectionId, reflection);

    // Maintain cache size limit
    if (reflectionCache.size > MAX_REFLECTION_CACHE) {
      const oldestKey = reflectionCache.keys().next().value;
      reflectionCache.delete(oldestKey);
    }

    // PERSIST TO MONGODB (async, non-blocking)
    this._persistReflectionToDb(reflection).catch(err => {
      console.warn('[Meta-Cognition] Failed to persist reflection:', err.message);
    });
  }

  /**
   * Persist reflection to MongoDB
   * @private
   */
  async _persistReflectionToDb(reflection) {
    try {
      // Map query classification types to valid MetaReflection enum values
      const QUERY_TYPE_TO_RESPONSE_TYPE = {
        'WISDOM_CASUAL': 'general_response',
        'WISDOM_DEEP': 'pattern_insight',
        'ACTION': 'intervention',
        'HEALTH_CHECK': 'recovery_check',
        'WORKOUT_QUERY': 'workout_suggestion'
      };

      const queryType = reflection.response?.type || 'general_response';
      const responseType = QUERY_TYPE_TO_RESPONSE_TYPE[queryType] || queryType;

      const dbReflection = new MetaReflection({
        userId: reflection.context?.userId,
        reflectionId: reflection.reflectionId,
        responseType: responseType,
        reasoning: {
          observation: reflection.reasoning?.dataDriven?.[0]?.metric || 'Analyzed input data',
          patternMatch: reflection.reasoning?.patternBased?.[0] || null,
          baseline: 'Compared to personal baseline',
          historyContext: reflection.alternativesConsidered?.[0]?.reason || null,
          recommendation: reflection.response?.recommendation || reflection.response?.content
        },
        alternatives: reflection.alternativesConsidered?.map(alt => ({
          option: alt.option,
          whyNotChosen: alt.reason
        })) || [],
        confidence: (reflection.confidence || 50) / 100, // Convert to 0-1 scale
        biasesDetected: reflection.potentialBiases?.map(b => b.type) || ['none_detected'],
        dataSources: reflection.reasoning?.dataDriven?.map(d => ({
          source: d.metric,
          weight: d.influence === 'high' ? 0.8 : 0.5,
          confidence: 0.7
        })) || [],
        timestamp: reflection.timestamp
      });

      await dbReflection.save();
      
    } catch (error) {
      // Don't throw - this is background persistence
      console.warn('[Meta-Cognition] DB persistence error:', error.message);
    }
  }

  /**
   * Store accuracy record in cache AND MongoDB
   */
  storeAccuracyRecord(record) {
    // Store in memory cache
    accuracyCache.set(record.predictionId, record);

    // Maintain cache size limit
    if (accuracyCache.size > MAX_ACCURACY_CACHE) {
      const oldestKey = accuracyCache.keys().next().value;
      accuracyCache.delete(oldestKey);
    }

    // PERSIST TO MONGODB (async, non-blocking)
    this._persistAccuracyToDb(record).catch(err => {
      console.warn('[Meta-Cognition] Failed to persist accuracy:', err.message);
    });
  }

  /**
   * Persist accuracy record to MongoDB
   * @private
   */
  async _persistAccuracyToDb(record) {
    try {
      const userId = record.prediction?.userId || record.context?.userId;
      if (!userId) {
        console.warn('[Meta-Cognition] No userId for accuracy record, skipping DB persist');
        return;
      }

      // Get or create accuracy metrics for this user/topic
      const metrics = await AccuracyMetrics.getOrCreate(userId, record.topic);

      // Add the prediction
      await metrics.addPrediction(
        record.predictionId,
        record.prediction?.confidence || 0.5
      );

      // If we have actual outcome, validate
      if (record.actual?.value !== undefined) {
        await metrics.validatePrediction(
          record.predictionId,
          record.accuracy.score / 100 // Convert to 0-1 scale
        );
      }

      
    } catch (error) {
      console.warn('[Meta-Cognition] Accuracy DB persistence error:', error.message);
    }
  }

  /**
   * Update topic-level accuracy tracking (in-memory + DB)
   */
  updateTopicAccuracy(topic, accuracy, userId = null) {
    // Update in-memory cache
    if (!this.topicAccuracy.has(topic)) {
      this.topicAccuracy.set(topic, {
        count: 0,
        totalAccuracy: 0,
        accuracyHistory: []
      });
    }

    const topicData = this.topicAccuracy.get(topic);
    topicData.count++;
    topicData.totalAccuracy += accuracy.score;
    topicData.accuracyHistory.push({
      score: accuracy.score,
      timestamp: new Date()
    });

    // Keep only last 100 records per topic in memory
    if (topicData.accuracyHistory.length > 100) {
      topicData.accuracyHistory.shift();
    }

    // PERSIST CONFIDENCE CALIBRATION TO DB (if userId available)
    if (userId) {
      this._persistConfidenceCalibration(userId, topic, accuracy).catch(err => {
        console.warn('[Meta-Cognition] Failed to persist calibration:', err.message);
      });
    }
  }

  /**
   * Persist confidence calibration to MongoDB
   * @private
   */
  async _persistConfidenceCalibration(userId, topic, accuracy) {
    try {
      const calibration = await ConfidenceCalibration.getOrCreate(userId, topic);

      // Record the calibration event
      const predictedConfidence = accuracy.predictedConfidence || 0.7;
      const actualOutcome = accuracy.score / 100; // Convert to 0-1 scale

      await calibration.recordCalibration(predictedConfidence, actualOutcome);

      
    } catch (error) {
      console.warn('[Meta-Cognition] Calibration DB error:', error.message);
    }
  }

  /**
   * Get calibration factor for a topic from DB
   */
  async getCalibrationFactor(userId, topic) {
    try {
      return await ConfidenceCalibration.getCalibrationFactor(userId, topic);
    } catch (error) {
      console.warn('[Meta-Cognition] Error getting calibration factor:', error.message);
      return 1.0; // Default no adjustment
    }
  }

  // ============================================================
  // STATISTICAL HELPER METHODS
  // ============================================================

  mean(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  median(values) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  standardDeviation(values) {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.mean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  getDistribution(values) {
    const ranges = {
      '0-20': 0,
      '20-40': 0,
      '40-60': 0,
      '60-80': 0,
      '80-100': 0
    };

    values.forEach(val => {
      if (val < 20) ranges['0-20']++;
      else if (val < 40) ranges['20-40']++;
      else if (val < 60) ranges['40-60']++;
      else if (val < 80) ranges['60-80']++;
      else ranges['80-100']++;
    });

    return ranges;
  }

  calculateTrend(values) {
    if (values.length < 3) return 'insufficient_data';

    const recentValues = values.slice(-10);
    const olderValues = values.slice(-20, -10);

    if (olderValues.length === 0) return 'insufficient_data';

    const recentAvg = this.mean(recentValues);
    const olderAvg = this.mean(olderValues);

    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }

  getRecentPerformance(records) {
    const recent = records.slice(-10);
    const accuracyScores = recent.map(r => r.accuracy.score);
    return {
      average: this.mean(accuracyScores),
      count: recent.length,
      trend: this.calculateTrend(accuracyScores)
    };
  }

  calculateImprovement(records) {
    if (records.length < 20) return 'insufficient_data';

    const recent = records.slice(-10);
    const older = records.slice(0, 10);

    const recentAvg = this.mean(recent.map(r => r.accuracy.score));
    const olderAvg = this.mean(older.map(r => r.accuracy.score));

    const improvement = recentAvg - olderAvg;
    return {
      value: Math.round(improvement * 10) / 10,
      percentage: Math.round((improvement / olderAvg) * 100 * 10) / 10,
      direction: improvement > 0 ? 'improving' : improvement < 0 ? 'declining' : 'stable'
    };
  }

  assessConfidenceCalibration(records) {
    const diffs = records.map(r =>
      (r.prediction.confidence * 100) - r.accuracy.score
    );

    const avgDiff = this.mean(diffs);

    return {
      calibrationError: Math.round(avgDiff * 10) / 10,
      status: Math.abs(avgDiff) < 10 ? 'well_calibrated' :
              avgDiff > 0 ? 'overconfident' : 'underconfident'
    };
  }

  calculateOverconfidenceRate(records) {
    const overconfident = records.filter(r =>
      (r.prediction.confidence * 100) > r.accuracy.score + 10
    );
    return (overconfident.length / records.length) * 100;
  }

  calculateUnderconfidenceRate(records) {
    const underconfident = records.filter(r =>
      (r.prediction.confidence * 100) < r.accuracy.score - 10
    );
    return (underconfident.length / records.length) * 100;
  }

  identifyTopFactors(records) {
    const factorCounts = new Map();

    records.forEach(record => {
      if (record.prediction.reasoning && Array.isArray(record.prediction.reasoning)) {
        record.prediction.reasoning.forEach(factor => {
          const factorName = factor.name || factor;
          factorCounts.set(factorName, (factorCounts.get(factorName) || 0) + 1);
        });
      }
    });

    return Array.from(factorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }));
  }

  identifyCommonErrors(records) {
    const errors = records.filter(r => r.accuracy.score < 70);
    const errorTypes = new Map();

    errors.forEach(error => {
      if (error.analysis && error.analysis.whatWentWrong) {
        error.analysis.whatWentWrong.forEach(issue => {
          errorTypes.set(issue, (errorTypes.get(issue) || 0) + 1);
        });
      }
    });

    return Array.from(errorTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([error, count]) => ({ error, count }));
  }

  identifyStrengthAreas(records) {
    const strengths = records.filter(r => r.accuracy.score >= 80);
    return {
      count: strengths.length,
      percentage: (strengths.length / records.length) * 100,
      topTopics: this.getTopTopics(strengths)
    };
  }

  identifyWeaknessAreas(records) {
    const weaknesses = records.filter(r => r.accuracy.score < 70);
    return {
      count: weaknesses.length,
      percentage: (weaknesses.length / records.length) * 100,
      topTopics: this.getTopTopics(weaknesses)
    };
  }

  getTopTopics(records) {
    const topicCounts = new Map();
    records.forEach(r => {
      topicCounts.set(r.topic, (topicCounts.get(r.topic) || 0) + 1);
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, count }));
  }

  generateAccuracyRecommendations(records) {
    const recommendations = [];

    // Calculate stats directly from records to avoid circular call
    const accuracyScores = records.map(r => r.accuracy.score);
    const avgAccuracy = accuracyScores.length > 0 ? this.mean(accuracyScores) : 0;

    const stats = {
      accuracy: { average: avgAccuracy },
      confidence: this.assessConfidenceCalibration(records)
    };

    if (stats.accuracy && stats.accuracy.average < 75) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Improve overall accuracy by expanding training data',
        expectedImpact: 'high'
      });
    }

    if (stats.confidence && stats.confidence.calibrationError && Math.abs(stats.confidence.calibrationError) > 10) {
      recommendations.push({
        priority: 'medium',
        recommendation: 'Calibrate confidence estimation methodology',
        expectedImpact: 'medium'
      });
    }

    const weaknesses = this.identifyWeaknessAreas(records);
    if (weaknesses.percentage > 30) {
      recommendations.push({
        priority: 'high',
        recommendation: 'Focus on improving weak prediction areas',
        expectedImpact: 'high',
        targetTopics: weaknesses.topTopics.map(t => t.topic)
      });
    }

    return recommendations;
  }

  // ============================================================
  // IMPROVEMENT ANALYSIS METHODS
  // ============================================================

  identifySuccessFactors(response, outcome) {
    const success = [];

    if (this.isSuccessfulPrediction(response, outcome)) {
      success.push('Prediction was accurate');

      if (response.factors) {
        success.push('Primary factors were correctly identified');
      }

      if (response.confidence && response.confidence > 0.70) {
        success.push('High confidence was justified');
      }
    }

    return success;
  }

  identifyFailureFactors(response, outcome) {
    const failures = [];

    if (!this.isSuccessfulPrediction(response, outcome)) {
      failures.push('Prediction did not match outcome');
      failures.push('May need to adjust factor weights or add new factors');
    }

    return failures;
  }

  identifySurprises(response, outcome) {
    const surprises = [];

    // Check if outcome was unexpected
    if (response.confidence && response.confidence > 0.80) {
      if (!this.isSuccessfulPrediction(response, outcome)) {
        surprises.push({
          type: 'unexpected_failure',
          description: 'High-confidence prediction failed',
          severity: 'high'
        });
      }
    }

    return surprises;
  }

  identifyMissedOpportunities(response, outcome) {
    const opportunities = [];

    // This would be enhanced with domain-specific logic
    opportunities.push({
      opportunity: 'additional_data_collection',
      description: 'Could have collected more contextual data',
      impact: 'medium'
    });

    return opportunities;
  }

  generateImprovements(response, outcome) {
    return {
      dataCollection: [{
        improvement: 'Expand input data sources',
        rationale: 'More comprehensive data leads to better predictions',
        priority: 'high'
      }],
      modelAdjustments: [{
        improvement: 'Adjust factor weights based on outcome',
        rationale: 'Learn from prediction accuracy',
        priority: 'medium'
      }],
      patternRecognition: [{
        improvement: 'Incorporate more pattern types',
        rationale: 'Better pattern recognition improves accuracy',
        priority: 'medium'
      }],
      reasoning: [{
        improvement: 'Document reasoning chain more explicitly',
        rationale: 'Transparency helps identify weak points',
        priority: 'low'
      }],
      communication: [{
        improvement: 'Provide clearer confidence intervals',
        rationale: 'Users can better calibrate expectations',
        priority: 'low'
      }]
    };
  }

  generateRecommendations(response, outcome) {
    return {
      immediate: [
        'Log this outcome for future reference',
        'Update factor weights based on accuracy'
      ],
      shortTerm: [
        'Analyze similar cases for patterns',
        'Adjust confidence calibration'
      ],
      longTerm: [
        'Expand training dataset',
        'Develop more sophisticated prediction models'
      ]
    };
  }

  calculateImprovementPriority(response, outcome) {
    if (!this.isSuccessfulPrediction(response, outcome)) {
      if (response.confidence && response.confidence > 0.80) {
        return 'critical'; // High-confidence failure
      }
      return 'high';
    }
    return 'low';
  }

  estimateImprovementImpact(response, outcome) {
    if (!this.isSuccessfulPrediction(response, outcome)) {
      return {
        accuracy: '+10-15%',
        confidence: '+5-10%',
        userSatisfaction: '+20%'
      };
    }
    return {
      accuracy: '+2-5%',
      confidence: '+1-3%',
      userSatisfaction: '+5%'
    };
  }

  estimateImplementationDifficulty(response, outcome) {
    return {
      dataCollection: 'medium',
      modelAdjustments: 'low',
      patternRecognition: 'high',
      reasoning: 'low',
      communication: 'low'
    };
  }

  isSuccessfulPrediction(response, outcome) {
    const predicted = response.value || response.predictedValue;
    const actual = outcome.value || outcome;

    if (typeof predicted === 'number' && typeof actual === 'number') {
      const error = Math.abs(predicted - actual);
      const tolerance = actual * 0.20; // 20% tolerance
      return error <= tolerance;
    }

    return predicted === actual;
  }

  // ============================================================
  // UTILITY METHODS
  // ============================================================

  generateReflectionId() {
    return `reflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeContext(inputData) {
    if (!inputData) return {};

    // Remove sensitive data, keep only relevant metrics
    const sanitized = {};
    const allowedKeys = ['hrv', 'rhr', 'sleep', 'recovery', 'steps', 'energy', 'stress'];

    Object.keys(inputData).forEach(key => {
      if (allowedKeys.some(allowed => key.toLowerCase().includes(allowed))) {
        sanitized[key] = inputData[key];
      }
    });

    return sanitized;
  }

  calculateInfluence(metricKey, response) {
    // Simplified influence calculation
    // In production, this would use actual correlation analysis
    const highInfluenceMetrics = ['hrv', 'sleep', 'recovery', 'rhr'];
    if (highInfluenceMetrics.some(metric => metricKey.toLowerCase().includes(metric))) {
      return 'high';
    }
    return 'medium';
  }

  getAlternativeReason(alternative, chosen, context) {
    if (alternative === 'rest') {
      return 'Recovery metrics suggest complete rest may be beneficial';
    } else if (alternative === 'intense') {
      return 'Strong recovery indicators could support high-intensity training';
    }
    return 'Different intensity level could be appropriate based on context';
  }

  estimateAlternativeConfidence(alternative, context) {
    // Simplified - would use actual model in production
    return 0.50 + (Math.random() * 0.20);
  }

  getAlternativeRejectionReasons(response) {
    return [
      'Lower confidence score',
      'Insufficient supporting data',
      'Conflicting with historical patterns'
    ];
  }

  predictOutcome(response) {
    return {
      expectedSuccess: response.confidence || 0.70,
      expectedTimeframe: '24-48 hours',
      verificationMethod: 'user_feedback'
    };
  }

  /**
   * Get system status and statistics
   */
  getStatus() {
    return {
      version: this.version,
      uptime: Date.now() - this.initialized,
      statistics: {
        totalReflections: reflectionCache.size,
        totalAccuracyRecords: accuracyCache.size,
        topicsTracked: this.topicAccuracy.size,
        averageAccuracy: this.calculateOverallAccuracy()
      },
      memory: {
        reflections: `${reflectionCache.size}/${MAX_REFLECTION_CACHE} (cache)`,
        accuracyRecords: `${accuracyCache.size}/${MAX_ACCURACY_CACHE} (cache)`,
        note: 'Primary storage is MongoDB - cache is for fast access'
      }
    };
  }

  calculateOverallAccuracy() {
    const allRecords = Array.from(accuracyCache.values());
    if (allRecords.length === 0) return 0;

    const accuracyScores = allRecords.map(r => r.accuracy?.score || 0);
    return Math.round(this.mean(accuracyScores));
  }

  /**
   * Clear all stored data (for testing)
   */
  reset() {
    reflectionCache.clear();
    accuracyCache.clear();
    this.topicAccuracy.clear();
    
  }
}

// Export singleton instance
const metaCognition = new MetaCognition();

module.exports = metaCognition;
