/**
 * LIFE EVENT INJECTOR
 *
 * Injects life events into persona simulations with realistic behavioral cascades.
 * Events cause metric changes that trigger pattern detection.
 */

const { LIFE_PATTERNS } = require('../phoenix/patternDefinitions');

const LIFE_EVENTS = {
  // Relationship events
  breakup: {
    patternId: 'P001',
    probability: { base: 0.12, under_30: 0.18, over_30: 0.08 },
    duration: 21, // days of impact
    effects: {
      hrv: { change: -22, onset: 1, peak: 3, recovery: 14 },
      sleepDuration: { change: -18, onset: 1, peak: 5, recovery: 21 },
      restingHeartRate: { change: +8, onset: 1, peak: 3, recovery: 14 },
      recoveryScore: { change: -20, onset: 2, peak: 5, recovery: 21 },
      activeMinutes: { change: -30, onset: 3, peak: 7, recovery: 21 },
      mood: { change: -35, onset: 0, peak: 3, recovery: 28 }
    }
  },

  new_relationship: {
    patternId: 'P002',
    probability: { base: 0.10, under_30: 0.15, single: 0.20 },
    duration: 14,
    effects: {
      hrv: { change: +10, onset: 3, peak: 7, recovery: 14 },
      mood: { change: +25, onset: 0, peak: 3, recovery: 14 },
      sleepDuration: { change: -10, onset: 2, peak: 7, recovery: 14 },
      routine_change: { change: 25, onset: 0, peak: 14, recovery: 14 }
    }
  },

  // Work events
  job_stress: {
    patternId: 'P004',
    probability: { base: 0.20, working: 0.25 },
    duration: 14,
    effects: {
      hrv: { change: -15, onset: 1, peak: 5, recovery: 10 },
      sleepDuration: { change: -12, onset: 2, peak: 5, recovery: 10 },
      restingHeartRate: { change: +8, onset: 1, peak: 5, recovery: 10 },
      recoveryScore: { change: -18, onset: 2, peak: 7, recovery: 14 },
      stress: { change: +30, onset: 0, peak: 5, recovery: 10 }
    }
  },

  promotion: {
    patternId: 'P006',
    probability: { base: 0.08, working: 0.10 },
    duration: 21,
    effects: {
      stress: { change: +20, onset: 0, peak: 14, recovery: 21 },
      mood: { change: +15, onset: 0, peak: 7, recovery: 21 },
      sleepDuration: { change: -10, onset: 3, peak: 14, recovery: 21 },
      work_hours: { change: +25, onset: 0, peak: 21, recovery: 30 }
    }
  },

  // Health events
  illness: {
    patternId: 'P007',
    probability: { base: 0.15, winter: 0.25 },
    duration: 7,
    effects: {
      restingHeartRate: { change: +12, onset: -1, peak: 2, recovery: 5 }, // Predictive!
      hrv: { change: -28, onset: -1, peak: 2, recovery: 5 },
      recoveryScore: { change: -30, onset: 0, peak: 2, recovery: 7 },
      activeMinutes: { change: -80, onset: 0, peak: 3, recovery: 7 },
      sleepDuration: { change: +15, onset: 0, peak: 3, recovery: 7 }
    }
  },

  burnout: {
    patternId: 'P008',
    probability: { base: 0.05, entrepreneur: 0.15, athlete: 0.12 },
    duration: 30,
    effects: {
      recoveryScore: { change: -35, onset: 7, peak: 21, recovery: 60 },
      hrv: { change: -25, onset: 7, peak: 21, recovery: 60 },
      motivation: { change: -40, onset: 14, peak: 30, recovery: 60 },
      mood: { change: -30, onset: 14, peak: 30, recovery: 60 },
      activeMinutes: { change: -50, onset: 14, peak: 30, recovery: 60 }
    }
  },

  // Fitness events
  injury: {
    patternId: 'P011',
    probability: { base: 0.10, athlete: 0.20 },
    duration: 21,
    effects: {
      activeMinutes: { change: -90, onset: 0, peak: 14, recovery: 21 },
      mood: { change: -20, onset: 2, peak: 7, recovery: 21 },
      sleepQuality: { change: -15, onset: 1, peak: 5, recovery: 14 },
      stress: { change: +20, onset: 1, peak: 5, recovery: 14 }
    }
  },

  pr_achievement: {
    patternId: 'P013',
    probability: { base: 0.08, athlete: 0.15 },
    duration: 7,
    effects: {
      mood: { change: +30, onset: 0, peak: 2, recovery: 7 },
      motivation: { change: +25, onset: 0, peak: 5, recovery: 14 },
      confidence: { change: +20, onset: 0, peak: 7, recovery: 14 }
    }
  },

  // Financial events
  financial_stress: {
    patternId: 'P014',
    probability: { base: 0.12 },
    duration: 14,
    effects: {
      hrv: { change: -15, onset: 0, peak: 3, recovery: 10 },
      sleepQuality: { change: -18, onset: 1, peak: 5, recovery: 10 },
      stress: { change: +30, onset: 0, peak: 5, recovery: 14 },
      mood: { change: -20, onset: 1, peak: 5, recovery: 14 }
    }
  },

  // Routine events
  travel: {
    patternId: 'P017',
    probability: { base: 0.15 },
    duration: 7,
    effects: {
      routine_consistency: { change: -60, onset: 0, peak: 5, recovery: 3 },
      sleepTiming: { change: 3, onset: 0, peak: 5, recovery: 3 },
      sleepDuration: { change: -15, onset: 0, peak: 5, recovery: 5 },
      recoveryScore: { change: -15, onset: 1, peak: 5, recovery: 7 }
    }
  },

  moving: {
    patternId: 'P003',
    probability: { base: 0.08, under_30: 0.15 },
    duration: 30,
    effects: {
      routine_consistency: { change: -50, onset: 0, peak: 14, recovery: 30 },
      stress: { change: +25, onset: 0, peak: 7, recovery: 21 },
      sleepQuality: { change: -20, onset: 0, peak: 14, recovery: 30 },
      location_change: { change: 100, onset: 0, peak: 1, recovery: 1 }
    }
  }
};

