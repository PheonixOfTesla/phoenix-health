// Src/routes/butlerRouter.js
// Unified Butler Action Router Routes

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const butlerRouterController = require('../controllers/butlerRouterController');

/**
 * CLASSIFICATION & EXECUTION
 */

// Classify voice command intent
router.post('/classify', protect, butlerRouterController.classifyCommand);

// Execute Butler action
router.post('/execute', protect, butlerRouterController.executeAction);

/**
 * INFORMATION & HISTORY
 */

// Get action history
router.get('/history', protect, butlerRouterController.getActionHistory);

// Get available services
router.get('/services', protect, butlerRouterController.getAvailableServices);

module.exports = router;
