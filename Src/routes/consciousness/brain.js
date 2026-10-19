/**
 * BRAIN CONSCIOUSNESS ROUTES
 * API endpoints for Brain layer (cognition + memory + affect)
 */

const express = require('express');
const router = express.Router();
const brain = require('../../services/consciousness/brain');

/**
 * GET /api/consciousness/brain
 * Get full brain state
 */
router.get('/', async (req, res) => {
    try {
        const state = await brain.getState(req.user?.id);

        res.json({
            success: true,
            state
        });
    } catch (error) {
        console.error('[BrainRoutes] Error getting brain state:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/brain/summary
 * Get brain summary
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = brain.getSummary();

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('[BrainRoutes] Error getting brain summary:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/brain/attention
 * Get current attention state
 */
router.get('/attention', async (req, res) => {
    try {
        const focus = await brain.attention.getCurrentFocus();

        res.json({
            success: true,
            focus
        });
    } catch (error) {
        console.error('[BrainRoutes] Error getting attention:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/attention/allocate
 * Allocate attention to stimuli
 */
router.post('/attention/allocate', async (req, res) => {
    try {
        const { stimuli, context } = req.body;

        const allocation = await brain.attention.allocateAttention(stimuli, context);

        res.json({
            success: true,
            allocation
        });
    } catch (error) {
        console.error('[BrainRoutes] Error allocating attention:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/brain/goals
 * Get active goals
 */
router.get('/goals', async (req, res) => {
    try {
        const goals = brain.goalManager.getActiveGoals();

        res.json({
            success: true,
            goals
        });
    } catch (error) {
        console.error('[BrainRoutes] Error getting goals:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/goals
 * Add new goal
 */
router.post('/goals', async (req, res) => {
    try {
        const { description, level, importance } = req.body;

        const result = await brain.goalManager.addGoal(description, level, importance);

        res.json({
            success: true,
            goal: result.goal
        });
    } catch (error) {
        console.error('[BrainRoutes] Error adding goal:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/decide
 * Make a decision
 */
router.post('/decide', async (req, res) => {
    try {
        const { options, criteria, context } = req.body;

        const decision = await brain.decisionEngine.decide(options, criteria, context);

        res.json({
            success: true,
            decision
        });
    } catch (error) {
        console.error('[BrainRoutes] Error making decision:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/brain/memory/working
 * Get working memory contents
 */
router.get('/memory/working', async (req, res) => {
    try {
        const contents = brain.memory.workingMemory.getContents();

        res.json({
            success: true,
            contents
        });
    } catch (error) {
        console.error('[BrainRoutes] Error getting working memory:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/memory/episodic
 * Store episodic memory
 */
router.post('/memory/episodic', async (req, res) => {
    try {
        const { episode } = req.body;

        const result = await brain.memory.episodicMemory.store(episode);

        res.json({
            success: true,
            episodeId: result.episodeId
        });
    } catch (error) {
        console.error('[BrainRoutes] Error storing episode:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/brain/memory/episodic/search
 * Search episodic memories
 */
router.get('/memory/episodic/search', async (req, res) => {
    try {
        const { query, limit } = req.query;

        const results = await brain.memory.episodicMemory.search(
            query,
            parseInt(limit) || 10
        );

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('[BrainRoutes] Error searching episodes:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/brain/emotions
 * Get current emotional state
 */
router.get('/emotions', async (req, res) => {
    try {
        const emotion = await brain.affect.emotionalAppraisal.getCurrentEmotion();

        res.json({
            success: true,
            emotion
        });
    } catch (error) {
        console.error('[BrainRoutes] Error getting emotions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/emotions/appraise
 * Appraise situation emotionally
 */
router.post('/emotions/appraise', async (req, res) => {
    try {
        const { situation, context } = req.body;

        const appraisal = await brain.affect.emotionalAppraisal.appraise(situation, context);

        res.json({
            success: true,
            appraisal
        });
    } catch (error) {
        console.error('[BrainRoutes] Error appraising situation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/brain/drives
 * Get active drives
 */
router.get('/drives', async (req, res) => {
    try {
        const drives = await brain.affect.driveSystem.getActiveUrges();

        res.json({
            success: true,
            drives
        });
    } catch (error) {
        console.error('[BrainRoutes] Error getting drives:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/system1
 * Get fast System 1 response
 */
router.post('/system1', async (req, res) => {
    try {
        const { input } = req.body;

        const response = await brain.system1.respond(input);

        res.json({
            success: true,
            response
        });
    } catch (error) {
        console.error('[BrainRoutes] Error in System 1:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/system2
 * Get deliberate System 2 reasoning
 */
router.post('/system2', async (req, res) => {
    try {
        const { problem, context } = req.body;

        const reasoning = await brain.system2.reason(problem, context);

        res.json({
            success: true,
            reasoning
        });
    } catch (error) {
        console.error('[BrainRoutes] Error in System 2:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/metacognition/assess
 * Assess confidence in claim
 */
router.post('/metacognition/assess', async (req, res) => {
    try {
        const { claim, evidence } = req.body;

        const assessment = await brain.metaCognition.assessConfidence(claim, evidence);

        res.json({
            success: true,
            assessment
        });
    } catch (error) {
        console.error('[BrainRoutes] Error in metacognition:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/brain/theory-of-mind/infer
 * Infer user's belief
 */
router.post('/theory-of-mind/infer', async (req, res) => {
    try {
        const { statement, context } = req.body;
        const userId = req.user?.id || 'default';

        const belief = await brain.theoryOfMind.inferBelief(statement, context, userId);

        res.json({
            success: true,
            belief
        });
    } catch (error) {
        console.error('[BrainRoutes] Error inferring belief:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
