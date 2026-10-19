// Src/models/SyncBlob.js - Encrypted Cross-Device Sync Storage
const mongoose = require('mongoose');

const syncBlobSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Unique blob identifier
  blobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Device identifier
  deviceId: {
    type: String,
    required: true,
    index: true
  },

  // Base64 encrypted blob data
  blob: {
    type: String,
    required: true
  },

  // Metadata
  metadata: {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    version: {
      type: Number,
      required: true,
      default: 1
    },
    checksum: {
      type: String,
      required: true
    },
    compressed: {
      type: Boolean,
      default: false
    },
    size: {
      type: Number,
      required: true
    }
  },

  // Upload timestamp
  uploadedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
syncBlobSchema.index({ userId: 1, uploadedAt: -1 });
syncBlobSchema.index({ userId: 1, deviceId: 1 });

// TTL index - Auto-delete blobs older than 90 days
syncBlobSchema.index({ uploadedAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days in seconds

module.exports = mongoose.model('SyncBlob', syncBlobSchema);
