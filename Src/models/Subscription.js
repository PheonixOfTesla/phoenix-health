// Src/models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  plan: { 
    type: String, 
    enum: ['free', 'pro', 'elite'], 
    default: 'free' 
  },
  status: { 
    type: String, 
    enum: ['active', 'trialing', 'canceled', 'past_due'], 
    default: 'active' 
  },
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { 
    type: Boolean, 
    default: false 
  },
  canceledAt: Date,
  trialEndsAt: Date,
  paymentHistory: [{
    amount: Number,
    date: Date,
    status: String
  }],

  // Cross-device sync quota
  syncEnabled: {
    type: Boolean,
    default: false
  },
  syncQuota: {
    type: Number,
    default: 1073741824 // 1GB in bytes
  },
  syncUsed: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound indexes for common queries
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);