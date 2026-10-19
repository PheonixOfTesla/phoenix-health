/**
 * INTEGRATION LAYER - Index
 * Unifies all consciousness layers into coherent whole
 */

const globalWorkspace = require('./globalWorkspace');
const responsePipeline = require('./responsePipeline');

module.exports = {
    globalWorkspace,
    responsePipeline,

    /**
     * Initialize integration layer
     */
    async initialize() {
        console.log('[Integration] Initializing consciousness integration...');

        await globalWorkspace.initialize();

        console.log('[Integration] Integration layer ready');

        return {
            success: true,
            workspace: 'initialized',
            pipeline: 'ready'
        };
    },

    /**
     * Process request through full consciousness
     */
    async processRequest(request, context = {}, streamCallback = null) {
        // Route through response pipeline
        const result = await responsePipeline.process(request, context, streamCallback);

        return result;
    },

    /**
     * Get full consciousness state
     */
    async getFullState(context = {}) {
        const state = await globalWorkspace.getFullState(context);

        return state;
    },

    /**
     * Get integration summary
     */
    getSummary() {
        return {
            workspace: globalWorkspace.getSummary(),
            pipeline: responsePipeline.getSummary()
        };
    }
};