class LifeEventInjector {
  /**
   * Generate life events for a persona's 90-day journey
   */
  generateLifeEventsForPersona(persona, days = 90) {
    const events = [];
    const numEvents = Math.floor(Math.random() * 5) + 3; // 3-8 events

    // Select appropriate events for this persona
    const candidateEvents = this.getAgeAppropriateEvents(persona);

    for (let i = 0; i < numEvents; i++) {
      // Pick random event
      const eventType = candidateEvents[Math.floor(Math.random() * candidateEvents.length)];
      const eventConfig = LIFE_EVENTS[eventType];

      // Random day within the 90-day period
      const dayOfEvent = Math.floor(Math.random() * (days - 30)) + 15; // Not too early or late

      events.push({
        type: eventType,
        patternId: eventConfig.patternId,
        day: dayOfEvent,
        duration: eventConfig.duration,
        effects: eventConfig.effects,
        description: this.generateEventDescription(eventType, persona)
      });
    }

    // Sort by day
    events.sort((a, b) => a.day - b.day);

    // Store expected patterns in persona metadata
    persona.simulationMetadata.expectedPatterns = events.map(e => ({
      patternId: e.patternId,
      expectedDetectionDay: [e.day + 1, e.day + 5],
      eventDay: e.day
    }));

    return events;
  }

