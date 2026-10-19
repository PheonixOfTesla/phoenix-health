/**
 * GENESIS OPERATION MODEL
 *
 * Purpose: Track all Genesis self-modification operations for audit and rollback
 * Every code generation, file modification, deployment is logged here
 */

const mongoose = require('mongoose');

const GenesisOperationSchema = new mongoose.Schema({
  // Unique operation identifier
  operationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // When operation started
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },

  // When operation completed (success or failure)
  completedAt: {
    type: Date
  },

  // User who triggered the operation (God account)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Type of Genesis operation
  operationType: {
    type: String,
    required: true,
    enum: [
      'code_generation',
      'file_modification',
      'file_creation',
      'file_deletion',
      'deployment',
      'rollback',
      'optimization',
      'analysis',
      'git_operation',
      'package_operation',
      'autonomous_fix',
      'account_creation'
    ],
    index: true
  },

  // Files that were changed
  filesChanged: [{
    path: String,
    action: {
      type: String,
      enum: ['create', 'modify', 'delete']
    },
    linesAdded: Number,
    linesDeleted: Number,
    backupPath: String, // Path to backup file
    diffSummary: String
  }],

  // Operation result
  success: {
    type: Boolean,
    default: null, // null = in progress, true/false = completed
    index: true
  },

  // Result data (for successful operations)
  result: {
    type: mongoose.Schema.Types.Mixed
  },

  // Error message (for failed operations)
  error: {
    type: String
  },

  // Error stack trace
  errorStack: {
    type: String
  },

  // Backup data for rollback capability
  rollbackData: {
    type: mongoose.Schema.Types.Mixed
  },

  // Additional operation metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Deployment information (if applicable)
  deployment: {
    target: String, // 'backend', 'frontend', 'all'
    deploymentId: String,
    url: String,
    status: String
  },

  // Git information (if applicable)
  git: {
    commitSha: String,
    commitMessage: String,
    branch: String,
    repository: String // 'pal-backend' or 'phoenix-fe'
  },

  // Duration in milliseconds
  duration: {
    type: Number
  }
}, {
  timestamps: true
});

// Indexes for fast queries
GenesisOperationSchema.index({ user: 1, timestamp: -1 });
GenesisOperationSchema.index({ operationType: 1, timestamp: -1 });
GenesisOperationSchema.index({ success: 1, timestamp: -1 });
GenesisOperationSchema.index({ 'git.commitSha': 1 });

// Virtual for operation status
GenesisOperationSchema.virtual('status').get(function() {
  if (this.success === null) return 'in_progress';
  if (this.success === true) return 'success';
  return 'failed';
});

// Calculate duration before saving
GenesisOperationSchema.pre('save', function(next) {
  if (this.completedAt && this.timestamp) {
    this.duration = this.completedAt - this.timestamp;
  }
  next();
});

// Instance method: Mark as success
GenesisOperationSchema.methods.markSuccess = async function(result = {}) {
  this.success = true;
  this.result = result;
  this.completedAt = new Date();
  if (this.timestamp) {
    this.duration = this.completedAt - this.timestamp;
  }
  await this.save();
  return this;
};

// Instance method: Mark as failure
GenesisOperationSchema.methods.markFailure = async function(error) {
  this.success = false;
  this.error = error.message || String(error);
  this.errorStack = error.stack;
  this.completedAt = new Date();
  if (this.timestamp) {
    this.duration = this.completedAt - this.timestamp;
  }
  await this.save();
  return this;
};

// Static method: Get recent operations
GenesisOperationSchema.statics.getRecent = async function(limit = 50) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name email')
    .lean();
};

// Static method: Get operations by type
GenesisOperationSchema.statics.getByType = async function(operationType, limit = 50) {
  return this.find({ operationType })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('user', 'name email')
    .lean();
};

// Static method: Get active operations
GenesisOperationSchema.statics.getActive = async function() {
  return this.find({
    success: null,
    timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
  })
  .populate('user', 'name email')
  .lean();
};

// Static method: Get success rate
GenesisOperationSchema.statics.getSuccessRate = async function(timeframe = 24 * 60 * 60 * 1000) {
  const since = new Date(Date.now() - timeframe);

  const total = await this.countDocuments({
    timestamp: { $gte: since },
    success: { $ne: null }
  });

  const successful = await this.countDocuments({
    timestamp: { $gte: since },
    success: true
  });

  return total > 0 ? (successful / total) * 100 : 0;
};

// Static method: Get operation stats
GenesisOperationSchema.statics.getStats = async function(timeframe = 24 * 60 * 60 * 1000) {
  const since = new Date(Date.now() - timeframe);

  const stats = await this.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: '$operationType',
        count: { $sum: 1 },
        successful: {
          $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
        },
        avgDuration: { $avg: '$duration' }
      }
    }
  ]);

  return stats;
};

const GenesisOperation = mongoose.model('GenesisOperation', GenesisOperationSchema);

module.exports = GenesisOperation;
