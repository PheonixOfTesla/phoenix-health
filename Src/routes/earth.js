const express = require('express');
const router = express.Router();
const earthController = require('../controllers/earthController');
const { protect } = require('../middleware/auth');
const googleWorkspace = require('../services/google/workspaceIntegration');
const User = require('../models/User');

// Google OAuth Callback (matches Railway redirect URI)
router.get('/calendar/callback/google', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = state;
    const FRONTEND = process.env.FRONTEND_URL || 'https://phoenix-fe-indol.vercel.app';

    if (!code) {
      return res.redirect(`${FRONTEND}/earth?google=error&msg=no_code`);
    }

    // Exchange code for tokens
    const tokens = await googleWorkspace.exchangeCodeForTokens(code);

    // Save tokens to user
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect(`${FRONTEND}/earth?google=error&msg=user_not_found`);
    }

    user.googleTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date
    };
    user.googleConnected = true;
    await user.save();

    console.log(`[Google OAuth] User ${userId} connected Google successfully`);

    // Redirect to Earth page with success
    res.redirect(`${FRONTEND}/earth?google=connected`);

  } catch (error) {
    console.error('[Google Callback] Error:', error);
    const FRONTEND = process.env.FRONTEND_URL || 'https://phoenix-fe-indol.vercel.app';
    res.redirect(`${FRONTEND}/earth?google=error&msg=${encodeURIComponent(error.message)}`);
  }
});

// Calendar Integration (7 endpoints)
router.get('/calendar/connect/:provider', protect, earthController.connectCalendar);
router.post('/calendar/callback', protect, earthController.handleCalendarCallback);
router.get('/calendar/events', protect, earthController.getCalendarEvents);
router.post('/calendar/events', protect, earthController.createCalendarEvent);
router.get('/calendar/energy-map', protect, earthController.getEnergyOptimizedSchedule);
router.get('/calendar/conflicts', protect, earthController.detectConflicts);
router.post('/calendar/sync', protect, earthController.syncCalendar);

// GET /api/earth/calendar/today-count - Count of today's events (Phoenix native)
router.get('/calendar/today-count', protect, async (req, res) => {
  try {
    const CalendarEvent = require('../models/CalendarEvent');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await CalendarEvent.countDocuments({
      userId: req.user._id,
      startTime: { $gte: today, $lt: tomorrow }
    });
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

// Energy Tracking (4 endpoints)
router.get('/energy/pattern', protect, earthController.getEnergyPattern);
router.post('/energy/log', protect, earthController.logEnergyLevel);
router.get('/energy/optimal-times', protect, earthController.getOptimalMeetingTimes);
router.get('/energy/prediction', protect, earthController.predictEnergy);

// ========================================
// ANALYTICS (1 endpoint)
// ========================================

// GET /api/earth/analytics/week - Weekly time audit data
router.get('/analytics/week', protect, async (req, res) => {
  try {
    const CalendarEvent = require('../models/CalendarEvent');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get events from the past week
    const events = await CalendarEvent.find({
      userId: req.user._id,
      startTime: { $gte: weekAgo, $lte: now }
    }).lean();

    // Calculate time spent by category
    const categoryTime = {};
    let totalMinutes = 0;

    events.forEach(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const durationMinutes = Math.round((end - start) / (1000 * 60));
      const category = event.category || 'uncategorized';

      categoryTime[category] = (categoryTime[category] || 0) + durationMinutes;
      totalMinutes += durationMinutes;
    });

    // Convert to hours for readability
    const categoryHours = {};
    Object.keys(categoryTime).forEach(cat => {
      categoryHours[cat] = Math.round(categoryTime[cat] / 60 * 10) / 10;
    });

    res.json({
      success: true,
      data: {
        weekStarting: weekAgo.toISOString(),
        weekEnding: now.toISOString(),
        totalEvents: events.length,
        totalHours: Math.round(totalMinutes / 60 * 10) / 10,
        categoryBreakdown: categoryHours,
        dailyAverage: Math.round(totalMinutes / 7 / 60 * 10) / 10
      }
    });
  } catch (err) {
    console.error('[Earth Analytics Week] Error:', err);
    res.json({
      success: true,
      data: {
        weekStarting: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        weekEnding: new Date().toISOString(),
        totalEvents: 0,
        totalHours: 0,
        categoryBreakdown: {},
        dailyAverage: 0
      }
    });
  }
});

module.exports = router;
