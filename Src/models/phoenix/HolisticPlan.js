/**
 * HOLISTIC PLAN MODEL
 * Stores autonomous cross-domain optimization plans
 * Coordinates actions across all 7 planetary domains for unified life optimization
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Action schema for domain-specific actions
const ActionSchema = new Schema({
    actionType: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed', 'skipped'],
        default: 'pending'
    },
    priority: {
        type: Number,
        default: 50,
        min: 0,
        max: 100
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    scheduledFor: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    error: {
        type: String,
        default: null
    },
    retries: {
        type: Number,
        default: 0
    }
}, { _id: true });

const HolisticPlanSchema = new Schema({
    // User who owns this plan
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Plan identifier
    planId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // User's goal
    goal: {
        type: String,
        required: true
    },

    // Timeframe for goal completion
    timeframe: {
        type: String,
        default: null
    },

    // Plan status
    status: {
        type: String,
        enum: ['active', 'completed', 'paused', 'failed', 'cancelled'],
        default: 'active',
        index: true
    },

    // Domain-specific actions
    domainActions: {
        mercury: {
            type: [ActionSchema],
            default: []
        },
        venus: {
            type: [ActionSchema],
            default: []
        },
        earth: {
            type: [ActionSchema],
            default: []
        },
        mars: {
            type: [ActionSchema],
            default: []
        },
        jupiter: {
            type: [ActionSchema],
            default: []
        },
        saturn: {
            type: [ActionSchema],
            default: []
        }
    },

    // Generated widgets for this plan
    widgets: {
        type: [Schema.Types.ObjectId],
        ref: 'SavedWidget',
        default: []
    },

    // Optimization score (0-100)
    optimizationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // Progress percentage (0-100)
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },

    // Cross-domain patterns detected
    patterns: [{
        patternType: {
            type: String,
            required: true
        },
        domains: {
            type: [String],
            required: true
        },
        insight: {
            type: String,
            required: true
        },
        recommendation: {
            type: String,
            default: ''
        },
        confidence: {
            type: Number,
            default: 0,
            min: 0,
            max: 1
        },
        detectedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Execution metadata
    execution: {
        // Total number of actions across all domains
        totalActions: {
            type: Number,
            default: 0
        },

        // Completed actions count
        completedActions: {
            type: Number,
            default: 0
        },

        // Failed actions count
        failedActions: {
            type: Number,
            default: 0
        },

        // Pending actions count
        pendingActions: {
            type: Number,
            default: 0
        },

        // Last execution timestamp
        lastExecuted: {
            type: Date,
            default: null
        },

        // Next scheduled execution
        nextExecution: {
            type: Date,
            default: null
        },

        // Auto-execution enabled?
        autoExecute: {
            type: Boolean,
            default: true
        }
    },

    // Plan adjustments history
    adjustments: [{
        date: {
            type: Date,
            default: Date.now
        },
        reason: {
            type: String,
            required: true
        },
        changes: {
            type: Schema.Types.Mixed,
            required: true
        },
        triggeredBy: {
            type: String,
            enum: ['user', 'ai', 'system'],
            default: 'ai'
        }
    }],

    // AI generation metadata
    generation: {
        // AI model used
        generatedBy: {
            type: String,
            enum: ['gemini', 'claude', 'openai'],
            default: 'gemini'
        },

        // Generation timestamp
        generatedAt: {
            type: Date,
            default: Date.now
        },

        // Voice query that triggered plan (if applicable)
        originalQuery: {
            type: String,
            default: null
        },

        // Domain data snapshot at generation time
        domainSnapshot: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },

    // Butler automation integration
    butler: {
        // Butler actions scheduled
        scheduled: {
            type: Number,
            default: 0
        },

        // Butler actions completed
        completed: {
            type: Number,
            default: 0
        },

        // Butler action IDs
        actions: {
            type: [Schema.Types.ObjectId],
            ref: 'ButlerAction',
            default: []
        }
    },

    // Monitoring configuration
    monitoring: {
        // Check-in frequency (days)
        checkInFrequency: {
            type: Number,
            default: 1
        },

        // Last check-in
        lastCheckIn: {
            type: Date,
            default: null
        },

        // Next check-in
        nextCheckIn: {
            type: Date,
            default: null
        },

        // Alerts enabled?
        alertsEnabled: {
            type: Boolean,
            default: true
        }
    },

    // Plan notes
    notes: {
        type: String,
        default: ''
    },

    // Plan tags
    tags: {
        type: [String],
        default: []
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
    },

    completedAt: {
        type: Date,
        default: null
    }
});

// Indexes for efficient querying
HolisticPlanSchema.index({ userId: 1, status: 1 });
HolisticPlanSchema.index({ userId: 1, createdAt: -1 });
HolisticPlanSchema.index({ userId: 1, 'execution.nextExecution': 1 });

// Update updatedAt on save
HolisticPlanSchema.pre('save', function(next) {
    this.updatedAt = Date.now();

    // Calculate total actions
    let total = 0;
    let completed = 0;
    let failed = 0;
    let pending = 0;

    ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'].forEach(domain => {
        const actions = this.domainActions[domain] || [];
        total += actions.length;
        completed += actions.filter(a => a.status === 'completed').length;
        failed += actions.filter(a => a.status === 'failed').length;
        pending += actions.filter(a => a.status === 'pending').length;
    });

    this.execution.totalActions = total;
    this.execution.completedActions = completed;
    this.execution.failedActions = failed;
    this.execution.pendingActions = pending;

    // Calculate progress
    if (total > 0) {
        this.progress = Math.round((completed / total) * 100);
    }

    // Update status based on progress
    if (this.progress === 100 && this.status === 'active') {
        this.status = 'completed';
        this.completedAt = new Date();
    }

    next();
});

// Instance methods
HolisticPlanSchema.methods = {
    /**
     * Update action status
     */
    updateActionStatus: async function(domain, actionId, status, error = null) {
        const action = this.domainActions[domain].id(actionId);
        if (!action) {
            throw new Error(`Action ${actionId} not found in domain ${domain}`);
        }

        action.status = status;
        if (error) action.error = error;
        if (status === 'completed') action.completedAt = new Date();

        await this.save();
        return this;
    },

    /**
     * Add adjustment to history
     */
    addAdjustment: async function(reason, changes, triggeredBy = 'ai') {
        this.adjustments.push({ reason, changes, triggeredBy });
        await this.save();
        return this;
    },

    /**
     * Record check-in
     */
    recordCheckIn: async function() {
        this.monitoring.lastCheckIn = new Date();
        this.monitoring.nextCheckIn = new Date(
            Date.now() + this.monitoring.checkInFrequency * 24 * 60 * 60 * 1000
        );
        await this.save();
        return this;
    },

    /**
     * Get pending actions across all domains
     */
    getPendingActions: function() {
        const pending = [];
        ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'].forEach(domain => {
            const actions = this.domainActions[domain].filter(a => a.status === 'pending');
            actions.forEach(action => {
                pending.push({
                    domain,
                    actionId: action._id,
                    ...action.toObject()
                });
            });
        });
        return pending.sort((a, b) => b.priority - a.priority);
    },

    /**
     * Get next action to execute
     */
    getNextAction: function() {
        const pending = this.getPendingActions();
        return pending.length > 0 ? pending[0] : null;
    },

    /**
     * Get domain status summary
     */
    getDomainStatus: function() {
        const status = {};
        ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'].forEach(domain => {
            const actions = this.domainActions[domain];
            const total = actions.length;
            const completed = actions.filter(a => a.status === 'completed').length;
            const failed = actions.filter(a => a.status === 'failed').length;
            const pending = actions.filter(a => a.status === 'pending').length;

            let domainStatus = 'not_started';
            if (total === 0) domainStatus = 'not_applicable';
            else if (completed === total) domainStatus = 'completed';
            else if (failed > 0) domainStatus = 'has_errors';
            else if (pending < total) domainStatus = 'in_progress';

            status[domain] = {
                status: domainStatus,
                total,
                completed,
                failed,
                pending,
                progress: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        });
        return status;
    },

    /**
     * Get plan as JSON for frontend
     */
    toClientJSON: function() {
        return {
            planId: this.planId,
            goal: this.goal,
            timeframe: this.timeframe,
            status: this.status,
            domainActions: this.domainActions,
            widgets: this.widgets,
            optimizationScore: this.optimizationScore,
            progress: this.progress,
            patterns: this.patterns,
            execution: this.execution,
            adjustments: this.adjustments,
            butler: this.butler,
            monitoring: this.monitoring,
            notes: this.notes,
            tags: this.tags,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            completedAt: this.completedAt,
            domainStatus: this.getDomainStatus()
        };
    }
};

