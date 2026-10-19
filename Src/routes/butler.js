const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for future billing - currently passes through
const trackButlerUsage = (type, cost) => (req, res, next) => next();
const requireVaultTier = (req, res, next) => next();
const butlerController = require('../controllers/butlerPuppeteerController');
const twilioController = require('../controllers/butlerController'); // Twilio phone calls
const puppeteerButler = require('../services/phoenix/puppeteerButler');
const { browserlessService } = require('../services/butler/browserless');
const { SERVICE_LOGIN_URLS } = require('../services/butler/cookieManager');
const ButlerSession = require('../models/ButlerSession');

// ============================================
// BUTLER - VAULT TIER ONLY ($9.99/mo + usage)
// ============================================
// All Butler automation requires VAULT subscription
// Individual actions have additional pay-per-use costs:
// - SMS: $0.05
// - Call: $0.15/min
// - Food Order: $0.25
// - Ride: $0.25
// - Reservation: $0.15
// - Web Task: $0.10
// ============================================

// Universal Agent for "do anything" automation
let universalAgent;
try {
  universalAgent = require('../services/butler/universalAgent');
} catch (e) {
  console.warn('[Butler Routes] Universal Agent not available:', e.message);
}

// ============================================
// LIVE STREAMING - SSE for real-time automation view
// ============================================

