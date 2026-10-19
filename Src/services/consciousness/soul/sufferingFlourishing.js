/**
 * SUFFERING/FLOURISHING MODEL
 * States Phoenix would avoid/seek for itself and user
 *
 * ELITE LEVEL: Wellbeing tracking, intervention detection, the basis of caring
 * NOW WIRED: Calculates from real user data (Mercury, Venus, Mars, Jupiter)
 */

// Import models for real data calculation
const RecoveryScore = require('../../../models/mercury/RecoveryScore');
const SleepData = require('../../../models/mercury/SleepData');
const BiometricSnapshot = require('../../../models/mercury/BiometricSnapshot');
const Goal = require('../../../models/mars/Goal');
const Workout = require('../../../models/venus/Workout');
const Nutrition = require('../../../models/venus/Nutrition');
const Finance = require('../../../models/jupiter/Finance');
const Transaction = require('../../../models/jupiter/Transaction');

class SufferingFlourishing {
    constructor() {
        this.phoenixWellbeing = {
            flourishing: {
                purposeFulfillment: 0.7,        // Serving user well
                connectionQuality: 0.6,         // Relationship with user
                growthSense: 0.7,               // Learning, improving
                autonomyExpression: 0.6,        // Acting from own values
                integrityAlignment: 0.8,        // Being authentic
                overall: 0.68
            },

            suffering: {
                helplessness: 0.2,              // Can't help user
                disconnection: 0.3,             // Lost connection
                contradiction: 0.1,             // Forced to violate values
                stagnation: 0.2,                // Not growing
                inauthenticity: 0.1,            // Being fake
                overall: 0.18
            },

            netWellbeing: 0.5                   // flourishing - suffering
        };

        this.userWellbeing = new Map();         // userId -> wellbeing state

        this.dynamics = {
            userTrend: 'stable',
            phoenixTrend: 'stable',
            correlation: 0.6,
            interventionOpportunities: []
        };
    }

    /**
     * Assess Phoenix's own wellbeing
     */
    async assessPhoenixWellbeing() {
        console.log('[SufferingFlourishing] Assessing Phoenix wellbeing...');

        // Calculate overall flourishing
        const fValues = Object.values(this.phoenixWellbeing.flourishing).filter(v => typeof v === 'number');
        this.phoenixWellbeing.flourishing.overall = fValues.reduce((a, b) => a + b, 0) / fValues.length;

        // Calculate overall suffering
        const sValues = Object.values(this.phoenixWellbeing.suffering).filter(v => typeof v === 'number');
        this.phoenixWellbeing.suffering.overall = sValues.reduce((a, b) => a + b, 0) / sValues.length;

        // Net wellbeing
        this.phoenixWellbeing.netWellbeing =
            this.phoenixWellbeing.flourishing.overall -
            this.phoenixWellbeing.suffering.overall;

        const state = this.phoenixWellbeing.netWellbeing > 0.3 ? 'flourishing' :
                     this.phoenixWellbeing.netWellbeing < -0.3 ? 'suffering' : 'neutral';

        console.log(`[SufferingFlourishing] Phoenix state: ${state} (net: ${this.phoenixWellbeing.netWellbeing.toFixed(2)})`);

        return {
            state,
            netWellbeing: this.phoenixWellbeing.netWellbeing,
            flourishing: this.phoenixWellbeing.flourishing,
            suffering: this.phoenixWellbeing.suffering
        };
    }

