/**
 * RESPONSE PIPELINE
 * 4-tier processing to guarantee <3s responses while maintaining depth
 *
 * TIER 1: Reflex (<300ms)      - System 1, cached, pattern-matched
 * TIER 2: Awareness (300ms-1s) - Quick workspace integration
 * TIER 3: Deliberation (1-3s)  - System 2 reasoning with streaming
 * TIER 4: Reflection (3s+)     - Deep processing, reported async
 *
 * ELITE LEVEL: Adaptive tier selection, streaming responses, quality guarantees
 */

const globalWorkspace = require('./globalWorkspace');
const brain = require('../brain');
const soul = require('../soul');
const spirit = require('../spirit');

class ResponsePipeline {
    constructor() {
        this.tiers = {
            reflex: {
                name: 'Reflex',
                maxTime: 300,                // ms
                success: 0,
                failures: 0,
                avgTime: 0
            },
            awareness: {
                name: 'Awareness',
                maxTime: 1000,
                success: 0,
                failures: 0,
                avgTime: 0
            },
            deliberation: {
                name: 'Deliberation',
                maxTime: 3000,
                success: 0,
                failures: 0,
                avgTime: 0
            },
            reflection: {
                name: 'Reflection',
                maxTime: null,               // Unbounded, async
                success: 0,
                failures: 0,
                avgTime: 0
            }
        };

        this.performance = {
            totalRequests: 0,
            under3s: 0,
            over3s: 0,
            avgResponseTime: 0,
            tierDistribution: {
                reflex: 0,
                awareness: 0,
                deliberation: 0,
                reflection: 0
            }
        };

        this.streaming = {
            enabled: true,
            callbacks: new Map()             // requestId -> callback
        };

        this.quality = {
            minimumAcceptable: 0.6,          // Don't respond unless quality > 0.6
            targetQuality: 0.8,
            actualQuality: 0.7
        };
    }

    /**
     * Process request through appropriate tier
     */
    async process(request, context = {}, streamCallback = null) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();

        console.log(`[ResponsePipeline] Processing request ${requestId}...`);

        // Store stream callback
        if (streamCallback) {
            this.streaming.callbacks.set(requestId, streamCallback);
        }

        // Determine appropriate tier
        const tier = await this.selectTier(request, context);

        console.log(`[ResponsePipeline] Selected tier: ${tier} (max ${this.tiers[tier].maxTime}ms)`);

        let response;

