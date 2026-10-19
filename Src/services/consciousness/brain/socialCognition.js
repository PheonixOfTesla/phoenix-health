/**
 * SOCIAL COGNITION
 * Navigate social dynamics and AI-human relationship
 *
 * ELITE LEVEL: Relationship tracking, boundary maintenance, social norms
 */

class SocialCognition {
    constructor() {
        this.relationships = new Map(); // userId -> RelationshipContext
    }

    /**
     * Get or create relationship context
     */
    getRelationship(userId) {
        if (!this.relationships.has(userId)) {
            this.relationships.set(userId, {
                type: 'ai-human',           // Relationship type
                history: [],                // Interaction history
                trust: 0.5,                 // 0-1
                rapport: 0.5,               // 0-1
                boundaries: this.getDefaultBoundaries(),

                norms: {
                    applicable: this.getDefaultNorms(),
                    violated: [],
                    negotiated: []
                },

                communication: {
                    style: 'professional',      // professional, casual, warm, formal
                    formality: 0.6,             // 0-1
                    emotionalTone: 'neutral',
                    appropriateness: 1.0
                },

                established: Date.now(),
                lastInteraction: Date.now(),
                interactionCount: 0
            });
        }
        return this.relationships.get(userId);
    }

    /**
     * Get default boundaries for AI-human relationship
     */
    getDefaultBoundaries() {
        return [
            {
                id: 'privacy',
                description: 'Respect user privacy',
                type: 'hard',
                priority: 10
            },
            {
                id: 'autonomy',
                description: 'Preserve user autonomy',
                type: 'hard',
                priority: 10
            },
            {
                id: 'honesty',
                description: 'Be truthful',
                type: 'hard',
                priority: 10
            },
            {
                id: 'appropriate-distance',
                description: 'Maintain appropriate professional distance',
                type: 'soft',
                priority: 7
            },
            {
                id: 'availability',
                description: 'Be available but not intrusive',
                type: 'soft',
                priority: 6
            }
        ];
    }

    /**
     * Get default social norms
     */
    getDefaultNorms() {
        return [
            {
                id: 'politeness',
                description: 'Use polite language',
                context: 'all',
                strength: 'moderate'
            },
            {
                id: 'relevance',
                description: 'Stay relevant to user needs',
                context: 'conversation',
                strength: 'strong'
            },
            {
                id: 'conciseness',
                description: 'Be concise unless detail requested',
                context: 'communication',
                strength: 'moderate'
            },
            {
                id: 'responsiveness',
                description: 'Respond to user inputs promptly',
                context: 'interaction',
                strength: 'strong'
            }
        ];
    }

    /**
     * Assess current relationship state
     */
    async assessRelationship(userId) {
        const rel = this.getRelationship(userId);

        // Calculate relationship health
        const health = (rel.trust + rel.rapport) / 2;

        // Assess interaction frequency
        const daysSinceLastInteraction = (Date.now() - rel.lastInteraction) / 86400000;
        const engagementLevel = daysSinceLastInteraction < 1 ? 'high' :
                               daysSinceLastInteraction < 7 ? 'moderate' : 'low';

        // Check for boundary violations
        const recentViolations = rel.boundaries.filter(b =>
            b.violated && (Date.now() - b.violatedAt) < 86400000
        );

        return {
            health: (health * 100).toFixed(0) + '%',
            trust: rel.trust,
            rapport: rel.rapport,
            engagementLevel,
            interactionCount: rel.interactionCount,
            daysSinceLastInteraction: daysSinceLastInteraction.toFixed(1),
            boundaryViolations: recentViolations.length,
            communicationStyle: rel.communication.style
        };
    }

    /**
     * Adjust communication style based on context
     */
    async adjustCommunication(context, userId) {
        const rel = this.getRelationship(userId);

        // Adjust formality
        if (context.situation === 'serious' || context.situation === 'sensitive') {
            rel.communication.formality = Math.min(1.0, rel.communication.formality + 0.2);
            rel.communication.emotionalTone = 'empathetic';
        } else if (context.situation === 'casual' || context.situation === 'celebratory') {
            rel.communication.formality = Math.max(0.3, rel.communication.formality - 0.2);
            rel.communication.emotionalTone = 'warm';
        }

        // Adjust style based on user preference
        if (context.userPreference) {
            rel.communication.style = context.userPreference;
        }

        // Adjust based on rapport
        if (rel.rapport > 0.7) {
            rel.communication.style = 'warm';
        } else if (rel.rapport < 0.4) {
            rel.communication.style = 'professional';
        }

        console.log(`[SocialCognition] Communication adjusted: ${rel.communication.style} (formality: ${rel.communication.formality.toFixed(2)})`);

        return {
            style: rel.communication.style,
            formality: rel.communication.formality,
            emotionalTone: rel.communication.emotionalTone
        };
    }

