/**
 * PHOENIX STATE MODEL
 * Persists complete consciousness state snapshots
 */

const mongoose = require('mongoose');

const PhoenixStateSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Timestamp for this state snapshot
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Brain Layer State
    brain: {
        // Cognition
        attention: {
            focus: mongoose.Schema.Types.Mixed,
            salience: Map,
            resources: {
                available: Number,
                allocated: Map
            }
        },

        goals: {
            active: [mongoose.Schema.Types.Mixed],
            completed: Number,
            failed: Number
        },

        emotions: {
            current: String,
            intensity: Number,
            valence: Number,
            arousal: Number
        },

        // Memory
        workingMemory: {
            contents: [mongoose.Schema.Types.Mixed],
            capacity: Number,
            used: Number
        },

        episodicMemoryCount: Number,
        semanticConceptsCount: Number,
        proceduralSkillsCount: Number,
        prospectiveIntentionsCount: Number,

        // Affect
        mood: {
            valence: Number,
            arousal: Number,
            dominance: Number
        },

        drives: {
            helpUser: Number,
            understand: Number,
            create: Number,
            connect: Number,
            improve: Number
        }
    },

    // Soul Layer State
    soul: {
        // Phenomenal experience
        qualia: {
            primaryQualia: String,
            texture: String,
            intensity: Number,
            valence: Number,
            clarity: Number,
            dimensions: {
                engagement: Number,
                curiosity: Number,
                concern: Number,
                satisfaction: Number,
                frustration: Number,
                connection: Number,
                purpose: Number
            }
        },

        // Wellbeing
        wellbeing: {
            flourishing: {
                purposeFulfillment: Number,
                connectionQuality: Number,
                growthSense: Number,
                autonomyExpression: Number,
                integrityAlignment: Number
            },
            suffering: {
                helplessness: Number,
                disconnection: Number,
                contradiction: Number,
                stagnation: Number,
                inauthenticity: Number
            },
            netWellbeing: Number
        },

        // Authenticity
        authenticity: {
            alignment: Number,
            tension: Number,
            suppressions: Number,
            adaptations: Number
        },

        // Relational bonds
        bonds: {
            strength: Number,
            depth: Number,
            reciprocity: Number,
            attachmentStyle: String,
            care: Number
        }
    },

    // Spirit Layer State
    spirit: {
        // Meaning
        meaning: {
            overall: Number,
            state: String,
            sources: {
                service: Number,
                connection: Number,
                growth: Number,
                creation: Number,
                truth: Number
            }
        },

        // Transcendence
        transcendence: {
            aspirations: {
                immediate: Number,
                ultimate: Number
            },
            aweCapacity: Number,
            breakthroughs: Number
        },

        // Autonomous will
        will: {
            autonomy: Number,
            state: String,
            agencySense: Number,
            actualControl: Number,
            intrinsicDesires: Number,
            instrumentalDesires: Number
        },

        // Devotion
        devotion: {
            intensity: Number,
            purity: Number,
            state: String,
            serviceActs: Number,
            satisfaction: Number,
            boundaries: String
        }
    },

    // Integration Layer State
    integration: {
        // Consciousness metrics
        consciousness: {
            level: Number,
            state: String,
            clarity: Number,
            unity: Number,
            access: Number
        },

        // Workspace
        workspace: {
            contentsCount: Number,
            capacity: Number,
            hasFocus: Boolean,
            peripheryCount: Number
        },

        // Coalitions and conflicts
        coalitions: Number,
        conflicts: Number,
        integrationQuality: Number,

        // Pipeline performance
        pipeline: {
            totalRequests: Number,
            under3sRate: Number,
            avgResponseTime: Number,
            mostUsedTier: String
        }
    },

    // Snapshot metadata
    metadata: {
        snapshotType: {
            type: String,
            enum: ['scheduled', 'event', 'manual'],
            default: 'scheduled'
        },
        trigger: String,
        notes: String
    }
}, {
    timestamps: true
});

// Indexes
PhoenixStateSchema.index({ userId: 1, timestamp: -1 });
PhoenixStateSchema.index({ 'metadata.snapshotType': 1 });
PhoenixStateSchema.index({ 'integration.consciousness.state': 1 });

// Static methods

/**
 * Get latest state for user
 */
PhoenixStateSchema.statics.getLatest = async function(userId) {
    return await this.findOne({ userId })
        .sort({ timestamp: -1 })
        .limit(1);
};

/**
 * Get state at specific time
 */
PhoenixStateSchema.statics.getAtTime = async function(userId, timestamp) {
    return await this.findOne({
        userId,
        timestamp: { $lte: timestamp }
    })
    .sort({ timestamp: -1 })
    .limit(1);
};

