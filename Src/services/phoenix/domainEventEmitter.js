/**
 * ==================================================================
 * PHOENIX DOMAIN EVENT EMITTER
 * ==================================================================
 *
 * The Nervous System - Real-time event broadcasting across all domains
 *
 * Purpose: Connect the organs (8 planets) to the brain (Intelligence Loop)
 * When ANY domain gets new data → Intelligence Loop processes immediately
 *
 * This is what makes Phoenix REACTIVE instead of just polling.
 * ==================================================================
 */

const EventEmitter = require('events');

class PhoenixDomainEventEmitter extends EventEmitter {
  constructor() {
    super();

    // Track event statistics for monitoring
    this.stats = {
      mercury: 0,  // Biometrics, Sleep, Recovery
      venus: 0,    // Workouts, Nutrition, Body measurements
      earth: 0,    // Calendar, Time management
      mars: 0,     // Goals, Habits, Progress
      jupiter: 0,  // Finance, Transactions, Budgets
      saturn: 0,   // Reflections, Wisdom, Relationships
      uranus: 0,   // Innovation, Learning, Skills
      neptune: 0   // Mindfulness, Meditation, Spiritual
    };

    
  }

  /**
   * EMIT DOMAIN EVENT
   * Called by controllers after saving data
   *
   * @param {String} planet - Domain name (mercury, venus, etc.)
   * @param {String} eventType - Type of change (biometric_update, workout_logged, etc.)
   * @param {String} userId - User ID who owns this data
   * @param {Object} data - The actual data that changed
   */
  emitDomainEvent(planet, eventType, userId, data = {}) {
    if (!planet || !eventType || !userId) {
      console.error('[Domain Events] ❌ Missing required parameters:', { planet, eventType, userId });
      return;
    }

    // Increment stats
    if (this.stats[planet] !== undefined) {
      this.stats[planet]++;
    }

    const event = {
      planet,
      eventType,
      userId: userId.toString(),
      data,
      timestamp: new Date(),
      eventId: `${planet}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Emit the event
    this.emit('domain:change', event);
    this.emit(`${planet}:change`, event);
    this.emit(`${planet}:${eventType}`, event);

    
  }

  /**
   * MERCURY EVENTS - Health & Biometrics
   */
  emitBiometricUpdate(userId, biometricData) {
    this.emitDomainEvent('mercury', 'biometric_update', userId, {
      hrv: biometricData.hrv,
      restingHR: biometricData.restingHR,
      recoveryScore: biometricData.recoveryScore,
      timestamp: biometricData.timestamp
    });
  }

  emitSleepLogged(userId, sleepData) {
    this.emitDomainEvent('mercury', 'sleep_logged', userId, {
      duration: sleepData.duration,
      quality: sleepData.quality,
      deepSleep: sleepData.deepSleep,
      remSleep: sleepData.remSleep,
      date: sleepData.date
    });
  }

  emitRecoveryCalculated(userId, recoveryScore) {
    this.emitDomainEvent('mercury', 'recovery_calculated', userId, {
      score: recoveryScore.score,
      recommendation: recoveryScore.recommendation
    });
  }

  emitWearableConnected(userId, provider) {
    this.emitDomainEvent('mercury', 'wearable_connected', userId, { provider });
  }

  /**
   * VENUS EVENTS - Fitness & Nutrition
   */
  emitWorkoutLogged(userId, workoutData) {
    this.emitDomainEvent('venus', 'workout_logged', userId, {
      type: workoutData.type,
      duration: workoutData.duration,
      intensity: workoutData.intensity,
      volume: workoutData.totalVolume,
      date: workoutData.date
    });
  }

  emitMealLogged(userId, mealData) {
    this.emitDomainEvent('venus', 'meal_logged', userId, {
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fats: mealData.fats,
      mealType: mealData.mealType,
      timestamp: mealData.timestamp
    });
  }

  emitBodyMeasurement(userId, measurement) {
    this.emitDomainEvent('venus', 'body_measurement', userId, {
      weight: measurement.weight,
      bodyFat: measurement.bodyFat,
      measurements: measurement.measurements
    });
  }

  /**
   * EARTH EVENTS - Calendar & Time
   */
  emitEventCreated(userId, eventData) {
    this.emitDomainEvent('earth', 'event_created', userId, {
      title: eventData.title,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      type: eventData.type
    });
  }

  emitEventCompleted(userId, eventData) {
    this.emitDomainEvent('earth', 'event_completed', userId, {
      eventId: eventData.id,
      duration: eventData.duration,
      productivityScore: eventData.productivityScore
    });
  }

  /**
   * MARS EVENTS - Goals & Habits
   */
  emitGoalCreated(userId, goalData) {
    this.emitDomainEvent('mars', 'goal_created', userId, {
      title: goalData.title,
      category: goalData.category,
      targetDate: goalData.targetDate,
      priority: goalData.priority
    });
  }

  emitProgressLogged(userId, progressData) {
    this.emitDomainEvent('mars', 'progress_logged', userId, {
      goalId: progressData.goalId,
      value: progressData.value,
      percentComplete: progressData.percentComplete
    });
  }

  emitGoalCompleted(userId, goalData) {
    this.emitDomainEvent('mars', 'goal_completed', userId, {
      goalId: goalData.id,
      title: goalData.title,
      completionTime: goalData.completedAt
    });
  }

  emitHabitLogged(userId, habitData) {
    this.emitDomainEvent('mars', 'habit_logged', userId, {
      habitId: habitData.habitId,
      completed: habitData.completed,
      streak: habitData.streak
    });
  }

  /**
   * JUPITER EVENTS - Finance
   */
  emitTransactionDetected(userId, transactionData) {
    this.emitDomainEvent('jupiter', 'transaction_detected', userId, {
      amount: transactionData.amount,
      category: transactionData.category,
      merchant: transactionData.merchant,
      date: transactionData.date
    });
  }

  emitBudgetAlert(userId, budgetData) {
    this.emitDomainEvent('jupiter', 'budget_alert', userId, {
      category: budgetData.category,
      percentSpent: budgetData.percentSpent,
      overBudget: budgetData.overBudget
    });
  }

  /**
   * SATURN EVENTS - Reflection & Wisdom
   */
  emitReflectionLogged(userId, reflectionData) {
    this.emitDomainEvent('saturn', 'reflection_logged', userId, {
      type: reflectionData.type,
      mood: reflectionData.mood,
      insights: reflectionData.insights
    });
  }

  emitRelationshipUpdate(userId, relationshipData) {
    this.emitDomainEvent('saturn', 'relationship_update', userId, {
      status: relationshipData.status,
      quality: relationshipData.quality
    });
  }

  /**
   * URANUS EVENTS - Learning & Innovation
   */
  emitSkillProgress(userId, skillData) {
    this.emitDomainEvent('uranus', 'skill_progress', userId, {
      skillId: skillData.skillId,
      level: skillData.level,
      progress: skillData.progress
    });
  }

  /**
   * NEPTUNE EVENTS - Mindfulness & Meditation
   */
  emitMeditationLogged(userId, meditationData) {
    this.emitDomainEvent('neptune', 'meditation_logged', userId, {
      duration: meditationData.duration,
      type: meditationData.type,
      quality: meditationData.quality
    });
  }

  /**
   * GET STATISTICS
   */
  getStats() {
    const total = Object.values(this.stats).reduce((sum, count) => sum + count, 0);
    return {
      ...this.stats,
      total,
      mostActive: Object.entries(this.stats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([planet, count]) => ({ planet, count }))
    };
  }

  /**
   * RESET STATISTICS
   */
  resetStats() {
    Object.keys(this.stats).forEach(key => {
      this.stats[key] = 0;
    });
    
  }
}

// Export singleton instance
const domainEvents = new PhoenixDomainEventEmitter();

// Set max listeners to prevent warnings (Intelligence Loop + other subscribers)
domainEvents.setMaxListeners(20);

module.exports = domainEvents;