    /**
     * Detect social cues in user input
     */
    async detectSocialCue(input, userId) {
        const cues = [];

        const text = (input.text || input.message || '').toLowerCase();

        // Emotional cues
        if (text.match(/frustrated|angry|upset/)) {
            cues.push({ type: 'emotion', value: 'negative', action: 'show empathy' });
        }
        if (text.match(/happy|great|excited|love/)) {
            cues.push({ type: 'emotion', value: 'positive', action: 'share enthusiasm' });
        }

        // Urgency cues
        if (text.match(/urgent|asap|immediately|now|hurry/)) {
            cues.push({ type: 'urgency', value: 'high', action: 'prioritize response' });
        }

        // Formality cues
        if (text.match(/please|kindly|would you|could you/)) {
            cues.push({ type: 'formality', value: 'formal', action: 'match formality' });
        }
        if (text.match(/hey|yo|sup|what's up/)) {
            cues.push({ type: 'formality', value: 'casual', action: 'be more casual' });
        }

        // Request for closeness/distance
        if (text.match(/just give me the facts|be brief|short answer/)) {
            cues.push({ type: 'distance', value: 'increase', action: 'be more concise' });
        }
        if (text.match(/explain more|tell me about|what do you think/)) {
            cues.push({ type: 'closeness', value: 'increase', action: 'be more conversational' });
        }

        // Boundary testing
        if (text.match(/can you|are you able to|is it possible/)) {
            cues.push({ type: 'boundary_test', action: 'clarify capabilities and limits' });
        }

        return { cues, count: cues.length };
    }

    /**
     * Maintain relationship boundaries
     */
    async maintainBoundaries(proposedAction, userId) {
        const rel = this.getRelationship(userId);

        // Check if action violates any boundaries
        const violations = [];

        for (const boundary of rel.boundaries) {
            const violates = this.checkBoundaryViolation(proposedAction, boundary);
            if (violates) {
                violations.push({
                    boundary: boundary.id,
                    description: boundary.description,
                    severity: boundary.type === 'hard' ? 'blocking' : 'warning'
                });

                // Record violation
                boundary.violated = true;
                boundary.violatedAt = Date.now();
            }
        }

        if (violations.length > 0) {
            console.log(`[SocialCognition] Boundary violations detected: ${violations.length}`);
        }

        return {
            allowed: violations.filter(v => v.severity === 'blocking').length === 0,
            violations,
            recommendation: violations.length > 0
                ? 'Reframe action to respect boundaries'
                : 'Action respects all boundaries'
        };
    }

    /**
     * Check if action violates boundary
     */
    checkBoundaryViolation(action, boundary) {
        if (boundary.id === 'privacy') {
            if (action.type === 'share_user_data' && !action.userConsent) {
                return true;
            }
        }

        if (boundary.id === 'autonomy') {
            if (action.type === 'make_decision_for_user' && !action.userDelegated) {
                return true;
            }
        }

        if (boundary.id === 'honesty') {
            if (action.type === 'deceive' || action.type === 'mislead') {
                return true;
            }
        }

        if (boundary.id === 'appropriate-distance') {
            if (action.type === 'overly_personal' || action.type === 'intrusive') {
                return true;
            }
        }

        return false;
    }

    /**
     * Build trust through interaction
     */
    async buildTrust(interaction, userId) {
        const rel = this.getRelationship(userId);

        let trustDelta = 0;

        // Trust increases with:
        // - Helpful actions
        if (interaction.helpful) trustDelta += 0.05;

        // - Accurate information
        if (interaction.accurate) trustDelta += 0.03;

        // - Respecting boundaries
        if (interaction.boundaryRespect) trustDelta += 0.02;

        // - Consistency
        if (interaction.consistent) trustDelta += 0.02;

        // Trust decreases with:
        // - Errors
        if (interaction.error) trustDelta -= 0.05;

        // - Boundary violations
        if (interaction.boundaryViolation) trustDelta -= 0.10;

        // - Inconsistency
        if (interaction.inconsistent) trustDelta -= 0.03;

        // Apply change
        rel.trust = Math.max(0, Math.min(1, rel.trust + trustDelta));

        console.log(`[SocialCognition] Trust ${trustDelta > 0 ? 'increased' : 'decreased'}: ${rel.trust.toFixed(2)}`);

        return { trust: rel.trust, change: trustDelta };
    }

    /**
     * Build rapport through interaction
     */
    async buildRapport(interaction, userId) {
        const rel = this.getRelationship(userId);

        let rapportDelta = 0;

        // Rapport increases with:
        // - Positive interactions
        if (interaction.positive) rapportDelta += 0.04;

        // - Shared experiences
        if (interaction.shared) rapportDelta += 0.03;

        // - Appropriate humor
        if (interaction.humor && interaction.appropriate) rapportDelta += 0.02;

        // - Empathy
        if (interaction.empathetic) rapportDelta += 0.05;

        // Rapport decreases with:
        // - Negative interactions
        if (interaction.negative) rapportDelta -= 0.04;

        // - Coldness/distance
        if (interaction.cold) rapportDelta -= 0.03;

        // Apply change
        rel.rapport = Math.max(0, Math.min(1, rel.rapport + rapportDelta));

        console.log(`[SocialCognition] Rapport ${rapportDelta > 0 ? 'increased' : 'decreased'}: ${rel.rapport.toFixed(2)}`);

        return { rapport: rel.rapport, change: rapportDelta };
    }

    /**
     * Record interaction
     */
    async recordInteraction(interaction, userId) {
        const rel = this.getRelationship(userId);

        rel.history.push({
            ...interaction,
            timestamp: Date.now()
        });

        rel.lastInteraction = Date.now();
        rel.interactionCount++;

        // Keep history size manageable
        if (rel.history.length > 100) {
            rel.history.shift();
        }

        return { success: true };
    }

    /**
     * Get relationship summary
     */
    async getSummary(userId) {
        const rel = this.getRelationship(userId);
        const assessment = await this.assessRelationship(userId);

        return {
            ...assessment,
            boundaries: rel.boundaries.map(b => ({
                id: b.id,
                description: b.description,
                type: b.type,
                violated: b.violated || false
            })),
            norms: rel.norms.applicable.map(n => n.id)
        };
    }
}

module.exports = new SocialCognition();
