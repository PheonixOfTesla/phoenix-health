const express = require('express');
const router = express.Router();
const neptuneController = require('../controllers/neptuneController');
const { protect } = require('../middleware/auth');

// Mindfulness & Dreams - Mental Wellness (10+ endpoints)
router.get('/meditation/sessions', protect, neptuneController.getMeditationSessions);
router.post('/meditation/log', protect, neptuneController.logMeditation);
router.get('/meditation/stats', protect, neptuneController.getMeditationStats);
router.get('/dreams/log', protect, neptuneController.getDreamLog);
router.post('/dreams/record', protect, neptuneController.recordDream);
router.get('/dreams/analysis', protect, neptuneController.analyzeDreams);
router.get('/mindfulness/score', protect, neptuneController.getMindfulnessScore);
router.post('/mindfulness/exercise', protect, neptuneController.logMindfulnessExercise);
router.get('/stress/levels', protect, neptuneController.getStressLevels);
router.get('/mental/wellness', protect, neptuneController.getMentalWellnessReport);

module.exports = router;
