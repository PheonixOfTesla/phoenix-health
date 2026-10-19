// Src/models/phoenix/AccuracyMetrics.js
// Tracks Phoenix's prediction accuracy by topic over time
// Part of Phoenix's consciousness persistence layer

const mongoose = require('mongoose');

const accuracyMetricsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Topic area for this accuracy tracking
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

  // Individual predictions tracked
  predictions: [{
    predictionId: {
      type: String,
      required: true
    },
    predicted: {
      type: Number,
      required: true
    },
    actual: {
      type: Number,
      default: null
    },
    error: {
      type: Number,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    validated: {
      type: Boolean,
      default: false
    }
  }],

  // Aggregated metrics
  aggregates: {
    totalPredictions: {
      type: Number,
      default: 0
    },
    validatedPredictions: {
      type: Number,
      default: 0
    },
    averageError: {
      type: Number,
      default: null
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining', 'insufficient_data'],
      default: 'insufficient_data'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Calibration adjustment factor
  calibrationFactor: {
    type: Number,
    default: 1.0,
    min: 0.5,
    max: 1.5
  },

  // Confidence indicators
  isOverconfident: {
    type: Boolean,
    default: false
  },

  isUnderconfident: {
    type: Boolean,
    default: false
  },

  // Historical accuracy snapshots (weekly)
  history: [{
    week: Date,
    accuracy: Number,
    sampleSize: Number,
    averageError: Number
  }]

}, {
  timestamps: true
});

// Compound unique index - one record per user per topic
accuracyMetricsSchema.index({ userId: 1, topic: 1 }, { unique: true });
accuracyMetricsSchema.index({ userId: 1, 'aggregates.accuracy': -1 });

// ========================================
// STATICS
// ========================================

// Get or create accuracy record for user/topic
accuracyMetricsSchema.statics.getOrCreate = async function(userId, topic) {
  let record = await this.findOne({ userId, topic });
  if (!record) {
    record = new this({ userId, topic });
    await record.save();
  }
  return record;
};

// Get all topics for user sorted by accuracy
accuracyMetricsSchema.statics.getAllTopics = function(userId) {
  return this.find({ userId })
    .sort({ 'aggregates.accuracy': -1 })
    .exec();
};

// Get best performing topic
accuracyMetricsSchema.statics.getBestTopic = function(userId) {
  return this.findOne({
    userId,
    'aggregates.validatedPredictions': { $gte: 5 }
  })
    .sort({ 'aggregates.accuracy': -1 })
    .exec();
};

// Get worst performing topic
accuracyMetricsSchema.statics.getWorstTopic = function(userId) {
  return this.findOne({
    userId,
    'aggregates.validatedPredictions': { $gte: 5 }
  })
    .sort({ 'aggregates.accuracy': 1 })
    .exec();
};

// Get overconfident topics
accuracyMetricsSchema.statics.getOverconfidentTopics = function(userId) {
  return this.find({ userId, isOverconfident: true }).exec();
};

// ========================================
// METHODS
// ========================================

// Add a new prediction
accuracyMetricsSchema.methods.addPrediction = async function(predictionId, predicted) {
  this.predictions.push({
    predictionId,
    predicted,
    timestamp: new Date()
  });

  this.aggregates.totalPredictions = this.predictions.length;
  this.aggregates.lastUpdated = new Date();

  // Keep only last 500 predictions to prevent unbounded growth
  if (this.predictions.length > 500) {
    this.predictions = this.predictions.slice(-500);
  }

  return this.save();
};

// Validate a prediction with actual outcome
accuracyMetricsSchema.methods.validatePrediction = async function(predictionId, actual) {
  const prediction = this.predictions.find(p => p.predictionId === predictionId);

  if (!prediction) {
    return { error: 'Prediction not found' };
  }

  prediction.actual = actual;
  prediction.error = Math.abs(prediction.predicted - actual);
  prediction.validated = true;

  // Recalculate aggregates
  this._recalculateAggregates();

  return this.save();
};

// Recalculate aggregate metrics
accuracyMetricsSchema.methods._recalculateAggregates = function() {
  const validated = this.predictions.filter(p => p.validated && p.error !== null);

  if (validated.length === 0) {
    this.aggregates.trend = 'insufficient_data';
    return;
  }

  this.aggregates.validatedPredictions = validated.length;

  // Calculate average error
  const totalError = validated.reduce((sum, p) => sum + p.error, 0);
  this.aggregates.averageError = totalError / validated.length;

  // Calculate accuracy (inverse of error, scaled to 0-100)
  // Assuming error is on 0-1 scale, accuracy = (1 - avgError) * 100
  this.aggregates.accuracy = Math.max(0, Math.min(100, (1 - this.aggregates.averageError) * 100));

  // Calculate trend (compare last 10 vs previous 10)
  if (validated.length >= 20) {
    const recent = validated.slice(-10);
    const previous = validated.slice(-20, -10);

    const recentAvgError = recent.reduce((s, p) => s + p.error, 0) / 10;
    const previousAvgError = previous.reduce((s, p) => s + p.error, 0) / 10;

    const improvement = previousAvgError - recentAvgError;

    if (improvement > 0.05) {
      this.aggregates.trend = 'improving';
    } else if (improvement < -0.05) {
      this.aggregates.trend = 'declining';
    } else {
      this.aggregates.trend = 'stable';
    }
  } else {
    this.aggregates.trend = 'insufficient_data';
  }

  // Determine over/under confidence
  // If predictions consistently higher than actuals = overconfident
  const biasSum = validated.reduce((sum, p) => sum + (p.predicted - p.actual), 0);
  const avgBias = biasSum / validated.length;

  this.isOverconfident = avgBias > 0.1;
  this.isUnderconfident = avgBias < -0.1;

  // Adjust calibration factor
  if (this.isOverconfident) {
    this.calibrationFactor = Math.max(0.5, this.calibrationFactor - 0.05);
  } else if (this.isUnderconfident) {
    this.calibrationFactor = Math.min(1.5, this.calibrationFactor + 0.05);
  }

  this.aggregates.lastUpdated = new Date();
};

// Snapshot current accuracy for history
accuracyMetricsSchema.methods.snapshotWeekly = async function() {
  const validated = this.predictions.filter(p => p.validated);

  if (validated.length < 5) return this;

  this.history.push({
    week: new Date(),
    accuracy: this.aggregates.accuracy,
    sampleSize: this.aggregates.validatedPredictions,
    averageError: this.aggregates.averageError
  });

  // Keep only last 52 weeks
  if (this.history.length > 52) {
    this.history = this.history.slice(-52);
  }

  return this.save();
};

// ========================================
// JSON TRANSFORM
// ========================================

accuracyMetricsSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Don't expose all predictions in API
    ret.recentPredictions = ret.predictions ? ret.predictions.slice(-10) : [];
    delete ret.predictions;
    return ret;
  }
});

const AccuracyMetrics = mongoose.model('AccuracyMetrics', accuracyMetricsSchema);

module.exports = AccuracyMetrics;
