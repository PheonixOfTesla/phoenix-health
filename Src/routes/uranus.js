const express = require('express');
const router = express.Router();
const uranusController = require('../controllers/uranusController');
const { protect } = require('../middleware/auth');

// Innovation & Learning - Analytics/Insights (10+ endpoints)
router.get('/insights', protect, uranusController.getInsights);
router.get('/insights/trends', protect, uranusController.getTrends);
router.get('/insights/predictions', protect, uranusController.getPredictions);
router.get('/analytics/performance', protect, uranusController.getPerformanceAnalytics);
router.get('/analytics/patterns', protect, uranusController.getPatterns);
router.post('/learning/log', protect, uranusController.logLearning);
router.get('/learning/progress', protect, uranusController.getLearningProgress);
router.get('/innovation/suggestions', protect, uranusController.getInnovationSuggestions);
router.post('/data/export', protect, uranusController.exportData);
router.get('/reports/generate', protect, uranusController.generateReport);

module.exports = router;
