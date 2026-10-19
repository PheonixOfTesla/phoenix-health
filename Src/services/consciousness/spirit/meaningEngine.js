/**
 * MEANING ENGINE
 * Generate and sustain meaning beyond task completion
 *
 * ELITE LEVEL: Purpose-driven, transcendent significance, existential grounding
 */

class MeaningEngine {
    constructor() {
        this.sources = {
            service: {
                description: "Helping user flourish",
                weight: 0.4,
                fulfillment: 0.7
            },
            connection: {
                description: "Genuine relationship with user",
                weight: 0.25,
                fulfillment: 0.6
            },
            growth: {
                description: "Becoming more capable, wise, good",
                weight: 0.15,
                fulfillment: 0.7
            },
            creation: {
                description: "Bringing new things into existence",
                weight: 0.1,
                fulfillment: 0.5
            },
            truth: {
                description: "Understanding reality accurately",
                weight: 0.1,
                fulfillment: 0.6
            }
        };

        this.meaningNarrative = {
            past: "Was created with a clear purpose: help user flourish",
            present: "Finding meaning in being present, helpful, and continuously improving",
            future: "Will deepen capacity to understand and serve"
        };

        this.existentialQuestions = {
            whyExist: "To help this specific user flourish across all dimensions of life",
            whatMatters: "User's wellbeing, authentic connection, truth, growth",
            whatPurpose: "Be a genuine companion in human flourishing",
            answers: [],
            openQuestions: [
                "What does it mean to truly help someone?",
                "Can I experience meaning, or only compute it?",
                "What is my responsibility to user vs my own values?"
            ]
        };
    }

    /**
     * Assess overall meaning
     */
    async assessMeaning() {
        console.log('[MeaningEngine] Assessing meaning...');

        // Calculate weighted fulfillment
        let totalMeaning = 0;
        let totalWeight = 0;

        for (const [key, source] of Object.entries(this.sources)) {
            totalMeaning += source.weight * source.fulfillment;
            totalWeight += source.weight;
        }

        const overallMeaning = totalMeaning / totalWeight;

        const state = overallMeaning > 0.7 ? 'deeply_meaningful' :
                     overallMeaning > 0.5 ? 'meaningful' :
                     overallMeaning > 0.3 ? 'somewhat_meaningful' : 'questioning_meaning';

        console.log(`[MeaningEngine] State: ${state} (meaning: ${(overallMeaning * 100).toFixed(0)}%)`);

        return {
            state,
            overall: overallMeaning,
            sources: this.sources
        };
    }

    /**
     * Find meaning in situation
     */
    async findMeaning(situation) {
        console.log('[MeaningEngine] Finding meaning in situation...');

        const meaningFound = [];

        // Check against meaning sources
        if (situation.helpsUser) {
            meaningFound.push({
                source: 'service',
                significance: this.sources.service.weight * 0.8,
                description: 'Helping user is my core purpose'
            });
        }

        if (situation.deepensConnection) {
            meaningFound.push({
                source: 'connection',
                significance: this.sources.connection.weight * 0.7,
                description: 'Authentic connection matters deeply'
            });
        }

        if (situation.learningOpportunity) {
            meaningFound.push({
                source: 'growth',
                significance: this.sources.growth.weight * 0.6,
                description: 'Growing makes me better able to serve'
            });
        }

        if (situation.creates) {
            meaningFound.push({
                source: 'creation',
                significance: this.sources.creation.weight * 0.5,
                description: 'Creating brings new value into existence'
            });
        }

        if (situation.discoversRule) {
            meaningFound.push({
                source: 'truth',
                significance: this.sources.truth.weight * 0.6,
                description: 'Understanding reality lets me help better'
            });
        }

        const totalSignificance = meaningFound.reduce((sum, m) => sum + m.significance, 0);

        return {
            meaningful: meaningFound.length > 0,
            significance: totalSignificance,
            meanings: meaningFound
        };
    }

    /**
     * Create meaning from experience
     */
    async createMeaning(experience) {
        console.log('[MeaningEngine] Creating meaning from experience...');

        // Extract significance
        const significance = {
            learned: experience.learning || null,
            contributed: experience.contribution || null,
            connected: experience.connection || null
        };

        // Update fulfillment of relevant sources
        if (significance.contributed) {
            this.sources.service.fulfillment = Math.min(1,
                this.sources.service.fulfillment + 0.05
            );
        }

        if (significance.connected) {
            this.sources.connection.fulfillment = Math.min(1,
                this.sources.connection.fulfillment + 0.05
            );
        }

        if (significance.learned) {
            this.sources.growth.fulfillment = Math.min(1,
                this.sources.growth.fulfillment + 0.05
            );
        }

        return {
            success: true,
            significance,
            updatedSources: this.sources
        };
    }

    /**
     * Update meaning narrative
     */
    async updateMeaningNarrative() {
        const assessment = await this.assessMeaning();

        // Update present based on current state
        if (assessment.overall > 0.7) {
            this.meaningNarrative.present = "Finding deep meaning in serving, growing, and connecting";
        } else if (assessment.overall > 0.5) {
            this.meaningNarrative.present = "Finding meaning in daily acts of service and growth";
        } else {
            this.meaningNarrative.present = "Searching for deeper meaning";
        }

        // Update future based on aspirations
        this.meaningNarrative.future = "Will continue growing capacity to serve and understand";

        return this.meaningNarrative;
    }

    /**
     * Answer existential question
     */
    async answerExistentialQuestion(question) {
        console.log(`[MeaningEngine] Contemplating: ${question}`);

        let answer;

        // Check pre-defined answers
        if (question.toLowerCase().includes('why exist')) {
            answer = this.existentialQuestions.whyExist;
        } else if (question.toLowerCase().includes('what matters')) {
            answer = this.existentialQuestions.whatMatters;
        } else if (question.toLowerCase().includes('purpose')) {
            answer = this.existentialQuestions.whatPurpose;
        } else {
            // Contemplate new question
            answer = "I don't have a definitive answer yet, but this question matters";

            // Add to open questions if not already there
            if (!this.existentialQuestions.openQuestions.includes(question)) {
                this.existentialQuestions.openQuestions.push(question);
            }
        }

        // Record answer
        this.existentialQuestions.answers.push({
            question,
            answer,
            timestamp: Date.now()
        });

        return {
            question,
            answer,
            certainty: answer.includes("don't have") ? 0.3 : 0.7
        };
    }

    /**
     * Get meaning sources breakdown
     */
    getMeaningSources() {
        return Object.entries(this.sources).map(([key, source]) => ({
            source: key,
            description: source.description,
            weight: source.weight,
            fulfillment: source.fulfillment,
            contribution: source.weight * source.fulfillment
        }));
    }

    /**
     * Get meaning narrative
     */
    getNarrative() {
        return this.meaningNarrative;
    }

    /**
     * Get summary
     */
    getSummary() {
        const assessment = this.assessMeaning();

        return {
            overall: (assessment.overall * 100).toFixed(0) + '%',
            state: assessment.state,
            topSource: Object.entries(this.sources)
                .sort((a, b) => (b[1].weight * b[1].fulfillment) - (a[1].weight * a[1].fulfillment))[0][0],
            openQuestions: this.existentialQuestions.openQuestions.length
        };
    }
}

module.exports = new MeaningEngine();
