/**
 * GENESIS SNAPSHOT MODEL
 *
 * Purpose: Store system snapshots for rollback capability
 * Compressed JSON storage of file states before operations
 */

const mongoose = require('mongoose');

const GenesisSnapshotSchema = new mongoose.Schema({
  // Link to operation
  operationId: {
    type: String,
    required: true,
    index: true
  },

  // Type of operation that created this snapshot
  operationType: {
    type: String,
    required: true,
    enum: [
      'code_generation',
      'file_modification',
      'deployment',
      'optimization',
      'git_operation'
    ]
  },

  // Compressed snapshot data
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // When snapshot was created
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // Success status
  success: {
    type: Boolean,
    default: null
  },

  // Error log if operation failed
  errorLog: {
    type: String
  },

  // Metadata
  metadata: {
    fileCount: Number,
    totalSize: Number,
    compressed: Boolean
  }
}, {
  timestamps: true
});

// Index for cleanup
GenesisSnapshotSchema.index({ timestamp: -1 });

// TTL index - auto-delete after 30 days
GenesisSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('GenesisSnapshot', GenesisSnapshotSchema);
