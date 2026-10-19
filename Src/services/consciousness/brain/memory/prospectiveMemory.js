/**
 * PROSPECTIVE MEMORY
 * Remember to do things in the future
 *
 * ELITE LEVEL: Time-based, event-based, context-based triggers
 */

class ProspectiveMemory {
    constructor() {
        this.intentions = [];
        this.checkInterval = null;
    }

    /**
     * Set intention to do something in the future
     */
    async setIntention(action, trigger, importance = 0.5) {
        console.log('[ProspectiveMemory] Setting intention...');

        const intention = {
            id: `intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            action,
            trigger,                        // { type: 'time'|'event'|'context', condition: ... }
            importance,
            created: Date.now(),
            deadline: trigger.deadline || null,
            status: 'pending',
            triggerCount: 0,
            lastChecked: Date.now()
        };

        this.intentions.push(intention);

        console.log(`[ProspectiveMemory] Intention set (total: ${this.intentions.length})`);

        // Start monitoring if not already running
        this.startMonitoring();

        return { success: true, intention };
    }

    /**
     * Check if any triggers are met
     */
    async checkTriggers(currentContext) {
        const triggered = [];

        for (const intention of this.intentions) {
            if (intention.status !== 'pending') continue;

            intention.lastChecked = Date.now();

            const met = this.isTriggerMet(intention.trigger, currentContext);

            if (met) {
                intention.status = 'triggered';
                intention.triggeredAt = Date.now();
                intention.triggerCount++;
                triggered.push(intention);

                console.log(`[ProspectiveMemory] Intention triggered: ${intention.action}`);
            }
        }

        return {
            triggered,
            count: triggered.length
        };
    }

    /**
     * Check if trigger condition is met
     */
    isTriggerMet(trigger, context) {
        const now = Date.now();

        switch (trigger.type) {
            case 'time':
                // Time-based trigger
                if (trigger.condition.at) {
                    const targetTime = new Date(trigger.condition.at).getTime();
                    return now >= targetTime;
                }
                if (trigger.condition.after) {
                    const afterTime = new Date(trigger.condition.after).getTime();
                    return now >= afterTime;
                }
                return false;

            case 'event':
                // Event-based trigger
                if (context.event === trigger.condition.event) {
                    return true;
                }
                return false;

            case 'context':
                // Context-based trigger
                for (const [key, value] of Object.entries(trigger.condition)) {
                    if (context[key] !== value) {
                        return false;
                    }
                }
                return true;

            default:
                return false;
        }
    }

    /**
     * Remind about intention
     */
    async remind(intentionId) {
        const intention = this.intentions.find(i => i.id === intentionId);

        if (!intention) {
            return { success: false, error: 'Intention not found' };
        }

        console.log(`[ProspectiveMemory] Reminder: ${intention.action}`);

        return {
            success: true,
            intention,
            message: `Remember to: ${intention.action}`
        };
    }

    /**
     * Complete intention
     */
    async complete(intentionId) {
        const intention = this.intentions.find(i => i.id === intentionId);

        if (!intention) {
            return { success: false, error: 'Intention not found' };
        }

        intention.status = 'completed';
        intention.completedAt = Date.now();

        console.log(`[ProspectiveMemory] Intention completed: ${intention.action}`);

        return { success: true, intention };
    }

    /**
     * Mark intention as missed
     */
    async miss(intentionId) {
        const intention = this.intentions.find(i => i.id === intentionId);

        if (!intention) {
            return { success: false, error: 'Intention not found' };
        }

        intention.status = 'missed';
        intention.missedAt = Date.now();

        console.log(`[ProspectiveMemory] Intention missed: ${intention.action}`);

        return { success: true, intention };
    }

    /**
     * Get pending intentions
     */
    getPending() {
        return this.intentions.filter(i => i.status === 'pending');
    }

    /**
     * Get triggered intentions
     */
    getTriggered() {
        return this.intentions.filter(i => i.status === 'triggered');
    }

    /**
     * Get intentions approaching deadline
     */
    getApproachingDeadline(hoursUntil = 24) {
        const now = Date.now();
        const threshold = now + (hoursUntil * 3600000);

        return this.intentions.filter(i =>
            i.status === 'pending' &&
            i.deadline &&
            new Date(i.deadline).getTime() < threshold
        );
    }

    /**
     * Start monitoring for triggers
     */
    startMonitoring() {
        if (this.checkInterval) {
            return; // Already monitoring
        }

        console.log('[ProspectiveMemory] Starting trigger monitoring');

        // Check every minute
        this.checkInterval = setInterval(() => {
            this.checkTriggers({ timestamp: Date.now() });
        }, 60000);
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('[ProspectiveMemory] Stopped trigger monitoring');
        }
    }

    /**
     * Clean up old intentions
     */
    cleanup() {
        const before = this.intentions.length;

        // Remove completed/missed intentions older than 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 3600000);

        this.intentions = this.intentions.filter(i => {
            if (i.status === 'completed' || i.status === 'missed') {
                const timestamp = i.completedAt || i.missedAt;
                return timestamp > sevenDaysAgo;
            }
            return true;
        });

        const removed = before - this.intentions.length;

        if (removed > 0) {
            console.log(`[ProspectiveMemory] Cleaned up ${removed} old intentions`);
        }

        return { removed };
    }

    /**
     * Get summary
     */
    getSummary() {
        return {
            total: this.intentions.length,
            pending: this.intentions.filter(i => i.status === 'pending').length,
            triggered: this.intentions.filter(i => i.status === 'triggered').length,
            completed: this.intentions.filter(i => i.status === 'completed').length,
            missed: this.intentions.filter(i => i.status === 'missed').length,
            monitoring: this.checkInterval !== null
        };
    }
}

module.exports = new ProspectiveMemory();
