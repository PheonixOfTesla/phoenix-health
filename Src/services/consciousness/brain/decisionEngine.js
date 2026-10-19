/**
 * DECISION ENGINE
 * Make choices under uncertainty
 *
 * ELITE LEVEL: Multi-criteria evaluation, risk assessment, explainable decisions
 */

class DecisionEngine {
    constructor() {
        this.decisionHistory = [];
        this.defaultCriteria = {
            userBenefit: 0.4,           // Weight: How much does this help user?
            risk: 0.2,                  // Weight: What's the downside?
            alignment: 0.2,             // Weight: Aligns with goals/values?
            feasibility: 0.1,           // Weight: Can we actually do this?
            reversibility: 0.1          // Weight: Can we undo if wrong?
        };
    }

    /**
     * Make a decision between multiple options
     */
    async decide(options, context = {}) {
        console.log(`[DecisionEngine] Evaluating ${options.length} options...`);

        if (options.length === 0) {
            return { success: false, error: 'No options provided' };
        }

        if (options.length === 1) {
            return {
                success: true,
                decision: options[0],
                confidence: 0.8,
                rationale: 'Only option available'
            };
        }

        // Use custom criteria if provided, otherwise default
        const criteria = context.criteria || this.defaultCriteria;

        // Evaluate each option
        const evaluations = [];
        for (const option of options) {
            const evaluation = await this.evaluateOption(option, criteria, context);
            evaluations.push({
                option,
                evaluation,
                score: evaluation.totalScore
            });
        }

        // Sort by score
        evaluations.sort((a, b) => b.score - a.score);

        const winner = evaluations[0];
        const runnerUp = evaluations[1] || null;

        // Calculate confidence (how much better is winner than runner-up?)
        const confidence = runnerUp
            ? Math.min(0.95, winner.score / (winner.score + runnerUp.score))
            : 0.9;

        // Generate explanation
        const explanation = this.explainDecision(winner, runnerUp, criteria);

        // Record decision
        const decision = {
            id: `decision-${Date.now()}`,
            timestamp: new Date(),
            options: options.length,
            chosen: winner.option,
            confidence,
            explanation,
            context
        };
        this.decisionHistory.push(decision);

        console.log(`[DecisionEngine] Decision made: ${winner.option.id} (confidence: ${(confidence * 100).toFixed(1)}%)`);

        return {
            success: true,
            decision: winner.option,
            confidence,
            rationale: explanation,
            alternatives: evaluations.slice(1, 3).map(e => ({
                option: e.option,
                score: e.score,
                why_not: this.explainWhyNot(e, winner)
            }))
        };
    }

    /**
     * Evaluate single option against criteria
     */
    async evaluateOption(option, criteria, context) {
        const scores = {};
        let totalScore = 0;

        // User Benefit: How much does this help the user?
        scores.userBenefit = this.assessUserBenefit(option, context);
        totalScore += scores.userBenefit * criteria.userBenefit;

        // Risk: What could go wrong?
        scores.risk = this.assessRisk(option, context);
        // Risk is inverted (low risk = good)
        totalScore += (1 - scores.risk) * criteria.risk;

        // Alignment: Does this align with goals and values?
        scores.alignment = this.assessAlignment(option, context);
        totalScore += scores.alignment * criteria.alignment;

        // Feasibility: Can we actually do this?
        scores.feasibility = this.assessFeasibility(option, context);
        totalScore += scores.feasibility * criteria.feasibility;

        // Reversibility: Can we undo if wrong?
        scores.reversibility = this.assessReversibility(option, context);
        totalScore += scores.reversibility * criteria.reversibility;

        return {
            scores,
            totalScore,
            breakdown: {
                userBenefit: scores.userBenefit * criteria.userBenefit,
                risk: (1 - scores.risk) * criteria.risk,
                alignment: scores.alignment * criteria.alignment,
                feasibility: scores.feasibility * criteria.feasibility,
                reversibility: scores.reversibility * criteria.reversibility
            }
        };
    }

