/**
 * CAUSAL REASONING
 * Understand cause and effect, beyond pattern matching
 *
 * ELITE LEVEL: Counterfactual reasoning, intervention prediction, root cause analysis
 *
 * NOTE: This enhances temporalReasoning.js (which handles temporal correlations)
 *       This module handles deep causal inference and intervention modeling
 */

// const temporalReasoning = require('../../brain/temporalReasoning'); // TODO: Create temporalReasoning module

class CausalReasoning {
    constructor() {
        this.knownCauses = new Map();       // effect -> [causes]
        this.knownEffects = new Map();      // cause -> [effects]
        this.causalChains = [];             // Multi-step causation
        this.interventions = [];            // What happens if we act
    }

    /**
     * Explain why X happened (find causes)
     */
    async whyCausedThis(effect, context = {}) {
        console.log(`[CausalReasoning] Analyzing causes of: ${effect.type}`);

        const causes = [];

        // 1. Check known direct causes
        if (this.knownCauses.has(effect.type)) {
            const knownCauses = this.knownCauses.get(effect.type);
            causes.push(...knownCauses.map(c => ({
                ...c,
                source: 'known_pattern',
                confidence: c.confidence || 0.8
            })));
        }

        // 2. Use temporal reasoning to find temporal correlations
        // TODO: Re-enable when temporalReasoning module is created
        // if (context.userId && effect.timestamp) {
        //     const temporalCorrelations = await temporalReasoning.findTemporalCorrelations(
        //         context.userId,
        //         effect.timestamp - (30 * 24 * 3600000), // 30 days before
        //         effect.timestamp
        //     );

        //     // Filter for correlations where this effect was the result
        //     const relevantCorrelations = temporalCorrelations.filter(c =>
        //         c.effectEvent === effect.type
        //     );

        //     causes.push(...relevantCorrelations.map(c => ({
        //         cause: c.causeEvent,
        //         timeBefore: c.timeDiffHours,
        //         mechanism: c.reasoning,
        //         confidence: c.causalityScore,
        //         source: 'temporal_correlation'
        //     })));
        // }

        // 3. Search causal chains (indirect causes)
        const indirectCauses = this.findIndirectCauses(effect.type);
        causes.push(...indirectCauses.map(c => ({
            ...c,
            source: 'causal_chain',
            confidence: (c.confidence || 0.7) * 0.8 // Lower confidence for indirect
        })));

        // Sort by confidence
        causes.sort((a, b) => b.confidence - a.confidence);

        // Select top cause
        const topCause = causes[0] || null;

        return {
            effect: effect.type,
            topCause,
            allCauses: causes.slice(0, 5),
            explanation: topCause
                ? `Most likely cause: ${topCause.cause}${topCause.timeBefore ? ` (${topCause.timeBefore}h before)` : ''}`
                : 'No clear cause identified'
        };
    }

    /**
     * Predict what will happen if we do X (find effects)
     */
    async whatWillThisCause(action, context = {}) {
        console.log(`[CausalReasoning] Predicting effects of: ${action.type}`);

        const effects = [];

        // 1. Check known direct effects
        if (this.knownEffects.has(action.type)) {
            const knownEffects = this.knownEffects.get(action.type);
            effects.push(...knownEffects.map(e => ({
                ...e,
                source: 'known_pattern',
                confidence: e.confidence || 0.8
            })));
        }

        // 2. Search causal chains (indirect effects)
        const indirectEffects = this.findIndirectEffects(action.type);
        effects.push(...indirectEffects.map(e => ({
            ...e,
            source: 'causal_chain',
            confidence: (e.confidence || 0.7) * 0.8
        })));

        // 3. Use temporal patterns from past
        // TODO: Re-enable when temporalReasoning module is created
        // if (context.userId) {
        //     const predictions = await temporalReasoning.predictFutureEvent({
        //         action: action.type,
        //         ...context
        //     }, context.userId);

        //     effects.push(...predictions.map(p => ({
        //         effect: p.event,
        //         probability: p.probability,
        //         timeframe: p.timeframe,
        //         mechanism: p.reasoning,
        //         confidence: p.probability,
        //         source: 'temporal_prediction'
        //     })));
        // }

        // Sort by confidence
        effects.sort((a, b) => b.confidence - a.confidence);

        return {
            action: action.type,
            effects: effects.slice(0, 5),
            mostLikely: effects[0] || null,
            summary: effects.length > 0
                ? `Most likely effect: ${effects[0].effect} (${(effects[0].confidence * 100).toFixed(0)}% confidence)`
                : 'No clear effects predicted'
        };
    }

