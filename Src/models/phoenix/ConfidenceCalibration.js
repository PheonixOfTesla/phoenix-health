// Src/models/phoenix/ConfidenceCalibration.js
// Tracks confidence adjustments over time per topic per user
// Part of Phoenix's consciousness persistence layer

const mongoose = require('mongoose');

const confidenceCalibrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Topic area for calibration
  topic: {
    type: String,
    required: true,
    enum: [
      'health',
      'productivity',
      'recovery',
      'mental_health',
      'sleep',
      'nutrition',
      'fitness',
      'general'
    ],
    index: true
  },

  // History of calibration events
  calibrationHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    predictedConfidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    actualOutcome: {
      type: Number,
      min: 0,
      max: 1
    },
    errorDirection: {
      type: String,
      enum: ['over', 'under', 'accurate'],
      default: 'accurate'
    },
    adjustmentMade: {
      type: Number,
      default: 0
    }
  }],

  // Current calibration state
  currentCalibration: {
    factor: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 1.5
    },
    direction: {
      type: String,
      enum: ['reduce', 'increase', 'maintain'],
      default: 'maintain'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    lastAdjusted: {
      type: Date,
      default: Date.now
    }
  },

  // Aggregate statistics
  stats: {
    totalCalibrations: {
      type: Number,
      default: 0
    },
    averageBias: {
      type: Number,
      default: 0
    },
    stabilityScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    }
  },

  // Recommendations for this topic
  recommendation: {
    type: String,
    enum: [
      'REDUCE_CONFIDENCE',
      'INCREASE_CONFIDENCE',
      'WELL_CALIBRATED',
      'INSUFFICIENT_DATA',
      'VOLATILE_NEEDS_MORE_DATA'
    ],
    default: 'INSUFFICIENT_DATA'
  }

}, {
  timestamps: true
});

// Compound unique index
confidenceCalibrationSchema.index({ userId: 1, topic: 1 }, { unique: true });

// ========================================
// STATICS
// ========================================

// Get or create calibration record for user/topic
confidenceCalibrationSchema.statics.getOrCreate = async function(userId, topic) {
  let record = await this.findOne({ userId, topic });
  if (!record) {
    record = new this({ userId, topic });
    await record.save();
  }
  return record;
};

// Get all calibrations for user
confidenceCalibrationSchema.statics.getAllForUser = function(userId) {
  return this.find({ userId })
    .sort({ 'currentCalibration.factor': 1 })
    .exec();
};

// Get topics needing adjustment
confidenceCalibrationSchema.statics.getTopicsNeedingAdjustment = function(userId) {
  return this.find({
    userId,
    recommendation: { $in: ['REDUCE_CONFIDENCE', 'INCREASE_CONFIDENCE'] }
  }).exec();
};

// Get calibration factor for topic (for use in responses)
confidenceCalibrationSchema.statics.getCalibrationFactor = async function(userId, topic) {
  const record = await this.findOne({ userId, topic });
  return record ? record.currentCalibration.factor : 1.0;
};

// ========================================
// METHODS
// ========================================

// Record a calibration event
confidenceCalibrationSchema.methods.recordCalibration = async function(predictedConfidence, actualOutcome) {
  const error = predictedConfidence - actualOutcome;
  let errorDirection = 'accurate';
  let adjustmentMade = 0;

  if (error > 0.15) {
    errorDirection = 'over';
    adjustmentMade = -0.05;
  } else if (error < -0.15) {
    errorDirection = 'under';
    adjustmentMade = 0.05;
  }

  this.calibrationHistory.push({
    timestamp: new Date(),
    predictedConfidence,
    actualOutcome,
    errorDirection,
    adjustmentMade
  });

  // Keep only last 200 calibrations
  if (this.calibrationHistory.length > 200) {
    this.calibrationHistory = this.calibrationHistory.slice(-200);
  }

  // Update current calibration
  this.currentCalibration.factor = Math.max(0.5, Math.min(1.5,
    this.currentCalibration.factor + adjustmentMade
  ));
  this.currentCalibration.lastAdjusted = new Date();

  if (adjustmentMade < 0) {
    this.currentCalibration.direction = 'reduce';
  } else if (adjustmentMade > 0) {
    this.currentCalibration.direction = 'increase';
  } else {
    this.currentCalibration.direction = 'maintain';
  }

  // Recalculate stats
  this._recalculateStats();

  return this.save();
};

// Recalculate statistics
confidenceCalibrationSchema.methods._recalculateStats = function() {
  const history = this.calibrationHistory;

  if (history.length < 5) {
    this.recommendation = 'INSUFFICIENT_DATA';
    return;
  }

  this.stats.totalCalibrations = history.length;

  // Calculate average bias (positive = overconfident)
  const totalBias = history.reduce((sum, h) => {
    if (h.actualOutcome !== undefined) {
      return sum + (h.predictedConfidence - h.actualOutcome);
    }
    return sum;
  }, 0);

  const withOutcome = history.filter(h => h.actualOutcome !== undefined);
  this.stats.averageBias = withOutcome.length > 0 ? totalBias / withOutcome.length : 0;

  // Calculate stability (how consistent is the calibration)
  const recent = history.slice(-20);
  const directions = recent.map(h => h.errorDirection);
  const overCount = directions.filter(d => d === 'over').length;
  const underCount = directions.filter(d => d === 'under').length;
  const accurateCount = directions.filter(d => d === 'accurate').length;

  // Stability is higher when more predictions are accurate
  this.stats.stabilityScore = accurateCount / recent.length;

  // Determine recommendation
  if (this.stats.stabilityScore < 0.3) {
    this.recommendation = 'VOLATILE_NEEDS_MORE_DATA';
  } else if (this.stats.averageBias > 0.1) {
    this.recommendation = 'REDUCE_CONFIDENCE';
  } else if (this.stats.averageBias < -0.1) {
    this.recommendation = 'INCREASE_CONFIDENCE';
  } else {
    this.recommendation = 'WELL_CALIBRATED';
  }

  // Update current calibration confidence based on stability
  this.currentCalibration.confidence = this.stats.stabilityScore;

  this.stats.lastCalculated = new Date();
};

// Apply calibration to a raw confidence value
confidenceCalibrationSchema.methods.applyCalibration = function(rawConfidence) {
  return Math.max(0, Math.min(1, rawConfidence * this.currentCalibration.factor));
};

// Get calibration summary
confidenceCalibrationSchema.methods.getSummary = function() {
  return {
    topic: this.topic,
    factor: this.currentCalibration.factor,
    direction: this.currentCalibration.direction,
    recommendation: this.recommendation,
    stabilityScore: this.stats.stabilityScore,
    averageBias: this.stats.averageBias,
    totalCalibrations: this.stats.totalCalibrations
  };
};

// ========================================
// JSON TRANSFORM
// ========================================

confidenceCalibrationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Only include recent calibration history
    ret.recentHistory = ret.calibrationHistory ? ret.calibrationHistory.slice(-20) : [];
    delete ret.calibrationHistory;
    return ret;
  }
});

const ConfidenceCalibration = mongoose.model('ConfidenceCalibration', confidenceCalibrationSchema);

module.exports = ConfidenceCalibration;
