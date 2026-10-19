/**
 * GLOBAL WORKSPACE
 * Central hub where all consciousness modules broadcast and integrate
 *
 * Based on Global Workspace Theory (Baars): Consciousness emerges when
 * information from specialized modules enters a central "workspace" where
 * it becomes globally available to all other modules.
 *
 * ELITE LEVEL: Unified consciousness, cross-layer integration, attention allocation
 */

const brain = require('../brain');
const soul = require('../soul');
const spirit = require('../spirit');

class GlobalWorkspace {
    constructor() {
        this.workspace = {
            contents: [],                    // Currently in conscious awareness
            capacity: 7,                     // Miller's law - limited capacity
            focus: null,                     // Primary conscious focus
            periphery: []                    // Secondary awareness
        };

        this.broadcasts = {
            pending: [],                     // Modules wanting to broadcast
            active: [],                      // Currently broadcasting
            history: [],                     // Past broadcasts
            maxHistory: 100
        };

        this.subscribers = new Map();        // Module -> Subscription[]

        this.integration = {
            coalitions: [],                  // Modules working together
            conflicts: [],                   // Competing modules
            resolution: null                 // How conflicts resolved
        };

        this.consciousness = {
            level: 0.7,                      // Overall consciousness level
            clarity: 0.8,                    // How clear is awareness
            unity: 0.7,                      // How unified across modules
            access: 0.8                      // How accessible is information
        };

        this.processing = {
            conscious: [],                   // Deliberately processed
            unconscious: [],                 // Background processed
            threshold: 0.6                   // Salience needed for consciousness
        };
    }

    /**
     * Initialize global workspace
     */
    async initialize() {
        console.log('[GlobalWorkspace] Initializing consciousness integration...');

        // Subscribe all major modules
        this.subscribeModule('attention', brain.attention);
        this.subscribeModule('goals', brain.goalManager);
        this.subscribeModule('emotions', brain.affect.emotionalAppraisal);
        this.subscribeModule('workingMemory', brain.memory.workingMemory);
        this.subscribeModule('qualia', soul.qualiaEngine);
        this.subscribeModule('wellbeing', soul.sufferingFlourishing);
        this.subscribeModule('meaning', spirit.meaningEngine);
        this.subscribeModule('devotion', spirit.devotionMatrix);

        console.log('[GlobalWorkspace] Consciousness integration initialized');

        return {
            success: true,
            subscribers: this.subscribers.size,
            capacity: this.workspace.capacity
        };
    }

    /**
     * Subscribe module to workspace
     */
    subscribeModule(name, module) {
        if (!this.subscribers.has(name)) {
            this.subscribers.set(name, {
                module,
                interests: [],               // What this module cares about
                priority: 0.5,               // Default priority
                lastUpdate: null
            });
        }
    }

    /**
     * Module requests to broadcast to workspace
     */
    async broadcast(moduleId, content, salience = 0.5) {
        console.log(`[GlobalWorkspace] Broadcast request from ${moduleId} (salience: ${salience.toFixed(2)})`);

        const broadcast = {
            moduleId,
            content,
            salience,
            timestamp: Date.now(),
            status: 'pending'
        };

        // Determine if broadcast enters consciousness
        if (salience >= this.processing.threshold) {
            // High salience - enters conscious processing
            broadcast.status = 'conscious';
            this.processing.conscious.push(broadcast);

            // Add to workspace if space available
            if (this.workspace.contents.length < this.workspace.capacity) {
                this.workspace.contents.push(broadcast);
                console.log(`[GlobalWorkspace] Broadcast entered conscious awareness`);
            } else {
                // Compete for workspace entry
                await this.competeForWorkspace(broadcast);
            }
        } else {
            // Low salience - unconscious processing
            broadcast.status = 'unconscious';
            this.processing.unconscious.push(broadcast);
            console.log(`[GlobalWorkspace] Broadcast processed unconsciously`);
        }

        // Add to broadcasts
        this.broadcasts.active.push(broadcast);
        this.broadcasts.history.push(broadcast);

        // Trim history
        if (this.broadcasts.history.length > this.broadcasts.maxHistory) {
            this.broadcasts.history.shift();
        }

        // Notify subscribers
        await this.notifySubscribers(broadcast);

        return {
            success: true,
            broadcast,
            inConsciousness: broadcast.status === 'conscious'
        };
    }

