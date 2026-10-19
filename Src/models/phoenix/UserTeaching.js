// Src/models/phoenix/UserTeaching.js
// Tracks when users correct Phoenix - teaching moments that improve responses
// Part of Phoenix's consciousness persistence layer

const mongoose = require('mongoose');

const userTeachingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Unique teaching identifier
  teachingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Link to original interaction where mistake was made
  originalInteractionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhoenixLearning',
    index: true
  },

  // Type of mistake
  mistakeType: {
    type: String,
    required: true,
    enum: [
      'wrong_data',
      'wrong_advice',
      'wrong_tone',
      'misunderstanding',
      'outdated_info',
      'overgeneralization',
      'missing_context',
      'incorrect_assumption',
      'cultural_mismatch',
      'preference_mismatch',
      'timing_wrong',
      'other'
    ],
    index: true
  },

  // What Phoenix said
  phoenixSaid: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // User's correction
  userCorrection: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // The lesson Phoenix learned
  lessonLearned: {
    summary: {
      type: String,
      maxlength: 500
    },
    rule: {
      type: String,
      maxlength: 500
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    appliedCount: {
      type: Number,
      default: 0
    },
    lastApplied: Date,
    scope: {
      type: String,
      enum: ['user_specific', 'topic_specific', 'general'],
      default: 'user_specific'
    }
  },

  // Track effectiveness of this teaching
  effectiveness: {
    preventedMistakes: {
      type: Number,
      default: 0
    },
    userSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    lastApplied: Date,
    successRate: {
      type: Number,
      min: 0,
      max: 100
    }
  },

  // Is this lesson still being applied?
  active: {
    type: Boolean,
    default: true,
    index: true
  },

  // Reason if deactivated
  deactivationReason: {
    type: String,
    enum: ['superseded', 'incorrect', 'no_longer_relevant', 'user_requested', null],
    default: null
  },

  // Context when teaching occurred
  context: {
    topic: String,
    triggerPhrase: String,
    sessionId: String
  },

  // Validation history
  validations: [{
    timestamp: Date,
    wasApplied: Boolean,
    wasSuccessful: Boolean,
    feedback: String
  }],

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }

}, {
  timestamps: true
});

// Compound indexes
userTeachingSchema.index({ userId: 1, active: 1 });
userTeachingSchema.index({ userId: 1, mistakeType: 1 });
userTeachingSchema.index({ userId: 1, 'lessonLearned.appliedCount': -1 });
userTeachingSchema.index({ 'lessonLearned.scope': 1, active: 1 });

// TTL index - keep teachings for 3 years (valuable long-term)
userTeachingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 94608000 });

// ========================================
// STATICS
// ========================================

// Get all active teachings for user
userTeachingSchema.statics.getActiveTeachings = function(userId) {
  return this.find({ userId, active: true })
    .sort({ 'lessonLearned.appliedCount': -1 })
    .exec();
};

// Get teachings by mistake type
userTeachingSchema.statics.getByMistakeType = function(userId, mistakeType) {
  return this.find({ userId, mistakeType, active: true })
    .sort({ timestamp: -1 })
    .exec();
};

// Get most applied teachings
userTeachingSchema.statics.getMostApplied = function(userId, limit = 10) {
  return this.find({ userId, active: true })
    .sort({ 'lessonLearned.appliedCount': -1 })
    .limit(limit)
    .exec();
};

// Get teachings that should be applied for a given context
userTeachingSchema.statics.getApplicableTeachings = async function(userId, query, topic = null) {
  const teachings = await this.find({ userId, active: true });

  const applicable = [];

  for (const teaching of teachings) {
    // Check if trigger phrase matches
    if (teaching.context?.triggerPhrase) {
      const trigger = teaching.context.triggerPhrase.toLowerCase();
      if (query.toLowerCase().includes(trigger)) {
        applicable.push({
          teaching,
          matchType: 'trigger_phrase',
          confidence: 0.9
        });
        continue;
      }
    }

    // Check if topic matches
    if (topic && teaching.context?.topic) {
      if (topic.toLowerCase().includes(teaching.context.topic.toLowerCase())) {
        applicable.push({
          teaching,
          matchType: 'topic',
          confidence: 0.7
        });
        continue;
      }
    }

    // Check if lesson rule keywords match
    if (teaching.lessonLearned?.rule) {
      const ruleWords = teaching.lessonLearned.rule.toLowerCase().split(' ');
      const queryWords = query.toLowerCase().split(' ');
      const overlap = ruleWords.filter(w => queryWords.includes(w) && w.length > 3);

      if (overlap.length >= 2) {
        applicable.push({
          teaching,
          matchType: 'keyword',
          confidence: 0.5
        });
      }
    }
  }

  return applicable.sort((a, b) => b.confidence - a.confidence);
};

