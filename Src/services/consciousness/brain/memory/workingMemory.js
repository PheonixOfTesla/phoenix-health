/**
 * WORKING MEMORY
 * Hold and manipulate current information (7±2 items)
 *
 * ELITE LEVEL: Short-term buffer, attention control, active manipulation
 */

class WorkingMemory {
    constructor() {
        this.slots = [];
        this.capacity = 7;                  // Miller's law
        this.centralExecutive = {
            focus: null,
            operations: []
        };
        this.phonologicalLoop = '';         // Verbal rehearsal
        this.visuospatialSketchpad = null;  // Visual/spatial info
    }

    /**
     * Load item into working memory
     */
    async load(item, relevance = 0.5) {
        console.log('[WorkingMemory] Loading item...');

        // If at capacity, remove least relevant item
        if (this.slots.length >= this.capacity) {
            this.evictLeastRelevant();
        }

        const slot = {
            id: `wm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: item,
            relevance,
            decayRate: 0.1,                  // Relevance decreases 10% per minute
            loadedAt: Date.now(),
            lastAccessed: Date.now(),
            accessCount: 1
        };

        this.slots.push(slot);

        console.log(`[Working Memory] Item loaded (${this.slots.length}/${this.capacity} slots used)`);

        return { success: true, slotId: slot.id };
    }

    /**
     * Evict least relevant item
     */
    evictLeastRelevant() {
        if (this.slots.length === 0) return;

        // Sort by relevance (adjusted for decay)
        this.slots.forEach(slot => this.applyDecay(slot));
        this.slots.sort((a, b) => a.relevance - b.relevance);

        const evicted = this.slots.shift();
        console.log(`[WorkingMemory] Evicted item (relevance: ${evicted.relevance.toFixed(2)})`);

        return evicted;
    }

    /**
     * Apply decay to slot
     */
    applyDecay(slot) {
        const minutesElapsed = (Date.now() - slot.lastAccessed) / 60000;
        const decay = slot.decayRate * minutesElapsed;
        slot.relevance = Math.max(0, slot.relevance - decay);
    }

    /**
     * Retrieve item matching query
     */
    async retrieve(query) {
        console.log('[WorkingMemory] Retrieving item...');

        // Update all slot relevances with decay
        this.slots.forEach(slot => this.applyDecay(slot));

        // Search for matching item
        let bestMatch = null;
        let bestScore = 0;

        for (const slot of this.slots) {
            const score = this.matchScore(slot.content, query);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = slot;
            }
        }

        if (bestMatch && bestScore > 0.5) {
            // Update access info
            bestMatch.lastAccessed = Date.now();
            bestMatch.accessCount++;
            bestMatch.relevance = Math.min(1, bestMatch.relevance + 0.1); // Boost on access

            console.log(`[WorkingMemory] Retrieved (score: ${bestScore.toFixed(2)}, accesses: ${bestMatch.accessCount})`);

            return {
                found: true,
                content: bestMatch.content,
                score: bestScore,
                slot: bestMatch
            };
        }

        console.log('[WorkingMemory] No match found');
        return { found: false };
    }

    /**
     * Calculate match score
     */
    matchScore(content, query) {
        // Simple keyword matching
        const contentStr = JSON.stringify(content).toLowerCase();
        const queryStr = JSON.stringify(query).toLowerCase();

        // Exact match
        if (contentStr === queryStr) return 1.0;

        // Contains match
        if (contentStr.includes(queryStr) || queryStr.includes(contentStr)) {
            return 0.8;
        }

        // Word overlap
        const contentWords = new Set(contentStr.split(/\W+/));
        const queryWords = new Set(queryStr.split(/\W+/));
        const intersection = [...contentWords].filter(w => queryWords.has(w));
        const overlap = intersection.length / Math.max(contentWords.size, queryWords.size);

        return overlap;
    }

    /**
     * Rehearse item (prevent decay)
     */
    async rehearse(slotId) {
        const slot = this.slots.find(s => s.id === slotId);

        if (!slot) {
            return { success: false, error: 'Slot not found' };
        }

        // Reset decay
        slot.lastAccessed = Date.now();
        slot.relevance = Math.min(1, slot.relevance + 0.2);

        // Add to phonological loop for verbal rehearsal
        if (typeof slot.content === 'string') {
            this.phonologicalLoop = slot.content;
        }

        console.log(`[WorkingMemory] Rehearsed slot ${slotId}`);

        return { success: true };
    }

    /**
     * Apply decay to all slots
     */
    async decay() {
        this.slots.forEach(slot => this.applyDecay(slot));

        // Remove slots with relevance < 0.1
        const beforeCount = this.slots.length;
        this.slots = this.slots.filter(s => s.relevance >= 0.1);
        const removed = beforeCount - this.slots.length;

        if (removed > 0) {
            console.log(`[WorkingMemory] Decay removed ${removed} slots`);
        }

        return { slotsRemoved: removed };
    }

    /**
     * Consolidate to long-term memory
     */
    async consolidate() {
        // In production, this would transfer high-relevance items to episodic/semantic memory
        const toConsolidate = this.slots.filter(s =>
            s.relevance > 0.7 &&
            s.accessCount > 3
        );

        console.log(`[WorkingMemory] ${toConsolidate.length} items ready for consolidation`);

        return {
            items: toConsolidate.map(s => s.content),
            count: toConsolidate.length
        };
    }

    /**
     * Get working memory state
     */
    getState() {
        return {
            slots: this.slots.length,
            capacity: this.capacity,
            utilization: (this.slots.length / this.capacity * 100).toFixed(0) + '%',
            items: this.slots.map(s => ({
                id: s.id,
                relevance: s.relevance.toFixed(2),
                age: Math.floor((Date.now() - s.loadedAt) / 1000) + 's',
                accesses: s.accessCount
            })),
            phonologicalLoop: this.phonologicalLoop.length > 0 ? 'active' : 'empty'
        };
    }

    /**
     * Clear working memory
     */
    clear() {
        const count = this.slots.length;
        this.slots = [];
        this.phonologicalLoop = '';
        this.visuospatialSketchpad = null;
        this.centralExecutive.operations = [];

        console.log(`[WorkingMemory] Cleared ${count} slots`);

        return { cleared: count };
    }

    /**
     * Set central executive focus
     */
    setFocus(focus) {
        this.centralExecutive.focus = focus;
        console.log(`[WorkingMemory] Central executive focus: ${focus}`);
    }

    /**
     * Execute operation on working memory contents
     */
    async executeOperation(operation) {
        this.centralExecutive.operations.push({
            operation,
            timestamp: Date.now()
        });

        // Keep operations log manageable
        if (this.centralExecutive.operations.length > 20) {
            this.centralExecutive.operations.shift();
        }

        return { success: true };
    }

    /**
     * Get summary (required by brain/index.js)
     */
    getSummary() {
        const buffer = this.buffer || [];
        const capacity = this.capacity || 7;
        return {
            itemCount: buffer.length,
            capacity: capacity,
            utilization: (buffer.length / capacity * 100).toFixed(1) + '%',
            focus: this.centralExecutive?.focus || null
        };
    }
}

module.exports = new WorkingMemory();
