/**
 * WIDGET TEMPLATES LIBRARY
 * Pre-built widget templates for common tracking scenarios
 * Users can generate widgets from these templates or create custom ones via AI
 */

/**
 * Widget template structure:
 * {
 *   templateId: string,
 *   templateName: string,
 *   category: string,
 *   description: string,
 *   keywords: string[],
 *   widgetType: string,
 *   html: string,
 *   actions: object,
 *   data: object,
 *   trackingFields: string[],
 *   config: object
 * }
 */

const WIDGET_TEMPLATES = {
    // ===================================================================
    // HEALTH & WELLNESS TEMPLATES
    // ===================================================================

    water_intake: {
        templateId: 'water_intake',
        templateName: 'Water Intake Tracker',
        category: 'health',
        description: 'Track daily water consumption in glasses or ounces',
        keywords: ['water', 'hydration', 'drink', 'fluid', 'intake'],
        widgetType: 'template',
        html: `
            <div class="widget-container water-tracker">
                <h3>💧 Water Intake</h3>
                <div class="tracker-display">
                    <span class="value" id="water-count">0</span>
                    <span class="unit">glasses today</span>
                </div>
                <div class="quick-actions">
                    <button class="btn-primary" onclick="logWater(1)">+1 Glass</button>
                    <button class="btn-secondary" onclick="logWater(0.5)">+Half</button>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar" id="water-progress"></div>
                </div>
            </div>
        `,
        actions: {
            log: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            dailyGoal: 8,
            currentCount: 0,
            unit: 'glasses'
        },
        trackingFields: ['glasses', 'timestamp'],
        config: {
            size: 'small',
            theme: 'blue',
            priority: 10
        }
    },

    medication_tracker: {
        templateId: 'medication_tracker',
        templateName: 'Medication Tracker',
        category: 'health',
        description: 'Track medication doses and adherence',
        keywords: ['medication', 'pills', 'medicine', 'dose', 'prescription'],
        widgetType: 'template',
        html: `
            <div class="widget-container medication-tracker">
                <h3>💊 Medication</h3>
                <div class="medication-list" id="med-list">
                    <!-- Populated dynamically -->
                </div>
                <button class="btn-primary" onclick="takeMedication()">✓ Take Medication</button>
                <div class="adherence-rate">
                    <span>Adherence: <strong id="adherence">0%</strong></span>
                </div>
            </div>
        `,
        actions: {
            take: '/api/custom-tracker/{widgetId}/action/take',
            skip: '/api/custom-tracker/{widgetId}/action/skip',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            medications: [],
            adherenceRate: 0
        },
        trackingFields: ['medicationName', 'taken', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'green',
            priority: 5
        }
    },

    mood_tracker: {
        templateId: 'mood_tracker',
        templateName: 'Mood Tracker',
        category: 'mental_health',
        description: 'Track daily mood and emotional state',
        keywords: ['mood', 'emotion', 'feelings', 'mental', 'wellbeing'],
        widgetType: 'template',
        html: `
            <div class="widget-container mood-tracker">
                <h3>😊 Mood Tracker</h3>
                <div class="mood-selector">
                    <button class="mood-btn" onclick="logMood('great')">😄 Great</button>
                    <button class="mood-btn" onclick="logMood('good')">🙂 Good</button>
                    <button class="mood-btn" onclick="logMood('okay')">😐 Okay</button>
                    <button class="mood-btn" onclick="logMood('bad')">😞 Bad</button>
                    <button class="mood-btn" onclick="logMood('terrible')">😢 Terrible</button>
                </div>
                <div class="mood-trend">
                    <span>7-day trend: <strong id="trend">→</strong></span>
                </div>
            </div>
        `,
        actions: {
            log: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            currentMood: null,
            moodHistory: []
        },
        trackingFields: ['mood', 'note', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'yellow',
            priority: 15
        }
    },

    // ===================================================================
    // FITNESS & ACTIVITY TEMPLATES
    // ===================================================================

    workout_tracker: {
        templateId: 'workout_tracker',
        templateName: 'Workout Tracker',
        category: 'fitness',
        description: 'Log workouts and exercise sessions',
        keywords: ['workout', 'exercise', 'training', 'gym', 'fitness'],
        widgetType: 'template',
        html: `
            <div class="widget-container workout-tracker">
                <h3>💪 Workout Log</h3>
                <div class="workout-stats">
                    <span class="stat">
                        <strong id="workout-count">0</strong> workouts this week
                    </span>
                </div>
                <button class="btn-primary" onclick="logWorkout()">Log Workout</button>
                <div class="weekly-progress">
                    <div class="progress-dots" id="workout-dots"></div>
                </div>
            </div>
        `,
        actions: {
            log: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            weeklyGoal: 4,
            weeklyCount: 0,
            lastWorkout: null
        },
        trackingFields: ['workoutType', 'duration', 'intensity', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'red',
            priority: 20
        }
    },

    steps_counter: {
        templateId: 'steps_counter',
        templateName: 'Daily Steps Counter',
        category: 'fitness',
        description: 'Track daily step count and walking activity',
        keywords: ['steps', 'walking', 'activity', 'movement', 'pedometer'],
        widgetType: 'template',
        html: `
            <div class="widget-container steps-counter">
                <h3>👟 Steps Today</h3>
                <div class="tracker-display">
                    <span class="value" id="steps-count">0</span>
                    <span class="unit">steps</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar" id="steps-progress"></div>
                    <span class="goal-label">Goal: 10,000</span>
                </div>
            </div>
        `,
        actions: {
            update: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            dailyGoal: 10000,
            currentSteps: 0
        },
        trackingFields: ['steps', 'timestamp'],
        config: {
            size: 'small',
            theme: 'orange',
            priority: 25
        }
    },

    // ===================================================================
    // HABITS & PRODUCTIVITY TEMPLATES
    // ===================================================================

    habit_tracker: {
        templateId: 'habit_tracker',
        templateName: 'Habit Tracker',
        category: 'productivity',
        description: 'Track daily habits and build streaks',
        keywords: ['habit', 'routine', 'streak', 'daily', 'consistency'],
        widgetType: 'template',
        html: `
            <div class="widget-container habit-tracker">
                <h3>✓ Habit Tracker</h3>
                <div class="habit-list" id="habit-list">
                    <!-- Populated dynamically -->
                </div>
                <div class="streak-display">
                    <span>🔥 Current Streak: <strong id="streak">0</strong> days</span>
                </div>
            </div>
        `,
        actions: {
            check: '/api/custom-tracker/{widgetId}/action/check',
            uncheck: '/api/custom-tracker/{widgetId}/action/uncheck',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            habits: [],
            currentStreak: 0,
            longestStreak: 0
        },
        trackingFields: ['habitName', 'completed', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'purple',
            priority: 12
        }
    },

    pomodoro_timer: {
        templateId: 'pomodoro_timer',
        templateName: 'Pomodoro Timer',
        category: 'productivity',
        description: 'Track focused work sessions using Pomodoro technique',
        keywords: ['pomodoro', 'focus', 'timer', 'productivity', 'work'],
        widgetType: 'template',
        html: `
            <div class="widget-container pomodoro-timer">
                <h3>🍅 Pomodoro Timer</h3>
                <div class="timer-display" id="timer">25:00</div>
                <div class="timer-controls">
                    <button class="btn-primary" onclick="startPomodoro()">Start</button>
                    <button class="btn-secondary" onclick="pausePomodoro()">Pause</button>
                    <button class="btn-secondary" onclick="resetPomodoro()">Reset</button>
                </div>
                <div class="session-count">
                    <span>Sessions today: <strong id="sessions">0</strong></span>
                </div>
            </div>
        `,
        actions: {
            complete: '/api/custom-tracker/{widgetId}/action/complete',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            focusDuration: 25,
            breakDuration: 5,
            sessionsToday: 0
        },
        trackingFields: ['duration', 'completed', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'red',
            priority: 18
        }
    },

    // ===================================================================
    // LIFESTYLE & PERSONAL TEMPLATES
    // ===================================================================

    gratitude_journal: {
        templateId: 'gratitude_journal',
        templateName: 'Gratitude Journal',
        category: 'lifestyle',
        description: 'Daily gratitude entries and reflections',
        keywords: ['gratitude', 'journal', 'thankful', 'reflection', 'mindfulness'],
        widgetType: 'template',
        html: `
            <div class="widget-container gratitude-journal">
                <h3>🙏 Gratitude Journal</h3>
                <div class="journal-entry">
                    <textarea id="gratitude-text" placeholder="What are you grateful for today?"></textarea>
                    <button class="btn-primary" onclick="saveGratitude()">Save Entry</button>
                </div>
                <div class="entry-count">
                    <span>Entries this month: <strong id="entry-count">0</strong></span>
                </div>
            </div>
        `,
        actions: {
            save: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            entries: [],
            monthlyCount: 0
        },
        trackingFields: ['entry', 'timestamp'],
        config: {
            size: 'large',
            theme: 'pink',
            priority: 30
        }
    },

    baby_tracker: {
        templateId: 'baby_tracker',
        templateName: 'Baby Activity Tracker',
        category: 'lifestyle',
        description: 'Track baby feeding, sleep, and diaper changes',
        keywords: ['baby', 'infant', 'feeding', 'diaper', 'sleep', 'newborn'],
        widgetType: 'template',
        html: `
            <div class="widget-container baby-tracker">
                <h3>👶 Baby Tracker</h3>
                <div class="quick-actions">
                    <button class="btn-primary" onclick="logActivity('feed')">🍼 Feed</button>
                    <button class="btn-primary" onclick="logActivity('sleep')">😴 Sleep</button>
                    <button class="btn-primary" onclick="logActivity('diaper')">🧷 Diaper</button>
                </div>
                <div class="last-activity">
                    <span>Last feed: <strong id="last-feed">-</strong></span>
                </div>
            </div>
        `,
        actions: {
            log: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            lastFeed: null,
            lastSleep: null,
            lastDiaper: null
        },
        trackingFields: ['activityType', 'duration', 'note', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'cyan',
            priority: 8
        }
    },

    alcohol_tracker: {
        templateId: 'alcohol_tracker',
        templateName: 'Alcohol Intake Tracker',
        category: 'lifestyle',
        description: 'Track alcoholic drinks and maintain awareness',
        keywords: ['alcohol', 'drinks', 'shots', 'beer', 'wine', 'cocktails'],
        widgetType: 'template',
        html: `
            <div class="widget-container alcohol-tracker">
                <h3>🍺 Alcohol Tracker</h3>
                <div class="tracker-display">
                    <span class="value" id="drink-count">0</span>
                    <span class="unit">drinks tonight</span>
                </div>
                <div class="quick-actions">
                    <button class="btn-primary" onclick="logDrink('beer')">🍺 Beer</button>
                    <button class="btn-primary" onclick="logDrink('wine')">🍷 Wine</button>
                    <button class="btn-primary" onclick="logDrink('shot')">🥃 Shot</button>
                    <button class="btn-primary" onclick="logDrink('cocktail')">🍹 Cocktail</button>
                </div>
                <div class="weekly-summary">
                    <span>This week: <strong id="weekly-total">0</strong> drinks</span>
                </div>
            </div>
        `,
        actions: {
            log: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            tonightCount: 0,
            weeklyCount: 0,
            weeklyLimit: 14
        },
        trackingFields: ['drinkType', 'quantity', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'amber',
            priority: 22
        }
    },

    // ===================================================================
    // FINANCE TEMPLATES
    // ===================================================================

    expense_tracker: {
        templateId: 'expense_tracker',
        templateName: 'Quick Expense Tracker',
        category: 'finance',
        description: 'Log daily expenses and spending',
        keywords: ['expense', 'spending', 'money', 'budget', 'cost'],
        widgetType: 'template',
        html: `
            <div class="widget-container expense-tracker">
                <h3>💰 Expenses</h3>
                <div class="expense-input">
                    <input type="number" id="amount" placeholder="Amount">
                    <input type="text" id="category" placeholder="Category">
                    <button class="btn-primary" onclick="logExpense()">Add</button>
                </div>
                <div class="daily-total">
                    <span>Today: <strong>$<span id="daily-total">0.00</span></strong></span>
                </div>
            </div>
        `,
        actions: {
            log: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            dailyTotal: 0,
            monthlyTotal: 0,
            budget: 0
        },
        trackingFields: ['amount', 'category', 'note', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'green',
            priority: 16
        }
    },

    // ===================================================================
    // SOCIAL & RELATIONSHIPS TEMPLATES
    // ===================================================================

    contact_tracker: {
        templateId: 'contact_tracker',
        templateName: 'Stay in Touch Tracker',
        category: 'social',
        description: 'Track when you last contacted friends and family',
        keywords: ['contact', 'friends', 'family', 'social', 'relationships', 'call'],
        widgetType: 'template',
        html: `
            <div class="widget-container contact-tracker">
                <h3>📱 Stay in Touch</h3>
                <div class="contact-list" id="contact-list">
                    <!-- Populated dynamically -->
                </div>
                <button class="btn-primary" onclick="logContact()">Log Contact</button>
            </div>
        `,
        actions: {
            log: '/api/custom-tracker/{widgetId}/log',
            history: '/api/custom-tracker/{widgetId}/history'
        },
        data: {
            contacts: [],
            lastContact: null
        },
        trackingFields: ['contactName', 'method', 'note', 'timestamp'],
        config: {
            size: 'medium',
            theme: 'blue',
            priority: 28
        }
    }
};

