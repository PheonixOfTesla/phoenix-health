/**
 * EPISODE MODEL
 * Persists episodic memories with emotional context
 */

const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },

    // The episode details
    what: {
        type: String,
        required: true
    },

    when: {
        type: Date,
        required: true,
        index: true,
        default: Date.now
    },

    where: {
        type: String,
        default: 'Phoenix conversation'
    },

    who: {
        type: [String],
        default: []
    },

    why: String,

    how: String,

    // Emotional context
    emotional: {
        felt: {
            type: String,
            default: 'neutral'
        },
        intensity: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        },
        valence: {
            type: Number,
            min: -1,
            max: 1,
            default: 0
        },
        significance: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        }
    },

    // Sensory details
    sensory: {
        visual: String,
        auditory: String,
        other: mongoose.Schema.Types.Mixed
    },

    // Memory connections
    connections: [{
        episodeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Episode'
        },
        relationshipType: {
            type: String,
            enum: ['caused', 'caused_by', 'similar_to', 'contrasts_with', 'part_of', 'followed_by'],
            default: 'similar_to'
        },
        strength: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        }
    }],

    // Retrieval metadata
    retrieval: {
        count: {
            type: Number,
            default: 0
        },
        lastRetrieved: Date,
        decay: {
            type: Number,
            min: 0,
            max: 1,
            default: 1.0        // 1.0 = fresh, 0.0 = completely decayed
        }
    },

    // Consolidation state
    consolidation: {
        state: {
            type: String,
            enum: ['working', 'short_term', 'long_term'],
            default: 'working'
        },
        consolidatedAt: Date,
        importance: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        }
    },

    // Tags for searchability
    tags: [String],

    // Context at time of episode
    context: {
        conversationId: String,
        sessionId: String,
        goals: [String],
        mood: String,
        other: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
EpisodeSchema.index({ userId: 1, when: -1 });
EpisodeSchema.index({ userId: 1, tags: 1 });
EpisodeSchema.index({ userId: 1, 'consolidation.state': 1 });
EpisodeSchema.index({ userId: 1, 'consolidation.importance': -1 });
EpisodeSchema.index({ userId: 1, 'emotional.significance': -1 });
EpisodeSchema.index({ what: 'text' }); // Text search on content

// Methods

/**
 * Retrieve episode (increments retrieval count)
 */
EpisodeSchema.methods.retrieve = function() {
    this.retrieval.count++;
    this.retrieval.lastRetrieved = Date.now();

    // Retrieval strengthens memory (reduces decay)
    this.retrieval.decay = Math.min(1, this.retrieval.decay + 0.1);

    return this.save();
};

/**
 * Apply time-based decay
 */
EpisodeSchema.methods.applyDecay = function() {
    const daysSinceCreation = (Date.now() - this.when) / (24 * 60 * 60 * 1000);

    // More important memories decay slower
    const decayRate = 0.01 * (1 - this.consolidation.importance);

    // More retrievals slow decay
    const retrievalBonus = Math.min(0.5, this.retrieval.count * 0.05);

    this.retrieval.decay = Math.max(0,
        1 - (daysSinceCreation * decayRate) + retrievalBonus
    );

    return this.save();
};

/**
 * Consolidate to long-term memory
 */
EpisodeSchema.methods.consolidate = function() {
    this.consolidation.state = 'long_term';
    this.consolidation.consolidatedAt = Date.now();

    // Consolidation increases importance
    this.consolidation.importance = Math.min(1,
        this.consolidation.importance + 0.2
    );

    return this.save();
};

// Static methods

/**
 * Search episodes
 */
EpisodeSchema.statics.search = async function(userId, query, limit = 10) {
    return await this.find({
        userId,
        $text: { $search: query }
    })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

/**
 * Get recent episodes
 */
EpisodeSchema.statics.getRecent = async function(userId, limit = 10) {
    return await this.find({ userId })
        .sort({ when: -1 })
        .limit(limit);
};

/**
 * Get emotionally significant episodes
 */
EpisodeSchema.statics.getSignificant = async function(userId, limit = 10) {
    return await this.find({ userId })
        .sort({ 'emotional.significance': -1 })
        .limit(limit);
};

/**
 * Get episodes by tag
 */
EpisodeSchema.statics.getByTag = async function(userId, tag, limit = 10) {
    return await this.find({
        userId,
        tags: tag
    })
    .sort({ when: -1 })
    .limit(limit);
};

/**
 * Get episodes in time range
 */
EpisodeSchema.statics.getInRange = async function(userId, startTime, endTime, limit = 100) {
    return await this.find({
        userId,
        when: {
            $gte: startTime,
            $lte: endTime
        }
    })
    .sort({ when: -1 })
    .limit(limit);
};

/**
 * Get connected episodes
 */
EpisodeSchema.statics.getConnected = async function(episodeId, relationshipType = null) {
    const episode = await this.findById(episodeId)
        .populate('connections.episodeId');

    if (!episode) return [];

    let connections = episode.connections;

    if (relationshipType) {
        connections = connections.filter(c =>
            c.relationshipType === relationshipType
        );
    }

    return connections.map(c => c.episodeId);
};

/**
 * Consolidate old important episodes
 */
EpisodeSchema.statics.consolidateImportant = async function(userId, daysOld = 7) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const episodes = await this.find({
        userId,
        'consolidation.state': { $ne: 'long_term' },
        'consolidation.importance': { $gte: 0.7 },
        when: { $lte: cutoffDate }
    });

    for (const episode of episodes) {
        await episode.consolidate();
    }

    return {
        consolidated: episodes.length
    };
};

/**
 * Apply decay to all episodes
 */
EpisodeSchema.statics.applyDecayAll = async function(userId) {
    const episodes = await this.find({ userId });

    for (const episode of episodes) {
        await episode.applyDecay();
    }

    return {
        processed: episodes.length
    };
};

/**
 * Clean decayed episodes
 */
EpisodeSchema.statics.cleanDecayed = async function(userId, decayThreshold = 0.1) {
    const result = await this.deleteMany({
        userId,
        'retrieval.decay': { $lt: decayThreshold },
        'consolidation.state': { $ne: 'long_term' }
    });

    return {
        deleted: result.deletedCount
    };
};

const Episode = mongoose.model('Episode', EpisodeSchema);

module.exports = Episode;
