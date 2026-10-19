/**
 * PHOENIX AI PATTERN DETECTION ENGINE
 *
 * Core IF/THEN conditional logic engine that detects life patterns from behavioral data.
 * This is the "unconscious mind" - it KNOWS what's happening before the user admits it.
 *
 * UPDATED Nov 2025: Integrated personal baselines, volatility checks, and multi-metric confidence scoring
 * based on Claude's analysis of 1,000 life simulations.
 */

const { patterns: LIFE_PATTERNS, stats: PATTERN_STATS } = require('./patterns/index');
const WearableData = require('../../models/mercury/WearableData');
const PhoenixCache = require('../../models/PhoenixCache');
const mongoose = require('mongoose');
const operatorExtensions = require('./operatorExtensions');
const { LIFE_PATTERNS: PATTERN_DEFS } = require('./patternDefinitions');

// NEW: Import upgraded detection tools
const baselineEngine = require('./personalBaselineEngine');
const volatilityAnalyzer = require('./volatilityAnalyzer');
const confidenceScorer = require('./confidenceScorer');

class PatternDetectionEngine {
  constructor() {
    this.patterns = LIFE_PATTERNS;
    const patternCount = Object.keys(LIFE_PATTERNS).length;
    
  }

  /**
   * Main detection method - runs all pattern evaluations with upgraded confidence scoring
   * @param {String} userId - User ID to analyze
   * @param {Number} windowDays - Days of data to analyze (default 30)
   * @returns {Array} Array of detected patterns
   */
  async detectPatterns(userId, windowDays = 30) {
    try {
      

      // 1. Fetch behavioral data
      const behaviorData = await this.fetchBehaviorData(userId, windowDays);

      if (!behaviorData || behaviorData.length === 0) {
        
        return [];
      }

      

      // 2. Calculate PERSONAL baselines (NEW!)
      const personalBaseline = await baselineEngine.getBaseline(userId);

      if (!personalBaseline) {
        
        return [];
      }


      // 3. Calculate volatility metrics (NEW!)
      const recentData = behaviorData.slice(-7); // Last 7 days
      const volatilityMetrics = volatilityAnalyzer.calculateMultiMetricVolatility(recentData);


      // 4. Run all pattern evaluations with confidence scoring
      const detectedPatterns = [];
      const allPatterns = Object.values(this.patterns);

      for (const pattern of allPatterns) {
        // Evaluate pattern with new baseline system
        const result = await this.evaluatePatternUpgraded(
          pattern,
          behaviorData,
          personalBaseline,
          volatilityMetrics
        );

        // NEW: Multi-metric confidence gating
        if (result.confidenceAnalysis && result.confidenceAnalysis.shouldSurface) {
          detectedPatterns.push({
            patternId: pattern.id,
            patternName: pattern.name,
            planet: pattern.planet,
            category: pattern.category,
            confidence: result.confidenceAnalysis.confidence,
            metricsChanging: result.confidenceAnalysis.metricsChanging,
            evidence: result.evidence,
            detectedAt: new Date(),
            conditionsMet: result.conditionsMet,
            conditionsTotal: result.conditionsTotal,
            urgency: pattern.urgency || 'normal',
            predictions: pattern.predictions || {},
            recommendations: pattern.recommendations || [],
            silentGuidance: pattern.silent_guidance || {},
            // NEW: Confidence details
            confidenceFactors: result.confidenceAnalysis.factors,
            recommendation: result.confidenceAnalysis.recommendation
          });

          
        } else if (result.detected) {
          
        }
      }

      // 5. Store detected patterns in cache (silent knowledge)
      if (detectedPatterns.length > 0) {
        await this.storeInCache(userId, detectedPatterns);
        
      } else {
        
      }

      return detectedPatterns;

    } catch (error) {
      console.error('[PatternEngine] Error detecting patterns:', error);
      throw error;
    }
  }

  /**
   * Fetch behavior data from database
   */
  async fetchBehaviorData(userId, windowDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);

