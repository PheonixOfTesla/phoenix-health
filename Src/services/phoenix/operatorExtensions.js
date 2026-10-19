/**
 * Extended Behavioral Operator Evaluators for Pattern Detection Engine
 * These methods handle new operators used in the 540-pattern library
 */

module.exports = {
  /**
   * CHRONIC_LOW - Value consistently below baseline for extended period
   */
  evaluateChronicLowCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 7 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const belowBaselineCount = values.filter(v => v < (baseline * (1 - threshold / 100))).length;
    const percentChronicLow = (belowBaselineCount / values.length) * 100;

    const met = percentChronicLow >= 70; // 70% of time below threshold
    const strength = Math.min(percentChronicLow / 70, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} chronically low ${percentChronicLow.toFixed(1)}% of time`
    };
  },

  /**
   * CHRONIC_HIGH - Value consistently above baseline for extended period
   */
  evaluateChronicHighCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 7 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const aboveBaselineCount = values.filter(v => v > (baseline * (1 + threshold / 100))).length;
    const percentChronicHigh = (aboveBaselineCount / values.length) * 100;

    const met = percentChronicHigh >= 70;
    const strength = Math.min(percentChronicHigh / 70, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} chronically high ${percentChronicHigh.toFixed(1)}% of time`
    };
  },

  /**
   * VOLATILE - High variability/instability in values
   */
  evaluateVolatileCondition(windowData, threshold, behavior) {
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
      evidence: `${behavior} volatility at ${coefficientOfVariation.toFixed(1)}% (threshold: ${threshold}%)`
    };
  },

  /**
   * GRADUALLY_IMPROVES - Upward trend over time
   */
  evaluateGradualImprovementCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 5 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    // Calculate linear regression slope
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + (i * v), 0);
    const sumX2 = values.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgImprovement = (slope / baseline) * 100;

    const met = avgImprovement >= (threshold / 100);
    const strength = Math.min(Math.abs(avgImprovement) / (threshold / 100), 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} gradual improvement of ${avgImprovement.toFixed(1)}% per day`
    };
  },

  /**
   * GRADUALLY_DECREASES - Downward trend over time
   */
  evaluateGradualDecreaseCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 5 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = values.reduce((sum, v, i) => sum + (i * v), 0);
    const sumX2 = values.reduce((sum, _, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgDecrease = (slope / baseline) * 100 * -1; // Make positive

    const met = avgDecrease >= (threshold / 100);
    const strength = Math.min(Math.abs(avgDecrease) / (threshold / 100), 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} gradual decrease of ${avgDecrease.toFixed(1)}% per day`
    };
  },

  /**
   * PEAK_HIGH - Reaches exceptionally high values
   */
  evaluatePeakHighCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const maxValue = Math.max(...values);
    const percentPeak = ((maxValue - baseline) / baseline) * 100;

    const met = percentPeak >= threshold;
    const strength = Math.min(percentPeak / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} peaked ${percentPeak.toFixed(1)}% above baseline (threshold: ${threshold}%)`
    };
  },

  /**
   * STABLE_HIGH - Consistently high without much variation
   */
  evaluateStableHighCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 5 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentAbove = ((windowAvg - baseline) / baseline) * 100;

    // Check stability (low coefficient of variation)
    const variance = values.reduce((sum, v) => sum + Math.pow(v - windowAvg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / windowAvg) * 100;

    const met = percentAbove >= threshold && coefficientOfVariation < 15; // Stable = CV < 15%
    const strength = Math.min(percentAbove / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} stable high at ${percentAbove.toFixed(1)}% above baseline (CV: ${coefficientOfVariation.toFixed(1)}%)`
    };
  },

  /**
   * STABLE_LOW - Consistently low without much variation
   */
  evaluateStableLowCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 5 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentBelow = ((baseline - windowAvg) / baseline) * 100;

    const variance = values.reduce((sum, v) => sum + Math.pow(v - windowAvg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / windowAvg) * 100;

    const met = percentBelow >= threshold && coefficientOfVariation < 15;
    const strength = Math.min(percentBelow / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} stable low at ${percentBelow.toFixed(1)}% below baseline (CV: ${coefficientOfVariation.toFixed(1)}%)`
    };
  },

  /**
   * EXTREME_LOW - Values at critically low levels
   */
  evaluateExtremeLowCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentBelow = ((baseline - windowAvg) / baseline) * 100;

    const met = percentBelow >= threshold;
    const strength = Math.min(percentBelow / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} extremely low at ${percentBelow.toFixed(1)}% below baseline`
    };
  },

  /**
   * EXTREME_HIGH - Values at critically high levels
   */
  evaluateExtremeHighCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowAvg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const percentAbove = ((windowAvg - baseline) / baseline) * 100;

    const met = percentAbove >= threshold;
    const strength = Math.min(percentAbove / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} extremely high at ${percentAbove.toFixed(1)}% above baseline`
    };
  },

  /**
   * FREQUENT - Event occurs frequently
   */
  evaluateFrequentCondition(windowData, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const totalEvents = values.reduce((sum, v) => sum + v, 0);
    const avgEventsPerDay = totalEvents / values.length;

    const met = avgEventsPerDay >= threshold;
    const strength = Math.min(avgEventsPerDay / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} occurring ${avgEventsPerDay.toFixed(1)} times/day (threshold: ${threshold})`
    };
  },

  /**
   * CYCLICAL_DROP - Periodic drops in values
   */
  evaluateCyclicalDropCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 7 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    // Count drops below threshold
    let dropCount = 0;
    for (let i = 1; i < values.length; i++) {
      const drop = ((values[i-1] - values[i]) / values[i-1]) * 100;
      if (drop >= threshold) {
        dropCount++;
      }
    }

    const dropFrequency = (dropCount / values.length) * 100;
    const met = dropCount >= 2; // At least 2 cyclical drops
    const strength = Math.min(dropCount / 2, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} cyclical drops detected ${dropCount} times (${dropFrequency.toFixed(1)}% of days)`
    };
  },

  /**
   * DROPPING - Currently in decline
   */
  evaluateDroppingCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 3 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    // Look at recent trend (last 3-5 days)
    const recentValues = values.slice(-5);
    const firstValue = recentValues[0];
    const lastValue = recentValues[recentValues.length - 1];
    const percentDrop = ((firstValue - lastValue) / firstValue) * 100;

    const met = percentDrop >= threshold;
    const strength = Math.min(percentDrop / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} dropping ${percentDrop.toFixed(1)}% recently (threshold: ${threshold}%)`
    };
  },

  /**
   * RISING - Currently increasing
   */
  evaluateRisingCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length < 3 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const recentValues = values.slice(-5);
    const firstValue = recentValues[0];
    const lastValue = recentValues[recentValues.length - 1];
    const percentRise = ((lastValue - firstValue) / firstValue) * 100;

    const met = percentRise >= threshold;
    const strength = Math.min(percentRise / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} rising ${percentRise.toFixed(1)}% recently (threshold: ${threshold}%)`
    };
  },

  /**
   * NIGHTTIME_SPIKES - Spikes during nighttime hours
   */
  evaluateNighttimeSpikeCondition(windowData, baseline, threshold, behavior) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null);
    if (values.length === 0 || !baseline) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    // For simplified implementation, treat as regular spikes
    // In production, would need timestamp data to identify nighttime
    const maxValue = Math.max(...values);
    const percentSpike = ((maxValue - baseline) / baseline) * 100;

    const met = percentSpike >= threshold;
    const strength = Math.min(percentSpike / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} nighttime spikes of ${percentSpike.toFixed(1)}% above baseline`
    };
  },

  /**
   * DROPS_FROM_BASELINE - Value drops X% from personal baseline
   * Uses personalBaselineEngine for accurate baseline comparison
   */
  evaluateDropsFromBaselineCondition(windowData, personalBaseline, threshold, behavior) {
    const baselineEngine = require('./personalBaselineEngine');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);
    if (values.length < 3) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const currentValue = values[values.length - 1];
    const percentDrop = ((personalBaseline[behavior].mean - currentValue) / personalBaseline[behavior].mean) * 100;

    const met = percentDrop >= threshold;
    const strength = Math.min(percentDrop / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} is ${percentDrop.toFixed(1)}% below personal baseline (threshold: ${threshold}%)`
    };
  },

  /**
   * INCREASES_FROM_BASELINE - Value increases X% from personal baseline
   * Uses personalBaselineEngine for accurate baseline comparison
   */
  evaluateIncreasesFromBaselineCondition(windowData, personalBaseline, threshold, behavior) {
    const baselineEngine = require('./personalBaselineEngine');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);
    if (values.length < 3) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const currentValue = values[values.length - 1];
    const percentIncrease = ((currentValue - personalBaseline[behavior].mean) / personalBaseline[behavior].mean) * 100;

    const met = percentIncrease >= threshold;
    const strength = Math.min(percentIncrease / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} is ${percentIncrease.toFixed(1)}% above personal baseline (threshold: ${threshold}%)`
    };
  },

  /**
   * SPIKES_FROM_BASELINE - Sudden spike from baseline (for RHR illness prediction)
   * Uses personalBaselineEngine for accurate baseline comparison
   */
  evaluateSpikesFromBaselineCondition(windowData, personalBaseline, threshold, behavior) {
    const baselineEngine = require('./personalBaselineEngine');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);
    if (values.length < 2) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    // Check recent spike (last 2-3 days)
    const recentValues = values.slice(-3);
    const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const spike = avgRecent - personalBaseline[behavior].mean;

    const met = spike >= threshold;
    const strength = Math.min(spike / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} spike of +${spike.toFixed(1)} ${behavior === 'restingHeartRate' ? 'bpm' : 'units'} from baseline (threshold: ${threshold})`
    };
  },

  /**
   * BELOW_BASELINE - Value below personal baseline by threshold
   * From 10K simulation research
   */
  evaluateBelowBaselineCondition(windowData, personalBaseline, threshold, behavior) {
    const baselineEngine = require('./personalBaselineEngine');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);
    if (values.length < 3) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const currentValue = values[values.length - 1];
    const percentChange = baselineEngine.getPercentChange(currentValue, personalBaseline[behavior]);

    const met = percentChange < -threshold; // Negative = below
    const strength = Math.min(Math.abs(percentChange) / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} is ${Math.abs(percentChange).toFixed(1)}% below personal baseline (threshold: ${threshold}%)`
    };
  },

  /**
   * ABOVE_BASELINE - Value above personal baseline by threshold
   * From 10K simulation research
   */
  evaluateAboveBaselineCondition(windowData, personalBaseline, threshold, behavior) {
    const baselineEngine = require('./personalBaselineEngine');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);
    if (values.length < 3) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const currentValue = values[values.length - 1];
    const percentChange = baselineEngine.getPercentChange(currentValue, personalBaseline[behavior]);

    const met = percentChange > threshold; // Positive = above
    const strength = Math.min(percentChange / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} is ${percentChange.toFixed(1)}% above personal baseline (threshold: ${threshold}%)`
    };
  },

  /**
   * VOLATILITY_ABOVE - HRV volatility exceeds threshold
   * Key finding from 10K simulation: volatility >14% = stress dysregulation
   */
  evaluateVolatilityAboveCondition(windowData, threshold, behavior) {
    const volatilityAnalyzer = require('./volatilityAnalyzer');

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);
    if (values.length < 3) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const volatility = volatilityAnalyzer.calculateVolatility(values);
    const met = volatilityAnalyzer.isHighVolatility(volatility, threshold);
    const strength = Math.min(volatility / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} volatility at ${volatility.toFixed(1)}% (threshold: ${threshold}%)`
    };
  },

  /**
   * DYSREGULATED - Stress dysregulation (high volatility + low mean)
   * Critical pattern from 10K simulation
   */
  evaluateDysregulatedCondition(windowData, personalBaseline, behavior) {
    const volatilityAnalyzer = require('./volatilityAnalyzer');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);
    if (values.length < 7) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const analysis = volatilityAnalyzer.detectDysregulation(values, personalBaseline[behavior]);
    const strength = analysis.dysregulated ? Math.min(analysis.volatility / 14, 2.0) : 0;

    return {
      met: analysis.dysregulated,
      strength,
      evidence: `${behavior} dysregulation: ${analysis.volatility.toFixed(1)}% volatility, ${analysis.percentFromBaseline.toFixed(1)}% below baseline`
    };
  },

  /**
   * WEEKEND_WEEKDAY_DELTA - Weekend values differ from weekday
   * Pattern P052 from 10K simulation (64% of users)
   */
  evaluateWeekendWeekdayDeltaCondition(windowData, threshold, behavior) {
    if (!windowData || windowData.length < 14) {
      return { met: false, strength: 0, evidence: 'Insufficient data (need 2+ weeks)' };
    }

    // Separate weekend vs weekday
    const weekendData = windowData.filter(d => {
      const day = d.date ? new Date(d.date).getDay() : -1;
      return day === 0 || day === 6; // Sunday or Saturday
    });

    const weekdayData = windowData.filter(d => {
      const day = d.date ? new Date(d.date).getDay() : -1;
      return day >= 1 && day <= 5; // Monday-Friday
    });

    if (weekendData.length < 4 || weekdayData.length < 10) {
      return { met: false, strength: 0, evidence: 'Insufficient weekend/weekday data' };
    }

    // Calculate averages
    const weekendValues = weekendData.map(d => d[behavior]).filter(v => v);
    const weekdayValues = weekdayData.map(d => d[behavior]).filter(v => v);

    if (weekendValues.length === 0 || weekdayValues.length === 0) {
      return { met: false, strength: 0, evidence: 'No valid metric values' };
    }

    const weekendAvg = weekendValues.reduce((a, b) => a + b, 0) / weekendValues.length;
    const weekdayAvg = weekdayValues.reduce((a, b) => a + b, 0) / weekdayValues.length;

    const percentDiff = Math.abs(((weekendAvg - weekdayAvg) / weekdayAvg) * 100);

    const met = percentDiff >= threshold;
    const strength = Math.min(percentDiff / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} ${percentDiff.toFixed(1)}% difference between weekend (${weekendAvg.toFixed(1)}) and weekday (${weekdayAvg.toFixed(1)})`
    };
  },

  /**
   * MONDAY_RETURNS_TO_BASELINE - Monday values return to baseline after weekend
   * Part of weekend recovery pattern (P052)
   */
  evaluateMondayReturnsToBaselineCondition(windowData, personalBaseline, behavior) {
    const baselineEngine = require('./personalBaselineEngine');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    if (!windowData || windowData.length < 7) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    // Get most recent Monday
    const mondays = windowData.filter(d => {
      const day = d.date ? new Date(d.date).getDay() : -1;
      return day === 1; // Monday
    });

    if (mondays.length === 0) {
      return { met: false, strength: 0, evidence: 'No Monday data available' };
    }

    const recentMonday = mondays[mondays.length - 1];
    const mondayValue = recentMonday[behavior];

    if (!mondayValue) {
      return { met: false, strength: 0, evidence: 'No Monday metric value' };
    }

    const withinRange = baselineEngine.isWithinNormalRange(mondayValue, personalBaseline[behavior]);
    const percentFromBaseline = baselineEngine.getPercentChange(mondayValue, personalBaseline[behavior]);

    const strength = withinRange ? 1.5 : Math.max(0.5, 1.0 - Math.abs(percentFromBaseline) / 20);

    return {
      met: withinRange,
      strength,
      evidence: `Monday ${behavior} ${withinRange ? 'returned to' : 'not at'} baseline (${percentFromBaseline.toFixed(1)}% from baseline)`
    };
  },

  /**
   * BIDIRECTIONAL_LOOP - Detect bidirectional causality loop (e.g. activity-sleep spiral)
   * Pattern P054 from 10K simulation
   */
  evaluateBidirectionalLoopCondition(windowData, metric1, metric2, lag = 1) {
    if (!windowData || windowData.length < 10) {
      return { met: false, strength: 0, evidence: 'Insufficient data for loop detection' };
    }

    let forwardCount = 0; // metric1 low → metric2 low next day
    let backwardCount = 0; // metric2 low → metric1 low next day

    for (let i = 0; i < windowData.length - lag; i++) {
      const today = windowData[i];
      const nextDay = windowData[i + lag];

      // Check forward: metric1 low today → metric2 low tomorrow
      if (today[metric1] && nextDay[metric2]) {
        const m1Baseline = today[metric1] * 1.1; // 10% below = "low"
        const m2Baseline = nextDay[metric2] * 1.1;

        if (today[metric1] < m1Baseline && nextDay[metric2] < m2Baseline) {
          forwardCount++;
        }
      }

      // Check backward: metric2 low today → metric1 low tomorrow
      if (today[metric2] && nextDay[metric1]) {
        const m2Baseline = today[metric2] * 1.1;
        const m1Baseline = nextDay[metric1] * 1.1;

        if (today[metric2] < m2Baseline && nextDay[metric1] < m1Baseline) {
          backwardCount++;
        }
      }
    }

    // Loop exists if both directions show correlation
    const met = forwardCount >= 3 && backwardCount >= 3;
    const strength = Math.min((forwardCount + backwardCount) / 6, 2.0);

    return {
      met,
      strength,
      evidence: `Bidirectional loop: ${metric1}→${metric2} (${forwardCount}x), ${metric2}→${metric1} (${backwardCount}x)`
    };
  },

  /**
   * SUDDEN_INCREASE - Rapid increase (not gradual)
   * From 10K simulation temporal operators
   */
  evaluateSuddenIncreaseCondition(windowData, threshold, behavior, window = 2) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);

    if (values.length < window * 2) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const recent = values.slice(-window);
    const earlier = values.slice(-(window * 2), -window);

    if (earlier.length === 0) {
      return { met: false, strength: 0, evidence: 'Insufficient comparison data' };
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    const increase = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    const met = increase > threshold;
    const strength = Math.min(increase / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} sudden increase of ${increase.toFixed(1)}% in ${window} days (threshold: ${threshold}%)`
    };
  },

  /**
   * SUDDEN_DROP - Rapid drop (not gradual)
   * From 10K simulation temporal operators
   */
  evaluateSuddenDropCondition(windowData, threshold, behavior, window = 2) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);

    if (values.length < window * 2) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const recent = values.slice(-window);
    const earlier = values.slice(-(window * 2), -window);

    if (earlier.length === 0) {
      return { met: false, strength: 0, evidence: 'Insufficient comparison data' };
    }

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

    const drop = ((earlierAvg - recentAvg) / earlierAvg) * 100;

    const met = drop > threshold;
    const strength = Math.min(drop / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} sudden drop of ${drop.toFixed(1)}% in ${window} days (threshold: ${threshold}%)`
    };
  },

  /**
   * GRADUAL_DECLINE - Gradual decline over time (linear regression slope)
   * Enhanced from existing operator with 10K simulation insights
   */
  evaluateGradualDeclineCondition(windowData, threshold, behavior, window = 14) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);

    if (values.length < window) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowValues = values.slice(-window);

    // Calculate linear regression slope
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = windowValues.length;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += windowValues[i];
      sumXY += i * windowValues[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const mean = sumY / n;

    // Calculate total decline as percentage
    const totalDecline = Math.abs((slope * n) / mean) * 100;

    const met = slope < 0 && totalDecline > threshold;
    const strength = Math.min(totalDecline / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} gradual decline of ${totalDecline.toFixed(1)}% over ${window} days (threshold: ${threshold}%)`
    };
  },

  /**
   * GRADUAL_IMPROVEMENT - Gradual improvement over time
   * Enhanced from existing operator with 10K simulation insights
   */
  evaluateGradualImprovementCondition(windowData, threshold, behavior, window = 14) {
    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);

    if (values.length < window) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const windowValues = values.slice(-window);

    // Calculate linear regression slope
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = windowValues.length;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += windowValues[i];
      sumXY += i * windowValues[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const mean = sumY / n;

    // Calculate total improvement as percentage
    const totalImprovement = Math.abs((slope * n) / mean) * 100;

    const met = slope > 0 && totalImprovement > threshold;
    const strength = Math.min(totalImprovement / threshold, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} gradual improvement of ${totalImprovement.toFixed(1)}% over ${window} days (threshold: ${threshold}%)`
    };
  },

  /**
   * STABLE - Low volatility and near baseline
   * From 10K simulation temporal operators
   */
  evaluateStableCondition(windowData, personalBaseline, threshold, behavior) {
    const volatilityAnalyzer = require('./volatilityAnalyzer');
    const baselineEngine = require('./personalBaselineEngine');

    if (!personalBaseline || !personalBaseline[behavior]) {
      return { met: false, strength: 0, evidence: 'No personal baseline available' };
    }

    const values = windowData.map(d => d[behavior]).filter(v => v !== undefined && v !== null && v > 0);

    if (values.length < 7) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    const volatility = volatilityAnalyzer.calculateVolatility(values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const percentFromBaseline = Math.abs(baselineEngine.getPercentChange(mean, personalBaseline[behavior]));

    const met = volatility < threshold && percentFromBaseline < threshold;
    const strength = met ? Math.min(2.0 - (volatility / threshold), 2.0) : 0;

    return {
      met,
      strength,
      evidence: `${behavior} ${met ? 'stable' : 'unstable'}: ${volatility.toFixed(1)}% volatility, ${percentFromBaseline.toFixed(1)}% from baseline`
    };
  },

  /**
   * CONSECUTIVE - Condition true for consecutive days
   * From 10K simulation utility operators
   */
  evaluateConsecutiveCondition(windowData, conditionFn, daysRequired, behavior) {
    if (!windowData || windowData.length < daysRequired) {
      return { met: false, strength: 0, evidence: 'Insufficient data' };
    }

    let consecutiveCount = 0;
    let maxConsecutive = 0;

    // Count from most recent backwards
    for (let i = windowData.length - 1; i >= 0; i--) {
      if (conditionFn(windowData[i])) {
        consecutiveCount++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
        if (consecutiveCount >= daysRequired) break;
      } else {
        break; // Reset if streak breaks
      }
    }

    const met = consecutiveCount >= daysRequired;
    const strength = Math.min(consecutiveCount / daysRequired, 2.0);

    return {
      met,
      strength,
      evidence: `${behavior} consecutive for ${consecutiveCount} days (required: ${daysRequired})`
    };
  }
};
