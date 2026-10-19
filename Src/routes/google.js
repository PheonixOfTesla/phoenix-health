/**
 * =================================================================
 * GOOGLE WORKSPACE ROUTES
 * =================================================================
 * Endpoints for Google OAuth and API integrations
 * =================================================================
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const googleWorkspace = require('../services/google/workspaceIntegration');
const { protect: auth } = require('../middleware/auth');

// Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Model to store Google tokens
const User = require('../models/User');

/**
 * =================================================================
 * OAUTH FLOW
 * =================================================================
 */

/**
 * GET /api/google/connect
 * Initiate Google OAuth flow
 */
router.get('/connect', auth, (req, res) => {
  try {
    const authUrl = googleWorkspace.getAuthorizationUrl(req.user._id.toString());

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to this URL to authorize Google access'
    });
  } catch (error) {
    console.error('[Google Route] Connect failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/callback
 * OAuth callback - Google redirects here after user authorizes
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state; // We passed userId as state parameter

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'No authorization code received'
      });
    }

    // Exchange code for tokens
    const tokens = await googleWorkspace.exchangeCodeForTokens(code);

    // Save tokens to user record
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.googleTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date
    };
    user.googleConnected = true;
    await user.save();

    

    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'https://phoenix-fe-indol.vercel.app'}/google-connected?success=true`);

  } catch (error) {
    console.error('[Google Route] Callback failed:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'https://phoenix-fe-indol.vercel.app'}/google-connected?success=false&error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/google/disconnect
 * Disconnect Google account
 */
router.get('/disconnect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.googleTokens = null;
    user.googleConnected = false;
    await user.save();

    res.json({
      success: true,
      message: 'Google account disconnected'
    });
  } catch (error) {
    console.error('[Google Route] Disconnect failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google/exchange-code
 * Exchange authorization code for tokens (popup-based OAuth flow)
 * Uses 'postmessage' as redirect_uri for Google Identity Services
 */
router.post('/exchange-code', auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'No authorization code provided'
      });
    }

    console.log('[Google Route] Exchanging code for tokens (popup flow)...');

    // Exchange code using 'postmessage' redirect_uri for popup flow
    const tokens = await googleWorkspace.exchangeCodeForTokensPopup(code);

    // Save tokens to user record
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    user.googleTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date
    };
    user.googleConnected = true;
    await user.save();

    console.log('[Google Route] Successfully connected Google for user:', req.user._id);

    res.json({
      success: true,
      message: 'Google account connected successfully'
    });

  } catch (error) {
    console.error('[Google Route] Exchange code failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/status
 * Check if user has Google connected
 * Note: We use googleConnected flag because tokens have select:false for security
 */
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Use the googleConnected boolean flag (tokens have select:false and won't be returned)
    res.json({
      success: true,
      connected: user.googleConnected || false
    });
  } catch (error) {
    console.error('[Google Route] Status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * GMAIL ENDPOINTS
 * =================================================================
 */

/**
 * GET /api/google/gmail/recent
 * Get recent emails
 */
router.get('/gmail/recent', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const limit = parseInt(req.query.limit) || 10;
    const emails = await googleWorkspace.getRecentEmails(limit);

    res.json({
      success: true,
      emails,
      count: emails.length
    });
  } catch (error) {
    console.error('[Gmail] Recent emails failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * GMAIL DRAFTS ENDPOINTS (gmail.compose scope)
 * =================================================================
 */

/**
 * GET /api/google/gmail/drafts
 * List all drafts
 */
router.get('/gmail/drafts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const limit = parseInt(req.query.limit) || 10;
    const drafts = await googleWorkspace.getDrafts(limit);

    res.json({
      success: true,
      drafts,
      count: drafts.length
    });
  } catch (error) {
    console.error('[Gmail] List drafts failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/gmail/drafts/:id
 * Get a specific draft by ID
 */
router.get('/gmail/drafts/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const draft = await googleWorkspace.getDraft(req.params.id);

    res.json({
      success: true,
      draft
    });
  } catch (error) {
    console.error('[Gmail] Get draft failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google/gmail/drafts
 * Create a new draft
 */
router.post('/gmail/drafts', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const draft = await googleWorkspace.createDraft(to, subject, body || '');

    res.json({
      success: true,
      draft,
      message: 'Draft created successfully'
    });
  } catch (error) {
    console.error('[Gmail] Create draft failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/google/gmail/drafts/:id
 * Update an existing draft
 */
router.put('/gmail/drafts/:id', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const draft = await googleWorkspace.updateDraft(req.params.id, to, subject, body || '');

    res.json({
      success: true,
      draft,
      message: 'Draft updated successfully'
    });
  } catch (error) {
    console.error('[Gmail] Update draft failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/google/gmail/drafts/:id
 * Delete a draft
 */
router.delete('/gmail/drafts/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const result = await googleWorkspace.deleteDraft(req.params.id);

    res.json({
      success: true,
      ...result,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('[Gmail] Delete draft failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google/gmail/drafts/:id/send
 * Send a draft
 */
router.post('/gmail/drafts/:id/send', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const result = await googleWorkspace.sendDraft(req.params.id);

    res.json({
      success: true,
      message: result,
      sentMessage: 'Draft sent successfully'
    });
  } catch (error) {
    console.error('[Gmail] Send draft failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * CALENDAR ENDPOINTS
 * =================================================================
 */

/**
 * GET /api/google/calendar/upcoming
 * Get upcoming events
 */
router.get('/calendar/upcoming', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const limit = parseInt(req.query.limit) || 10;
    const events = await googleWorkspace.getUpcomingEvents(limit);

    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('[Calendar] Fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/calendar/events
 * Get calendar events (alias for /calendar/upcoming for frontend compatibility)
 */
router.get('/calendar/events', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const limit = parseInt(req.query.limit) || 20;
    const events = await googleWorkspace.getUpcomingEvents(limit);

    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('[Calendar] Events fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google/calendar/create
 * Create calendar event
 */
router.post('/calendar/create', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { title, description, startTime, endTime } = req.body;
    const event = await googleWorkspace.createEvent({
      title,
      description,
      startTime,
      endTime
    });

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('[Calendar] Create failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google/calendar/events
 * Create calendar event (alias for /calendar/create with flexible format)
 * Accepts both { summary, start, end } and { title, startTime, endTime }
 */
router.post('/calendar/events', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    // Accept both formats
    const { summary, title, start, end, startTime, endTime, description, location } = req.body;
    const eventTitle = summary || title;
    const eventStart = start?.dateTime || startTime;
    const eventEnd = end?.dateTime || endTime;

    if (!eventTitle || !eventStart) {
      return res.status(400).json({
        success: false,
        error: 'Event title and start time are required'
      });
    }

    const event = await googleWorkspace.createEvent({
      title: eventTitle,
      description,
      startTime: eventStart,
      endTime: eventEnd || new Date(new Date(eventStart).getTime() + 60 * 60 * 1000).toISOString(), // Default 1 hour
      location
    });

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('[Calendar] Create via events endpoint failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * DRIVE ENDPOINTS
 * =================================================================
 */

/**
 * GET /api/google/drive/files
 * List Drive files
 */
router.get('/drive/files', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const limit = parseInt(req.query.limit) || 10;
    const files = await googleWorkspace.listDriveFiles(limit);

    res.json({
      success: true,
      files,
      count: files.length
    });
  } catch (error) {
    console.error('[Drive] List failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * TASKS ENDPOINTS
 * =================================================================
 */

/**
 * GET /api/google/tasks/lists
 * Get all task lists
 */
router.get('/tasks/lists', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const taskLists = await googleWorkspace.getTaskLists();

    res.json({
      success: true,
      taskLists,
      count: taskLists.length
    });
  } catch (error) {
    console.error('[Tasks] Lists fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/tasks/:listId
 * Get tasks from a list
 */
router.get('/tasks/:listId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { listId } = req.params;
    const tasks = await googleWorkspace.getTasks(listId);

    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('[Tasks] Fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/google/tasks/:listId/create
 * Create task in a list
 */
router.post('/tasks/:listId/create', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { listId } = req.params;
    const { title, notes, dueDate } = req.body;

    const task = await googleWorkspace.createTask(listId, title, notes, dueDate);

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('[Tasks] Create failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * CONTACTS ENDPOINTS
 * =================================================================
 */

/**
 * GET /api/google/contacts
 * Get contacts
 */
router.get('/contacts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const limit = parseInt(req.query.limit) || 50;
    const contacts = await googleWorkspace.getContacts(limit);

    res.json({
      success: true,
      contacts,
      count: contacts.length
    });
  } catch (error) {
    console.error('[Contacts] Fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * GOOGLE FIT ENDPOINTS
 * =================================================================
 */

/**
 * GET /api/google/fit/activity
 * Get fitness activity data
 */
router.get('/fit/activity', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    // Get today's data by default
    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);

    const startTime = parseInt(req.query.startTime) || startOfDay;
    const endTime = parseInt(req.query.endTime) || now;

    const activity = await googleWorkspace.getFitnessActivity(startTime, endTime);

    res.json({
      success: true,
      activity,
      count: activity.length
    });
  } catch (error) {
    console.error('[Fit] Activity fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/fit/heart-rate
 * Get heart rate data
 */
router.get('/fit/heart-rate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);

    const startTime = parseInt(req.query.startTime) || startOfDay;
    const endTime = parseInt(req.query.endTime) || now;

    const heartRate = await googleWorkspace.getHeartRateData(startTime, endTime);

    res.json({
      success: true,
      heartRate,
      count: heartRate.length
    });
  } catch (error) {
    console.error('[Fit] Heart rate fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/fit/sleep
 * Get sleep data
 */
router.get('/fit/sleep', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const now = Date.now();
    const startOfDay = new Date().setHours(0, 0, 0, 0);

    const startTime = parseInt(req.query.startTime) || startOfDay;
    const endTime = parseInt(req.query.endTime) || now;

    const sleep = await googleWorkspace.getSleepData(startTime, endTime);

    res.json({
      success: true,
      sleep,
      count: sleep.length
    });
  } catch (error) {
    console.error('[Fit] Sleep fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * SYNC ENDPOINT - Fetch all Google data at once
 * =================================================================
 */

/**
 * GET /api/google/sync-all
 * Sync all Google data for holistic optimization
 */
router.get('/sync-all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected. Please connect your Google account first.'
      });
    }

    googleWorkspace.setCredentials(user.googleTokens);

    

    // Fetch all data in parallel
    const [
      emails,
      events,
      tasks,
      contacts,
      driveFiles
    ] = await Promise.all([
      googleWorkspace.getRecentEmails(20).catch(err => {
        console.error('[Sync] Gmail failed:', err.message);
        return [];
      }),
      googleWorkspace.getUpcomingEvents(20).catch(err => {
        console.error('[Sync] Calendar failed:', err.message);
        return [];
      }),
      googleWorkspace.getTasks('@default').catch(err => {
        console.error('[Sync] Tasks failed:', err.message);
        return [];
      }),
      googleWorkspace.getContacts(50).catch(err => {
        console.error('[Sync] Contacts failed:', err.message);
        return [];
      }),
      googleWorkspace.listDriveFiles(20).catch(err => {
        console.error('[Sync] Drive failed:', err.message);
        return [];
      })
    ]);

    

    res.json({
      success: true,
      data: {
        gmail: { emails, count: emails.length },
        calendar: { events, count: events.length },
        tasks: { tasks, count: tasks.length },
        contacts: { contacts, count: contacts.length },
        drive: { files: driveFiles, count: driveFiles.length }
      },
      syncedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Google Sync] Failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * =================================================================
 * DESK MODE ENDPOINTS - Business Brain
 * =================================================================
 */

/**
 * POST /api/google/gmail/send
 * Send an email
 */
router.post('/gmail/send', auth, async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);
    await googleWorkspace.sendEmail(to, subject, body || '');

    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('[Gmail] Send failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/gmail/inbox
 * Get inbox with full email details (for Genesis email_read)
 */
router.get('/gmail/inbox', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { google } = require('googleapis');
    const gmail = google.gmail({ version: 'v1', auth: googleWorkspace.oauth2Client });

    const limit = parseInt(req.query.limit) || 10;
    const unreadOnly = req.query.unread === 'true';

    // Get message list
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: unreadOnly ? 'is:unread' : '',
      maxResults: limit
    });

    const messages = listResponse.data.messages || [];

    // Fetch full details for each message
    const emailDetails = await Promise.all(
      messages.slice(0, limit).map(async (msg) => {
        try {
          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });

          const headers = detail.data.payload?.headers || [];
          const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

          return {
            id: detail.data.id,
            threadId: detail.data.threadId,
            from: getHeader('From'),
            to: getHeader('To'),
            subject: getHeader('Subject'),
            date: getHeader('Date'),
            snippet: detail.data.snippet,
            unread: detail.data.labelIds?.includes('UNREAD'),
            labels: detail.data.labelIds
          };
        } catch (err) {
          return null;
        }
      })
    );

    const validEmails = emailDetails.filter(e => e !== null);

    res.json({
      success: true,
      emails: validEmails,
      count: validEmails.length,
      totalEstimate: listResponse.data.resultSizeEstimate
    });

  } catch (error) {
    console.error('[Gmail] Inbox fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/gmail/message/:id
 * Get full email content by ID
 */
router.get('/gmail/message/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { google } = require('googleapis');
    const gmail = google.gmail({ version: 'v1', auth: googleWorkspace.oauth2Client });

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: req.params.id,
      format: 'full'
    });

    const headers = response.data.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

    // Extract body content
    let body = '';
    const payload = response.data.payload;

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      // Find text/plain or text/html part
      const textPart = payload.parts.find(p => p.mimeType === 'text/plain');
      const htmlPart = payload.parts.find(p => p.mimeType === 'text/html');
      const part = textPart || htmlPart;
      if (part?.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }

    res.json({
      success: true,
      email: {
        id: response.data.id,
        threadId: response.data.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        date: getHeader('Date'),
        body: body,
        snippet: response.data.snippet,
        unread: response.data.labelIds?.includes('UNREAD'),
        labels: response.data.labelIds
      }
    });

  } catch (error) {
    console.error('[Gmail] Message fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/gmail/unread-count
 * Get unread email count
 */
router.get('/gmail/unread-count', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.json({ success: true, count: 0 });
    }

    googleWorkspace.setCredentials(user.googleTokens);

    // Get unread emails using label UNREAD
    const { google } = require('googleapis');
    const gmail = google.gmail({ version: 'v1', auth: googleWorkspace.oauth2Client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 1
    });

    const count = response.data.resultSizeEstimate || 0;

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('[Gmail] Unread count failed:', error);
    res.json({ success: true, count: 0 });
  }
});

/**
 * POST /api/google/drive/upload
 * Upload a file to Google Drive
 * Supports both multipart form data and JSON with base64 content
 */
router.post('/drive/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    let fileName, mimeType, fileBuffer, parentId;

    // Check if multipart form data (file upload)
    if (req.file) {
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
      fileBuffer = req.file.buffer;
      parentId = req.body.parentId;
    } else {
      // JSON body with base64 content
      const { fileName: jsonFileName, mimeType: jsonMimeType, content, parentId: jsonParentId } = req.body;

      if (!jsonFileName || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: fileName, content (or use multipart file upload)'
        });
      }

      fileName = jsonFileName;
      mimeType = jsonMimeType || 'application/octet-stream';
      fileBuffer = Buffer.from(content, 'base64');
      parentId = jsonParentId;
    }

    const result = await googleWorkspace.uploadFile(fileName, mimeType || 'application/octet-stream', fileBuffer, parentId);

    res.json({
      success: true,
      file: result
    });

  } catch (error) {
    console.error('[Drive] Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/drive/file/:id
 * Get file content by ID (for Genesis open_file)
 */
router.get('/drive/file/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { google } = require('googleapis');
    const drive = google.drive({ version: 'v3', auth: googleWorkspace.oauth2Client });

    // Get file metadata first
    const metaResponse = await drive.files.get({
      fileId: req.params.id,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, modifiedTime'
    });

    const file = metaResponse.data;

    // For Google Docs/Sheets/Slides, export as appropriate format
    let content = null;
    if (file.mimeType.includes('google-apps.document')) {
      // Export Google Doc as plain text
      const exportResponse = await drive.files.export({
        fileId: req.params.id,
        mimeType: 'text/plain'
      }, { responseType: 'text' });
      content = exportResponse.data;
    } else if (file.mimeType.includes('google-apps.spreadsheet')) {
      // Export Google Sheet as CSV
      const exportResponse = await drive.files.export({
        fileId: req.params.id,
        mimeType: 'text/csv'
      }, { responseType: 'text' });
      content = exportResponse.data;
    } else if (file.mimeType === 'text/plain' || file.mimeType.includes('text/')) {
      // Download text files directly
      const downloadResponse = await drive.files.get({
        fileId: req.params.id,
        alt: 'media'
      }, { responseType: 'text' });
      content = downloadResponse.data;
    }

    res.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        modifiedTime: file.modifiedTime,
        content: content // null for non-text files
      }
    });

  } catch (error) {
    console.error('[Drive] File fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/drive/search
 * Search for files by name (for Genesis open_file by filename)
 */
router.get('/drive/search', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { google } = require('googleapis');
    const drive = google.drive({ version: 'v3', auth: googleWorkspace.oauth2Client });

    const query = req.query.q || req.query.name || '';
    const limit = parseInt(req.query.limit) || 10;

    const response = await drive.files.list({
      q: `name contains '${query.replace(/'/g, "\\'")}'`,
      pageSize: limit,
      fields: 'files(id, name, mimeType, size, webViewLink, modifiedTime, iconLink)',
      orderBy: 'modifiedTime desc'
    });

    res.json({
      success: true,
      files: response.data.files || [],
      count: response.data.files?.length || 0
    });

  } catch (error) {
    console.error('[Drive] Search failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/drive/count
 * Get total file count in Drive
 */
router.get('/drive/count', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.json({ success: true, count: 0 });
    }

    googleWorkspace.setCredentials(user.googleTokens);

    const { google } = require('googleapis');
    const drive = google.drive({ version: 'v3', auth: googleWorkspace.oauth2Client });

    // Get about info which includes storage quota
    const aboutResponse = await drive.about.get({
      fields: 'storageQuota'
    });

    // Also do a files list to get count
    const filesResponse = await drive.files.list({
      pageSize: 1,
      fields: 'files(id)'
    });

    // Note: Google doesn't provide exact file count, but we can estimate
    // by checking if nextPageToken exists or count files in batches
    let totalFiles = 0;
    let pageToken = null;

    do {
      const response = await drive.files.list({
        pageSize: 100,
        pageToken: pageToken,
        fields: 'nextPageToken, files(id)'
      });

      totalFiles += response.data.files?.length || 0;
      pageToken = response.data.nextPageToken;

      // Limit to avoid timeout
      if (totalFiles > 1000) break;
    } while (pageToken);

    res.json({
      success: true,
      count: totalFiles,
      storageUsed: aboutResponse.data.storageQuota?.usage,
      storageLimit: aboutResponse.data.storageQuota?.limit
    });

  } catch (error) {
    console.error('[Drive] Count failed:', error);
    res.json({ success: true, count: 0 });
  }
});

