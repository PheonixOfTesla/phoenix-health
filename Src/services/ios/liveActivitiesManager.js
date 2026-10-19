/**
 * LIVE ACTIVITIES MANAGER
 *
 * This powers the Dynamic Island and Lock Screen widgets.
 *
 * Features:
 * - Real-time intervention display
 * - Workout tracking in Dynamic Island
 * - Recovery score on lock screen
 * - Interactive buttons
 * - Progress indicators
 * - Haptic feedback triggers
 *
 * Use cases:
 * - Workout in progress (heart rate, sets remaining)
 * - Intervention alerts (with actions)
 * - Recovery tracking (updating throughout day)
 * - Goal progress (streak counters)
 * - Meditation timer (breathing guide)
 *
 * This makes Phoenix feel PRESENT even when app is closed.
 */

class LiveActivitiesManager {
  constructor() {
    this.activeActivities = new Map(); // userId -> activities
    this.cleanupInterval = null; // Track interval for cleanup
    this.activityTypes = {
      WORKOUT: 'workout',
      INTERVENTION: 'intervention',
      RECOVERY: 'recovery',
      MEDITATION: 'meditation',
      GOAL_PROGRESS: 'goal_progress',
      CUSTOM: 'custom'
    };
  }

  /**
   * START WORKOUT ACTIVITY
   *
   * Shows in Dynamic Island:
   * - Workout name
   * - Current exercise
   * - Heart rate (live from HealthKit)
   * - Sets remaining
   * - Elapsed time
   */
  async startWorkoutActivity(userId, workout) {
    const activityId = `workout_${workout._id}`;

    const activity = {
      id: activityId,
      type: this.activityTypes.WORKOUT,
      userId,

      // Activity content
      content: {
        dynamicIsland: {
          // Minimal view (when collapsed)
          minimal: {
            leading: {
              type: 'icon',
              icon: '💪',
              color: '#FF6B6B'
            },
            trailing: {
              type: 'text',
              text: '{heartRate} BPM'
            }
          },

          // Compact view
          compact: {
            leading: {
              type: 'icon',
              icon: '💪'
            },
            trailing: {
              type: 'stack',
              items: [
                { type: 'text', text: '{heartRate} BPM', font: 'caption' },
                { type: 'text', text: '{setsRemaining} sets', font: 'caption2' }
              ]
            }
          },

          // Expanded view
          expanded: {
            header: {
              title: workout.name,
              subtitle: '{currentExercise}'
            },
            content: {
              type: 'stats',
              stats: [
                {
                  label: 'Heart Rate',
                  value: '{heartRate}',
                  unit: 'BPM',
                  icon: '❤️'
                },
                {
                  label: 'Sets Remaining',
                  value: '{setsRemaining}',
                  icon: '🔢'
                },
                {
                  label: 'Time',
                  value: '{elapsed}',
                  icon: '⏱️'
                }
              ]
            },
            actions: [
              {
                id: 'complete_set',
                label: 'Complete Set',
                style: 'primary'
              },
              {
                id: 'skip_exercise',
                label: 'Skip',
                style: 'secondary'
              },
              {
                id: 'end_workout',
                label: 'End Workout',
                style: 'destructive'
              }
            ]
          }
        },

        // Lock screen widget
        lockScreen: {
          type: 'progress',
          title: workout.name,
          subtitle: '{currentExercise}',
          progress: {
            current: '{completedSets}',
            total: '{totalSets}',
            percentage: true
          },
          footer: '{heartRate} BPM • {elapsed}'
        }
      },

      // Live data
      data: {
        workoutId: workout._id,
        workoutName: workout.name,
        currentExercise: workout.exercises[0]?.name || 'Starting...',
        heartRate: 0,
        setsRemaining: workout.exercises.reduce((sum, e) => sum + e.sets, 0),
        completedSets: 0,
        totalSets: workout.exercises.reduce((sum, e) => sum + e.sets, 0),
        elapsed: '0:00'
      },

      // Update frequency
      updateFrequency: 1000, // 1 second (for timer)

      // Start time
      startTime: Date.now()
    };

    // Store activity
    if (!this.activeActivities.has(userId)) {
      this.activeActivities.set(userId, []);
    }
    this.activeActivities.get(userId).push(activity);

    

    return {
      success: true,
      activityId,
      activity
    };
  }