// GET /api/butler/stream/:sessionId - Live automation stream
router.get('/stream/:sessionId', protect, (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id.toString();

  // Check both puppeteerButler and universalAgent for session
  let sessionInfo = puppeteerButler.getSessionInfo ? puppeteerButler.getSessionInfo(sessionId) : null;
  let sessionSource = 'puppeteer';

  // Also check Universal Agent if available
  if (!sessionInfo && universalAgent && universalAgent.getSessionStatus) {
    sessionInfo = universalAgent.getSessionStatus(sessionId);
    sessionSource = 'universal';
  }

  // For universal sessions starting with 'universal_', they may not exist yet in the map
  // Allow connection and wait for events
  const isUniversalSession = sessionId.startsWith('universal_');

  if (!sessionInfo && !isUniversalSession) {
    return res.status(404).json({ error: 'Session not found or already completed' });
  }
  if (sessionInfo && sessionInfo.userId && sessionInfo.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized to view this session' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial connection event
  res.write(`event: status\ndata: ${JSON.stringify({ status: 'connected', message: 'Connected to live stream', source: sessionSource })}\n\n`);

  // Event handlers for puppeteerButler
  const onScreenshot = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`event: screenshot\ndata: ${JSON.stringify({ screenshot: data.screenshot })}\n\n`);
    }
  };

  const onProgress = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`event: progress\ndata: ${JSON.stringify({ step: data.step, total: data.total, description: data.description })}\n\n`);
    }
  };

  const onStatus = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`event: status\ndata: ${JSON.stringify({ status: data.status, message: data.message })}\n\n`);
    }
  };

  const onComplete = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`event: complete\ndata: ${JSON.stringify(data.result)}\n\n`);
      cleanup();
      res.end();
    }
  };

  const onError = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`event: error_event\ndata: ${JSON.stringify({ error: data.error })}\n\n`);
      cleanup();
      res.end();
    }
  };

  // Subscribe to puppeteer events
  puppeteerButler.on('screenshot', onScreenshot);
  puppeteerButler.on('progress', onProgress);
  puppeteerButler.on('status', onStatus);
  puppeteerButler.on('complete', onComplete);
  puppeteerButler.on('error_event', onError);

  // Also subscribe to Universal Agent events if available
  if (universalAgent) {
    universalAgent.on('screenshot', onScreenshot);
    universalAgent.on('step:started', (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: progress\ndata: ${JSON.stringify({
          step: data.step.stepNumber,
          total: data.step.stepNumber, // Will be updated as steps complete
          description: data.step.description
        })}\n\n`);
      }
    });
    universalAgent.on('step:completed', (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: progress\ndata: ${JSON.stringify({
          step: data.step.stepNumber,
          total: data.step.stepNumber,
          description: `Completed: ${data.step.description}`,
          success: data.result.success
        })}\n\n`);
        // Send screenshot if available
        if (data.result.screenshot) {
          res.write(`event: screenshot\ndata: ${JSON.stringify({ screenshot: data.result.screenshot })}\n\n`);
        }
      }
    });
    universalAgent.on('task:completed', (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: complete\ndata: ${JSON.stringify({
          success: data.success,
          totalSteps: data.steps?.length || 0,
          executionTime: data.executionTime
        })}\n\n`);
        cleanup();
        res.end();
      }
    });
    universalAgent.on('task:failed', (data) => {
      if (data.sessionId === sessionId) {
        res.write(`event: error_event\ndata: ${JSON.stringify({ error: data.error })}\n\n`);
        cleanup();
        res.end();
      }
    });
  }

  // Cleanup function
  const cleanup = () => {
    puppeteerButler.off('screenshot', onScreenshot);
    puppeteerButler.off('progress', onProgress);
    puppeteerButler.off('status', onStatus);
    puppeteerButler.off('complete', onComplete);
    puppeteerButler.off('error_event', onError);

    // Also cleanup Universal Agent listeners
    if (universalAgent) {
      universalAgent.removeAllListeners('screenshot');
      universalAgent.removeAllListeners('step:started');
      universalAgent.removeAllListeners('step:completed');
      universalAgent.removeAllListeners('task:completed');
      universalAgent.removeAllListeners('task:failed');
    }
  };

  // Handle client disconnect
  req.on('close', () => {
    cleanup();
  });
});

// GET /api/butler/sessions - Get all active sessions for current user
router.get('/sessions', protect, (req, res) => {
  const userId = req.user._id.toString();
  const sessions = puppeteerButler.getActiveSessionsForUser(userId);
  res.json({ success: true, sessions });
});

// ============================================
// SSE STREAMING ENDPOINTS (handled at line 21 with comprehensive handler)
// ============================================

// Start a manual login session with visible browser
router.post('/session/setup', protect, butlerController.setupSession);

// Check if session is valid for a service
router.get('/session/status/:service', protect, butlerController.getSessionStatus);

// Universal action endpoint with natural language goal (VAULT TIER)
router.post('/execute', protect, requireVaultTier, trackButlerUsage('web-task', 0.10), butlerController.executeAction);

// NEW: Universal "do anything" endpoint - AI plans and executes ANY task (VAULT TIER)
router.post('/universal', protect, requireVaultTier, trackButlerUsage('web-task', 0.10), butlerController.executeUniversal);

// Cancel a running automation session
router.post('/cancel/:sessionId', protect, butlerController.cancelSession);

// ============================================
// PENDING TASK CONVERSATION FLOW
// ============================================

// Get pending Butler task awaiting answers
router.get('/pending', protect, butlerController.getPendingTask);

// Submit an answer to a pending Butler question
router.post('/answer', protect, butlerController.submitAnswer);

// Cancel a pending task
router.delete('/pending/:sessionId', protect, butlerController.cancelPendingTask);

// ============================================
// CREDENTIAL MANAGEMENT
// ============================================

// Store encrypted credentials for a service
router.post('/credentials/:service', protect, butlerController.storeCredentials);

// Get list of connected services
router.get('/credentials', protect, butlerController.getCredentials);

// Remove credentials for a service
router.delete('/credentials/:service', protect, butlerController.removeCredentials);

// ============================================
// SERVICE LOGIN (Cookie-based Session)
// ============================================
// Foolproof auth: User logs in once via live view,
// cookies saved, future automations bypass CAPTCHA

// GET /api/butler/services - List all supported services
router.get('/services', protect, (req, res) => {
  const services = Object.keys(SERVICE_LOGIN_URLS).map(service => ({
    id: service,
    name: service.charAt(0).toUpperCase() + service.slice(1),
    loginUrl: SERVICE_LOGIN_URLS[service]
  }));
  res.json({ success: true, services });
});

// GET /api/butler/services/connected - Get user's connected services
router.get('/services/connected', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const sessions = await browserlessService.getUserConnectedServices(userId);
    res.json({ success: true, connectedServices: sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/butler/services/:service/login - Start login session
router.post('/services/:service/login', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { service } = req.params;

    // Check if service is supported
    if (!SERVICE_LOGIN_URLS[service.toLowerCase()]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported service: ${service}`,
        supportedServices: Object.keys(SERVICE_LOGIN_URLS)
      });
    }

    // Check if already connected
    const hasSession = await ButlerSession.hasValidSession(userId, service);
    if (hasSession) {
      return res.json({
        success: true,
        alreadyConnected: true,
        message: `Already connected to ${service}. Use DELETE to disconnect first.`
      });
    }

    // Start login session
    const result = await browserlessService.startLoginSession(userId, service);

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/butler/services/:sessionId/complete - Complete login & save cookies
router.post('/services/:sessionId/complete', protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const result = await browserlessService.completeLoginSession(sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/butler/services/:service - Disconnect a service
router.delete('/services/:service', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { service } = req.params;

    await browserlessService.disconnectService(userId, service);

    res.json({
      success: true,
      message: `Disconnected from ${service}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/butler/services/:service/status - Check if service is connected
router.get('/services/:service/status', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { service } = req.params;

    const session = await ButlerSession.findOne({
      userId,
      service: service.toLowerCase(),
      isValid: true,
      expiresAt: { $gt: new Date() }
    }).select('lastUsed useCount createdAt');

    if (session) {
      res.json({
        success: true,
        connected: true,
        service,
        lastUsed: session.lastUsed,
        useCount: session.useCount,
        connectedAt: session.createdAt
      });
    } else {
      res.json({
        success: true,
        connected: false,
        service,
        loginUrl: SERVICE_LOGIN_URLS[service.toLowerCase()]
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// UBER RIDE BOOKING (Puppeteer) - VAULT TIER
// ============================================

// Book an Uber ride ($0.25 per booking)
router.post('/uber/book', protect, requireVaultTier, trackButlerUsage('ride', 0.25), butlerController.bookUberRide);

// ============================================
// LYFT RIDE BOOKING (Puppeteer) - VAULT TIER
// ============================================

// Book a Lyft ride ($0.25 per booking)
router.post('/lyft/book', protect, requireVaultTier, trackButlerUsage('ride', 0.25), butlerController.bookLyftRide);

// ============================================
// OPENTABLE RESERVATIONS (Puppeteer) - VAULT TIER
// ============================================

// Make an OpenTable reservation ($0.15 per reservation)
router.post('/opentable/reserve', protect, requireVaultTier, trackButlerUsage('reservation', 0.15), butlerController.makeOpenTableReservation);

// ============================================
// DOORDASH FOOD DELIVERY (Puppeteer) - VAULT TIER
// ============================================

// Order food from DoorDash ($0.25 per order)
router.post('/doordash/order', protect, requireVaultTier, trackButlerUsage('food-order', 0.25), butlerController.orderDoorDash);

// ============================================
// UBER EATS FOOD DELIVERY (Puppeteer) - VAULT TIER
// ============================================

// Order food from Uber Eats ($0.25 per order)
router.post('/ubereats/order', protect, requireVaultTier, trackButlerUsage('food-order', 0.25), butlerController.orderUberEats);

// ============================================
// TWILIO PHONE CALLS (AI Voice Agent) - VAULT TIER
// ============================================

// Test Twilio integration
router.post('/test-call', protect, requireVaultTier, twilioController.testCall);

// Call Uber and book ride via phone ($0.15/min)
router.post('/call/uber', protect, requireVaultTier, trackButlerUsage('call', 0.15), twilioController.callUber);

// Call Lyft and book ride via phone ($0.15/min)
router.post('/call/lyft', protect, requireVaultTier, trackButlerUsage('call', 0.15), twilioController.callLyft);

// ============================================
// BUTLER ACTION HISTORY
// ============================================

// Get butler action history
router.get('/actions', protect, butlerController.getActionHistory);

// Get specific action status
router.get('/actions/:actionId', protect, butlerController.getActionStatus);

// ============================================
// PHOENIX NATIVE - CALL LOGS (No Twilio required)
// ============================================

// In-memory storage for Phoenix native calls/SMS (will be moved to MongoDB model later)
const PhoenixCall = require('../models/PhoenixCall');
const PhoenixSMS = require('../models/PhoenixSMS');

// GET /api/butler/calls/history - Phoenix native call history
router.get('/calls/history', protect, async (req, res) => {
  try {
    const calls = await PhoenixCall.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, calls });
  } catch (err) {
    res.json({ success: true, calls: [] });
  }
});

// GET /api/butler/calls/missed-count - Phoenix native missed calls count
router.get('/calls/missed-count', protect, async (req, res) => {
  try {
    const count = await PhoenixCall.countDocuments({
      userId: req.user._id,
      type: 'missed',
      viewed: false
    });
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

// POST /api/butler/calls/log - Log a call (manual entry or from native app)
router.post('/calls/log', protect, async (req, res) => {
  try {
    const { phoneNumber, name, type, duration, notes } = req.body;
    const call = await PhoenixCall.create({
      userId: req.user._id,
      phoneNumber,
      name: name || 'Unknown',
      type: type || 'outgoing', // incoming, outgoing, missed
      duration: duration || 0,
      notes,
      date: new Date()
    });
    res.json({ success: true, call });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// PHOENIX NATIVE - SMS LOGS (No Twilio required)
// ============================================

// GET /api/butler/sms/history - Phoenix native SMS history
router.get('/sms/history', protect, async (req, res) => {
  try {
    const messages = await PhoenixSMS.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, messages });
  } catch (err) {
    res.json({ success: true, messages: [] });
  }
});

// GET /api/butler/sms/unread-count - Phoenix native unread SMS count
router.get('/sms/unread-count', protect, async (req, res) => {
  try {
    const count = await PhoenixSMS.countDocuments({
      userId: req.user._id,
      read: false
    });
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

// POST /api/butler/sms/log - Log an SMS (manual entry)
router.post('/sms/log', protect, async (req, res) => {
  try {
    const { phoneNumber, name, body, type } = req.body;
    const sms = await PhoenixSMS.create({
      userId: req.user._id,
      phoneNumber,
      name: name || 'Unknown',
      body,
      type: type || 'outgoing', // incoming, outgoing
      date: new Date()
    });
    res.json({ success: true, sms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// BROWSERLESS.IO TEST & STATUS
// ============================================

// GET /api/butler/browserless/status - Check Browserless.io connection
router.get('/browserless/status', protect, async (req, res) => {
  try {
    const status = await browserlessService.getAccountStatus();
    const health = browserlessService.getHealthStatus();

    res.json({
      success: true,
      browserless: {
        ...status,
        ...health,
        tokenConfigured: !!process.env.BROWSERLESS_TOKEN
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/butler/browserless/test - Test Browserless.io by visiting a URL
router.post('/browserless/test', protect, async (req, res) => {
  const { url = 'https://www.google.com' } = req.body;

  try {
    if (!process.env.BROWSERLESS_TOKEN) {
      return res.status(400).json({
        success: false,
        error: 'BROWSERLESS_TOKEN not configured',
        mode: 'local'
      });
    }

    console.log('[Butler] Testing Browserless.io connection...');

    const result = await browserlessService.execute(async (browser, sessionInfo) => {
      const page = await browser.newPage();

      // Navigate to URL
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Get page title and screenshot
      const title = await page.title();
      const screenshot = await page.screenshot({ encoding: 'base64' });

      return {
        title,
        url: page.url(),
        screenshot: `data:image/png;base64,${screenshot}`,
        liveViewUrl: sessionInfo.liveViewUrl,
        sessionId: sessionInfo.sessionId
      };
    }, { stealth: true });

    res.json({
      success: true,
      message: 'Browserless.io is working!',
      result
    });
  } catch (err) {
    console.error('[Butler] Browserless test failed:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;