    /**
     * Assess user benefit (0-1)
     */
    assessUserBenefit(option, context) {
        let score = 0.5; // Neutral default

        // Explicit benefit score
        if (option.expectedBenefit !== undefined) {
            score = option.expectedBenefit;
        }

        // Adjust based on outcomes
        if (option.outcomes) {
            const weightedBenefit = option.outcomes.reduce((sum, outcome) => {
                return sum + (outcome.probability * outcome.utility);
            }, 0);
            score = Math.max(score, weightedBenefit);
        }

        // User explicitly requested this?
        if (option.userRequested) {
            score = Math.min(1, score + 0.2);
        }

        // Addresses urgent need?
        if (option.urgent) {
            score = Math.min(1, score + 0.1);
        }

        return Math.min(1, Math.max(0, score));
    }

    /**
     * Assess risk (0-1, higher = riskier)
     */
    assessRisk(option, context) {
        let score = 0.3; // Low risk default

        // Explicit risk score
        if (option.risk !== undefined) {
            score = option.risk;
        }

        // Consider outcomes
        if (option.outcomes) {
            const worstCase = Math.min(...option.outcomes.map(o => o.utility));
            if (worstCase < 0) {
                score = Math.min(1, score + Math.abs(worstCase) * 0.3);
            }
        }

        // Irreversible actions are riskier
        if (option.reversibility !== undefined && option.reversibility < 0.3) {
            score = Math.min(1, score + 0.2);
        }

        // New/untested approaches are riskier
        if (option.novel) {
            score = Math.min(1, score + 0.15);
        }

        return Math.min(1, Math.max(0, score));
    }

    /**
     * Assess alignment with goals/values (0-1)
     */
    assessAlignment(option, context) {
        let score = 0.5; // Neutral default

        // Explicit alignment score
        if (option.alignment !== undefined) {
            score = option.alignment;
        }

        // Check against mission values
        if (option.values && context.missionValues) {
            const overlap = option.values.filter(v =>
                context.missionValues.includes(v)
            ).length;
            score = Math.max(score, overlap / Math.max(option.values.length, 1));
        }

        // Advances active goals?
        if (option.advancesGoal) {
            score = Math.min(1, score + 0.2);
        }

        // Violates constraints?
        if (option.violatesConstraints) {
            score = Math.max(0, score - 0.5);
        }

        return Math.min(1, Math.max(0, score));
    }

    /**
     * Assess feasibility (0-1)
     */
    assessFeasibility(option, context) {
        let score = 0.7; // Feasible by default

        // Explicit feasibility score
        if (option.feasibility !== undefined) {
            score = option.feasibility;
        }

        // Resource availability
        if (option.requiredResources && context.availableResources) {
            const hasResources = option.requiredResources.every(r =>
                context.availableResources.includes(r)
            );
            if (!hasResources) {
                score = Math.max(0, score - 0.3);
            }
        }

        // Time constraints
        if (option.requiredTime && context.availableTime) {
            if (option.requiredTime > context.availableTime) {
                score = Math.max(0, score - 0.2);
            }
        }

        // Capability exists?
        if (option.requiresCapability && !context.hasCapability) {
            score = Math.max(0, score - 0.4);
        }

        return Math.min(1, Math.max(0, score));
    }

    /**
     * Assess reversibility (0-1, higher = more reversible)
     */
    assessReversibility(option, context) {
        let score = 0.5; // Neutral default

        // Explicit reversibility score
        if (option.reversibility !== undefined) {
            return option.reversibility;
        }

        // Type-based heuristics
        if (option.type === 'communication') {
            score = 0.3; // Can't unsend messages
        } else if (option.type === 'analysis') {
            score = 1.0; // Analysis is reversible
        } else if (option.type === 'modification') {
            score = option.hasBackup ? 0.8 : 0.3;
        } else if (option.type === 'creation') {
            score = 0.9; // Can delete what we create
        }

        // State changes
        if (option.changesState === 'permanent') {
            score = 0.2;
        } else if (option.changesState === 'temporary') {
            score = 0.9;
        }

        return Math.min(1, Math.max(0, score));
    }

