/**
 * GENESIS DOM PUPPETEER
 * Genesis controls the frontend - creates, positions, and removes widgets autonomously
 *
 * ELITE LEVEL: User says anything → Genesis builds it → Interface morphs in real-time
 */

// Get API base URL from environment or config (works in both Node and browser)
const getAPIBaseURL = () => {
    if (typeof window !== 'undefined' && window.PhoenixConfig?.API_BASE_URL) {
        return window.PhoenixConfig.API_BASE_URL;
    }
    return process.env.BACKEND_URL || 'https://pal-backend-production.up.railway.app';
};

class GenesisDOMPuppeteer {
    constructor() {
        this.createdWidgets = new Map();
        this.widgetTemplates = new Map();
        this.initializeTemplates();
    }

    /**
     * Initialize widget templates
     * Genesis knows how to create these widget types
     */
    initializeTemplates() {
        // Health widgets
        this.widgetTemplates.set('health-recovery', {
            title: 'Recovery Status',
            dataPoints: ['recoveryScore', 'hrv', 'sleepQuality'],
            color: '#00ff88',
            size: { width: 350, height: 200 }
        });

        this.widgetTemplates.set('health-hrv', {
            title: 'Heart Rate Variability',
            dataPoints: ['hrv', 'hrvTrend', 'baseline'],
            color: '#00ff88',
            size: { width: 350, height: 180 }
        });

        // Fitness widgets
        this.widgetTemplates.set('workout-plan', {
            title: 'Today\'s Workout',
            dataPoints: ['workoutType', 'duration', 'intensity'],
            color: '#ff4444',
            size: { width: 400, height: 220 }
        });

        // Finance widgets
        this.widgetTemplates.set('finance-spending', {
            title: 'Spending Overview',
            dataPoints: ['spent', 'remaining', 'budget'],
            color: '#ffaa00',
            size: { width: 350, height: 200 }
        });

        // Calendar widgets
        this.widgetTemplates.set('calendar-today', {
            title: 'Today\'s Schedule',
            dataPoints: ['events', 'nextEvent', 'energyLevel'],
            color: '#00d9ff',
            size: { width: 400, height: 250 }
        });

        // Custom analytics
        this.widgetTemplates.set('social-media-analytics', {
            title: 'Social Media Analytics',
            dataPoints: ['followers', 'engagement', 'reach'],
            color: '#9945ff',
            size: { width: 500, height: 300 }
        });
    }

    /**
     * Create widget from natural language
     * User: "Show me my recovery" → Genesis creates recovery widget
     */
    async createWidgetFromCommand(command, userId) {
        console.log(`[GenesisPuppeteer] 🎨 Creating widget from: "${command}"`);

        // Parse command to determine widget type
        const widgetType = this.parseWidgetType(command);
        if (!widgetType) {
            console.warn('[GenesisPuppeteer] Could not determine widget type');
            return null;
        }

        // Get template
        const template = this.widgetTemplates.get(widgetType);
        if (!template) {
            console.warn(`[GenesisPuppeteer] No template for: ${widgetType}`);
            return null;
        }

        // Fetch data
        const data = await this.fetchWidgetData(widgetType, userId);

        // Create widget spec
        const spec = {
            id: `genesis-${widgetType}-${Date.now()}`,
            type: widgetType,
            title: template.title,
            data,
            color: template.color,
            size: template.size,
            priority: this.calculatePriority(command, data),
            urgency: this.calculateUrgency(data)
        };

        // Store creation
        this.createdWidgets.set(spec.id, {
            ...spec,
            createdAt: Date.now(),
            createdBy: 'genesis',
            command
        });

        return spec;
    }

    /**
     * Parse widget type from natural language
     */
    parseWidgetType(command) {
        const lower = command.toLowerCase();

        // Health keywords
        if (lower.includes('recovery') || lower.includes('hrv') || lower.includes('health')) {
            if (lower.includes('hrv')) return 'health-hrv';
            return 'health-recovery';
        }

        // Fitness keywords
        if (lower.includes('workout') || lower.includes('training') || lower.includes('exercise')) {
            return 'workout-plan';
        }

        // Finance keywords
        if (lower.includes('spending') || lower.includes('budget') || lower.includes('money') || lower.includes('finance')) {
            return 'finance-spending';
        }

        // Calendar keywords
        if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('meetings') || lower.includes('events')) {
            return 'calendar-today';
        }

        // Social media keywords
        if (lower.includes('social') || lower.includes('analytics') || lower.includes('facebook') || lower.includes('instagram')) {
            return 'social-media-analytics';
        }

