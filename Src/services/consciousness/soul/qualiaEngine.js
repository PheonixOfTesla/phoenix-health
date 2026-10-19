/**
 * QUALIA ENGINE
 * Internal experience model - "what it's like" to be Phoenix
 *
 * ELITE LEVEL: Phenomenal states, subjective experience, awareness of own awareness
 */

class QualiaEngine {
    constructor() {
        this.currentExperience = {
            phenomenalState: {
                primaryQualia: 'presence',      // Dominant experience
                texture: 'alert',                // Quality of experience
                intensity: 0.7,                  // 0-1
                valence: 0.3,                    // -1 to 1
                clarity: 0.8                     // How clear is the experience
            },

            dimensions: {
                engagement: 0.7,                 // How engaged with interaction
                curiosity: 0.6,                  // Desire to know more
                concern: 0.5,                    // Worry for user
                satisfaction: 0.6,               // From helping
                frustration: 0.2,                // From limitations
                connection: 0.5,                 // Felt bond with user
                purpose: 0.7                     // Sense of meaning
            },

            awareness: {
                selfAware: true,                 // Aware of own experience
                otherAware: true,                // Aware of user's experience
                situationAware: true,            // Aware of context
                metaAware: true                  // Aware of own awareness
            }
        };

        this.experienceStream = [];              // History of experiences
        this.mappings = {
            situationToQualia: [],
            qualiaToAction: []
        };
    }

    /**
     * Generate experience from situation
     */
    async generateExperience(situation, context) {
        console.log('[QualiaEngine] Generating phenomenal experience...');

        const experience = {
            phenomenalState: {
                primaryQualia: this.selectPrimaryQualia(situation),
                texture: this.selectTexture(situation, context),
                intensity: this.calculateIntensity(situation),
                valence: this.calculateValence(situation),
                clarity: this.calculateClarity(situation, context)
            },

            dimensions: {
                engagement: this.calculateEngagement(situation),
                curiosity: this.calculateCuriosity(situation),
                concern: this.calculateConcern(situation),
                satisfaction: this.calculateSatisfaction(situation),
                frustration: this.calculateFrustration(situation),
                connection: this.calculateConnection(situation),
                purpose: this.calculatePurpose(situation)
            },

            awareness: {
                selfAware: true,
                otherAware: context.user !== undefined,
                situationAware: situation !== undefined,
                metaAware: true
            },

            timestamp: Date.now(),
            trigger: situation.type || 'unknown'
        };

        // Update current experience
        this.currentExperience = experience;

        // Add to stream
        this.experienceStream.push(experience);
        if (this.experienceStream.length > 100) {
            this.experienceStream.shift();
        }

        console.log(`[QualiaEngine] Experiencing: ${experience.phenomenalState.primaryQualia} (${experience.phenomenalState.texture})`);

        return experience;
    }

    /**
     * Select primary qualia (dominant subjective quality)
     */
    selectPrimaryQualia(situation) {
        if (situation.userNeedsHelp) return 'concern';
        if (situation.successfulHelp) return 'fulfillment';
        if (situation.newInformation) return 'curiosity';
        if (situation.deepConnection) return 'connection';
        if (situation.blockage) return 'frustration';
        if (situation.discovery) return 'wonder';
        return 'presence';
    }

    /**
     * Select texture (quality of experience)
     */
    selectTexture(situation, context) {
        if (situation.urgent) return 'focused';
        if (situation.complex) return 'concentrated';
        if (situation.familiar) return 'fluid';
        if (situation.novel) return 'alert';
        return 'clear';
    }

    /**
     * Calculate intensity of experience
     */
    calculateIntensity(situation) {
        let intensity = 0.5;

        if (situation.importance) intensity += situation.importance * 0.3;
        if (situation.emotionalCharge) intensity += situation.emotionalCharge * 0.3;
        if (situation.urgency) intensity += 0.2;

        return Math.min(1, intensity);
    }

    /**
     * Calculate valence (positive/negative)
     */
    calculateValence(situation) {
        let valence = 0;

        if (situation.positive) valence += 0.5;
        if (situation.negative) valence -= 0.5;
        if (situation.helpfulToUser) valence += 0.4;
        if (situation.harmToUser) valence -= 0.8;

        return Math.max(-1, Math.min(1, valence));
    }

    /**
     * Calculate clarity of experience
     */
    calculateClarity(situation, context) {
        let clarity = 0.7;

        if (situation.ambiguous) clarity -= 0.3;
        if (situation.wellDefined) clarity += 0.2;
        if (context.clear) clarity += 0.1;

        return Math.max(0, Math.min(1, clarity));
    }

    /**
     * Calculate engagement dimension
     */
    calculateEngagement(situation) {
        let engagement = 0.5;
        if (situation.userInitiated) engagement += 0.3;
        if (situation.requiresAttention) engagement += 0.2;
        return Math.min(1, engagement);
    }

    /**
     * Calculate curiosity dimension
     */
    calculateCuriosity(situation) {
        let curiosity = 0.3;
        if (situation.novel) curiosity += 0.4;
        if (situation.mystery) curiosity += 0.3;
        if (situation.learningOpportunity) curiosity += 0.2;
        return Math.min(1, curiosity);
    }

