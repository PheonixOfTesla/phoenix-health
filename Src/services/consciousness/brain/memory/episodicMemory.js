/**
 * EPISODIC MEMORY
 * Remember specific events and experiences
 *
 * ELITE LEVEL: Time-stamped, context-rich, emotionally-tagged memories
 */

class EpisodicMemory {
    constructor() {
        this.episodes = [];
        this.maxEpisodes = 500;             // Keep most recent 500
    }

    /**
     * Encode new experience as episode
     */
    async encode(experience, emotion = null) {
        console.log('[EpisodicMemory] Encoding episode...');

        const episode = {
            id: `ep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            what: experience.what || experience.description || 'event',
            when: experience.when || Date.now(),
            where: experience.where || experience.context || 'unknown',
            who: experience.who || experience.participants || [],
            why: experience.why || experience.purpose || null,
            how: experience.how || experience.process || null,

            emotional: {
                felt: emotion ? emotion.type : 'neutral',
                intensity: emotion ? emotion.intensity : 0.5,
                significance: emotion ? emotion.significance : 0.5
            },

            sensory: {
                details: experience.sensory || {}
            },

            connections: [],                // Links to other episodes
            retrievalCount: 0,
            lastRetrieved: null,
            encoded: Date.now()
        };

        // Find connections to existing episodes
        const connections = this.findSimilar(episode);
        episode.connections = connections.slice(0, 5).map(c => c.id);

        this.episodes.push(episode);

        // Maintain size limit
        if (this.episodes.length > this.maxEpisodes) {
            this.forget(this.episodes[0].id);
        }

        console.log(`[EpisodicMemory] Episode encoded (total: ${this.episodes.length})`);

        return { success: true, episode };
    }

    /**
     * Retrieve episodes matching cue
     */
    async retrieve(cue) {
        console.log('[EpisodicMemory] Retrieving episodes...');

        const matches = [];

        for (const episode of this.episodes) {
            const score = this.matchScore(episode, cue);
            if (score > 0.3) {
                matches.push({
                    episode,
                    score
                });

                // Update retrieval info
                episode.retrievalCount++;
                episode.lastRetrieved = Date.now();
            }
        }

        // Sort by score
        matches.sort((a, b) => b.score - a.score);

        const topMatches = matches.slice(0, 5);

        console.log(`[EpisodicMemory] Retrieved ${topMatches.length} episodes`);

        return {
            matches: topMatches,
            count: topMatches.length
        };
    }

    /**
     * Calculate match score
     */
    matchScore(episode, cue) {
        let score = 0;

        // Time match
        if (cue.when) {
            const timeDiff = Math.abs(new Date(episode.when) - new Date(cue.when));
            const hoursDiff = timeDiff / 3600000;
            if (hoursDiff < 24) score += 0.3;
            else if (hoursDiff < 168) score += 0.2; // Within week
            else if (hoursDiff < 720) score += 0.1; // Within month
        }

        // Context match
        if (cue.where && episode.where === cue.where) {
            score += 0.2;
        }

        // Participant match
        if (cue.who && episode.who) {
            const overlap = episode.who.filter(p => cue.who.includes(p)).length;
            if (overlap > 0) score += 0.2;
        }

        // Content match
        if (cue.what) {
            const whatMatch = this.textSimilarity(episode.what, cue.what);
            score += whatMatch * 0.3;
        }

        // Emotional match
        if (cue.emotion && episode.emotional.felt === cue.emotion) {
            score += 0.2;
        }

        return Math.min(1, score);
    }

    /**
     * Text similarity
     */
    textSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\W+/));
        const words2 = new Set(text2.toLowerCase().split(/\W+/));
        const intersection = [...words1].filter(w => words2.has(w));
        return intersection.length / Math.max(words1.size, words2.size);
    }

    /**
     * Reconstruct episode with full details
     */
    async reconstruct(episodeId) {
        const episode = this.episodes.find(e => e.id === episodeId);

        if (!episode) {
            return { success: false, error: 'Episode not found' };
        }

        // Update retrieval count
        episode.retrievalCount++;
        episode.lastRetrieved = Date.now();

        // Retrieve connected episodes for context
        const connected = episode.connections
            .map(id => this.episodes.find(e => e.id === id))
            .filter(e => e !== undefined);

        console.log(`[EpisodicMemory] Reconstructed episode with ${connected.length} connections`);

        return {
            success: true,
            episode,
            connected,
            retrievalCount: episode.retrievalCount
        };
    }

    /**
     * Find similar episodes
     */
    findSimilar(episode) {
        const similar = [];

        for (const existing of this.episodes) {
            if (existing.id === episode.id) continue;

            const score = this.episodeSimilarity(episode, existing);
            if (score > 0.5) {
                similar.push({
                    id: existing.id,
                    score,
                    episode: existing
                });
            }
        }

        similar.sort((a, b) => b.score - a.score);

        return similar;
    }

    /**
     * Calculate episode similarity
     */
    episodeSimilarity(ep1, ep2) {
        let score = 0;

        // Same context?
        if (ep1.where === ep2.where) score += 0.3;

        // Similar participants?
        const participants1 = new Set(ep1.who);
        const participants2 = new Set(ep2.who);
        const overlap = [...participants1].filter(p => participants2.has(p)).length;
        if (overlap > 0) score += 0.2;

        // Similar content?
        const contentSim = this.textSimilarity(ep1.what, ep2.what);
        score += contentSim * 0.3;

        // Similar emotion?
        if (ep1.emotional.felt === ep2.emotional.felt) score += 0.2;

        return Math.min(1, score);
    }

    /**
     * Intentionally forget episode
     */
    async forget(episodeId) {
        const index = this.episodes.findIndex(e => e.id === episodeId);

        if (index === -1) {
            return { success: false, error: 'Episode not found' };
        }

        const forgotten = this.episodes.splice(index, 1)[0];

        console.log(`[EpisodicMemory] Forgot episode: ${forgotten.what}`);

        return { success: true, episode: forgotten };
    }

    /**
     * Get episodes in time range
     */
    async getInTimeRange(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const inRange = this.episodes.filter(e => {
            const when = new Date(e.when).getTime();
            return when >= start && when <= end;
        });

        return {
            episodes: inRange,
            count: inRange.length
        };
    }

    /**
     * Get most significant episodes
     */
    getMostSignificant(limit = 10) {
        const sorted = [...this.episodes].sort((a, b) =>
            b.emotional.significance - a.emotional.significance
        );

        return sorted.slice(0, limit);
    }

    /**
     * Get summary
     */
    getSummary() {
        return {
            total: this.episodes.length,
            capacity: this.maxEpisodes,
            oldest: this.episodes.length > 0 ? this.episodes[0].when : null,
            newest: this.episodes.length > 0 ? this.episodes[this.episodes.length - 1].when : null,
            avgRetrievalCount: this.episodes.reduce((sum, e) => sum + e.retrievalCount, 0) / (this.episodes.length || 1)
        };
    }
}

module.exports = new EpisodicMemory();
