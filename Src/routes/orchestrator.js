/**
 * HOLISTIC ORCHESTRATOR ROUTES
 * Autonomous cross-domain optimization endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const orchestratorController = require('../controllers/orchestratorController');

// ==============================================
// PLAN CREATION & MANAGEMENT
// ==============================================

// Create holistic optimization plan
router.post('/optimize', protect, orchestratorController.createPlan);

// Get all plans for user
router.get('/plans', protect, orchestratorController.getAllPlans);

// Get specific plan
router.get('/plans/:planId', protect, orchestratorController.getPlan);

// Get plan statistics
router.get('/stats', protect, orchestratorController.getStats);

// ==============================================
// PLAN EXECUTION
// ==============================================

// Execute entire plan
router.post('/plans/:planId/execute', protect, orchestratorController.executePlan);

// Execute next action in plan
router.post('/plans/:planId/execute-next', protect, orchestratorController.executeNextAction);

// ==============================================
// PLAN CONTROL
// ==============================================

// Pause plan
router.post('/plans/:planId/pause', protect, orchestratorController.pausePlan);

// Resume plan
router.post('/plans/:planId/resume', protect, orchestratorController.resumePlan);

// Cancel plan (delete)
router.delete('/plans/:planId', protect, orchestratorController.cancelPlan);

// ==============================================
// ANALYSIS
// ==============================================

// Analyze all domains (without creating plan)
router.get('/analyze', protect, orchestratorController.analyzeDomains);

module.exports = router;
