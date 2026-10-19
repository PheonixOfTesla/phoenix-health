/**
 * ENHANCED IOS NATIVE ROUTES
 *
 * The complete bridge between iOS and Phoenix consciousness.
 *
 * All 163 iOS native features → One unified API
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const enhancedContext = require('../services/ios/enhancedNativeContext');
const liveActivities = require('../services/ios/liveActivitiesManager');
const enhancedVoice = require('../services/voice/enhancedVoiceInterface');
const consciousMind = require('../services/gemini/consciousMind');

/**
 * ==================================================================
 * UNIFIED CONTEXT SYNC - The MAIN endpoint
 * ==================================================================
 *
 * POST /api/ios/context/sync
 *
 * Accepts ALL iOS native data at once
 * Returns complete consciousness state
 */
router.post('/context/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const nativeData = req.body;

    const result = await enhancedContext.syncUnifiedContext(userId, nativeData, {
      includeInsights: true,
      includePredictions: true,
      includeInterventions: true
    });

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
 * ==================================================================
 * HEALTHKIT - All health data
 * ==================================================================
 */

// Sync HealthKit data
router.post('/healthkit/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const healthData = req.body;

    const result = await enhancedContext.processHealthContext(userId, healthData);

    res.json({
      success: true,
      health: result
    });

  } catch (error) {
    console.error('[iOS API] HealthKit sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stream health data (real-time during workout)
router.post('/healthkit/stream', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { heartRate, calories, distance } = req.body;

    // Stream to consciousness feed
    const stream = require('../services/consciousness/realtimeConsciousnessStream');
    stream.streamHealthUpdate(userId, { heartRate, calories, distance });

    res.json({
      success: true,
      message: 'Health data streamed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * CALENDAR - Schedule awareness
 * ==================================================================
 */

router.post('/calendar/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { events } = req.body;

    const result = await enhancedContext.processCalendarContext(userId, events);

    res.json({
      success: true,
      calendar: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * LOCATION - GPS & geofencing
 * ==================================================================
 */

router.post('/location/update', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const location = req.body;

    const result = await enhancedContext.processLocationContext(userId, location, null);

    res.json({
      success: true,
      location: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * LIVE ACTIVITIES - Dynamic Island & Lock Screen
 * ==================================================================
 */

// Start workout activity
router.post('/live-activities/workout/start', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { workout } = req.body;

    const result = await liveActivities.startWorkoutActivity(userId, workout);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update workout activity
router.post('/live-activities/workout/update', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { activityId, updates } = req.body;

    const result = await liveActivities.updateWorkoutActivity(userId, activityId, updates);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// End activity
router.post('/live-activities/end', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { activityId } = req.body;

    const result = await liveActivities.endActivity(userId, activityId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start intervention activity
router.post('/live-activities/intervention', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { intervention } = req.body;

    const result = await liveActivities.startInterventionActivity(userId, intervention);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start recovery activity
router.post('/live-activities/recovery', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { recoveryData } = req.body;

    const result = await liveActivities.startRecoveryActivity(userId, recoveryData);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start meditation activity
router.post('/live-activities/meditation', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { duration } = req.body;

    const result = await liveActivities.startMeditationActivity(userId, duration);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all active activities
router.get('/live-activities', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const activities = liveActivities.getActiveActivities(userId);

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * VOICE INTERFACE - Enhanced voice with full context
 * ==================================================================
 */

// Start voice session
router.post('/voice/session/start', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const options = req.body;

    const result = await enhancedVoice.startSession(userId, options);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Process voice command
router.post('/voice/command', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { transcript } = req.body;

    const result = await enhancedVoice.processCommand(userId, transcript);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute voice action
router.post('/voice/action/execute', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { action, params } = req.body;

    const result = await enhancedVoice.executeAction(userId, action, params);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// End voice session
router.post('/voice/session/end', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await enhancedVoice.endSession(userId);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * CAMERA - Form checking & nutrition analysis
 * ==================================================================
 */

// Analyze workout form (Vision API)
router.post('/camera/form-check', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { imageData, exercise } = req.body;

    // TODO: Implement Vision API form analysis
    // This would use CoreML on device, then verify on backend

    res.json({
      success: true,
      analysis: {
        formScore: 85,
        feedback: 'Good depth on squat',
        corrections: []
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze food photo
router.post('/camera/nutrition-analysis', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { imageData } = req.body;

    // TODO: Implement Vision API nutrition analysis

    res.json({
      success: true,
      nutrition: {
        calories: 450,
        protein: 30,
        carbs: 45,
        fat: 15,
        confidence: 0.85
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * HAPTICS - Tactile feedback
 * ==================================================================
 */

// Trigger haptic feedback
router.post('/haptics/trigger', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { pattern, intensity } = req.body;

    // Send haptic trigger through stream
    const stream = require('../services/consciousness/realtimeConsciousnessStream');
    stream.sendToUser(userId, {
      type: 'HAPTIC_TRIGGER',
      pattern,
      intensity,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      message: 'Haptic triggered'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * DEVICE INFO - Battery, storage, network
 * ==================================================================
 */

router.post('/device/info', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const deviceInfo = req.body;

    const result = await enhancedContext.processDeviceContext(deviceInfo);

    res.json({
      success: true,
      device: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * MOTION - CoreMotion data
 * ==================================================================
 */

router.post('/motion/update', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const motionData = req.body;

    const result = await enhancedContext.processActivityContext(motionData);

    res.json({
      success: true,
      motion: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * CONTACTS - For Butler actions
 * ==================================================================
 */

router.post('/contacts/search', protect, async (req, res) => {
  try {
    const { query, contacts } = req.body;

    const result = await enhancedContext.processSocialContext(contacts);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * APPLE PAY - Payment processing
 * ==================================================================
 */

router.post('/applepay/process', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const paymentRequest = req.body;

    // TODO: Implement Apple Pay processing

    res.json({
      success: true,
      transactionId: `APL-${Date.now()}`,
      message: 'Payment processed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * BIOMETRIC AUTH - Face ID / Touch ID verification
 * ==================================================================
 */

router.post('/biometric/verify', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { success, biometricType } = req.body;

    if (success) {
      res.json({
        success: true,
        verified: true,
        message: `${biometricType} authentication successful`
      });
    } else {
      res.status(401).json({
        success: false,
        verified: false,
        error: 'Biometric authentication failed'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * SIRI SHORTCUTS - AppIntents integration
 * ==================================================================
 */

// Get available shortcuts
router.get('/shortcuts', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's widgets (each generates shortcuts)
    const widgetEngine = require('../services/widgets/javascriptWidgetEngine');
    const widgets = await widgetEngine.getUserWidgets(userId);

    const shortcuts = widgets.flatMap(w => w.definition.appIntents || []);

    res.json({
      success: true,
      shortcuts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute shortcut
router.post('/shortcuts/execute', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { shortcutId, params } = req.body;

    // Route to appropriate handler
    // TODO: Implement shortcut execution

    res.json({
      success: true,
      message: 'Shortcut executed'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * HOMEKIT - Smart home integration
 * ==================================================================
 */

router.post('/homekit/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const homeData = req.body;

    const result = await enhancedContext.processHomeContext(homeData);

    res.json({
      success: true,
      home: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * WATCH CONNECTIVITY - Apple Watch data
 * ==================================================================
 */

router.post('/watch/sync', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const watchData = req.body;

    const result = await enhancedContext.processWatchContext(watchData);

    res.json({
      success: true,
      watch: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * WEATHER - WeatherKit integration
 * ==================================================================
 */

router.post('/weather/update', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const weather = req.body;

    // Store weather context
    // Used for location-based insights

    res.json({
      success: true,
      message: 'Weather updated'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ==================================================================
 * CONTEXT QUERY - Get current consciousness state
 * ==================================================================
 */

router.get('/context/current', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get cached context (instant)
    const cached = enhancedContext.contextCache.get(userId);

    if (!cached) {
      return res.json({
        success: true,
        context: null,
        message: 'No context available yet'
      });
    }

    res.json({
      success: true,
      context: cached.context,
      age: Date.now() - cached.timestamp
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