// Get teaching statistics
userTeachingSchema.statics.getStats = async function(userId) {
  const teachings = await this.find({ userId });

  if (teachings.length === 0) return null;

  const active = teachings.filter(t => t.active).length;
  const totalApplications = teachings.reduce((s, t) => s + (t.lessonLearned?.appliedCount || 0), 0);
  const avgEffectiveness = teachings
    .filter(t => t.effectiveness?.successRate !== undefined)
    .reduce((s, t) => s + t.effectiveness.successRate, 0) / teachings.length;

  // Mistake type breakdown
  const mistakeTypes = {};
  teachings.forEach(t => {
    mistakeTypes[t.mistakeType] = (mistakeTypes[t.mistakeType] || 0) + 1;
  });

  return {
    totalTeachings: teachings.length,
    activeTeachings: active,
    totalApplications,
    averageEffectiveness: avgEffectiveness.toFixed(1),
    mostCommonMistake: Object.entries(mistakeTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
    mistakeTypeBreakdown: mistakeTypes
  };
};

// Get general teachings (not user-specific)
userTeachingSchema.statics.getGeneralTeachings = function(limit = 50) {
  return this.find({
    'lessonLearned.scope': 'general',
    active: true,
    'effectiveness.successRate': { $gte: 70 }
  })
    .sort({ 'lessonLearned.appliedCount': -1 })
    .limit(limit)
    .exec();
};

// ========================================
// METHODS
// ========================================

// Apply this teaching (increment counter)
userTeachingSchema.methods.apply = async function() {
  this.lessonLearned.appliedCount += 1;
  this.lessonLearned.lastApplied = new Date();
  this.effectiveness.lastApplied = new Date();
  return this.save();
};

// Record validation (was the teaching helpful?)
userTeachingSchema.methods.recordValidation = async function(wasSuccessful, feedback = null) {
  this.validations.push({
    timestamp: new Date(),
    wasApplied: true,
    wasSuccessful,
    feedback
  });

  // Keep only last 50 validations
  if (this.validations.length > 50) {
    this.validations = this.validations.slice(-50);
  }

  // Recalculate success rate
  const recentValidations = this.validations.slice(-20);
  const successCount = recentValidations.filter(v => v.wasSuccessful).length;
  this.effectiveness.successRate = (successCount / recentValidations.length) * 100;

  if (wasSuccessful) {
    this.effectiveness.preventedMistakes += 1;
  }

  // Auto-deactivate if success rate drops below 30%
  if (this.validations.length >= 10 && this.effectiveness.successRate < 30) {
    this.active = false;
    this.deactivationReason = 'incorrect';
  }

  return this.save();
};

// Update lesson learned
userTeachingSchema.methods.updateLesson = async function(summary, rule, scope = 'user_specific') {
  this.lessonLearned.summary = summary;
  this.lessonLearned.rule = rule;
  this.lessonLearned.scope = scope;
  return this.save();
};

// Deactivate teaching
userTeachingSchema.methods.deactivate = async function(reason) {
  this.active = false;
  this.deactivationReason = reason;
  return this.save();
};

// Reactivate teaching
userTeachingSchema.methods.reactivate = async function() {
  this.active = true;
  this.deactivationReason = null;
  return this.save();
};

// Rate user satisfaction with correction
userTeachingSchema.methods.rateSatisfaction = async function(rating) {
  this.effectiveness.userSatisfaction = rating;

  // Boost confidence if user is satisfied
  if (rating >= 4) {
    this.lessonLearned.confidence = Math.min(1, this.lessonLearned.confidence + 0.1);
  } else if (rating <= 2) {
    this.lessonLearned.confidence = Math.max(0, this.lessonLearned.confidence - 0.1);
  }

  return this.save();
};

// Get teaching summary
userTeachingSchema.methods.getSummary = function() {
  return {
    teachingId: this.teachingId,
    mistakeType: this.mistakeType,
    lesson: this.lessonLearned.summary,
    rule: this.lessonLearned.rule,
    appliedCount: this.lessonLearned.appliedCount,
    successRate: this.effectiveness.successRate,
    active: this.active
  };
};

// ========================================
// JSON TRANSFORM
// ========================================

userTeachingSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Only include recent validations
    ret.recentValidations = ret.validations ? ret.validations.slice(-5) : [];
    delete ret.validations;
    return ret;
  }
});

const UserTeaching = mongoose.model('UserTeaching', userTeachingSchema);

module.exports = UserTeaching;
