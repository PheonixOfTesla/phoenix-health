// ============================================================================
// SMS VERIFICATION - Twilio Verify API
// ============================================================================

const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Send verification code
router.post('/send-verification', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number required' });
        }

        

        const verification = await client.verify.v2
            .services(VERIFY_SERVICE_SID)
            .verifications
            .create({ to: phone, channel: 'sms' });

        

        res.json({
            success: true,
            message: 'Verification code sent',
            status: verification.status
        });

    } catch (error) {
        console.error('[SMS] Send error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send verification code',
            message: error.message
        });
    }
});

// Verify code - requires authentication to link verification to user
router.post('/verify-code', protect, async (req, res) => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ success: false, error: 'Phone and code required' });
        }

        

        const verificationCheck = await client.verify.v2
            .services(VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: phone, code: code });

        const isApproved = verificationCheck.status === 'approved';

        if (isApproved) {
            

            // Update user's phoneVerified status
            const user = await User.findById(req.user.id);
            if (user && user.phone === phone) {
                user.phoneVerified = true;
                user.phoneVerifiedAt = new Date();
                await user.save();
                
            } else {
                console.warn(`[SMS] ⚠️ Phone mismatch: user has ${user?.phone}, verified ${phone}`);
            }
        } else {
            
        }

        res.json({
            success: isApproved,
            message: isApproved ? 'Phone verified successfully' : 'Invalid verification code',
            phone: phone
        });

    } catch (error) {
        console.error('[SMS] Verify error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
            message: error.message
        });
    }
});

// Resend code (Twilio Verify handles rate limiting automatically)
router.post('/resend-code', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, error: 'Phone number required' });
        }

        

        const verification = await client.verify.v2
            .services(VERIFY_SERVICE_SID)
            .verifications
            .create({ to: phone, channel: 'sms' });

        res.json({
            success: true,
            message: 'Verification code resent',
            status: verification.status
        });

    } catch (error) {
        console.error('[SMS] Resend error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resend code',
            message: error.message
        });
    }
});

// Status check
router.get('/status', (req, res) => {
    res.json({
        success: true,
        status: VERIFY_SERVICE_SID ? 'operational' : 'unavailable',
        hasTwilioAccount: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasVerifyService: !!VERIFY_SERVICE_SID
    });
});

module.exports = router;