  /**
   * Get events appropriate for persona's age/conditions
   */
  getAgeAppropriateEvents(persona) {
    const eligible = [];

    for (const [eventType, config] of Object.entries(LIFE_EVENTS)) {
      let include = true;
      let probability = config.probability.base;

      // Age adjustments
      if (config.probability.under_30 && persona.age < 30) {
        probability = config.probability.under_30;
      }
      if (config.probability.over_30 && persona.age >= 30) {
        probability = config.probability.over_30;
      }

      // Condition adjustments
      if (config.probability.athlete && persona.conditions.includes('athlete')) {
        probability = config.probability.athlete;
      }
      if (config.probability.entrepreneur && persona.conditions.includes('entrepreneur')) {
        probability = config.probability.entrepreneur;
      }
      if (config.probability.single && persona.conditions.includes('single')) {
        probability = config.probability.single;
      }
      if (config.probability.working && !persona.conditions.includes('retired') && !persona.conditions.includes('student')) {
        probability = config.probability.working;
      }

      // Exclusions
      if (eventType === 'promotion' && (persona.conditions.includes('retired') || persona.conditions.includes('student'))) {
        include = false;
      }
      if (eventType === 'injury' && !persona.conditions.includes('athlete') && Math.random() > 0.3) {
        include = false;
      }

      if (include && Math.random() < probability) {
        eligible.push(eventType);
      }
    }

    // Ensure at least 2 events
    if (eligible.length < 2) {
      eligible.push('job_stress', 'travel');
    }

    return eligible;
  }

  /**
   * Apply event effects to a day's metrics
   */
  applyEventEffects(baselineMetrics, activeEvents, daysSinceStart) {
    let metrics = { ...baselineMetrics };

    for (const event of activeEvents) {
      const daysSinceEvent = daysSinceStart - event.day;

      for (const [metric, effectConfig] of Object.entries(event.effects)) {
        if (!effectConfig) continue;

        // Calculate current effect magnitude based on effect curve
        const magnitude = this.calculateEffectMagnitude(
          effectConfig,
          daysSinceEvent,
          event.duration
        );

        // Apply effect
        if (metrics[metric] !== undefined) {
          if (metric.includes('Duration') || metric.includes('sleepTiming')) {
            // Absolute changes for durations
            metrics[metric] = baselineMetrics[metric] + (magnitude / 60); // Convert to hours
          } else {
            // Percentage changes for others
            metrics[metric] = baselineMetrics[metric] * (1 + magnitude / 100);
          }
        } else {
          // New metric (like mood, stress)
          metrics[metric] = baselineMetrics[metric] || 50 + magnitude;
        }
      }
    }

    return metrics;
  }

  /**
   * Calculate effect magnitude at a specific time point
   */
  calculateEffectMagnitude(effectConfig, daysSinceEvent, totalDuration) {
    const { change, onset, peak, recovery } = effectConfig;

    // Before onset (predictive indicators)
    if (daysSinceEvent < onset) {
      const progress = daysSinceEvent / (onset || 1);
      return change * 0.3 * progress; // Ramp up to 30% before event
    }

    // Onset to peak
    if (daysSinceEvent < peak) {
      const progress = (daysSinceEvent - onset) / (peak - onset);
      return change * progress;
    }

    // Peak to recovery
    if (daysSinceEvent < recovery) {
      const progress = (daysSinceEvent - peak) / (recovery - peak);
      return change * (1 - progress);
    }

    // After recovery
    return 0;
  }

  /**
   * Generate human-readable event description
   */
  generateEventDescription(eventType, persona) {
    const descriptions = {
      breakup: `Ended relationship`,
      new_relationship: `Started new relationship`,
      job_stress: `High-pressure work period`,
      promotion: `Promoted to new role`,
      illness: `Caught cold/flu`,
      burnout: `Experiencing burnout`,
      injury: `Training injury (${persona.conditions.includes('athlete') ? 'sports' : 'minor'})`,
      pr_achievement: `Hit personal record`,
      financial_stress: `Unexpected expense`,
      travel: `Business/vacation travel`,
      moving: `Relocated to new city`
    };

    return descriptions[eventType] || eventType;
  }

  /**
   * Get active events for a specific day
   */
  getActiveEvents(allEvents, currentDay) {
    return allEvents.filter(event => {
      const daysSinceEvent = currentDay - event.day;
      return daysSinceEvent >= event.effects[Object.keys(event.effects)[0]].onset &&
             daysSinceEvent <= event.duration;
    });
  }
}

module.exports = new LifeEventInjector();
