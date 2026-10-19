/**
 * PROACTIVE ENGINE
 * Enables Phoenix to proactively reach out to users based on:
 * - Time-based triggers (morning briefing, end of day)
 * - Event-based triggers (calendar reminders, budget alerts)
 * - Pattern-based triggers (lunch ordering, workout time)
 * - Context-based triggers (user behavior, screen context)
 */

const EventEmitter = require('events');

class ProactiveEngine extends EventEmitter {
    constructor() {
        super();
        this.subscribers = new Map();      // userId -> { callback, screenContext }
        this.userPatterns = new Map();     // userId -> { patterns }
        this.activeChecks = new Map();     // userId -> intervalId
        this.triggerHistory = new Map();   // userId -> [recentTriggers]

        // Configuration
        this.config = {
            checkInterval: 60000,           // Check every minute
            cooldownPeriod: 300000,         // 5 min cooldown between similar triggers
            maxTriggersPerHour: 5,          // Don't overwhelm user
            enabled: true
        };

        console.log('[ProactiveEngine] Initialized');
    }

    /**
     * Subscribe a user to proactive events
     */
    subscribe(userId, callback, screenContext = null) {
        if (!userId) return;

        this.subscribers.set(userId.toString(), {
            callback,
            screenContext,
            subscribedAt: Date.now()
        });

        // Start checking for this user
        this.startProactiveChecks(userId);

        console.log(`[ProactiveEngine] User ${userId} subscribed`);
    }

    /**
     * Unsubscribe a user
     */
    unsubscribe(userId) {
        if (!userId) return;

        const id = userId.toString();
        this.subscribers.delete(id);

        // Stop checks
        if (this.activeChecks.has(id)) {
            clearInterval(this.activeChecks.get(id));
            this.activeChecks.delete(id);
        }

        console.log(`[ProactiveEngine] User ${userId} unsubscribed`);
    }

    /**
     * Update user's screen context
     */
    updateScreenContext(userId, screenContext) {
        const subscriber = this.subscribers.get(userId.toString());
        if (subscriber) {
            subscriber.screenContext = screenContext;
        }
    }

    /**
     * Start proactive checks for a user
     */
    startProactiveChecks(userId) {
        const id = userId.toString();

        // Don't duplicate
        if (this.activeChecks.has(id)) return;

        const intervalId = setInterval(() => {
            this.checkProactiveTriggers(id);
        }, this.config.checkInterval);

        this.activeChecks.set(id, intervalId);

        // Run initial check
        setTimeout(() => this.checkProactiveTriggers(id), 5000);
    }

    /**
     * Check for proactive triggers
     */
    async checkProactiveTriggers(userId) {
        if (!this.config.enabled) return;

        const subscriber = this.subscribers.get(userId);
        if (!subscriber) return;

        try {
            const triggers = await this.evaluateTriggers(userId, subscriber.screenContext);

            if (triggers.length > 0) {
                // Check rate limits
                if (!this.isWithinRateLimit(userId)) {
                    console.log(`[ProactiveEngine] Rate limit reached for ${userId}`);
                    return;
                }

                // Check cooldown
                const trigger = triggers[0]; // Take highest priority
                if (this.isOnCooldown(userId, trigger.type)) {
                    console.log(`[ProactiveEngine] Trigger ${trigger.type} on cooldown for ${userId}`);
                    return;
                }

                // Fire the trigger
                this.fireTrigger(userId, trigger);
            }
        } catch (error) {
            console.error(`[ProactiveEngine] Error checking triggers for ${userId}:`, error);
        }
    }

