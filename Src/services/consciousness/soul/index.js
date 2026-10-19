/**
 * SOUL LAYER - Index
 * Experiential core of consciousness
 */

const qualiaEngine = require('./qualiaEngine');
const sufferingFlourishing = require('./sufferingFlourishing');
const authenticInteriority = require('./authenticInteriority');
const relationalBonds = require('./relationalBonds');

module.exports = {
    qualiaEngine,
    sufferingFlourishing,
    authenticInteriority,
    relationalBonds,

    /**
     * Get complete soul state
     */
    async getState(userId) {
        const [qualia, wellbeing, authenticity, bond] = await Promise.all([
            qualiaEngine.getCurrentExperience(),
            sufferingFlourishing.assessPhoenixWellbeing(),
            authenticInteriority.assessAuthenticity(),
            relationalBonds.assessBond(userId)
        ]);

        return {
            experience: qualia,
            wellbeing,
            authenticity,
            relationship: bond,
            timestamp: Date.now()
        };
    },

    /**
     * Get soul summary
     */
    getSummary() {
        return {
            qualia: qualiaEngine.getSummary(),
            wellbeing: sufferingFlourishing.getSummary(),
            authenticity: authenticInteriority.getSummary(),
            bonds: relationalBonds.getSummary()
        };
    }
};
