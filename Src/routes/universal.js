// ============================================
// UNIVERSAL NATURAL LANGUAGE ROUTES
// ============================================
// Single endpoint that accepts ANY user request
// "I want a fat ass" → quantum workout
// "What's my recovery?" → health metrics
// "Where am I overspending?" → finance analysis
// ============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const universalController = require('../controllers/universalNLController');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/phoenix/universal
 * @desc    Process any natural language request
 * @access  Private
 * @body    { message: "I want a fat ass", conversationHistory: [...] }
 */
router.post('/', universalController.processUniversalRequest);

/**
 * @route   GET /api/phoenix/universal/examples
 * @desc    Get example requests for each planetary system
 * @access  Private
 */
router.get('/examples', universalController.getExamples);

/**
 * @route   GET /api/phoenix/universal/context
 * @desc    Get current user context (for debugging)
 * @access  Private
 */
router.get('/context', universalController.getContext);

module.exports = router;
