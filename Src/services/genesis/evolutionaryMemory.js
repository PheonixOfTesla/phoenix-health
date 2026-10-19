/**
 * GENESIS EVOLUTIONARY MEMORY
 *
 * Remembers what Genesis built and learns from success/failure.
 * This is how Genesis gets smarter over time.
 */

const fs = require('fs').promises;
const path = require('path');

class EvolutionaryMemory {
    constructor() {
        this.creations = [];
        this.memoryPath = path.join(__dirname, 'memory.json');
        this.loadMemory();
    }

    /**
     * Load memory from disk
     */
    async loadMemory() {
        try {
            const data = await fs.readFile(this.memoryPath, 'utf8');
            this.creations = JSON.parse(data);
            console.log(`[Genesis] Loaded ${this.creations.length} memories`);
        } catch (error) {
            // No memory file yet, that's fine
            this.creations = [];
        }
    }

    /**
     * Save memory to disk
     */
    async saveMemory() {
        try {
            await fs.writeFile(
                this.memoryPath,
                JSON.stringify(this.creations, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error('[Genesis] Failed to save memory:', error);
        }
    }

    /**
     * Remember a creation
     */
    async remember(creation) {
        const memory = {
            id: Date.now().toString(),
            timestamp: new Date(),
            request: creation.request,
            intent: creation.intent,
            filesCreated: creation.files,
            success: creation.success,
            error: creation.error || null,
            testResults: creation.testResults || null,
            userFeedback: null // Will be updated later
        };

        this.creations.push(memory);
        await this.saveMemory();

        console.log('[Genesis] Memory saved:', memory.id);
        return memory;
    }

    /**
     * Record user feedback on a creation
     */
    async recordFeedback(creationId, feedback) {
        const memory = this.creations.find(c => c.id === creationId);
        if (memory) {
            memory.userFeedback = feedback;
            await this.saveMemory();
            console.log('[Genesis] Feedback recorded for:', creationId);
        }
    }

    /**
     * Find similar past creations
     */
    findSimilar(request) {
        const keywords = this.extractKeywords(request);
        const similar = [];

        for (const memory of this.creations) {
            const memoryKeywords = this.extractKeywords(memory.request);
            const similarity = this.calculateSimilarity(keywords, memoryKeywords);

            if (similarity > 0.5) {
                similar.push({
                    ...memory,
                    similarity
                });
            }
        }

        return similar.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Extract keywords from request
     */
    extractKeywords(text) {
        const stopWords = ['i', 'want', 'to', 'a', 'the', 'is', 'are', 'for', 'and', 'or'];
        return text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));
    }

    /**
     * Calculate similarity between keyword sets
     */
    calculateSimilarity(keywords1, keywords2) {
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }

    /**
     * Get success rate statistics
     */
    getStats() {
        const total = this.creations.length;
        const successful = this.creations.filter(c => c.success).length;
        const failed = total - successful;

        const avgTestsPerCreation = this.creations
            .filter(c => c.testResults)
            .reduce((sum, c) => sum + (c.testResults.passed + c.testResults.failed), 0) / total;

        return {
            total,
            successful,
            failed,
            successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0,
            avgTestsPerCreation: avgTestsPerCreation || 0
        };
    }

    /**
     * Get all creations
     */
    getAll() {
        return this.creations;
    }

    /**
     * Get creation by ID
     */
    getById(id) {
        return this.creations.find(c => c.id === id);
    }
}

module.exports = new EvolutionaryMemory();
