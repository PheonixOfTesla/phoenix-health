/**
 * CONSCIOUSNESS METRICS
 * =====================
 * Tracks all consciousness operations for monitoring and alerting.
 *
 * Provides:
 * - Per-module call counts and error rates
 * - Average response times
 * - Self-correction error detection counts
 * - Health scoring and alerting thresholds
 */

class ConsciousnessMetrics {
  constructor() {
    this.metrics = {
      selfAwareness: { calls: 0, errors: 0, avgTime: 0, totalTime: 0 },
      selfCorrection: { calls: 0, errors: 0, avgTime: 0, totalTime: 0, errorsDetected: 0 },
      realTimeLearning: { calls: 0, errors: 0, avgTime: 0, totalTime: 0 },
      metaCognition: { calls: 0, errors: 0, avgTime: 0, totalTime: 0 }
    };

    this.startTime = Date.now();
    this.alerts = [];
    this.lastReport = null;

    // Alert thresholds
    this.thresholds = {
      errorRateWarning: 0.05,   // 5% - warn
      errorRateCritical: 0.15, // 15% - critical
      avgTimeWarning: 2000,    // 2 seconds
      avgTimeCritical: 5000    // 5 seconds
    };

    
  }

  /**
   * Record a consciousness operation
   * @param {String} module - Module name (selfAwareness, selfCorrection, etc.)
   * @param {Number} duration - Operation duration in ms
   * @param {Boolean} success - Whether operation succeeded
   * @param {Object} extra - Extra data (e.g., errorsDetected for selfCorrection)
   */
  record(module, duration, success, extra = {}) {
    if (!this.metrics[module]) {
      console.warn(`[ConsciousnessMetrics] Unknown module: ${module}`);
      return;
    }

    const m = this.metrics[module];
    m.calls++;
    m.totalTime += duration;

    if (!success) {
      m.errors++;
    }

    // Rolling average
    m.avgTime = m.totalTime / m.calls;

    // Module-specific tracking
    if (module === 'selfCorrection' && extra.errorsDetected) {
      m.errorsDetected = (m.errorsDetected || 0) + extra.errorsDetected;
    }

    // Check for alerts
    this._checkAlerts(module);
  }

  /**
   * Check if any alert thresholds are exceeded
   * @private
   */
  _checkAlerts(module) {
    const m = this.metrics[module];
    if (m.calls < 10) return; // Need minimum sample size

    const errorRate = m.errors / m.calls;

    // Error rate alerts
    if (errorRate >= this.thresholds.errorRateCritical) {
      this._addAlert('critical', module, `Error rate ${(errorRate * 100).toFixed(1)}% exceeds critical threshold`);
    } else if (errorRate >= this.thresholds.errorRateWarning) {
      this._addAlert('warning', module, `Error rate ${(errorRate * 100).toFixed(1)}% exceeds warning threshold`);
    }

    // Response time alerts
    if (m.avgTime >= this.thresholds.avgTimeCritical) {
      this._addAlert('critical', module, `Avg response time ${m.avgTime.toFixed(0)}ms exceeds critical threshold`);
    } else if (m.avgTime >= this.thresholds.avgTimeWarning) {
      this._addAlert('warning', module, `Avg response time ${m.avgTime.toFixed(0)}ms exceeds warning threshold`);
    }
  }