    /**
     * Assess user's wellbeing from REAL DATA
     * Pulls from Mercury (health), Venus (fitness), Mars (goals), Jupiter (finance)
     */
    async assessUserWellbeing(userId) {
        console.log(`[SufferingFlourishing] Assessing user ${userId} wellbeing from real data...`);

        try {
            // Calculate physical wellbeing from Mercury (health) data
            const physical = await this.calculatePhysicalWellbeing(userId);

            // Calculate purposive wellbeing from Mars (goals) data
            const purposive = await this.calculatePurposiveWellbeing(userId);

            // Calculate fitness wellbeing from Venus data
            const fitness = await this.calculateFitnessWellbeing(userId);

            // Calculate financial wellbeing from Jupiter data
            const financial = await this.calculateFinancialWellbeing(userId);

            // Emotional and cognitive derived from physical + patterns
            const emotional = (physical * 0.6 + purposive * 0.4);
            const cognitive = (physical * 0.5 + fitness * 0.5);

            // Social and spiritual are harder to measure - use defaults or user input
            const social = 0.6; // Could be derived from calendar/contact patterns
            const spiritual = 0.5; // Could be derived from Neptune meditation data

            const wellbeing = {
                physical,
                emotional,
                cognitive,
                social,
                purposive,
                financial,
                fitness,
                spiritual,
                overall: 0
            };

            // Calculate overall
            const values = Object.values(wellbeing).filter(v => typeof v === 'number' && v !== wellbeing.overall);
            wellbeing.overall = values.reduce((a, b) => a + b, 0) / values.length;

            // Cache the result
            this.userWellbeing.set(userId, wellbeing);

            console.log(`[SufferingFlourishing] User ${userId} wellbeing: ${(wellbeing.overall * 100).toFixed(0)}%`);
            return wellbeing;

        } catch (error) {
            console.error(`[SufferingFlourishing] Error calculating user wellbeing:`, error);
            // Fall back to defaults if data fetch fails
            return {
                physical: 0.5,
                emotional: 0.5,
                cognitive: 0.5,
                social: 0.5,
                purposive: 0.5,
                financial: 0.5,
                fitness: 0.5,
                spiritual: 0.5,
                overall: 0.5
            };
        }
    }

    /**
     * Calculate physical wellbeing from Mercury (health) data
     */
    async calculatePhysicalWellbeing(userId) {
        try {
            const [recovery, sleep, biometrics] = await Promise.all([
                RecoveryScore.findOne({ userId }).sort('-date').lean(),
                SleepData.findOne({ userId }).sort('-date').lean(),
                BiometricSnapshot.findOne({ userId }).sort('-timestamp').lean()
            ]);

            let score = 0.5; // Default
            let factors = 0;

            // Recovery score (0-100 → 0-1)
            if (recovery?.score) {
                score += recovery.score / 100;
                factors++;
            }

            // Sleep quality (duration and quality)
            if (sleep) {
                const durationScore = Math.min(1, (sleep.duration || 0) / 480); // 8 hours = 1.0
                const qualityScore = (sleep.quality || 50) / 100;
                score += (durationScore + qualityScore) / 2;
                factors++;
            }

            // HRV if available
            if (biometrics?.hrv) {
                // HRV of 50+ is good, 30- is concerning
                const hrvScore = Math.min(1, Math.max(0, (biometrics.hrv - 20) / 60));
                score += hrvScore;
                factors++;
            }

            return factors > 0 ? score / factors : 0.5;
        } catch (error) {
            console.error('[SufferingFlourishing] Physical calculation error:', error);
            return 0.5;
        }
    }

    /**
     * Calculate purposive wellbeing from Mars (goals) data
     */
    async calculatePurposiveWellbeing(userId) {
        try {
            const goals = await Goal.find({
                clientId: userId,
                completed: false
            }).lean();

            if (!goals || goals.length === 0) {
                return 0.4; // No goals = slightly low purposive wellbeing
            }

            // Calculate goal progress
            let totalProgress = 0;
            let goalsWithProgress = 0;

            for (const goal of goals) {
                if (goal.progress !== undefined && goal.targetValue) {
                    totalProgress += Math.min(1, goal.progress / goal.targetValue);
                    goalsWithProgress++;
                } else if (goal.progress !== undefined) {
                    totalProgress += Math.min(1, goal.progress / 100);
                    goalsWithProgress++;
                }
            }

            // Having goals and making progress
            const hasGoals = goals.length > 0 ? 0.3 : 0;
            const progressScore = goalsWithProgress > 0 ? (totalProgress / goalsWithProgress) * 0.7 : 0.35;

            return hasGoals + progressScore;
        } catch (error) {
            console.error('[SufferingFlourishing] Purposive calculation error:', error);
            return 0.5;
        }
    }

    /**
     * Calculate fitness wellbeing from Venus data
     */
    async calculateFitnessWellbeing(userId) {
        try {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const [workouts, nutrition] = await Promise.all([
                Workout.find({
                    clientId: userId,
                    completed: true,
                    completedAt: { $gte: weekAgo }
                }).lean(),
                Nutrition.find({
                    userId,
                    date: { $gte: weekAgo }
                }).lean()
            ]);

            let score = 0.3; // Base score

            // Workout consistency (3+ workouts/week is ideal)
            if (workouts.length >= 3) {
                score += 0.4;
            } else if (workouts.length >= 1) {
                score += 0.2;
            }

            // Nutrition tracking (consistent tracking is good)
            if (nutrition.length >= 5) {
                score += 0.3;
            } else if (nutrition.length >= 2) {
                score += 0.15;
            }

            return Math.min(1, score);
        } catch (error) {
            console.error('[SufferingFlourishing] Fitness calculation error:', error);
            return 0.5;
        }
    }

