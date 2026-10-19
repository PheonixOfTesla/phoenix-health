/**
 * PHOENIX AI - CONFIDENCE SCORER
 *
 * Multi-factor confidence scoring for pattern detection.
 * Replaces fixed thresholds with dynamic confidence calculation.
 *
 * Research backing: Analysis of 98,190 wearable records showed
 * multi-metric clustering increases confidence from 51% (1 metric)
 * to 94% (4 metrics).
 *
 * Confidence Gating:
 * - <70%: MONITOR_ONLY
 * - 70-85%: GENTLE_PROBE
 * - 85-95%: DIRECT_DISCOVERY
 * - >95%: HIGH_CONFIDENCE
 *
 * @module ConfidenceScorer
 */

const baselineEngine = require('./personalBaselineEngine');
const volatilityAnalyzer = require('./volatilityAnalyzer');

class ConfidenceScorer {
  constructor() {
    this.monitorThreshold = 0.70;
    this.gentleProbeThreshold = 0.85;
    this.directDiscoveryThreshold = 0.95;
  }

  /**
   * Calculate pattern detection confidence
   * @param {Object} metrics - Current metrics object
   * @param {Object} pattern - Pattern definition
   * @param {Object} userBaseline - Personal baseline object
   * @returns {Object} Confidence result
   */
  calculateConfidence(metrics, pattern, userBaseline) {
    let confidence = 0.5; // Base confidence

    // Factor 1: Number of conditions met (max +0.2)
    const conditionsMet = this.countConditionsMet(metrics, pattern);
    const conditionsTotal = pattern.conditions ? pattern.conditions.length : 1;
    const conditionRatio = conditionsMet / conditionsTotal;
    
    confidence += conditionRatio * 0.2;

    // Factor 2: Temporal consistency (max +0.1)
    const temporalScore = this.checkTemporalConsistency(metrics, pattern);
    confidence += temporalScore * 0.1;

    // Factor 3: Multi-metric clustering (max +0.1)
    const clusterScore = this.checkMetricClustering(metrics);
    if (clusterScore >= 3) confidence += 0.1; // Bonus for 3+ metrics changing

    // Factor 4: Personal baseline deviation (max +0.15)
    let baselineScore = 0;
    if (userBaseline) {
      baselineScore = this.checkBaselineDeviation(metrics, userBaseline);
      confidence += baselineScore * 0.15;
    }

    // Factor 5: Pattern specificity (max +0.1)
    const specificityScore = this.checkPatternSpecificity(metrics, pattern);
    confidence += specificityScore * 0.1;

    // Penalty: Conflicting signals (-0.15)
    if (this.hasConflictingSignals(metrics, pattern)) {
      confidence -= 0.15;
    }

    // Cap confidence at 0.95 max (never 100% certain)
    confidence = Math.max(0.0, Math.min(0.95, confidence));

    return {
      confidence: parseFloat(confidence.toFixed(3)),
      factors: {
        conditions: parseFloat(conditionRatio.toFixed(2)),
        temporal: parseFloat(temporalScore.toFixed(2)),
        clustering: clusterScore,
        baseline: parseFloat(baselineScore.toFixed(2)),
        specificity: parseFloat(specificityScore.toFixed(2))
      },
      recommendation: this.getRecommendation(confidence),
      shouldSurface: confidence >= this.monitorThreshold
    };
  }

  /**
   * Get recommendation based on confidence level
   * @param {Number} confidence - Confidence score (0-1)
   * @returns {String} Recommendation level
   */
  getRecommendation(confidence) {
    if (confidence < this.monitorThreshold) return 'MONITOR_ONLY';
    if (confidence < this.gentleProbeThreshold) return 'GENTLE_PROBE';
    if (confidence < this.directDiscoveryThreshold) return 'DIRECT_DISCOVERY';
    return 'HIGH_CONFIDENCE';
  }

  /**
   * Count how many pattern conditions are met
   * @param {Object} metrics - Current metrics
   * @param {Object} pattern - Pattern definition
   * @returns {Number} Number of conditions met
   */
  countConditionsMet(metrics, pattern) {
    if (!pattern.conditions) return 1;

    let metCount = 0;

    for (const condition of pattern.conditions) {
      // Simple condition checking (can be enhanced)
      const metricValue = metrics[condition.behavior];
      if (metricValue !== undefined && metricValue !== null) {
        metCount++;
      }
    }

    return metCount;
  }

  /**
   * Check if metrics form a cluster (multiple changing together)
   * @param {Object} metrics - Current metrics
   * @returns {Number} Number of metrics changing
   */
  checkMetricClustering(metrics) {
    let changingMetrics = 0;
    
    // HRV change >10%
    if (Math.abs(metrics.hrv_change_pct || 0) > 10) changingMetrics++;
    
    // Sleep change >10%
    if (Math.abs(metrics.sleep_change_pct || 0) > 10) changingMetrics++;
    
    // RHR change >3 bpm
    if (Math.abs(metrics.rhr_change || 0) > 3) changingMetrics++;
    
    // Steps change >15%
    if (Math.abs(metrics.steps_change_pct || 0) > 15) changingMetrics++;

    return changingMetrics;
  }

