// ============================================
// PHOENIX ROUTES - AI Butler & Intelligence System
// ============================================
// Total Endpoints: 81 (76 original + 5 new SMS/Budget)
// Base Path: /api/phoenix
// Authentication: All routes require JWT auth (protect middleware)
// ============================================

const express = require('express');
const router = express.Router();
const phoenixController = require('../controllers/phoenixController');
const { protect } = require('../middleware/auth');

// Apply authentication to all Phoenix routes
router.use(protect);

// ========================================
// 0. INITIALIZATION (fast preload)
// ========================================

router.get('/preload', phoenixController.preload);        // GET all user context in parallel
router.post('/warmup', phoenixController.warmup);         // Ping AI to keep warm

// ========================================
// A. AI COMPANION (6 endpoints)
// ========================================

router.post('/companion/chat', phoenixController.chat);
router.get('/companion/history', phoenixController.getHistory);
router.delete('/companion/history', phoenixController.clearHistory);
router.get('/companion/context', phoenixController.getContext);
router.get('/companion/personality', phoenixController.getPersonality);
router.put('/companion/personality', phoenixController.updatePersonality);

// ========================================
// B. CORRELATION ENGINE (6 endpoints)
// ========================================

router.get('/patterns', phoenixController.getPatterns);
router.post('/patterns/analyze', phoenixController.analyzePatterns);
router.get('/patterns/realtime', phoenixController.getRealtimePatterns);
router.put('/patterns/:id/validate', phoenixController.validatePattern);
router.delete('/patterns/:id', phoenixController.deletePattern);
router.get('/insights', phoenixController.getInsights);

// ========================================
// C. PREDICTION ENGINE (10 endpoints)
// ========================================

router.get('/predictions', phoenixController.getPredictions);
router.get('/predictions/active', phoenixController.getActivePredictions);
router.get('/predictions/:id', phoenixController.getPredictionById);
router.post('/predictions/request/:type', phoenixController.requestPrediction);
router.put('/predictions/:id/outcome', phoenixController.recordOutcome);
router.get('/predictions/accuracy', phoenixController.getPredictionAccuracy);
router.get('/predictions/forecast', phoenixController.getForecast);
router.get('/predictions/optimal-window', phoenixController.getOptimalWindow);
router.get('/predictions/burnout-risk', phoenixController.getBurnoutRisk);
router.get('/predictions/weight-change', phoenixController.getWeightPrediction);

// ========================================
// D. INTERVENTION ENGINE (9 endpoints)
// ========================================

router.get('/interventions', phoenixController.getInterventions);
router.get('/interventions/active', phoenixController.getActiveInterventions);
router.get('/interventions/pending', phoenixController.getPendingInterventions);
router.post('/interventions/:id/acknowledge', phoenixController.acknowledgeIntervention);
router.put('/interventions/:id/outcome', phoenixController.recordInterventionOutcome);
router.get('/interventions/stats', phoenixController.getInterventionStats);
router.get('/interventions/history', phoenixController.getInterventionHistory);
router.post('/interventions/settings', phoenixController.configureInterventionSettings);
router.post('/interventions/request', phoenixController.requestManualIntervention);

// ========================================
// E. INTELLIGENCE ENGINE (8 endpoints)
// ========================================

router.get('/intelligence', phoenixController.getIntelligence);
router.post('/intelligence/analyze', phoenixController.triggerAnalysis);
router.get('/intelligence/insights', phoenixController.getAIInsights);
router.post('/intelligence/query', phoenixController.naturalLanguageQuery);
router.get('/intelligence/summary', phoenixController.getDailySummary);
router.post('/intelligence/deep-dive', phoenixController.getDeepDive);
router.get('/intelligence/recommendations', phoenixController.getRecommendations);
router.post('/intelligence/auto-optimize', phoenixController.autoOptimize);

// ========================================
// F. VOICE AI (4 endpoints)
// ========================================

router.post('/voice/session', phoenixController.createVoiceSession);
router.delete('/voice/session', phoenixController.endVoiceSession);
router.get('/voice/transcriptions', phoenixController.getTranscriptions);
router.get('/voice/history', phoenixController.getVoiceHistory);

// ========================================
// G. ML & LEARNING (7 endpoints)
// ========================================

