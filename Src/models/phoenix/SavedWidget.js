/**
 * SAVED WIDGET MODEL
 * Persists user-created custom widgets across sessions
 * Stores AI-generated widgets, templates, and manual configurations
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SavedWidgetSchema = new Schema({
    // User who owns this widget
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Unique widget identifier
    widgetId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Widget display name
    widgetName: {
        type: String,
        required: true
    },

    // Widget type/category
    widgetType: {
        type: String,
        enum: ['custom_tracker', 'ai_generated', 'template', 'manual', 'system'],
        default: 'custom_tracker'
    },

    // Widget HTML content
    html: {
        type: String,
        required: true
    },

    // Widget actions/endpoints
    actions: {
        type: Map,
        of: String,
        default: {}
    },

    // Widget data structure
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },

    // Tracking fields for data collection
    trackingFields: {
        type: [String],
        default: []
    },

    // Widget configuration
    config: {
        // Widget position in interface
        position: {
            type: Number,
            default: 0
        },

        // Widget priority (0 = highest)
        priority: {
            type: Number,
            default: 50
        },

        // Widget size (small, medium, large, full)
        size: {
            type: String,
            enum: ['small', 'medium', 'large', 'full'],
            default: 'medium'
        },

        // Widget color theme
        theme: {
            type: String,
            default: 'default'
        },

        // Custom CSS classes
        customClasses: {
            type: [String],
            default: []
        }
    },

    // Widget state
    state: {
        // Is widget currently enabled/visible?
        enabled: {
            type: Boolean,
            default: true
        },

        // Is widget pinned to dashboard?
        pinned: {
            type: Boolean,
            default: false
        },

        // Is widget archived?
        archived: {
            type: Boolean,
            default: false
        }
    },

    // Generation metadata
    generation: {
        // How was widget created?
        source: {
            type: String,
            enum: ['ai_voice', 'ai_text', 'template', 'manual', 'system'],
            default: 'ai_voice'
        },

        // Original user request that generated this widget
        originalRequest: {
            type: String,
            default: ''
        },

        // AI model used to generate (if AI-generated)
        generatedBy: {
            type: String,
            enum: ['gemini', 'claude', 'openai', 'manual'],
            default: 'gemini'
        },

        // Generation timestamp
        generatedAt: {
            type: Date,
            default: Date.now
        },

        // Template ID (if created from template)
        templateId: {
            type: String,
            default: null
        }
    },

    // Usage statistics
    usage: {
        // Total number of times widget was used
        totalUses: {
            type: Number,
            default: 0
        },

        // Last time widget was used
        lastUsed: {
            type: Date,
            default: null
        },

        // First time widget was used
        firstUsed: {
            type: Date,
            default: null
        },

        // Average uses per day
        averageUsesPerDay: {
            type: Number,
            default: 0
        },

        // Days since last use
        daysSinceLastUse: {
            type: Number,
            default: 0
        }
    },

    // Behavior pattern connection
    behaviorPatternId: {
        type: Schema.Types.ObjectId,
        ref: 'BehaviorPattern',
        default: null
    },

    // Custom tracker entry count
    entryCount: {
        type: Number,
        default: 0
    },

    // Widget tags for organization
    tags: {
        type: [String],
        default: []
    },

    // Widget notes/description
    notes: {
        type: String,
        default: ''
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient querying
SavedWidgetSchema.index({ userId: 1, createdAt: -1 });
SavedWidgetSchema.index({ userId: 1, 'state.enabled': 1 });
SavedWidgetSchema.index({ userId: 1, 'state.pinned': 1 });
SavedWidgetSchema.index({ userId: 1, widgetType: 1 });
SavedWidgetSchema.index({ userId: 1, tags: 1 });

// Update updatedAt on save
SavedWidgetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Instance methods
SavedWidgetSchema.methods = {
    /**
     * Record widget usage
     */
    recordUsage: async function() {
        this.usage.totalUses += 1;
        this.usage.lastUsed = new Date();

        if (!this.usage.firstUsed) {
            this.usage.firstUsed = new Date();
        }

        // Calculate average uses per day
        const daysSinceCreation = Math.max(1, Math.ceil(
            (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        ));
        this.usage.averageUsesPerDay = this.usage.totalUses / daysSinceCreation;

        // Calculate days since last use
        this.usage.daysSinceLastUse = 0;

        await this.save();
        return this;
    },

    /**
     * Toggle widget enabled state
     */
    toggleEnabled: async function() {
        this.state.enabled = !this.state.enabled;
        await this.save();
        return this;
    },

    /**
     * Pin/unpin widget
     */
    togglePinned: async function() {
        this.state.pinned = !this.state.pinned;
        await this.save();
        return this;
    },

    /**
     * Archive widget
     */
    archive: async function() {
        this.state.archived = true;
        this.state.enabled = false;
        await this.save();
        return this;
    },

    /**
     * Restore archived widget
     */
    restore: async function() {
        this.state.archived = false;
        this.state.enabled = true;
        await this.save();
        return this;
    },

    /**
     * Update entry count
     */
    incrementEntryCount: async function() {
        this.entryCount += 1;
        await this.save();
        return this;
    },

    /**
     * Get widget as JSON for frontend
     */
    toClientJSON: function() {
        return {
            widgetId: this.widgetId,
            widgetName: this.widgetName,
            widgetType: this.widgetType,
            html: this.html,
            actions: Object.fromEntries(this.actions),
            data: this.data,
            trackingFields: this.trackingFields,
            config: this.config,
            state: this.state,
            generation: this.generation,
            usage: this.usage,
            entryCount: this.entryCount,
            tags: this.tags,
            notes: this.notes,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
};

// Static methods
SavedWidgetSchema.statics = {
    /**
     * Get all enabled widgets for user
     */
    getEnabledWidgets: async function(userId) {
        return this.find({
            userId,
            'state.enabled': true,
            'state.archived': false
        })
        .sort({ 'config.priority': 1, 'state.pinned': -1, createdAt: -1 })
        .lean();
    },

    /**
     * Get pinned widgets for user
     */
    getPinnedWidgets: async function(userId) {
        return this.find({
            userId,
            'state.pinned': true,
            'state.archived': false
        })
        .sort({ 'config.priority': 1, createdAt: -1 })
        .lean();
    },

    /**
     * Get widgets by type
     */
    getWidgetsByType: async function(userId, widgetType) {
        return this.find({
            userId,
            widgetType,
            'state.archived': false
        })
        .sort({ createdAt: -1 })
        .lean();
    },

    /**
     * Get widgets by tag
     */
    getWidgetsByTag: async function(userId, tag) {
        return this.find({
            userId,
            tags: tag,
            'state.archived': false
        })
        .sort({ createdAt: -1 })
        .lean();
    },

    /**
     * Search widgets by name
     */
    searchWidgets: async function(userId, searchTerm) {
        return this.find({
            userId,
            $or: [
                { widgetName: { $regex: searchTerm, $options: 'i' } },
                { notes: { $regex: searchTerm, $options: 'i' } },
                { tags: { $regex: searchTerm, $options: 'i' } }
            ],
            'state.archived': false
        })
        .sort({ 'usage.totalUses': -1, createdAt: -1 })
        .lean();
    },

    /**
     * Get inactive widgets (not used in 30+ days)
     */
    getInactiveWidgets: async function(userId, daysInactive = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

        return this.find({
            userId,
            $or: [
                { 'usage.lastUsed': { $lt: cutoffDate } },
                { 'usage.lastUsed': null }
            ],
            'state.archived': false
        })
        .sort({ 'usage.lastUsed': 1 })
        .lean();
    },

    /**
     * Get widget statistics for user
     */
    getUserWidgetStats: async function(userId) {
        const total = await this.countDocuments({ userId });
        const enabled = await this.countDocuments({ userId, 'state.enabled': true });
        const pinned = await this.countDocuments({ userId, 'state.pinned': true });
        const archived = await this.countDocuments({ userId, 'state.archived': true });

        const mostUsed = await this.find({ userId })
            .sort({ 'usage.totalUses': -1 })
            .limit(5)
            .lean();

        const recentlyCreated = await this.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return {
            total,
            enabled,
            pinned,
            archived,
            mostUsed,
            recentlyCreated
        };
    }
};

module.exports = mongoose.model('SavedWidget', SavedWidgetSchema);