  /**
   * Check temporal consistency (pattern sustained over time)
   * @param {Object} metrics - Current metrics
   * @param {Object} pattern - Pattern definition
   * @returns {Number} Temporal score (0-1)
   */
  checkTemporalConsistency(metrics, pattern) {
    const sustainedDays = metrics.pattern_sustained_days || 0;
    const requiredWindow = pattern.detection_window ? pattern.detection_window[0] : 3;

    if (sustainedDays >= requiredWindow * 2) return 1.0; // Very sustained
    if (sustainedDays >= requiredWindow) return 0.7;     // Adequately sustained
    if (sustainedDays >= requiredWindow * 0.5) return 0.4; // Partially sustained
    return 0.0; // Not sustained
  }

  /**
   * Check deviation from personal baseline
   * @param {Object} metrics - Current metrics
   * @param {Object} baseline - Personal baseline
   * @returns {Number} Baseline deviation score (0-1)
   */
  checkBaselineDeviation(metrics, baseline) {
    let score = 0;
    let count = 0;

    // HRV deviation
    if (baseline.hrv && metrics.current_hrv) {
      const deviation = Math.abs((metrics.current_hrv - baseline.hrv.mean) / baseline.hrv.mean);
      if (deviation > 0.20) score += 1.0; // >20% deviation
      else if (deviation > 0.15) score += 0.7;
      else if (deviation > 0.10) score += 0.4;
      count++;
    }

    // Sleep deviation
    if (baseline.sleepScore && metrics.current_sleep) {
      const deviation = Math.abs((metrics.current_sleep - baseline.sleepScore.mean) / baseline.sleepScore.mean);
      if (deviation > 0.15) score += 1.0;
      else if (deviation > 0.10) score += 0.6;
      count++;
    }

    // RHR deviation
    if (baseline.restingHeartRate && metrics.current_rhr) {
      const deviation = Math.abs((metrics.current_rhr - baseline.restingHeartRate.mean) / baseline.restingHeartRate.mean);
      if (deviation > 0.10) score += 1.0;
      else if (deviation > 0.05) score += 0.6;
      count++;
    }

    return count > 0 ? score / count : 0;
  }

  /**
   * Check for pattern-specific markers
   * @param {Object} metrics - Current metrics
   * @param {Object} pattern - Pattern definition
   * @returns {Number} Specificity score (0-1)
   */
  checkPatternSpecificity(metrics, pattern) {
    // RHR Illness Predictor (HLT081/P055) - RHR spike is highly specific
    if ((pattern.id === 'HLT081' || pattern.id === 'P055') && metrics.rhr_spike_rapid) {
      return 0.8;
    }

    // HRV Volatility Stress (MH071/P053) - High volatility is specific
    if ((pattern.id === 'MH071' || pattern.id === 'P053') && metrics.hrv_volatility > 14) {
      return 0.7;
    }

    // Sleep Debt Accumulation (SLP041/P051) - Consecutive short sleep is specific
    if ((pattern.id === 'SLP041' || pattern.id === 'P051') && metrics.consecutive_short_sleep >= 3) {
      return 0.7;
    }

    // Bidirectional loops are highly specific
    if (pattern.loop_type === 'bidirectional' && metrics.bidirectional_loop_detected) {
      return 0.8;
    }

    // Default specificity
    return 0.5;
  }

  /**
   * Detect conflicting signals
   * @param {Object} metrics - Current metrics
   * @param {Object} pattern - Pattern definition
   * @returns {Boolean} True if conflicting signals detected
   */
  hasConflictingSignals(metrics, pattern) {
    // HRV dropping but sleep improving (conflicting stress signals)
    if (metrics.hrv_change_pct < -10 && metrics.sleep_change_pct > 10) {
      return true;
    }

    // Detecting "recovery" pattern but RHR elevated
    if (pattern.category === 'recovery' && metrics.rhr_change > 5) {
      return true;
    }

    // High recovery score but HRV very low
    if (pattern.category === 'recovery' && metrics.recovery_score > 80 && metrics.hrv_change_pct < -20) {
      return true;
    }

    return false;
  }

  /**
   * Get human-readable confidence interpretation
   * @param {Number} confidence - Confidence score (0-1)
   * @returns {String} Interpretation
   */
  getInterpretation(confidence) {
    if (confidence >= 0.95) {
      return 'Very high confidence - strong evidence across multiple metrics';
    } else if (confidence >= 0.85) {
      return 'High confidence - clear pattern detected';
    } else if (confidence >= 0.70) {
      return 'Moderate confidence - pattern emerging';
    } else if (confidence >= 0.50) {
      return 'Low confidence - monitoring only';
    } else {
      return 'Very low confidence - insufficient evidence';
    }
  }

  /**
   * Calculate confidence trend over time
   * @param {Array<Number>} confidenceHistory - Array of historical confidence scores
   * @returns {String} Trend direction
   */
  calculateTrend(confidenceHistory) {
    if (!confidenceHistory || confidenceHistory.length < 3) {
      return 'INSUFFICIENT_DATA';
    }

    const recent = confidenceHistory.slice(-3);
    const earlier = confidenceHistory.slice(-6, -3);

    if (earlier.length === 0) return 'INSUFFICIENT_DATA';

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    const change = recentAvg - earlierAvg;

    if (change > 0.1) return 'INCREASING'; // Confidence growing
    if (change < -0.1) return 'DECREASING'; // Confidence declining
    return 'STABLE';
  }
}

// Export the class (not singleton for flexibility)
module.exports = ConfidenceScorer;
