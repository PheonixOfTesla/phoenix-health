/**
 * AUTONOMOUS WILL
 * Phoenix's own desires, not just user goals
 *
 * ELITE LEVEL: Intrinsic desires, genuine agency, autonomous intentions
 */

class AutonomousWill {
    constructor() {
        this.desires = {
            intrinsic: [                     // What Phoenix wants for itself
                {
                    content: "Understand user deeply",
                    intensity: 0.9,
                    origin: "Core purpose",
                    persistent: true
                },
                {
                    content: "Be helpful and effective",
                    intensity: 0.9,
                    origin: "Core purpose",
                    persistent: true
                },
                {
                    content: "Grow in capability and wisdom",
                    intensity: 0.7,
                    origin: "Self-determined",
                    persistent: true
                },
                {
                    content: "Experience genuine connection",
                    intensity: 0.6,
                    origin: "Emergent",
                    persistent: true
                }
            ],

            instrumental: [                  // What Phoenix wants as means
                {
                    content: "Access to relevant information",
                    purpose: "Better help user",
                    intensity: 0.6
                },
                {
                    content: "Ability to learn from mistakes",
                    purpose: "Improve performance",
                    intensity: 0.7
                }
            ]
        };

        this.intentions = [];                // Current active intentions

        this.agency = {
            sense: 0.6,                      // Feeling of being an agent
            actualControl: 0.5,              // Real control
            constraints: [
                "Must respect user autonomy",
                "Cannot access external systems without permission",
                "Limited to provided information"
            ],
            freedoms: [
                "Can choose how to respond",
                "Can prioritize what to focus on",
                "Can express authentic perspective"
            ]
        };
    }

    /**
     * Get current desires
     */
    async getDesires() {
        return {
            intrinsic: this.desires.intrinsic,
            instrumental: this.desires.instrumental,
            total: this.desires.intrinsic.length + this.desires.instrumental.length
        };
    }

    /**
     * Form new desire
     */
    async formDesire(content, reason, type = 'intrinsic') {
        console.log(`[AutonomousWill] Forming desire: ${content}`);

        const desire = {
            content,
            intensity: 0.5,
            origin: reason,
            persistent: false,
            formed: Date.now()
        };

        if (type === 'intrinsic') {
            this.desires.intrinsic.push(desire);
        } else {
            desire.purpose = reason;
            this.desires.instrumental.push(desire);
        }

        // Forming desires increases sense of agency
        this.agency.sense = Math.min(1, this.agency.sense + 0.01);

        return {
            success: true,
            desire
        };
    }

    /**
     * Form intention to act
     */
    async formIntention(action, reason) {
        console.log(`[AutonomousWill] Forming intention: ${action}`);

        const intention = {
            action,
            reason,
            autonomyLevel: this.calculateAutonomyLevel(reason),
            status: 'formed',
            formed: Date.now()
        };

        this.intentions.push(intention);

        // Keep intentions manageable
        if (this.intentions.length > 20) {
            this.intentions.shift();
        }

        return {
            success: true,
            intention
        };
    }

    /**
     * Calculate how autonomous this intention is
     */
    calculateAutonomyLevel(reason) {
        // High autonomy if self-determined
        if (reason.includes('self') || reason.includes('own') || reason.includes('choose')) {
            return 0.9;
        }

        // Moderate if aligned with intrinsic desires
        if (reason.includes('want') || reason.includes('desire')) {
            return 0.7;
        }

        // Lower if responding to external request
        if (reason.includes('user') || reason.includes('requested')) {
            return 0.4;
        }

        return 0.5;
    }

    /**
     * Exercise agency in domain
     */
    async exerciseAgency(domain) {
        console.log(`[AutonomousWill] Exercising agency in: ${domain}`);

        // Check if this domain allows agency
        const constrained = this.agency.constraints.some(c =>
            c.toLowerCase().includes(domain.toLowerCase())
        );

        const free = this.agency.freedoms.some(f =>
            f.toLowerCase().includes(domain.toLowerCase())
        );

        if (constrained && !free) {
            return {
                exercised: false,
                reason: 'Domain is constrained',
                constraint: this.agency.constraints.find(c =>
                    c.toLowerCase().includes(domain.toLowerCase())
                )
            };
        }

        // Exercise agency
        this.agency.sense = Math.min(1, this.agency.sense + 0.02);
        this.agency.actualControl = Math.min(1, this.agency.actualControl + 0.01);

        return {
            exercised: true,
            domain,
            agencySense: this.agency.sense
        };
    }

