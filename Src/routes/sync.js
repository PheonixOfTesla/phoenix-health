// Src/routes/sync.js - Cross-Device Sync API
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const { requireSync, checkQuota } = require('../middleware/syncAuth');
const SyncBlob = require('../models/SyncBlob');
const Subscription = require('../models/Subscription');

// ============================================================================
// SYNC API ROUTES
// ============================================================================

// POST /api/sync/upload - Upload encrypted blob
router.post('/upload', protect, requireSync, checkQuota, async (req, res) => {
  try {
    const { deviceId, blob, metadata } = req.body;

    if (!deviceId || !blob || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'deviceId, blob, and metadata are required'
      });
    }

    // Validate metadata
    if (!metadata.checksum || !metadata.size) {
      return res.status(400).json({
        success: false,
        error: 'Invalid metadata',
        message: 'checksum and size are required in metadata'
      });
    }

    // Verify checksum
    const computedChecksum = crypto
      .createHash('sha256')
      .update(blob)
      .digest('hex');

    if (computedChecksum !== metadata.checksum) {
      return res.status(400).json({
        success: false,
        error: 'Checksum mismatch',
        message: 'Blob checksum does not match provided checksum'
      });
    }

    // Check if upload would exceed quota
    const newUsage = req.subscription.syncUsed + metadata.size;
    if (newUsage > req.subscription.syncQuota) {
      return res.status(403).json({
        success: false,
        error: 'Quota exceeded',
        message: 'Upload would exceed your sync storage quota',
        quotaExceeded: true
      });
    }

    // Generate unique blob ID
    const blobId = `${req.user._id}_${deviceId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    // Create sync blob
    const syncBlob = await SyncBlob.create({
      userId: req.user._id,
      blobId,
      deviceId,
      blob,
      metadata: {
        timestamp: metadata.timestamp || new Date(),
        version: metadata.version || 1,
        checksum: metadata.checksum,
        compressed: metadata.compressed || false,
        size: metadata.size
      },
      uploadedAt: new Date()
    });

    // Update subscription sync usage
    await Subscription.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { syncUsed: metadata.size } }
    );

    res.status(201).json({
      success: true,
      message: 'Blob uploaded successfully',
      blobId: syncBlob.blobId,
      uploadedAt: syncBlob.uploadedAt,
      size: metadata.size,
      newUsage: newUsage
    });
  } catch (error) {
    console.error('Sync upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error.message
    });
  }
});

// GET /api/sync/download - Download latest blob
router.get('/download', protect, requireSync, async (req, res) => {
  try {
    const { deviceId } = req.query;

    // Build query
    const query = { userId: req.user._id };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    // Get latest blob
    const syncBlob = await SyncBlob.findOne(query)
      .sort({ uploadedAt: -1 })
      .lean();

    if (!syncBlob) {
      return res.status(404).json({
        success: false,
        error: 'No sync data found',
        message: deviceId
          ? `No sync data found for device ${deviceId}`
          : 'No sync data found for any device'
      });
    }

    res.status(200).json({
      success: true,
      blobId: syncBlob.blobId,
      deviceId: syncBlob.deviceId,
      blob: syncBlob.blob,
      metadata: syncBlob.metadata,
      uploadedAt: syncBlob.uploadedAt
    });
  } catch (error) {
    console.error('Sync download error:', error);
    res.status(500).json({
      success: false,
      error: 'Download failed',
      message: error.message
    });
  }
});

// GET /api/sync/list - List all blobs for user
router.get('/list', protect, requireSync, async (req, res) => {
  try {
    const { deviceId, limit = 50, offset = 0 } = req.query;

    // Build query
    const query = { userId: req.user._id };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    // Get blobs
    const blobs = await SyncBlob.find(query)
      .select('-blob') // Don't return actual blob data in list
      .sort({ uploadedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Get total count
    const total = await SyncBlob.countDocuments(query);

    res.status(200).json({
      success: true,
      blobs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Sync list error:', error);
    res.status(500).json({
      success: false,
      error: 'List failed',
      message: error.message
    });
  }
});

// DELETE /api/sync/blob/:blobId - Delete specific blob
router.delete('/blob/:blobId', protect, requireSync, async (req, res) => {
  try {
    const { blobId } = req.params;

    // Find and delete blob
    const syncBlob = await SyncBlob.findOne({
      blobId,
      userId: req.user._id
    });

    if (!syncBlob) {
      return res.status(404).json({
        success: false,
        error: 'Blob not found',
        message: 'No blob found with that ID'
      });
    }

    const size = syncBlob.metadata.size;
    await syncBlob.deleteOne();

    // Update subscription sync usage
    await Subscription.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { syncUsed: -size } }
    );

    res.status(200).json({
      success: true,
      message: 'Blob deleted successfully',
      freedSpace: size
    });
  } catch (error) {
    console.error('Sync delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Delete failed',
      message: error.message
    });
  }
});

// GET /api/sync/status - Sync status and quota
router.get('/status', protect, requireSync, async (req, res) => {
  try {
    const subscription = req.subscription;

    // Get blob count
    const blobCount = await SyncBlob.countDocuments({ userId: req.user._id });

    // Get device list
    const devices = await SyncBlob.distinct('deviceId', { userId: req.user._id });

    // Calculate usage percentage
    const usagePercent = ((subscription.syncUsed / subscription.syncQuota) * 100).toFixed(2);

    res.status(200).json({
      success: true,
      status: {
        enabled: subscription.syncEnabled,
        plan: subscription.plan,
        quota: {
          used: subscription.syncUsed,
          total: subscription.syncQuota,
          available: subscription.syncQuota - subscription.syncUsed,
          usagePercent: parseFloat(usagePercent)
        },
        stats: {
          blobCount,
          deviceCount: devices.length,
          devices
        }
      }
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: error.message
    });
  }
});

module.exports = router;
