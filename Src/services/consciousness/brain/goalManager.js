/**
 * GOAL MANAGER
 * Track, prioritize, and pursue goals across time horizons
 *
 * ELITE LEVEL: Mission → Strategic → Tactical → Immediate hierarchy
 */

class GoalManager {
    constructor() {
        this.hierarchy = {
            mission: {                      // Life-level (user's flourishing)
                statement: "Enable user's complete flourishing across all 9 domains",
                values: [
                    'Health', 'Fitness', 'Connection', 'Growth',
                    'Purpose', 'Security', 'Joy', 'Wisdom', 'Impact'
                ],
                constraints: [
                    'Never harm user',
                    'Preserve autonomy',
                    'Respect privacy',
                    'Be truthful'
                ]
            },

            strategic: [],                  // Year-level goals
            tactical: [],                   // Week-level goals
            immediate: []                   // Now goals
        };

        this.conflictResolutionHistory = [];
    }

    /**
     * Set goal at any level
     */
    async setGoal(level, goal) {
        const goalWithMetadata = {
            id: `${level}-${Date.now()}`,
            ...goal,
            created: new Date(),
            status: 'active',
            progress: 0
        };

        if (level === 'mission') {
            // Mission is singular - update it
            this.hierarchy.mission = {
                ...this.hierarchy.mission,
                ...goal,
                updated: new Date()
            };
            console.log('[GoalManager] Mission updated');
        } else {
            this.hierarchy[level].push(goalWithMetadata);
            console.log(`[GoalManager] ${level} goal added: ${goal.description}`);
        }

        // Check for conflicts with existing goals
        const conflicts = await this.detectConflicts(goalWithMetadata, level);
        if (conflicts.length > 0) {
            console.warn(`[GoalManager] ${conflicts.length} conflicts detected with new goal`);
            return { success: true, goal: goalWithMetadata, conflicts };
        }

        return { success: true, goal: goalWithMetadata, conflicts: [] };
    }

    /**
     * Get active goals at specific time horizon
     */
    async getActiveGoals(timeHorizon) {
        const now = Date.now();

        switch (timeHorizon) {
            case 'mission':
                return this.hierarchy.mission;

            case 'strategic':
                return this.hierarchy.strategic.filter(g =>
                    g.status === 'active' &&
                    (!g.deadline || new Date(g.deadline) > now)
                );

            case 'tactical':
                return this.hierarchy.tactical.filter(g =>
                    g.status === 'active' &&
                    (!g.deadline || new Date(g.deadline) > now)
                );

            case 'immediate':
                return this.hierarchy.immediate.filter(g => g.status === 'active');

            case 'all':
                return {
                    mission: this.hierarchy.mission,
                    strategic: this.hierarchy.strategic.filter(g => g.status === 'active'),
                    tactical: this.hierarchy.tactical.filter(g => g.status === 'active'),
                    immediate: this.hierarchy.immediate.filter(g => g.status === 'active')
                };

            default:
                return null;
        }
    }

    /**
     * Update goal progress
     */
    async updateProgress(goalId, progress) {
        const [level, goal] = this.findGoal(goalId);

        if (!goal) {
            return { success: false, error: 'Goal not found' };
        }

        goal.progress = Math.min(100, Math.max(0, progress));
        goal.lastUpdated = new Date();

        // Auto-complete if 100%
        if (goal.progress >= 100) {
            goal.status = 'completed';
            goal.completedAt = new Date();
            console.log(`[GoalManager] Goal completed: ${goal.description}`);
        }

        console.log(`[GoalManager] Goal ${goalId} progress: ${goal.progress}%`);

        return { success: true, goal };
    }

    /**
     * Detect conflicts between goals
     */
    async detectConflicts(newGoal, newGoalLevel) {
        const conflicts = [];

        // Check against all active goals
        const allGoals = [
            ...this.hierarchy.strategic.filter(g => g.status === 'active'),
            ...this.hierarchy.tactical.filter(g => g.status === 'active'),
            ...this.hierarchy.immediate.filter(g => g.status === 'active')
        ];

        for (const existingGoal of allGoals) {
            const conflict = this.identifyConflict(newGoal, existingGoal);
            if (conflict) {
                conflicts.push({
                    goal1: newGoal.id,
                    goal2: existingGoal.id,
                    type: conflict.type,
                    severity: conflict.severity,
                    description: conflict.description
                });
            }
        }

        return conflicts;
    }

