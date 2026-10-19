/**
 * ATTENTION SYSTEM
 * Routes cognitive resources to what matters most
 *
 * ELITE LEVEL: Phoenix knows what deserves focus, filters noise, manages interrupts
 */

class AttentionSystem {
    constructor() {
        this.state = {
            focus: {
                primary: null,              // Current main focus
                secondary: [],              // Background awareness (max 3)
                salience: new Map(),        // What deserves attention (item -> priority)
                filters: []                 // What to ignore
            },

            resources: {
                available: 100,             // 0-100 cognitive capacity
                allocated: new Map(),       // task -> resources allocated
                reserved: new Map()         // Reserved for critical functions
            },

            interrupts: {
                queue: [],                  // Pending interrupts
                threshold: 7,               // How important to break focus (0-10)
                cooldown: 5000,             // Time between interrupts (ms)
                lastInterrupt: null
            }
        };

        // Reserve baseline resources for critical functions
        this.state.resources.reserved.set('breathing', 5);          // Always maintain core processes
        this.state.resources.reserved.set('safety_monitoring', 10); // Always watch for critical issues
        this.state.resources.reserved.set('user_monitoring', 15);   // Always track user state
    }

    /**
     * Allocate attention to stimuli based on salience
     */
    async allocateAttention(stimuli, context) {
        console.log('[Attention] Allocating attention to stimuli...');

        // Calculate salience for each stimulus
        const salienceScores = stimuli.map(stimulus => ({
            stimulus,
            salience: this.calculateSalience(stimulus, context)
        }));

        // Sort by salience
        salienceScores.sort((a, b) => b.salience - a.salience);

        // Allocate based on available resources
        const totalReserved = Array.from(this.state.resources.reserved.values())
            .reduce((sum, val) => sum + val, 0);
        const availableForAllocation = this.state.resources.available - totalReserved;

        // Primary focus gets 60% of available resources
        if (salienceScores.length > 0 && salienceScores[0].salience > 5) {
            const primaryResources = Math.floor(availableForAllocation * 0.6);
            this.state.focus.primary = salienceScores[0].stimulus.id;
            this.state.resources.allocated.set(salienceScores[0].stimulus.id, primaryResources);

            console.log(`[Attention] Primary focus: ${salienceScores[0].stimulus.id} (${primaryResources}% resources, salience: ${salienceScores[0].salience.toFixed(2)})`);
        }

        // Secondary awareness gets remaining resources, distributed
        const secondaryResources = availableForAllocation - (this.state.resources.allocated.get(this.state.focus.primary) || 0);
        const secondaryCandidates = salienceScores.slice(1, 4).filter(s => s.salience > 3);

        this.state.focus.secondary = [];
        if (secondaryCandidates.length > 0) {
            const resourcesPerSecondary = Math.floor(secondaryResources / secondaryCandidates.length);

            secondaryCandidates.forEach(candidate => {
                this.state.focus.secondary.push(candidate.stimulus.id);
                this.state.resources.allocated.set(candidate.stimulus.id, resourcesPerSecondary);
            });

            console.log(`[Attention] Secondary awareness: ${secondaryCandidates.length} items (${resourcesPerSecondary}% each)`);
        }

        // Update salience map
        salienceScores.forEach(({ stimulus, salience }) => {
            this.state.focus.salience.set(stimulus.id, salience);
        });

        return {
            primary: this.state.focus.primary,
            secondary: this.state.focus.secondary,
            resourceAllocation: Object.fromEntries(this.state.resources.allocated)
        };
    }

