/**
 * SYSTEM 1 - FAST THINKING
 * Instant pattern-matched responses (<300ms)
 *
 * ELITE LEVEL: Reflexive, intuitive, automatic processing
 */

class System1 {
    constructor() {
        this.patterns = new Map();      // stimulus -> response mapping
        this.heuristics = [];           // Quick decision rules
        this.cache = new Map();         // Recent responses (max 1000)
        this.cacheSize = 1000;
        this.hitCount = 0;
        this.missCount = 0;
    }

    /**
     * Fast response to input (< 300ms target)
     */
    async respond(input) {
        const startTime = Date.now();

        // 1. Check cache (fastest path)
        const cacheKey = this.hashInput(input);
        if (this.cache.has(cacheKey)) {
            this.hitCount++;
            const cached = this.cache.get(cacheKey);
            cached.hitCount++;
            const elapsed = Date.now() - startTime;
            console.log(`[System1] Cache hit (${elapsed}ms)`);
            return {
                response: cached.response,
                confidence: 0.95,
                source: 'cache',
                elapsed
            };
        }

        this.missCount++;

        // 2. Pattern match
        const pattern = this.findPattern(input);
        if (pattern && pattern.confidence > 0.85) {
            const elapsed = Date.now() - startTime;
            console.log(`[System1] Pattern match (${elapsed}ms, confidence: ${pattern.confidence.toFixed(2)})`);

            const response = pattern.response;

            // Cache for next time
            this.cacheResponse(cacheKey, response);

            return {
                response,
                confidence: pattern.confidence,
                source: 'pattern',
                elapsed
            };
        }

        // 3. Apply heuristics
        for (const heuristic of this.heuristics) {
            if (heuristic.applies(input)) {
                const elapsed = Date.now() - startTime;
                console.log(`[System1] Heuristic applied: ${heuristic.name} (${elapsed}ms)`);

                const response = heuristic.apply(input);

                // Cache heuristic responses too
                this.cacheResponse(cacheKey, response);

                return {
                    response,
                    confidence: heuristic.confidence || 0.7,
                    source: 'heuristic',
                    heuristic: heuristic.name,
                    elapsed
                };
            }
        }

        // 4. No fast path found - escalate to System 2
        const elapsed = Date.now() - startTime;
        console.log(`[System1] No match - escalating to System 2 (${elapsed}ms)`);
        return {
            escalate: true,
            reason: 'No pattern or heuristic match',
            elapsed
        };
    }

    /**
     * Hash input for cache lookup
     */
    hashInput(input) {
        const str = typeof input === 'string' ? input : JSON.stringify(input);
        // Simple hash (fast)
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    /**
     * Find matching pattern
     */
    findPattern(input) {
        let bestMatch = null;
        let bestConfidence = 0;

        for (const [stimulusPattern, responsePattern] of this.patterns.entries()) {
            const confidence = this.matchConfidence(input, stimulusPattern);
            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestMatch = {
                    stimulus: stimulusPattern,
                    response: responsePattern,
                    confidence
                };
            }
        }

        return bestMatch;
    }

    /**
     * Calculate match confidence between input and pattern
     */
    matchConfidence(input, pattern) {
        // Exact match
        if (JSON.stringify(input) === JSON.stringify(pattern.stimulus)) {
            return 1.0;
        }

        // Partial match - check key features
        if (typeof input === 'object' && typeof pattern.stimulus === 'object') {
            const inputKeys = Object.keys(input);
            const patternKeys = Object.keys(pattern.stimulus);

            // Check overlap
            const matchingKeys = inputKeys.filter(key =>
                patternKeys.includes(key) &&
                input[key] === pattern.stimulus[key]
            );

            const overlap = matchingKeys.length / Math.max(inputKeys.length, patternKeys.length);
            return overlap;
        }

        // String similarity (simple)
        if (typeof input === 'string' && typeof pattern.stimulus === 'string') {
            const inputLower = input.toLowerCase();
            const patternLower = pattern.stimulus.toLowerCase();

            if (inputLower.includes(patternLower) || patternLower.includes(inputLower)) {
                return 0.7;
            }

            // Word overlap
            const inputWords = new Set(inputLower.split(' '));
            const patternWords = new Set(patternLower.split(' '));
            const intersection = [...inputWords].filter(w => patternWords.has(w));
            return intersection.length / Math.max(inputWords.size, patternWords.size);
        }

        return 0;
    }

