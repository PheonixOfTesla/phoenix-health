// Src/models/phoenix/SelfCorrectionLog.js
// Tracks every self-correction Phoenix makes for permanent learning
// Part of Phoenix's consciousness persistence layer

const mongoose = require('mongoose');

const selfCorrectionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Unique correction identifier
  correctionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Original response that had error
  originalResponse: {
    type: String,
    required: true,
    maxlength: 5000
  },

  // Corrected response (if generated)
  correctedResponse: {
    type: String,
    maxlength: 5000
  },

  // Type of error detected
  errorType: {
    type: String,
    required: true,
    enum: [
      'stale_cache',
      'percentage_overflow',
      'metric_contradiction',
      'temporal_error',
      'missing_conditional',
      'confidence_mismatch',
      'baseline_error',
      'aggregation_error',
      'data_inconsistency',
      'outdated_info',
      'calculation_error',
      'context_missing',
      'tone_inappropriate',
      'factual_error',
      'other'
    ],
    index: true
  },

  // Detailed error information
  errorDetails: {
    detected: {
      type: String,
      maxlength: 500
    },
    rootCause: {
      type: String,
      maxlength: 500
    },
    codeReference: {
      type: String,
      maxlength: 200
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    affectedData: [{
      field: String,
      incorrectValue: mongoose.Schema.Types.Mixed,
      correctValue: mongoose.Schema.Types.Mixed
    }]
  },

  // Fix information
  fix: {
    applied: {
      type: Boolean,
      default: false
    },
    fixType: {
      type: String,
      enum: [
        'response_regeneration',
        'value_correction',
        'cache_refresh',
        'data_recalculation',
        'context_addition',
        'tone_adjustment',
        'manual_override',
        'none'
      ],
      default: 'none'
    },
    fixDescription: {
      type: String,
      maxlength: 500
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },

  // Prevention rule generated from this correction
  preventionRule: {
    pattern: {
      type: String,
      maxlength: 500
    },
    action: {
      type: String,
      maxlength: 500
    },
    enabled: {
      type: Boolean,
      default: true
    },
    timesApplied: {
      type: Number,
      default: 0
    },
    lastApplied: Date
  },

  // Context when error occurred
  context: {
    query: String,
    sessionId: String,
    timeOfDay: String,
    dataAge: Number,  // How old was the data in seconds
    cacheHit: Boolean
  },

  // Outcome tracking
  outcome: {
    userNotified: {
      type: Boolean,
      default: false
    },
    userSatisfied: {
      type: Boolean,
      default: null
    },
    preventedFuturErrors: {
      type: Number,
      default: 0
    }
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }

}, {
  timestamps: true
});

// Compound indexes
selfCorrectionLogSchema.index({ userId: 1, timestamp: -1 });
selfCorrectionLogSchema.index({ userId: 1, errorType: 1 });
selfCorrectionLogSchema.index({ 'errorDetails.severity': 1 });
selfCorrectionLogSchema.index({ 'preventionRule.enabled': 1 });

// TTL index - keep corrections for 2 years (longer than other data for learning)
selfCorrectionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

// ========================================
// STATICS
// ========================================

// Get corrections by error type
selfCorrectionLogSchema.statics.getByErrorType = function(userId, errorType, limit = 50) {
  return this.find({ userId, errorType })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Get all active prevention rules for user
selfCorrectionLogSchema.statics.getActivePreventionRules = function(userId) {
  return this.find({
    userId,
    'preventionRule.enabled': true,
    'preventionRule.pattern': { $exists: true, $ne: '' }
  })
    .select('preventionRule errorType')
    .exec();
};

// Get critical corrections (for immediate review)
selfCorrectionLogSchema.statics.getCritical = function(userId, limit = 20) {
  return this.find({
    userId,
    'errorDetails.severity': { $in: ['high', 'critical'] }
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Get error statistics
selfCorrectionLogSchema.statics.getErrorStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$errorType',
        count: { $sum: 1 },
        avgSeverity: {
          $avg: {
            $switch: {
              branches: [
                { case: { $eq: ['$errorDetails.severity', 'low'] }, then: 1 },
                { case: { $eq: ['$errorDetails.severity', 'medium'] }, then: 2 },
                { case: { $eq: ['$errorDetails.severity', 'high'] }, then: 3 },
                { case: { $eq: ['$errorDetails.severity', 'critical'] }, then: 4 }
              ],
              default: 2
            }
          }
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Get most effective prevention rules
selfCorrectionLogSchema.statics.getMostEffectiveRules = function(userId, limit = 10) {
  return this.find({
    userId,
    'preventionRule.enabled': true,
    'preventionRule.timesApplied': { $gte: 1 }
  })
    .sort({ 'preventionRule.timesApplied': -1 })
    .limit(limit)
    .exec();
};

// Check if pattern matches any prevention rule
selfCorrectionLogSchema.statics.checkPreventionRules = async function(userId, responseText) {
  const rules = await this.getActivePreventionRules(userId);
  const matchedRules = [];

  for (const rule of rules) {
    try {
      const pattern = new RegExp(rule.preventionRule.pattern, 'i');
      if (pattern.test(responseText)) {
        matchedRules.push({
          errorType: rule.errorType,
          action: rule.preventionRule.action,
          ruleId: rule._id
        });
      }
    } catch (e) {
      // Invalid regex, skip
    }
  }

  return matchedRules;
};

// ========================================
// METHODS
// ========================================

// Mark fix as applied
selfCorrectionLogSchema.methods.markFixApplied = async function(fixType, description, confidence) {
  this.fix.applied = true;
  this.fix.fixType = fixType;
  this.fix.fixDescription = description;
  this.fix.confidence = confidence;
  return this.save();
};

// Add prevention rule
selfCorrectionLogSchema.methods.addPreventionRule = async function(pattern, action) {
  this.preventionRule = {
    pattern,
    action,
    enabled: true,
    timesApplied: 0
  };
  return this.save();
};

// Increment prevention rule usage
selfCorrectionLogSchema.methods.incrementRuleUsage = async function() {
  this.preventionRule.timesApplied += 1;
  this.preventionRule.lastApplied = new Date();
  return this.save();
};

// Record user satisfaction with correction
selfCorrectionLogSchema.methods.recordSatisfaction = async function(satisfied) {
  this.outcome.userSatisfied = satisfied;
  return this.save();
};

// ========================================
// JSON TRANSFORM
// ========================================

selfCorrectionLogSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const SelfCorrectionLog = mongoose.model('SelfCorrectionLog', selfCorrectionLogSchema);

module.exports = SelfCorrectionLog;