/**
 * POST /api/google/drive/folder
 * Create a folder in Google Drive
 */
router.post('/drive/folder', auth, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.status(401).json({
        success: false,
        error: 'Google account not connected'
      });
    }

    // Convert camelCase tokens to snake_case for Google API
    const tokens = {
      access_token: user.googleTokens.accessToken,
      refresh_token: user.googleTokens.refreshToken,
      expiry_date: user.googleTokens.expiryDate
    };
    googleWorkspace.setCredentials(tokens);

    const { google } = require('googleapis');
    const drive = google.drive({ version: 'v3', auth: googleWorkspace.oauth2Client });

    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id, name, webViewLink'
    });

    res.json({
      success: true,
      folder: {
        id: response.data.id,
        name: response.data.name,
        link: response.data.webViewLink
      }
    });

  } catch (error) {
    console.error('[Drive] Create folder failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/google/calendar/today-count
 * Get count of events for today
 */
router.get('/calendar/today-count', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.googleConnected || !user.googleTokens) {
      return res.json({ success: true, count: 0 });
    }

    googleWorkspace.setCredentials(user.googleTokens);

    const { google } = require('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: googleWorkspace.oauth2Client });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true
    });

    const count = response.data.items?.length || 0;

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('[Calendar] Today count failed:', error);
    res.json({ success: true, count: 0 });
  }
});

module.exports = router;
