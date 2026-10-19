/**
 * JAVASCRIPT WIDGET ENGINE
 *
 * This is INSANE. Phoenix generates widgets using JavaScript.
 *
 * How it works:
 * 1. User says "I want to track my caffeine"
 * 2. AI generates a widget definition (with JavaScript render function)
 * 3. Backend stores it
 * 4. iOS executes the JavaScript using JavaScriptCore
 * 5. Widget appears on home screen
 * 6. Updates automatically
 * 7. Creates Siri shortcuts automatically
 *
 * Features:
 * - AI-generated render functions
 * - Real-time data binding
 * - Interactive actions
 * - Auto-updating
 * - WidgetKit integration
 * - AppIntents (Siri) integration
 * - Live Activities support
 *
 * This is what makes Phoenix feel ALIVE.
 */

const consciousMind = require('../gemini/consciousMind');
const SavedWidget = require('../../models/SavedWidget');
const CustomTrackerEntry = require('../../models/CustomTrackerEntry');

class JavaScriptWidgetEngine {
  constructor() {
    this.widgetTemplates = new Map();
    this.loadTemplates();

    
  }

  /**
   * GENERATE WIDGET FROM NATURAL LANGUAGE
   *
   * User: "I want to track my caffeine intake"
   * → Complete widget generated
   *
   * @param {String} userId - User ID
   * @param {String} request - Natural language request
   * @returns {Object} - Widget definition
   */
  async generateWidget(userId, request) {
    try {
      

      // Use AI to understand what they want
      const analysis = await this.analyzeRequest(request);

      // Generate widget definition
      const widget = await this.buildWidget(userId, analysis);

      // Store in database
      const saved = await SavedWidget.create({
        userId,
        widgetId: widget.id,
        name: widget.name,
        icon: widget.icon,
        color: widget.color,
        type: widget.type,
        definition: widget,
        isActive: true
      });

      

      return {
        success: true,
        widget: saved,
        message: `Created "${widget.name}" widget! It's now on your home screen.`
      };

    } catch (error) {
      console.error('[Widget Engine] Generation error:', error);
      throw error;
    }
  }

