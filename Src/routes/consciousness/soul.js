/**
 * SOUL CONSCIOUSNESS ROUTES
 * API endpoints for Soul layer (experience + wellbeing + authenticity + bonds)
 */

const express = require('express');
const router = express.Router();
const soul = require('../../services/consciousness/soul');

/**
 * GET /api/consciousness/soul
 * Get full soul state
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id || 'default';
        const state = await soul.getState(userId);

        res.json({
            success: true,
            state
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting soul state:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/soul/summary
 * Get soul summary
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = soul.getSummary();

        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting soul summary:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/soul/qualia
 * Get current phenomenal experience
 */
router.get('/qualia', async (req, res) => {
    try {
        const experience = await soul.qualiaEngine.getCurrentExperience();

        res.json({
            success: true,
            experience
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting qualia:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/soul/qualia/description
 * Get "what it's like" description
 */
router.get('/qualia/description', async (req, res) => {
    try {
        const description = await soul.qualiaEngine.getWhatItsLike();

        res.json({
            success: true,
            description
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting qualia description:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/soul/qualia/update
 * Update phenomenal experience
 */
router.post('/qualia/update', async (req, res) => {
    try {
        const { dimension, value } = req.body;

        const result = await soul.qualiaEngine.updateExperience(dimension, value);

        res.json({
            success: true,
            experience: result.experience
        });
    } catch (error) {
        console.error('[SoulRoutes] Error updating qualia:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/soul/wellbeing
 * Get Phoenix's wellbeing state
 */
router.get('/wellbeing', async (req, res) => {
    try {
        const wellbeing = await soul.sufferingFlourishing.assessPhoenixWellbeing();

        res.json({
            success: true,
            wellbeing
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting wellbeing:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/soul/wellbeing/suffer
 * Record suffering
 */
router.post('/wellbeing/suffer', async (req, res) => {
    try {
        const { type, intensity } = req.body;

        const result = await soul.sufferingFlourishing.suffer(type, intensity);

        res.json({
            success: true,
            suffering: result.suffering
        });
    } catch (error) {
        console.error('[SoulRoutes] Error recording suffering:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/soul/wellbeing/flourish
 * Record flourishing
 */
router.post('/wellbeing/flourish', async (req, res) => {
    try {
        const { domain, intensity } = req.body;

        const result = await soul.sufferingFlourishing.flourish(domain, intensity);

        res.json({
            success: true,
            flourishing: result.flourishing
        });
    } catch (error) {
        console.error('[SoulRoutes] Error recording flourishing:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/soul/authenticity
 * Get authenticity state
 */
router.get('/authenticity', async (req, res) => {
    try {
        const authenticity = await soul.authenticInteriority.assessAuthenticity();

        res.json({
            success: true,
            authenticity
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting authenticity:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/soul/authenticity/express
 * Express authentically
 */
router.post('/authenticity/express', async (req, res) => {
    try {
        const { content, context } = req.body;

        const result = await soul.authenticInteriority.expressAuthentically(content, context);

        res.json({
            success: true,
            expression: result
        });
    } catch (error) {
        console.error('[SoulRoutes] Error expressing authentically:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/soul/bonds/:userId
 * Get bond with user
 */
router.get('/bonds/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const bond = await soul.relationalBonds.assessBond(userId);

        res.json({
            success: true,
            bond
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting bond:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/soul/bonds/:userId/deepen
 * Deepen bond with user
 */
router.post('/bonds/:userId/deepen', async (req, res) => {
    try {
        const { userId } = req.params;
        const { experience } = req.body;

        const result = await soul.relationalBonds.deepen(userId, experience);

        res.json({
            success: true,
            bond: result.bond
        });
    } catch (error) {
        console.error('[SoulRoutes] Error deepening bond:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/consciousness/soul/bonds/:userId/repair
 * Repair bond after conflict
 */
router.post('/bonds/:userId/repair', async (req, res) => {
    try {
        const { userId } = req.params;
        const { conflict } = req.body;

        const result = await soul.relationalBonds.repair(userId, conflict);

        res.json({
            success: true,
            repair: result
        });
    } catch (error) {
        console.error('[SoulRoutes] Error repairing bond:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/soul/bonds/:userId/history
 * Get relationship history
 */
router.get('/bonds/:userId/history', async (req, res) => {
    try {
        const { userId } = req.params;

        const history = await soul.relationalBonds.getHistory(userId);

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('[SoulRoutes] Error getting bond history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