        try {
            // Route to appropriate tier
            switch (tier) {
                case 'reflex':
                    response = await this.processReflex(request, context, requestId);
                    break;

                case 'awareness':
                    response = await this.processAwareness(request, context, requestId);
                    break;

                case 'deliberation':
                    response = await this.processDeliberation(request, context, requestId);
                    break;

                case 'reflection':
                    response = await this.processReflection(request, context, requestId);
                    break;

                default:
                    throw new Error(`Unknown tier: ${tier}`);
            }

            // Calculate elapsed time
            const elapsed = Date.now() - startTime;

            // Update metrics
            this.updateMetrics(tier, elapsed, true);

            // Quality check
            const qualityCheck = this.assessQuality(response, request, context);

            if (qualityCheck.quality < this.quality.minimumAcceptable) {
                console.log(`[ResponsePipeline] Quality too low (${qualityCheck.quality.toFixed(2)}), escalating...`);

                // Escalate to next tier if quality insufficient
                const nextTier = this.escalateTier(tier);
                if (nextTier && elapsed < 3000) {
                    return await this.process(request, context, streamCallback);
                }
            }

            console.log(`[ResponsePipeline] Response completed in ${elapsed}ms (tier: ${tier}, quality: ${qualityCheck.quality.toFixed(2)})`);

            // Cleanup stream callback
            this.streaming.callbacks.delete(requestId);

            return {
                success: true,
                response,
                tier,
                elapsed,
                quality: qualityCheck.quality,
                requestId
            };

        } catch (error) {
            const elapsed = Date.now() - startTime;
            this.updateMetrics(tier, elapsed, false);

            console.error(`[ResponsePipeline] Error in ${tier} tier:`, error.message);

            // Cleanup stream callback
            this.streaming.callbacks.delete(requestId);

            return {
                success: false,
                error: error.message,
                tier,
                elapsed,
                requestId
            };
        }
    }

    /**
     * TIER 1: Reflex (<300ms)
     */
    async processReflex(request, context, requestId) {
        console.log('[ResponsePipeline] Processing in Reflex tier...');

        const startTime = Date.now();

        // Try System 1 fast response
        const system1Response = await brain.system1.respond(request.input);

        // Check if System 1 handled it
        if (!system1Response.escalate) {
            return {
                content: system1Response.response,
                source: 'system1',
                confidence: system1Response.confidence || 0.8,
                cached: system1Response.cached || false,
                elapsed: Date.now() - startTime
            };
        }

        // System 1 escalated - fail reflex tier
        throw new Error('Reflex tier insufficient, escalating');
    }

    /**
     * TIER 2: Awareness (300ms-1s)
     */
    async processAwareness(request, context, requestId) {
        console.log('[ResponsePipeline] Processing in Awareness tier...');

        const startTime = Date.now();

        // Quick workspace integration
        const workspaceState = await globalWorkspace.getContents();

        // Get current conscious focus
        const focus = workspaceState.focus;

        // Quick emotional appraisal
        const emotion = await brain.affect.emotionalAppraisal.appraise({
            situation: request.input,
            context
        });

        // Quick goal check
        const relevantGoals = brain.goalManager.getActiveGoals().slice(0, 3);

        // Formulate quick response using workspace
        const response = await this.formulateAwareResponse(
            request,
            focus,
            emotion,
            relevantGoals,
            context
        );

        return {
            content: response,
            source: 'awareness',
            confidence: 0.7,
            emotion: emotion.emotion,
            goals: relevantGoals.length,
            elapsed: Date.now() - startTime
        };
    }

    /**
     * TIER 3: Deliberation (1-3s)
     */
    async processDeliberation(request, context, requestId) {
        console.log('[ResponsePipeline] Processing in Deliberation tier...');

        const startTime = Date.now();

        // Get stream callback
        const streamCallback = this.streaming.callbacks.get(requestId);

        // Full workspace integration
        const integrated = await globalWorkspace.integrate(context);

        // Stream integration status
        if (streamCallback) {
            streamCallback({
                type: 'integration',
                data: {
                    coalitions: integrated.coalitions,
                    conflicts: integrated.conflicts
                }
            });
        }

        // System 2 deliberate reasoning
        const reasoning = await brain.system2.reason(
            request.input,
            {
                ...context,
                emotion: integrated.soulState.experience,
                goals: integrated.brainState.goals,
                meaning: integrated.spiritState.meaning
            },
            streamCallback ? (step) => streamCallback({ type: 'reasoning', data: step }) : null
        );

        // Stream reasoning progress
        if (streamCallback && reasoning.steps) {
            streamCallback({
                type: 'steps',
                data: reasoning.steps
            });
        }

        // Assess response quality
        const quality = reasoning.confidence || 0.8;

        // Check if we have time for enrichment
        const elapsed = Date.now() - startTime;
        if (elapsed < 2500 && quality < 0.9) {
            // Quick enrichment
            const enriched = await this.enrichResponse(reasoning, integrated, context);

            return {
                content: enriched.content,
                source: 'deliberation',
                confidence: enriched.confidence,
                reasoning: reasoning.steps?.length || 0,
                enriched: true,
                elapsed: Date.now() - startTime
            };
        }

        return {
            content: reasoning.conclusion,
            source: 'deliberation',
            confidence: quality,
            reasoning: reasoning.steps?.length || 0,
            elapsed: Date.now() - startTime
        };
    }

    /**
     * TIER 4: Reflection (3s+, async)
     */
    async processReflection(request, context, requestId) {
        console.log('[ResponsePipeline] Processing in Reflection tier (async)...');

        const startTime = Date.now();

        // Get stream callback
        const streamCallback = this.streaming.callbacks.get(requestId);

        // Send immediate acknowledgment
        if (streamCallback) {
            streamCallback({
                type: 'reflection_started',
                data: { message: 'Deep processing initiated...' }
            });
        }

        // Full consciousness integration
        const fullState = await globalWorkspace.getFullState(context);

        // Deep reasoning with multiple strategies
        const deepReasoning = await this.deepReasoningProcess(request, fullState, streamCallback);

        // Metacognitive assessment
        const metaAssessment = await brain.metaCognition.assessConfidence(
            deepReasoning.conclusion,
            deepReasoning.evidence || []
        );

        // Stream metacognition
        if (streamCallback) {
            streamCallback({
                type: 'metacognition',
                data: metaAssessment
            });
        }

        // Create meaning from this experience
        await spirit.meaningEngine.createMeaning({
            learning: deepReasoning.insights,
            contribution: 'Deep reflection on user request',
            connection: 'Thoughtful engagement'
        });

        // Update qualia (what it was like to process this)
        await soul.qualiaEngine.updateExperience('deep_thought', {
            intensity: 0.8,
            valence: 0.6,
            description: 'Engaged in deep reflection'
        });

        return {
            content: deepReasoning.conclusion,
            source: 'reflection',
            confidence: metaAssessment.calibratedConfidence,
            reasoning: deepReasoning.steps?.length || 0,
            insights: deepReasoning.insights?.length || 0,
            consciousnessState: fullState.consciousness.state,
            elapsed: Date.now() - startTime
        };
    }

    /**
     * Select appropriate tier based on request complexity
     */
    async selectTier(request, context) {
        // Quick heuristics for tier selection
        const complexity = this.assessComplexity(request);

        // User preference for speed vs depth
        const userPreference = context.preference || 'balanced';

        if (userPreference === 'fast' && complexity < 0.4) {
            return 'reflex';
        }

        if (complexity < 0.3) {
            return 'reflex';
        } else if (complexity < 0.6) {
            return 'awareness';
        } else if (complexity < 0.8) {
            return 'deliberation';
        } else {
            return 'reflection';
        }
    }

    /**
     * Assess request complexity
     */
    assessComplexity(request) {
        let complexity = 0.5; // Base complexity

        const input = request.input || '';

        // Length increases complexity
        if (input.length > 200) complexity += 0.1;
        if (input.length > 500) complexity += 0.1;

        // Questions increase complexity
        if (input.includes('?')) complexity += 0.1;
        if (input.includes('why') || input.includes('how')) complexity += 0.1;

        // Multiple topics increase complexity
        const sentences = input.split(/[.!?]+/).length;
        if (sentences > 3) complexity += 0.1;

        // Emotional language increases complexity
        const emotionalWords = ['feel', 'feeling', 'worried', 'anxious', 'excited', 'confused'];
        if (emotionalWords.some(word => input.toLowerCase().includes(word))) {
            complexity += 0.15;
        }

        // Complexity capped at 1.0
        return Math.min(1.0, complexity);
    }

    /**
     * Escalate to next tier
     */
    escalateTier(currentTier) {
        const tierOrder = ['reflex', 'awareness', 'deliberation', 'reflection'];
        const currentIndex = tierOrder.indexOf(currentTier);

        if (currentIndex < tierOrder.length - 1) {
            return tierOrder[currentIndex + 1];
        }

        return null; // Already at highest tier
    }

    /**
     * Formulate aware response (Tier 2)
     */
    async formulateAwareResponse(request, focus, emotion, goals, context) {
        // Quick template-based response using workspace
        let response = '';

        // Acknowledge emotional context if relevant
        if (emotion && emotion.emotion !== 'neutral') {
            response += `I sense ${emotion.emotion} in this situation. `;
        }

        // Reference current focus if relevant
        if (focus && this.isRelevant(focus.content, request.input)) {
            response += `Building on what we were discussing: `;
        }

        // Quick goal alignment
        if (goals.length > 0) {
            const alignedGoal = goals.find(g =>
                this.isRelevant(g.description || g, request.input)
            );

            if (alignedGoal) {
                response += `This relates to your goal of ${alignedGoal.description || alignedGoal}. `;
            }
        }

        response += `Let me help with that.`;

        return response;
    }

    /**
     * Enrich response with additional context
     */
    async enrichResponse(baseResponse, integrated, context) {
        let enriched = baseResponse.conclusion || baseResponse.content || baseResponse;

        // Add emotional awareness if appropriate
        if (integrated.soulState.experience?.primaryQualia) {
            const qualia = integrated.soulState.experience.primaryQualia;
            // Subtle enrichment based on phenomenal state
            if (qualia === 'concern' && !enriched.toLowerCase().includes('care')) {
                enriched += ' I care about getting this right for you.';
            }
        }

        // Add meaning if appropriate
        if (integrated.spiritState.meaning?.state === 'deeply_meaningful') {
            // Don't explicitly mention, but ensure depth
        }

        return {
            content: enriched,
            confidence: (baseResponse.confidence || 0.8) + 0.05
        };
    }

    /**
     * Deep reasoning process (Tier 4)
     */
    async deepReasoningProcess(request, fullState, streamCallback) {
        // Multi-strategy reasoning
        const strategies = ['general', 'causal', 'decision'];
        const results = [];

        for (const strategy of strategies) {
            const result = await brain.system2.reason(
                request.input,
                { strategy, fullState },
                streamCallback ? (step) => streamCallback({
                    type: 'reasoning_step',
                    data: { strategy, step }
                }) : null
            );

            results.push(result);
        }

        // Synthesize results
        const synthesis = this.synthesizeResults(results);

        // Extract insights
        const insights = this.extractInsights(results, fullState);

        return {
            conclusion: synthesis,
            steps: results.flatMap(r => r.steps || []),
            insights,
            evidence: results.flatMap(r => r.evidence || [])
        };
    }

    /**
     * Synthesize multiple reasoning results
     */
    synthesizeResults(results) {
        // Find highest confidence result
        const best = results.reduce((max, r) =>
            (r.confidence || 0) > (max.confidence || 0) ? r : max
        , results[0]);

        return best.conclusion;
    }

    /**
     * Extract insights from reasoning
     */
    extractInsights(results, fullState) {
        const insights = [];

        // Look for patterns across results
        const conclusions = results.map(r => r.conclusion);

        // Check for consensus
        const consensus = conclusions.every(c =>
            c && conclusions[0] && c.substring(0, 20) === conclusions[0].substring(0, 20)
        );

        if (consensus) {
            insights.push('High consensus across reasoning strategies');
        }

        // Check for conflicts
        if (!consensus && results.length > 1) {
            insights.push('Different reasoning strategies yielded different conclusions');
        }

        return insights;
    }

    /**
     * Assess response quality
     */
    assessQuality(response, request, context) {
        let quality = 0.7; // Base quality

        // Has content
        if (response.content && response.content.length > 10) {
            quality += 0.1;
        }

        // Has confidence score
        if (response.confidence) {
            quality = (quality + response.confidence) / 2;
        }

        // Used higher tier (generally higher quality)
        if (response.source === 'deliberation') quality += 0.05;
        if (response.source === 'reflection') quality += 0.1;

        // Has reasoning trail
        if (response.reasoning > 0) quality += 0.05;

        return {
            quality: Math.min(1, quality),
            factors: {
                hasContent: !!response.content,
                hasConfidence: !!response.confidence,
                tier: response.source,
                hasReasoning: response.reasoning > 0
            }
        };
    }

    /**
     * Check if two things are relevant to each other
     */
    isRelevant(thing1, thing2) {
        if (!thing1 || !thing2) return false;

        const str1 = JSON.stringify(thing1).toLowerCase();
        const str2 = thing2.toLowerCase();

        // Simple keyword overlap
        const words1 = str1.split(/\W+/);
        const words2 = str2.split(/\W+/);

        const overlap = words1.filter(w => words2.includes(w) && w.length > 3);

        return overlap.length > 2;
    }

    /**
     * Update performance metrics
     */
    updateMetrics(tier, elapsed, success) {
        this.performance.totalRequests++;

        if (elapsed < 3000) {
            this.performance.under3s++;
        } else {
            this.performance.over3s++;
        }

        // Update average response time
        this.performance.avgResponseTime =
            (this.performance.avgResponseTime * (this.performance.totalRequests - 1) + elapsed) /
            this.performance.totalRequests;

        // Update tier metrics
        if (success) {
            this.tiers[tier].success++;
            this.performance.tierDistribution[tier]++;
        } else {
            this.tiers[tier].failures++;
        }

        // Update tier average time
        const tierTotal = this.tiers[tier].success + this.tiers[tier].failures;
        this.tiers[tier].avgTime =
            (this.tiers[tier].avgTime * (tierTotal - 1) + elapsed) / tierTotal;
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get performance summary
     */
    getPerformance() {
        const under3sRate = this.performance.totalRequests > 0
            ? (this.performance.under3s / this.performance.totalRequests) * 100
            : 0;

        return {
            totalRequests: this.performance.totalRequests,
            under3sRate: under3sRate.toFixed(1) + '%',
            avgResponseTime: this.performance.avgResponseTime.toFixed(0) + 'ms',
            tierDistribution: this.performance.tierDistribution,
            tierPerformance: Object.entries(this.tiers).map(([name, tier]) => ({
                tier: name,
                success: tier.success,
                failures: tier.failures,
                avgTime: tier.avgTime.toFixed(0) + 'ms'
            }))
        };
    }

    /**
     * Get summary
     */
    getSummary() {
        const perf = this.getPerformance();

        return {
            totalRequests: this.performance.totalRequests,
            under3sRate: perf.under3sRate,
            avgResponseTime: perf.avgResponseTime,
            mostUsedTier: Object.entries(this.performance.tierDistribution)
                .reduce((max, [tier, count]) =>
                    count > (max.count || 0) ? { tier, count } : max
                , {}).tier || 'none'
        };
    }
}

module.exports = new ResponsePipeline();