    /**
     * Find root cause (trace back causal chain)
     */
    async findRootCause(symptom) {
        console.log(`[CausalReasoning] Finding root cause of: ${symptom}`);

        const chain = [];
        let current = symptom;
        let depth = 0;
        const maxDepth = 5;

        while (depth < maxDepth) {
            const causes = await this.whyCausedThis({ type: current }, {});

            if (!causes.topCause) {
                // No more causes found - current is root
                break;
            }

            chain.push({
                effect: current,
                cause: causes.topCause.cause,
                mechanism: causes.topCause.mechanism,
                confidence: causes.topCause.confidence
            });

            current = causes.topCause.cause;
            depth++;
        }

        const rootCause = current;
        const chainConfidence = chain.reduce((product, link) =>
            product * link.confidence, 1.0);

        return {
            symptom,
            rootCause,
            chain,
            depth: chain.length,
            confidence: chainConfidence,
            explanation: this.explainCausalChain(chain, symptom, rootCause)
        };
    }

    /**
     * Explain causal chain
     */
    explainCausalChain(chain, symptom, rootCause) {
        if (chain.length === 0) {
            return `${symptom} has no identifiable cause`;
        }

        if (chain.length === 1) {
            return `${symptom} was caused by ${rootCause}`;
        }

        const steps = chain.map((link, i) =>
            `${link.cause} → ${link.effect}`
        ).join(' → ');

        return `Root cause: ${rootCause}. Chain: ${steps}`;
    }

    /**
     * Find indirect causes through causal chains
     */
    findIndirectCauses(effectType) {
        const indirect = [];

        for (const chain of this.causalChains) {
            // Check if this chain ends with our effect
            const lastStep = chain.steps[chain.steps.length - 1];
            if (lastStep && lastStep.effect === effectType) {
                // Add the start of the chain as indirect cause
                const firstStep = chain.steps[0];
                if (firstStep) {
                    indirect.push({
                        cause: firstStep.cause,
                        through: chain.steps.map(s => s.effect).join(' → '),
                        steps: chain.steps.length,
                        confidence: chain.confidence || 0.6
                    });
                }
            }
        }

        return indirect;
    }

    /**
     * Find indirect effects through causal chains
     */
    findIndirectEffects(causeType) {
        const indirect = [];

        for (const chain of this.causalChains) {
            // Check if this chain starts with our cause
            const firstStep = chain.steps[0];
            if (firstStep && firstStep.cause === causeType) {
                // Add the end of the chain as indirect effect
                const lastStep = chain.steps[chain.steps.length - 1];
                if (lastStep) {
                    indirect.push({
                        effect: lastStep.effect,
                        through: chain.steps.map(s => s.cause).join(' → '),
                        steps: chain.steps.length,
                        confidence: chain.confidence || 0.6
                    });
                }
            }
        }

        return indirect;
    }