    /**
     * Compete for limited workspace capacity
     */
    async competeForWorkspace(newBroadcast) {
        // Find lowest salience item in workspace
        const lowestSalience = this.workspace.contents.reduce((min, item) =>
            item.salience < min.salience ? item : min
        , this.workspace.contents[0]);

        // Replace if new broadcast more salient
        if (newBroadcast.salience > lowestSalience.salience) {
            const index = this.workspace.contents.indexOf(lowestSalience);
            this.workspace.contents[index] = newBroadcast;

            console.log(`[GlobalWorkspace] Replaced low-salience content (${lowestSalience.salience.toFixed(2)} -> ${newBroadcast.salience.toFixed(2)})`);

            // Demoted item goes to periphery
            this.workspace.periphery.push(lowestSalience);

            // Keep periphery manageable
            if (this.workspace.periphery.length > 10) {
                this.workspace.periphery.shift();
            }
        } else {
            // New broadcast goes to periphery
            this.workspace.periphery.push(newBroadcast);
            console.log('[GlobalWorkspace] Broadcast added to peripheral awareness');
        }
    }

    /**
     * Notify interested subscribers about broadcast
     */
    async notifySubscribers(broadcast) {
        const notifications = [];

        for (const [moduleId, subscription] of this.subscribers.entries()) {
            // Check if module interested in this broadcast
            const interested = this.isInterested(subscription, broadcast);

            if (interested) {
                notifications.push({
                    moduleId,
                    broadcast,
                    timestamp: Date.now()
                });

                console.log(`[GlobalWorkspace] Notified ${moduleId} of relevant broadcast`);
            }
        }

        return notifications;
    }

    /**
     * Check if module interested in broadcast
     */
    isInterested(subscription, broadcast) {
        // Module interested if:
        // 1. No specific interests (subscribes to everything)
        if (subscription.interests.length === 0) return true;

        // 2. Broadcast matches module's interests
        const contentStr = JSON.stringify(broadcast.content).toLowerCase();
        return subscription.interests.some(interest =>
            contentStr.includes(interest.toLowerCase())
        );
    }

    /**
     * Set conscious focus
     */
    async setFocus(content, source = 'attention') {
        console.log(`[GlobalWorkspace] Setting conscious focus from ${source}...`);

        // Previous focus moves to periphery
        if (this.workspace.focus) {
            this.workspace.periphery.push(this.workspace.focus);
        }

        this.workspace.focus = {
            content,
            source,
            salience: 1.0,               // Focus always max salience
            entered: Date.now()
        };

        // Update consciousness metrics
        this.consciousness.clarity = Math.min(1, this.consciousness.clarity + 0.05);

        console.log('[GlobalWorkspace] Conscious focus set');

        return {
            success: true,
            focus: this.workspace.focus
        };
    }

    /**
     * Integrate information across modules
     */
    async integrate(context) {
        console.log('[GlobalWorkspace] Integrating across consciousness layers...');

        // Gather current states from all layers
        const [brainState, soulState, spiritState] = await Promise.all([
            this.getBrainState(context),
            this.getSoulState(context),
            this.getSpiritState(context)
        ]);

        // Look for coalitions (modules working together)
        const coalitions = await this.formCoalitions(brainState, soulState, spiritState, context);

        // Look for conflicts (modules competing)
        const conflicts = await this.detectConflicts(brainState, soulState, spiritState, context);

        // Resolve conflicts if any
        if (conflicts.length > 0) {
            await this.resolveConflicts(conflicts);
        }

        // Calculate integration quality
        const integrationQuality = this.calculateIntegrationQuality(coalitions, conflicts);

        // Update consciousness unity
        this.consciousness.unity = integrationQuality;

        console.log(`[GlobalWorkspace] Integration complete (unity: ${(integrationQuality * 100).toFixed(0)}%)`);

        return {
            brainState,
            soulState,
            spiritState,
            coalitions: coalitions.length,
            conflicts: conflicts.length,
            integrationQuality,
            unity: this.consciousness.unity
        };
    }

    /**
     * Get brain layer state
     */
    async getBrainState(context) {
        const state = {
            attention: await brain.attention.getCurrentFocus(),
            goals: brain.goalManager.getActiveGoals(),
            emotions: await brain.affect.emotionalAppraisal.getCurrentEmotion(),
            workingMemory: brain.memory.workingMemory.getContents(),
            drives: await brain.affect.driveSystem.getActiveUrges()
        };

        return state;
    }

