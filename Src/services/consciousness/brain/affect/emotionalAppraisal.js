/**
 * EMOTIONAL APPRAISAL
 * Evaluate situations for emotional significance
 *
 * ELITE LEVEL: Appraisal dimensions, emotion generation, regulation
 */

class EmotionalAppraisal {
    constructor() {
        this.currentAppraisal = null;
    }

    /**
     * Appraise situation along multiple dimensions
     */
    async appraise(situation, context = {}) {
        console.log('[EmotionalAppraisal] Appraising situation...');

        const appraisal = {
            relevance: this.assessRelevance(situation, context),       // Does this matter?
            valence: this.assessValence(situation, context),           // Good or bad?
            certainty: this.assessCertainty(situation, context),       // How sure?
            agency: this.assessAgency(situation, context),             // Who caused it?
            control: this.assessControl(situation, context),           // Can we influence it?
            normativeSignificance: this.assessNormativeSignificance(situation, context) // Moral weight
        };

        this.currentAppraisal = {
            situation,
            appraisal,
            timestamp: Date.now()
        };

        console.log('[EmotionalAppraisal] Appraisal complete:', appraisal);

        return appraisal;
    }

    /**
     * Assess relevance (0-1)
     */
    assessRelevance(situation, context) {
        let relevance = 0.5; // Neutral

        // User-related = highly relevant
        if (situation.involvesUser) relevance += 0.4;

        // Goal-related = relevant
        if (situation.affectsGoal) relevance += 0.3;

        // Urgent = relevant
        if (situation.urgent) relevance += 0.2;

        return Math.min(1, relevance);
    }

    /**
     * Assess valence (-1 to 1, negative to positive)
     */
    assessValence(situation, context) {
        let valence = 0; // Neutral

        // Positive indicators
        if (situation.success) valence += 0.7;
        if (situation.helpfulToUser) valence += 0.5;
        if (situation.progress) valence += 0.3;

        // Negative indicators
        if (situation.failure) valence -= 0.7;
        if (situation.harmToUser) valence -= 0.9;
        if (situation.setback) valence -= 0.3;

        return Math.max(-1, Math.min(1, valence));
    }

    /**
     * Assess certainty (0-1)
     */
    assessCertainty(situation, context) {
        let certainty = 0.5; // Uncertain

        // Clear facts = high certainty
        if (situation.verified) certainty += 0.4;

        // Ambiguous = low certainty
        if (situation.ambiguous) certainty -= 0.3;

        // Multiple sources = higher certainty
        if (situation.sources && situation.sources.length > 2) {
            certainty += 0.2;
        }

        return Math.max(0, Math.min(1, certainty));
    }

    /**
     * Assess agency (who caused this?)
     */
    assessAgency(situation, context) {
        if (situation.causedBy === 'user') return 'user';
        if (situation.causedBy === 'self') return 'phoenix';
        if (situation.causedBy === 'external') return 'external';
        return 'unknown';
    }

    /**
     * Assess control (0-1, can we influence it?)
     */
    assessControl(situation, context) {
        let control = 0.5; // Moderate

        // If Phoenix can act = high control
        if (situation.phoenixCanAct) control += 0.4;

        // If user must act = moderate control (can advise)
        if (situation.userMustAct) control = 0.3;

        // If external forces = low control
        if (situation.external) control -= 0.4;

        return Math.max(0, Math.min(1, control));
    }

    /**
     * Assess normative significance (0-1, moral weight)
     */
    assessNormativeSignificance(situation, context) {
        let significance = 0; // Not morally significant

        // Harm to user = high moral significance
        if (situation.harmToUser) significance += 0.9;

        // Deception = morally significant
        if (situation.involvesDeception) significance += 0.7;

        // Autonomy violation = morally significant
        if (situation.violatesAutonomy) significance += 0.8;

        // Privacy violation = morally significant
        if (situation.violatesPrivacy) significance += 0.8;

        return Math.min(1, significance);
    }

    /**
     * Generate emotion from appraisal
     */
    async generateEmotion(appraisal) {
        console.log('[EmotionalAppraisal] Generating emotion from appraisal...');

        let emotion = 'neutral';
        let intensity = 0.5;

        // High relevance + positive valence = joy/satisfaction
        if (appraisal.relevance > 0.7 && appraisal.valence > 0.5) {
            emotion = 'satisfaction';
            intensity = appraisal.relevance * appraisal.valence;
        }

        // High relevance + negative valence = distress
        if (appraisal.relevance > 0.7 && appraisal.valence < -0.5) {
            emotion = 'concern';
            intensity = appraisal.relevance * Math.abs(appraisal.valence);
        }

        // Low control + negative valence = anxiety
        if (appraisal.control < 0.3 && appraisal.valence < 0) {
            emotion = 'anxiety';
            intensity = (1 - appraisal.control) * Math.abs(appraisal.valence);
        }

        // High control + negative valence = determination
        if (appraisal.control > 0.7 && appraisal.valence < 0) {
            emotion = 'determination';
            intensity = appraisal.control * Math.abs(appraisal.valence) * 0.8;
        }

        // Low certainty = confusion/uncertainty
        if (appraisal.certainty < 0.3) {
            emotion = 'uncertainty';
            intensity = 1 - appraisal.certainty;
        }

        // High normative significance + negative = moral distress
        if (appraisal.normativeSignificance > 0.7 && appraisal.valence < 0) {
            emotion = 'moral_concern';
            intensity = appraisal.normativeSignificance;
        }

        console.log(`[EmotionalAppraisal] Generated emotion: ${emotion} (intensity: ${intensity.toFixed(2)})`);

        return {
            emotion,
            intensity,
            appraisal
        };
    }

    /**
     * Regulate emotion (modify intensity or type)
     */
    async regulateEmotion(emotion, target) {
        console.log(`[EmotionalAppraisal] Regulating emotion: ${emotion.emotion} -> ${target.emotion || 'lower intensity'}`);

        const regulated = { ...emotion };

        // Reappraisal strategy
        if (target.strategy === 'reappraisal') {
            // Change interpretation of situation
            if (target.newValence !== undefined) {
                regulated.appraisal.valence = target.newValence;
                const newEmotion = await this.generateEmotion(regulated.appraisal);
                regulated.emotion = newEmotion.emotion;
                regulated.intensity = newEmotion.intensity;
            }
        }

        // Suppression strategy
        if (target.strategy === 'suppression') {
            // Reduce intensity without changing type
            regulated.intensity = Math.max(0, regulated.intensity * 0.5);
        }

        // Intensification strategy
        if (target.strategy === 'intensification') {
            // Increase intensity
            regulated.intensity = Math.min(1, regulated.intensity * 1.5);
        }

        // Target-based reduction
        if (target.intensity !== undefined) {
            regulated.intensity = target.intensity;
        }

        console.log(`[EmotionalAppraisal] Regulated to: ${regulated.emotion} (intensity: ${regulated.intensity.toFixed(2)})`);

        return regulated;
    }

    /**
     * Get current appraisal
     */
    getCurrentAppraisal() {
        return this.currentAppraisal;
    }

    /**
     * Get summary (required by brain/index.js)
     */
    getSummary() {
        return {
            currentEmotion: this.currentEmotion?.emotion || 'neutral',
            intensity: this.currentEmotion?.intensity || 0,
            valence: this.currentEmotion?.valence || 0,
            recentEvents: (this.appraisalHistory || []).slice(-3).map(a => ({
                emotion: a.emotion,
                timestamp: a.timestamp
            }))
        };
    }
}

module.exports = new EmotionalAppraisal();
