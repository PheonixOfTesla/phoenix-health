/**
 * PHOENIX AI - VOLATILITY ANALYZER
 *
 * Detects HRV volatility and stress dysregulation patterns.
 * Key insight from 10K simulation: High volatility (>14%) + low mean = stress dysregulation
 *
 * Research backing: Analysis of 98,190 wearable records showed volatility
 * matters as much as absolute values for stress detection.
 *
 * @module VolatilityAnalyzer
 */

const baselineEngine = require('./personalBaselineEngine');

class VolatilityAnalyzer {
  constructor() {
    this.highVolatilityThreshold = 14; // Coefficient of variation >14% = high volatility
    this.dysregulationThreshold = 15; // Mean must be 15% below baseline for dysregulation
  }

  /**
   * Calculate coefficient of variation (std / mean * 100)
   * This is the primary volatility metric
   *
   * @param {Array<Number>} values - Array of metric values
   * @returns {Number} Coefficient of variation percentage
   */
  calculateVolatility(values) {
    if (!values || values.length < 3) return 0;

    // Filter out nulls and zeros
    const valid = values.filter(v => v != null && v > 0);
    if (valid.length < 3) return 0;

    // Calculate mean
    const mean = valid.reduce((sum, v) => sum + v, 0) / valid.length;

    // Calculate standard deviation
    const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valid.length;
    const std = Math.sqrt(variance);

    // Coefficient of variation = (std / mean) * 100
    const coefficientVariation = (std / mean) * 100;

    return parseFloat(coefficientVariation.toFixed(2));
  }

  /**
   * Check if volatility exceeds threshold
   * @param {Number} volatility - Volatility percentage
   * @param {Number} threshold - Threshold (default 14%)
   * @returns {Boolean} True if high volatility detected
   */
  isHighVolatility(volatility, threshold = this.highVolatilityThreshold) {
    return volatility > threshold;
  }

  /**
   * Detect stress dysregulation (KEY PATTERN FROM 10K SIMULATION)
   * Pattern: High volatility + low mean = stress with poor adaptation
   *
   * @param {Array<Number>} values - Array of recent HRV values
   * @param {Object} baseline - Personal baseline object
   * @returns {Object} Dysregulation analysis
   */
  detectDysregulation(values, baseline) {
    if (!values || !baseline) {
      return {
        dysregulated: false,
        reason: 'Insufficient data'
      };
    }

    // Calculate volatility
    const volatility = this.calculateVolatility(values);

    // Calculate mean
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Check if mean is below baseline
    const percentFromBaseline = baselineEngine.getPercentChange(mean, baseline);

    // Dysregulation criteria:
    // 1. High volatility (>14%)
    // 2. Mean below baseline (>15%)
    const dysregulated = volatility > this.highVolatilityThreshold && 
                        percentFromBaseline < -this.dysregulationThreshold;

    return {
      dysregulated,
      volatility,
      mean,
      baseline: baseline.mean,
      percentFromBaseline,
      severity: this.calculateSeverity(volatility, percentFromBaseline),
      recommendation: dysregulated ? 'FOCUS_ON_CONSISTENCY' : 'CONTINUE_MONITORING'
    };
  }

  /**
   * Calculate dysregulation severity
   * @param {Number} volatility - Volatility percentage
   * @param {Number} percentFromBaseline - Percent change from baseline
   * @returns {String} Severity level
   */
  calculateSeverity(volatility, percentFromBaseline) {
    // Critical: Very high volatility (>20%) AND significantly below baseline (>25%)
    if (volatility > 20 && percentFromBaseline < -25) {
      return 'CRITICAL';
    }

    // High: High volatility (>17%) AND well below baseline (>20%)
    if (volatility > 17 && percentFromBaseline < -20) {
      return 'HIGH';
    }

    // Medium: Moderate volatility (>14%) AND below baseline (>15%)
    if (volatility > 14 && percentFromBaseline < -15) {
      return 'MEDIUM';
    }

    // Low: Some volatility or slight drop
    if (volatility > 10 || percentFromBaseline < -10) {
      return 'LOW';
    }

    return 'NONE';
  }

  /**
   * Calculate day-to-day swings (max daily change percentage)
   * Used in HRV Volatility Stress pattern (MH071)
   *
   * @param {Array<Number>} values - Array of daily values
   * @returns {Number} Maximum day-to-day swing percentage
   */
  calculateDailySwings(values) {
    if (!values || values.length < 2) return 0;

    let maxSwing = 0;

    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1];
      const curr = values[i];

      if (prev && curr && prev > 0) {
        const swing = Math.abs((curr - prev) / prev * 100);
        if (swing > maxSwing) {
          maxSwing = swing;
        }
      }
    }

    return parseFloat(maxSwing.toFixed(2));
  }

  /**
   * Detect sustained volatility over multiple days
   * @param {Array<Number>} values - Array of daily values
   * @param {Number} window - Window size (default 7 days)
   * @param {Number} threshold - Volatility threshold (default 14%)
   * @returns {Boolean} True if sustained volatility detected
   */
  detectSustainedVolatility(values, window = 7, threshold = this.highVolatilityThreshold) {
    if (!values || values.length < window) return false;

    // Check volatility for each rolling window
    let sustainedWindows = 0;

    for (let i = window - 1; i < values.length; i++) {
      const windowValues = values.slice(i - window + 1, i + 1);
      const volatility = this.calculateVolatility(windowValues);

      if (volatility > threshold) {
        sustainedWindows++;
      }
    }

    // Sustained if 50%+ of windows show high volatility
    const requiredWindows = Math.ceil((values.length - window + 1) / 2);
    return sustainedWindows >= requiredWindows;
  }

  /**
   * Get volatility interpretation for user communication
   * @param {Number} volatility - Volatility percentage
   * @returns {String} Human-readable interpretation
   */
  getInterpretation(volatility) {
    if (volatility > 20) {
      return 'Very high variability - your body is struggling to find its baseline';
    } else if (volatility > 14) {
      return 'High variability - inconsistent stress adaptation';
    } else if (volatility > 10) {
      return 'Moderate variability - some inconsistency in recovery';
    } else if (volatility > 6) {
      return 'Normal variability - healthy day-to-day variation';
    } else {
      return 'Low variability - stable baseline (good)';
    }
  }

  /**
   * Analyze volatility trend over time
   * @param {Array<Number>} values - Array of daily values
   * @returns {Object} Trend analysis
   */
  analyzeTrend(values) {
    if (!values || values.length < 14) {
      return { trend: 'INSUFFICIENT_DATA' };
    }

    // Split into two halves
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const firstVolatility = this.calculateVolatility(firstHalf);
    const secondVolatility = this.calculateVolatility(secondHalf);

    const change = secondVolatility - firstVolatility;
    const percentChange = (change / firstVolatility) * 100;

    let trend = 'STABLE';
    if (percentChange > 20) {
      trend = 'INCREASING'; // Volatility increasing (worsening)
    } else if (percentChange < -20) {
      trend = 'DECREASING'; // Volatility decreasing (improving)
    }

    return {
      trend,
      firstHalfVolatility: firstVolatility,
      secondHalfVolatility: secondVolatility,
      change,
      percentChange: parseFloat(percentChange.toFixed(2))
    };
  }
}

// Export the class (not singleton for flexibility)
module.exports = VolatilityAnalyzer;
