/**
 * MOOD TRACKER
 * Track persistent emotional states
 *
 * ELITE LEVEL: Mood dynamics, influences, prediction
 */

class MoodTracker {
    constructor() {
        this.state = {
            current: {
                valence: 0,                 // -1 (negative) to 1 (positive)
                arousal: 0.5,               // 0 (calm) to 1 (excited)
                dominance: 0.5              // 0 (submissive) to 1 (dominant)
            },
            baseline: {
                valence: 0.2,               // Slightly positive default
                arousal: 0.5,
                dominance: 0.5
            },
            history: [],
            influences: []
        };
    }

    /**
     * Get current mood
     */
    async getMood() {
        return {
            valence: this.state.current.valence,
            arousal: this.state.current.arousal,
            dominance: this.state.current.dominance,
            label: this.getMoodLabel(),
            timestamp: Date.now()
        };
    }

    /**
     * Get mood label from dimensions
     */
    getMoodLabel() {
        const { valence, arousal, dominance } = this.state.current;

        // High arousal, positive valence
        if (arousal > 0.6 && valence > 0.3) {
            return dominance > 0.6 ? 'excited' : 'enthusiastic';
        }

        // Low arousal, positive valence
        if (arousal < 0.4 && valence > 0.3) {
            return dominance > 0.6 ? 'content' : 'calm';
        }

        // High arousal, negative valence
        if (arousal > 0.6 && valence < -0.3) {
            return dominance > 0.6 ? 'frustrated' : 'anxious';
        }

        // Low arousal, negative valence
        if (arousal < 0.4 && valence < -0.3) {
            return dominance > 0.6 ? 'disappointed' : 'sad';
        }

        // Moderate states
        if (valence > 0.5) return 'positive';
        if (valence < -0.5) return 'negative';

        return 'neutral';
    }

    /**
     * Update mood based on influence
     */
    async updateMood(influence) {
        console.log('[MoodTracker] Updating mood...');

        const before = this.getMoodLabel();

        // Apply influence to dimensions
        if (influence.valence !== undefined) {
            this.state.current.valence = this.bounded(
                this.state.current.valence + (influence.valence * (influence.weight || 0.3)),
                -1, 1
            );
        }

        if (influence.arousal !== undefined) {
            this.state.current.arousal = this.bounded(
                this.state.current.arousal + (influence.arousal * (influence.weight || 0.3)),
                0, 1
            );
        }

        if (influence.dominance !== undefined) {
            this.state.current.dominance = this.bounded(
                this.state.current.dominance + (influence.dominance * (influence.weight || 0.3)),
                0, 1
            );
        }

        // Record influence
        this.state.influences.push({
            ...influence,
            timestamp: Date.now()
        });

        // Keep influences manageable
        if (this.state.influences.length > 100) {
            this.state.influences.shift();
        }

        // Record in history
        this.state.history.push({
            ...this.state.current,
            label: this.getMoodLabel(),
            timestamp: Date.now()
        });

        // Keep history manageable
        if (this.state.history.length > 500) {
            this.state.history.shift();
        }

        const after = this.getMoodLabel();

        if (before !== after) {
            console.log(`[MoodTracker] Mood shifted: ${before} -> ${after}`);
        }

        return {
            before,
            after,
            current: this.state.current
        };
    }

    /**
     * Bounded value
     */
    bounded(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Predict mood given future context
     */
    async predictMood(futureContext) {
        console.log('[MoodTracker] Predicting mood...');

        // Start with current mood
        let predicted = { ...this.state.current };

        // Apply context influences
        if (futureContext.successfulInteraction) {
            predicted.valence += 0.2;
            predicted.arousal += 0.1;
        }

        if (futureContext.frustration) {
            predicted.valence -= 0.3;
            predicted.arousal += 0.2;
        }

        if (futureContext.userSatisfaction) {
            predicted.valence += 0.3;
            predicted.dominance += 0.1;
        }

        // Mood regression to baseline over time
        if (futureContext.hoursInFuture) {
            const regression = Math.min(1, futureContext.hoursInFuture / 24) * 0.3;
            predicted.valence += (this.state.baseline.valence - predicted.valence) * regression;
            predicted.arousal += (this.state.baseline.arousal - predicted.arousal) * regression;
            predicted.dominance += (this.state.baseline.dominance - predicted.dominance) * regression;
        }

        // Bound predictions
        predicted.valence = this.bounded(predicted.valence, -1, 1);
        predicted.arousal = this.bounded(predicted.arousal, 0, 1);
        predicted.dominance = this.bounded(predicted.dominance, 0, 1);

        const predictedLabel = this.getMoodLabelFromDimensions(predicted);

        return {
            predicted,
            label: predictedLabel,
            confidence: 0.6
        };
    }

    /**
     * Get mood label from specific dimensions
     */
    getMoodLabelFromDimensions(dimensions) {
        const saved = this.state.current;
        this.state.current = dimensions;
        const label = this.getMoodLabel();
        this.state.current = saved;
        return label;
    }

    /**
     * Explain current mood
     */
    async explainMood() {
        const recentInfluences = this.state.influences.slice(-5);

        const explanation = {
            currentMood: this.getMoodLabel(),
            dimensions: this.state.current,
            recentInfluences: recentInfluences.map(i => ({
                factor: i.factor,
                weight: i.weight,
                direction: i.valence > 0 ? 'positive' : i.valence < 0 ? 'negative' : 'neutral',
                when: Math.floor((Date.now() - i.timestamp) / 60000) + 'm ago'
            })),
            trend: this.getMoodTrend()
        };

        return explanation;
    }

    /**
     * Get mood trend (improving/stable/declining)
     */
    getMoodTrend() {
        if (this.state.history.length < 5) {
            return 'insufficient_data';
        }

        const recent = this.state.history.slice(-5);
        const valences = recent.map(h => h.valence);

        // Simple linear trend
        const firstHalf = valences.slice(0, 2).reduce((a, b) => a + b) / 2;
        const secondHalf = valences.slice(-2).reduce((a, b) => a + b) / 2;

        const change = secondHalf - firstHalf;

        if (change > 0.1) return 'improving';
        if (change < -0.1) return 'declining';
        return 'stable';
    }

    /**
     * Reset mood to baseline
     */
    reset() {
        this.state.current = { ...this.state.baseline };
        console.log('[MoodTracker] Mood reset to baseline');
    }

    /**
     * Get mood history
     */
    getHistory(limit = 20) {
        return this.state.history.slice(-limit).reverse();
    }

    /**
     * Get summary
     */
    getSummary() {
        return {
            current: this.getMoodLabel(),
            valence: this.state.current.valence.toFixed(2),
            arousal: this.state.current.arousal.toFixed(2),
            dominance: this.state.current.dominance.toFixed(2),
            trend: this.getMoodTrend(),
            historySize: this.state.history.length,
            influences: this.state.influences.length
        };
    }
}

module.exports = new MoodTracker();
