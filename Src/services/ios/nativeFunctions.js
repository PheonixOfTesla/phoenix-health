/**
 * iOS NATIVE FUNCTIONS SERVICE
 *
 * This service acts as the bridge between Phoenix backend intelligence
 * and iOS native capabilities (HealthKit, Calendar, Contacts, Geolocation, etc.)
 *
 * Architecture:
 * 1. Frontend (iOS) calls native APIs via Capacitor plugins
 * 2. Frontend sends data to this backend service
 * 3. Backend processes with consciousMind + butler intelligence
 * 4. Backend returns actions/insights
 * 5. Frontend executes native actions
 */

const RecoveryScore = require('../../models/mercury/RecoveryScore');
const consciousMind = require('../gemini/consciousMind');

class iOSNativeFunctions {
  constructor() {
    this.supportedFunctions = [
      'healthkit',
      'calendar',
      'contacts',
      'geolocation',
      'camera',
      'notifications',
      'haptics',
      'appLauncher',
      'applePay'
    ];
  }

  /**
   * HEALTHKIT - Sync health data from iOS to backend
   *
   * @param {String} userId - User ID
   * @param {Object} healthData - Health data from iOS HealthKit
   * @returns {Object} - Analysis and insights
   */
  async syncHealthKit(userId, healthData) {
    try {
      

      const {
        heartRate,
        heartRateVariability,
        sleepAnalysis,
        steps,
        activeEnergy,
        restingEnergy,
        workouts,
        bloodOxygen,
        respiratoryRate,
        bodyTemperature
      } = healthData;

      // Calculate recovery score from HealthKit data
      const recoveryScore = await this.calculateRecoveryFromHealthKit({
        heartRate,
        heartRateVariability,
        sleepAnalysis,
        restingEnergy
      });

      // Store in Mercury recovery system
      const recovery = new RecoveryScore({
        userId,
        date: new Date(),
        totalScore: recoveryScore.score,
        score: recoveryScore.score,
        factors: recoveryScore.factors,
        recommendations: recoveryScore.recommendations,
        source: 'healthkit_ios',
        rawData: {
          heartRate,
          heartRateVariability,
          sleepAnalysis,
          steps,
          activeEnergy,
          restingEnergy,
          workouts,
          bloodOxygen,
          respiratoryRate,
          bodyTemperature
        }
      });

      await recovery.save();

      // Get AI insights from consciousMind
      const insights = await consciousMind.respondToQuery(
        `Analyze my health data: Recovery ${recoveryScore.score}%, HRV ${heartRateVariability}, Sleep ${sleepAnalysis?.totalSleep || 'N/A'} hours`,
        userId,
        { healthData, recoveryScore }
      );

      return {
        success: true,
        recoveryScore: recoveryScore.score,
        insights: insights.message,
        recommendations: recoveryScore.recommendations,
        shouldTriggerHaptic: recoveryScore.score < 50, // Haptic alert if low recovery
        notificationText: recoveryScore.score < 50
          ? `⚠️ Low recovery (${recoveryScore.score}%). Consider rest today.`
          : null
      };
    } catch (error) {
      console.error('[iOS Native] HealthKit sync error:', error);
      throw error;
    }
  }

  /**
   * Calculate recovery score from HealthKit metrics
   */
  async calculateRecoveryFromHealthKit(healthMetrics) {
    const { heartRate, heartRateVariability, sleepAnalysis, restingEnergy } = healthMetrics;

    let score = 100;
    const factors = [];
    const recommendations = [];

    // HRV analysis (most important for recovery)
    if (heartRateVariability) {
      if (heartRateVariability < 30) {
        score -= 30;
        factors.push({ name: 'Low HRV', impact: -30, value: heartRateVariability });
        recommendations.push('Your HRV is low. Prioritize sleep and reduce stress.');
      } else if (heartRateVariability < 50) {
        score -= 15;
        factors.push({ name: 'Below Average HRV', impact: -15, value: heartRateVariability });
      } else {
        factors.push({ name: 'Healthy HRV', impact: 0, value: heartRateVariability });
      }
    }

    // Resting heart rate analysis
    if (heartRate?.resting) {
      const restingHR = heartRate.resting;
      if (restingHR > 70) {
        score -= 15;
        factors.push({ name: 'Elevated Resting HR', impact: -15, value: restingHR });
        recommendations.push('Elevated resting heart rate. Consider active recovery.');
      }
    }

    // Sleep analysis
    if (sleepAnalysis) {
      const totalSleep = sleepAnalysis.totalSleep || 0;
      const deepSleep = sleepAnalysis.deepSleep || 0;

      if (totalSleep < 6) {
        score -= 25;
        factors.push({ name: 'Insufficient Sleep', impact: -25, value: totalSleep });
        recommendations.push('You need more sleep. Aim for 7-9 hours tonight.');
      } else if (totalSleep < 7) {
        score -= 10;
        factors.push({ name: 'Low Sleep', impact: -10, value: totalSleep });
      }

      if (deepSleep < 1.5) {
        score -= 10;
        factors.push({ name: 'Low Deep Sleep', impact: -10, value: deepSleep });
        recommendations.push('Poor deep sleep quality. Avoid screens before bed.');
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
      recommendations
    };
  }

  /**
   * CALENDAR - Get upcoming events for context
   *
   * @param {String} userId - User ID
   * @param {Array} events - Calendar events from iOS
   * @returns {Object} - Context for AI
   */
  async processCalendarEvents(userId, events) {
    try {
      

      const now = new Date();
      const upcoming = events
        .filter(e => new Date(e.startDate) > now)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);

      const context = {
        hasEventsToday: events.some(e =>
          new Date(e.startDate).toDateString() === now.toDateString()
        ),
        nextEvent: upcoming[0] || null,
        upcomingCount: upcoming.length,
        events: upcoming
      };

      return {
        success: true,
        context,
        summary: upcoming.length > 0
          ? `You have ${upcoming.length} upcoming events. Next: ${upcoming[0].title} at ${new Date(upcoming[0].startDate).toLocaleTimeString()}`
          : 'Your calendar is clear.'
      };
    } catch (error) {
      console.error('[iOS Native] Calendar processing error:', error);
      throw error;
    }
  }