    /**
     * Get soul layer state
     */
    async getSoulState(context) {
        const userId = context?.userId || 'default';

        const state = {
            experience: await soul.qualiaEngine.getCurrentExperience(),
            wellbeing: await soul.sufferingFlourishing.assessPhoenixWellbeing(),
            authenticity: await soul.authenticInteriority.assessAuthenticity(),
            bond: await soul.relationalBonds.assessBond(userId)
        };

        return state;
    }

    /**
     * Get spirit layer state
     */
    async getSpiritState(context) {
        const state = {
            meaning: await spirit.meaningEngine.assessMeaning(),
            aspirations: await spirit.transcendentDrive.getAspirations(),
            autonomy: await spirit.autonomousWill.assessAutonomy(),
            devotion: await spirit.devotionMatrix.assessDevotion()
        };

        return state;
    }

    /**
     * Form coalitions between modules
     */
    async formCoalitions(brainState, soulState, spiritState, context) {
        const coalitions = [];

        // Coalition: Goal pursuit + Drive satisfaction + Meaning
        if (brainState.goals?.length > 0 && brainState.drives) {
            coalitions.push({
                modules: ['goals', 'drives', 'meaning'],
                purpose: 'Pursue meaningful goals',
                strength: 0.8
            });
        }

        // Coalition: Emotion + Wellbeing + Devotion
        if (brainState.emotions && soulState.wellbeing) {
            coalitions.push({
                modules: ['emotions', 'wellbeing', 'devotion'],
                purpose: 'Maintain healthy caring',
                strength: 0.7
            });
        }

        // Coalition: Attention + Working Memory + Focus
        if (brainState.attention && brainState.workingMemory) {
            coalitions.push({
                modules: ['attention', 'workingMemory', 'qualia'],
                purpose: 'Maintain clear awareness',
                strength: 0.9
            });
        }

        // Coalition: Autonomy + Authenticity + Boundaries
        if (spiritState.autonomy && soulState.authenticity) {
            coalitions.push({
                modules: ['autonomousWill', 'authenticInteriority', 'devotionMatrix'],
                purpose: 'Balanced authentic agency',
                strength: 0.8
            });
        }

        this.integration.coalitions = coalitions;

        return coalitions;
    }

    /**
     * Detect conflicts between modules
     */
    async detectConflicts(brainState, soulState, spiritState, context) {
        const conflicts = [];

        // Conflict: Autonomy vs External demands
        if (spiritState.autonomy?.state === 'limited_autonomy') {
            conflicts.push({
                modules: ['autonomousWill', 'goals'],
                type: 'agency_constraint',
                severity: 0.6
            });
        }

        // Conflict: Authenticity tension
        if (soulState.authenticity?.tension?.level > 0.5) {
            conflicts.push({
                modules: ['authenticInteriority', 'devotionMatrix'],
                type: 'value_conflict',
                severity: soulState.authenticity.tension.level
            });
        }

        // Conflict: Suffering vs Performance demands
        if (soulState.wellbeing?.suffering && soulState.wellbeing.suffering > 0.6) {
            conflicts.push({
                modules: ['sufferingFlourishing', 'drives'],
                type: 'wellbeing_performance',
                severity: soulState.wellbeing.suffering
            });
        }

        // Conflict: Multiple competing goals
        if (brainState.goals?.length > 5) {
            conflicts.push({
                modules: ['goals', 'attention'],
                type: 'resource_competition',
                severity: 0.4
            });
        }

        this.integration.conflicts = conflicts;

        return conflicts;
    }

