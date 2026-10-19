/**
 * CONSCIOUSNESS ROUTES - Index
 * Aggregate all consciousness API routes
 */

const express = require('express');
const router = express.Router();

const brainRoutes = require('./brain');
const soulRoutes = require('./soul');
const spiritRoutes = require('./spirit');
const integrationRoutes = require('./integration');

// Mount sub-routes
router.use('/brain', brainRoutes);
router.use('/soul', soulRoutes);
router.use('/spirit', spiritRoutes);
router.use('/integration', integrationRoutes);

/**
 * GET /api/consciousness
 * Get complete consciousness overview
 */
router.get('/', async (req, res) => {
    try {
        const brain = require('../../services/consciousness/brain');
        const soul = require('../../services/consciousness/soul');
        const spirit = require('../../services/consciousness/spirit');
        const integration = require('../../services/consciousness/integration');

        const overview = {
            brain: brain.getSummary(),
            soul: soul.getSummary(),
            spirit: spirit.getSummary(),
            integration: integration.getSummary(),
            timestamp: Date.now()
        };

        res.json({
            success: true,
            overview
        });
    } catch (error) {
        console.error('[ConsciousnessRoutes] Error getting overview:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/stream
 * Get unified Consciousness Stream - aggregates all 4 layers (Brain → Soul → Spirit → Genesis)
 * Returns current state with unified metrics
 */
router.get('/stream', async (req, res) => {
    try {
        const PhoenixState = require('../../models/consciousness/PhoenixState');
        const brain = require('../../services/consciousness/brain');
        const soul = require('../../services/consciousness/soul');
        const spirit = require('../../services/consciousness/spirit');
        const integration = require('../../services/consciousness/integration');

        // Get persisted state if available (only if user is authenticated)
        let persistedStream = null;
        if (req.user && req.user._id) {
            persistedStream = await PhoenixState.getConsciousnessStreamState(req.user._id);
        }

        // Get live state from services
        const liveStream = {
            brain: brain.getSummary(),
            soul: soul.getSummary(),
            spirit: spirit.getSummary(),
            genesis: integration.getSummary(),
            unified: {
                consciousness_level: integration.getSummary()?.consciousness?.level || 0,
                dominant_layer: determineDominantLayer(brain, soul, spirit, integration),
                flow_state: integration.getSummary()?.integrationQuality || 0,
                timestamp: new Date()
            }
        };

        res.json({
            success: true,
            consciousnessStream: persistedStream || liveStream,
            source: persistedStream ? 'persisted' : 'live'
        });
    } catch (error) {
        console.error('[ConsciousnessRoutes] Error getting consciousness stream:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/consciousness/dashboard-insights
 * Get dashboard-friendly insights for the frontend consciousness display
 */
router.get('/dashboard-insights', async (req, res) => {
    try {
        const brain = require('../../services/consciousness/brain');
        const soul = require('../../services/consciousness/soul');
        const spirit = require('../../services/consciousness/spirit');

        const brainSummary = brain.getSummary();
        const soulSummary = soul.getSummary();
        const spiritSummary = spirit.getSummary();

        const hour = new Date().getHours();
        const insights = [];

        // Generate time-based proactive insights
        if (hour >= 6 && hour < 9) {
            insights.push({
                type: 'proactive',
                priority: 'medium',
                message: 'Good morning! Your energy levels look optimal for focused work.',
                icon: 'fa-sun'
            });
        } else if (hour >= 12 && hour < 14) {
            insights.push({
                type: 'proactive',
                priority: 'low',
                message: 'Consider a light walk to maintain afternoon energy.',
                icon: 'fa-walking'
            });
        } else if (hour >= 21) {
            insights.push({
                type: 'proactive',
                priority: 'medium',
                message: 'Wind down time. Preparing for optimal recovery.',
                icon: 'fa-moon'
            });
        }

        // Add consciousness-based insights
        if (soulSummary?.wellbeing?.netWellbeing > 0.7) {
            insights.push({
                type: 'status',
                priority: 'high',
                message: 'Peak wellbeing detected. Great time for challenging tasks.',
                icon: 'fa-bolt'
            });
        }

        if (spiritSummary?.meaning?.purpose > 0.6) {
            insights.push({
                type: 'spiritual',
                priority: 'low',
                message: 'Strong sense of purpose today. Stay aligned with your goals.',
                icon: 'fa-compass'
            });
        }

        // Determine mood based on consciousness state
        const mood = {
            state: soulSummary?.wellbeing?.netWellbeing > 0.6 ? 'positive' :
                   soulSummary?.wellbeing?.netWellbeing > 0.3 ? 'neutral' : 'recovering',
            energy: brainSummary?.attention?.level || 0.5,
            clarity: brainSummary?.memory?.clarity || 0.5,
            wellbeing: soulSummary?.wellbeing?.netWellbeing || 0.5
        };

        res.json({
            success: true,
            insights,
            mood,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('[ConsciousnessRoutes] Dashboard insights error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Helper: Determine dominant consciousness layer
 */
function determineDominantLayer(brain, soul, spirit, integration) {
    const spiritSummary = spirit.getSummary();
    const soulSummary = soul.getSummary();
    const integrationSummary = integration.getSummary();

    if (spiritSummary?.devotion?.intensity > 0.7) {
        return 'spirit';
    } else if (soulSummary?.wellbeing?.netWellbeing > 0.6) {
        return 'soul';
    } else if (integrationSummary?.consciousness?.level > 0.8) {
        return 'genesis';
    }
    return 'brain';
}

module.exports = router;