/**
 * Get all widget templates
 */
function getAllTemplates() {
    return Object.values(WIDGET_TEMPLATES);
}

/**
 * Get templates by category
 */
function getTemplatesByCategory(category) {
    return Object.values(WIDGET_TEMPLATES).filter(
        template => template.category === category
    );
}

/**
 * Get template by ID
 */
function getTemplateById(templateId) {
    return WIDGET_TEMPLATES[templateId] || null;
}

/**
 * Search templates by keywords
 */
function searchTemplates(query) {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(WIDGET_TEMPLATES).filter(template => {
        const nameMatch = template.templateName.toLowerCase().includes(lowercaseQuery);
        const descMatch = template.description.toLowerCase().includes(lowercaseQuery);
        const keywordMatch = template.keywords.some(keyword =>
            keyword.toLowerCase().includes(lowercaseQuery)
        );
        return nameMatch || descMatch || keywordMatch;
    });
}

/**
 * Get template categories
 */
function getCategories() {
    const categories = new Set();
    Object.values(WIDGET_TEMPLATES).forEach(template => {
        categories.add(template.category);
    });
    return Array.from(categories);
}

/**
 * Create widget from template
 */
function createWidgetFromTemplate(templateId, customizations = {}) {
    const template = getTemplateById(templateId);
    if (!template) {
        throw new Error(`Template ${templateId} not found`);
    }

    // Generate unique widget ID
    const widgetId = `${templateId}_${Date.now()}`;

    // Merge template with customizations
    const widget = {
        widgetId,
        widgetName: customizations.widgetName || template.templateName,
        widgetType: 'template',
        html: template.html.replace(/{widgetId}/g, widgetId),
        actions: Object.fromEntries(
            Object.entries(template.actions).map(([key, value]) => [
                key,
                value.replace(/{widgetId}/g, widgetId)
            ])
        ),
        data: { ...template.data, ...(customizations.data || {}) },
        trackingFields: template.trackingFields,
        config: { ...template.config, ...(customizations.config || {}) },
        generation: {
            source: 'template',
            templateId: template.templateId,
            generatedBy: 'manual',
            generatedAt: new Date()
        }
    };

    return widget;
}

module.exports = {
    WIDGET_TEMPLATES,
    getAllTemplates,
    getTemplatesByCategory,
    getTemplateById,
    searchTemplates,
    getCategories,
    createWidgetFromTemplate
};