    /**
     * Simulate what would happen if we intervene
     */
    async simulateIntervention(action, context = {}) {
        console.log(`[CausalReasoning] Simulating intervention: ${action.type}`);

        // Predict direct effects
        const directEffects = await this.whatWillThisCause(action, context);

        // Predict second-order effects (effects of effects)
        const secondOrderEffects = [];
        for (const effect of directEffects.effects.slice(0, 3)) {
            const nextLevel = await this.whatWillThisCause({ type: effect.effect }, context);
            secondOrderEffects.push({
                fromEffect: effect.effect,
                effects: nextLevel.effects.slice(0, 2)
            });
        }

        // Assess overall impact
        const positiveEffects = directEffects.effects.filter(e => e.valence > 0).length;
        const negativeEffects = directEffects.effects.filter(e => e.valence < 0).length;

        let recommendation;
        if (positiveEffects > negativeEffects * 2) {
            recommendation = 'Intervention likely beneficial';
        } else if (negativeEffects > positiveEffects * 2) {
            recommendation = 'Intervention likely harmful';
        } else {
            recommendation = 'Intervention has mixed effects - proceed with caution';
        }

        return {
            action: action.type,
            directEffects: directEffects.effects,
            secondOrderEffects,
            assessment: {
                positiveEffects,
                negativeEffects,
                recommendation
            }
        };
    }

    /**
     * Learn new causal relationship
     */
    async learnCausalRelation(cause, effect, mechanism, confidence = 0.7) {
        // Add to knownCauses (effect -> causes)
        if (!this.knownCauses.has(effect)) {
            this.knownCauses.set(effect, []);
        }
        this.knownCauses.get(effect).push({ cause, mechanism, confidence });

        // Add to knownEffects (cause -> effects)
        if (!this.knownEffects.has(cause)) {
            this.knownEffects.set(cause, []);
        }
        this.knownEffects.get(cause).push({ effect, mechanism, confidence });

        console.log(`[CausalReasoning] Learned: ${cause} → ${effect}`);

        return { success: true };
    }

    /**
     * Add causal chain
     */
    async addCausalChain(chain) {
        this.causalChains.push({
            steps: chain,
            confidence: chain.reduce((product, step) =>
                product * (step.confidence || 0.7), 1.0),
            learned: Date.now()
        });

        console.log(`[CausalReasoning] Causal chain added (${chain.length} steps)`);
    }

    /**
     * Initialize with known causal patterns
     */
    initializeKnownPatterns() {
        // These complement the patterns in temporalReasoning.js
        // Here we focus on mechanism-based causation

        // Health patterns
        this.learnCausalRelation(
            'sleep-deprivation',
            'weakened-immune-system',
            'Lack of sleep reduces immune cell production',
            0.85
        );

        this.learnCausalRelation(
            'weakened-immune-system',
            'illness',
            'Reduced immune function allows pathogens to take hold',
            0.75
        );

        this.learnCausalRelation(
            'chronic-stress',
            'cortisol-elevation',
            'Stress triggers cortisol release',
            0.9
        );

        this.learnCausalRelation(
            'cortisol-elevation',
            'sleep-disruption',
            'Elevated cortisol interferes with sleep cycles',
            0.7
        );

        // Fitness patterns
        this.learnCausalRelation(
            'overtraining',
            'hrv-decline',
            'Overtraining stresses nervous system, reducing HRV',
            0.8
        );

        this.learnCausalRelation(
            'inadequate-recovery',
            'performance-plateau',
            'Without recovery, adaptations cannot occur',
            0.85
        );

        // Add causal chains
        this.addCausalChain([
            { cause: 'chronic-stress', effect: 'cortisol-elevation', confidence: 0.9 },
            { cause: 'cortisol-elevation', effect: 'sleep-disruption', confidence: 0.7 },
            { cause: 'sleep-disruption', effect: 'weakened-immune-system', confidence: 0.75 },
            { cause: 'weakened-immune-system', effect: 'illness', confidence: 0.75 }
        ]);

        console.log('[CausalReasoning] Known patterns initialized');
    }

    /**
     * Get causal knowledge summary
     */
    getSummary() {
        return {
            knownCauses: this.knownCauses.size,
            knownEffects: this.knownEffects.size,
            causalChains: this.causalChains.length
        };
    }
}

const causalReasoning = new CausalReasoning();
causalReasoning.initializeKnownPatterns();

module.exports = causalReasoning;