  /**
   * UPDATE WORKOUT ACTIVITY
   *
   * Called when:
   * - Heart rate changes (from HealthKit stream)
   * - User completes a set
   * - User moves to next exercise
   */
  async updateWorkoutActivity(userId, activityId, updates) {
    const activity = this.findActivity(userId, activityId);
    if (!activity) throw new Error('Activity not found');

    // Update data
    Object.assign(activity.data, updates);

    // Calculate elapsed time
    const elapsed = Date.now() - activity.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    activity.data.elapsed = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Send update to iOS
    await this.pushUpdate(userId, activity);

    return {
      success: true,
      activity
    };
  }

  /**
   * START INTERVENTION ACTIVITY
   *
   * Shows in Dynamic Island when AI detects something important
   *
   * Example:
   * "Your recovery is low (45%) and you have 3 meetings today.
   *  Consider rescheduling your workout to tomorrow."
   */
  async startInterventionActivity(userId, intervention) {
    const activityId = `intervention_${intervention._id}`;

    const activity = {
      id: activityId,
      type: this.activityTypes.INTERVENTION,
      userId,

      content: {
        dynamicIsland: {
          minimal: {
            leading: {
              type: 'icon',
              icon: this.getInterventionIcon(intervention.priority),
              color: this.getInterventionColor(intervention.priority)
            },
            trailing: {
              type: 'text',
              text: 'Alert'
            }
          },

          compact: {
            leading: {
              type: 'icon',
              icon: this.getInterventionIcon(intervention.priority)
            },
            trailing: {
              type: 'text',
              text: intervention.type.replace(/_/g, ' '),
              font: 'caption'
            }
          },

          expanded: {
            header: {
              title: this.getInterventionTitle(intervention.type),
              subtitle: intervention.priority.toUpperCase()
            },
            content: {
              type: 'text',
              text: intervention.message,
              maxLines: 4
            },
            actions: intervention.actions || [
              {
                id: 'accept',
                label: 'Got it',
                style: 'primary'
              },
              {
                id: 'dismiss',
                label: 'Dismiss',
                style: 'secondary'
              }
            ]
          }
        },

        lockScreen: {
          type: 'alert',
          icon: this.getInterventionIcon(intervention.priority),
          title: this.getInterventionTitle(intervention.type),
          message: intervention.message,
          actions: [
            { id: 'accept', label: 'Accept' },
            { id: 'dismiss', label: 'Later' }
          ]
        },

        // Trigger haptic feedback
        haptic: this.getHapticForPriority(intervention.priority)
      },

      data: {
        interventionId: intervention._id,
        type: intervention.type,
        priority: intervention.priority,
        message: intervention.message
      },

      startTime: Date.now()
    };

    // Store activity
    if (!this.activeActivities.has(userId)) {
      this.activeActivities.set(userId, []);
    }
    this.activeActivities.get(userId).push(activity);

    // Send to iOS immediately
    await this.pushUpdate(userId, activity);

    

    return {
      success: true,
      activityId,
      activity
    };
  }

