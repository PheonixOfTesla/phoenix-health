// Src/models/phoenix/InteractionChain.js
// Links multi-turn conversations across sessions
// Part of Phoenix's consciousness persistence layer

const mongoose = require('mongoose');

const interactionChainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Unique chain identifier
  chainId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Session that started this chain
  sessionId: {
    type: String,
    index: true
  },

  // Chain of interactions
  interactions: [{
    interactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhoenixLearning'
    },
    query: {
      type: String,
      maxlength: 500
    },
    responseSnippet: {
      type: String,
      maxlength: 200
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    causedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhoenixLearning'
    },
    intent: {
      type: String,
      enum: [
        'clarification',
        'follow_up',
        'correction',
        'new_question',
        'acknowledgment',
        'continuation',
        'topic_change'
      ],
      default: 'follow_up'
    }
  }],

  // Conversation context
  context: {
    topic: {
      type: String,
      maxlength: 100
    },
    goal: {
      type: String,
      maxlength: 300
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolutionTimestamp: Date,
    resolutionType: {
      type: String,
      enum: ['answered', 'action_taken', 'abandoned', 'deferred', 'ongoing'],
      default: 'ongoing'
    }
  },

  // Insights about this conversation chain
  insights: {
    turnCount: {
      type: Number,
      default: 0
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    patternDetected: String,
    userSentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'frustrated', 'satisfied', 'unknown'],
      default: 'unknown'
    },
    phoenixPerformance: {
      type: String,
      enum: ['excellent', 'good', 'adequate', 'poor', 'unknown'],
      default: 'unknown'
    }
  },

  // Related chains (for tracking recurring topics)
  relatedChains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InteractionChain'
  }],

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  }

}, {
  timestamps: true
});

// Compound indexes
interactionChainSchema.index({ userId: 1, lastActivity: -1 });
interactionChainSchema.index({ userId: 1, 'context.topic': 1 });
interactionChainSchema.index({ userId: 1, 'context.resolved': 1 });
interactionChainSchema.index({ sessionId: 1, createdAt: 1 });

// TTL index - keep chains for 6 months
interactionChainSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15768000 });

// ========================================
// STATICS
// ========================================

// Get or create chain for session
interactionChainSchema.statics.getOrCreateForSession = async function(userId, sessionId) {
  let chain = await this.findOne({
    userId,
    sessionId,
    'context.resolved': false
  }).sort({ lastActivity: -1 });

  if (!chain) {
    chain = new this({
      userId,
      sessionId,
      chainId: `chain_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    await chain.save();
  }

  return chain;
};

// Get recent active chains for user
interactionChainSchema.statics.getRecentActive = function(userId, limit = 10) {
  return this.find({
    userId,
    'context.resolved': false
  })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .exec();
};

// Get chains by topic
interactionChainSchema.statics.getByTopic = function(userId, topic, limit = 20) {
  return this.find({
    userId,
    'context.topic': { $regex: topic, $options: 'i' }
  })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .exec();
};

// Get unresolved chains
interactionChainSchema.statics.getUnresolved = function(userId, olderThanDays = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  return this.find({
    userId,
    'context.resolved': false,
    lastActivity: { $lt: cutoff }
  })
    .sort({ lastActivity: 1 })
    .exec();
};

// Get conversation statistics
interactionChainSchema.statics.getStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const chains = await this.find({
    userId,
    createdAt: { $gte: startDate }
  });

  if (chains.length === 0) return null;

  const resolved = chains.filter(c => c.context.resolved).length;
  const avgTurns = chains.reduce((s, c) => s + c.insights.turnCount, 0) / chains.length;
  const avgDuration = chains.reduce((s, c) => s + c.insights.totalDuration, 0) / chains.length;

  return {
    totalChains: chains.length,
    resolvedRate: (resolved / chains.length * 100).toFixed(1),
    averageTurns: avgTurns.toFixed(1),
    averageDuration: Math.round(avgDuration / 1000), // seconds
    topTopics: this._getTopTopics(chains)
  };
};

// Helper: Get top topics
interactionChainSchema.statics._getTopTopics = function(chains) {
  const topics = {};
  chains.forEach(c => {
    const topic = c.context?.topic || 'unknown';
    topics[topic] = (topics[topic] || 0) + 1;
  });

  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));
};

// ========================================
// METHODS
// ========================================

// Add interaction to chain
interactionChainSchema.methods.addInteraction = async function(interactionData) {
  const { interactionId, query, responseSnippet, causedBy, intent } = interactionData;

  this.interactions.push({
    interactionId,
    query: query?.substring(0, 500),
    responseSnippet: responseSnippet?.substring(0, 200),
    timestamp: new Date(),
    causedBy,
    intent: intent || 'follow_up'
  });

  // Update insights
  this.insights.turnCount = this.interactions.length;

  if (this.interactions.length >= 2) {
    const first = this.interactions[0].timestamp;
    const last = this.interactions[this.interactions.length - 1].timestamp;
    this.insights.totalDuration = last - first;
  }

  this.lastActivity = new Date();

  // Keep only last 50 interactions per chain
  if (this.interactions.length > 50) {
    this.interactions = this.interactions.slice(-50);
  }

  return this.save();
};

// Set conversation topic
interactionChainSchema.methods.setTopic = async function(topic) {
  this.context.topic = topic;
  return this.save();
};

// Set conversation goal
interactionChainSchema.methods.setGoal = async function(goal) {
  this.context.goal = goal;
  return this.save();
};

// Mark chain as resolved
interactionChainSchema.methods.resolve = async function(resolutionType = 'answered') {
  this.context.resolved = true;
  this.context.resolutionTimestamp = new Date();
  this.context.resolutionType = resolutionType;
  return this.save();
};

// Set user sentiment
interactionChainSchema.methods.setSentiment = async function(sentiment) {
  this.insights.userSentiment = sentiment;
  return this.save();
};

// Rate Phoenix performance
interactionChainSchema.methods.ratePerformance = async function(performance) {
  this.insights.phoenixPerformance = performance;
  return this.save();
};

// Link to related chain
interactionChainSchema.methods.linkToChain = async function(chainId) {
  if (!this.relatedChains.includes(chainId)) {
    this.relatedChains.push(chainId);
    return this.save();
  }
  return this;
};

// Get conversation summary
interactionChainSchema.methods.getSummary = function() {
  return {
    chainId: this.chainId,
    topic: this.context.topic,
    goal: this.context.goal,
    resolved: this.context.resolved,
    turns: this.insights.turnCount,
    duration: this.insights.totalDuration,
    sentiment: this.insights.userSentiment,
    lastActivity: this.lastActivity
  };
};

// ========================================
// JSON TRANSFORM
// ========================================

interactionChainSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Only include recent interactions in API
    ret.recentInteractions = ret.interactions ? ret.interactions.slice(-10) : [];
    delete ret.interactions;
    return ret;
  }
});

const InteractionChain = mongoose.model('InteractionChain', interactionChainSchema);

module.exports = InteractionChain;