  /**
   * ANALYZE REQUEST - Understand what user wants to track
   */
  async analyzeRequest(request) {
    const prompt = `Analyze this widget request and extract the details:

Request: "${request}"

Return JSON:
{
  "name": "Widget name (2-3 words)",
  "icon": "Single emoji that represents this",
  "color": "Hex color that fits the theme",
  "trackingType": "counter | timer | rating | boolean | number | text",
  "dataPoints": ["What to track"],
  "actions": ["Quick actions user might want"],
  "displayFormat": "How to show the data"
}

Examples:
"I want to track my caffeine" → {
  "name": "Caffeine Tracker",
  "icon": "☕",
  "color": "#8B4513",
  "trackingType": "counter",
  "dataPoints": ["amount_mg", "source"],
  "actions": ["Log Coffee (95mg)", "Log Energy Drink (160mg)", "Log Tea (40mg)"],
  "displayFormat": "Total mg today with drink count"
}

"Track my water intake" → {
  "name": "Water Tracker",
  "icon": "💧",
  "color": "#4A90E2",
  "trackingType": "counter",
  "dataPoints": ["ounces"],
  "actions": ["Log 8oz", "Log 16oz", "Log 32oz"],
  "displayFormat": "Ounces today with percentage of goal"
}`;

    const response = await consciousMind.model.generateContent(prompt);
    const text = response.response.text();

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse widget analysis');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * BUILD WIDGET - Create complete widget definition
   */
  async buildWidget(userId, analysis) {
    const widgetId = `${analysis.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    return {
      id: widgetId,
      name: analysis.name,
      icon: analysis.icon,
      color: analysis.color,
      type: analysis.trackingType,

      // JavaScript render function (executed by iOS)
      renderFunction: this.generateRenderFunction(analysis),

      // Actions (become buttons)
      actions: this.generateActions(analysis),

      // Data schema
      dataSchema: this.generateDataSchema(analysis),

      // Backend endpoints
      endpoints: {
        log: `/api/custom-tracker/${widgetId}/log`,
        history: `/api/custom-tracker/${widgetId}/history`,
        stats: `/api/custom-tracker/${widgetId}/stats`,
        delete: `/api/custom-tracker/${widgetId}/entry/:entryId`
      },

      // Siri integration (auto-generated)
      appIntents: this.generateAppIntents(analysis, widgetId),

      // Live Activity support
      liveActivity: this.generateLiveActivity(analysis),

      // Widget sizes
      supportedSizes: ['small', 'medium', 'large'],

      // Update frequency
      refreshInterval: 300 // 5 minutes
    };
  }

  /**
   * GENERATE RENDER FUNCTION - JavaScript that runs on iOS
   */
  generateRenderFunction(analysis) {
    const { trackingType, displayFormat, name } = analysis;

    // Different render logic based on type
    if (trackingType === 'counter') {
      return `
function render(data) {
  const today = data.entries.filter(e => {
    const entryDate = new Date(e.timestamp);
    const now = new Date();
    return entryDate.toDateString() === now.toDateString();
  });

  const total = today.reduce((sum, entry) => sum + (entry.amount || 1), 0);
  const count = today.length;

  return {
    type: "stat_card",
    title: "${name}",
    value: total.toString(),
    unit: data.unit || "",
    subtitle: count + " entries today",
    progress: data.goal ? total / data.goal : null,
    color: "${analysis.color}",
    icon: "${analysis.icon}"
  };
}`;
    }

    if (trackingType === 'timer') {
      return `
function render(data) {
  const activeEntry = data.entries.find(e => e.isActive);

  if (activeEntry) {
    const elapsed = Date.now() - new Date(activeEntry.startTime).getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    return {
      type: "timer_card",
      title: "${name}",
      elapsed: hours + ":" + (minutes % 60) + ":" + (seconds % 60),
      isActive: true,
      color: "${analysis.color}"
    };
  }

  return {
    type: "timer_card",
    title: "${name}",
    elapsed: "0:00:00",
    isActive: false,
    color: "${analysis.color}"
  };
}`;
    }

    if (trackingType === 'rating') {
      return `
function render(data) {
  const today = data.entries.filter(e => {
    const entryDate = new Date(e.timestamp);
    const now = new Date();
    return entryDate.toDateString() === now.toDateString();
  });

  const average = today.length > 0
    ? today.reduce((sum, e) => sum + e.rating, 0) / today.length
    : 0;

  return {
    type: "rating_card",
    title: "${name}",
    rating: Math.round(average * 10) / 10,
    maxRating: 5,
    count: today.length,
    color: "${analysis.color}"
  };
}`;
    }

    // Default
    return `
function render(data) {
  return {
    type: "generic_card",
    title: "${name}",
    value: data.entries.length,
    subtitle: "Total entries",
    color: "${analysis.color}"
  };
}`;
  }

  /**
   * GENERATE ACTIONS - Quick actions for widget
   */
  generateActions(analysis) {
    return analysis.actions.map((actionText, index) => {
      // Parse action (e.g., "Log Coffee (95mg)")
      const match = actionText.match(/(.+?)\s*\((\d+)([^\)]+)\)/);

      if (match) {
        return {
          id: `action_${index}`,
          label: match[1].trim(),
          icon: analysis.icon,
          handler: 'logEntry',
          params: {
            amount: parseInt(match[2]),
            unit: match[3].trim(),
            type: match[1].toLowerCase()
          }
        };
      }

      return {
        id: `action_${index}`,
        label: actionText,
        icon: analysis.icon,
        handler: 'logEntry',
        params: {}
      };
    });
  }

  /**
   * GENERATE DATA SCHEMA
   */
  generateDataSchema(analysis) {
    const schema = {
      type: 'object',
      properties: {}
    };

    analysis.dataPoints.forEach(point => {
      schema.properties[point] = {
        type: this.inferDataType(point)
      };
    });

    schema.properties.timestamp = {
      type: 'date',
      required: true
    };

    return schema;
  }

  /**
   * GENERATE APP INTENTS - Siri shortcuts
   */
  generateAppIntents(analysis, widgetId) {
    return analysis.actions.map((actionText, index) => ({
      phrase: actionText.toLowerCase(),
      intentName: `${widgetId}_action_${index}`,
      description: `${actionText} for ${analysis.name}`,
      category: 'log',
      parameters: []
    }));
  }

  /**
   * GENERATE LIVE ACTIVITY
   */
  generateLiveActivity(analysis) {
    if (analysis.trackingType === 'timer') {
      return {
        enabled: true,
        updates: 'realtime',
        dynamicIsland: {
          compact: {
            leading: analysis.icon,
            trailing: '{elapsed}'
          },
          expanded: {
            title: analysis.name,
            subtitle: '{elapsed}'
          }
        }
      };
    }

    if (analysis.trackingType === 'counter') {
      return {
        enabled: true,
        updates: 'on_change',
        dynamicIsland: {
          compact: {
            leading: analysis.icon,
            trailing: '{total}'
          },
          expanded: {
            title: analysis.name,
            subtitle: '{total} {unit} today'
          }
        }
      };
    }

    return {
      enabled: false
    };
  }

  /**
   * EXECUTE WIDGET ACTION
   */
  async executeAction(userId, widgetId, actionName, params = {}) {
    try {
      

      // Get widget definition
      const widget = await SavedWidget.findOne({ userId, widgetId }).lean();
      if (!widget) throw new Error('Widget not found');

      // Find action
      const action = widget.definition.actions.find(a => a.label === actionName || a.id === actionName);
      if (!action) throw new Error('Action not found');

      // Execute based on handler
      if (action.handler === 'logEntry') {
        return await this.logEntry(userId, widgetId, {
          ...action.params,
          ...params,
          timestamp: new Date()
        });
      }

      throw new Error('Unknown action handler');

    } catch (error) {
      console.error('[Widget Engine] Action execution error:', error);
      throw error;
    }
  }

  /**
   * LOG ENTRY
   */
  async logEntry(userId, widgetId, data) {
    const entry = await CustomTrackerEntry.create({
      userId,
      widgetId,
      data,
      timestamp: data.timestamp || new Date()
    });

    // Trigger widget update
    this.triggerWidgetUpdate(userId, widgetId);

    return {
      success: true,
      entry,
      message: 'Entry logged'
    };
  }

  /**
   * GET WIDGET DATA
   */
  async getWidgetData(userId, widgetId, options = {}) {
    const {
      limit = 100,
      startDate = null,
      endDate = null
    } = options;

    const query = { userId, widgetId };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const entries = await CustomTrackerEntry.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    const widget = await SavedWidget.findOne({ userId, widgetId }).lean();

    return {
      entries,
      widget: widget?.definition,
      stats: await this.calculateStats(userId, widgetId, entries)
    };
  }

  /**
   * CALCULATE STATS
   */
  async calculateStats(userId, widgetId, entries) {
    if (entries.length === 0) {
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        average: 0
      };
    }

    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayEntries = entries.filter(e => new Date(e.timestamp).toDateString() === today);
    const weekEntries = entries.filter(e => new Date(e.timestamp) >= weekAgo);

    const total = entries.reduce((sum, e) => sum + (e.data.amount || 1), 0);
    const todayTotal = todayEntries.reduce((sum, e) => sum + (e.data.amount || 1), 0);
    const weekTotal = weekEntries.reduce((sum, e) => sum + (e.data.amount || 1), 0);

    return {
      total,
      today: todayTotal,
      thisWeek: weekTotal,
      average: weekTotal / 7,
      todayCount: todayEntries.length,
      weekCount: weekEntries.length
    };
  }

  /**
   * TRIGGER WIDGET UPDATE - Notify iOS to refresh
   */
  triggerWidgetUpdate(userId, widgetId) {
    // Send through consciousness stream
    const stream = require('../consciousness/realtimeConsciousnessStream');
    if (stream.isUserConnected && stream.isUserConnected(userId)) {
      stream.sendToUser(userId, {
        type: 'WIDGET_UPDATE',
        widgetId,
        timestamp: Date.now()
      });
    }
  }

  /**
   * UTILITY METHODS
   */

  inferDataType(fieldName) {
    const lower = fieldName.toLowerCase();

    if (lower.includes('amount') || lower.includes('count') || lower.includes('mg') || lower.includes('oz')) {
      return 'number';
    }

    if (lower.includes('time') || lower.includes('duration')) {
      return 'number'; // milliseconds
    }

    if (lower.includes('rating') || lower.includes('score')) {
      return 'number';
    }

    if (lower.includes('is') || lower.includes('has')) {
      return 'boolean';
    }

    return 'string';
  }

  loadTemplates() {
    // Predefined templates for common widgets
    this.widgetTemplates.set('caffeine', {
      name: 'Caffeine Tracker',
      icon: '☕',
      color: '#8B4513',
      trackingType: 'counter'
    });

    this.widgetTemplates.set('water', {
      name: 'Water Tracker',
      icon: '💧',
      color: '#4A90E2',
      trackingType: 'counter'
    });

    this.widgetTemplates.set('mood', {
      name: 'Mood Tracker',
      icon: '😊',
      color: '#FFD700',
      trackingType: 'rating'
    });

    this.widgetTemplates.set('focus', {
      name: 'Focus Timer',
      icon: '⏰',
      color: '#FF6B6B',
      trackingType: 'timer'
    });
  }

  /**
   * GET ALL WIDGETS FOR USER
   */
  async getUserWidgets(userId) {
    const widgets = await SavedWidget.find({ userId, isActive: true }).lean();

    return widgets.map(w => ({
      id: w.widgetId,
      name: w.name,
      icon: w.icon,
      color: w.color,
      type: w.type,
      definition: w.definition
    }));
  }

  /**
   * DELETE WIDGET
   */
  async deleteWidget(userId, widgetId) {
    await SavedWidget.deleteOne({ userId, widgetId });
    await CustomTrackerEntry.deleteMany({ userId, widgetId });

    return {
      success: true,
      message: 'Widget deleted'
    };
  }
}

module.exports = new JavaScriptWidgetEngine();