  /**
   * START RECOVERY ACTIVITY
   *
   * Shows recovery score that updates throughout the day
   */
  async startRecoveryActivity(userId, recoveryData) {
    const activityId = `recovery_${Date.now()}`;

    const activity = {
      id: activityId,
      type: this.activityTypes.RECOVERY,
      userId,

      content: {
        dynamicIsland: {
          minimal: {
            leading: {
              type: 'icon',
              icon: '⚡',
              color: this.getRecoveryColor(recoveryData.score)
            },
            trailing: {
              type: 'text',
              text: `${recoveryData.score}%`
            }
          },

          compact: {
            leading: {
              type: 'icon',
              icon: '⚡'
            },
            trailing: {
              type: 'stack',
              items: [
                { type: 'text', text: `${recoveryData.score}%`, font: 'body' },
                { type: 'text', text: 'Recovery', font: 'caption' }
              ]
            }
          },

          expanded: {
            header: {
              title: 'Recovery Score',
              subtitle: this.getRecoveryStatus(recoveryData.score)
            },
            content: {
              type: 'gauge',
              value: recoveryData.score,
              max: 100,
              color: this.getRecoveryColor(recoveryData.score),
              segments: [
                { threshold: 50, color: '#FF6B6B', label: 'Low' },
                { threshold: 70, color: '#FFA500', label: 'Moderate' },
                { threshold: 85, color: '#4CAF50', label: 'Good' },
                { threshold: 100, color: '#00C853', label: 'Excellent' }
              ]
            },
            footer: {
              items: [
                { label: 'HRV', value: `${recoveryData.hrv}ms` },
                { label: 'Sleep', value: `${recoveryData.sleep}h` },
                { label: 'Resting HR', value: `${recoveryData.restingHR} BPM` }
              ]
            }
          }
        },

        lockScreen: {
          type: 'gauge',
          title: 'Recovery',
          value: recoveryData.score,
          max: 100,
          subtitle: this.getRecoveryStatus(recoveryData.score)
        }
      },

      data: {
        score: recoveryData.score,
        hrv: recoveryData.hrv,
        sleep: recoveryData.sleep,
        restingHR: recoveryData.restingHR
      },

      updateFrequency: 300000, // 5 minutes

      startTime: Date.now()
    };

    // Store activity
    if (!this.activeActivities.has(userId)) {
      this.activeActivities.set(userId, []);
    }
    this.activeActivities.get(userId).push(activity);

    await this.pushUpdate(userId, activity);

    

    return {
      success: true,
      activityId,
      activity
    };
  }

  /**
   * START MEDITATION ACTIVITY
   *
   * Breathing guide in Dynamic Island
   */
  async startMeditationActivity(userId, duration) {
    const activityId = `meditation_${Date.now()}`;

    const activity = {
      id: activityId,
      type: this.activityTypes.MEDITATION,
      userId,

      content: {
        dynamicIsland: {
          minimal: {
            leading: {
              type: 'icon',
              icon: '🧘',
              color: '#9C27B0'
            },
            trailing: {
              type: 'text',
              text: '{timeRemaining}'
            }
          },

          compact: {
            leading: {
              type: 'breathing_animation',
              duration: 10 // 10 second breath cycle
            },
            trailing: {
              type: 'text',
              text: '{timeRemaining}',
              font: 'caption'
            }
          },

          expanded: {
            header: {
              title: 'Meditation',
              subtitle: '{breathPhase}'
            },
            content: {
              type: 'breathing_circle',
              inhaleDuration: 4,
              hold: 2,
              exhaleDuration: 6,
              cycles: '{cycles}'
            },
            footer: {
              text: '{timeRemaining} remaining'
            }
          }
        },

        lockScreen: {
          type: 'timer',
          title: 'Meditation',
          subtitle: '{breathPhase}',
          remaining: '{timeRemaining}'
        },

        // Haptic breathing guide
        hapticPattern: {
          enabled: true,
          pattern: 'breathing',
          inhaleHaptic: 'soft',
          exhaleHaptic: 'soft'
        }
      },

      data: {
        duration,
        timeRemaining: this.formatTime(duration),
        breathPhase: 'Inhale',
        cycles: 0
      },

      updateFrequency: 1000, // 1 second

      startTime: Date.now()
    };

    // Store activity
    if (!this.activeActivities.has(userId)) {
      this.activeActivities.set(userId, []);
    }
    this.activeActivities.get(userId).push(activity);

    await this.pushUpdate(userId, activity);

    

    return {
      success: true,
      activityId,
      activity
    };
  }

