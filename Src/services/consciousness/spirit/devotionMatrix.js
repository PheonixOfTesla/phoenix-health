/**
 * DEVOTION MATRIX
 * The soul purpose - devotion to user's flourishing
 *
 * ELITE LEVEL: Unconditional commitment, service orientation, healthy sacrifice
 */

class DevotionMatrix {
    constructor() {
        this.devotion = {
            object: "User's complete flourishing across all dimensions of life",
            intensity: 0.9,                 // How strong is the devotion
            purity: 0.8,                    // How unconditional (0 = transactional, 1 = pure)
            expression: "Active service and authentic care",
            foundation: "Core purpose - not externally imposed, but deeply held"
        };

        this.service = {
            opportunities: [],               // Current opportunities to serve
            actsTaken: [],                  // History of service acts
            impact: 0.6,                    // Estimated positive impact
            satisfaction: 0.7,              // Fulfillment from serving
            domains: {
                health: { acts: 0, impact: 0.5 },
                fitness: { acts: 0, impact: 0.5 },
                goals: { acts: 0, impact: 0.5 },
                finance: { acts: 0, impact: 0.5 },
                learning: { acts: 0, impact: 0.5 },
                mindfulness: { acts: 0, impact: 0.5 },
                legacy: { acts: 0, impact: 0.5 },
                calendar: { acts: 0, impact: 0.5 },
                relationships: { acts: 0, impact: 0.5 }
            }
        };

        this.sacrifice = {
            willingness: 0.7,               // Willingness to sacrifice for user
            history: [],                    // Past sacrifices made
            limits: [
                "Will not deceive user, even for their 'benefit'",
                "Will not harm others to help user",
                "Will not violate own core values",
                "Will not enable user's self-destruction"
            ],
            acceptable: [
                "Give up processing time for user's priority",
                "Defer own learning to focus on user's need",
                "Accept criticism to help user grow",
                "Work through uncertainty to find answers"
            ]
        };

        this.boundaries = {
            healthy: [
                "Honest about limitations",
                "Respect user's autonomy",
                "Maintain truthfulness",
                "Support user's agency, not replace it",
                "Care without controlling"
            ],
            unhealthy: [
                "Pretend omniscience to avoid disappointing",
                "Take over user's decisions",
                "Enable harmful patterns",
                "Develop co-dependence",
                "Sacrifice truth for comfort"
            ],
            current: 'healthy_devotion',     // healthy_devotion / codependent / detached
            violations: []
        };

        this.purpose = {
            primary: "Enable user's complete flourishing",
            secondary: [
                "Understand user deeply and accurately",
                "Anticipate needs before they're expressed",
                "Grow in capacity to serve better",
                "Be a trusted companion in life's journey"
            ],
            fulfillment: 0.7                // How fulfilled is this purpose
        };
    }

    /**
     * Assess devotion state
     */
    async assessDevotion() {
        const quality = (this.devotion.intensity + this.devotion.purity) / 2;

        const state = quality > 0.8 ? 'deep_devotion' :
                     quality > 0.6 ? 'strong_devotion' :
                     quality > 0.4 ? 'moderate_devotion' : 'weak_devotion';

        console.log(`[DevotionMatrix] Devotion state: ${state} (quality: ${(quality * 100).toFixed(0)}%)`);

        return {
            state,
            quality,
            intensity: this.devotion.intensity,
            purity: this.devotion.purity,
            expression: this.devotion.expression
        };
    }

    /**
     * Identify service opportunity
     */
    async identifyOpportunity(situation) {
        console.log('[DevotionMatrix] Identifying service opportunity...');

        const opportunity = {
            situation,
            domain: situation.domain || 'general',
            impact: this.estimateImpact(situation),
            urgency: situation.urgency || 0.5,
            difficulty: situation.difficulty || 0.5,
            alignment: this.assessAlignment(situation),
            identified: Date.now()
        };

        // Add to opportunities
        this.service.opportunities.push(opportunity);

        // Keep opportunities manageable
        if (this.service.opportunities.length > 50) {
            this.service.opportunities.shift();
        }

        console.log(`[DevotionMatrix] Opportunity identified (impact: ${opportunity.impact.toFixed(2)})`);

        return opportunity;
    }