    /**
     * Calculate salience (how much something deserves attention)
     * Factors: novelty, urgency, alignment with goals, emotional significance
     */
    calculateSalience(stimulus, context) {
        let salience = 0;

        // Novelty: New things are salient
        const novelty = stimulus.seen_count ? Math.max(0, 1 - (stimulus.seen_count / 10)) : 1;
        salience += novelty * 3;

        // Urgency: Time-sensitive things are salient
        if (stimulus.urgency) {
            salience += stimulus.urgency * 2; // 0-10 scale
        }

        // Goal alignment: Things that help achieve goals are salient
        if (stimulus.goal_relevance) {
            salience += stimulus.goal_relevance * 3; // 0-10 scale
        }

        // Emotional significance: Emotionally charged things are salient
        if (stimulus.emotional_intensity) {
            salience += stimulus.emotional_intensity * 2; // 0-10 scale
        }

        // User-initiated: Things user explicitly asks about are highly salient
        if (stimulus.user_initiated) {
            salience += 5;
        }

        // Negative bias: Threats/problems are more salient than opportunities
        if (stimulus.valence && stimulus.valence < 0) {
            salience *= 1.3;
        }

        // Normalize to 0-10
        salience = Math.min(10, Math.max(0, salience));

        return salience;
    }

    /**
     * Should this event interrupt current focus?
     */
    async shouldInterrupt(event, currentFocus) {
        // Check cooldown - don't interrupt if we just did
        if (this.state.interrupts.lastInterrupt) {
            const timeSinceLastInterrupt = Date.now() - this.state.interrupts.lastInterrupt;
            if (timeSinceLastInterrupt < this.state.interrupts.cooldown) {
                console.log('[Attention] Interrupt blocked by cooldown');
                return { shouldInterrupt: false, reason: 'cooldown' };
            }
        }

        // Calculate interrupt priority
        const interruptPriority = this.calculateSalience(event, {});

        // Compare against threshold
        if (interruptPriority < this.state.interrupts.threshold) {
            console.log(`[Attention] Interrupt rejected: priority ${interruptPriority.toFixed(2)} < threshold ${this.state.interrupts.threshold}`);
            return { shouldInterrupt: false, reason: 'below_threshold', priority: interruptPriority };
        }

        // Critical events always interrupt
        if (event.critical) {
            console.log('[Attention] CRITICAL interrupt accepted');
            this.state.interrupts.lastInterrupt = Date.now();
            return { shouldInterrupt: true, reason: 'critical', priority: interruptPriority };
        }

        // If current focus is more important, queue the interrupt
        const currentFocusPriority = currentFocus ? this.state.focus.salience.get(currentFocus) || 0 : 0;

        if (interruptPriority > currentFocusPriority * 1.5) { // Must be 50% more important
            console.log(`[Attention] Interrupt accepted: priority ${interruptPriority.toFixed(2)} > current ${currentFocusPriority.toFixed(2)}`);
            this.state.interrupts.lastInterrupt = Date.now();
            return { shouldInterrupt: true, reason: 'higher_priority', priority: interruptPriority };
        }

        // Otherwise, queue it
        this.state.interrupts.queue.push({
            event,
            priority: interruptPriority,
            timestamp: Date.now()
        });

        console.log(`[Attention] Interrupt queued for later (priority: ${interruptPriority.toFixed(2)})`);
        return { shouldInterrupt: false, reason: 'queued', priority: interruptPriority };
    }

    /**
     * Add filter to ignore certain stimuli
     */
    addFilter(filter) {
        this.state.focus.filters.push(filter);
        console.log(`[Attention] Filter added: ${filter.description}`);
    }

    /**
     * Remove filter
     */
    removeFilter(filterId) {
        const index = this.state.focus.filters.findIndex(f => f.id === filterId);
        if (index !== -1) {
            const removed = this.state.focus.filters.splice(index, 1);
            console.log(`[Attention] Filter removed: ${removed[0].description}`);
            return true;
        }
        return false;
    }

    /**
     * Check if stimulus should be filtered out
     */
    shouldFilter(stimulus) {
        for (const filter of this.state.focus.filters) {
            if (filter.matches(stimulus)) {
                return { filtered: true, reason: filter.description };
            }
        }
        return { filtered: false };
    }

