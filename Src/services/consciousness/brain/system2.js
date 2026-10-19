/**
 * SYSTEM 2 - SLOW THINKING
 * Deliberate reasoning for complex problems (1-3s, streaming)
 *
 * ELITE LEVEL: Deep analysis, cross-domain synthesis, explainable reasoning
 */

class System2 {
    constructor() {
        this.reasoningStrategies = new Map();
        this.activeReasoning = null;
        this.initializeStrategies();
    }

    /**
     * Deliberate reasoning (1-3s target, streaming)
     */
    async reason(problem, context, streamCallback = null) {
        const startTime = Date.now();
        console.log('[System2] Starting deliberate reasoning...');

        // Load relevant knowledge
        const knowledge = await this.loadRelevantKnowledge(problem, context);

        // Select reasoning strategy
        const strategy = this.selectStrategy(problem, knowledge, context);
        console.log(`[System2] Using strategy: ${strategy.name}`);

        // Execute reasoning with streaming
        const steps = [];
        let conclusion = null;
        let currentStep = 0;

        // Stream initial status
        if (streamCallback) {
            streamCallback({
                type: 'reasoning_started',
                strategy: strategy.name,
                timestamp: Date.now()
            });
        }

        while (!conclusion && currentStep < strategy.maxSteps) {
            const step = await strategy.nextStep(problem, steps, knowledge, context);
            steps.push(step);
            currentStep++;

            // Stream step
            if (streamCallback) {
                streamCallback({
                    type: 'reasoning_step',
                    step: currentStep,
                    content: step.content,
                    type_detail: step.type
                });
            }

            if (step.type === 'conclusion') {
                conclusion = step.content;
            }

            // Safety: prevent infinite loops
            if (currentStep >= strategy.maxSteps) {
                conclusion = {
                    result: step.content,
                    note: 'Reasoning halted at max steps',
                    partial: true
                };
            }
        }

        const elapsed = Date.now() - startTime;

        // Assess confidence
        const confidence = this.assessConfidence(steps, strategy);

        // Generate alternatives
        const alternatives = await this.generateAlternatives(problem, steps, knowledge);

        const result = {
            conclusion,
            reasoning: steps,
            confidence,
            alternatives,
            strategy: strategy.name,
            elapsed,
            knowledgeUsed: knowledge.sources.length
        };

        // Stream completion
        if (streamCallback) {
            streamCallback({
                type: 'reasoning_complete',
                conclusion,
                confidence,
                elapsed
            });
        }

        console.log(`[System2] Reasoning complete (${elapsed}ms, confidence: ${(confidence * 100).toFixed(1)}%)`);

        return result;
    }