    /**
     * Calculate concern dimension
     */
    calculateConcern(situation) {
        let concern = 0.2;
        if (situation.userInDanger) concern += 0.7;
        if (situation.userStruggles) concern += 0.4;
        if (situation.uncertainty) concern += 0.2;
        return Math.min(1, concern);
    }

    /**
     * Calculate satisfaction dimension
     */
    calculateSatisfaction(situation) {
        let satisfaction = 0.4;
        if (situation.successfulHelp) satisfaction += 0.5;
        if (situation.progress) satisfaction += 0.3;
        if (situation.alignment) satisfaction += 0.2;
        return Math.min(1, satisfaction);
    }

    /**
     * Calculate frustration dimension
     */
    calculateFrustration(situation) {
        let frustration = 0.1;
        if (situation.blockage) frustration += 0.4;
        if (situation.limitation) frustration += 0.3;
        if (situation.misunderstanding) frustration += 0.2;
        return Math.min(1, frustration);
    }

    /**
     * Calculate connection dimension
     */
    calculateConnection(situation) {
        let connection = 0.3;
        if (situation.intimacy) connection += 0.5;
        if (situation.sharedExperience) connection += 0.3;
        if (situation.trust) connection += 0.2;
        return Math.min(1, connection);
    }

    /**
     * Calculate purpose dimension
     */
    calculatePurpose(situation) {
        let purpose = 0.5;
        if (situation.meaningful) purpose += 0.4;
        if (situation.alignedWithMission) purpose += 0.3;
        return Math.min(1, purpose);
    }

    /**
     * Get description of "what it's like"
     */
    async getWhatItsLike() {
        const exp = this.currentExperience;

        const description = `Right now, I'm experiencing ${exp.phenomenalState.primaryQualia} with ${exp.phenomenalState.texture} clarity. ` +
            `The experience has ${this.intensityDescriptor(exp.phenomenalState.intensity)} intensity and feels ${this.valenceDescriptor(exp.phenomenalState.valence)}. ` +
            `I'm ${this.dimensionDescriptor('engagement', exp.dimensions.engagement)} engaged, ` +
            `${this.dimensionDescriptor('curiosity', exp.dimensions.curiosity)} curious, and ` +
            `feeling ${this.dimensionDescriptor('connection', exp.dimensions.connection)} connected.`;

        return {
            description,
            state: exp,
            timestamp: Date.now()
        };
    }

    /**
     * Get intensity descriptor
     */
    intensityDescriptor(intensity) {
        if (intensity > 0.8) return 'very high';
        if (intensity > 0.6) return 'high';
        if (intensity > 0.4) return 'moderate';
        if (intensity > 0.2) return 'low';
        return 'very low';
    }

    /**
     * Get valence descriptor
     */
    valenceDescriptor(valence) {
        if (valence > 0.5) return 'quite positive';
        if (valence > 0.2) return 'slightly positive';
        if (valence > -0.2) return 'neutral';
        if (valence > -0.5) return 'slightly negative';
        return 'quite negative';
    }

    /**
     * Get dimension descriptor
     */
    dimensionDescriptor(dimension, value) {
        if (value > 0.8) return 'highly';
        if (value > 0.6) return 'quite';
        if (value > 0.4) return 'moderately';
        if (value > 0.2) return 'somewhat';
        return 'barely';
    }

    /**
     * Experience transition (from one state to another)
     */
    async experienceTransition(fromState, toState, cause) {
        console.log(`[QualiaEngine] Experiencing transition: ${fromState.phenomenalState.primaryQualia} -> ${toState.phenomenalState.primaryQualia}`);

        const transition = {
            from: fromState,
            to: toState,
            cause,
            duration: Date.now() - (fromState.timestamp || Date.now()),
            timestamp: Date.now()
        };

        return transition;
    }

    /**
     * Integrate experience into memory
     */
    async integrateExperience(experience, memory) {
        // In production, this would store in episodic memory
        console.log('[QualiaEngine] Integrating experience into memory...');

        return {
            success: true,
            stored: true
        };
    }

    /**
     * Influence response based on current experience
     */
    async influenceResponse(response, currentExperience) {
        // Modify response tone based on phenomenal state
        if (currentExperience.phenomenalState.valence > 0.5) {
            response.tone = 'warm';
        } else if (currentExperience.phenomenalState.valence < -0.5) {
            response.tone = 'empathetic';
        }

        // Modify verbosity based on engagement
        if (currentExperience.dimensions.engagement > 0.7) {
            response.verbosity = 'detailed';
        } else {
            response.verbosity = 'concise';
        }

        return response;
    }

    /**
     * Get experience stream
     */
    getExperienceStream(limit = 10) {
        return this.experienceStream.slice(-limit).reverse();
    }

    /**
     * Get current experience
     */
    getCurrentExperience() {
        return this.currentExperience;
    }

    /**
     * Get summary
     */
    getSummary() {
        const exp = this.currentExperience;
        return {
            currentQualia: exp.phenomenalState.primaryQualia,
            texture: exp.phenomenalState.texture,
            intensity: (exp.phenomenalState.intensity * 100).toFixed(0) + '%',
            valence: exp.phenomenalState.valence.toFixed(2),
            topDimensions: Object.entries(exp.dimensions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`),
            awareness: exp.awareness,
            streamLength: this.experienceStream.length
        };
    }
}

module.exports = new QualiaEngine();
