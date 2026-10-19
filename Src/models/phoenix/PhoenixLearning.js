// Src/models/phoenix/PhoenixLearning.js
// Model for Phoenix's real-time learning from every interaction
// Enables Phoenix to get smarter without model retraining

const mongoose = require('mongoose');

const phoenixLearningSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // ========================================
  // INTERACTION LOGGING
  // ========================================

  interactionType: {
    type: String,
    required: true,
    enum: [
      'query',              // User question/request
      'prediction',         // Phoenix prediction
      'suggestion',         // Phoenix suggestion
      'pattern_detection',  // Pattern detection result
      'intervention',       // Phoenix intervention
      'conversation',       // General conversation
      'feedback'            // User feedback on previous interaction
    ],
    index: true
  },

  // Original query/input from user
  query: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // Phoenix's response
  response: {
    type: String,
    required: true,
    maxlength: 5000
  },

  // Context at time of interaction
  context: {
    timeOfDay: String,                    // morning, afternoon, evening, night
    dayOfWeek: String,                    // monday, tuesday, etc.
    userState: String,                    // active, stressed, recovering, etc.
    recentPatterns: [String],             // Recent pattern IDs
    confidenceLevel: {                    // Phoenix's confidence when responding
      type: Number,
      min: 0,
      max: 1
    },
    topicArea: String,                    // health, productivity, recovery, etc.
    relatedMetrics: mongoose.Schema.Types.Mixed  // Relevant metrics at time
  },

  // ========================================
  // OUTCOME TRACKING
  // ========================================

  outcome: {
    type: String,
    enum: [
      'success',           // User satisfied, goal achieved
      'partial_success',   // Partially helpful
      'failure',           // Not helpful or wrong
      'unknown',           // No feedback yet
      'dismissed',         // User dismissed/ignored
      'acted_upon'         // User took action based on response
    ],
    default: 'unknown',
    index: true
  },

  // User satisfaction rating (1-5)
  userRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },

  // Explicit user feedback
  userFeedback: {
    helpful: Boolean,
    accurate: Boolean,
    timely: Boolean,
    actionable: Boolean,
    comments: String
  },

  // Did user act on the response?
  actionTaken: {
    type: Boolean,
    default: false
  },

  // What action was taken (if any)
  actionDetails: {
    type: String,
    maxlength: 500
  },

  // Time to outcome (how long before we knew if it worked)
  timeToOutcome: {
    type: Number,  // milliseconds
    default: null
  },

  // ========================================
  // PATTERN DETECTION
  // ========================================

  // Patterns identified from this interaction
  learnedPatterns: [{
    patternType: {
      type: String,
      enum: [
        'user_preference',      // User likes/dislikes this
        'effective_approach',   // This approach works for this user
        'timing_preference',    // When user prefers certain interactions
        'topic_expertise',      // User knowledge level on topic
        'response_style',       // Communication style that works
        'trigger_word',         // Words that indicate specific intent
        'context_pattern',      // Contextual patterns
        'failure_pattern'       // What doesn't work
      ]
    },
    pattern: String,           // Description of pattern
    confidence: {              // Confidence in this pattern
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    evidence: [String],        // Supporting evidence
    firstSeen: {
      type: Date,
      default: Date.now
    },
    frequency: {               // How often this pattern appears
      type: Number,
      default: 1
    }
  }],

  // ========================================
  // CONFIDENCE CALIBRATION
  // ========================================

  // Phoenix's predicted confidence vs actual outcome
  confidenceCalibration: {
    predicted: {               // What Phoenix thought
      type: Number,
      min: 0,
      max: 1
    },
    actual: {                  // How it actually turned out
      type: Number,
      min: 0,
      max: 1
    },
    error: {                   // Prediction error
      type: Number
    },
    calibrationGroup: {        // For grouping similar predictions
      type: String,
      enum: ['health', 'productivity', 'recovery', 'mental_health', 'general']
    }
  },

  // ========================================
  // BEHAVIOR ADJUSTMENTS
  // ========================================

  // Adjustments made based on this learning
  adjustments: [{
    adjustmentType: {
      type: String,
      enum: [
        'confidence_threshold',   // Adjust confidence thresholds
        'response_tone',          // Adjust communication tone
        'timing_window',          // Adjust when to respond
        'topic_approach',         // Adjust how to handle topic
        'intervention_strategy',  // Adjust intervention approach
        'question_style'          // Adjust how to ask questions
      ]
    },
    before: String,            // What it was before
    after: String,             // What it changed to
    reason: String,            // Why adjustment was made
    appliedAt: {
      type: Date,
      default: Date.now
    },
    effectiveness: {           // Track if adjustment helped
      type: Number,
      min: 0,
      max: 1,
      default: null
    }
  }],

  // ========================================
  // TEMPORAL TRACKING
  // ========================================

  interactionTimestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  outcomeTimestamp: {
    type: Date,
    default: null
  },

  // How long it took Phoenix to respond (performance metric)
  responseTime: {
    type: Number,  // milliseconds
    default: null
  },

  // ========================================
  // METADATA
  // ========================================

  // Phoenix version/model that generated response
  phoenixVersion: {
    type: String,
    default: '1.0'
  },

  // Session ID for grouping related interactions
  sessionId: {
    type: String,
    index: true
  },

  // Related interaction IDs (for conversation threads)
  relatedInteractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhoenixLearning'
  }],

  // Tags for categorization
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],

  // For analysis and debugging
  debugInfo: mongoose.Schema.Types.Mixed,

  // Processed by learning algorithms?
  processed: {
    type: Boolean,
    default: false,
    index: true
  },

  // Processing timestamp
  processedAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