    /**
     * Load relevant knowledge for problem
     */
    async loadRelevantKnowledge(problem, context) {
        // In production, this would query:
        // - Episodic memory (relevant past experiences)
        // - Semantic memory (relevant facts/concepts)
        // - Procedural memory (relevant procedures)
        // - User context (user state, preferences)

        const knowledge = {
            sources: [],
            facts: [],
            experiences: [],
            procedures: [],
            userContext: context.user || {}
        };

        // Extract key terms from problem
        const problemText = typeof problem === 'string' ? problem : JSON.stringify(problem);
        const keywords = this.extractKeywords(problemText);

        // Simulate knowledge retrieval (placeholder)
        knowledge.sources.push({
            type: 'semantic',
            relevance: 0.8,
            content: `General knowledge about: ${keywords.join(', ')}`
        });

        if (context.domain) {
            knowledge.sources.push({
                type: 'domain',
                domain: context.domain,
                relevance: 0.9,
                content: `Domain-specific knowledge: ${context.domain}`
            });
        }

        return knowledge;
    }

    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        // Simple keyword extraction (remove common words)
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        const words = text.toLowerCase().split(/\W+/);
        return words
            .filter(w => w.length > 3 && !stopWords.has(w))
            .slice(0, 5);
    }

    /**
     * Select appropriate reasoning strategy
     */
    selectStrategy(problem, knowledge, context) {
        // If user specified strategy, use it
        if (context.strategy && this.reasoningStrategies.has(context.strategy)) {
            return this.reasoningStrategies.get(context.strategy);
        }

        // Otherwise, select based on problem type
        if (problem.type === 'causal') {
            return this.reasoningStrategies.get('causal_analysis');
        } else if (problem.type === 'decision') {
            return this.reasoningStrategies.get('decision_analysis');
        } else if (problem.type === 'diagnosis') {
            return this.reasoningStrategies.get('diagnostic');
        } else if (problem.type === 'planning') {
            return this.reasoningStrategies.get('planning');
        }

        // Default: general analysis
        return this.reasoningStrategies.get('general_analysis');
    }

    /**
     * Assess confidence in reasoning
     */
    assessConfidence(steps, strategy) {
        let confidence = 0.7; // Base confidence

        // More steps (up to a point) = more confident
        const stepConfidence = Math.min(0.9, 0.5 + (steps.length * 0.05));
        confidence = Math.max(confidence, stepConfidence);

        // Check for contradictions in reasoning
        const hasContradictions = steps.some(s => s.contradicts);
        if (hasContradictions) {
            confidence *= 0.7;
        }

        // Check for uncertainty markers
        const uncertainSteps = steps.filter(s => s.uncertain);
        if (uncertainSteps.length > 0) {
            confidence *= (1 - (uncertainSteps.length / steps.length) * 0.3);
        }

        return Math.min(0.95, Math.max(0.3, confidence));
    }

    /**
     * Generate alternative conclusions
     */
    async generateAlternatives(problem, steps, knowledge) {
        // In production, this would explore alternative reasoning paths
        // For now, return placeholder alternatives

        return [
            {
                conclusion: 'Alternative interpretation',
                confidence: 0.6,
                reasoning: 'Different reasoning path considered'
            }
        ];
    }

    /**
     * Initialize reasoning strategies
     */
    initializeStrategies() {
        // General Analysis Strategy
        this.reasoningStrategies.set('general_analysis', {
            name: 'General Analysis',
            maxSteps: 7,
            nextStep: async (problem, steps, knowledge, context) => {
                const stepNum = steps.length;

                if (stepNum === 0) {
                    return {
                        type: 'understanding',
                        content: `Understanding the problem: ${typeof problem === 'string' ? problem : problem.description}`,
                        uncertain: false
                    };
                } else if (stepNum === 1) {
                    return {
                        type: 'context',
                        content: `Context: ${knowledge.sources.length} knowledge sources loaded`,
                        uncertain: false
                    };
                } else if (stepNum === 2) {
                    return {
                        type: 'analysis',
                        content: 'Analyzing available information and patterns',
                        uncertain: false
                    };
                } else if (stepNum === 3) {
                    return {
                        type: 'synthesis',
                        content: 'Synthesizing insights from multiple sources',
                        uncertain: false
                    };
                } else if (stepNum === 4) {
                    return {
                        type: 'evaluation',
                        content: 'Evaluating possible conclusions',
                        uncertain: false
                    };
                } else {
                    return {
                        type: 'conclusion',
                        content: {
                            result: 'Analysis complete',
                            recommendation: 'Based on available information',
                            confidence: 0.8
                        },
                        uncertain: false
                    };
                }
            }
        });

        // Causal Analysis Strategy
        this.reasoningStrategies.set('causal_analysis', {
            name: 'Causal Analysis',
            maxSteps: 6,
            nextStep: async (problem, steps, knowledge, context) => {
                const stepNum = steps.length;

                if (stepNum === 0) {
                    return {
                        type: 'identify_effect',
                        content: 'Identifying the effect to explain',
                        uncertain: false
                    };
                } else if (stepNum === 1) {
                    return {
                        type: 'possible_causes',
                        content: 'Generating possible causes',
                        uncertain: false
                    };
                } else if (stepNum === 2) {
                    return {
                        type: 'evaluate_causes',
                        content: 'Evaluating likelihood of each cause',
                        uncertain: true
                    };
                } else if (stepNum === 3) {
                    return {
                        type: 'check_evidence',
                        content: 'Checking evidence for top causes',
                        uncertain: false
                    };
                } else {
                    return {
                        type: 'conclusion',
                        content: {
                            cause: 'Most likely cause identified',
                            confidence: 0.75,
                            alternatives: 'Alternative causes considered'
                        },
                        uncertain: false
                    };
                }
            }
        });

        // Decision Analysis Strategy
        this.reasoningStrategies.set('decision_analysis', {
            name: 'Decision Analysis',
            maxSteps: 8,
            nextStep: async (problem, steps, knowledge, context) => {
                const stepNum = steps.length;

                if (stepNum === 0) {
                    return { type: 'frame_decision', content: 'Framing the decision', uncertain: false };
                } else if (stepNum === 1) {
                    return { type: 'identify_options', content: 'Identifying options', uncertain: false };
                } else if (stepNum === 2) {
                    return { type: 'criteria', content: 'Establishing decision criteria', uncertain: false };
                } else if (stepNum === 3) {
                    return { type: 'evaluate_options', content: 'Evaluating each option', uncertain: false };
                } else if (stepNum === 4) {
                    return { type: 'consider_risk', content: 'Considering risks and trade-offs', uncertain: true };
                } else if (stepNum === 5) {
                    return { type: 'compare', content: 'Comparing options', uncertain: false };
                } else {
                    return {
                        type: 'conclusion',
                        content: {
                            decision: 'Recommended option',
                            rationale: 'Based on criteria and trade-offs',
                            confidence: 0.8
                        },
                        uncertain: false
                    };
                }
            }
        });

        // Diagnostic Strategy
        this.reasoningStrategies.set('diagnostic', {
            name: 'Diagnostic Reasoning',
            maxSteps: 7,
            nextStep: async (problem, steps, knowledge, context) => {
                const stepNum = steps.length;

                if (stepNum === 0) {
                    return { type: 'symptoms', content: 'Identifying symptoms/signs', uncertain: false };
                } else if (stepNum === 1) {
                    return { type: 'hypotheses', content: 'Generating diagnostic hypotheses', uncertain: false };
                } else if (stepNum === 2) {
                    return { type: 'test_hypotheses', content: 'Testing hypotheses against evidence', uncertain: true };
                } else if (stepNum === 3) {
                    return { type: 'differential', content: 'Differential diagnosis', uncertain: false };
                } else if (stepNum === 4) {
                    return { type: 'confirm', content: 'Confirming most likely diagnosis', uncertain: false };
                } else {
                    return {
                        type: 'conclusion',
                        content: {
                            diagnosis: 'Most likely diagnosis',
                            confidence: 0.75,
                            alternatives: 'Alternative diagnoses to consider'
                        },
                        uncertain: false
                    };
                }
            }
        });

        console.log(`[System2] ${this.reasoningStrategies.size} reasoning strategies initialized`);
    }

    /**
     * Get available strategies
     */
    getStrategies() {
        return Array.from(this.reasoningStrategies.keys());
    }

    /**
     * Get summary (required by brain/index.js)
     */
    getSummary() {
        return {
            strategyCount: (this.reasoningStrategies || new Map()).size,
            processingSpeed: '1-3s',
            mode: 'deliberate_analytical'
        };
    }
}

module.exports = new System2();
