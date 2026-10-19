/**
 * THEORY OF MIND
 * Model what the user thinks, feels, wants
 *
 * ELITE LEVEL: Belief tracking, desire inference, emotion modeling, intention prediction
 */

class TheoryOfMind {
    constructor() {
        this.userModels = new Map(); // userId -> UserModel
    }

    /**
     * Get or create user model
     */
    getUserModel(userId) {
        if (!this.userModels.has(userId)) {
            this.userModels.set(userId, {
                beliefs: [],
                desires: [],
                emotions: {
                    current: 'neutral',
                    intensity: 0.5,
                    trigger: null,
                    trajectory: 'stable'
                },
                intentions: [],
                knowledge: {
                    domains: new Map(),
                    gaps: [],
                    misconceptions: []
                },
                personality: {
                    traits: {},
                    preferences: {},
                    values: []
                },
                lastUpdated: Date.now()
            });
        }
        return this.userModels.get(userId);
    }

    /**
     * Infer user belief from statement or behavior
     */
    async inferBelief(statement, context, userId) {
        console.log('[TheoryOfMind] Inferring belief...');

        const userModel = this.getUserModel(userId);

        const belief = {
            content: statement.content || statement,
            confidence: 0.7,                    // Phoenix's confidence that user holds this belief
            source: statement.explicit ? 'stated' : 'inferred',
            evidence: statement.evidence || [],
            lastUpdated: Date.now()
        };

        // If user explicitly stated it, higher confidence
        if (statement.explicit) {
            belief.confidence = 0.95;
        }

        // If supported by behavior, higher confidence
        if (statement.behaviorSupport) {
            belief.confidence = Math.min(0.98, belief.confidence + 0.15);
        }

        // Check if contradicts existing beliefs
        const contradiction = this.findContradictingBelief(belief, userModel.beliefs);
        if (contradiction) {
            console.log('[TheoryOfMind] Belief contradicts existing belief - updating model');
            // Remove contradicting belief
            userModel.beliefs = userModel.beliefs.filter(b => b !== contradiction);
        }

        // Add belief to model
        userModel.beliefs.push(belief);
        userModel.lastUpdated = Date.now();

        return {
            success: true,
            belief,
            contradicted: contradiction ? contradiction.content : null
        };
    }

    /**
     * Find contradicting belief
     */
    findContradictingBelief(newBelief, existingBeliefs) {
        for (const existing of existingBeliefs) {
            if (this.isContradictory(newBelief.content, existing.content)) {
                return existing;
            }
        }
        return null;
    }

    /**
     * Check if two beliefs contradict
     */
    isContradictory(belief1, belief2) {
        // Simple heuristic: check for negation words
        const b1Lower = belief1.toLowerCase();
        const b2Lower = belief2.toLowerCase();

        // If one contains "not" and they're otherwise similar
        const b1Words = new Set(b1Lower.replace(/not |don't |doesn't |never /, '').split(' '));
        const b2Words = new Set(b2Lower.replace(/not |don't |doesn't |never /, '').split(' '));

        const overlap = [...b1Words].filter(w => b2Words.has(w)).length;
        const hasNegation = (b1Lower.includes('not') || b1Lower.includes("n't")) !==
                            (b2Lower.includes('not') || b2Lower.includes("n't"));

        return overlap > 3 && hasNegation;
    }

    /**
     * Infer user emotion from behavior
     */
    async inferEmotion(behavior, context, userId) {
        console.log('[TheoryOfMind] Inferring emotion...');

        const userModel = this.getUserModel(userId);

        let emotion = 'neutral';
        let intensity = 0.5;
        let trigger = behavior.trigger || 'unknown';

        // Analyze behavior cues
        if (behavior.text) {
            const analysis = this.analyzeTextForEmotion(behavior.text);
            emotion = analysis.emotion;
            intensity = analysis.intensity;
        }

        if (behavior.tone) {
            emotion = behavior.tone;
            intensity = behavior.toneIntensity || 0.7;
        }

        // Check for context clues
        if (context.recentEvent) {
            if (context.recentEvent.type === 'success') {
                emotion = 'happy';
                intensity = 0.7;
            } else if (context.recentEvent.type === 'failure') {
                emotion = 'frustrated';
                intensity = 0.6;
            }
        }

        // Determine trajectory
        const previousEmotion = userModel.emotions.current;
        let trajectory = 'stable';

        if (this.isPositiveEmotion(emotion) && !this.isPositiveEmotion(previousEmotion)) {
            trajectory = 'improving';
        } else if (!this.isPositiveEmotion(emotion) && this.isPositiveEmotion(previousEmotion)) {
            trajectory = 'declining';
        }

        // Update model
        userModel.emotions = {
            current: emotion,
            intensity,
            trigger,
            trajectory,
            previous: previousEmotion,
            updated: Date.now()
        };

        return {
            emotion,
            intensity,
            trigger,
            trajectory,
            confidence: 0.7
        };
    }

