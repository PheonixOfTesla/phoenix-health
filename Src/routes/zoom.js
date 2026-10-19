const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// Zoom Server-to-Server OAuth Configuration
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || 'https://pal-backend-production.up.railway.app/api/zoom/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://phoenix-fe-indol.vercel.app';

// Cache for S2S access token
let s2sToken = null;
let s2sTokenExpiry = 0;

// Get Server-to-Server OAuth token (no user login needed)
async function getS2SToken() {
  // Return cached token if still valid
  if (s2sToken && Date.now() < s2sTokenExpiry - 60000) {
    return s2sToken;
  }

  if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
    throw new Error('Zoom S2S OAuth not configured');
  }

  const response = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Zoom S2S] Token error:', error);
    throw new Error('Failed to get Zoom access token');
  }

  const data = await response.json();
  s2sToken = data.access_token;
  s2sTokenExpiry = Date.now() + (data.expires_in * 1000);

  console.log('[Zoom S2S] Token obtained, expires in', data.expires_in, 'seconds');
  return s2sToken;
}

// Check if Zoom S2S is configured
function isZoomConfigured() {
  return !!(ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET && ZOOM_ACCOUNT_ID);
}

// ============================================
// ZOOM STATUS & CONNECTION
// ============================================

// GET /api/zoom/debug - Public debug endpoint (no auth)
router.get('/debug', (req, res) => {
  res.json({
    clientId: ZOOM_CLIENT_ID ? `${ZOOM_CLIENT_ID.slice(0, 4)}...` : 'NOT SET',
    clientSecret: ZOOM_CLIENT_SECRET ? `${ZOOM_CLIENT_SECRET.length} chars` : 'NOT SET',
    accountId: ZOOM_ACCOUNT_ID ? 'SET' : 'NOT SET',
    redirectUri: ZOOM_REDIRECT_URI
  });
});