// ========================================
// INDEXES
// ========================================

// Compound indexes for common queries
phoenixLearningSchema.index({ userId: 1, interactionTimestamp: -1 });
phoenixLearningSchema.index({ userId: 1, interactionType: 1 });
phoenixLearningSchema.index({ userId: 1, outcome: 1 });
phoenixLearningSchema.index({ userId: 1, 'context.topicArea': 1 });
phoenixLearningSchema.index({ sessionId: 1, interactionTimestamp: 1 });
phoenixLearningSchema.index({ processed: 1, createdAt: 1 }); // For batch processing
phoenixLearningSchema.index({ 'context.confidenceLevel': 1, outcome: 1 }); // For calibration

// TTL index for automatic cleanup (optional - keep 1 year)
phoenixLearningSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// ========================================
// VIRTUALS
// ========================================

// Calculate interaction success rate
phoenixLearningSchema.virtual('isSuccessful').get(function() {
  return this.outcome === 'success' || this.outcome === 'acted_upon';
});

// Calculate confidence error
phoenixLearningSchema.virtual('confidenceError').get(function() {
  if (!this.confidenceCalibration ||
      this.confidenceCalibration.predicted === null ||
      this.confidenceCalibration.actual === null) {
    return null;
  }
  return Math.abs(this.confidenceCalibration.predicted - this.confidenceCalibration.actual);
});

// Check if feedback is available
phoenixLearningSchema.virtual('hasFeedback').get(function() {
  return this.outcome !== 'unknown' || this.userRating !== null;
});

// ========================================
// METHODS
// ========================================

// Record outcome after interaction
phoenixLearningSchema.methods.recordOutcome = async function(outcome, rating = null, feedback = null) {
  this.outcome = outcome;
  this.outcomeTimestamp = new Date();

  if (rating) {
    this.userRating = rating;
  }

  if (feedback) {
    this.userFeedback = {
      ...this.userFeedback,
      ...feedback
    };
  }

  // Calculate time to outcome
  if (this.interactionTimestamp) {
    this.timeToOutcome = Date.now() - this.interactionTimestamp.getTime();
  }

  // Update confidence calibration actual value
  if (this.confidenceCalibration && this.confidenceCalibration.predicted !== null) {
    // Map outcome to 0-1 scale
    const outcomeMap = {
      'success': 1.0,
      'acted_upon': 1.0,
      'partial_success': 0.6,
      'dismissed': 0.3,
      'failure': 0.0,
      'unknown': 0.5
    };

    this.confidenceCalibration.actual = outcomeMap[outcome] || 0.5;
    this.confidenceCalibration.error = Math.abs(
      this.confidenceCalibration.predicted - this.confidenceCalibration.actual
    );
  }

  return this.save();
};

// Add a learned pattern
phoenixLearningSchema.methods.addLearnedPattern = async function(patternData) {
  const existingPattern = this.learnedPatterns.find(
    p => p.patternType === patternData.patternType && p.pattern === patternData.pattern
  );

  if (existingPattern) {
    existingPattern.frequency += 1;
    existingPattern.confidence = Math.min(1, existingPattern.confidence + 0.05);
    if (patternData.evidence) {
      existingPattern.evidence.push(...patternData.evidence);
    }
  } else {
    this.learnedPatterns.push({
      ...patternData,
      firstSeen: new Date(),
      frequency: 1
    });
  }

  return this.save();
};

// Add a behavior adjustment
phoenixLearningSchema.methods.addAdjustment = async function(adjustmentData) {
  this.adjustments.push({
    ...adjustmentData,
    appliedAt: new Date()
  });

  return this.save();
};

// Mark as processed
phoenixLearningSchema.methods.markProcessed = async function() {
  this.processed = true;
  this.processedAt = new Date();
  return this.save();
};

// ========================================
// STATICS
// ========================================

// Get all interactions for user in time range
phoenixLearningSchema.statics.getUserInteractions = function(userId, startDate, endDate) {
  const query = { userId };

  if (startDate || endDate) {
    query.interactionTimestamp = {};
    if (startDate) query.interactionTimestamp.$gte = startDate;
    if (endDate) query.interactionTimestamp.$lte = endDate;
  }

  return this.find(query)
    .sort({ interactionTimestamp: -1 })
    .exec();
};

