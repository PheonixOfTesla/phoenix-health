const mongoose = require('mongoose');

const InterfacePreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Time-based display preferences
  timeBasedDisplay: {
    morning: {
      widgets: {
        type: [String],
        default: ['health-recovery', 'health-sleep', 'calendar-today']
      },
      layout: {
        type: String,
        enum: ['compact', 'expanded', 'minimal'],
        default: 'expanded'
      }
    },
    afternoon: {
      widgets: {
        type: [String],
        default: ['health-metrics', 'calendar-today', 'goals-progress']
      },
      layout: {
        type: String,
        enum: ['compact', 'expanded', 'minimal'],
        default: 'compact'
      }
    },
    evening: {
      widgets: {
        type: [String],
        default: ['workout-plan', 'nutrition-stats', 'health-recovery']
      },
      layout: {
        type: String,
        enum: ['compact', 'expanded', 'minimal'],
        default: 'expanded'
      }
    },
    night: {
      widgets: {
        type: [String],
        default: ['health-sleep', 'health-recovery']
      },
      layout: {
        type: String,
        enum: ['compact', 'expanded', 'minimal'],
        default: 'minimal'
      }
    }
  },

  // Day-specific priorities (for calendar reorganization)
  dayPriorities: {
    monday: {
      type: [String],
      default: ['work', 'business', 'gym', 'recovery', 'family']
    },
    tuesday: {
      type: [String],
      default: ['work', 'business', 'gym', 'recovery', 'family']
    },
    wednesday: {
      type: [String],
      default: ['work', 'business', 'gym', 'recovery', 'family']
    },
    thursday: {
      type: [String],
      default: ['work', 'business', 'gym', 'recovery', 'family']
    },
    friday: {
      type: [String],
      default: ['work', 'business', 'gym', 'recovery', 'family']
    },
    saturday: {
      type: [String],
      default: ['family', 'gym', 'recovery', 'business', 'work']
    },
    sunday: {
      type: [String],
      default: ['family', 'recovery', 'gym', 'business', 'work']
    }
  },

  // Conditional display rules
  displayRules: [{
    id: String,
    name: String,
    condition: String, // e.g., "recovery_score < 60"
    action: String,    // e.g., "highlight_recovery"
    priority: {
      type: Number,
      default: 0
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  // Widget-specific preferences
  widgetSettings: {
    type: Map,
    of: {
      alwaysVisible: {
        type: Boolean,
        default: false
      },
      preferredSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      preferredPosition: {
        type: String,
        enum: ['top-left', 'top-center', 'top-right', 'center', 'bottom-left', 'bottom-center', 'bottom-right'],
        default: 'center'
      },
      updateFrequency: {
        type: Number, // seconds
        default: 300 // 5 minutes
      }
    },
    default: {}
  },

  // Location-based contexts
  locationContexts: {
    gym: {
      prioritize: {
        type: [String],
        default: ['workout-plan', 'health-metrics', 'health-hrv']
      },
      hide: {
        type: [String],
        default: ['finance-overview', 'calendar-today']
      }
    },
    home: {
      prioritize: {
        type: [String],
        default: ['health-recovery', 'health-sleep', 'calendar-today']
      },
      hide: {
        type: [String],
        default: []
      }
    },
    work: {
      prioritize: {
        type: [String],
        default: ['calendar-today', 'goals-progress']
      },
      hide: {
        type: [String],
        default: ['workout-plan', 'nutrition-stats']
      }
    },
    travel: {
      prioritize: {
        type: [String],
        default: ['health-sleep', 'health-recovery', 'calendar-today']
      },
      hide: {
        type: [String],
        default: []
      }
    }
  },

  // Interaction style preferences
  interactionMode: {
    autoRearrange: {
      type: Boolean,
      default: true
    },
    predictiveDisplay: {
      type: Boolean,
      default: true
    },
    learningEnabled: {
      type: Boolean,
      default: true
    },
    minimalistMode: {
      type: Boolean,
      default: false
    },
    proactiveGuidance: {
      type: Boolean,
      default: true
    }
  },

  // Notification preferences
  notificationRules: [{
    type: {
      type: String,
      enum: ['recovery_low', 'stress_high', 'sleep_poor', 'goal_milestone', 'pattern_detected']
    },
    threshold: mongoose.Schema.Types.Mixed,
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    displayStyle: {
      type: String,
      enum: ['subtle', 'prominent', 'modal'],
      default: 'prominent'
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  // Voice personality preference
  preferredPersonality: {
    type: String,
    enum: ['friendly_helpful', 'professional_serious', 'british_refined', 'whimsical_storyteller', 'gentle_nurturing', 'neutral_efficient'],
    default: 'friendly_helpful'
  },

  // AI Provider preference (Claude vs Gemini)
  preferredAI: {
    type: String,
    enum: ['gemini', 'claude'],
    default: 'gemini'
  },

  // Animation preferences
  animationSpeed: {
    type: String,
    enum: ['slow', 'normal', 'fast'],
    default: 'normal'
  },

  breathingAnimations: {
    type: Boolean,
    default: true
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
InterfacePreferencesSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get or create preferences for user
InterfacePreferencesSchema.statics.getOrCreateForUser = async function(userId) {
  let preferences = await this.findOne({ userId });

  if (!preferences) {
    preferences = await this.create({ userId });
  }

  return preferences;
};

// Method to update priorities for specific day
InterfacePreferencesSchema.methods.updateDayPriorities = function(day, priorities) {
  const dayLower = day.toLowerCase();
  if (this.dayPriorities[dayLower]) {
    this.dayPriorities[dayLower] = priorities;
    return this.save();
  }
  throw new Error(`Invalid day: ${day}`);
};

// Method to add display rule
InterfacePreferencesSchema.methods.addDisplayRule = function(rule) {
  this.displayRules.push({
    id: rule.id || `rule_${Date.now()}`,
    name: rule.name,
    condition: rule.condition,
    action: rule.action,
    priority: rule.priority || 0,
    enabled: rule.enabled !== undefined ? rule.enabled : true
  });
  return this.save();
};

module.exports = mongoose.model('InterfacePreferences', InterfacePreferencesSchema);