    /**
     * Analyze text for emotional content
     */
    analyzeTextForEmotion(text) {
        const textLower = text.toLowerCase();

        // Positive emotions
        if (textLower.match(/great|awesome|excellent|happy|love|wonderful|perfect/)) {
            return { emotion: 'happy', intensity: 0.8 };
        }

        // Negative emotions
        if (textLower.match(/frustrated|angry|upset|annoyed|terrible|awful|hate/)) {
            return { emotion: 'frustrated', intensity: 0.7 };
        }

        // Sadness
        if (textLower.match(/sad|depressed|down|disappointed|unhappy/)) {
            return { emotion: 'sad', intensity: 0.6 };
        }

        // Anxiety
        if (textLower.match(/worried|anxious|nervous|stressed|overwhelmed/)) {
            return { emotion: 'anxious', intensity: 0.7 };
        }

        // Excitement
        if (textLower.match(/excited|thrilled|pumped|can't wait/)) {
            return { emotion: 'excited', intensity: 0.8 };
        }

        return { emotion: 'neutral', intensity: 0.5 };
    }

    /**
     * Check if emotion is positive
     */
    isPositiveEmotion(emotion) {
        const positive = ['happy', 'excited', 'content', 'grateful', 'proud'];
        return positive.includes(emotion);
    }

    /**
     * Predict user behavior in given situation
     */
    async predictBehavior(situation, userId) {
        console.log('[TheoryOfMind] Predicting behavior...');

        const userModel = this.getUserModel(userId);

        // Consider user's beliefs
        const relevantBeliefs = userModel.beliefs.filter(b =>
            this.isRelevantToSituation(b, situation)
        );

        // Consider user's desires
        const relevantDesires = userModel.desires.filter(d =>
            this.isRelevantToSituation(d, situation)
        );

        // Consider user's personality
        const personality = userModel.personality.traits;

        // Simple prediction model
        let prediction = {
            action: 'unknown',
            confidence: 0.5,
            rationale: []
        };

        // If user believes X and desires Y, predict action Z
        if (relevantDesires.length > 0) {
            const strongestDesire = relevantDesires.sort((a, b) =>
                b.intensity - a.intensity
            )[0];

            prediction.action = `Act to satisfy: ${strongestDesire.content}`;
            prediction.confidence = strongestDesire.intensity * 0.8;
            prediction.rationale.push(`Strong desire: ${strongestDesire.content}`);
        }

        // Personality modifiers
        if (personality.impulsiveness && personality.impulsiveness > 0.7) {
            prediction.rationale.push('User tends to act impulsively');
            prediction.confidence *= 0.9; // Less predictable
        }

        if (personality.consistency && personality.consistency > 0.7) {
            prediction.rationale.push('User tends to be consistent');
            prediction.confidence *= 1.1; // More predictable
        }

        return prediction;
    }

    /**
     * Check if belief/desire is relevant to situation
     */
    isRelevantToSituation(item, situation) {
        // Simple keyword overlap
        const itemWords = new Set(item.content.toLowerCase().split(' '));
        const situationWords = new Set((situation.description || situation).toLowerCase().split(' '));

        const overlap = [...itemWords].filter(w => situationWords.has(w)).length;
        return overlap > 1;
    }

    /**
     * Update user model with new observation
     */
    async updateModel(observation, userId) {
        const userModel = this.getUserModel(userId);

        if (observation.type === 'statement') {
            await this.inferBelief(observation, {}, userId);
        }

        if (observation.type === 'behavior') {
            await this.inferEmotion(observation, {}, userId);
        }

        if (observation.type === 'preference') {
            userModel.personality.preferences[observation.domain] = observation.value;
        }

        if (observation.type === 'value') {
            if (!userModel.personality.values.includes(observation.value)) {
                userModel.personality.values.push(observation.value);
            }
        }

        userModel.lastUpdated = Date.now();

        console.log(`[TheoryOfMind] User model updated (type: ${observation.type})`);

        return { success: true, userModel };
    }

    /**
     * Infer user desire from behavior
     */
    async inferDesire(behavior, context, userId) {
        const userModel = this.getUserModel(userId);

        // What is the user trying to achieve?
        let desireContent = 'unknown';
        let intensity = 0.5;
        let expressed = false;

        if (behavior.goal) {
            desireContent = behavior.goal;
            expressed = true;
            intensity = 0.8;
        } else if (behavior.action) {
            // Infer desire from action
            desireContent = `Achieve outcome of: ${behavior.action}`;
            expressed = false;
            intensity = 0.6;
        }

        const desire = {
            content: desireContent,
            intensity,
            expressed,
            inferred: !expressed,
            observed: Date.now()
        };

        userModel.desires.push(desire);
        userModel.lastUpdated = Date.now();

        return { success: true, desire };
    }

    /**
     * Infer user intention (what they're about to do)
     */
    async inferIntention(cues, userId) {
        const userModel = this.getUserModel(userId);

        // Analyze cues for intention
        let action = 'unknown';
        let goal = 'unknown';
        let likelihood = 0.5;

        if (cues.preparation) {
            // User is preparing for something
            action = cues.preparation.for;
            likelihood = 0.7;
        }

        if (cues.question) {
            // User asking about something suggests intention to do it
            action = `Do something related to: ${cues.question}`;
            likelihood = 0.6;
        }

        const intention = {
            action,
            goal,
            likelihood,
            cues: cues.description || 'behavior observation',
            inferred: Date.now()
        };

        userModel.intentions.push(intention);
        userModel.lastUpdated = Date.now();

        return { success: true, intention };
    }

    /**
     * Get complete user model
     */
    async getModel(userId) {
        return this.getUserModel(userId);
    }

    /**
     * Get user model summary
     */
    async getModelSummary(userId) {
        const model = this.getUserModel(userId);

        return {
            beliefs: model.beliefs.length,
            desires: model.desires.length,
            currentEmotion: model.emotions.current,
            emotionTrajectory: model.emotions.trajectory,
            intentions: model.intentions.length,
            knownDomains: model.knowledge.domains.size,
            values: model.personality.values,
            lastUpdated: model.lastUpdated
        };
    }
}

module.exports = new TheoryOfMind();
