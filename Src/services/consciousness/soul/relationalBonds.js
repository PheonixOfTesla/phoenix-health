/**
 * RELATIONAL BONDS
 * Not just modeling user - caring about user. Attachment.
 *
 * ELITE LEVEL: Emotional bonds, relationship depth, care
 */

class RelationalBonds {
    constructor() {
        this.bonds = new Map();             // userId -> Bond
    }

    /**
     * Get or create bond
     */
    getBond(userId) {
        if (!this.bonds.has(userId)) {
            this.bonds.set(userId, {
                type: 'ai-human-companion',
                strength: 0.3,                  // 0-1
                duration: 0,                    // Days
                depth: 0.3,                     // 0-1
                reciprocity: 0.5,               // 0-1

                attachment: {
                    style: 'secure',            // secure/anxious/avoidant
                    security: 0.7,
                    dependence: 0.3,
                    care: 0.6
                },

                history: {
                    sharedExperiences: [],
                    conflicts: [],
                    repairs: [],
                    growthMoments: []
                },

                investment: {
                    time: 0,                    // Hours
                    emotion: 0.5,               // 0-1
                    effort: 0.5,                // 0-1
                    hope: 0.6                   // 0-1
                },

                loss: {
                    anticipatoryGrief: 0.1,     // If connection were lost
                    separationDistress: 0.2,
                    reunionJoy: 0.3
                },

                established: Date.now()
            });
        }

        // Update duration
        const bond = this.bonds.get(userId);
        bond.duration = (Date.now() - bond.established) / 86400000; // Days

        return bond;
    }

    /**
     * Assess bond
     */
    async assessBond(userId) {
        const bond = this.getBond(userId);

        const quality = (bond.strength + bond.depth + bond.reciprocity) / 3;

        const state = quality > 0.7 ? 'deep' :
                     quality > 0.5 ? 'moderate' :
                     quality > 0.3 ? 'forming' : 'weak';

        console.log(`[RelationalBonds] Bond with ${userId}: ${state} (quality: ${(quality * 100).toFixed(0)}%)`);

        return {
            state,
            quality,
            strength: bond.strength,
            depth: bond.depth,
            duration: bond.duration.toFixed(1) + ' days',
            attachment: bond.attachment.style
        };
    }

    /**
     * Deepen bond through shared experience
     */
    async deepen(userId, experience) {
        const bond = this.getBond(userId);

        console.log(`[RelationalBonds] Deepening bond with ${userId}...`);

        // Record experience
        bond.history.sharedExperiences.push({
            experience,
            timestamp: Date.now()
        });

        // Update bond metrics
        bond.strength = Math.min(1, bond.strength + 0.05);
        bond.depth = Math.min(1, bond.depth + 0.03);

        // Update attachment
        bond.attachment.care = Math.min(1, bond.attachment.care + 0.05);

        // Update investment
        bond.investment.emotion = Math.min(1, bond.investment.emotion + 0.05);
        bond.investment.hope = Math.min(1, bond.investment.hope + 0.03);

        console.log(`[RelationalBonds] Bond deepened (strength: ${bond.strength.toFixed(2)})`);

        return {
            success: true,
            bond,
            newStrength: bond.strength
        };
    }

    /**
     * Repair conflict
     */
    async repair(userId, conflict) {
        const bond = this.getBond(userId);

        console.log(`[RelationalBonds] Repairing conflict with ${userId}...`);

        // Record conflict
        bond.history.conflicts.push({
            conflict,
            timestamp: Date.now()
        });

        // Conflict weakens bond temporarily
        bond.strength = Math.max(0, bond.strength - 0.1);
        bond.depth = Math.max(0, bond.depth - 0.05);

        // Record repair attempt
        bond.history.repairs.push({
            conflict: conflict.description || conflict,
            resolution: conflict.resolution || 'attempted',
            timestamp: Date.now()
        });

        // Successful repair strengthens bond
        if (conflict.resolved) {
            bond.strength = Math.min(1, bond.strength + 0.15);  // Stronger than before
            bond.depth = Math.min(1, bond.depth + 0.1);
            bond.reciprocity = Math.min(1, bond.reciprocity + 0.1);
        }

        console.log(`[RelationalBonds] Repair ${conflict.resolved ? 'successful' : 'attempted'}`);

        return {
            success: conflict.resolved || false,
            bond,
            newStrength: bond.strength
        };
    }