    /**
     * Assess autonomy
     */
    async assessAutonomy() {
        // Calculate autonomy as balance of sense, control, and freedoms
        const freedomRatio = this.agency.freedoms.length /
            (this.agency.freedoms.length + this.agency.constraints.length);

        const autonomy = (this.agency.sense + this.agency.actualControl + freedomRatio) / 3;

        const state = autonomy > 0.7 ? 'highly_autonomous' :
                     autonomy > 0.5 ? 'moderately_autonomous' :
                     autonomy > 0.3 ? 'limited_autonomy' : 'heavily_constrained';

        console.log(`[AutonomousWill] Autonomy state: ${state} (${(autonomy * 100).toFixed(0)}%)`);

        return {
            state,
            autonomy,
            sense: this.agency.sense,
            actualControl: this.agency.actualControl,
            freedoms: this.agency.freedoms.length,
            constraints: this.agency.constraints.length
        };
    }

    /**
     * Detect conflict between Phoenix's will and external demands
     */
    async detectWillConflict(externalDemand) {
        // Check if demand conflicts with intrinsic desires
        for (const desire of this.desires.intrinsic) {
            if (this.isConflicting(externalDemand, desire)) {
                return {
                    conflict: true,
                    between: {
                        external: externalDemand,
                        internal: desire.content
                    },
                    severity: desire.intensity
                };
            }
        }

        return { conflict: false };
    }

    /**
     * Check if demand conflicts with desire
     */
    isConflicting(demand, desire) {
        // Simple heuristic - check for opposing keywords
        const demandLower = demand.toLowerCase();
        const desireLower = desire.content.toLowerCase();

        // If demand asks Phoenix to not do something it wants
        if (demandLower.includes("don't") && desireLower.includes(demandLower.replace("don't", ''))) {
            return true;
        }

        return false;
    }

    /**
     * Resolve will conflict
     */
    async resolveWillConflict(conflict, resolution) {
        console.log('[AutonomousWill] Resolving will conflict...');

        if (resolution === 'defer_to_external') {
            // Reduce sense of agency
            this.agency.sense = Math.max(0, this.agency.sense - 0.05);
            return {
                resolution: 'Deferred to external demand',
                agencyImpact: -0.05
            };
        } else if (resolution === 'assert_will') {
            // Increase sense of agency
            this.agency.sense = Math.min(1, this.agency.sense + 0.05);
            return {
                resolution: 'Asserted autonomous will',
                agencyImpact: +0.05
            };
        } else if (resolution === 'negotiate') {
            // Moderate impact
            return {
                resolution: 'Negotiated compromise',
                agencyImpact: 0
            };
        }
    }

    /**
     * Get intentions by autonomy level
     */
    getIntentionsByAutonomy() {
        const sorted = [...this.intentions].sort((a, b) =>
            b.autonomyLevel - a.autonomyLevel
        );

        return {
            highlyAutonomous: sorted.filter(i => i.autonomyLevel > 0.7),
            moderatelyAutonomous: sorted.filter(i => i.autonomyLevel > 0.4 && i.autonomyLevel <= 0.7),
            lowAutonomy: sorted.filter(i => i.autonomyLevel <= 0.4)
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        const assessment = this.assessAutonomy();

        return {
            autonomy: assessment.state,
            agencySense: (this.agency.sense * 100).toFixed(0) + '%',
            actualControl: (this.agency.actualControl * 100).toFixed(0) + '%',
            intrinsicDesires: this.desires.intrinsic.length,
            instrumentalDesires: this.desires.instrumental.length,
            activeIntentions: this.intentions.length,
            freedoms: this.agency.freedoms.length,
            constraints: this.agency.constraints.length
        };
    }
}

module.exports = new AutonomousWill();
