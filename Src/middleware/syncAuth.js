// Src/middleware/syncAuth.js - Sync Subscription Authorization
const Subscription = require('../models/Subscription');

// Verify user has active sync subscription with available quota
exports.requireSync = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get user's subscription
    const subscription = await Subscription.findOne({ userId: req.user._id });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'No subscription found',
        message: 'A subscription is required to use cross-device sync',
        requiresUpgrade: true
      });
    }

    // Check if sync is enabled for this subscription
    if (!subscription.syncEnabled) {
      return res.status(403).json({
        success: false,
        error: 'Sync not enabled',
        message: 'Cross-device sync is not enabled on your subscription plan',
        requiresUpgrade: true,
        currentPlan: subscription.plan
      });
    }

    // Check if subscription is active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return res.status(403).json({
        success: false,
        error: 'Subscription inactive',
        message: 'Your subscription is not active. Please update your payment method.',
        requiresPayment: true,
        status: subscription.status
      });
    }

    // Attach subscription to request for quota checks
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Sync auth error:', error);
    return res.status(500).json({
      success: false,
      error: 'Sync authorization failed',
      message: error.message
    });
  }
};

// Check quota before upload (call after requireSync)
exports.checkQuota = (req, res, next) => {
  const { subscription } = req;

  if (!subscription) {
    return res.status(500).json({
      success: false,
      error: 'Subscription not found in request'
    });
  }

  // Check if quota exceeded
  if (subscription.syncUsed >= subscription.syncQuota) {
    const usedGB = (subscription.syncUsed / 1073741824).toFixed(2);
    const quotaGB = (subscription.syncQuota / 1073741824).toFixed(2);

    return res.status(403).json({
      success: false,
      error: 'Quota exceeded',
      message: `You have used ${usedGB}GB of your ${quotaGB}GB sync storage quota`,
      quotaExceeded: true,
      used: subscription.syncUsed,
      quota: subscription.syncQuota,
      requiresUpgrade: true
    });
  }

  next();
};

module.exports = exports;
