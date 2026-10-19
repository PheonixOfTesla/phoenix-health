// Src/models/phoenix/MetaReflection.js
// Persists WHY Phoenix made each response - the reasoning behind every decision
// Part of Phoenix's consciousness persistence layer

const mongoose = require('mongoose');

const metaReflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Link to the original interaction
  interactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhoenixLearning',
    index: true
  },

  // Unique reflection identifier
  reflectionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Type of response being reflected on
  responseType: {
    type: String,
    enum: [
      'recovery_check',
      'workout_suggestion',
      'sleep_analysis',
      'nutrition_advice',
      'goal_update',
      'intervention',
      'prediction',
      'pattern_insight',
      'general_response',
      'error_correction'
    ],
    default: 'general_response'
  },

  // The reasoning chain Phoenix used
  reasoning: {
    observation: {
      type: String,
      maxlength: 500
    },
    patternMatch: {
      type: String,
      maxlength: 500
    },
    baseline: {
      type: String,
      maxlength: 500
    },
    historyContext: {
      type: String,
      maxlength: 500
    },
    recommendation: {
      type: String,
      maxlength: 500
    }
  },

  // Alternative responses considered
  alternatives: [{
    option: {
      type: String,
      maxlength: 300
    },
    whyNotChosen: {
      type: String,
      maxlength: 300
    }
  }],

  // Confidence in this response (0-1)
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },

  // Biases detected in the reasoning
  biasesDetected: [{
    type: String,
    enum: [
      'recency_bias',
      'availability_bias',
      'confirmation_bias',
      'overconfidence_bias',
      'anchoring_bias',
      'none_detected'
    ]
  }],

  // Data sources used
  dataSources: [{
    source: String,
    weight: Number,
    confidence: Number
  }],

  // Was this reflection validated by outcome?
  validated: {
    type: Boolean,
    default: false
  },

  validationResult: {
    wasAccurate: Boolean,
    accuracyScore: Number,
    validatedAt: Date,
    feedback: String
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }

}, {
  timestamps: true
});

// Compound indexes for common queries
metaReflectionSchema.index({ userId: 1, timestamp: -1 });
metaReflectionSchema.index({ userId: 1, responseType: 1 });
metaReflectionSchema.index({ userId: 1, confidence: 1 });
metaReflectionSchema.index({ validated: 1, createdAt: 1 });

// TTL index - keep reflections for 1 year
metaReflectionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// ========================================
// STATICS
// ========================================

// Get reflections by type for user
metaReflectionSchema.statics.getByType = function(userId, responseType, limit = 50) {
  return this.find({ userId, responseType })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Get recent reflections for user
metaReflectionSchema.statics.getRecent = function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

// Get reflections with bias detected
metaReflectionSchema.statics.getWithBias = function(userId, biasType) {
  return this.find({
    userId,
    biasesDetected: biasType
  })
    .sort({ timestamp: -1 })
    .exec();
};

// Get low confidence reflections for review
metaReflectionSchema.statics.getLowConfidence = function(userId, threshold = 0.5, limit = 50) {
  return this.find({
    userId,
    confidence: { $lt: threshold }
  })
    .sort({ confidence: 1 })
    .limit(limit)
    .exec();
};

// Get unvalidated reflections
metaReflectionSchema.statics.getUnvalidated = function(limit = 100) {
  return this.find({ validated: false })
    .sort({ createdAt: 1 })
    .limit(limit)
    .exec();
};

// Calculate average confidence by response type
metaReflectionSchema.statics.getConfidenceByType = async function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$responseType',
        avgConfidence: { $avg: '$confidence' },
        count: { $sum: 1 }
      }
    },
    { $sort: { avgConfidence: -1 } }
  ]);
};

// ========================================
// METHODS
// ========================================

// Validate this reflection with outcome
metaReflectionSchema.methods.validateWithOutcome = async function(wasAccurate, accuracyScore, feedback = null) {
  this.validated = true;
  this.validationResult = {
    wasAccurate,
    accuracyScore,
    validatedAt: new Date(),
    feedback
  };
  return this.save();
};

// Add detected bias
metaReflectionSchema.methods.addBias = async function(biasType) {
  if (!this.biasesDetected.includes(biasType)) {
    this.biasesDetected.push(biasType);
    return this.save();
  }
  return this;
};

// ========================================
// JSON TRANSFORM
// ========================================

metaReflectionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const MetaReflection = mongoose.model('MetaReflection', metaReflectionSchema);

module.exports = MetaReflection;