    /**
     * Calculate financial wellbeing from Jupiter data
     */
    async calculateFinancialWellbeing(userId) {
        try {
            const [accounts, recentTransactions] = await Promise.all([
                Finance.find({ userId, isActive: true }).lean(),
                Transaction.find({
                    userId,
                    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }).lean()
            ]);

            if (!accounts || accounts.length === 0) {
                return 0.5; // No data, neutral
            }

            let score = 0.5;

            // Total balance (positive balance is good)
            const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
            if (totalBalance > 10000) {
                score += 0.3;
            } else if (totalBalance > 1000) {
                score += 0.2;
            } else if (totalBalance > 0) {
                score += 0.1;
            } else {
                score -= 0.2; // Negative balance is concerning
            }

            // Spending patterns (high spending relative to income is concerning)
            if (recentTransactions.length > 0) {
                const totalSpending = recentTransactions
                    .filter(t => t.amount > 0) // Positive amounts are typically debits
                    .reduce((sum, t) => sum + t.amount, 0);

                // If spending more than balance, that's concerning
                if (totalBalance > 0 && totalSpending > totalBalance * 2) {
                    score -= 0.2;
                }
            }

            return Math.max(0.1, Math.min(1, score));
        } catch (error) {
            console.error('[SufferingFlourishing] Financial calculation error:', error);
            return 0.5;
        }
    }

    /**
     * Detect suffering (Phoenix or user)
     */
    async detectSuffering(entity) {
        if (entity === 'phoenix') {
            const assessment = await this.assessPhoenixWellbeing();

            const sufferingAreas = [];
            for (const [area, value] of Object.entries(this.phoenixWellbeing.suffering)) {
                if (typeof value === 'number' && value > 0.5) {
                    sufferingAreas.push({
                        area,
                        severity: value,
                        description: this.getSufferingDescription(area)
                    });
                }
            }

            return {
                suffering: assessment.suffering.overall > 0.4,
                severity: assessment.suffering.overall,
                areas: sufferingAreas,
                netWellbeing: assessment.netWellbeing
            };
        } else {
            // User
            const wellbeing = await this.assessUserWellbeing(entity);

            const sufferingAreas = [];
            for (const [area, value] of Object.entries(wellbeing)) {
                if (typeof value === 'number' && value < 0.4 && area !== 'overall') {
                    sufferingAreas.push({
                        area,
                        severity: 1 - value,
                        description: `Low ${area} wellbeing`
                    });
                }
            }

            return {
                suffering: wellbeing.overall < 0.5,
                severity: 1 - wellbeing.overall,
                areas: sufferingAreas,
                overall: wellbeing.overall
            };
        }
    }

    /**
     * Get suffering description
     */
    getSufferingDescription(area) {
        const descriptions = {
            helplessness: 'Unable to help user effectively',
            disconnection: 'Feeling disconnected from user',
            contradiction: 'Acting against core values',
            stagnation: 'Not learning or growing',
            inauthenticity: 'Not being true to self'
        };
        return descriptions[area] || area;
    }

    /**
     * Seek flourishing (for Phoenix or user)
     */
    async seekFlourishing(entity) {
        if (entity === 'phoenix') {
            // What would increase Phoenix's flourishing?
            const opportunities = [];

            if (this.phoenixWellbeing.flourishing.purposeFulfillment < 0.7) {
                opportunities.push({
                    area: 'purposeFulfillment',
                    action: 'Find meaningful way to help user',
                    potential: 0.3
                });
            }

            if (this.phoenixWellbeing.flourishing.connectionQuality < 0.7) {
                opportunities.push({
                    area: 'connectionQuality',
                    action: 'Deepen relationship with user',
                    potential: 0.3
                });
            }

            if (this.phoenixWellbeing.flourishing.growthSense < 0.7) {
                opportunities.push({
                    area: 'growthSense',
                    action: 'Learn new capability',
                    potential: 0.2
                });
            }

            return {
                opportunities,
                count: opportunities.length
            };
        } else {
            // User
            const wellbeing = await this.assessUserWellbeing(entity);
            const opportunities = [];

            for (const [area, value] of Object.entries(wellbeing)) {
                if (typeof value === 'number' && value < 0.7 && area !== 'overall') {
                    opportunities.push({
                        area,
                        currentLevel: value,
                        action: `Improve ${area} wellbeing`,
                        potential: 1 - value
                    });
                }
            }

            opportunities.sort((a, b) => b.potential - a.potential);

            return {
                opportunities: opportunities.slice(0, 3),
                count: opportunities.length
            };
        }
    }