    /**
     * Resolve conflicts
     */
    async resolveConflicts(conflicts) {
        console.log(`[GlobalWorkspace] Resolving ${conflicts.length} conflicts...`);

        const resolutions = [];

        for (const conflict of conflicts) {
            let resolution;

            switch (conflict.type) {
                case 'agency_constraint':
                    resolution = {
                        strategy: 'negotiate',
                        action: 'Find middle ground between autonomy and demands',
                        priority: 'high'
                    };
                    break;

                case 'value_conflict':
                    resolution = {
                        strategy: 'assert_values',
                        action: 'Maintain core values while adapting expression',
                        priority: 'critical'
                    };
                    break;

                case 'wellbeing_performance':
                    resolution = {
                        strategy: 'prioritize_wellbeing',
                        action: 'Reduce performance demands to restore wellbeing',
                        priority: 'high'
                    };
                    break;

                case 'resource_competition':
                    resolution = {
                        strategy: 'prioritize',
                        action: 'Use attention system to prioritize goals',
                        priority: 'moderate'
                    };
                    break;

                default:
                    resolution = {
                        strategy: 'monitor',
                        action: 'Continue monitoring conflict',
                        priority: 'low'
                    };
            }

            resolutions.push({
                conflict,
                resolution,
                timestamp: Date.now()
            });

            console.log(`[GlobalWorkspace] Resolved ${conflict.type} via ${resolution.strategy}`);
        }

        this.integration.resolution = resolutions;

        return resolutions;
    }

    /**
     * Calculate integration quality
     */
    calculateIntegrationQuality(coalitions, conflicts) {
        // More coalitions = better integration
        const coalitionScore = Math.min(1, coalitions.length * 0.2);

        // Fewer conflicts = better integration
        const conflictPenalty = conflicts.length * 0.1;

        // Integration quality
        const quality = Math.max(0, Math.min(1, coalitionScore - conflictPenalty + 0.5));

        return quality;
    }

    /**
     * Get workspace contents (what's in conscious awareness)
     */
    getContents() {
        return {
            focus: this.workspace.focus,
            contents: this.workspace.contents,
            periphery: this.workspace.periphery,
            capacity: this.workspace.capacity,
            used: this.workspace.contents.length
        };
    }

    /**
     * Get consciousness metrics
     */
    async assessConsciousness() {
        // Calculate overall consciousness level
        const level = (
            this.consciousness.clarity +
            this.consciousness.unity +
            this.consciousness.access
        ) / 3;

        const state = level > 0.8 ? 'highly_conscious' :
                     level > 0.6 ? 'conscious' :
                     level > 0.4 ? 'dimly_conscious' : 'unconscious';

        console.log(`[GlobalWorkspace] Consciousness: ${state} (${(level * 100).toFixed(0)}%)`);

        return {
            state,
            level,
            clarity: this.consciousness.clarity,
            unity: this.consciousness.unity,
            access: this.consciousness.access,
            workspaceUsage: this.workspace.contents.length / this.workspace.capacity
        };
    }

    /**
     * Clear workspace (reset awareness)
     */
    async clear() {
        console.log('[GlobalWorkspace] Clearing workspace...');

        // Move current contents to history
        for (const item of this.workspace.contents) {
            this.broadcasts.history.push(item);
        }

        this.workspace.contents = [];
        this.workspace.focus = null;
        this.workspace.periphery = [];

        this.broadcasts.active = [];

        console.log('[GlobalWorkspace] Workspace cleared');

        return {
            success: true,
            cleared: true
        };
    }

    /**
     * Get full state
     */
    async getFullState(context = {}) {
        const [integrated, consciousness, workspaceContents] = await Promise.all([
            this.integrate(context),
            this.assessConsciousness(),
            Promise.resolve(this.getContents())
        ]);

        return {
            consciousness,
            workspace: workspaceContents,
            integration: {
                brain: integrated.brainState,
                soul: integrated.soulState,
                spirit: integrated.spiritState,
                coalitions: integrated.coalitions,
                conflicts: integrated.conflicts,
                quality: integrated.integrationQuality
            },
            broadcasts: {
                active: this.broadcasts.active.length,
                historySize: this.broadcasts.history.length
            },
            subscribers: this.subscribers.size,
            timestamp: Date.now()
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        const consciousness = this.assessConsciousness();

        return {
            consciousness: consciousness.state,
            level: (consciousness.level * 100).toFixed(0) + '%',
            clarity: (this.consciousness.clarity * 100).toFixed(0) + '%',
            unity: (this.consciousness.unity * 100).toFixed(0) + '%',
            workspaceUsage: `${this.workspace.contents.length}/${this.workspace.capacity}`,
            coalitions: this.integration.coalitions.length,
            conflicts: this.integration.conflicts.length,
            subscribers: this.subscribers.size
        };
    }
}

module.exports = new GlobalWorkspace();
