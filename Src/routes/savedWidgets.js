/**
 * SAVED WIDGETS ROUTES
 * API endpoints for widget persistence and management
 */

const express = require('express');
const router = express.Router();
const savedWidgetController = require('../controllers/savedWidgetController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

/**
 * Widget CRUD Operations
 */

// Create new widget
router.post('/', validate('createWidget'), savedWidgetController.createWidget);

// Generate widget from AI
router.post('/generate', validate('generateWidget'), savedWidgetController.generateWidget);

// Get all widget templates
router.get('/templates', savedWidgetController.getAllTemplates);

// Search widget templates
router.get('/templates/search', savedWidgetController.searchTemplates);

// Get templates by category
router.get('/templates/category/:category', savedWidgetController.getTemplatesByCategory);

// Create widget from template
router.post('/from-template/:templateId', savedWidgetController.createFromTemplate);

// Get all widgets for user
router.get('/', savedWidgetController.getAllWidgets);

// Get user widget statistics
router.get('/stats', savedWidgetController.getStats);

// Get enabled widgets
router.get('/enabled', savedWidgetController.getEnabledWidgets);

// Get inactive widgets
router.get('/inactive', savedWidgetController.getInactiveWidgets);

// Get single widget
router.get('/:widgetId', savedWidgetController.getWidget);

// Update widget
router.put('/:widgetId', validate('updateWidget'), savedWidgetController.updateWidget);

// Delete widget permanently
router.delete('/:widgetId', savedWidgetController.deleteWidget);

/**
 * Widget Actions
 */

// Toggle widget enabled/disabled
router.post('/:widgetId/toggle', savedWidgetController.toggleWidget);

// Pin/unpin widget
router.post('/:widgetId/pin', savedWidgetController.pinWidget);

// Archive widget
router.post('/:widgetId/archive', savedWidgetController.archiveWidget);

// Restore archived widget
router.post('/:widgetId/restore', savedWidgetController.restoreWidget);

// Record widget usage
router.post('/:widgetId/use', savedWidgetController.recordUsage);

module.exports = router;