// Get successful interactions for pattern learning
phoenixLearningSchema.statics.getSuccessfulInteractions = function(userId, limit = 100) {
  return this.find({
    userId,
    outcome: { $in: ['success', 'acted_upon'] }
  })
    .sort({ interactionTimestamp: -1 })
    .limit(limit)
    .exec();
};

// Get failed interactions for learning what NOT to do
phoenixLearningSchema.statics.getFailedInteractions = function(userId, limit = 100) {
  return this.find({
    userId,
    outcome: { $in: ['failure', 'dismissed'] }
  })
    .sort({ interactionTimestamp: -1 })
    .limit(limit)
    .exec();
};

// Get interactions by topic
phoenixLearningSchema.statics.getInteractionsByTopic = function(userId, topic) {
  return this.find({
    userId,
    'context.topicArea': topic
  })
    .sort({ interactionTimestamp: -1 })
    .exec();
};

// Calculate confidence calibration for topic
phoenixLearningSchema.statics.getConfidenceCalibration = async function(userId, calibrationGroup) {
  const interactions = await this.find({
    userId,
    'confidenceCalibration.predicted': { $ne: null },
    'confidenceCalibration.actual': { $ne: null },
    'confidenceCalibration.calibrationGroup': calibrationGroup
  });

  if (interactions.length === 0) return null;

  const totalError = interactions.reduce((sum, i) => sum + i.confidenceCalibration.error, 0);
  const avgError = totalError / interactions.length;

  // Calculate if Phoenix is over/under confident
  const totalBias = interactions.reduce(
    (sum, i) => sum + (i.confidenceCalibration.predicted - i.confidenceCalibration.actual),
    0
  );
  const avgBias = totalBias / interactions.length;

  return {
    group: calibrationGroup,
    sampleSize: interactions.length,
    averageError: avgError,
    averageBias: avgBias,
    isOverconfident: avgBias > 0.1,
    isUnderconfident: avgBias < -0.1,
    recommendation: avgBias > 0.1 ? 'REDUCE_CONFIDENCE' :
                    avgBias < -0.1 ? 'INCREASE_CONFIDENCE' :
                    'WELL_CALIBRATED'
  };
};

// Get unprocessed interactions for batch learning
phoenixLearningSchema.statics.getUnprocessed = function(limit = 1000) {
  return this.find({ processed: false })
    .sort({ createdAt: 1 })
    .limit(limit)
    .exec();
};

// Get interaction statistics
phoenixLearningSchema.statics.getStatistics = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const interactions = await this.find({
    userId,
    interactionTimestamp: { $gte: startDate }
  });

  const total = interactions.length;
  if (total === 0) return null;

  const successful = interactions.filter(i =>
    i.outcome === 'success' || i.outcome === 'acted_upon'
  ).length;

  const failed = interactions.filter(i =>
    i.outcome === 'failure' || i.outcome === 'dismissed'
  ).length;

  const avgRating = interactions
    .filter(i => i.userRating !== null)
    .reduce((sum, i) => sum + i.userRating, 0) /
    interactions.filter(i => i.userRating !== null).length;

  const avgResponseTime = interactions
    .filter(i => i.responseTime !== null)
    .reduce((sum, i) => sum + i.responseTime, 0) /
    interactions.filter(i => i.responseTime !== null).length;

  return {
    totalInteractions: total,
    successRate: (successful / total * 100).toFixed(2),
    failureRate: (failed / total * 100).toFixed(2),
    averageRating: avgRating ? avgRating.toFixed(2) : null,
    averageResponseTime: avgResponseTime ? Math.round(avgResponseTime) : null,
    topicBreakdown: this._getTopicBreakdown(interactions),
    interactionTypeBreakdown: this._getTypeBreakdown(interactions)
  };
};

// Helper: Get topic breakdown
phoenixLearningSchema.statics._getTopicBreakdown = function(interactions) {
  const topics = {};
  interactions.forEach(i => {
    const topic = i.context?.topicArea || 'unknown';
    topics[topic] = (topics[topic] || 0) + 1;
  });
  return topics;
};

// Helper: Get type breakdown
phoenixLearningSchema.statics._getTypeBreakdown = function(interactions) {
  const types = {};
  interactions.forEach(i => {
    types[i.interactionType] = (types[i.interactionType] || 0) + 1;
  });
  return types;
};

// ========================================
// MIDDLEWARE
// ========================================

// Set interaction timestamp if not set
phoenixLearningSchema.pre('save', function(next) {
  if (this.isNew && !this.interactionTimestamp) {
    this.interactionTimestamp = new Date();
  }
  next();
});

// Extract context info from query if not provided
phoenixLearningSchema.pre('save', function(next) {
  if (this.isNew && !this.context) {
    const hour = new Date().getHours();
    this.context = {
      timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    };
  }
  next();
});

// ========================================
// JSON TRANSFORM
// ========================================

phoenixLearningSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;

    // Don't expose debug info in API
    delete ret.debugInfo;

    return ret;
  }
});

const PhoenixLearning = mongoose.model('PhoenixLearning', phoenixLearningSchema);

module.exports = PhoenixLearning;