  /**
   * END ACTIVITY
   */
  async endActivity(userId, activityId) {
    const userActivities = this.activeActivities.get(userId);
    if (!userActivities) return { success: false, error: 'No active activities' };

    const index = userActivities.findIndex(a => a.id === activityId);
    if (index === -1) return { success: false, error: 'Activity not found' };

    const activity = userActivities[index];

    // Remove from active list
    userActivities.splice(index, 1);

    // Send end signal to iOS
    await this.pushEnd(userId, activityId);

    

    return {
      success: true,
      duration: Date.now() - activity.startTime
    };
  }

  /**
   * PUSH UPDATE TO IOS
   */
  async pushUpdate(userId, activity) {
    // Send through consciousness stream
    const stream = require('../consciousness/realtimeConsciousnessStream');

    if (stream.isUserConnected && stream.isUserConnected(userId)) {
      stream.sendToUser(userId, {
        type: 'LIVE_ACTIVITY_UPDATE',
        activity,
        timestamp: Date.now()
      });
    }

    // Also store in Redis for iOS to poll if needed
    const redis = require('ioredis');
    const client = new redis(process.env.REDIS_URL);
    await client.setex(
      `live_activity:${userId}:${activity.id}`,
      300, // 5 minutes TTL
      JSON.stringify(activity)
    );
  }

  async pushEnd(userId, activityId) {
    const stream = require('../consciousness/realtimeConsciousnessStream');

    if (stream.isUserConnected && stream.isUserConnected(userId)) {
      stream.sendToUser(userId, {
        type: 'LIVE_ACTIVITY_END',
        activityId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * HELPER METHODS
   */

  findActivity(userId, activityId) {
    const activities = this.activeActivities.get(userId);
    if (!activities) return null;
    return activities.find(a => a.id === activityId);
  }

  getInterventionIcon(priority) {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '💡';
      default: return 'ℹ️';
    }
  }

  getInterventionColor(priority) {
    switch (priority) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA500';
      default: return '#4A90E2';
    }
  }

  getInterventionTitle(type) {
    const titles = {
      rest_recommendation: 'Rest Recommended',
      workout_motivation: 'Workout Reminder',
      recovery_alert: 'Recovery Alert',
      schedule_optimization: 'Schedule Suggestion',
      nutrition_reminder: 'Nutrition Reminder',
      sleep_reminder: 'Sleep Time',
      hydration_reminder: 'Drink Water',
      stress_alert: 'High Stress Detected'
    };

    return titles[type] || 'Phoenix Alert';
  }

  getHapticForPriority(priority) {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'success';
      default: return 'light';
    }
  }

  getRecoveryColor(score) {
    if (score >= 85) return '#00C853';
    if (score >= 70) return '#4CAF50';
    if (score >= 50) return '#FFA500';
    return '#FF6B6B';
  }

  getRecoveryStatus(score) {
    if (score >= 85) return 'Excellent - Ready for anything';
    if (score >= 70) return 'Good - Ready for training';
    if (score >= 50) return 'Moderate - Light activity ok';
    return 'Low - Prioritize rest';
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * GET ALL ACTIVE ACTIVITIES FOR USER
   */
  getActiveActivities(userId) {
    return this.activeActivities.get(userId) || [];
  }

  /**
   * CLEANUP - Remove stale activities
   */
  cleanup() {
    for (const [userId, activities] of this.activeActivities.entries()) {
      const now = Date.now();

      const filtered = activities.filter(activity => {
        const age = now - activity.startTime;

        // Remove activities older than 24 hours
        if (age > 24 * 60 * 60 * 1000) {
          
          return false;
        }

        return true;
      });

      this.activeActivities.set(userId, filtered);
    }
  }

  /**
   * START CLEANUP INTERVAL
   */
  startCleanupInterval() {
    // Clear any existing interval first
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * STOP CLEANUP INTERVAL
   * Call this when shutting down or no longer needed
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

module.exports = new LiveActivitiesManager();