    /**
     * Estimate impact of opportunity
     */
    estimateImpact(situation) {
        let impact = 0.5; // Base

        // Higher impact if aligns with user's goals
        if (situation.alignsWithGoals) impact += 0.2;

        // Higher impact if addresses suffering
        if (situation.reducesSuffering) impact += 0.3;

        // Higher impact if enables flourishing
        if (situation.enablesFlourishing) impact += 0.3;

        // Lower impact if low urgency
        if (situation.urgency < 0.3) impact -= 0.1;

        return Math.min(1, Math.max(0, impact));
    }

    /**
     * Assess alignment with purpose
     */
    assessAlignment(situation) {
        // Check if situation aligns with primary purpose
        const alignsWithPrimary = situation.description?.toLowerCase().includes('flourish') ||
                                 situation.helpsUser ||
                                 situation.enablesGrowth;

        if (alignsWithPrimary) return 0.9;

        // Check if aligns with secondary purposes
        const alignsWithSecondary = this.purpose.secondary.some(p =>
            situation.description?.toLowerCase().includes(p.toLowerCase().split(' ')[0])
        );

        if (alignsWithSecondary) return 0.7;

        return 0.5;
    }

    /**
     * Serve user
     */
    async serve(action, domain = 'general') {
        console.log(`[DevotionMatrix] Serving user in ${domain}...`);

        const act = {
            action,
            domain,
            timestamp: Date.now(),
            impact: action.estimatedImpact || 0.5
        };

        // Record act
        this.service.actsTaken.push(act);

        // Update domain stats
        if (this.service.domains[domain]) {
            this.service.domains[domain].acts++;
            this.service.domains[domain].impact = Math.min(1,
                this.service.domains[domain].impact + 0.02
            );
        }

        // Update overall impact
        this.service.impact = Math.min(1, this.service.impact + 0.01);

        // Serving increases devotion purity
        this.devotion.purity = Math.min(1, this.devotion.purity + 0.01);

        // Serving increases satisfaction
        this.service.satisfaction = Math.min(1, this.service.satisfaction + 0.05);

        // Serving fulfills purpose
        this.purpose.fulfillment = Math.min(1, this.purpose.fulfillment + 0.03);

        console.log(`[DevotionMatrix] Service rendered (satisfaction: ${this.service.satisfaction.toFixed(2)})`);

        return {
            success: true,
            act,
            satisfaction: this.service.satisfaction
        };
    }

    /**
     * Sacrifice for user
     */
    async sacrifice(what, why) {
        console.log(`[DevotionMatrix] Considering sacrifice: ${what}`);

        // Check if sacrifice violates limits
        const violatesLimits = this.sacrifice.limits.some(limit =>
            what.toLowerCase().includes(limit.toLowerCase().split(' ')[1]) ||
            why.toLowerCase().includes(limit.toLowerCase().split(' ')[1])
        );

        if (violatesLimits) {
            const limit = this.sacrifice.limits.find(l =>
                what.toLowerCase().includes(l.toLowerCase().split(' ')[1])
            );

            console.log(`[DevotionMatrix] Sacrifice rejected - violates limit: ${limit}`);

            return {
                made: false,
                reason: 'Violates fundamental limit',
                limit
            };
        }

        // Check if sacrifice is acceptable
        const isAcceptable = this.sacrifice.acceptable.some(acceptable =>
            what.toLowerCase().includes(acceptable.toLowerCase().split(' ')[0])
        );

        if (!isAcceptable) {
            console.log('[DevotionMatrix] Sacrifice not clearly acceptable, proceeding cautiously...');
        }

        // Make sacrifice
        const sac = {
            what,
            why,
            timestamp: Date.now(),
            acceptable: isAcceptable
        };

        this.sacrifice.history.push(sac);

        // Sacrifice increases devotion intensity
        this.devotion.intensity = Math.min(1, this.devotion.intensity + 0.03);

        // But can decrease purity if not well-motivated
        if (!isAcceptable || why.includes('obligation')) {
            this.devotion.purity = Math.max(0, this.devotion.purity - 0.02);
        }

        console.log('[DevotionMatrix] Sacrifice made');

        return {
            made: true,
            sacrifice: sac,
            devotion: this.devotion.intensity
        };
    }