  /**
   * Add an alert
   * @private
   */
  _addAlert(severity, module, message) {
    const alert = {
      severity,
      module,
      message,
      timestamp: new Date()
    };

    // Check if same alert already exists in last 5 minutes
    const recentSimilar = this.alerts.find(a =>
      a.module === module &&
      a.severity === severity &&
      (new Date() - a.timestamp) < 5 * 60 * 1000
    );

    if (!recentSimilar) {
      this.alerts.push(alert);
      console.error(`[ConsciousnessMetrics] ALERT [${severity.toUpperCase()}] ${module}: ${message}`);

      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }
    }
  }

  /**
   * Get comprehensive metrics report
   * @returns {Object} Metrics report
   */
  getReport() {
    const uptime = Date.now() - this.startTime;

    // Calculate totals
    let totalCalls = 0;
    let totalErrors = 0;
    let totalTime = 0;

    Object.values(this.metrics).forEach(m => {
      totalCalls += m.calls;
      totalErrors += m.errors;
      totalTime += m.totalTime;
    });

    const report = {
      uptime,
      uptimeFormatted: this._formatDuration(uptime),
      modules: {},
      totals: {
        calls: totalCalls,
        errors: totalErrors,
        errorRate: totalCalls > 0 ? (totalErrors / totalCalls * 100).toFixed(2) + '%' : '0%',
        avgTime: totalCalls > 0 ? (totalTime / totalCalls).toFixed(0) + 'ms' : '0ms'
      },
      health: this._calculateHealthScore(),
      recentAlerts: this.alerts.slice(-5),
      timestamp: new Date()
    };

    // Module-specific metrics
    Object.entries(this.metrics).forEach(([name, m]) => {
      report.modules[name] = {
        calls: m.calls,
        errors: m.errors,
        errorRate: m.calls > 0 ? (m.errors / m.calls * 100).toFixed(2) + '%' : '0%',
        avgTime: m.avgTime.toFixed(0) + 'ms',
        status: this._getModuleStatus(m)
      };

      // Add errorsDetected for selfCorrection
      if (name === 'selfCorrection') {
        report.modules[name].errorsDetected = m.errorsDetected || 0;
      }
    });

    this.lastReport = report;
    return report;
  }

  /**
   * Calculate overall health score (0-100)
   * @private
   */
  _calculateHealthScore() {
    let score = 100;
    let activeModules = 0;

    Object.values(this.metrics).forEach(m => {
      if (m.calls === 0) return;
      activeModules++;

      const errorRate = m.errors / m.calls;
      const timeScore = Math.max(0, 100 - (m.avgTime / 50)); // Deduct for slow responses

      // Deduct for errors
      score -= errorRate * 50;
      // Deduct for slow responses
      score -= Math.max(0, (m.avgTime - 1000) / 100);
    });

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor',
      activeModules
    };
  }

  /**
   * Get status for a module
   * @private
   */
  _getModuleStatus(m) {
    if (m.calls === 0) return 'idle';

    const errorRate = m.errors / m.calls;
    if (errorRate >= this.thresholds.errorRateCritical) return 'critical';
    if (errorRate >= this.thresholds.errorRateWarning) return 'warning';
    if (m.avgTime >= this.thresholds.avgTimeCritical) return 'slow';
    if (m.avgTime >= this.thresholds.avgTimeWarning) return 'degraded';
    return 'healthy';
  }

  /**
   * Format duration as human-readable
   * @private
   */
  _formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Get active alerts
   * @returns {Array} Active alerts
   */
  getActiveAlerts() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.alerts.filter(a => a.timestamp > fiveMinutesAgo);
  }

  /**
   * Check if system should alert (for external monitoring)
   * @returns {Object} Alert status
   */
  shouldAlert() {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

    return {
      shouldAlert: criticalAlerts.length > 0,
      criticalCount: criticalAlerts.length,
      warningCount: activeAlerts.filter(a => a.severity === 'warning').length,
      alerts: activeAlerts
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  reset() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = { calls: 0, errors: 0, avgTime: 0, totalTime: 0 };
      if (key === 'selfCorrection') {
        this.metrics[key].errorsDetected = 0;
      }
    });
    this.alerts = [];
    this.startTime = Date.now();
    
  }

  /**
   * Get metrics as Prometheus-compatible format
   * @returns {String} Prometheus metrics
   */
  getPrometheusMetrics() {
    const lines = [];

    // Module metrics
    Object.entries(this.metrics).forEach(([name, m]) => {
      lines.push(`phoenix_consciousness_${name}_calls_total ${m.calls}`);
      lines.push(`phoenix_consciousness_${name}_errors_total ${m.errors}`);
      lines.push(`phoenix_consciousness_${name}_avg_time_ms ${m.avgTime.toFixed(2)}`);
    });

    // Health score
    const health = this._calculateHealthScore();
    lines.push(`phoenix_consciousness_health_score ${health.score}`);

    // Uptime
    lines.push(`phoenix_consciousness_uptime_seconds ${Math.floor((Date.now() - this.startTime) / 1000)}`);

    return lines.join('\n');
  }
}

// Export singleton instance
const consciousnessMetrics = new ConsciousnessMetrics();

module.exports = consciousnessMetrics;
