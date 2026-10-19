/**
 * CONSCIOUSNESS WRAPPER
 * =====================
 * Ensures consciousness operations NEVER crash the main flow.
 * All errors are logged, never thrown.
 *
 * This is the bulletproof layer that guarantees Phoenix's consciousness
 * modules run without affecting user experience.
 *
 * Features:
 * - 5-second timeout on all async operations
 * - Fallback values for every operation
 * - Comprehensive error logging
 * - Health status tracking
 */

const selfAwareness = require('./selfAwareness');
const selfCorrection = require('./selfCorrection');
const realTimeLearning = require('./realTimeLearning');
const metaCognition = require('./metaCognition');
const consciousnessMetrics = require('./consciousnessMetrics');

class ConsciousnessWrapper {
  constructor() {
    this.operationCount = 0;
    this.errorCount = 0;
    this.lastError = null;
    this.startTime = Date.now();

    
  }

  /**
   * Safe wrapper for any consciousness operation
   * @param {Function} operation - The async operation to execute
   * @param {String} operationName - Name for logging
   * @param {*} fallback - Value to return on failure
   * @param {Number} timeoutMs - Timeout in milliseconds (default 5000)
   * @returns {*} Operation result or fallback
   */
  async safeExecute(operation, operationName, fallback = null, timeoutMs = 5000) {
    this.operationCount++;
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        operation(),
        this._timeout(timeoutMs, operationName)
      ]);

      const duration = Date.now() - startTime;
      

      // Record success metrics
      consciousnessMetrics.record(
        this._getModuleName(operationName),
        duration,
        true
      );

      return result;

    } catch (error) {
      this.errorCount++;
      this.lastError = {
        operation: operationName,
        error: error.message,
        timestamp: new Date()
      };

      const duration = Date.now() - startTime;
      console.error(`[Consciousness] ${operationName} failed (${duration}ms):`, error.message);

      // Record failure metrics
      consciousnessMetrics.record(
        this._getModuleName(operationName),
        duration,
        false
      );

      return fallback;
    }
  }

  /**
   * Create a timeout promise
   * @private
   */
  _timeout(ms, operationName) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${operationName} timed out after ${ms}ms`)), ms)
    );
  }

  /**
   * Extract module name from operation name
   * @private
   */
  _getModuleName(operationName) {
    if (operationName.toLowerCase().includes('awareness')) return 'selfAwareness';
    if (operationName.toLowerCase().includes('correction')) return 'selfCorrection';
    if (operationName.toLowerCase().includes('learning')) return 'realTimeLearning';
    if (operationName.toLowerCase().includes('cognition') || operationName.toLowerCase().includes('reflect')) return 'metaCognition';
    return 'unknown';
  }

  /**
   * Run full consciousness post-processing with guaranteed safety
   * This is the main method called after every AI response
   *
   * @param {String} userId - User ID
   * @param {String} query - User's query
   * @param {String} response - AI response
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Consciousness processing results
   */
  async runPostProcessing(userId, query, response, metadata = {}) {
    const results = {
      selfContext: null,
      correction: null,
      learning: null,
      reflection: null,
      errors: [],
      timestamp: new Date()
    };

    // 1. Self-awareness context (validate system state)
    results.selfContext = await this.safeExecute(
      () => selfAwareness.getSelfContext(),
      'Self-Awareness Context',
      { status: 'unavailable', capabilities: [] }
    );

    // 2. Self-correction analysis (check for errors in response)
    results.correction = await this.safeExecute(
      () => selfCorrection.analyzeResponse(response, {
        query,
        userId,
        source: metadata.source,
        cacheAge: metadata.cacheAge,
        confidence: metadata.confidence
      }),
      'Self-Correction Analysis',
      { hasErrors: false, errors: [], warnings: [], healthScore: 1.0 }
    );

    // Track detected errors
    if (results.correction.hasErrors) {
      consciousnessMetrics.record('selfCorrection', 0, true, {
        errorsDetected: results.correction.errors.length
      });
    }

    // 3. Log interaction for learning
    results.learning = await this.safeExecute(
      () => realTimeLearning.logInteraction(userId, query, response, null, {
        source: metadata.source || 'chat',
        confidence: metadata.confidence || 0.7,
        queryType: metadata.queryType || 'ACTION',
        responseTime: metadata.responseTime,
        sessionId: metadata.sessionId,
        hadErrors: results.correction.hasErrors
      }),
      'Real-Time Learning Log',
      { success: false, interactionId: null }
    );

    // 4. Meta-cognitive reflection
    results.reflection = await this.safeExecute(
      () => metaCognition.reflect(
        {
          type: metadata.queryType || 'general',
          message: typeof response === 'string' ? response : JSON.stringify(response),
          content: response,
          confidence: metadata.confidence || 0.7
        },
        {
          userId,
          trigger: metadata.source || 'chat',
          timestamp: new Date(),
          inputData: metadata.inputData
        }
      ),
      'Meta-Cognition Reflection',
      { dataQuality: 0, improvementOpportunities: [], reflectionId: null }
    );

    // Collect any errors that occurred
    if (!results.selfContext || results.selfContext.status === 'unavailable') {
      results.errors.push('self-awareness unavailable');
    }
    if (!results.learning || !results.learning.success) {
      results.errors.push('learning log failed');
    }

    return results;
  }

  /**
   * Run pre-processing before AI query (get context)
   * @param {String} userId - User ID
   * @returns {Object} Pre-processing context
   */
  async runPreProcessing(userId) {
    const context = {
      selfContext: null,
      calibrations: null,
      teachings: null,
      recentPatterns: null,
      timestamp: new Date()
    };

    // Get self-awareness context
    context.selfContext = await this.safeExecute(
      () => selfAwareness.getSelfContext(),
      'Self-Awareness Pre-Context',
      { status: 'available', capabilities: [], health: { status: 'unknown' } }
    );

    // Get confidence calibrations
    context.calibrations = await this.safeExecute(
      () => realTimeLearning.getAllCalibrations(userId),
      'Confidence Calibrations',
      {}
    );

    // Get applicable teachings
    context.teachings = await this.safeExecute(
      async () => {
        const service = realTimeLearning.service || realTimeLearning;
        if (service.getApplicableTeachings) {
          return await service.getApplicableTeachings(userId, '', null);
        }
        return [];
      },
      'User Teachings',
      []
    );

    return context;
  }

  /**
   * Get health status of consciousness system
   * @returns {Object} Health status
   */
  getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.operationCount > 0
      ? (this.errorCount / this.operationCount * 100).toFixed(2) + '%'
      : '0%';

    return {
      status: this._determineOverallStatus(),
      uptime,
      uptimeFormatted: this._formatUptime(uptime),
      operationCount: this.operationCount,
      errorCount: this.errorCount,
      errorRate,
      lastError: this.lastError,
      healthy: this.errorCount === 0 || (this.errorCount / this.operationCount) < 0.05,
      modules: {
        selfAwareness: this._checkModuleHealth('selfAwareness'),
        selfCorrection: this._checkModuleHealth('selfCorrection'),
        realTimeLearning: this._checkModuleHealth('realTimeLearning'),
        metaCognition: this._checkModuleHealth('metaCognition')
      },
      metrics: consciousnessMetrics.getReport()
    };
  }

  /**
   * Determine overall status
   * @private
   */
  _determineOverallStatus() {
    if (this.operationCount === 0) return 'idle';

    const errorRate = this.errorCount / this.operationCount;
    if (errorRate === 0) return 'healthy';
    if (errorRate < 0.05) return 'healthy';
    if (errorRate < 0.15) return 'degraded';
    return 'critical';
  }

  /**
   * Check module health based on recent operations
   * @private
   */
  _checkModuleHealth(moduleName) {
    const metrics = consciousnessMetrics.getReport();
    const moduleMetrics = metrics.modules?.[moduleName];

    if (!moduleMetrics || moduleMetrics.calls === 0) {
      return { status: 'idle', calls: 0 };
    }

    const errorRate = moduleMetrics.calls > 0
      ? moduleMetrics.errors / moduleMetrics.calls
      : 0;

    return {
      status: errorRate < 0.05 ? 'healthy' : errorRate < 0.15 ? 'degraded' : 'critical',
      calls: moduleMetrics.calls,
      errors: moduleMetrics.errors,
      avgTime: moduleMetrics.avgTime
    };
  }

  /**
   * Format uptime as human-readable string
   * @private
   */
  _formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset error counters (for testing)
   */
  reset() {
    this.operationCount = 0;
    this.errorCount = 0;
    this.lastError = null;
    
  }
}

// Export singleton instance
const consciousnessWrapper = new ConsciousnessWrapper();

module.exports = consciousnessWrapper;
