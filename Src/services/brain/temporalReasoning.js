/**
 * TEMPORAL REASONING ENGINE
 * Tracks cause-effect relationships across time
 *
 * ELITE LEVEL: Phoenix understands "Sleep deprivation → 5 days later → injury risk"
 */

const mongoose = require('mongoose');

class TemporalReasoning {
    constructor() {
        this.causalGraph = new Map(); // event -> [consequences]
        this.timeWindows = {
            immediate: 3600000,      // 1 hour
            short: 86400000,          // 24 hours
            medium: 604800000,        // 7 days
            long: 2592000000          // 30 days
        };
    }

    /**
     * Record an event with timestamp
     */
    recordEvent(event) {
        const eventRecord = {
            id: `${event.type}-${Date.now()}`,
            type: event.type,
            timestamp: Date.now(),
            data: event.data,
            userId: event.userId,
            domain: event.domain || 'unknown'
        };

        console.log(`[TemporalReasoning] 📝 Recorded: ${event.type}`);
        return eventRecord;
    }

    /**
     * Find temporal correlations
     * Example: "User had poor sleep (event A) → 5 days later → got injured (event B)"
     */
    async findTemporalCorrelations(userId, startDate, endDate) {
        // Get all events in time range
        const events = await this.getEventsInRange(userId, startDate, endDate);

        const correlations = [];

        // For each pair of events, check if there's a causal relationship
        for (let i = 0; i < events.length; i++) {
            for (let j = i + 1; j < events.length; j++) {
                const causeEvent = events[i];
                const effectEvent = events[j];

                const timeDiff = effectEvent.timestamp - causeEvent.timestamp;

                // Check if time difference suggests causality
                if (timeDiff > 0 && timeDiff < this.timeWindows.long) {
                    const correlation = this.detectCausality(causeEvent, effectEvent, timeDiff);
                    if (correlation.causalityScore > 0.5) {
                        correlations.push(correlation);
                    }
                }
            }
        }

        return correlations.sort((a, b) => b.causalityScore - a.causalityScore);
    }

    /**
     * Detect if event A caused event B
     */
    detectCausality(causeEvent, effectEvent, timeDiff) {
        let causalityScore = 0;
        let reasoning = '';

        // Known causal patterns
        const patterns = [
            {
                cause: 'poor-sleep',
                effect: 'injury',
                typicalDelay: 432000000, // 5 days
                score: 0.8,
                explanation: 'Sleep deprivation reduces recovery and increases injury risk'
            },
            {
                cause: 'overtraining',
                effect: 'burnout',
                typicalDelay: 604800000, // 7 days
                score: 0.9,
                explanation: 'Sustained overtraining leads to burnout'
            },
            {
                cause: 'high-stress',
                effect: 'poor-sleep',
                typicalDelay: 3600000, // 1 hour
                score: 0.7,
                explanation: 'Stress disrupts sleep quality'
            },
            {
                cause: 'poor-nutrition',
                effect: 'low-energy',
                typicalDelay: 86400000, // 24 hours
                score: 0.75,
                explanation: 'Inadequate nutrition reduces energy levels'
            },
            {
                cause: 'financial-stress',
                effect: 'sleep-disruption',
                typicalDelay: 3600000, // Same day
                score: 0.65,
                explanation: 'Financial worries cause sleep problems'
            }
        ];

        // Check against known patterns
        for (const pattern of patterns) {
            if (this.matchesEventType(causeEvent, pattern.cause) &&
                this.matchesEventType(effectEvent, pattern.effect)) {

                // Check if timing aligns
                const delayDiff = Math.abs(timeDiff - pattern.typicalDelay);
                const delayScore = Math.max(0, 1 - (delayDiff / pattern.typicalDelay));

                if (delayScore > 0.3) { // Timing is reasonable
                    causalityScore = pattern.score * delayScore;
                    reasoning = pattern.explanation;
                    break;
                }
            }
        }

        return {
            causeEvent: causeEvent.type,
            effectEvent: effectEvent.type,
            timeDiff: timeDiff,
            timeDiffHours: Math.round(timeDiff / 3600000),
            causalityScore,
            reasoning,
            confidence: causalityScore > 0.7 ? 'high' : causalityScore > 0.5 ? 'medium' : 'low'
        };
    }

