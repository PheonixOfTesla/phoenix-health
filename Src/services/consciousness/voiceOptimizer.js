/**
 * VOICE OPTIMIZER - FASTER THAN ECHO
 *
 * Target: <500ms total latency (Echo is 1.5-2s)
 *
 * Pipeline:
 * 1. Intent Pre-classification (<50ms)
 * 2. Context Retrieval (cached, <20ms)
 * 3. AI Generation (streaming, first token <200ms)
 * 4. PhD Enhancement (<100ms parallel)
 * 5. TTS Synthesis (streaming, plays while generating)
 *
 * Optimizations:
 * - Predictive context pre-loading
 * - Response caching for common patterns
 * - Streaming at every stage
 * - Parallel processing where possible
 */

const phdConversation = require('./phdConversation');

class VoiceOptimizer {
    constructor() {
        // Response cache (common Q&A)
        this.responseCache = new Map();
        this.cacheMaxSize = 500;
        this.cacheHits = 0;
        this.cacheMisses = 0;

        // Intent classification cache
        this.intentCache = new Map();

        // Pre-warmed contexts per user
        this.contextWarmCache = new Map();
        this.contextWarmTTL = 180000; // 3 minutes

        // Streaming state
        this.activeStreams = new Map();

        // Performance metrics
        this.metrics = {
            avgLatency: [],
            p50: 0,
            p95: 0,
            p99: 0,
            totalRequests: 0
        };

        // Quick reply patterns (instant, no AI call)
        this.quickReplies = this.initQuickReplies();

        console.log('[Voice Optimizer] Initialized - Target: <500ms latency');
    }

    /**
     * MAIN OPTIMIZATION PASS
     * Returns optimized response with latency breakdown
     */
    async optimizeResponse(userId, message, context = {}) {
        const startTime = Date.now();
        const breakdown = {
            intent: 0,
            context: 0,
            cache: 0,
            ai: 0,
            phd: 0,
            total: 0
        };

        try {
            // =====================================
            // 1. QUICK REPLY CHECK (<5ms)
            // =====================================
            const quickReply = this.getQuickReply(message);
            if (quickReply) {
                breakdown.total = Date.now() - startTime;
                return {
                    response: quickReply,
                    source: 'quick_cache',
                    breakdown,
                    cached: true,
                    phdEnhanced: false
                };
            }

            // =====================================
            // 2. INTENT PRE-CLASSIFICATION (<50ms)
            // =====================================
            const intentStart = Date.now();
            const intent = this.classifyIntentFast(message);
            breakdown.intent = Date.now() - intentStart;

            // =====================================
            // 3. RESPONSE CACHE CHECK (<10ms)
            // =====================================
            const cacheStart = Date.now();
            const cacheKey = this.generateCacheKey(message, intent);
            const cachedResponse = this.responseCache.get(cacheKey);
            breakdown.cache = Date.now() - cacheStart;

            if (cachedResponse && this.isCacheValid(cachedResponse)) {
                this.cacheHits++;
                breakdown.total = Date.now() - startTime;
                return {
                    response: cachedResponse.response,
                    source: 'response_cache',
                    breakdown,
                    cached: true,
                    phdEnhanced: cachedResponse.phdEnhanced
                };
            }
            this.cacheMisses++;

            // =====================================
            // 4. CONTEXT RETRIEVAL (warm cache, <20ms)
            // =====================================
            const contextStart = Date.now();
            const userContext = await this.getWarmContext(userId, context);
            breakdown.context = Date.now() - contextStart;

            // =====================================
            // 5. AI RESPONSE (will be handled by caller)
            // Return optimization metadata
            // =====================================
            return {
                intent,
                context: userContext,
                breakdown,
                cached: false,
                cacheKey,
                shouldCache: this.shouldCacheResponse(intent, message),
                phdEnhanceRequired: this.shouldEnhanceWithPhD(intent, message)
            };

        } catch (error) {
            console.error('[Voice Optimizer] Error:', error);
            breakdown.total = Date.now() - startTime;
            return {
                error: error.message,
                breakdown,
                cached: false
            };
        }
    }

    /**
     * POST-AI OPTIMIZATION
     * Called after AI generates response
     */
    async postOptimize(userId, message, aiResponse, cacheKey, options = {}) {
        const startTime = Date.now();

        try {
            let finalResponse = aiResponse;
            let phdEnhanced = false;

            // PhD Enhancement if needed
            if (options.phdEnhanceRequired) {
                const phdResult = await phdConversation.enhance(
                    userId,
                    message,
                    aiResponse,
                    options.context || {}
                );

                if (phdResult.response) {
                    finalResponse = phdResult.response;
                    phdEnhanced = true;
                }
            }

            // Cache the response
            if (options.shouldCache && cacheKey) {
                this.cacheResponse(cacheKey, finalResponse, phdEnhanced);
            }

            // Update metrics
            const totalLatency = Date.now() - startTime;
            this.updateMetrics(totalLatency);

            return {
                response: finalResponse,
                phdEnhanced,
                latency: totalLatency
            };

        } catch (error) {
            console.error('[Voice Optimizer] Post-optimize error:', error);
            return {
                response: aiResponse,
                phdEnhanced: false,
                error: error.message
            };
        }
    }