    /**
     * Evaluate all triggers for a user
     */
    async evaluateTriggers(userId, screenContext) {
        const triggers = [];
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const dayOfWeek = now.getDay();

        // ===== TIME-BASED TRIGGERS =====

        // Morning briefing (7-8 AM, not on weekends)
        if (hour === 7 && minute < 5 && dayOfWeek > 0 && dayOfWeek < 6) {
            triggers.push({
                type: 'morning_briefing',
                priority: 'medium',
                message: "Good morning! Want me to brief you on today's schedule and priorities?",
                suggestedAction: {
                    type: 'butler_action',
                    butlerAction: 'daily_briefing',
                    label: 'Get briefing'
                }
            });
        }

        // Lunch time reminder (11:45 AM - 12:00 PM on weekdays)
        if (hour === 11 && minute >= 45 && dayOfWeek > 0 && dayOfWeek < 6) {
            triggers.push({
                type: 'lunch_reminder',
                priority: 'low',
                message: "It's almost lunchtime. Want me to order from your usual spot?",
                suggestedAction: {
                    type: 'butler_action',
                    butlerAction: 'order_food',
                    label: 'Order lunch'
                }
            });
        }

        // End of day summary (5-6 PM on weekdays)
        if (hour === 17 && minute < 5 && dayOfWeek > 0 && dayOfWeek < 6) {
            triggers.push({
                type: 'end_of_day',
                priority: 'low',
                message: "Wrapping up the day? I can summarize what you accomplished and prep tomorrow.",
                suggestedAction: {
                    type: 'butler_action',
                    butlerAction: 'daily_summary',
                    label: 'Get summary'
                }
            });
        }

        // ===== CONTEXT-BASED TRIGGERS =====

        if (screenContext) {
            // User on goals page but hasn't set one today
            if (screenContext.url?.includes('goals') || screenContext.activePlanet === 'mars') {
                // Could check if user has set goals today
                triggers.push({
                    type: 'goal_reminder',
                    priority: 'low',
                    message: "I see you're looking at goals. Want help setting a new one or reviewing progress?",
                    suggestedAction: {
                        type: 'open_modal',
                        modalId: 'goal-create-modal',
                        label: 'Create goal'
                    }
                });
            }

            // User in Genesis mode for a while
            if (screenContext.mode === 'GENESIS') {
                triggers.push({
                    type: 'genesis_help',
                    priority: 'low',
                    message: "Need help with your project? I can generate code, create documents, or analyze files.",
                    suggestedAction: null
                });
            }

            // User viewing health with low recovery
            if (screenContext.activePlanet === 'mercury') {
                // Could check actual recovery score
                triggers.push({
                    type: 'health_insight',
                    priority: 'low',
                    message: "I notice you're checking health metrics. Want me to analyze your recovery trends?",
                    suggestedAction: {
                        type: 'butler_action',
                        butlerAction: 'health_analysis',
                        label: 'Analyze health'
                    }
                });
            }
        }

        // ===== PATTERN-BASED TRIGGERS (would use ML/historical data) =====

        // Check user patterns
        const patterns = this.userPatterns.get(userId);
        if (patterns) {
            // Example: User usually orders coffee at 9 AM
            if (patterns.coffeeTime && this.isNear(hour, minute, patterns.coffeeTime, 15)) {
                triggers.push({
                    type: 'coffee_pattern',
                    priority: 'low',
                    message: `Time for your usual coffee? I can order from ${patterns.coffeeSpot || 'Starbucks'}.`,
                    suggestedAction: {
                        type: 'butler_action',
                        butlerAction: 'order_coffee',
                        label: 'Order coffee'
                    }
                });
            }

            // User usually works out at specific time
            if (patterns.workoutTime && this.isNear(hour, minute, patterns.workoutTime, 30)) {
                triggers.push({
                    type: 'workout_reminder',
                    priority: 'low',
                    message: "Ready for your workout? I can log it when you're done.",
                    suggestedAction: {
                        type: 'navigate',
                        url: '#venus',
                        label: 'Start workout'
                    }
                });
            }
        }

        // Sort by priority
        return triggers.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    /**
     * Fire a trigger to the user
     */
    fireTrigger(userId, trigger) {
        const subscriber = this.subscribers.get(userId.toString());
        if (!subscriber?.callback) return;

        // Record trigger
        this.recordTrigger(userId, trigger);

        // Send to subscriber
        try {
            subscriber.callback({
                type: 'proactive',
                ...trigger,
                timestamp: Date.now()
            });
            console.log(`[ProactiveEngine] Fired trigger ${trigger.type} for ${userId}`);
        } catch (error) {
            console.error(`[ProactiveEngine] Error firing trigger:`, error);
        }
    }

    /**
     * Record trigger for rate limiting and cooldown
     */
    recordTrigger(userId, trigger) {
        const id = userId.toString();
        const now = Date.now();

        if (!this.triggerHistory.has(id)) {
            this.triggerHistory.set(id, []);
        }

        const history = this.triggerHistory.get(id);
        history.push({
            type: trigger.type,
            timestamp: now
        });

        // Keep only last hour
        const oneHourAgo = now - 3600000;
        this.triggerHistory.set(id, history.filter(t => t.timestamp > oneHourAgo));
    }

    /**
     * Check if user is within rate limit
     */
    isWithinRateLimit(userId) {
        const history = this.triggerHistory.get(userId.toString()) || [];
        const oneHourAgo = Date.now() - 3600000;
        const recentTriggers = history.filter(t => t.timestamp > oneHourAgo);
        return recentTriggers.length < this.config.maxTriggersPerHour;
    }

    /**
     * Check if trigger type is on cooldown
     */
    isOnCooldown(userId, triggerType) {
        const history = this.triggerHistory.get(userId.toString()) || [];
        const cooldownStart = Date.now() - this.config.cooldownPeriod;

        return history.some(t =>
            t.type === triggerType && t.timestamp > cooldownStart
        );
    }

    /**
     * Check if time is near target
     */
    isNear(hour, minute, target, toleranceMinutes) {
        const [targetHour, targetMinute] = target.split(':').map(Number);
        const currentMinutes = hour * 60 + minute;
        const targetMinutes = targetHour * 60 + targetMinute;
        return Math.abs(currentMinutes - targetMinutes) <= toleranceMinutes;
    }

    /**
     * Set user patterns (learned from behavior)
     */
    setUserPatterns(userId, patterns) {
        this.userPatterns.set(userId.toString(), patterns);
    }

    /**
     * Get user patterns
     */
    getUserPatterns(userId) {
        return this.userPatterns.get(userId.toString()) || {};
    }

    /**
     * Enable/disable proactive engine
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        console.log(`[ProactiveEngine] ${enabled ? 'Enabled' : 'Disabled'}`);
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            activeSubscribers: this.subscribers.size,
            activeChecks: this.activeChecks.size
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        // Stop all checks
        for (const [userId, intervalId] of this.activeChecks) {
            clearInterval(intervalId);
        }
        this.activeChecks.clear();
        this.subscribers.clear();
        this.userPatterns.clear();
        this.triggerHistory.clear();

        console.log('[ProactiveEngine] Destroyed');
    }
}

// Create singleton instance
const proactiveEngine = new ProactiveEngine();

module.exports = proactiveEngine;