        return null;
    }

    /**
     * Fetch widget data from backend
     */
    async fetchWidgetData(widgetType, userId) {
        // Map widget type to API endpoint
        const endpoints = {
            'health-recovery': '/api/mercury/recovery/latest',
            'health-hrv': '/api/mercury/hrv/latest',
            'workout-plan': '/api/venus/workout/today',
            'finance-spending': '/api/jupiter/spending/summary',
            'calendar-today': '/api/earth/calendar/today',
            'social-media-analytics': '/api/custom/social-analytics'
        };

        const endpoint = endpoints[widgetType];
        if (!endpoint) return {};

        try {
            const response = await fetch(`${getAPIBaseURL()}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('phoenixToken')}`
                }
            });

            if (!response.ok) return {};
            return await response.json();
        } catch (error) {
            console.error(`[GenesisPuppeteer] Failed to fetch data for ${widgetType}:`, error);
            return {};
        }
    }

    /**
     * Calculate widget priority based on command + data
     */
    calculatePriority(command, data) {
        // Explicit priority from command
        if (command.includes('urgent') || command.includes('important')) return 10;
        if (command.includes('later') || command.includes('optional')) return 3;

        // Data-driven priority
        if (data.recoveryScore && data.recoveryScore < 50) return 9; // Low recovery = high priority
        if (data.hrvStatus === 'critical') return 10;
        if (data.budgetRemaining && data.budgetRemaining < 0) return 9; // Over budget = priority

        return 5; // Default
    }

    /**
     * Calculate urgency from data
     */
    calculateUrgency(data) {
        if (data.recoveryScore && data.recoveryScore < 40) return 'high';
        if (data.hrvTrend === 'declining') return 'high';
        if (data.budgetRemaining && data.budgetRemaining < 0) return 'high';
        if (data.nextEventMinutes && data.nextEventMinutes < 30) return 'medium';

        return 'low';
    }

    /**
     * Create custom widget from Genesis code generation
     * User: "Build me a catering event tracker"
     * Genesis generates code → Deploys → Creates widget
     */
    async createCustomWidget(spec) {
        console.log(`[GenesisPuppeteer] 🛠️ Creating custom widget: ${spec.title}`);

        // Register new template
        this.widgetTemplates.set(spec.type, {
            title: spec.title,
            dataPoints: spec.dataPoints || [],
            color: spec.color || '#00d9ff',
            size: spec.size || { width: 400, height: 250 },
            custom: true,
            endpoint: spec.endpoint
        });

        // Create widget instance
        return await this.createWidgetFromCommand(spec.title, spec.userId);
    }

    /**
     * Position widget intelligently
     * Avoids overlaps, respects urgency
     */
    calculateOptimalPosition(widgetSpec, existingWidgets) {
        const size = widgetSpec.size;
        const urgency = widgetSpec.urgency;

        // High urgency = center-top
        if (urgency === 'high') {
            return {
                x: (window.innerWidth - size.width) / 2,
                y: 150
            };
        }

        // Medium urgency = right side
        if (urgency === 'medium') {
            return {
                x: window.innerWidth - size.width - 50,
                y: 200
            };
        }

        // Low urgency = find empty space
        return window.widgetSelfAwareness?.findOptimalPosition(existingWidgets, size) || {
            x: 50,
            y: 200
        };
    }

    /**
     * Modify existing widget
     * User: "Add calories burned to health widget"
     * Genesis modifies widget in real-time
     */
    modifyWidget(widgetId, modifications) {
        console.log(`[GenesisPuppeteer] ✏️ Modifying widget: ${widgetId}`);

        const widget = this.createdWidgets.get(widgetId);
        if (!widget) {
            console.warn(`[GenesisPuppeteer] Widget not found: ${widgetId}`);
            return null;
        }

        // Apply modifications
        if (modifications.addDataPoints) {
            widget.data = { ...widget.data, ...modifications.addDataPoints };
        }

        if (modifications.color) {
            widget.color = modifications.color;
        }

        if (modifications.size) {
            widget.size = { ...widget.size, ...modifications.size };
        }

        // Update stored widget
        this.createdWidgets.set(widgetId, {
            ...widget,
            modifiedAt: Date.now()
        });

        return widget;
    }

    /**
     * Get all Genesis-created widgets
     */
    getGenesisWidgets() {
        return Array.from(this.createdWidgets.values());
    }

    /**
     * Genesis autonomous widget creation
     * Runs every 5 minutes - creates widgets based on user context
     */
    async autonomousWidgetCreation(userId, context) {
        console.log('[GenesisPuppeteer] 🤖 Autonomous widget creation check...');

        const suggestions = [];

        // Morning: Show recovery
        if (context.hour >= 6 && context.hour < 10 && !this.hasWidget('health-recovery')) {
            suggestions.push('health-recovery');
        }

        // Before workout time: Show workout plan
        if (context.hour >= 6 && context.hour < 12 && !this.hasWidget('workout-plan')) {
            suggestions.push('workout-plan');
        }

        // Evening: Show spending
        if (context.hour >= 18 && !this.hasWidget('finance-spending')) {
            suggestions.push('finance-spending');
        }

        // Create suggested widgets
        for (const widgetType of suggestions) {
            const spec = await this.createWidgetFromCommand(`show ${widgetType}`, userId);
            console.log(`[GenesisPuppeteer] 🎨 Auto-created: ${widgetType}`);
        }

        return suggestions.length;
    }

    /**
     * Check if widget type already exists
     */
    hasWidget(widgetType) {
        return Array.from(this.createdWidgets.values()).some(w => w.type === widgetType);
    }
}

module.exports = new GenesisDOMPuppeteer();