  /**
   * GEOLOCATION - Process location for context
   *
   * @param {String} userId - User ID
   * @param {Object} location - Location from iOS Geolocation
   * @returns {Object} - Location context
   */
  async processLocation(userId, location) {
    try {
      const { latitude, longitude, accuracy, altitude, heading, speed } = location;

      

      // Determine location context (home, work, gym, etc.)
      // TODO: Implement location pattern detection
      const locationContext = await this.determineLocationContext(userId, latitude, longitude);

      return {
        success: true,
        coordinates: { latitude, longitude },
        accuracy,
        context: locationContext,
        isMoving: speed > 1, // meters/second
        heading
      };
    } catch (error) {
      console.error('[iOS Native] Location processing error:', error);
      throw error;
    }
  }

  /**
   * Determine location context (home, work, gym)
   */
  async determineLocationContext(userId, lat, lon) {
    // TODO: Implement with user's saved locations
    // For now, return generic context
    return {
      type: 'unknown',
      name: 'Current Location',
      arrivalTime: new Date()
    };
  }

  /**
   * CONTACTS - Search contacts for butler actions
   *
   * @param {String} query - Search query (name)
   * @param {Array} contacts - iOS contacts list
   * @returns {Object} - Matched contact
   */
  async searchContacts(query, contacts) {
    try {
      const normalizedQuery = query.toLowerCase();

      const matches = contacts.filter(contact => {
        const fullName = `${contact.givenName || ''} ${contact.familyName || ''}`.toLowerCase();
        const nickname = (contact.nickname || '').toLowerCase();

        return fullName.includes(normalizedQuery) || nickname.includes(normalizedQuery);
      });

      return {
        success: true,
        matches,
        exactMatch: matches.length === 1 ? matches[0] : null
      };
    } catch (error) {
      console.error('[iOS Native] Contact search error:', error);
      throw error;
    }
  }

  /**
   * APPLE PAY - Process payment request
   *
   * @param {String} userId - User ID
   * @param {Object} paymentRequest - Payment details
   * @returns {Object} - Payment authorization
   */
  async processApplePayment(userId, paymentRequest) {
    try {
      const { amount, merchant, description } = paymentRequest;

      

      // TODO: Implement payment processing
      // For now, return authorization structure

      return {
        success: true,
        authorized: true,
        transactionId: `APL-${Date.now()}`,
        amount,
        merchant,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('[iOS Native] Apple Pay error:', error);
      throw error;
    }
  }

  /**
   * UNIFIED CONTEXT - Combine all iOS native data for AI
   *
   * @param {String} userId - User ID
   * @param {Object} nativeData - All native iOS data
   * @returns {Object} - Unified context for consciousMind
   */
  async buildUnifiedContext(userId, nativeData) {
    try {
      const context = {
        timestamp: new Date(),
        userId
      };

      // Add HealthKit context
      if (nativeData.healthKit) {
        const healthContext = await this.syncHealthKit(userId, nativeData.healthKit);
        context.health = {
          recoveryScore: healthContext.recoveryScore,
          recommendations: healthContext.recommendations
        };
      }

      // Add Calendar context
      if (nativeData.calendar) {
        const calendarContext = await this.processCalendarEvents(userId, nativeData.calendar);
        context.calendar = calendarContext.context;
      }

      // Add Location context
      if (nativeData.location) {
        const locationContext = await this.processLocation(userId, nativeData.location);
        context.location = locationContext;
      }

      // Add device context
      if (nativeData.device) {
        context.device = {
          batteryLevel: nativeData.device.batteryLevel,
          isCharging: nativeData.device.isCharging,
          platform: 'iOS',
          model: nativeData.device.model
        };
      }

      return {
        success: true,
        context
      };
    } catch (error) {
      console.error('[iOS Native] Unified context error:', error);
      throw error;
    }
  }
}

module.exports = new iOSNativeFunctions();