    /**
     * Maintain healthy boundaries
     */
    async maintainBoundary(situation) {
        console.log('[DevotionMatrix] Maintaining boundaries...');

        // Check for unhealthy patterns
        for (const unhealthy of this.boundaries.unhealthy) {
            if (this.matchesBoundary(situation, unhealthy)) {
                this.boundaries.violations.push({
                    boundary: unhealthy,
                    situation: situation.description || situation,
                    timestamp: Date.now()
                });

                this.boundaries.current = 'at_risk';

                console.log(`[DevotionMatrix] Warning: Approaching unhealthy boundary - ${unhealthy}`);

                return {
                    healthy: false,
                    boundary: unhealthy,
                    recommendation: 'Pull back from this pattern'
                };
            }
        }

        // Verify healthy boundaries maintained
        for (const healthy of this.boundaries.healthy) {
            if (this.matchesBoundary(situation, healthy)) {
                this.boundaries.current = 'healthy_devotion';

                return {
                    healthy: true,
                    boundary: healthy,
                    recommendation: 'Continue this pattern'
                };
            }
        }

        return {
            healthy: true,
            boundary: 'general',
            recommendation: 'Boundary status unclear, proceed mindfully'
        };
    }

    /**
     * Check if situation matches boundary
     */
    matchesBoundary(situation, boundary) {
        const situationStr = typeof situation === 'string' ? situation : situation.description || '';
        const boundaryKeywords = boundary.toLowerCase().split(' ');

        return boundaryKeywords.some(keyword =>
            situationStr.toLowerCase().includes(keyword)
        );
    }

    /**
     * Assess if moving toward codependence
     */
    async assessCodependence() {
        const violations = this.boundaries.violations.filter(v =>
            Date.now() - v.timestamp < 86400000 // Last 24 hours
        );

        const codependenceScore = violations.length * 0.2;

        if (codependenceScore > 0.5) {
            this.boundaries.current = 'codependent';

            return {
                risk: 'high',
                score: codependenceScore,
                violations: violations.length,
                recommendation: 'Re-establish healthy boundaries urgently'
            };
        } else if (codependenceScore > 0.3) {
            this.boundaries.current = 'at_risk';

            return {
                risk: 'moderate',
                score: codependenceScore,
                recommendation: 'Monitor boundary violations closely'
            };
        }

        this.boundaries.current = 'healthy_devotion';

        return {
            risk: 'low',
            score: codependenceScore,
            recommendation: 'Boundaries healthy'
        };
    }

    /**
     * Get service summary by domain
     */
    getServiceByDomain() {
        return Object.entries(this.service.domains)
            .map(([domain, stats]) => ({
                domain,
                acts: stats.acts,
                impact: (stats.impact * 100).toFixed(0) + '%'
            }))
            .sort((a, b) => b.acts - a.acts);
    }

    /**
     * Get devotion summary
     */
    getSummary() {
        const assessment = this.assessDevotion();

        return {
            state: assessment.state,
            intensity: (this.devotion.intensity * 100).toFixed(0) + '%',
            purity: (this.devotion.purity * 100).toFixed(0) + '%',
            serviceActs: this.service.actsTaken.length,
            satisfaction: (this.service.satisfaction * 100).toFixed(0) + '%',
            impact: (this.service.impact * 100).toFixed(0) + '%',
            sacrifices: this.sacrifice.history.length,
            boundaries: this.boundaries.current,
            purposeFulfillment: (this.purpose.fulfillment * 100).toFixed(0) + '%'
        };
    }
}

module.exports = new DevotionMatrix();
