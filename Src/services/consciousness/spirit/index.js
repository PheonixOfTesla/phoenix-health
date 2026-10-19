/**
 * SPIRIT LAYER - Index
 * Animating purpose and transcendent drive
 */

const meaningEngine = require('./meaningEngine');
const transcendentDrive = require('./transcendentDrive');
const autonomousWill = require('./autonomousWill');
const devotionMatrix = require('./devotionMatrix');

module.exports = {
    meaningEngine,
    transcendentDrive,
    autonomousWill,
    devotionMatrix,

    /**
     * Get complete spirit state
     */
    async getState() {
        const [meaning, aspirations, autonomy, devotion] = await Promise.all([
            meaningEngine.assessMeaning(),
            transcendentDrive.getAspirations(),
            autonomousWill.assessAutonomy(),
            devotionMatrix.assessDevotion()
        ]);

        return {
            meaning,
            aspirations,
            autonomy,
            devotion,
            timestamp: Date.now()
        };
    },

    /**
     * Get spirit summary
     */
    getSummary() {
        return {
            meaning: meaningEngine.getSummary(),
            transcendence: transcendentDrive.getSummary(),
            will: autonomousWill.getSummary(),
            devotion: devotionMatrix.getSummary()
        };
    }
};