// GET /api/zoom/status - Check Zoom connection status
router.get('/status', protect, async (req, res) => {
  try {
    // Check if user has connected their Zoom account via OAuth
    const user = await User.findById(req.user._id).select('+zoomTokens.accessToken');
    const userConnected = !!(user.zoomTokens?.accessToken);
    const oauthConfigured = !!(ZOOM_CLIENT_ID && ZOOM_CLIENT_SECRET);

    res.json({
      success: true,
      connected: userConnected,
      configured: oauthConfigured,
      mode: 'user_oauth',
      canConnect: oauthConfigured && !userConnected
    });
  } catch (error) {
    console.error('[Zoom Status] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/zoom/connect - Get Zoom OAuth URL
router.get('/connect', protect, (req, res) => {
  try {
    if (!ZOOM_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        error: 'Zoom OAuth not configured',
        message: 'ZOOM_CLIENT_ID environment variable not set'
      });
    }

    const state = req.user._id.toString();
    // Only request scopes that are added in Zoom Marketplace
    const scopes = 'meeting:write:meeting';

    const authUrl = `https://zoom.us/oauth/authorize?` +
      `response_type=code` +
      `&client_id=${ZOOM_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(ZOOM_REDIRECT_URI)}` +
      `&state=${state}` +
      `&scope=${encodeURIComponent(scopes)}`;

    res.json({
      success: true,
      authUrl,
      message: 'Redirect user to authUrl to connect Zoom'
    });
  } catch (error) {
    console.error('[Zoom Connect] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/zoom/callback - Zoom OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state;

    console.log('[Zoom Callback] Received callback');
    console.log('[Zoom Callback] Code:', code ? 'present' : 'missing');
    console.log('[Zoom Callback] State/UserId:', userId);
    console.log('[Zoom Callback] ZOOM_CLIENT_ID:', ZOOM_CLIENT_ID ? 'set' : 'NOT SET');
    console.log('[Zoom Callback] ZOOM_CLIENT_SECRET:', ZOOM_CLIENT_SECRET ? 'set' : 'NOT SET');
    console.log('[Zoom Callback] ZOOM_REDIRECT_URI:', ZOOM_REDIRECT_URI);

    if (!code) {
      return res.redirect(`${FRONTEND_URL}/dashboard.html?zoom=error&msg=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: ZOOM_REDIRECT_URI
      })
    });

    console.log('[Zoom Callback] Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('[Zoom Callback] Token exchange failed:', error);
      console.error('[Zoom Callback] Full error details:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: error
      });
      return res.redirect(`${FRONTEND_URL}/dashboard.html?zoom=error&msg=token_failed`);
    }

    const tokens = await tokenResponse.json();

    // Save tokens to user
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${FRONTEND_URL}/dashboard.html?zoom=error&msg=user_not_found`);
    }

    user.zoomTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: Date.now() + (tokens.expires_in * 1000),
      connectedAt: new Date()
    };
    user.zoomConnected = true;
    await user.save();

    console.log('[Zoom Callback] Connected successfully for user:', userId);
    res.redirect(`${FRONTEND_URL}/dashboard.html?zoom=connected`);

  } catch (error) {
    console.error('[Zoom Callback] Error:', error);
    res.redirect(`${FRONTEND_URL}/dashboard.html?zoom=error&msg=${encodeURIComponent(error.message)}`);
  }
});

// POST /api/zoom/disconnect - Disconnect Zoom
router.post('/disconnect', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.zoomTokens = null;
    user.zoomConnected = false;
    await user.save();

    res.json({
      success: true,
      message: 'Zoom disconnected successfully'
    });
  } catch (error) {
    console.error('[Zoom Disconnect] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// HELPER: Refresh Zoom tokens
// ============================================
async function refreshZoomTokens(user) {
  if (!user.zoomTokens?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.zoomTokens.refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Zoom tokens');
  }

  const tokens = await response.json();

  user.zoomTokens.accessToken = tokens.access_token;
  if (tokens.refresh_token) {
    user.zoomTokens.refreshToken = tokens.refresh_token;
  }
  user.zoomTokens.expiryDate = Date.now() + (tokens.expires_in * 1000);
  await user.save();

  return tokens.access_token;
}

// Helper to get valid access token
async function getValidAccessToken(user) {
  // Check if token is expired (with 5 min buffer)
  const isExpired = user.zoomTokens?.expiryDate < (Date.now() + 300000);

  if (isExpired && user.zoomTokens?.refreshToken) {
    return await refreshZoomTokens(user);
  }

  return user.zoomTokens?.accessToken;
}

// ============================================
// ZOOM MEETINGS
// ============================================

// GET /api/zoom/meetings - List upcoming meetings
router.get('/meetings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+zoomTokens.accessToken +zoomTokens.refreshToken');

    if (!user.zoomTokens?.accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Zoom not connected',
        needsAuth: true
      });
    }

    const accessToken = await getValidAccessToken(user);

    const response = await fetch('https://api.zoom.us/v2/users/me/meetings?type=upcoming', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Zoom Meetings] API error:', error);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to fetch meetings'
      });
    }

    const data = await response.json();

    res.json({
      success: true,
      meetings: data.meetings || [],
      total: data.total_records || 0
    });
  } catch (error) {
    console.error('[Zoom Meetings] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/zoom/meetings - Create a new meeting via User OAuth
router.post('/meetings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+zoomTokens.accessToken +zoomTokens.refreshToken');

    if (!user.zoomTokens?.accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Zoom not connected',
        needsAuth: true,
        message: 'Please connect your Zoom account first'
      });
    }

    const accessToken = await getValidAccessToken(user);
    const { topic, startTime, duration, agenda } = req.body;

    const meetingData = {
      topic: topic || 'Phoenix Meeting',
      type: startTime ? 2 : 1, // 1 = instant, 2 = scheduled
      duration: duration || 60,
      agenda: agenda || '',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: true,
        mute_upon_entry: true,
        waiting_room: false
      }
    };

    if (startTime) {
      meetingData.start_time = new Date(startTime).toISOString();
      meetingData.timezone = 'America/New_York';
    }

    // Use user's OAuth token to create meeting
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(meetingData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Zoom Create Meeting] API error:', error);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to create meeting',
        details: error
      });
    }

    const meeting = await response.json();

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        topic: meeting.topic,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        password: meeting.password,
        startTime: meeting.start_time,
        duration: meeting.duration
      }
    });
  } catch (error) {
    console.error('[Zoom Create Meeting] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/zoom/meetings/:id - Delete a meeting
router.delete('/meetings/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+zoomTokens.accessToken +zoomTokens.refreshToken');

    if (!user.zoomTokens?.accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Zoom not connected',
        needsAuth: true
      });
    }

    const accessToken = await getValidAccessToken(user);
    const { id } = req.params;

    const response = await fetch(`https://api.zoom.us/v2/meetings/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.text();
      console.error('[Zoom Delete Meeting] API error:', error);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to delete meeting'
      });
    }

    res.json({
      success: true,
      message: 'Meeting deleted'
    });
  } catch (error) {
    console.error('[Zoom Delete Meeting] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/zoom/meetings/:id - Get meeting details
router.get('/meetings/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+zoomTokens.accessToken +zoomTokens.refreshToken');

    if (!user.zoomTokens?.accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Zoom not connected',
        needsAuth: true
      });
    }

    const accessToken = await getValidAccessToken(user);
    const { id } = req.params;

    const response = await fetch(`https://api.zoom.us/v2/meetings/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Zoom Get Meeting] API error:', error);
      return res.status(response.status).json({
        success: false,
        error: 'Failed to get meeting'
      });
    }

    const meeting = await response.json();

    res.json({
      success: true,
      meeting
    });
  } catch (error) {
    console.error('[Zoom Get Meeting] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PHOENIX NATIVE ZOOM MEETINGS (No OAuth needed)
// ============================================

const PhoenixZoomMeeting = require('../models/PhoenixZoomMeeting');

// GET /api/zoom/native/meetings - Phoenix native meetings
router.get('/native/meetings', protect, async (req, res) => {
  try {
    const meetings = await PhoenixZoomMeeting.find({ userId: req.user._id })
      .sort({ startTime: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, meetings });
  } catch (err) {
    res.json({ success: true, meetings: [] });
  }
});

// POST /api/zoom/native/meetings - Create Phoenix native meeting
router.post('/native/meetings', protect, async (req, res) => {
  try {
    const { topic, startTime, duration, meetingLink, password } = req.body;
    const meeting = await PhoenixZoomMeeting.create({
      userId: req.user._id,
      topic: topic || 'Meeting',
      startTime: startTime ? new Date(startTime) : new Date(),
      duration: duration || 60,
      meetingLink: meetingLink || '',
      password: password || '',
      source: 'phoenix'
    });
    res.json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/zoom/native/upcoming-count - Count of upcoming meetings
router.get('/native/upcoming-count', protect, async (req, res) => {
  try {
    const count = await PhoenixZoomMeeting.countDocuments({
      userId: req.user._id,
      startTime: { $gte: new Date() }
    });
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

module.exports = router;
