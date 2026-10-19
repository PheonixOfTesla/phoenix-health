/**
 * PHOENIX CACHE MODEL
 *
 * Stores pre-computed insights from Claude's unconscious analysis.
 * Gemini reads from this cache for instant (<500ms) responses.
 *
 * Cache Structure:
 * - instant: Quick answers (recovery, workout, sleep, energy)
 * - patterns: Correlations & trends
 * - predictions: Future forecasts
 * - meta: Data quality & analysis info
 */

const mongoose = require('mongoose');

const phoenixCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },

  // INSTANT RETRIEVAL (most common queries)
  instant: {
    // Recovery Score
    recovery_score: {
      score: { type: Number, min: 0, max: 100 },
      trend: { type: String, enum: ['up', 'down', 'stable'] },
      reasoning: { type: String },
      recommendation: { type: String },
      confidence: { type: Number, min: 0, max: 100 },
      timestamp: { type: Date, default: Date.now }
    },

    // Workout Recommendation
    workout_recommendation: {
      intensity: { type: String, enum: ['rest', 'light', 'moderate', 'intense'] },
      types: [{ type: String }],
      avoid: [{ type: String }],
      reasoning: { type: String },
      confidence: { type: Number, min: 0, max: 100 },
      timestamp: { type: Date, default: Date.now }
    },

    // Sleep Quality
    sleep_quality: {
      duration: { type: String },
      quality_score: { type: Number, min: 0, max: 100 },
      rem_percentage: { type: Number },
      rem_vs_baseline: { type: Number },
      issues: [{ type: String }],
      recommendations: [{ type: String }],
      confidence: { type: Number, min: 0, max: 100 },
      timestamp: { type: Date, default: Date.now }
    },

    // Energy Forecast
    energy_forecast: {
      current: { type: Number, min: 0, max: 100 },
      morning: { type: Number, min: 0, max: 100 },
      afternoon: { type: Number, min: 0, max: 100 },
      evening: { type: Number, min: 0, max: 100 },
      peak_window: { type: String },
      reasoning: { type: String },
      confidence: { type: Number, min: 0, max: 100 },
      timestamp: { type: Date, default: Date.now }
    }
  },

  // PATTERNS & CORRELATIONS
  patterns: {
    correlations: [{
      finding: { type: String },
      correlation: { type: Number, min: -1, max: 1 },
      evidence: { type: String },
      insight: { type: String },
      confidence: { type: Number, min: 0, max: 100 },
      timestamp: { type: Date, default: Date.now }
    }],

    weekly_trends: [{
      metric: { type: String },
      trend: { type: String, enum: ['improving', 'declining', 'stable'] },
      change_percentage: { type: Number },
      reasoning: { type: String }
    }],

    anomalies: [{
      metric: { type: String },
      value: { type: Number },
      baseline: { type: Number },
      deviation: { type: String },
      urgency: { type: String, enum: ['low', 'medium', 'high'] },
      action: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],

    // DETECTED LIFE PATTERNS (Silent Knowledge)
    detected_patterns: [{
      patternId: { type: String },
      patternName: { type: String },
      planet: { type: String },
      category: { type: String },
      confidence: { type: Number, min: 0, max: 100 },
      evidence: [{ type: String }],
      detectedAt: { type: Date, default: Date.now },
      conditionsMet: { type: Number },
      conditionsTotal: { type: Number },
      urgency: { type: String, enum: ['low', 'normal', 'medium', 'high', 'critical'], default: 'normal' },
      predictions: { type: mongoose.Schema.Types.Mixed },
      recommendations: [{ type: String }],
      silentGuidance: { type: mongoose.Schema.Types.Mixed },
      surfaced: { type: Boolean, default: false },
      surfaced_at: { type: Date },
      user_acknowledged: { type: Boolean, default: false },
      acknowledged_at: { type: Date },
      stored_at: { type: Date, default: Date.now },
      updated_at: { type: Date }
    }]
  },

  // PREDICTIONS
  predictions: {
    tomorrow_recovery: {
      if_rest_today: { type: Number, min: 0, max: 100 },
      if_light_workout: { type: Number, min: 0, max: 100 },
      if_intense_workout: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 100 }
    },

    weekly_energy: {
      monday: { type: Number, min: 0, max: 100 },
      tuesday: { type: Number, min: 0, max: 100 },
      wednesday: { type: Number, min: 0, max: 100 },
      thursday: { type: Number, min: 0, max: 100 },
      friday: { type: Number, min: 0, max: 100 },
      saturday: { type: Number, min: 0, max: 100 },
      sunday: { type: Number, min: 0, max: 100 },
      confidence: { type: Number, min: 0, max: 100 }
    }
  },

  // TOP ACTIONABLE RECOMMENDATIONS
  top_actions: [{
    action: { type: String },
    rationale: { type: String },
    impact: { type: String },
    priority: { type: Number, min: 1, max: 3 }
  }],

  // METADATA
  meta: {
    data_completeness: { type: Number, min: 0, max: 100, default: 0 },
    last_sync: {
      wearable: { type: Date },
      workout: { type: Date },
      nutrition: { type: Date },
      calendar: { type: Date }
    },
    analysis_version: { type: String, default: 'v1.0' },
    claude_model: { type: String, default: 'claude-sonnet-4-20250514' },
    tokens_used: { type: Number, default: 0 }
  }

}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'phoenix_cache'
});

// INDEXES for fast queries
phoenixCacheSchema.index({ userId: 1, lastUpdated: -1 });
phoenixCacheSchema.index({ 'meta.data_completeness': -1 });

// TTL INDEX: Auto-delete cache older than 7 days if not updated
phoenixCacheSchema.index({ lastUpdated: 1 }, { expireAfterSeconds: 604800 }); // 7 days

module.exports = mongoose.model('PhoenixCache', phoenixCacheSchema);
