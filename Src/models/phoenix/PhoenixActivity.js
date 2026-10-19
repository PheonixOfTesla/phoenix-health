// ============================================
// PHOENIX ACTIVITY MODEL - Unified Activity Log
// ============================================
// Single source of truth for ALL Phoenix activities
// "Show me everything that happened" - answered here
// ============================================

const mongoose = require('mongoose');

const phoenixActivitySchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Activity category (which system triggered this)
  category: {
    type: String,
    required: true,
    enum: [
      'butler',      // Butler automations (calls, SMS, email, orders)
      'genesis',     // Genesis file operations (create, edit, move, delete)
      'phoenix',     // Phoenix AI interactions (voice, chat, insights)
      'mercury',     // Health & biometrics
      'venus',       // Fitness & training
      'earth',       // Calendar & energy
      'mars',        // Goals & habits
      'jupiter',     // Finance & budgeting
      'saturn',      // Legacy & vision
      'uranus',      // Innovation & learning
      'neptune',     // Mindfulness & mental health
      'system',      // System events (sync, connection, errors)
      'user'         // User actions (navigation, settings)
    ],
    index: true
  },

  // Specific action type
  action: {
    type: String,
    required: true,
    index: true
    // Examples: 'call_made', 'file_created', 'workout_logged', 'insight_generated'
  },

  // Human-readable title
  title: {
    type: String,
    required: true,
    maxlength: 200
  },

  // Detailed description
  description: {
    type: String,
    maxlength: 2000
  },

  // Status of the activity
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'completed',
    index: true
  },

  // Priority/importance
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal'
  },

  // Direction: inbound (from external) or outbound (to external)
  direction: {
    type: String,
    enum: ['inbound', 'outbound', 'internal'],
    default: 'internal'
  },

  // Flexible metadata for action-specific data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Related entities (for cross-referencing)
  relatedTo: [{
    type: { type: String },  // 'conversation', 'document', 'workout', etc.
    id: mongoose.Schema.Types.ObjectId,
    label: String
  }],

  // Source of the activity
  source: {
    type: String,
    enum: ['ai', 'user', 'automation', 'webhook', 'sync', 'scheduled'],
    default: 'ai'
  },

  // AI model that triggered (if applicable)
  aiModel: {
    type: String
  },

  // Session/conversation context
  sessionId: {
    type: String
  },

  // Duration (for timed activities)
  durationMs: {
    type: Number
  },

  // Error info (if failed)
  error: {
    message: String,
    code: String,
    stack: String
  },

  // Timestamps
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }

}, {
  timestamps: true
});

// ========================================
// INDEXES
// ========================================

// Primary query patterns
phoenixActivitySchema.index({ userId: 1, createdAt: -1 });
phoenixActivitySchema.index({ userId: 1, category: 1, createdAt: -1 });
phoenixActivitySchema.index({ userId: 1, action: 1, createdAt: -1 });
phoenixActivitySchema.index({ userId: 1, status: 1 });
phoenixActivitySchema.index({ userId: 1, source: 1 });
phoenixActivitySchema.index({ userId: 1, direction: 1 });

// Time-based queries
phoenixActivitySchema.index({ createdAt: -1 });
phoenixActivitySchema.index({ startedAt: -1 });

// TTL - Keep activities for 1 year
phoenixActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// ========================================
// STATICS - Log Creators
// ========================================

// Generic activity logger
phoenixActivitySchema.statics.log = async function(userId, category, action, data = {}) {
  return this.create({
    userId,
    category,
    action,
    title: data.title || action.replace(/_/g, ' '),
    description: data.description,
    status: data.status || 'completed',
    priority: data.priority || 'normal',
    direction: data.direction || 'internal',
    metadata: data.metadata || {},
    relatedTo: data.relatedTo || [],
    source: data.source || 'ai',
    aiModel: data.aiModel,
    sessionId: data.sessionId,
    durationMs: data.durationMs,
    startedAt: data.startedAt || new Date(),
    completedAt: data.completedAt || new Date()
  });
};

// Butler action logger
phoenixActivitySchema.statics.logButler = async function(userId, action, data = {}) {
  const directionMap = {
    call_made: 'outbound',
    call_received: 'inbound',
    sms_sent: 'outbound',
    sms_received: 'inbound',
    email_sent: 'outbound',
    email_received: 'inbound',
    order_placed: 'outbound',
    reservation_made: 'outbound'
  };

  return this.log(userId, 'butler', action, {
    ...data,
    direction: data.direction || directionMap[action] || 'outbound',
    source: data.source || 'automation'
  });
};

// Genesis file operation logger
phoenixActivitySchema.statics.logGenesis = async function(userId, action, data = {}) {
  return this.log(userId, 'genesis', action, {
    ...data,
    source: data.source || 'ai'
  });
};

// Phoenix AI interaction logger
phoenixActivitySchema.statics.logPhoenix = async function(userId, action, data = {}) {
  return this.log(userId, 'phoenix', action, {
    ...data,
    source: data.source || 'ai'
  });
};

// System event logger
phoenixActivitySchema.statics.logSystem = async function(userId, action, data = {}) {
  return this.log(userId, 'system', action, {
    ...data,
    source: data.source || 'sync'
  });
};

// ========================================
// STATICS - Queries
// ========================================

// Get recent activity (the "everything that happened" query)
phoenixActivitySchema.statics.getRecent = function(userId, options = {}) {
  const {
    limit = 50,
    category = null,
    action = null,
    status = null,
    source = null,
    direction = null,
    startDate = null,
    endDate = null
  } = options;

  const query = { userId };

  if (category) query.category = category;
  if (action) query.action = action;
  if (status) query.status = status;
  if (source) query.source = source;
  if (direction) query.direction = direction;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Get today's activities
phoenixActivitySchema.statics.getToday = function(userId, options = {}) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return this.getRecent(userId, {
    ...options,
    startDate: startOfDay
  });
};

// Get activity timeline (grouped by hour)
phoenixActivitySchema.statics.getTimeline = async function(userId, date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        activities: { $push: '$$ROOT' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Get activity statistics
phoenixActivitySchema.statics.getStats = async function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Get activity by direction (inbound vs outbound)
phoenixActivitySchema.statics.getByDirection = async function(userId, direction, options = {}) {
  return this.getRecent(userId, { ...options, direction });
};

// Search activities
phoenixActivitySchema.statics.search = function(userId, searchTerm, options = {}) {
  const { limit = 50 } = options;

  return this.find({
    userId,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Get pending activities
phoenixActivitySchema.statics.getPending = function(userId) {
  return this.find({
    userId,
    status: { $in: ['pending', 'in_progress'] }
  }).sort({ priority: -1, createdAt: 1 });
};

// ========================================
// METHODS
// ========================================

// Mark as completed
phoenixActivitySchema.methods.complete = function(metadata = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (this.startedAt) {
    this.durationMs = this.completedAt - this.startedAt;
  }
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

// Mark as failed
phoenixActivitySchema.methods.fail = function(error) {
  this.status = 'failed';
  this.completedAt = new Date();
  if (typeof error === 'string') {
    this.error = { message: error };
  } else if (error instanceof Error) {
    this.error = {
      message: error.message,
      stack: error.stack
    };
  } else {
    this.error = error;
  }
  return this.save();
};

// Add related entity
phoenixActivitySchema.methods.addRelation = function(type, id, label) {
  this.relatedTo.push({ type, id, label });
  return this.save();
};

// ========================================
// JSON TRANSFORM
// ========================================

phoenixActivitySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const PhoenixActivity = mongoose.model('PhoenixActivity', phoenixActivitySchema);

module.exports = PhoenixActivity;