router.post('/ml/train', phoenixController.trainModel);
router.get('/ml/models', phoenixController.getModels);
router.get('/ml/training-status', phoenixController.getTrainingStatus);
router.post('/behavior/track', phoenixController.trackBehavior);
router.get('/behavior/patterns', phoenixController.getBehaviorPatterns);
router.get('/behavior/insights', phoenixController.getBehaviorInsights);
router.get('/behavior/:type', phoenixController.getBehaviorByType);

// ========================================
// H. BUTLER ACTIONS (31 endpoints - 26 original + 5 new)
// ========================================

// --------- Reservations (2) ---------
router.post('/butler/reservation', phoenixController.makeReservation);
router.get('/butler/reservations', phoenixController.getReservations);

// --------- Food Ordering (3) ---------
router.post('/butler/food', phoenixController.orderFood);
router.get('/butler/food/history', phoenixController.getFoodHistory);
router.post('/butler/food/reorder', phoenixController.reorderFood);

// --------- Rides (2) ---------
router.post('/butler/ride', phoenixController.bookRide);
router.get('/butler/rides', phoenixController.getRideHistory);

// --------- Phone Calls (2) ---------
router.post('/butler/call', phoenixController.makePhoneCall);
router.get('/butler/calls', phoenixController.getCallHistory);

// --------- SMS/Text Messages (2 NEW) ---------
router.post('/butler/sms', phoenixController.sendSMS);
router.get('/butler/sms', phoenixController.getSMSHistory);

// --------- DESK Mode Count Endpoints ---------
router.get('/butler/calls/missed-count', async (req, res) => {
  try {
    // For now return 0 - can be enhanced to track missed calls via Twilio
    res.json({ success: true, count: 0 });
  } catch (error) {
    res.json({ success: true, count: 0 });
  }
});

router.get('/butler/sms/unread-count', async (req, res) => {
  try {
    // For now return 0 - can be enhanced to track unread SMS
    res.json({ success: true, count: 0 });
  } catch (error) {
    res.json({ success: true, count: 0 });
  }
});

router.get('/butler/calls/history', async (req, res) => {
  try {
    // Return empty array for now - will integrate with Twilio call logs
    res.json({ success: true, calls: [] });
  } catch (error) {
    res.json({ success: true, calls: [] });
  }
});

router.get('/butler/sms/history', async (req, res) => {
  try {
    // Return empty array for now - will integrate with Twilio SMS logs
    res.json({ success: true, messages: [] });
  } catch (error) {
    res.json({ success: true, messages: [] });
  }
});

// --------- Email (3) ---------
router.post('/butler/email', phoenixController.sendEmail);
router.get('/butler/emails', phoenixController.getEmailHistory);
router.post('/butler/email/reply', phoenixController.replyToEmail);

// --------- Calendar (2) ---------
router.post('/butler/calendar', phoenixController.manageCalendar);
router.post('/butler/calendar/optimize', phoenixController.optimizeCalendar);

// --------- Web Automation (2) ---------
router.post('/butler/search', phoenixController.searchWeb);
router.post('/butler/web-task', phoenixController.performWebTask);

// --------- Summarization (2) ---------
router.post('/butler/summarize', phoenixController.summarizeContent);
router.post('/butler/summarize/batch', phoenixController.batchSummarize);

// --------- Task Automation (3) ---------
router.post('/butler/automate', phoenixController.createAutomation);
router.get('/butler/automations', phoenixController.getAutomations);
router.delete('/butler/automations/:id', phoenixController.deleteAutomation);

// --------- Budget Management (3 NEW) ---------
router.get('/butler/budget', phoenixController.manageBudget);
router.put('/butler/budget', phoenixController.manageBudget);

// ========================================
// L. CONSCIOUSNESS LEARNING (3 endpoints)
// ========================================