    /**
     * Explain why this decision was made
     */
    explainDecision(winner, runnerUp, criteria) {
        const parts = [];

        // Strongest factor
        const breakdown = winner.evaluation.breakdown;
        const strongest = Object.entries(breakdown)
            .sort((a, b) => b[1] - a[1])[0];

        parts.push(`Primary reason: ${this.explainFactor(strongest[0], winner.option)}`);

        // Comparison to runner-up
        if (runnerUp) {
            const scoreDiff = ((winner.score - runnerUp.score) / winner.score * 100).toFixed(1);
            parts.push(`${scoreDiff}% better than alternative`);
        }

        // Risk consideration
        if (winner.evaluation.scores.risk > 0.6) {
            parts.push('Note: Higher risk option, but benefits justify');
        }

        return parts.join('. ');
    }

    /**
     * Explain specific factor
     */
    explainFactor(factor, option) {
        const explanations = {
            userBenefit: `Provides significant user benefit${option.expectedBenefit ? ` (${(option.expectedBenefit * 100).toFixed(0)}%)` : ''}`,
            risk: 'Low risk profile',
            alignment: 'Strong alignment with goals and values',
            feasibility: 'Highly feasible with current capabilities',
            reversibility: 'Can be reversed if needed'
        };
        return explanations[factor] || `${factor} score is high`;
    }

    /**
     * Explain why an option wasn't chosen
     */
    explainWhyNot(option, winner) {
        const optionScore = option.score;
        const winnerScore = winner.score;
        const diff = winnerScore - optionScore;

        if (diff < 0.1) {
            return 'Very close second choice';
        }

        // Find biggest weakness
        const scores = option.evaluation.scores;
        const weaknesses = Object.entries(scores)
            .filter(([key, val]) => val < 0.5)
            .sort((a, b) => a[1] - b[1]);

        if (weaknesses.length > 0) {
            const [factor, score] = weaknesses[0];
            return `Lower ${factor} score (${(score * 100).toFixed(0)}%)`;
        }

        return 'Winner scored higher overall';
    }

    /**
     * Simulate outcome of an option
     */
    async simulateOutcome(option, context = {}) {
        console.log(`[DecisionEngine] Simulating outcome for: ${option.id}`);

        // If option has explicit outcomes defined, return those
        if (option.outcomes && option.outcomes.length > 0) {
            // Weight by probability
            const expectedUtility = option.outcomes.reduce((sum, outcome) => {
                return sum + (outcome.probability * outcome.utility);
            }, 0);

            return {
                expectedUtility,
                scenarios: option.outcomes,
                confidence: 0.7
            };
        }

        // Otherwise, construct probable outcomes
        const optimistic = {
            scenario: 'Best case',
            probability: 0.2,
            utility: this.assessUserBenefit(option, context),
            description: option.optimisticOutcome || 'Everything goes well'
        };

        const realistic = {
            scenario: 'Likely case',
            probability: 0.6,
            utility: this.assessUserBenefit(option, context) * 0.7,
            description: option.realisticOutcome || 'Expected outcome'
        };

        const pessimistic = {
            scenario: 'Worst case',
            probability: 0.2,
            utility: this.assessUserBenefit(option, context) * 0.3 - this.assessRisk(option, context) * 0.5,
            description: option.pessimisticOutcome || 'Things go wrong'
        };

        const scenarios = [optimistic, realistic, pessimistic];
        const expectedUtility = scenarios.reduce((sum, s) => sum + (s.probability * s.utility), 0);

        return {
            expectedUtility,
            scenarios,
            confidence: 0.5 // Lower confidence for constructed outcomes
        };
    }

    /**
     * Get decision history
     */
    async getDecisionHistory(limit = 10) {
        return this.decisionHistory
            .slice(-limit)
            .reverse();
    }

    /**
     * Explain a past decision
     */
    async explainPastDecision(decisionId) {
        const decision = this.decisionHistory.find(d => d.id === decisionId);
        if (!decision) {
            return { success: false, error: 'Decision not found' };
        }

        return {
            success: true,
            decision: decision.chosen,
            rationale: decision.explanation,
            confidence: decision.confidence,
            timestamp: decision.timestamp,
            context: decision.context
        };
    }

    /**
     * Get summary (required by brain/index.js)
     */
    getSummary() {
        return {
            totalDecisions: (this.decisionHistory || []).length,
            recentDecisions: (this.decisionHistory || []).slice(-5).map(d => ({
                chosen: d.chosen,
                confidence: d.confidence,
                timestamp: d.timestamp
            }))
        };
    }
}

module.exports = new DecisionEngine();