// Static methods
HolisticPlanSchema.statics = {
    /**
     * Get active plans for user
     */
    getActivePlans: async function(userId) {
        return this.find({ userId, status: 'active' })
            .sort({ createdAt: -1 })
            .populate('widgets')
            .lean();
    },

    /**
     * Get plans by status
     */
    getPlansByStatus: async function(userId, status) {
        return this.find({ userId, status })
            .sort({ createdAt: -1 })
            .populate('widgets')
            .lean();
    },

    /**
     * Get plans needing check-in
     */
    getPlansNeedingCheckIn: async function() {
        return this.find({
            status: 'active',
            'monitoring.nextCheckIn': { $lte: new Date() },
            'monitoring.alertsEnabled': true
        })
        .populate('widgets')
        .lean();
    },

    /**
     * Get user's plan statistics
     */
    getUserPlanStats: async function(userId) {
        const total = await this.countDocuments({ userId });
        const active = await this.countDocuments({ userId, status: 'active' });
        const completed = await this.countDocuments({ userId, status: 'completed' });
        const failed = await this.countDocuments({ userId, status: 'failed' });

        const avgOptimization = await this.aggregate([
            { $match: { userId, status: 'active' } },
            { $group: { _id: null, avg: { $avg: '$optimizationScore' } } }
        ]);

        const avgProgress = await this.aggregate([
            { $match: { userId, status: 'active' } },
            { $group: { _id: null, avg: { $avg: '$progress' } } }
        ]);

        return {
            total,
            active,
            completed,
            failed,
            averageOptimizationScore: avgOptimization[0]?.avg || 0,
            averageProgress: avgProgress[0]?.avg || 0
        };
    }
};

module.exports = mongoose.model('HolisticPlan', HolisticPlanSchema);