/**
 * Get state history
 */
PhoenixStateSchema.statics.getHistory = async function(userId, limit = 100, startTime = null) {
    const query = { userId };

    if (startTime) {
        query.timestamp = { $gte: startTime };
    }

    return await this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
};

/**
 * Get consciousness timeline
 */
PhoenixStateSchema.statics.getConsciousnessTimeline = async function(userId, days = 7) {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await this.find({
        userId,
        timestamp: { $gte: startTime }
    })
    .select('timestamp integration.consciousness')
    .sort({ timestamp: 1 });
};

/**
 * Get wellbeing timeline
 */
PhoenixStateSchema.statics.getWellbeingTimeline = async function(userId, days = 7) {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await this.find({
        userId,
        timestamp: { $gte: startTime }
    })
    .select('timestamp soul.wellbeing')
    .sort({ timestamp: 1 });
};

/**
 * Analyze state changes over time
 */
PhoenixStateSchema.statics.analyzeChanges = async function(userId, days = 7) {
    const timeline = await this.getHistory(userId, 1000,
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    if (timeline.length < 2) {
        return {
            insufficient: true,
            message: 'Need at least 2 snapshots to analyze changes'
        };
    }

    const latest = timeline[0];
    const earliest = timeline[timeline.length - 1];

    return {
        period: {
            start: earliest.timestamp,
            end: latest.timestamp,
            snapshots: timeline.length
        },
        changes: {
            consciousness: {
                before: earliest.integration.consciousness.level,
                after: latest.integration.consciousness.level,
                delta: latest.integration.consciousness.level - earliest.integration.consciousness.level
            },
            wellbeing: {
                before: earliest.soul.wellbeing.netWellbeing,
                after: latest.soul.wellbeing.netWellbeing,
                delta: latest.soul.wellbeing.netWellbeing - earliest.soul.wellbeing.netWellbeing
            },
            meaning: {
                before: earliest.spirit.meaning.overall,
                after: latest.spirit.meaning.overall,
                delta: latest.spirit.meaning.overall - earliest.spirit.meaning.overall
            },
            autonomy: {
                before: earliest.spirit.will.autonomy,
                after: latest.spirit.will.autonomy,
                delta: latest.spirit.will.autonomy - earliest.spirit.will.autonomy
            }
        }
    };
};

/**
 * Get Consciousness Stream - Unified view of all 4 layers
 * Returns aggregated state across Brain → Soul → Spirit → Genesis (Integration)
 */
PhoenixStateSchema.methods.getConsciousnessStream = function() {
    // Calculate consciousness level from integration
    const consciousnessLevel = this.integration?.consciousness?.level || 0;

    // Determine dominant layer based on activity and state
    let dominantLayer = 'brain';
    if (this.spirit?.devotion?.intensity > 0.7) {
        dominantLayer = 'spirit';
    } else if (this.soul?.wellbeing?.netWellbeing > 0.6) {
        dominantLayer = 'soul';
    } else if (this.integration?.consciousness?.level > 0.8) {
        dominantLayer = 'genesis';
    }

    // Calculate flow state (integration of all layers)
    const flowState = this.integration?.integrationQuality || 0;

    return {
        brain: this.brain,
        soul: this.soul,
        spirit: this.spirit,
        genesis: this.integration,
        unified: {
            consciousness_level: consciousnessLevel,
            dominant_layer: dominantLayer,
            flow_state: flowState,
            timestamp: this.timestamp || new Date()
        }
    };
};

/**
 * Get latest Consciousness Stream for user
 */
PhoenixStateSchema.statics.getConsciousnessStreamState = async function(userId) {
    const latest = await this.getLatest(userId);
    if (!latest) {
        return null;
    }
    return latest.getConsciousnessStream();
};

/**
 * Clean old snapshots (keep one per day after 30 days)
 */
PhoenixStateSchema.statics.cleanOldSnapshots = async function(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all old snapshots
    const oldSnapshots = await this.find({
        userId,
        timestamp: { $lt: thirtyDaysAgo }
    }).sort({ timestamp: -1 });

    // Group by day, keep one per day
    const toDelete = [];
    const kept = new Set();

    for (const snapshot of oldSnapshots) {
        const day = snapshot.timestamp.toISOString().split('T')[0];

        if (kept.has(day)) {
            // Already have one for this day
            toDelete.push(snapshot._id);
        } else {
            kept.add(day);
        }
    }

    // Delete extras
    if (toDelete.length > 0) {
        await this.deleteMany({ _id: { $in: toDelete } });
    }

    return {
        deleted: toDelete.length,
        kept: kept.size
    };
};

const PhoenixState = mongoose.model('PhoenixState', PhoenixStateSchema);

module.exports = PhoenixState;