    /**
     * Check if event matches type pattern
     */
    matchesEventType(event, pattern) {
        const eventType = event.type.toLowerCase();
        const patternLower = pattern.toLowerCase();

        // Direct match
        if (eventType.includes(patternLower)) return true;

        // Synonyms
        const synonyms = {
            'poor-sleep': ['sleep-deprivation', 'insomnia', 'bad-sleep'],
            'injury': ['strain', 'pain', 'hurt', 'injured'],
            'overtraining': ['excessive-training', 'too-much-training'],
            'burnout': ['exhaustion', 'fatigue', 'depleted'],
            'high-stress': ['stressed', 'anxiety', 'pressure'],
            'poor-nutrition': ['bad-diet', 'undereating', 'malnutrition'],
            'low-energy': ['tired', 'fatigued', 'exhausted'],
            'financial-stress': ['money-problems', 'debt', 'overspending']
        };

        const synonymList = synonyms[patternLower] || [];
        return synonymList.some(syn => eventType.includes(syn));
    }

    /**
     * Get events in time range (mock - in production, query MongoDB)
     */
    async getEventsInRange(userId, startDate, endDate) {
        // In production, query the InteractionChain or new TemporalEvent model
        // For now, return empty array
        return [];
    }

    /**
     * Predict future events based on current state
     * Example: "You're sleep deprived → Predict injury in 5 days"
     */
    async predictFutureEvent(currentState, userId) {
        const predictions = [];

        // Check current state against known causal patterns
        if (currentState.sleepQuality < 60) {
            predictions.push({
                event: 'injury-risk',
                probability: 0.72,
                timeframe: '3-7 days',
                reasoning: 'Sleep deprivation increases injury risk by 70%',
                intervention: 'Reduce training intensity by 30%'
            });
        }

        if (currentState.trainingVolume > currentState.baseline * 1.5) {
            predictions.push({
                event: 'burnout',
                probability: 0.65,
                timeframe: '7-14 days',
                reasoning: 'Training volume 50% above baseline',
                intervention: 'Schedule deload week'
            });
        }

        if (currentState.hrv < currentState.hrvBaseline * 0.7) {
            predictions.push({
                event: 'illness',
                probability: 0.58,
                timeframe: '1-3 days',
                reasoning: 'HRV 30% below baseline indicates immune stress',
                intervention: 'Prioritize sleep and reduce stress'
            });
        }

        return predictions.sort((a, b) => b.probability - a.probability);
    }

    /**
     * Answer "Why did X happen?"
     * Looks back in time to find likely causes
     */
    async explainEvent(event, userId) {
        const lookbackPeriod = 30 * 24 * 3600000; // 30 days
        const endDate = event.timestamp;
        const startDate = endDate - lookbackPeriod;

        const correlations = await this.findTemporalCorrelations(userId, startDate, endDate);

        // Filter correlations where this event was the effect
        const causes = correlations.filter(c => c.effectEvent === event.type);

        if (causes.length === 0) {
            return {
                event: event.type,
                explanation: 'No clear causal pattern detected',
                confidence: 'low'
            };
        }

        // Return most likely cause
        const topCause = causes[0];
        return {
            event: event.type,
            cause: topCause.causeEvent,
            timeBefore: `${topCause.timeDiffHours} hours`,
            explanation: topCause.reasoning,
            confidence: topCause.confidence
        };
    }

    /**
     * Build causal graph from historical data
     * Creates knowledge of which events tend to cause others
     */
    async buildCausalGraph(userId) {
        console.log('[TemporalReasoning] 🧠 Building causal graph...');

        const thirtyDaysAgo = Date.now() - (30 * 24 * 3600000);
        const correlations = await this.findTemporalCorrelations(userId, thirtyDaysAgo, Date.now());

        // Group by cause -> effect
        correlations.forEach(corr => {
            if (!this.causalGraph.has(corr.causeEvent)) {
                this.causalGraph.set(corr.causeEvent, []);
            }

            this.causalGraph.get(corr.causeEvent).push({
                effect: corr.effectEvent,
                typicalDelay: corr.timeDiff,
                confidence: corr.causalityScore
            });
        });

        console.log(`[TemporalReasoning] ✅ Causal graph built: ${this.causalGraph.size} cause nodes`);
        return this.causalGraph;
    }

    /**
     * Get causal chain
     * Example: poor-sleep → injury → missed-workout → guilt → more-stress
     */
    getCausalChain(startEvent, maxDepth = 5) {
        const chain = [startEvent];
        let current = startEvent;
        let depth = 0;

        while (depth < maxDepth) {
            const effects = this.causalGraph.get(current);
            if (!effects || effects.length === 0) break;

            // Get highest confidence effect
            const nextEffect = effects.sort((a, b) => b.confidence - a.confidence)[0];
            chain.push(nextEffect.effect);
            current = nextEffect.effect;
            depth++;
        }

        return chain;
    }
}

module.exports = new TemporalReasoning();
