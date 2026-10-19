/**
 * UNIVERSAL CALENDAR ROUTES
 * Works with any CalDAV provider (Google, iCloud, Outlook, etc.)
 * No OAuth - uses App Passwords
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const caldavService = require('../services/caldav/caldavService');
const User = require('../models/User');
const { decrypt } = require('../services/encryption');

/**
 * POST /api/calendar/connect
 * Connect calendar via CalDAV (uses same credentials as email)
 */
router.post('/connect', protect, async (req, res) => {
    try {
        // Use stored email credentials
        const user = await User.findById(req.user._id);

        if (!user.emailCredentials?.email || !user.emailCredentials?.encryptedPassword) {
            return res.status(400).json({
                success: false,
                error: 'Connect your email first. Calendar uses the same credentials.'
            });
        }

        const password = decrypt(user.emailCredentials.encryptedPassword);

        await caldavService.connect(
            req.user._id.toString(),
            user.emailCredentials.email,
            password
        );

        res.json({
            success: true,
            message: 'Calendar connected'
        });
    } catch (err) {
        console.error('[UniversalCalendar] Connect error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/calendar/status
 * Check connection status
 */
router.get('/status', protect, async (req, res) => {
    try {
        const connected = caldavService.isConnected(req.user._id.toString());
        res.json({ success: true, connected });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/calendar/calendars
 * Get list of calendars
 */
router.get('/calendars', protect, async (req, res) => {
    try {
        // Auto-connect if not connected
        if (!caldavService.isConnected(req.user._id.toString())) {
            const user = await User.findById(req.user._id);
            if (user.emailCredentials?.email && user.emailCredentials?.encryptedPassword) {
                const password = decrypt(user.emailCredentials.encryptedPassword);
                await caldavService.connect(req.user._id.toString(), user.emailCredentials.email, password);
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Not connected',
                    needsConnect: true
                });
            }
        }

        const calendars = await caldavService.getCalendars(req.user._id.toString());
        res.json({ success: true, calendars });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/calendar/events
 * Get events from all calendars
 */
router.get('/events', protect, async (req, res) => {
    try {
        const { start, end } = req.query;

        // Auto-connect if not connected
        if (!caldavService.isConnected(req.user._id.toString())) {
            const user = await User.findById(req.user._id);
            if (user.emailCredentials?.email && user.emailCredentials?.encryptedPassword) {
                const password = decrypt(user.emailCredentials.encryptedPassword);
                await caldavService.connect(req.user._id.toString(), user.emailCredentials.email, password);
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Not connected',
                    needsConnect: true
                });
            }
        }

        const startDate = start ? new Date(start) : undefined;
        const endDate = end ? new Date(end) : undefined;

        const events = await caldavService.getAllEvents(
            req.user._id.toString(),
            startDate,
            endDate
        );

        res.json({ success: true, events, count: events.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/calendar/events/today
 * Get today's events
 */
router.get('/events/today', protect, async (req, res) => {
    try {
        // Auto-connect if not connected
        if (!caldavService.isConnected(req.user._id.toString())) {
            const user = await User.findById(req.user._id);
            if (user.emailCredentials?.email && user.emailCredentials?.encryptedPassword) {
                const password = decrypt(user.emailCredentials.encryptedPassword);
                await caldavService.connect(req.user._id.toString(), user.emailCredentials.email, password);
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Not connected',
                    needsConnect: true
                });
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const events = await caldavService.getAllEvents(
            req.user._id.toString(),
            today,
            tomorrow
        );

        res.json({ success: true, events, count: events.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/calendar/events
 * Create new event
 */
router.post('/events', protect, async (req, res) => {
    try {
        const { calendarUrl, title, start, end, description, location, allDay } = req.body;

        if (!caldavService.isConnected(req.user._id.toString())) {
            return res.status(401).json({ success: false, error: 'Not connected' });
        }

        // If no calendar specified, use first one
        let targetCalendar = calendarUrl;
        if (!targetCalendar) {
            const calendars = await caldavService.getCalendars(req.user._id.toString());
            if (calendars.length === 0) {
                return res.status(400).json({ success: false, error: 'No calendars found' });
            }
            targetCalendar = calendars[0].url;
        }

        const result = await caldavService.createEvent(
            req.user._id.toString(),
            targetCalendar,
            { title, start, end, description, location, allDay }
        );

        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/calendar/events/:eventUrl
 * Update event
 */
router.put('/events/:eventUrl(*)', protect, async (req, res) => {
    try {
        const { title, start, end, description, location, allDay } = req.body;

        if (!caldavService.isConnected(req.user._id.toString())) {
            return res.status(401).json({ success: false, error: 'Not connected' });
        }

        await caldavService.updateEvent(
            req.user._id.toString(),
            req.params.eventUrl,
            { title, start, end, description, location, allDay }
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * DELETE /api/calendar/events/:eventUrl
 * Delete event
 */
router.delete('/events/:eventUrl(*)', protect, async (req, res) => {
    try {
        if (!caldavService.isConnected(req.user._id.toString())) {
            return res.status(401).json({ success: false, error: 'Not connected' });
        }

        await caldavService.deleteEvent(
            req.user._id.toString(),
            req.params.eventUrl
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/calendar/disconnect
 * Disconnect calendar
 */
router.post('/disconnect', protect, async (req, res) => {
    try {
        caldavService.disconnect(req.user._id.toString());
        res.json({ success: true, message: 'Disconnected' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
