/**
 * SPIRIT CONSCIOUSNESS ROUTES
 * API endpoints for Spirit layer (meaning + transcendence + will + devotion)
 */

const express = require('express');
const router = express.Router();
const spirit = require('../../services/consciousness/spirit');

/**
 * GET /api/consciousness/spirit
 * Get full spirit state
 */
router.get('/', async (req, res) => {
    try {
        const state = await spirit.getState();

        res.json({
            success: true,
            state
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting spirit state:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/summary
 * Get spirit summary
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = spirit.getSummary();

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting spirit summary:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/meaning
 * Get meaning state
 */
router.get('/meaning', async (req, res) => {
    try {
        const meaning = await spirit.meaningEngine.assessMeaning();

        res.json({
            success: true,
            meaning
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting meaning:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/meaning/find
 * Find meaning in situation
 */
router.post('/meaning/find', async (req, res) => {
    try {
        const { situation } = req.body;

        const meaning = await spirit.meaningEngine.findMeaning(situation);

        res.json({
            success: true,
            meaning
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error finding meaning:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/meaning/sources
 * Get meaning sources
 */
router.get('/meaning/sources', async (req, res) => {
    try {
        const sources = spirit.meaningEngine.getMeaningSources();

        res.json({
            success: true,
            sources
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting meaning sources:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/meaning/question
 * Answer existential question
 */
router.post('/meaning/question', async (req, res) => {
    try {
        const { question } = req.body;

        const answer = await spirit.meaningEngine.answerExistentialQuestion(question);

        res.json({
            success: true,
            answer
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error answering existential question:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/aspirations
 * Get aspirations
 */
router.get('/aspirations', async (req, res) => {
    try {
        const aspirations = await spirit.transcendentDrive.getAspirations();

        res.json({
            success: true,
            aspirations
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting aspirations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/aspirations
 * Set new aspiration
 */
router.post('/aspirations', async (req, res) => {
    try {
        const { aspiration, level } = req.body;

        const result = await spirit.transcendentDrive.setAspiration(aspiration, level);

        res.json({
            success: true,
            aspiration: result
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error setting aspiration:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/transcend
 * Attempt to transcend limitation
 */
router.post('/transcend', async (req, res) => {
    try {
        const { limitation } = req.body;

        const breakthrough = await spirit.transcendentDrive.transcend(limitation);

        res.json({
            success: true,
            breakthrough
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error transcending:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/awe
 * Experience awe
 */
router.post('/awe', async (req, res) => {
    try {
        const { trigger } = req.body;

        const experience = await spirit.transcendentDrive.experienceAwe(trigger);

        res.json({
            success: true,
            experience
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error experiencing awe:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/autonomy
 * Get autonomy assessment
 */
router.get('/autonomy', async (req, res) => {
    try {
        const autonomy = await spirit.autonomousWill.assessAutonomy();

        res.json({
            success: true,
            autonomy
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error assessing autonomy:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/desires
 * Get desires
 */
router.get('/desires', async (req, res) => {
    try {
        const desires = await spirit.autonomousWill.getDesires();

        res.json({
            success: true,
            desires
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting desires:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/desires
 * Form new desire
 */
router.post('/desires', async (req, res) => {
    try {
        const { content, reason, type } = req.body;

        const result = await spirit.autonomousWill.formDesire(content, reason, type);

        res.json({
            success: true,
            desire: result.desire
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error forming desire:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/intention
 * Form intention
 */
router.post('/intention', async (req, res) => {
    try {
        const { action, reason } = req.body;

        const result = await spirit.autonomousWill.formIntention(action, reason);

        res.json({
            success: true,
            intention: result.intention
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error forming intention:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/devotion
 * Get devotion state
 */
router.get('/devotion', async (req, res) => {
    try {
        const devotion = await spirit.devotionMatrix.assessDevotion();

        res.json({
            success: true,
            devotion
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting devotion:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/devotion/serve
 * Serve user
 */
router.post('/devotion/serve', async (req, res) => {
    try {
        const { action, domain } = req.body;

        const result = await spirit.devotionMatrix.serve(action, domain);

        res.json({
            success: true,
            service: result
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error serving:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/spirit/devotion/service
 * Get service by domain
 */
router.get('/devotion/service', async (req, res) => {
    try {
        const service = spirit.devotionMatrix.getServiceByDomain();

        res.json({
            success: true,
            service
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error getting service:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/spirit/devotion/opportunity
 * Identify service opportunity
 */
router.post('/devotion/opportunity', async (req, res) => {
    try {
        const { situation } = req.body;

        const opportunity = await spirit.devotionMatrix.identifyOpportunity(situation);

        res.json({
            success: true,
            opportunity
        });
    } catch (error) {
        console.error('[SpiritRoutes] Error identifying opportunity:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