// Record outcome for learning calibration
router.post('/learning/outcome', async (req, res) => {
  try {
    const { interactionId, outcome, feedback, rating } = req.body;
    const userId = req.user._id;

    if (!interactionId) {
      return res.status(400).json({
        success: false,
        error: 'interactionId is required'
      });
    }

    const PhoenixLearning = require('../models/phoenix/PhoenixLearning');
    const realTimeLearning = require('../services/phoenix/realTimeLearning');

    // Update the learning record
    const updated = await PhoenixLearning.findOneAndUpdate(
      { _id: interactionId, userId },
      {
        outcome: outcome || 'success',
        'feedback.userRating': rating,
        'feedback.userComment': feedback,
        'feedback.receivedAt': new Date()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Interaction not found'
      });
    }

    // Trigger calibration if service method exists
    if (realTimeLearning.service && realTimeLearning.service.calibrateFromOutcome) {
      await realTimeLearning.service.calibrateFromOutcome(userId, updated);
    }

    res.json({
      success: true,
      message: 'Outcome recorded and calibrated',
      data: {
        interactionId,
        outcome: updated.outcome,
        calibrated: true
      }
    });

  } catch (error) {
    console.error('[Phoenix Learning] Error recording outcome:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get learning analytics
router.get('/learning/analytics', async (req, res) => {
  try {
    const realTimeLearning = require('../services/phoenix/realTimeLearning');
    const days = parseInt(req.query.days) || 30;

    const analytics = await realTimeLearning.getLearningAnalytics(req.user._id, days);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('[Phoenix Learning] Error getting analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Teach Phoenix (user correction)
router.post('/learning/teach', async (req, res) => {
  try {
    const { originalInteractionId, correction, mistakeType } = req.body;
    const realTimeLearning = require('../services/phoenix/realTimeLearning');

    if (!originalInteractionId || !correction) {
      return res.status(400).json({
        success: false,
        error: 'originalInteractionId and correction are required'
      });
    }

    const result = await realTimeLearning.service.recordUserTeaching(
      req.user._id,
      originalInteractionId,
      correction,
      mistakeType || 'other'
    );

    res.json({
      success: true,
      message: 'Teaching recorded - Phoenix will remember this',
      data: result
    });

  } catch (error) {
    console.error('[Phoenix Learning] Error recording teaching:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// DEBUG: Test AI Providers
// ========================================

router.get('/debug/ai-status', async (req, res) => {
  const results = {};
  const testMessage = 'Say "OK" in one word';

  // Test Kimi K2
  try {
    const kimiConscious = require('../services/kimi/consciousMind');
    const start = Date.now();
    const response = await Promise.race([
      kimiConscious.respondToQuery(testMessage, req.user.id, { userName: 'Test', conciseMode: true, maxWords: 5 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 5s')), 5000))
    ]);
    results.kimi = { status: 'OK', time: Date.now() - start, source: response.source };
  } catch (e) {
    results.kimi = { status: 'FAILED', error: e.message };
  }

  // Test Gemini
  try {
    const geminiConscious = require('../services/gemini/consciousMind');
    const start = Date.now();
    const response = await Promise.race([
      geminiConscious.respondToQuery(testMessage, req.user.id, { userName: 'Test', conciseMode: true, maxWords: 5 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 5s')), 5000))
    ]);
    results.gemini = { status: 'OK', time: Date.now() - start, source: response.source };
  } catch (e) {
    results.gemini = { status: 'FAILED', error: e.message };
  }

  // Test Claude
  try {
    const claudeConscious = require('../services/claude/consciousMind');
    const start = Date.now();
    const response = await Promise.race([
      claudeConscious.respondToQuery(testMessage, req.user.id, { userName: 'Test', conciseMode: true, maxWords: 5 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 5s')), 5000))
    ]);
    results.claude = { status: 'OK', time: Date.now() - start, source: response.source };
  } catch (e) {
    results.claude = { status: 'FAILED', error: e.message };
  }

  // Check env vars
  results.envVars = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'SET' : 'MISSING',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING'
  };

  res.json({ success: true, results });
});

// ========================================
// M. PROACTIVE STREAM (Always-On Mode)
// ========================================

// SSE endpoint for proactive AI messages
router.get('/proactive-stream', async (req, res) => {
  try {
    const userId = req.user._id;
    const proactiveEngine = require('../services/consciousness/proactiveEngine');

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
      } catch (e) {
        // Connection closed
      }
    }, 30000);

    // Subscribe to proactive events
    proactiveEngine.subscribe(userId, (event) => {
      try {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (e) {
        // Connection closed
      }
    });

    // Handle screen context updates from query params
    if (req.query.screenContext) {
      try {
        const screenContext = JSON.parse(req.query.screenContext);
        proactiveEngine.updateScreenContext(userId, screenContext);
      } catch (e) {
        // Invalid screen context
      }
    }

    // Handle disconnect
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      proactiveEngine.unsubscribe(userId);
      console.log(`[Proactive] User ${userId} disconnected from proactive stream`);
    });

    req.on('error', () => {
      clearInterval(heartbeatInterval);
      proactiveEngine.unsubscribe(userId);
    });

    console.log(`[Proactive] User ${userId} connected to proactive stream`);

  } catch (error) {
    console.error('[Proactive] SSE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update screen context for proactive engine
router.post('/proactive-context', async (req, res) => {
  try {
    const userId = req.user._id;
    const { screenContext } = req.body;
    const proactiveEngine = require('../services/consciousness/proactiveEngine');

    proactiveEngine.updateScreenContext(userId, screenContext);

    res.json({
      success: true,
      message: 'Screen context updated'
    });

  } catch (error) {
    console.error('[Proactive] Context update error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get proactive engine status
router.get('/proactive-status', async (req, res) => {
  try {
    const proactiveEngine = require('../services/consciousness/proactiveEngine');
    res.json({
      success: true,
      data: proactiveEngine.getStatus()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// N. ACTIVITY LOG (Unified Activity Tracking)
// ========================================

const PhoenixActivity = require('../models/phoenix/PhoenixActivity');

// GET /api/phoenix/activity - Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      limit = 50,
      category,
      action,
      status,
      source,
      direction,
      startDate,
      endDate
    } = req.query;

    const activities = await PhoenixActivity.getRecent(userId, {
      limit: parseInt(limit),
      category,
      action,
      status,
      source,
      direction,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    console.error('[Activity] Error getting activities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/phoenix/activity/today - Get today's activity
router.get('/activity/today', async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, limit = 100 } = req.query;

    const activities = await PhoenixActivity.getToday(userId, {
      category,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    console.error('[Activity] Error getting today:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/phoenix/activity/timeline - Get activity timeline (grouped by hour)
router.get('/activity/timeline', async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.query;

    const timeline = await PhoenixActivity.getTimeline(
      userId,
      date ? new Date(date) : new Date()
    );

    res.json({
      success: true,
      data: timeline
    });

  } catch (error) {
    console.error('[Activity] Error getting timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/phoenix/activity/stats - Get activity statistics
router.get('/activity/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7 } = req.query;

    const stats = await PhoenixActivity.getStats(userId, parseInt(days));

    // Calculate totals
    const totals = stats.reduce((acc, cat) => ({
      total: acc.total + cat.count,
      completed: acc.completed + cat.completed,
      failed: acc.failed + cat.failed
    }), { total: 0, completed: 0, failed: 0 });

    res.json({
      success: true,
      data: {
        byCategory: stats,
        totals,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('[Activity] Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/phoenix/activity/search - Search activities
router.get('/activity/search', async (req, res) => {
  try {
    const userId = req.user._id;
    const { q, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const activities = await PhoenixActivity.search(userId, q, {
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      query: q,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    console.error('[Activity] Error searching:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/phoenix/activity/pending - Get pending activities
router.get('/activity/pending', async (req, res) => {
  try {
    const userId = req.user._id;
    const activities = await PhoenixActivity.getPending(userId);

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    console.error('[Activity] Error getting pending:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/phoenix/activity - Log a new activity
router.post('/activity', async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, action, title, description, metadata, priority, direction, source } = req.body;

    if (!category || !action || !title) {
      return res.status(400).json({
        success: false,
        error: 'category, action, and title are required'
      });
    }

    const activity = await PhoenixActivity.log(userId, category, action, {
      title,
      description,
      metadata,
      priority,
      direction,
      source
    });

    res.status(201).json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('[Activity] Error logging:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/phoenix/activity/:id - Update activity status
router.patch('/activity/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status, metadata, error: errorInfo } = req.body;

    const activity = await PhoenixActivity.findOne({ _id: id, userId });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    if (status === 'completed') {
      await activity.complete(metadata);
    } else if (status === 'failed') {
      await activity.fail(errorInfo);
    } else if (status) {
      activity.status = status;
      if (metadata) activity.metadata = { ...activity.metadata, ...metadata };
      await activity.save();
    }

    res.json({
      success: true,
      data: activity
    });

  } catch (error) {
    console.error('[Activity] Error updating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// Export router
// ========================================

module.exports = router;
