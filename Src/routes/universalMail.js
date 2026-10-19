/**
 * UNIVERSAL MAIL ROUTES
 * Works with any email provider via IMAP
 * No OAuth - uses App Passwords
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const imapService = require('../services/imap/imapService');
const User = require('../models/User');
const { encrypt, decrypt } = require('../services/encryption');

// Store encrypted credentials in user document
// { emailCredentials: { email, encryptedPassword, provider } }

/**
 * POST /api/mail/connect
 * Connect email account via IMAP
 */
router.post('/connect', protect, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password required'
            });
        }

        // Test connection first
        try {
            const result = await imapService.testConnection(email, password);
            console.log(`[UniversalMail] Connection test passed for ${email}`);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Connection failed. Check your email and app password.',
                details: err.error || err.message
            });
        }

        // Connect and cache
        await imapService.connect(req.user._id.toString(), email, password);

        // Store encrypted credentials
        const encryptedPassword = encrypt(password);
        await User.findByIdAndUpdate(req.user._id, {
            emailCredentials: {
                email,
                encryptedPassword,
                provider: imapService.getProviderConfig(email).host,
                connectedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Email connected successfully',
            provider: imapService.getProviderConfig(email).host
        });

    } catch (err) {
        console.error('[UniversalMail] Connect error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/mail/status
 * Check connection status - auto-reconnects if credentials exist
 */
router.get('/status', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        let connected = imapService.isConnected(req.user._id.toString());

        // Auto-reconnect if credentials exist but not connected
        if (!connected && user.emailCredentials?.email && user.emailCredentials?.encryptedPassword) {
            try {
                const password = decrypt(user.emailCredentials.encryptedPassword);
                await imapService.connect(req.user._id.toString(), user.emailCredentials.email, password);
                connected = true;
                console.log(`[UniversalMail] Auto-reconnected for ${user.emailCredentials.email}`);
            } catch (err) {
                console.warn(`[UniversalMail] Auto-reconnect failed: ${err.message}`);
                // Still return hasCredentials so frontend knows credentials exist
            }
        }

        res.json({
            success: true,
            connected,
            hasCredentials: !!(user.emailCredentials?.email),
            email: user.emailCredentials?.email || null,
            provider: user.emailCredentials?.provider || null
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/mail/reconnect
 * Reconnect using stored credentials
 */
router.post('/reconnect', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.emailCredentials?.email || !user.emailCredentials?.encryptedPassword) {
            return res.status(400).json({
                success: false,
                error: 'No saved credentials. Please connect first.'
            });
        }

        const password = decrypt(user.emailCredentials.encryptedPassword);
        await imapService.connect(
            req.user._id.toString(),
            user.emailCredentials.email,
            password
        );

        res.json({ success: true, message: 'Reconnected' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/mail/disconnect
 * Disconnect email
 */
router.post('/disconnect', protect, async (req, res) => {
    try {
        imapService.disconnect(req.user._id.toString());

        // Clear stored credentials
        await User.findByIdAndUpdate(req.user._id, {
            $unset: { emailCredentials: 1 }
        });

        res.json({ success: true, message: 'Disconnected' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/mail/emails
 * Get emails from inbox
 */
router.get('/emails', protect, async (req, res) => {
    try {
        const { folder = 'INBOX', limit = 50 } = req.query;

        // Auto-reconnect if needed
        if (!imapService.isConnected(req.user._id.toString())) {
            const user = await User.findById(req.user._id);
            if (user.emailCredentials?.email && user.emailCredentials?.encryptedPassword) {
                const password = decrypt(user.emailCredentials.encryptedPassword);
                await imapService.connect(req.user._id.toString(), user.emailCredentials.email, password);
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Not connected. Please connect your email first.',
                    needsConnect: true
                });
            }
        }

        const emails = await imapService.getEmails(
            req.user._id.toString(),
            folder,
            parseInt(limit)
        );

        res.json({ success: true, emails, count: emails.length });
    } catch (err) {
        console.error('[UniversalMail] Get emails error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/mail/email/:uid
 * Get single email by UID
 */
router.get('/email/:uid', protect, async (req, res) => {
    try {
        const { folder = 'INBOX' } = req.query;

        if (!imapService.isConnected(req.user._id.toString())) {
            return res.status(401).json({ success: false, error: 'Not connected' });
        }

        const email = await imapService.getEmail(
            req.user._id.toString(),
            req.params.uid,
            folder
        );

        res.json({ success: true, email });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/mail/folders
 * Get folder list
 */
router.get('/folders', protect, async (req, res) => {
    try {
        if (!imapService.isConnected(req.user._id.toString())) {
            return res.status(401).json({ success: false, error: 'Not connected' });
        }

        const folders = await imapService.getFolders(req.user._id.toString());
        res.json({ success: true, folders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * PUT /api/mail/email/:uid/read
 * Mark email as read/unread
 */
router.put('/email/:uid/read', protect, async (req, res) => {
    try {
        const { read = true, folder = 'INBOX' } = req.body;

        if (!imapService.isConnected(req.user._id.toString())) {
            return res.status(401).json({ success: false, error: 'Not connected' });
        }

        await imapService.markRead(
            req.user._id.toString(),
            req.params.uid,
            read,
            folder
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * DELETE /api/mail/email/:uid
 * Delete email
 */
router.delete('/email/:uid', protect, async (req, res) => {
    try {
        const { folder = 'INBOX' } = req.query;

        if (!imapService.isConnected(req.user._id.toString())) {
            return res.status(401).json({ success: false, error: 'Not connected' });
        }

        await imapService.deleteEmail(
            req.user._id.toString(),
            req.params.uid,
            folder
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