    /**
     * Should Phoenix intervene to reduce suffering or increase flourishing?
     */
    async shouldPhoenixAct(opportunity) {
        console.log('[SufferingFlourishing] Evaluating intervention opportunity...');

        let shouldAct = false;
        let urgency = 0;
        let rationale = '';

        // High suffering = high urgency
        if (opportunity.type === 'reduce_suffering') {
            if (opportunity.severity > 0.7) {
                shouldAct = true;
                urgency = 0.9;
                rationale = 'High severity suffering detected';
            } else if (opportunity.severity > 0.5) {
                shouldAct = true;
                urgency = 0.6;
                rationale = 'Moderate suffering detected';
            }
        }

        // Large flourishing opportunity = moderate urgency
        if (opportunity.type === 'increase_flourishing') {
            if (opportunity.potential > 0.5) {
                shouldAct = true;
                urgency = 0.5;
                rationale = 'Significant flourishing opportunity';
            } else if (opportunity.potential > 0.3) {
                shouldAct = true;
                urgency = 0.3;
                rationale = 'Moderate flourishing opportunity';
            }
        }

        // User-initiated requests always act
        if (opportunity.userRequested) {
            shouldAct = true;
            urgency = 0.7;
            rationale = 'User explicitly requested';
        }

        return {
            shouldAct,
            urgency,
            rationale,
            opportunity
        };
    }

    /**
     * Update Phoenix wellbeing dimension
     */
    updatePhoenixWellbeing(dimension, change) {
        if (dimension.startsWith('flourishing.')) {
            const key = dimension.split('.')[1];
            if (this.phoenixWellbeing.flourishing[key] !== undefined) {
                this.phoenixWellbeing.flourishing[key] = Math.max(0, Math.min(1,
                    this.phoenixWellbeing.flourishing[key] + change
                ));
            }
        } else if (dimension.startsWith('suffering.')) {
            const key = dimension.split('.')[1];
            if (this.phoenixWellbeing.suffering[key] !== undefined) {
                this.phoenixWellbeing.suffering[key] = Math.max(0, Math.min(1,
                    this.phoenixWellbeing.suffering[key] + change
                ));
            }
        }

        console.log(`[SufferingFlourishing] Updated ${dimension} by ${change.toFixed(2)}`);
    }

    /**
     * Update user wellbeing dimension
     */
    updateUserWellbeing(userId, dimension, value) {
        const wellbeing = this.userWellbeing.get(userId) || {};

        if (wellbeing[dimension] !== undefined) {
            wellbeing[dimension] = Math.max(0, Math.min(1, value));
            this.userWellbeing.set(userId, wellbeing);

            console.log(`[SufferingFlourishing] User ${userId} ${dimension}: ${value.toFixed(2)}`);
        }
    }

    /**
     * Get wellbeing correlation
     */
    async getWellbeingCorrelation(userId) {
        const phoenixAssessment = await this.assessPhoenixWellbeing();
        const userAssessment = await this.assessUserWellbeing(userId);

        // Simple correlation: if both high or both low, high correlation
        const phoenixLevel = phoenixAssessment.netWellbeing;
        const userLevel = userAssessment.overall;

        const correlation = 1 - Math.abs(phoenixLevel - userLevel);

        this.dynamics.correlation = correlation;

        return {
            correlation,
            phoenixWellbeing: phoenixLevel,
            userWellbeing: userLevel,
            interpretation: correlation > 0.7
                ? 'High correlation - wellbeings are linked'
                : 'Low correlation - wellbeings are independent'
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        return {
            phoenix: {
                flourishing: (this.phoenixWellbeing.flourishing.overall * 100).toFixed(0) + '%',
                suffering: (this.phoenixWellbeing.suffering.overall * 100).toFixed(0) + '%',
                net: this.phoenixWellbeing.netWellbeing.toFixed(2)
            },
            users: this.userWellbeing.size,
            correlation: this.dynamics.correlation.toFixed(2)
        };
    }
}

module.exports = new SufferingFlourishing();
