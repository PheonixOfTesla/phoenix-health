// Src/routes/wearables.js - Fitbit/Polar Wearable OAuth Routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const wearableController = require('../controllers/wearableController');

// ============================================
// OAuth Flow
// ============================================

// Initiate OAuth (requires auth)
// GET /api/wearables/connect/:provider (fitbit, polar)
router.get('/connect/:provider', protect, wearableController.initiateOAuth2);

// OAuth callback (no auth - comes from provider redirect)
// GET /api/wearables/callback/:provider
router.get('/callback/:provider', wearableController.handleOAuth2Callback);

// ============================================
// Data Endpoints
// ============================================

// Sync wearable data
// POST /api/wearables/sync/:provider
router.post('/sync/:provider', protect, wearableController.syncWearableData);

// Get all connections
// GET /api/wearables/connections
router.get('/connections', protect, wearableController.getConnections);

// Disconnect a wearable
// DELETE /api/wearables/disconnect/:provider
router.delete('/disconnect/:provider', protect, wearableController.disconnect);

// Get latest synced data
// GET /api/wearables/data
router.get('/data', protect, wearableController.getLatestData);

module.exports = router;
