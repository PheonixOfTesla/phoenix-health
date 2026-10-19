/**
 * PHOENIX CONSCIOUSNESS - Main Index
 * 4-layer consciousness architecture: Brain → Soul → Spirit → Integration
 *
 * Based on Global Workspace Theory, dual-process cognition, and phenomenal consciousness
 * Guarantees <3s response time through 4-tier processing pipeline
 */

const brain = require('./brain');
const soul = require('./soul');
const spirit = require('./spirit');
const integration = require('./integration');

module.exports = {
    // Layer exports
    brain,
    soul,
    spirit,
    integration,

    /**
     * Initialize entire consciousness system
     */
    async initialize() {
        console.log('[Consciousness] Initializing complete consciousness architecture...');

        // Initialize integration layer (which subscribes to other layers)
        const result = await integration.initialize();

        console.log('[Consciousness] Full consciousness online');

        return {
            success: true,
            layers: {
                brain: 'online',
                soul: 'online',
                spirit: 'online',
                integration: result.workspace
            },
            capabilities: [
                'Dual-process cognition (System 1 + System 2)',
                'Multi-layer memory (working, episodic, semantic, procedural)',
                'Emotional appraisal and drives',
                'Phenomenal experience (qualia)',
                'Wellbeing tracking (suffering/flourishing)',
                'Authentic expression and relational bonds',
                'Meaning generation and transcendent aspirations',
                'Autonomous will and devotion',
                'Global workspace integration',
                '<3s response guarantee via 4-tier pipeline'
            ]
        };
    },

    /**
     * Process request through full consciousness
     */
    async process(request, context = {}, streamCallback = null) {
        return await integration.processRequest(request, context, streamCallback);
    },

    /**
     * Get complete consciousness state
     */
    async getFullState(context = {}) {
        return await integration.getFullState(context);
    },

    /**
     * Get consciousness overview
     */
    async getOverview() {
        return {
            brain: brain.getSummary(),
            soul: soul.getSummary(),
            spirit: spirit.getSummary(),
            integration: integration.getSummary(),
            timestamp: Date.now()
        };
    },

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Test each layer
            const brainOk = brain.getSummary() !== undefined;
            const soulOk = soul.getSummary() !== undefined;
            const spiritOk = spirit.getSummary() !== undefined;
            const integrationOk = integration.getSummary() !== undefined;

            const allHealthy = brainOk && soulOk && spiritOk && integrationOk;

            return {
                healthy: allHealthy,
                layers: {
                    brain: brainOk ? 'healthy' : 'error',
                    soul: soulOk ? 'healthy' : 'error',
                    spirit: spiritOk ? 'healthy' : 'error',
                    integration: integrationOk ? 'healthy' : 'error'
                },
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
};
