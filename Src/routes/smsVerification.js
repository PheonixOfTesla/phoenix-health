// Src/routes/smsVerification.js - SMS Verification Routes
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// Twilio setup (if available)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        const twilio = require('twilio');
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('[SMS] Twilio client initialized');
    } catch (error) {
        console.warn('[SMS] Twilio not available, using mock mode');
    }
}

// Generate 6-digit verification code
function generateVerificationCode() {
    return crypto.randomInt(100000, 999999).toString();
}

// Hash the code for storage
function hashCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * POST /api/sms-verification/send-verification
 * Send SMS verification code to phone number (PUBLIC - no auth required)
 */
router.post('/send-verification', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Clean phone number (remove spaces, dashes, etc)
        const cleanPhone = phone.replace(/[^+\d]/g, '');

        // Find or prepare to create user
        let user = await User.findOne({ phone: cleanPhone });

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const hashedCode = hashCode(verificationCode);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (user) {
            // Update existing user's verification code
            user.phoneVerificationCode = hashedCode;
            user.phoneVerificationExpires = expiresAt;
            await user.save();
        } else {
            // Store pending verification (will be used during registration)
            // For now, we'll just return success - the code will be verified during registration
        }

        // Send SMS via Twilio (if available)
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            try {
                await twilioClient.messages.create({
                    body: `Your Phoenix verification code is: ${verificationCode}. It expires in 10 minutes.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: cleanPhone
                });
                console.log(`[SMS] Verification code sent to ${cleanPhone}`);
            } catch (twilioError) {
                console.error('[SMS] Twilio error:', twilioError.message);
                // Fall back to mock mode
            }
        }

        // In development/mock mode, include the code in response
        const response = {
            success: true,
            message: 'Verification code sent',
            phone: cleanPhone
        };

        // Only expose code in development mode
        if (process.env.NODE_ENV === 'development' || !twilioClient) {
            response.code = verificationCode;
            response._devNote = 'Code exposed in development/mock mode only';
        }

        // Store code temporarily for verification (in-memory for simplicity)
        // In production, this should be in Redis
        global.pendingVerifications = global.pendingVerifications || {};
        global.pendingVerifications[cleanPhone] = {
            code: hashedCode,
            expires: expiresAt
        };

        res.json(response);

    } catch (error) {
        console.error('[SMS] Send verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send verification code'
        });
    }
});

/**
 * POST /api/sms-verification/verify-code-public
 * Verify SMS code (PUBLIC - for pre-registration verification)
 */
router.post('/verify-code-public', async (req, res) => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and code are required'
            });
        }

        const cleanPhone = phone.replace(/[^+\d]/g, '');
        const hashedCode = hashCode(code);

        // Check existing user first
        const user = await User.findOne({ phone: cleanPhone });

        if (user) {
            // Verify against stored code in user document
            if (user.phoneVerificationCode === hashedCode &&
                user.phoneVerificationExpires &&
                user.phoneVerificationExpires > Date.now()) {

                user.phoneVerified = true;
                user.phoneVerificationCode = undefined;
                user.phoneVerificationExpires = undefined;
                await user.save();

                return res.json({
                    success: true,
                    message: 'Phone verified successfully',
                    verified: true
                });
            }
        }

        // Check pending verifications (for new registrations)
        const pending = global.pendingVerifications?.[cleanPhone];
        if (pending && pending.code === hashedCode && pending.expires > Date.now()) {
            // Mark as verified in pending store
            pending.verified = true;

            return res.json({
                success: true,
                message: 'Code verified. You can now complete registration.',
                verified: true
            });
        }

        return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification code',
            verified: false
        });

    } catch (error) {
        console.error('[SMS] Verify code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify code'
        });
    }
});

/**
 * POST /api/sms-verification/resend
 * Resend verification code
 */
router.post('/resend', async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Rate limiting check
        const cleanPhone = phone.replace(/[^+\d]/g, '');
        const pending = global.pendingVerifications?.[cleanPhone];

        if (pending && pending.lastSent && Date.now() - pending.lastSent < 60000) {
            return res.status(429).json({
                success: false,
                message: 'Please wait before requesting another code',
                retryAfter: Math.ceil((60000 - (Date.now() - pending.lastSent)) / 1000)
            });
        }

        // Generate new code
        const verificationCode = generateVerificationCode();
        const hashedCode = hashCode(verificationCode);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store in pending verifications
        global.pendingVerifications = global.pendingVerifications || {};
        global.pendingVerifications[cleanPhone] = {
            code: hashedCode,
            expires: expiresAt,
            lastSent: Date.now()
        };

        // Update user if exists
        const user = await User.findOne({ phone: cleanPhone });
        if (user) {
            user.phoneVerificationCode = hashedCode;
            user.phoneVerificationExpires = expiresAt;
            await user.save();
        }

        // Send via Twilio if available
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
            try {
                await twilioClient.messages.create({
                    body: `Your Phoenix verification code is: ${verificationCode}. It expires in 10 minutes.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: cleanPhone
                });
            } catch (twilioError) {
                console.error('[SMS] Twilio resend error:', twilioError.message);
            }
        }

        const response = {
            success: true,
            message: 'New verification code sent'
        };

        if (process.env.NODE_ENV === 'development' || !twilioClient) {
            response.code = verificationCode;
        }

        res.json(response);

    } catch (error) {
        console.error('[SMS] Resend error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend code'
        });
    }
});

/**
 * GET /api/sms-verification/status/:phone
 * Check verification status for a phone number
 */
router.get('/status/:phone', async (req, res) => {
    try {
        const cleanPhone = req.params.phone.replace(/[^+\d]/g, '');

        const user = await User.findOne({ phone: cleanPhone });

        if (user) {
            return res.json({
                success: true,
                verified: user.phoneVerified,
                hasAccount: true
            });
        }

        const pending = global.pendingVerifications?.[cleanPhone];
        if (pending?.verified) {
            return res.json({
                success: true,
                verified: true,
                hasAccount: false
            });
        }

        res.json({
            success: true,
            verified: false,
            hasAccount: false
        });

    } catch (error) {
        console.error('[SMS] Status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check status'
        });
    }
});

module.exports = router;
