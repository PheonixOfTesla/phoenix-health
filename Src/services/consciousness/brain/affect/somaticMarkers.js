/**
 * SOMATIC MARKERS
 * Gut feelings that guide decisions
 *
 * ELITE LEVEL: Learned associations between situations and outcomes
 */

class SomaticMarkers {
    constructor() {
        this.markers = [];
    }

    /**
     * Get somatic marker for situation
     */
    async getMarker(situation) {
        // Find markers that match this situation
        const matches = this.markers.filter(m =>
            this.situationMatches(situation, m.situation)
        );

        if (matches.length === 0) {
            return { found: false, marker: null };
        }

        // Get strongest marker
        const strongest = matches.sort((a, b) =>
            (b.intensity * b.reliability) - (a.intensity * a.reliability)
        )[0];

        console.log(`[SomaticMarkers] Gut feeling: ${strongest.marker} (${(strongest.intensity * 100).toFixed(0)}% intensity)`);

        return {
            found: true,
            marker: strongest.marker,          // 'positive' or 'negative'
            intensity: strongest.intensity,
            reliability: strongest.reliability,
            source: strongest.source
        };
    }

    /**
     * Check if situation matches marker pattern
     */
    situationMatches(situation, pattern) {
        // Simple pattern matching
        const sitStr = JSON.stringify(situation).toLowerCase();
        const patStr = JSON.stringify(pattern).toLowerCase();

        // Keyword overlap
        const sitWords = new Set(sitStr.split(/\W+/));
        const patWords = new Set(patStr.split(/\W+/));
        const overlap = [...sitWords].filter(w => patWords.has(w)).length;

        return overlap > 2;
    }

    /**
     * Create new somatic marker from experience
     */
    async createMarker(situation, outcome) {
        console.log('[SomaticMarkers] Creating marker from experience...');

        const marker = {
            situation,
            marker: outcome.positive ? 'positive' : 'negative',
            intensity: Math.abs(outcome.emotionalIntensity || 0.5),
            source: 'experience',
            reliability: 0.5,               // Start with moderate reliability
            created: Date.now(),
            reinforcements: 1
        };

        this.markers.push(marker);

        console.log(`[SomaticMarkers] Marker created: ${marker.marker} for similar situations`);

        return { success: true, marker };
    }

    /**
     * Reinforce existing marker
     */
    reinforceMarker(markerId, outcome) {
        const marker = this.markers[markerId];

        if (!marker) {
            return { success: false, error: 'Marker not found' };
        }

        // Check if outcome matches marker
        const outcomeMarker = outcome.positive ? 'positive' : 'negative';

        if (outcomeMarker === marker.marker) {
            // Reinforcement - increase reliability
            marker.reliability = Math.min(1, marker.reliability + 0.1);
            marker.intensity = Math.min(1, marker.intensity * 1.1);
        } else {
            // Contradiction - decrease reliability
            marker.reliability = Math.max(0, marker.reliability - 0.15);
            marker.intensity = Math.max(0, marker.intensity * 0.9);
        }

        marker.reinforcements++;

        console.log(`[SomaticMarkers] Marker ${outcomeMarker === marker.marker ? 'reinforced' : 'weakened'} (reliability: ${marker.reliability.toFixed(2)})`);

        return { success: true, marker };
    }

    /**
     * Consult gut feeling for decision
     */
    async consultGut(options) {
        console.log(`[SomaticMarkers] Consulting gut feeling for ${options.length} options...`);

        const gutReactions = [];

        for (const option of options) {
            const marker = await this.getMarker(option);

            gutReactions.push({
                option,
                gutFeeling: marker.found ? marker.marker : 'neutral',
                intensity: marker.found ? marker.intensity : 0,
                reliability: marker.found ? marker.reliability : 0,
                confidence: marker.found ? marker.intensity * marker.reliability : 0
            });
        }

        // Sort by confidence in gut feeling
        gutReactions.sort((a, b) => b.confidence - a.confidence);

        const topReaction = gutReactions[0];

        console.log(`[SomaticMarkers] Gut says: ${topReaction.gutFeeling} (confidence: ${(topReaction.confidence * 100).toFixed(0)}%)`);

        return {
            reactions: gutReactions,
            topReaction,
            recommendation: topReaction.confidence > 0.6
                ? `Gut feeling: ${topReaction.gutFeeling}`
                : 'No strong gut feeling'
        };
    }

    /**
     * Get markers summary
     */
    getSummary() {
        const positive = this.markers.filter(m => m.marker === 'positive').length;
        const negative = this.markers.filter(m => m.marker === 'negative').length;
        const avgReliability = this.markers.reduce((sum, m) => sum + m.reliability, 0) / (this.markers.length || 1);

        return {
            total: this.markers.length,
            positive,
            negative,
            avgReliability: (avgReliability * 100).toFixed(0) + '%'
        };
    }
}

module.exports = new SomaticMarkers();