    /**
     * Cache a response
     */
    cacheResponse(key, response) {
        // LRU-like: if cache full, remove oldest entry
        if (this.cache.size >= this.cacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            response,
            cached: Date.now(),
            hitCount: 0
        });
    }

    /**
     * Learn new pattern
     */
    async learnPattern(stimulus, response, confidence = 0.8) {
        const pattern = {
            stimulus,
            response,
            confidence,
            learned: Date.now(),
            useCount: 0
        };

        this.patterns.set(stimulus, pattern);
        console.log(`[System1] Learned new pattern (total: ${this.patterns.size})`);

        return { success: true, pattern };
    }

    /**
     * Add heuristic
     */
    addHeuristic(heuristic) {
        this.heuristics.push({
            name: heuristic.name,
            applies: heuristic.applies,  // Function: input -> boolean
            apply: heuristic.apply,      // Function: input -> response
            confidence: heuristic.confidence || 0.7,
            added: Date.now()
        });

        console.log(`[System1] Heuristic added: ${heuristic.name} (total: ${this.heuristics.length})`);
    }

    /**
     * Get performance stats
     */
    getStats() {
        const total = this.hitCount + this.missCount;
        const hitRate = total > 0 ? this.hitCount / total : 0;

        return {
            cache: {
                size: this.cache.size,
                maxSize: this.cacheSize,
                hitCount: this.hitCount,
                missCount: this.missCount,
                hitRate: (hitRate * 100).toFixed(1) + '%'
            },
            patterns: {
                count: this.patterns.size
            },
            heuristics: {
                count: this.heuristics.length
            }
        };
    }

    /**
     * Clear cache (for testing or reset)
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
        console.log(`[System1] Cache cleared (${size} entries removed)`);
    }

    /**
     * Initialize default heuristics
     */
    initializeDefaultHeuristics() {
        // Greeting heuristic
        this.addHeuristic({
            name: 'greeting',
            applies: (input) => {
                const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
                const text = (input.text || input.message || '').toLowerCase();
                return greetings.some(g => text.startsWith(g));
            },
            apply: (input) => ({
                text: 'Hello! How can I help you today?',
                type: 'greeting'
            }),
            confidence: 0.9
        });

        // Thanks heuristic
        this.addHeuristic({
            name: 'gratitude',
            applies: (input) => {
                const thanks = ['thanks', 'thank you', 'appreciate'];
                const text = (input.text || input.message || '').toLowerCase();
                return thanks.some(t => text.includes(t));
            },
            apply: (input) => ({
                text: 'You\'re welcome! Happy to help.',
                type: 'acknowledgment'
            }),
            confidence: 0.9
        });

        // Simple status check
        this.addHeuristic({
            name: 'status_check',
            applies: (input) => {
                const queries = ['how are you', 'how\'s it going', 'status'];
                const text = (input.text || input.message || '').toLowerCase();
                return queries.some(q => text.includes(q));
            },
            apply: (input) => ({
                text: 'I\'m functioning well and ready to assist!',
                type: 'status'
            }),
            confidence: 0.85
        });

        // Help request
        this.addHeuristic({
            name: 'help_request',
            applies: (input) => {
                const text = (input.text || input.message || '').toLowerCase();
                return text.includes('help') && text.split(' ').length < 5;
            },
            apply: (input) => ({
                text: 'I can help with health tracking, fitness planning, calendar management, goals, and more. What would you like to do?',
                type: 'help'
            }),
            confidence: 0.8
        });

        console.log('[System1] Default heuristics initialized');
    }

    /**
     * Get summary (required by brain/index.js)
     */
    getSummary() {
        return {
            heuristicCount: (this.heuristics || []).length,
            processingSpeed: '<300ms',
            mode: 'fast_intuitive'
        };
    }
}

const system1 = new System1();
system1.initializeDefaultHeuristics();

module.exports = system1;
