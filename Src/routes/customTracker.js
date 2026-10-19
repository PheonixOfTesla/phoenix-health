/**
 * CUSTOM TRACKER ROUTES
 * Generic API for AI-generated tracking widgets
 * Handles any custom tracking widget dynamically
 */

const express = require('express');
const router = express.Router();
const customTrackerController = require('../controllers/customTrackerController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   POST /api/custom-tracker/:widgetId/log
 * @desc    Log entry for any custom tracker
 * @access  Private
 */
router.post('/:widgetId/log', customTrackerController.logEntry);

/**
 * @route   POST /api/custom-tracker/:widgetId/:actionName
 * @desc    Execute custom action for a widget
 * @access  Private
 */
router.post('/:widgetId/:actionName', customTrackerController.executeAction);

/**
 * @route   GET /api/custom-tracker/:widgetId/history
 * @desc    Get history for a custom tracker
 * @access  Private
 */
router.get('/:widgetId/history', customTrackerController.getHistory);

/**
 * @route   GET /api/custom-tracker/:widgetId/stats
 * @desc    Get statistics for a custom tracker
 * @access  Private
 */
router.get('/:widgetId/stats', customTrackerController.getStats);

/**
 * @route   DELETE /api/custom-tracker/:widgetId/entry/:entryId
 * @desc    Delete entry from custom tracker
 * @access  Private
 */
router.delete('/:widgetId/entry/:entryId', customTrackerController.deleteEntry);

/**
 * @route   GET /api/custom-tracker/user/all
 * @desc    Get all custom trackers for current user
 * @access  Private
 */
router.get('/user/all', customTrackerController.getAllUserTrackers);

module.exports = router;