    const data = await WearableData.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: startDate }
    }).sort({ date: 1 }).lean();

    return data;
  }

  /**
   * Calculate baseline metrics (30-90 day averages)
   */
  async calculateBaselines(userId, recentData) {
    const baselineWindow = 60; // Use 60 days for baselines
    const baselineStart = new Date();
    baselineStart.setDate(baselineStart.getDate() - baselineWindow);

    const baselineData = await WearableData.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: baselineStart }
    }).lean();

    if (baselineData.length === 0) {
      // No baseline data - use recent data as baseline
      return this.calculateMetricAverages(recentData);
    }

    return this.calculateMetricAverages(baselineData);
  }

  /**
   * Calculate average values for all metrics
   */
  calculateMetricAverages(data) {
    if (data.length === 0) return {};

    const sums = {};
    const counts = {};

    data.forEach(day => {
      Object.keys(day).forEach(key => {
        if (typeof day[key] === 'number' && key !== '__v') {
          sums[key] = (sums[key] || 0) + day[key];
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });

    const averages = {};
    Object.keys(sums).forEach(key => {
      averages[key] = sums[key] / counts[key];
    });

    // Add calculated behavioral metrics
    averages.routine_consistency = this.calculateRoutineConsistency(data);
    averages.location_consistency = this.calculateLocationConsistency(data);
    averages.sleep_consistency = this.calculateSleepConsistency(data);

    return averages;
  }

  /**
   * Calculate routine consistency score (0-100)
   */
  calculateRoutineConsistency(data) {
    // Placeholder - would analyze timing patterns of activities
    // For now, return a default value
    return 80;
  }

  /**
   * Calculate location consistency score (0-100)
   */
  calculateLocationConsistency(data) {
    // Placeholder - would analyze location data
    return 85;
  }

  /**
   * Calculate sleep consistency score (0-100)
   */
  calculateSleepConsistency(data) {
    if (data.length < 7) return 75;

    const sleepTimes = data.map(d => d.sleepDuration || 0).filter(s => s > 0);
    if (sleepTimes.length === 0) return 75;

    const avg = sleepTimes.reduce((sum, s) => sum + s, 0) / sleepTimes.length;
    const variance = sleepTimes.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / sleepTimes.length;
    const stdDev = Math.sqrt(variance);

    // Lower std dev = higher consistency
    const consistencyScore = Math.max(0, 100 - (stdDev / avg * 100));
    return consistencyScore;
  }

  /**
   * UPGRADED PATTERN EVALUATION
   * Uses personal baselines, volatility analysis, and multi-metric confidence scoring
   *
   * @param {Object} pattern - Pattern definition
   * @param {Array} behaviorData - Behavioral data array
   * @param {Object} personalBaseline - Personal baseline from baselineEngine
   * @param {Object} volatilityMetrics - Volatility metrics
   * @returns {Object} Evaluation result with confidence analysis
   */
  async evaluatePatternUpgraded(pattern, behaviorData, personalBaseline, volatilityMetrics) {
    const recentData = behaviorData.slice(-7); // Last 7 days

    // Calculate current metrics
    const currentMetrics = {
      hrv: this.calculateMean(recentData, 'hrv'),
      sleepScore: this.calculateMean(recentData, 'sleepScore'),
      restingHeartRate: this.calculateMean(recentData, 'restingHeartRate'),
      steps: this.calculateMean(recentData, 'steps'),
      sustainedDays: this.countSustainedDays(recentData, personalBaseline),
      hrvVolatility: volatilityMetrics.hrv?.volatility || 0,
      rhrSpike: this.detectRHRSpike(recentData, personalBaseline)
    };

    // Calculate confidence using multi-metric scoring
    const confidenceAnalysis = confidenceScorer.calculateConfidence(
      currentMetrics,
      pattern,
      personalBaseline
    );

    // Build evidence array
    const evidence = [];

    if (currentMetrics.hrv && personalBaseline.hrv) {
      const hrvChange = baselineEngine.getPercentChange(currentMetrics.hrv, personalBaseline.hrv);
      if (Math.abs(hrvChange) > 10) {
        evidence.push(`HRV ${hrvChange.toFixed(0)}% from baseline`);
      }
    }

    if (currentMetrics.sleepScore && personalBaseline.sleepScore) {
      const sleepChange = baselineEngine.getPercentChange(currentMetrics.sleepScore, personalBaseline.sleepScore);
      if (Math.abs(sleepChange) > 10) {
        evidence.push(`Sleep ${sleepChange.toFixed(0)}% from baseline`);
      }
    }

    if (currentMetrics.hrvVolatility > 14) {
      evidence.push(`High HRV volatility (${currentMetrics.hrvVolatility.toFixed(0)}%)`);
    }

    if (currentMetrics.sustainedDays >= 5) {
      evidence.push(`Sustained for ${currentMetrics.sustainedDays} days`);
    }

    return {
      detected: confidenceAnalysis.metricsChanging >= 2, // At least 2 metrics changing
      confidence: confidenceAnalysis.confidence,
      confidenceAnalysis,
      evidence,
      conditionsMet: confidenceAnalysis.metricsChanging,
      conditionsTotal: pattern.conditions?.length || 0
    };
  }

  /**
   * Calculate mean value for a metric from recent data
   */
  calculateMean(data, metric) {
    const values = data.map(d => d[metric]).filter(v => v !== null && v !== undefined && v > 0);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Count how many consecutive days show deviation from baseline
   */
  countSustainedDays(data, baseline) {
    if (!baseline || !baseline.hrv) return 0;

    let sustainedDays = 0;

    for (let i = data.length - 1; i >= 0; i--) {
      const hrv = data[i].hrv;

      if (hrv && baselineEngine.isSignificantDrop(hrv, baseline.hrv, 15)) {
        sustainedDays++;
      } else {
        break; // Stop counting when streak breaks
      }
    }

    return sustainedDays;
  }

  /**
   * Detect RHR spike (illness predictor)
   */
  detectRHRSpike(data, baseline) {
    if (!baseline || !baseline.restingHeartRate) return false;

    const recent = data.slice(-3); // Last 3 days
    const rhrValues = recent.map(d => d.restingHeartRate).filter(v => v);

    if (rhrValues.length < 2) return false;

    const avgRHR = rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length;

    // Spike = +5 bpm above baseline
    return avgRHR > baseline.restingHeartRate.mean + 5;
  }

  /**
   * Evaluate a single pattern's conditions
   */
  async evaluatePattern(pattern, behaviorData, baselines) {
    let conditionsMet = 0;
    let evidence = [];
    let confidenceFactors = [];

    for (const condition of pattern.conditions) {
      const result = this.evaluateCondition(condition, behaviorData, baselines);

      if (result.met) {
        conditionsMet++;
        evidence.push(result.evidence);
        confidenceFactors.push(result.strength);
      }
    }

    // Pattern detected if enough conditions are met
    const detected = conditionsMet >= pattern.evidence_required;

    // Calculate confidence score
    const confidence = this.calculateConfidence(
      conditionsMet,
      pattern.conditions.length,
      confidenceFactors,
      pattern.false_positive_rate || 0.15
    );

    return {
      detected,
      confidence,
      evidence,
      conditionsMet,
      conditionsTotal: pattern.conditions.length
    };
  }

  /**
   * Evaluate a single condition using IF/THEN logic
   */
  evaluateCondition(condition, behaviorData, baselines) {
    const { behavior, operator, threshold, unit, window, consecutive } = condition;

    // Get recent window of data
    const windowData = this.getWindowData(behaviorData, behavior, window);
    const baseline = baselines[behavior];

    // Route to appropriate evaluator based on operator
    switch (operator) {
      case 'DROPS':
        return this.evaluateDropCondition(windowData, baseline, threshold, behavior);

      case 'INCREASES':
        return this.evaluateIncreaseCondition(windowData, baseline, threshold, behavior);

      case 'BELOW':
        return this.evaluateBelowCondition(windowData, threshold, behavior);

      case 'ABOVE':
        return this.evaluateAboveCondition(windowData, threshold, behavior);

      case 'FLUCTUATES':
        return this.evaluateFluctuationCondition(windowData, threshold, behavior);

      case 'FLAT':
        return this.evaluateFlatCondition(windowData, threshold, behavior);

      case 'SPIKES':
        return this.evaluateSpikeCondition(windowData, baseline, threshold, behavior);

      case 'CHANGES':
        return this.evaluateChangeCondition(windowData, baseline, threshold, behavior);

      case 'BELOW_BASELINE':
        return this.evaluateBelowBaselineCondition(windowData, baseline, threshold, behavior);

      case 'ABOVE_BASELINE':
        return this.evaluateAboveBaselineCondition(windowData, baseline, threshold, behavior);

      case 'DROPS_SUDDENLY':
        return this.evaluateSuddenDropCondition(windowData, baseline, threshold, behavior);

      case 'INCREASES_SUDDENLY':
        return this.evaluateSuddenIncreaseCondition(windowData, baseline, threshold, behavior);

      case 'VARIABLE':
        return this.evaluateVariableCondition(windowData, threshold, behavior);

      case 'CONSISTENT':
        return this.evaluateConsistentCondition(windowData, threshold, behavior);

      case 'POOR':
        return this.evaluatePoorCondition(windowData, threshold, behavior);

      case 'GOOD':
        return this.evaluateGoodCondition(windowData, threshold, behavior);

      case 'HIGH':
        return this.evaluateHighCondition(windowData, baseline, threshold, behavior);

      case 'LOW':
        return this.evaluateLowCondition(windowData, baseline, threshold, behavior);

      default:
        console.warn(`[PatternEngine] Unknown operator: ${operator}`);
        return { met: false, strength: 0, evidence: 'Unknown operator' };
    }
  }

  /**
   * Get window of data for a specific behavior
   */
  getWindowData(behaviorData, behavior, windowDays) {
    if (!windowDays || windowDays >= behaviorData.length) {
      return behaviorData;
    }

    return behaviorData.slice(-windowDays);
  }

  /**
   * Condition Evaluators
   */

  evaluateDropCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentDrop = ((baseline - windowAvg) / baseline) * 100;

    const met = percentDrop >= threshold;
    const strength = Math.min(percentDrop / threshold, 2.0); // Cap at 200%

    return {
      met,
      strength,
      evidence: `${behavior} dropped ${percentDrop.toFixed(1)}% (threshold: ${threshold}%)`
    };
  }

  evaluateIncreaseCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentIncrease = ((windowAvg - baseline) / baseline) * 100;

    const met = percentIncrease >= threshold;
    const strength = Math.min(percentIncrease / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} increased ${percentIncrease.toFixed(1)}% (threshold: ${threshold}%)`
    };
  }

  evaluateBelowCondition(windowData, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const met = windowAvg < threshold;
    const percentBelow = ((threshold - windowAvg) / threshold) * 100;
    const strength = Math.min(percentBelow / 20, 2.0); // 20% below = 1.0 strength

    return {
      met,
      strength,
      evidence: `${behavior} at ${windowAvg.toFixed(1)} (threshold: ${threshold})`
    };
  }

  evaluateAboveCondition(windowData, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const met = windowAvg > threshold;
    const percentAbove = ((windowAvg - threshold) / threshold) * 100;
    const strength = Math.min(percentAbove / 20, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} at ${windowAvg.toFixed(1)} (threshold: ${threshold})`
    };
  }

  evaluateFluctuationCondition(windowData, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 3) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avg) * 100;

    const met = coefficientOfVariation >= threshold;
    const strength = Math.min(coefficientOfVariation / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} variability at ${coefficientOfVariation.toFixed(1)}% (threshold: ${threshold}%)`
    };
  }

  evaluateFlatCondition(windowData, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 3) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / avg) * 100;

    const met = coefficientOfVariation <= threshold;
    const strength = Math.min((threshold - coefficientOfVariation) / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} stability at ${(100 - coefficientOfVariation).toFixed(1)}% (flat threshold: ${threshold}%)`
    };
  }

  evaluateSpikeCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const maxValue = Math.max(...values);
    const percentSpike = ((maxValue - baseline) / baseline) * 100;

    const met = percentSpike >= threshold;
    const strength = Math.min(percentSpike / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} spiked ${percentSpike.toFixed(1)}% above baseline (threshold: ${threshold}%)`
    };
  }

  evaluateChangeCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentChange = Math.abs(((windowAvg - baseline) / baseline) * 100);

    const met = percentChange >= threshold;
    const strength = Math.min(percentChange / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} changed ${percentChange.toFixed(1)}% from baseline (threshold: ${threshold}%)`
    };
  }

  evaluateBelowBaselineCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentBelowBaseline = ((baseline - windowAvg) / baseline) * 100;

    const met = percentBelowBaseline >= threshold;
    const strength = Math.min(percentBelowBaseline / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} ${percentBelowBaseline.toFixed(1)}% below baseline (threshold: ${threshold}%)`
    };
  }

  evaluateAboveBaselineCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentAboveBaseline = ((windowAvg - baseline) / baseline) * 100;

    const met = percentAboveBaseline >= threshold;
    const strength = Math.min(percentAboveBaseline / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} ${percentAboveBaseline.toFixed(1)}% above baseline (threshold: ${threshold}%)`
    };
  }

  evaluateSuddenDropCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 2 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    // Look at last value vs baseline
    const latestValue = values[values.length - 1];
    const percentDrop = ((baseline - latestValue) / baseline) * 100;

    const met = percentDrop >= threshold;
    const strength = Math.min(percentDrop / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} sudden drop of ${percentDrop.toFixed(1)}% (threshold: ${threshold}%)`
    };
  }

  evaluateSuddenIncreaseCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 2 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const latestValue = values[values.length - 1];
    const percentIncrease = ((latestValue - baseline) / baseline) * 100;

    const met = percentIncrease >= threshold;
    const strength = Math.min(percentIncrease / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} sudden increase of ${percentIncrease.toFixed(1)}% (threshold: ${threshold}%)`
    };
  }

  evaluateVariableCondition(windowData, threshold, behavior) {
    return this.evaluateFluctuationCondition(windowData, threshold, behavior);
  }

  evaluateConsistentCondition(windowData, threshold, behavior) {
    return this.evaluateFlatCondition(windowData, 100 - threshold, behavior);
  }

  evaluatePoorCondition(windowData, threshold, behavior) {
    return this.evaluateBelowCondition(windowData, threshold, behavior);
  }

  evaluateGoodCondition(windowData, threshold, behavior) {
    return this.evaluateAboveCondition(windowData, threshold, behavior);
  }

  evaluateHighCondition(windowData, baseline, threshold, behavior) {
    return this.evaluateAboveBaselineCondition(windowData, baseline, threshold, behavior);
  }

  evaluateLowCondition(windowData, baseline, threshold, behavior) {
    return this.evaluateBelowBaselineCondition(windowData, baseline, threshold, behavior);
  }

  /**
   * Calculate overall confidence score
   */
  calculateConfidence(conditionsMet, conditionsTotal, strengthFactors, falsePositiveRate) {
    // Base confidence from conditions met
    const baseConfidence = (conditionsMet / conditionsTotal) * 100;

    // Adjust for strength of matches
    const avgStrength = strengthFactors.length > 0
      ? strengthFactors.reduce((sum, s) => sum + s, 0) / strengthFactors.length
      : 1.0;
    const strengthBonus = (avgStrength - 1.0) * 10; // Each 0.1 over 1.0 adds 1%

    // Adjust for pattern's known false positive rate
    const fprPenalty = falsePositiveRate * 100;

    // Final confidence (cap at 95%, min at 50%)
    const confidence = Math.min(95, Math.max(50,
      baseConfidence + strengthBonus - fprPenalty
    ));

    return Math.round(confidence);
  }

  /**
   * Store detected patterns in PhoenixCache
   */
  async storeInCache(userId, detectedPatterns) {
    try {
      // Find or create cache entry
      let cache = await PhoenixCache.findOne({ userId });

      if (!cache) {
        cache = new PhoenixCache({
          userId,
          lastUpdated: new Date(),
          patterns: {}
        });
      }

      // Add detected_patterns field if it doesn't exist
      if (!cache.patterns) {
        cache.patterns = {};
      }

      if (!cache.patterns.detected_patterns) {
        cache.patterns.detected_patterns = [];
      }

      // Add new patterns (don't duplicate)
      for (const pattern of detectedPatterns) {
        const existingIndex = cache.patterns.detected_patterns.findIndex(
          p => p.patternId === pattern.patternId && !p.surfaced
        );

        if (existingIndex === -1) {
          // New pattern - add it
          cache.patterns.detected_patterns.push({
            ...pattern,
            surfaced: false,
            user_acknowledged: false,
            stored_at: new Date()
          });
        } else {
          // Update existing pattern
          cache.patterns.detected_patterns[existingIndex] = {
            ...cache.patterns.detected_patterns[existingIndex],
            ...pattern,
            updated_at: new Date()
          };
        }
      }

      cache.lastUpdated = new Date();
      await cache.save();

      

    } catch (error) {
      console.error('[PatternEngine] Error storing patterns in cache:', error);
      throw error;
    }
  }

  /**
   * Get detected patterns from cache
   */
  async getDetectedPatterns(userId) {
    try {
      const cache = await PhoenixCache.findOne({ userId });

      if (!cache || !cache.patterns || !cache.patterns.detected_patterns) {
        return [];
      }

      return cache.patterns.detected_patterns;

    } catch (error) {
      console.error('[PatternEngine] Error retrieving patterns from cache:', error);
      return [];
    }
  }

  /**
   * Mark pattern as surfaced to user
   */
  async markPatternSurfaced(userId, patternId) {
    try {
      const cache = await PhoenixCache.findOne({ userId });

      if (!cache || !cache.patterns || !cache.patterns.detected_patterns) {
        return;
      }

      const pattern = cache.patterns.detected_patterns.find(p => p.patternId === patternId);

      if (pattern) {
        pattern.surfaced = true;
        pattern.surfaced_at = new Date();
        await cache.save();
      }

    } catch (error) {
      console.error('[PatternEngine] Error marking pattern surfaced:', error);
    }
  }

  /**
   * Mark pattern as acknowledged by user
   */
  async markPatternAcknowledged(userId, patternId) {
    try {
      const cache = await PhoenixCache.findOne({ userId });

      if (!cache || !cache.patterns || !cache.patterns.detected_patterns) {
        return;
      }

      const pattern = cache.patterns.detected_patterns.find(p => p.patternId === patternId);

      if (pattern) {
        pattern.user_acknowledged = true;
        pattern.acknowledged_at = new Date();
        await cache.save();
      }

    } catch (error) {
      console.error('[PatternEngine] Error marking pattern acknowledged:', error);
    }
  }
}

module.exports = new PatternDetectionEngine();
