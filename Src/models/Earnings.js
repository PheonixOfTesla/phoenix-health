/**
 * EARNINGS MODEL - PATF Referral Income System
 * Tracks affiliate/coach/influencer earnings from referrals
 */

const mongoose = require('mongoose');

const earningsSchema = new mongoose.Schema({
  // The user who earns
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Type of earner
  earnerType: {
    type: String,
    enum: ['coach', 'influencer', 'affiliate'],
    required: true
  },

  // Referral code for tracking
  referralCode: {
    type: String,
    unique: true,
    required: true
  },

  // Current balance (available for payout)
  balance: {
    type: Number,
    default: 0,
    min: 0
  },

  // Lifetime totals
  lifetime: {
    total: { type: Number, default: 0 },
    fromReferrals: { type: Number, default: 0 },
    fromCoaching: { type: Number, default: 0 },
    withdrawn: { type: Number, default: 0 }
  },

  // Referral stats
  referralStats: {
    totalReferrals: { type: Number, default: 0 },
    activeReferrals: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  // Transaction history
  transactions: [{
    type: {
      type: String,
      enum: ['referral_commission', 'coaching_income', 'withdrawal', 'bonus', 'adjustment'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: String,
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    subscriptionTier: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Payout info
  payoutMethod: {
    type: String,
    enum: ['paypal', 'stripe', 'bank_transfer', 'none'],
    default: 'none'
  },
  payoutDetails: {
    type: Object,
    default: {}
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
earningsSchema.index({ earnerType: 1 });
earningsSchema.index({ 'lifetime.total': -1 });
earningsSchema.index({ balance: -1 });

// Generate unique referral code
earningsSchema.statics.generateReferralCode = async function(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId).select('name');

  // Create base from name (first 4 chars) + random
  const nameBase = user?.name?.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase() || 'USER';
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${nameBase}${random}`;
};

// Add transaction and update balances
earningsSchema.methods.addTransaction = function(type, amount, description, metadata = {}) {
  this.transactions.push({
    type,
    amount,
    description,
    ...metadata
  });

  // Update balance based on transaction type
  if (type === 'withdrawal') {
    this.balance -= Math.abs(amount);
    this.lifetime.withdrawn += Math.abs(amount);
  } else {
    this.balance += amount;
    this.lifetime.total += amount;

    if (type === 'referral_commission') {
      this.lifetime.fromReferrals += amount;
    } else if (type === 'coaching_income') {
      this.lifetime.fromCoaching += amount;
    }
  }

  return this;
};

module.exports = mongoose.model('Earnings', earningsSchema);