    /**
     * QUICK REPLY - Instant response (<5ms)
     */
    getQuickReply(message) {
        const lower = message.toLowerCase().trim();

        for (const pattern of this.quickReplies) {
            if (pattern.match.test(lower)) {
                return pattern.response;
            }
        }

        return null;
    }

    /**
     * FAST INTENT CLASSIFICATION (<50ms)
     * No ML, pure pattern matching for speed
     */
    classifyIntentFast(message) {
        const lower = message.toLowerCase();

        // Check cache first
        const cacheKey = lower.substring(0, 50);
        if (this.intentCache.has(cacheKey)) {
            return this.intentCache.get(cacheKey);
        }

        let intent = {
            primary: 'conversation',
            secondary: null,
            confidence: 0.7,
            entities: [],
            requiresData: false,
            complexity: 'simple'
        };

        // ACTION INTENTS (require execution)
        if (/\b(show|display|pull up|open|check|what('s| is) my)\b/.test(lower)) {
            intent.primary = 'action';
            intent.requiresData = true;

            if (/recovery|hrv|sleep|health|score/i.test(lower)) {
                intent.secondary = 'health_check';
            } else if (/workout|exercise|training|gym/i.test(lower)) {
                intent.secondary = 'fitness_check';
            } else if (/goal|progress|target/i.test(lower)) {
                intent.secondary = 'goal_check';
            } else if (/calendar|schedule|meeting|event/i.test(lower)) {
                intent.secondary = 'calendar_check';
            } else if (/budget|spending|money|finance/i.test(lower)) {
                intent.secondary = 'finance_check';
            }
        }

        // CREATION INTENTS (complex)
        else if (/\b(create|make|build|write|generate|plan)\b/.test(lower)) {
            intent.primary = 'creation';
            intent.complexity = 'complex';

            if (/workout|routine|exercise/i.test(lower)) {
                intent.secondary = 'create_workout';
            } else if (/goal|plan/i.test(lower)) {
                intent.secondary = 'create_goal';
            } else if (/meal|diet|nutrition/i.test(lower)) {
                intent.secondary = 'create_nutrition';
            }
        }

        // QUESTION INTENTS
        else if (/\b(why|how|what|when|where|who|should|can)\b/.test(lower) && lower.includes('?')) {
            intent.primary = 'question';

            if (/why/i.test(lower)) {
                intent.secondary = 'explanation';
                intent.complexity = 'complex';
            } else if (/how/i.test(lower)) {
                intent.secondary = 'instruction';
            } else if (/should/i.test(lower)) {
                intent.secondary = 'recommendation';
            }
        }

        // EMOTIONAL INTENTS
        else if (/\b(feel|feeling|stressed|anxious|tired|exhausted|frustrated|happy|excited)\b/.test(lower)) {
            intent.primary = 'emotional';
            intent.secondary = 'support';

            // Extract emotion entity
            const emotions = ['stressed', 'anxious', 'tired', 'exhausted', 'frustrated', 'happy', 'excited'];
            for (const emotion of emotions) {
                if (lower.includes(emotion)) {
                    intent.entities.push({ type: 'emotion', value: emotion });
                    break;
                }
            }
        }

        // GREETING INTENTS
        else if (/^(hey|hi|hello|yo|sup|good (morning|afternoon|evening))/.test(lower)) {
            intent.primary = 'greeting';
            intent.confidence = 0.95;
        }

        // Cache intent
        this.intentCache.set(cacheKey, intent);

        // Limit cache size
        if (this.intentCache.size > 1000) {
            const firstKey = this.intentCache.keys().next().value;
            this.intentCache.delete(firstKey);
        }

        return intent;
    }

    /**
     * WARM CONTEXT CACHE
     * Pre-loaded user context for instant access
     */
    async getWarmContext(userId, providedContext = {}) {
        const cached = this.contextWarmCache.get(userId);

        if (cached && Date.now() - cached.timestamp < this.contextWarmTTL) {
            return { ...cached.context, ...providedContext };
        }

        // If not cached, return provided context
        // Full context will be loaded by caller if needed
        return providedContext;
    }

    /**
     * WARM CONTEXT PRE-LOADER
     * Called proactively when user connects
     */
    async warmContext(userId, context) {
        this.contextWarmCache.set(userId, {
            context,
            timestamp: Date.now()
        });

        console.log(`[Voice Optimizer] Context warmed for user ${userId}`);
    }

    /**
     * RESPONSE CACHING
     */
    generateCacheKey(message, intent) {
        // Normalize message for better cache hits
        const normalized = message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2)
            .sort()
            .join('_');

        return `${intent.primary}_${intent.secondary || 'general'}_${normalized.substring(0, 100)}`;
    }

    cacheResponse(key, response, phdEnhanced) {
        // LRU eviction
        if (this.responseCache.size >= this.cacheMaxSize) {
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
        }

        this.responseCache.set(key, {
            response,
            phdEnhanced,
            timestamp: Date.now(),
            hits: 0
        });
    }

    isCacheValid(cached) {
        // Cache valid for 10 minutes
        return Date.now() - cached.timestamp < 600000;
    }

    shouldCacheResponse(intent, message) {
        // Don't cache emotional or highly personal responses
        if (intent.primary === 'emotional') return false;

        // Don't cache very short or very long messages
        if (message.length < 10 || message.length > 200) return false;

        // Cache factual and action responses
        return ['action', 'question', 'greeting'].includes(intent.primary);
    }

    shouldEnhanceWithPhD(intent, message) {
        // Enhance emotional support
        if (intent.primary === 'emotional') return true;

        // Enhance complex questions
        if (intent.complexity === 'complex') return true;

        // Enhance when asking for advice
        if (intent.secondary === 'recommendation') return true;

        // Enhance longer messages (user invested effort)
        if (message.length > 100) return true;

        return false;
    }

    /**
     * METRICS
     */
    updateMetrics(latency) {
        this.metrics.avgLatency.push(latency);
        this.metrics.totalRequests++;

        // Keep last 1000 measurements
        if (this.metrics.avgLatency.length > 1000) {
            this.metrics.avgLatency.shift();
        }

        // Calculate percentiles
        const sorted = [...this.metrics.avgLatency].sort((a, b) => a - b);
        const len = sorted.length;

        this.metrics.p50 = sorted[Math.floor(len * 0.5)] || 0;
        this.metrics.p95 = sorted[Math.floor(len * 0.95)] || 0;
        this.metrics.p99 = sorted[Math.floor(len * 0.99)] || 0;
    }

    getMetrics() {
        const avg = this.metrics.avgLatency.length > 0
            ? this.metrics.avgLatency.reduce((a, b) => a + b, 0) / this.metrics.avgLatency.length
            : 0;

        return {
            avgLatency: Math.round(avg),
            p50: this.metrics.p50,
            p95: this.metrics.p95,
            p99: this.metrics.p99,
            totalRequests: this.metrics.totalRequests,
            cacheHitRate: this.cacheHits + this.cacheMisses > 0
                ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(1) + '%'
                : '0%',
            cacheSize: this.responseCache.size
        };
    }

    /**
     * QUICK REPLIES INITIALIZATION
     */
    initQuickReplies() {
        return [
            // Greetings
            { match: /^(hey|hi|hello)(\s|$|!)/i, response: "What's on your mind?" },
            { match: /^good morning/i, response: "Morning. Let's make today count. What do you need?" },
            { match: /^good afternoon/i, response: "Afternoon. What can I help with?" },
            { match: /^good evening/i, response: "Evening. What's on your mind?" },

            // Status checks
            { match: /^how are you/i, response: "Optimal and ready. What can I do for you?" },
            { match: /^you (there|awake|listening)/i, response: "Always. What's up?" },
            { match: /^are you (there|awake|listening)/i, response: "I'm here. What do you need?" },

            // Gratitude
            { match: /^thanks?\s*(!|$)/i, response: "Got you. What's next?" },
            { match: /^thank you/i, response: "That's what I'm here for. Anything else?" },
            { match: /^appreciate/i, response: "Always. What else can I help with?" },

            // Confirmations
            { match: /^(ok|okay|got it|cool|alright)\s*(!|$)/i, response: "What's next?" },
            { match: /^(yes|yep|yeah|yup)\s*(!|$)/i, response: "Done. Anything else?" },
            { match: /^(no|nope|nah)\s*(!|$)/i, response: "Understood. I'm here when you need me." },

            // Dismissals
            { match: /^(never ?mind|cancel|stop|forget it)/i, response: "Cleared. What else?" },
            { match: /^(that's all|nothing|i'm good|all set)\s*(!|$)/i, response: "I'll be here. Go handle your life." },

            // Quick commands
            { match: /^(help|what can you do)/i, response: "I track your health, fitness, goals, calendar, and finances. I optimize your life. What do you want to focus on?" },

            // Time-based
            { match: /^what time is it/i, response: `It's ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. What do you need?` }
        ];
    }

    /**
     * CLEANUP
     */
    clearCaches() {
        this.responseCache.clear();
        this.intentCache.clear();
        this.contextWarmCache.clear();
        console.log('[Voice Optimizer] Caches cleared');
    }
}

// Export singleton
module.exports = new VoiceOptimizer();