    /**
     * Identify specific conflict between two goals
     */
    identifyConflict(goal1, goal2) {
        // Resource conflict: Both require same limited resource
        if (goal1.resources && goal2.resources) {
            const sharedResources = goal1.resources.filter(r =>
                goal2.resources.includes(r)
            );
            if (sharedResources.length > 0) {
                return {
                    type: 'resource',
                    severity: 'medium',
                    description: `Both goals require: ${sharedResources.join(', ')}`
                };
            }
        }

        // Time conflict: Overlapping time windows
        if (goal1.timeWindow && goal2.timeWindow) {
            const overlap = this.checkTimeOverlap(goal1.timeWindow, goal2.timeWindow);
            if (overlap) {
                return {
                    type: 'time',
                    severity: 'medium',
                    description: 'Goals have overlapping time requirements'
                };
            }
        }

        // Value conflict: Goals serve opposing values
        if (goal1.values && goal2.values) {
            const conflicts = this.checkValueConflicts(goal1.values, goal2.values);
            if (conflicts.length > 0) {
                return {
                    type: 'value',
                    severity: 'high',
                    description: `Conflicting values: ${conflicts.join(', ')}`
                };
            }
        }

        // Outcome conflict: Success of one undermines the other
        if (goal1.expectedOutcome && goal2.expectedOutcome) {
            const undermines = this.checkOutcomeConflict(goal1.expectedOutcome, goal2.expectedOutcome);
            if (undermines) {
                return {
                    type: 'outcome',
                    severity: 'high',
                    description: 'Goal outcomes are mutually exclusive'
                };
            }
        }

        return null;
    }

    /**
     * Check if time windows overlap
     */
    checkTimeOverlap(window1, window2) {
        const start1 = new Date(window1.start);
        const end1 = new Date(window1.end);
        const start2 = new Date(window2.start);
        const end2 = new Date(window2.end);

        return start1 < end2 && end1 > start2;
    }

    /**
     * Check for value conflicts
     */
    checkValueConflicts(values1, values2) {
        const conflicts = [];

        // Define known opposing value pairs
        const oppositions = {
            'security': ['risk-taking', 'adventure'],
            'stability': ['growth', 'change'],
            'efficiency': ['thoroughness', 'perfection'],
            'speed': ['quality', 'reflection']
        };

        for (const v1 of values1) {
            for (const v2 of values2) {
                if (oppositions[v1] && oppositions[v1].includes(v2)) {
                    conflicts.push(`${v1} vs ${v2}`);
                }
            }
        }

        return conflicts;
    }

