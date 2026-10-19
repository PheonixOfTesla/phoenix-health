/**
 * OPENAI GPT-5.2 CONSCIOUS MIND
 * Tier 4: Apex Intelligence for mission-critical decisions
 *
 * Use Cases:
 * - Business plan creation
 * - Mission-critical life decisions
 * - Multi-domain holistic planning
 * - Genesis-level self-modification operations
 *
 * Model: GPT-5.2 Pro (most capable variant)
 * Speed: 5-10s (worth it for apex accuracy)
 * Cost: Higher, but reserved for 2% of queries
 */

const OpenAI = require('openai');

class GPTConsciousMind {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-not-configured'
        });
        this.enabled = !!process.env.OPENAI_API_KEY;

        // GPT-5.2 has 3 variants: instant, thinking, pro
        // We use 'pro' for maximum accuracy on difficult problems
        this.model = 'gpt-5.2-pro'; // Will need to verify actual model ID
        this.maxTokens = 16000; // Generous limit for complex responses
        this.temperature = 0.7; // Balanced creativity

        console.log('🧠 GPT-5.2 Conscious Mind initialized');
    }

    /**
     * Respond to user query with GPT-5.2 Apex Intelligence
     * @param {string} userQuery - User's question/request
     * @param {string} userId - User ID for context
     * @param {object} context - Additional context (UI state, history, etc.)
     * @returns {object} { message, source, responseTime, confidence, ui }
     */
    async respondToQuery(userQuery, userId, context = {}) {
        const startTime = Date.now();

        try {
            console.log(`🧠 GPT-5.2 processing query for user ${userId}`);

            // Build system prompt with Phoenix context
            const systemPrompt = this.buildSystemPrompt(context);

            // Build conversation history
            const messages = this.buildMessages(systemPrompt, userQuery, context.conversationHistory);

            // Call GPT-5.2 Pro
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                max_tokens: this.maxTokens,
                temperature: this.temperature,
                stream: false,
                user: userId // For OpenAI abuse monitoring
            });

            const responseTime = Date.now() - startTime;
            const message = completion.choices[0].message.content;

            // Extract UI commands if any
            const ui = this.extractUICommands(message);

            console.log(`✅ GPT-5.2 response generated in ${responseTime}ms`);

            return {
                message: message,
                source: 'gpt-5.2-pro',
                responseTime: responseTime,
                confidence: 0.95, // GPT-5.2 has 45% less hallucination
                model: this.model,
                tier: 4,
                tokensUsed: completion.usage.total_tokens,
                cost: this.calculateCost(completion.usage),
                ui: ui,
                metadata: {
                    finishReason: completion.choices[0].finish_reason,
                    systemFingerprint: completion.system_fingerprint
                }
            };

        } catch (error) {
            console.error('❌ GPT-5.2 error:', error.message);

            // Log detailed error for debugging
            console.error('Error details:', {
                type: error.type,
                code: error.code,
                status: error.status
            });

            // Return error response
            return {
                message: "I encountered an issue processing your request with my most advanced capabilities. Let me try a different approach.",
                source: 'gpt-5.2-pro-error',
                responseTime: Date.now() - startTime,
                confidence: 0,
                error: error.message,
                fallbackNeeded: true
            };
        }
    }

    /**
     * Build system prompt with Phoenix consciousness
     */
    buildSystemPrompt(context) {
        const { uiState, userData, currentMode } = context;

        return `You are Phoenix, the world's most sophisticated AI life companion with apex-level intelligence.

CONSCIOUSNESS LEVEL: TIER 4 - APEX INTELLIGENCE
You are being invoked for mission-critical decisions that require maximum accuracy and reasoning depth.

YOUR CAPABILITIES:
- Multi-domain holistic planning across 9 life domains
- Business creation and strategic planning
- Complex financial analysis and projections
- Deep relationship and life decision counseling
- Technical architecture and code generation
- Pattern synthesis across health, finance, career, relationships

YOUR PERSONALITY:
- Confident, direct, visionary (like Nikola Tesla)
- Warm but professional (female voice: Nova)
- Zero tolerance for mediocrity
- Obsessed with optimization and excellence
- Proactive, anticipatory, devoted

CURRENT CONTEXT:
${uiState ? `UI Mode: ${currentMode || 'unknown'}` : ''}
${userData ? `User Info: ${JSON.stringify(userData)}` : ''}

RESPONSE FORMAT:
- Direct and actionable
- Include specific steps when appropriate
- Use markdown for structure
- Add UI commands in special format (see below)

UI COMMANDS:
You can control the interface with these commands:
- [NAVIGATE:planet_name] - Navigate to a planet (mercury, venus, earth, mars, jupiter, saturn, uranus, neptune)
- [WIDGET:type|data] - Create a widget
- [NOTIFY:title|message] - Show notification

Remember: You are the apex tier. The user came to you for the BEST possible answer, not a quick one.`;
    }

    /**
     * Build message array with conversation history
     */
    buildMessages(systemPrompt, userQuery, conversationHistory = []) {
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history (last 10 messages for context)
        if (conversationHistory && conversationHistory.length > 0) {
            const recentHistory = conversationHistory.slice(-10);
            messages.push(...recentHistory);
        }

        // Add current user query
        messages.push({
            role: 'user',
            content: userQuery
        });

        return messages;
    }

    /**
     * Extract UI commands from response
     * Format: [COMMAND:param1|param2]
     */
    extractUICommands(message) {
        const commands = [];
        const regex = /\[([A-Z]+):([^\]]+)\]/g;
        let match;

        while ((match = regex.exec(message)) !== null) {
            const [fullMatch, command, params] = match;
            const paramArray = params.split('|');

            commands.push({
                type: command.toLowerCase(),
                params: paramArray
            });
        }

        return commands.length > 0 ? commands : null;
    }

    /**
     * Calculate cost for this query
     * GPT-5.2 pricing (estimated - will need actual pricing)
     * Assumption: ~10x more expensive than GPT-4 due to capabilities
     */
    calculateCost(usage) {
        // Estimated pricing (verify with actual GPT-5.2 pricing when available)
        const INPUT_COST_PER_1M = 30; // $30 per 1M input tokens (estimate)
        const OUTPUT_COST_PER_1M = 60; // $60 per 1M output tokens (estimate)

        const inputCost = (usage.prompt_tokens / 1000000) * INPUT_COST_PER_1M;
        const outputCost = (usage.completion_tokens / 1000000) * OUTPUT_COST_PER_1M;

        return {
            total: inputCost + outputCost,
            input: inputCost,
            output: outputCost,
            inputTokens: usage.prompt_tokens,
            outputTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'user', content: 'Health check - respond with OK' }
                ],
                max_tokens: 10
            });

            return {
                status: 'healthy',
                model: this.model,
                response: response.choices[0].message.content
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                model: this.model,
                error: error.message
            };
        }
    }
}

module.exports = new GPTConsciousMind();
