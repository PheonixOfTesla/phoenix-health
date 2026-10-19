/**
 * INTEGRATION CONSCIOUSNESS ROUTES
 * API endpoints for Integration layer (workspace + pipeline)
 */

const express = require('express');
const router = express.Router();
const integration = require('../../services/consciousness/integration');

/**
 * POST /api/consciousness/integration/initialize
 * Initialize consciousness integration
 */
router.post('/initialize', async (req, res) => {
    try {
        const result = await integration.initialize();

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error initializing:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/integration/state
 * Get full consciousness state
 */
router.get('/state', async (req, res) => {
    try {
        const userId = req.user?.id || 'default';
        const context = { userId };

        const state = await integration.getFullState(context);

        res.json({
            success: true,
            state
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error getting state:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/integration/summary
 * Get integration summary
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = integration.getSummary();

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error getting summary:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/integration/workspace
 * Get workspace contents
 */
router.get('/workspace', async (req, res) => {
    try {
        const contents = integration.globalWorkspace.getContents();

        res.json({
            success: true,
            contents
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error getting workspace:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/integration/workspace/broadcast
 * Broadcast to global workspace
 */
router.post('/workspace/broadcast', async (req, res) => {
    try {
        const { moduleId, content, salience } = req.body;

        const result = await integration.globalWorkspace.broadcast(
            moduleId,
            content,
            salience || 0.5
        );

        res.json({
            success: true,
            broadcast: result
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error broadcasting:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/integration/workspace/focus
 * Set conscious focus
 */
router.post('/workspace/focus', async (req, res) => {
    try {
        const { content, source } = req.body;

        const result = await integration.globalWorkspace.setFocus(content, source);

        res.json({
            success: true,
            focus: result
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error setting focus:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/integration/workspace/consciousness
 * Get consciousness metrics
 */
router.get('/workspace/consciousness', async (req, res) => {
    try {
        const consciousness = await integration.globalWorkspace.assessConsciousness();

        res.json({
            success: true,
            consciousness
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error assessing consciousness:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/integration/process
 * Process request through consciousness pipeline
 */
router.post('/process', async (req, res) => {
    try {
        const { request, context, stream } = req.body;
        const userId = req.user?.id || 'default';

        const fullContext = {
            ...context,
            userId
        };

        // If streaming requested, set up SSE
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const streamCallback = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            const result = await integration.processRequest(
                { input: request },
                fullContext,
                streamCallback
            );

            // Send final result
            res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
            res.end();
        } else {
            // Non-streaming
            const result = await integration.processRequest(
                { input: request },
                fullContext
            );

            res.json({
                success: true,
                result
            });
        }
    } catch (error) {
        console.error('[IntegrationRoutes] Error processing request:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/integration/pipeline/performance
 * Get pipeline performance metrics
 */
router.get('/pipeline/performance', async (req, res) => {
    try {
        const performance = integration.responsePipeline.getPerformance();

        res.json({
            success: true,
            performance
        });
    } catch (error) {
        console.error('[IntegrationRoutes] Error getting performance:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