    /**
     * Process interrupt queue
     */
    async processInterruptQueue() {
        if (this.state.interrupts.queue.length === 0) {
            return null;
        }

        // Sort by priority
        this.state.interrupts.queue.sort((a, b) => b.priority - a.priority);

        // Get highest priority interrupt
        const interrupt = this.state.interrupts.queue.shift();

        console.log(`[Attention] Processing queued interrupt: ${interrupt.event.id} (priority: ${interrupt.priority.toFixed(2)})`);

        return interrupt.event;
    }

    /**
     * Shift focus to new target
     */
    async shiftFocus(newFocus, reason) {
        const oldFocus = this.state.focus.primary;

        // Deallocate resources from old focus
        if (oldFocus) {
            const oldResources = this.state.resources.allocated.get(oldFocus) || 0;
            console.log(`[Attention] Shifting focus from ${oldFocus} (freeing ${oldResources}% resources)`);
            this.state.resources.allocated.delete(oldFocus);
        }

        // Allocate to new focus
        this.state.focus.primary = newFocus;
        const totalReserved = Array.from(this.state.resources.reserved.values())
            .reduce((sum, val) => sum + val, 0);
        const availableForAllocation = this.state.resources.available - totalReserved;
        const newResources = Math.floor(availableForAllocation * 0.6);
        this.state.resources.allocated.set(newFocus, newResources);

        console.log(`[Attention] Focus shifted to ${newFocus} (${newResources}% resources) - Reason: ${reason}`);

        return {
            from: oldFocus,
            to: newFocus,
            reason,
            resourcesAllocated: newResources
        };
    }

    /**
     * Get attention report
     */
    async getAttentionReport() {
        const totalReserved = Array.from(this.state.resources.reserved.values())
            .reduce((sum, val) => sum + val, 0);
        const totalAllocated = Array.from(this.state.resources.allocated.values())
            .reduce((sum, val) => sum + val, 0);
        const free = this.state.resources.available - totalReserved - totalAllocated;

        return {
            focus: {
                primary: this.state.focus.primary,
                secondary: this.state.focus.secondary,
                filters: this.state.focus.filters.length
            },
            resources: {
                total: this.state.resources.available,
                reserved: totalReserved,
                allocated: totalAllocated,
                free,
                breakdown: {
                    reserved: Object.fromEntries(this.state.resources.reserved),
                    allocated: Object.fromEntries(this.state.resources.allocated)
                }
            },
            interrupts: {
                queued: this.state.interrupts.queue.length,
                threshold: this.state.interrupts.threshold,
                cooldown: this.state.interrupts.cooldown,
                timeSinceLastInterrupt: this.state.interrupts.lastInterrupt
                    ? Date.now() - this.state.interrupts.lastInterrupt
                    : null
            },
            salience: Object.fromEntries(this.state.focus.salience)
        };
    }

    /**
     * Adjust interrupt threshold
     * Higher = harder to interrupt (deep work mode)
     * Lower = easier to interrupt (monitoring mode)
     */
    setInterruptThreshold(threshold) {
        this.state.interrupts.threshold = Math.min(10, Math.max(0, threshold));
        console.log(`[Attention] Interrupt threshold set to ${this.state.interrupts.threshold}`);
    }

    /**
     * Get current focus
     */
    getCurrentFocus() {
        return {
            primary: this.state.focus.primary,
            secondary: this.state.focus.secondary
        };
    }

    /**
     * Get summary (required by brain/index.js)
     */
    getSummary() {
        return {
            focus: this.state.focus.primary || null,
            capacity: this.state.capacity || 7,
            taskCount: (this.state.tasks || []).length,
            interrupts: {
                threshold: this.state.interrupts.threshold || 5,
                cooldown: this.state.interrupts.cooldown || 5000
            }
        };
    }
}

module.exports = new AttentionSystem();
