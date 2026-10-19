const mongoose = require('mongoose');

const InterfaceInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  sessionId: {
    type: String,
    required: true,
    index: true
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Interaction details
  widgetId: {
    type: String,
    required: true,
    index: true
  },

  action: {
    type: String,
    enum: ['viewed', 'interacted', 'dismissed', 'ignored', 'expanded', 'collapsed'],
    required: true
  },

  // Context at time of interaction
  context: {
    time: Date,
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    },
    location: {
      type: String,
      enum: ['gym', 'home', 'work', 'travel', 'unknown']
    },
    userState: {
      type: String,
      enum: ['working', 'exercising', 'resting', 'commuting', 'unknown']
    },
    displayedWidgets: [String],
    layoutType: {
      type: String,
      enum: ['compact', 'expanded', 'minimal']
    }
  },

  // Engagement metrics
  dwellTime: {
    type: Number, // milliseconds
    default: 0
  },

  interactionDepth: {
    type: Number, // number of clicks/taps within widget
    default: 0
  },

  outcome: {
    type: String,
    enum: ['helpful', 'neutral', 'dismissed', 'ignored'],
    default: 'neutral'
  },

  // Learning data
  wasRelevant: {
    type: Boolean,
    default: null // null = not yet determined
  },

  userFeedback: {
    type: String,
    default: ''
  },

  // Widget data at time of interaction (for ML)
  widgetData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // User biometrics at time of interaction
  biometrics: {
    hrv: Number,
    heartRate: Number,
    recoveryScore: Number,
    stressLevel: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
InterfaceInteractionSchema.index({ userId: 1, timestamp: -1 });
InterfaceInteractionSchema.index({ userId: 1, widgetId: 1, timestamp: -1 });
InterfaceInteractionSchema.index({ sessionId: 1, timestamp: -1 });

// Static method to log interaction
InterfaceInteractionSchema.statics.logInteraction = async function(data) {
  return await this.create({
    userId: data.userId,
    sessionId: data.sessionId,
    widgetId: data.widgetId,
    action: data.action,
    context: data.context || {},
    dwellTime: data.dwellTime || 0,
    interactionDepth: data.interactionDepth || 0,
    outcome: data.outcome || 'neutral',
    widgetData: data.widgetData || {},
    biometrics: data.biometrics || {}
  });
};

// Static method to get widget engagement stats
InterfaceInteractionSchema.statics.getWidgetEngagement = async function(userId, widgetId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const interactions = await this.find({
    userId,
    widgetId,
    timestamp: { $gte: startDate }
  });

  const totalViews = interactions.filter(i => i.action === 'viewed').length;
  const totalInteractions = interactions.filter(i => i.action === 'interacted').length;
  const totalDismissals = interactions.filter(i => i.action === 'dismissed').length;
  const avgDwellTime = interactions.reduce((sum, i) => sum + i.dwellTime, 0) / interactions.length || 0;

  return {
    widgetId,
    totalViews,
    totalInteractions,
    totalDismissals,
    avgDwellTime,
    engagementRate: totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0,
    dismissalRate: totalViews > 0 ? (totalDismissals / totalViews) * 100 : 0
  };
};

// Static method to get user's most engaged widgets
InterfaceInteractionSchema.statics.getMostEngagedWidgets = async function(userId, days = 7, limit = 5) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$widgetId',
        totalInteractions: { $sum: 1 },
        avgDwellTime: { $avg: '$dwellTime' },
        helpfulCount: {
          $sum: { $cond: [{ $eq: ['$outcome', 'helpful'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { totalInteractions: -1, avgDwellTime: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return result.map(r => ({
    widgetId: r._id,
    interactions: r.totalInteractions,
    avgDwellTime: r.avgDwellTime,
    helpfulRate: (r.helpfulCount / r.totalInteractions) * 100
  }));
};

// Static method to get least engaged widgets (candidates for removal)
InterfaceInteractionSchema.statics.getLeastEngagedWidgets = async function(userId, days = 7, limit = 5) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
        action: { $in: ['viewed', 'ignored', 'dismissed'] }
      }
    },
    {
      $group: {
        _id: '$widgetId',
        totalViews: { $sum: 1 },
        ignoredCount: {
          $sum: { $cond: [{ $eq: ['$action', 'ignored'] }, 1, 0] }
        },
        dismissedCount: {
          $sum: { $cond: [{ $eq: ['$action', 'dismissed'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        ignoreRate: { $divide: ['$ignoredCount', '$totalViews'] }
      }
    },
    {
      $sort: { ignoreRate: -1 }
    },
    {
      $limit: limit
    }
  ]);

  return result.map(r => ({
    widgetId: r._id,
    totalViews: r.totalViews,
    ignoreRate: r.ignoreRate * 100,
    dismissalRate: (r.dismissedCount / r.totalViews) * 100
  }));
};

module.exports = mongoose.model('InterfaceInteraction', InterfaceInteractionSchema);
