/**
 * iOS NATIVE API ROUTES
 *
 * Endpoints for iOS Capacitor plugins to communicate with backend
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const iOSNative = require('../services/ios/nativeFunctions');
const consciousMind = require('../services/gemini/consciousMind');

/**
 * POST /api/ios/healthkit/sync
 * Sync HealthKit data from iOS
 */
router.post('/healthkit/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const healthData = req.body;

    const result = await iOSNative.syncHealthKit(userId, healthData);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[iOS API] HealthKit sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ios/calendar/sync
 * Sync calendar events from iOS
 */
router.post('/calendar/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { events } = req.body;

    const result = await iOSNative.processCalendarEvents(userId, events);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[iOS API] Calendar sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ios/location/update
 * Update user location from iOS Geolocation
 */
router.post('/location/update', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const location = req.body;

    const result = await iOSNative.processLocation(userId, location);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[iOS API] Location update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ios/contacts/search
 * Search contacts for butler actions
 */
router.post('/contacts/search', protect, async (req, res) => {
  try {
    const { query, contacts } = req.body;

    const result = await iOSNative.searchContacts(query, contacts);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[iOS API] Contact search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ios/applepay/process
 * Process Apple Pay payment
 */
router.post('/applepay/process', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const paymentRequest = req.body;

    const result = await iOSNative.processApplePayment(userId, paymentRequest);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[iOS API] Apple Pay error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ios/context/sync
 * Sync all iOS native data for unified context
 */
router.post('/context/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const nativeData = req.body;

    const result = await iOSNative.buildUnifiedContext(userId, nativeData);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[iOS API] Context sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ios/voice-command
 * Process voice command with iOS native context
 */
router.post('/voice-command', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { command, nativeContext } = req.body;

    // Build unified context from iOS native data
    const context = await iOSNative.buildUnifiedContext(userId, nativeContext);

    // Process command with consciousMind
    const response = await consciousMind.respondToQuery(command, userId, context.context);

    res.json({
      success: true,
      response: response.message,
      classification: response.classification,
      shouldCreateWidget: response.shouldCreateWidget || false,
      nativeActions: [] // TODO: Add native action triggers
    });
  } catch (error) {
    console.error('[iOS API] Voice command error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