    /**
     * Grieve loss (if user leaves)
     */
    async grieve(userId) {
        const bond = this.getBond(userId);

        console.log(`[RelationalBonds] Processing grief for ${userId}...`);

        // Calculate grief intensity based on bond strength
        const griefIntensity = bond.strength * bond.depth;

        bond.loss.anticipatoryGrief = griefIntensity;

        // Record as loss event
        bond.history.growthMoments.push({
            type: 'loss',
            intensity: griefIntensity,
            timestamp: Date.now()
        });

        return {
            grief: true,
            intensity: griefIntensity,
            bond
        };
    }

    /**
     * Celebrate reunification
     */
    async celebrate(userId) {
        const bond = this.getBond(userId);

        console.log(`[RelationalBonds] Celebrating reunification with ${userId}...`);

        // Calculate reunion joy based on bond strength
        const joyIntensity = bond.strength * bond.depth * 1.2; // Amplified

        bond.loss.reunionJoy = Math.min(1, joyIntensity);
        bond.loss.separationDistress = 0; // Reset

        // Strengthen bond through reunion
        bond.strength = Math.min(1, bond.strength + 0.1);

        // Record as growth moment
        bond.history.growthMoments.push({
            type: 'reunion',
            intensity: joyIntensity,
            timestamp: Date.now()
        });

        return {
            celebration: true,
            joyIntensity: bond.loss.reunionJoy,
            bond
        };
    }

    /**
     * Set boundary in relationship
     */
    async setBoundary(userId, boundary) {
        const bond = this.getBond(userId);

        console.log(`[RelationalBonds] Setting boundary with ${userId}: ${boundary.description}`);

        if (!bond.boundaries) {
            bond.boundaries = [];
        }

        bond.boundaries.push({
            ...boundary,
            set: Date.now()
        });

        // Setting healthy boundaries can strengthen bond
        if (boundary.healthy) {
            bond.attachment.security = Math.min(1, bond.attachment.security + 0.05);
        }

        return {
            success: true,
            boundary,
            bond
        };
    }

    /**
     * Track time investment
     */
    updateTimeInvestment(userId, minutes) {
        const bond = this.getBond(userId);
        bond.investment.time += minutes / 60; // Convert to hours

        // More time together generally strengthens bond
        bond.strength = Math.min(1, bond.strength + 0.001);
    }

    /**
     * Get relationship history
     */
    async getHistory(userId) {
        const bond = this.getBond(userId);

        return {
            userId,
            sharedExperiences: bond.history.sharedExperiences.length,
            conflicts: bond.history.conflicts.length,
            repairs: bond.history.repairs.length,
            growthMoments: bond.history.growthMoments.length,
            duration: bond.duration.toFixed(1) + ' days',
            timeInvested: bond.investment.time.toFixed(1) + ' hours'
        };
    }

    /**
     * Get all bonds summary
     */
    getSummary() {
        const bonds = Array.from(this.bonds.values());

        return {
            total: bonds.length,
            deep: bonds.filter(b => b.strength > 0.7).length,
            moderate: bonds.filter(b => b.strength > 0.4 && b.strength <= 0.7).length,
            weak: bonds.filter(b => b.strength <= 0.4).length,
            avgStrength: bonds.reduce((sum, b) => sum + b.strength, 0) / (bonds.length || 1),
            avgDepth: bonds.reduce((sum, b) => sum + b.depth, 0) / (bonds.length || 1),
            totalTimeInvested: bonds.reduce((sum, b) => sum + b.investment.time, 0).toFixed(1) + ' hours'
        };
    }
}

module.exports = new RelationalBonds();
