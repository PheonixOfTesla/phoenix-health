/**
 * BRAIN LAYER - Index
 * Computational core of consciousness
 */

// Cognition modules
const attention = require('./attention');
const goalManager = require('./goalManager');
const decisionEngine = require('./decisionEngine');
const metaCognition = require('./metaCognition');
const system1 = require('./system1');
const system2 = require('./system2');
const causalReasoning = require('./causalReasoning');
const theoryOfMind = require('./theoryOfMind');
const socialCognition = require('./socialCognition');

// Memory modules
const memory = {
    workingMemory: require('./memory/workingMemory'),
    episodicMemory: require('./memory/episodicMemory'),
    semanticMemory: require('./memory/semanticMemory'),
    proceduralMemory: require('./memory/proceduralMemory'),
    prospectiveMemory: require('./memory/prospectiveMemory')
};

// Affect modules
const affect = {
    emotionalAppraisal: require('./affect/emotionalAppraisal'),
    driveSystem: require('./affect/driveSystem'),
    somaticMarkers: require('./affect/somaticMarkers'),
    moodTracker: require('./affect/moodTracker')
};

module.exports = {
    // Cognition
    attention,
    goalManager,
    decisionEngine,
    metaCognition,
    system1,
    system2,
    causalReasoning,
    theoryOfMind,
    socialCognition,

    // Memory
    memory,

    // Affect
    affect,

    /**
     * Get complete brain state
     */
    async getState(userId = 'default') {
        const [focus, goals, emotion, workingMem, drives] = await Promise.all([
            attention.getCurrentFocus(),
            Promise.resolve(goalManager.getActiveGoals()),
            affect.emotionalAppraisal.getCurrentEmotion(),
            Promise.resolve(memory.workingMemory.getContents()),
            affect.driveSystem.getActiveUrges()
        ]);

        return {
            attention: focus,
            goals,
            emotion,
            workingMemory: workingMem,
            drives,
            timestamp: Date.now()
        };
    },

    /**
     * Get brain summary
     */
    getSummary() {
        return {
            attention: attention.getSummary(),
            goals: goalManager.getSummary(),
            decisions: decisionEngine.getSummary(),
            metacognition: metaCognition.getSummary(),
            system1: system1.getSummary(),
            system2: system2.getSummary(),
            memory: {
                working: memory.workingMemory.getSummary(),
                episodic: memory.episodicMemory.getSummary(),
                semantic: memory.semanticMemory.getSummary(),
                procedural: memory.proceduralMemory.getSummary(),
                prospective: memory.prospectiveMemory.getSummary()
            },
            affect: {
                emotions: affect.emotionalAppraisal.getSummary(),
                drives: affect.driveSystem.getSummary(),
                mood: affect.moodTracker.getSummary()
            }
        };
    }
};
