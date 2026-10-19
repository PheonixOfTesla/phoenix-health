/**
 * COACH ROUTES - User-facing coach features
 * Handles coach applications and coach-specific functionality
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const coachController = require('../controllers/coachController');

// All routes require authentication
router.use(protect);

// Coach Application
router.post('/apply', coachController.applyToBeCoach);
router.get('/application-status', coachController.getApplicationStatus);
router.put('/application', coachController.updateApplication);

module.exports = router;
