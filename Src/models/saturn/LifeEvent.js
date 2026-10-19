const mongoose = require('mongoose');

/**
 * LIFE EVENT MODEL
 * Tracks major life events across all 7 planets that affect user metrics
 * This creates the causal relationships for Phoenix AI training
 */

const lifeEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // When the event occurred
  date: {
    type: Date,
    required: true,
    index: true
  },

  // What planet/domain this affects
  planet: {
    type: String,
    enum: ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Earth', 'Uranus'],
    required: true
  },

  // Type of event
  type: {
    type: String,
    required: true,
    enum: [
      // Saturn (Life)
      'breakup', 'new_relationship', 'move',
      // Jupiter (Finance)
      'financial_stress', 'big_purchase', 'spending_spree',
      // Venus (Fitness)
      'injury', 'pr_achievement',
      // Earth (Work)
      'promotion', 'job_stress', 'deadline_crunch',
      // Mercury (Health)
      'illness', 'burnout',
      // Mars (Goals)
      'goal_achieved', 'goal_failed'
    ]
  },

  // Human-readable description
  description: {
    type: String,
    required: true
  },

  // Impact level
  impact: {
    type: String,
    enum: ['low', 'medium', 'high', 'positive', 'negative'],
    required: true
  },

  // Expected effects on metrics (this is the KEY for training)
  effects: {
    // Health impacts (Mercury)
    hrv: Number,              // e.g., -20 means HRV drops 20%
    sleep: Number,            // e.g., -15 means sleep quality drops 15%
    stress: Number,           // e.g., +40 means stress increases 40%
    rest: Number,

    // Fitness impacts (Venus)
    workouts: Number,         // e.g., -100 means workouts drop to zero
    motivation: Number,
    confidence: Number,
    frustration: Number,

    // Financial impacts (Jupiter)
    spending: Number,         // e.g., +200 means spending doubles
    income: Number,
    satisfaction: Number,

    // Work impacts (Earth)
    work_hours: Number,
    productivity: Number,

    // Goal impacts (Mars)
    goal_focus: Number,

    // Social impacts (Uranus)
    social_activity: Number,

    // Life impacts (Saturn)
    routine_disruption: Number
  },

  // Metadata
  source: {
    type: String,
    default: 'simulation',
    enum: ['simulation', 'user_reported', 'inferred']
  }

}, {
  timestamps: true
});

// Indexes for fast querying
lifeEventSchema.index({ userId: 1, date: -1 });
lifeEventSchema.index({ planet: 1 });
lifeEventSchema.index({ type: 1 });

module.exports = mongoose.model('LifeEvent', lifeEventSchema);