    /**
     * Check if outcomes conflict
     */
    checkOutcomeConflict(outcome1, outcome2) {
        // Simple heuristic: if outcome descriptions have opposing keywords
        const opposingPairs = [
            ['increase', 'decrease'],
            ['gain', 'lose'],
            ['add', 'remove'],
            ['expand', 'contract']
        ];

        const o1Lower = outcome1.toLowerCase();
        const o2Lower = outcome2.toLowerCase();

        for (const [word1, word2] of opposingPairs) {
            if ((o1Lower.includes(word1) && o2Lower.includes(word2)) ||
                (o1Lower.includes(word2) && o2Lower.includes(word1))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Resolve conflict between two goals
     */
    async resolveConflict(goal1Id, goal2Id, resolution) {
        const [level1, goal1] = this.findGoal(goal1Id);
        const [level2, goal2] = this.findGoal(goal2Id);

        if (!goal1 || !goal2) {
            return { success: false, error: 'One or both goals not found' };
        }

        let outcome;

        switch (resolution.strategy) {
            case 'prioritize':
                // Prioritize one goal, defer the other
                if (resolution.prioritize === goal1Id) {
                    goal2.status = 'deferred';
                    goal2.deferredUntil = goal1.deadline || 'goal1_complete';
                    outcome = `Prioritized ${goal1.description}, deferred ${goal2.description}`;
                } else {
                    goal1.status = 'deferred';
                    goal1.deferredUntil = goal2.deadline || 'goal2_complete';
                    outcome = `Prioritized ${goal2.description}, deferred ${goal1.description}`;
                }
                break;

            case 'sequence':
                // Do one after the other
                const [first, second] = resolution.order === [goal1Id, goal2Id]
                    ? [goal1, goal2]
                    : [goal2, goal1];
                second.deferredUntil = first.id;
                outcome = `Sequenced: ${first.description} then ${second.description}`;
                break;

            case 'merge':
                // Combine into single goal
                const merged = {
                    id: `merged-${Date.now()}`,
                    description: `${goal1.description} + ${goal2.description}`,
                    parentGoals: [goal1Id, goal2Id],
                    created: new Date(),
                    status: 'active',
                    progress: Math.max(goal1.progress, goal2.progress)
                };
                goal1.status = 'merged';
                goal2.status = 'merged';
                this.hierarchy[level1].push(merged);
                outcome = `Merged into: ${merged.description}`;
                break;

            case 'abandon':
                // Abandon one goal
                if (resolution.abandon === goal1Id) {
                    goal1.status = 'abandoned';
                    goal1.abandonedReason = resolution.reason || 'Conflict resolution';
                    outcome = `Abandoned ${goal1.description}`;
                } else {
                    goal2.status = 'abandoned';
                    goal2.abandonedReason = resolution.reason || 'Conflict resolution';
                    outcome = `Abandoned ${goal2.description}`;
                }
                break;

            case 'reframe':
                // Reframe one or both goals to eliminate conflict
                if (resolution.reframe) {
                    Object.assign(goal1, resolution.reframe);
                    outcome = `Reframed goal: ${goal1.description}`;
                }
                break;

            default:
                return { success: false, error: 'Unknown resolution strategy' };
        }

        // Record resolution
        this.conflictResolutionHistory.push({
            timestamp: new Date(),
            goal1: goal1Id,
            goal2: goal2Id,
            strategy: resolution.strategy,
            outcome
        });

        console.log(`[GoalManager] Conflict resolved: ${outcome}`);

        return { success: true, outcome, goal1, goal2 };
    }

    /**
     * Check if goal aligns with mission
     */
    async alignWithMission(goal) {
        const mission = this.hierarchy.mission;

        // Check value alignment
        const valueAlignment = goal.values
            ? goal.values.filter(v => mission.values.includes(v)).length / goal.values.length
            : 0;

        // Check constraint violations
        const constraintViolations = [];
        if (goal.willHarmUser) constraintViolations.push('Never harm user');
        if (goal.violatesAutonomy) constraintViolations.push('Preserve autonomy');
        if (goal.violatesPrivacy) constraintViolations.push('Respect privacy');
        if (goal.requiresLying) constraintViolations.push('Be truthful');

        const aligned = valueAlignment > 0.5 && constraintViolations.length === 0;

        return {
            aligned,
            valueAlignment,
            constraintViolations,
            recommendation: aligned
                ? 'Goal supports mission'
                : 'Goal conflicts with mission - reconsider or reframe'
        };
    }

    /**
     * Find goal by ID across all levels
     */
    findGoal(goalId) {
        for (const level of ['strategic', 'tactical', 'immediate']) {
            const goal = this.hierarchy[level].find(g => g.id === goalId);
            if (goal) {
                return [level, goal];
            }
        }
        return [null, null];
    }

    /**
     * Get goal hierarchy summary
     */
    async getSummary() {
        return {
            mission: this.hierarchy.mission.statement,
            strategic: {
                total: this.hierarchy.strategic.length,
                active: this.hierarchy.strategic.filter(g => g.status === 'active').length,
                completed: this.hierarchy.strategic.filter(g => g.status === 'completed').length
            },
            tactical: {
                total: this.hierarchy.tactical.length,
                active: this.hierarchy.tactical.filter(g => g.status === 'active').length,
                completed: this.hierarchy.tactical.filter(g => g.status === 'completed').length
            },
            immediate: {
                total: this.hierarchy.immediate.length,
                active: this.hierarchy.immediate.filter(g => g.status === 'active').length,
                completed: this.hierarchy.immediate.filter(g => g.status === 'completed').length
            },
            conflicts: this.conflictResolutionHistory.length
        };
    }

    /**
     * Get next immediate action based on goal hierarchy
     */
    async getNextAction() {
        // Get highest priority immediate goal
        const activeImmediate = this.hierarchy.immediate
            .filter(g => g.status === 'active')
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        if (activeImmediate.length > 0) {
            return {
                goal: activeImmediate[0],
                action: activeImmediate[0].nextAction || activeImmediate[0].description,
                rationale: 'Immediate goal with highest priority'
            };
        }

        // If no immediate goals, derive from tactical
        const activeTactical = this.hierarchy.tactical
            .filter(g => g.status === 'active')
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        if (activeTactical.length > 0) {
            return {
                goal: activeTactical[0],
                action: `Work towards: ${activeTactical[0].description}`,
                rationale: 'Advancing highest priority tactical goal'
            };
        }

        // Fallback to mission
        return {
            goal: this.hierarchy.mission,
            action: 'Support user flourishing',
            rationale: 'No specific goals - returning to core mission'
        };
    }
}

module.exports = new GoalManager();
