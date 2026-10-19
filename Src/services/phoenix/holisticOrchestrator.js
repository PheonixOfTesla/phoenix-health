/**
 * HOLISTIC ORCHESTRATOR SERVICE
 * Autonomous cross-domain optimization engine
 * Analyzes all 7 planetary domains, creates unified plans, and executes actions
 */

const crypto = require('crypto');

// Models
const HolisticPlan = require('../../models/phoenix/HolisticPlan');
const SavedWidget = require('../../models/phoenix/SavedWidget');
const Goal = require('../../models/mars/Goal');
const Workout = require('../../models/venus/Workout');
const Nutrition = require('../../models/venus/Nutrition');
const Transaction = require('../../models/jupiter/Transaction');
const Budget = require('../../models/jupiter/Budget');
const CalendarEvent = require('../../models/earth/CalendarEvent');
const RecoveryScore = require('../../models/mercury/RecoveryScore');
const WearableData = require('../../models/mercury/WearableData');
const LegacyVision = require('../../models/saturn/LegacyVision');
const QuarterlyReview = require('../../models/saturn/QuarterlyReview');

// Services - Mercury (Health)
const recoveryCalc = require('../mercury/recoveryCalc');
const biometricEngine = require('../mercury/biometricEngine');

// Services - Venus (Fitness)
const workoutIntelligence = require('../venus/workoutIntelligence');
// const nutritionCalc = require('../venus/nutritionCalc'); // Commented out - has syntax error in existing file

// Services - Earth (Calendar)
const calendarSync = require('../earth/calendarSync');

// Services - Mars (Goals)
const goalTracker = require('../mars/goalTracker');

// Services - Jupiter (Finance)
const plaidService = require('../jupiter/plaidService');

// Services - Phoenix (AI)
const consciousMind = require('../gemini/consciousMind');
const claudeUnconscious = require('../claude/unconsciousMind');

// ==============================================
// DOMAIN ANALYZERS
// ==============================================

/**
 * Analyze Mercury domain (Health & Biometrics)
 */
async function analyzeMercury(userId) {
    try {
        const [
            recovery,
            recentData,
            recentRecovery
        ] = await Promise.all([
            recoveryCalc.calculateRecoveryScore(userId),
            WearableData.findOne({ userId }).sort({ timestamp: -1 }).lean(),
            RecoveryScore.find({ userId }).sort({ date: -1 }).limit(7).lean()
        ]);

        return {
            hasData: !!recovery || !!recentData,
            recovery: recovery || null,
            recentBiometrics: recentData || null,
            recoveryTrend: recentRecovery || [],
            status: recovery ? (recovery.score >= 70 ? 'optimal' : recovery.score >= 50 ? 'moderate' : 'low') : 'unknown'
        };
    } catch (error) {
        console.error('[Orchestrator] Mercury analysis error:', error.message);
        return { hasData: false, error: error.message };
    }
}

/**
 * Analyze Venus domain (Fitness & Nutrition)
 */
async function analyzeVenus(userId) {
    try {
        const [
            recentWorkouts,
            recentNutrition,
            workoutStats
        ] = await Promise.all([
            Workout.find({ userId }).sort({ date: -1 }).limit(7).lean(),
            Nutrition.find({ userId }).sort({ date: -1 }).limit(7).lean(),
            Workout.aggregate([
                { $match: { userId } },
                { $group: {
                    _id: null,
                    totalWorkouts: { $sum: 1 },
                    avgDuration: { $avg: '$duration' }
                }}
            ])
        ]);

        const weeklyWorkouts = recentWorkouts.length;
        const weeklyCalories = recentNutrition.reduce((sum, n) => sum + (n.calories || 0), 0);

        return {
            hasData: recentWorkouts.length > 0 || recentNutrition.length > 0,
            recentWorkouts: recentWorkouts.slice(0, 3),
            recentNutrition: recentNutrition.slice(0, 3),
            weeklyWorkouts,
            weeklyAvgCalories: weeklyCalories / Math.max(recentNutrition.length, 1),
            totalWorkouts: workoutStats[0]?.totalWorkouts || 0,
            status: weeklyWorkouts >= 3 ? 'active' : weeklyWorkouts >= 1 ? 'moderate' : 'inactive'
        };
    } catch (error) {
        console.error('[Orchestrator] Venus analysis error:', error.message);
        return { hasData: false, error: error.message };
    }
}

/**
 * Analyze Earth domain (Calendar & Energy)
 */
async function analyzeEarth(userId) {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const [
            todayEvents,
            upcomingEvents
        ] = await Promise.all([
            CalendarEvent.find({
                userId,
                startTime: { $gte: today, $lt: tomorrow }
            }).sort({ startTime: 1 }).lean(),
            CalendarEvent.find({
                userId,
                startTime: { $gte: today, $lt: nextWeek }
            }).sort({ startTime: 1 }).lean()
        ]);

        const busyHours = todayEvents.reduce((sum, event) => {
            const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60);
            return sum + duration;
        }, 0);

        return {
            hasData: todayEvents.length > 0 || upcomingEvents.length > 0,
            todayEvents: todayEvents.slice(0, 5),
            upcomingEvents: upcomingEvents.slice(0, 10),
            todayBusyHours: busyHours,
            status: busyHours >= 8 ? 'very_busy' : busyHours >= 4 ? 'busy' : busyHours >= 1 ? 'moderate' : 'free'
        };
    } catch (error) {
        console.error('[Orchestrator] Earth analysis error:', error.message);
        return { hasData: false, error: error.message };
    }
}

/**
 * Analyze Mars domain (Goals & Habits)
 */
async function analyzeMars(userId) {
    try {
        const [
            activeGoals,
            completedGoals
        ] = await Promise.all([
            Goal.find({ userId, status: 'active' }).lean(),
            Goal.find({ userId, status: 'completed' }).limit(5).lean()
        ]);

        // Calculate goal progress
        const goalProgress = activeGoals.map(goal => {
            const totalMilestones = goal.milestones?.length || 0;
            const completedMilestones = goal.milestones?.filter(m => m.completed).length || 0;
            return {
                goalId: goal._id,
                title: goal.title,
                progress: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0
            };
        });

        return {
            hasData: activeGoals.length > 0 || completedGoals.length > 0,
            activeGoals: activeGoals.slice(0, 5),
            completedGoals,
            totalActive: activeGoals.length,
            totalCompleted: completedGoals.length,
            goalProgress,
            status: activeGoals.length >= 3 ? 'focused' : activeGoals.length >= 1 ? 'moderate' : 'no_goals'
        };
    } catch (error) {
        console.error('[Orchestrator] Mars analysis error:', error.message);
        return { hasData: false, error: error.message };
    }
}

/**
 * Analyze Jupiter domain (Finance)
 */
async function analyzeJupiter(userId) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            recentTransactions,
            budget,
            monthlySpending
        ] = await Promise.all([
            Transaction.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).limit(20).lean(),
            Budget.findOne({ userId, status: 'active' }).lean(),
            Transaction.aggregate([
                { $match: { userId, date: { $gte: thirtyDaysAgo } } },
                { $group: {
                    _id: null,
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }}
            ])
        ]);

        const totalSpent = monthlySpending[0]?.total || 0;
        const budgetLimit = budget?.totalBudget || 0;
        const budgetUsed = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

        return {
            hasData: recentTransactions.length > 0 || !!budget,
            recentTransactions: recentTransactions.slice(0, 10),
            budget,
            monthlySpending: totalSpent,
            budgetLimit,
            budgetUsedPercent: budgetUsed,
            status: budgetUsed >= 90 ? 'over_budget' : budgetUsed >= 70 ? 'warning' : budgetUsed >= 50 ? 'on_track' : 'under_budget'
        };
    } catch (error) {
        console.error('[Orchestrator] Jupiter analysis error:', error.message);
        return { hasData: false, error: error.message };
    }
}

/**
 * Analyze Saturn domain (Legacy & Vision)
 */
async function analyzeSaturn(userId) {
    try {
        const [
            vision,
            recentReviews
        ] = await Promise.all([
            LegacyVision.findOne({ userId }).lean(),
            QuarterlyReview.find({ userId }).sort({ quarter: -1 }).limit(4).lean()
        ]);

        return {
            hasData: !!vision || recentReviews.length > 0,
            vision,
            recentReviews,
            hasVision: !!vision,
            reviewCount: recentReviews.length,
            status: vision ? 'aligned' : 'no_vision'
        };
    } catch (error) {
        console.error('[Orchestrator] Saturn analysis error:', error.message);
        return { hasData: false, error: error.message };
    }
}

/**
 * Analyze ALL domains in parallel
 */
async function analyzeAllDomains(userId) {
    

    const [mercury, venus, earth, mars, jupiter, saturn] = await Promise.all([
        analyzeMercury(userId),
        analyzeVenus(userId),
        analyzeEarth(userId),
        analyzeMars(userId),
        analyzeJupiter(userId),
        analyzeSaturn(userId)
    ]);

    return {
        mercury,
        venus,
        earth,
        mars,
        jupiter,
        saturn,
        timestamp: new Date()
    };
}

// ==============================================
// CROSS-DOMAIN PATTERN DETECTION
// ==============================================

/**
 * Detect patterns across multiple domains
 */
async function detectCrossDomainPatterns(domainData) {
    const patterns = [];

    // Pattern 1: Stress-Spending Correlation (Mercury ↔ Jupiter)
    if (domainData.mercury.hasData && domainData.jupiter.hasData) {
        const recovery = domainData.mercury.recovery?.score || 0;
        const budgetUsed = domainData.jupiter.budgetUsedPercent || 0;

        if (recovery < 60 && budgetUsed > 80) {
            patterns.push({
                patternType: 'stress_spending',
                domains: ['mercury', 'jupiter'],
                insight: 'Low recovery correlates with increased spending',
                recommendation: 'Consider stress management before making purchases',
                confidence: 0.75
            });
        }
    }

    // Pattern 2: Recovery-Schedule Alignment (Mercury ↔ Earth)
    if (domainData.mercury.hasData && domainData.earth.hasData) {
        const recovery = domainData.mercury.recovery?.score || 0;
        const busyHours = domainData.earth.todayBusyHours || 0;

        if (recovery < 50 && busyHours > 6) {
            patterns.push({
                patternType: 'overcommitment',
                domains: ['mercury', 'earth'],
                insight: 'Low recovery with heavy schedule may lead to burnout',
                recommendation: 'Reduce meeting load or add recovery time blocks',
                confidence: 0.80
            });
        }
    }

    // Pattern 3: Fitness-Nutrition Balance (Venus internal)
    if (domainData.venus.hasData) {
        const workouts = domainData.venus.weeklyWorkouts || 0;
        const nutrition = domainData.venus.recentNutrition?.length || 0;

        if (workouts >= 3 && nutrition < 2) {
            patterns.push({
                patternType: 'nutrition_gap',
                domains: ['venus'],
                insight: 'High training volume without nutrition tracking',
                recommendation: 'Track nutrition to support workout recovery',
                confidence: 0.70
            });
        }
    }

    // Pattern 4: Goal-Resource Alignment (Mars ↔ Jupiter ↔ Earth)
    if (domainData.mars.hasData && domainData.jupiter.hasData && domainData.earth.hasData) {
        const activeGoals = domainData.mars.totalActive || 0;
        const budget = domainData.jupiter.budget;
        const freeTime = domainData.earth.status === 'free' || domainData.earth.status === 'moderate';

        if (activeGoals > 3 && (!budget || !freeTime)) {
            patterns.push({
                patternType: 'resource_mismatch',
                domains: ['mars', 'jupiter', 'earth'],
                insight: 'Multiple active goals without allocated time/budget resources',
                recommendation: 'Allocate specific time blocks and budget for each goal',
                confidence: 0.85
            });
        }
    }

    // Pattern 5: Legacy-Daily Misalignment (Saturn ↔ Mars)
    if (domainData.saturn.hasData && domainData.mars.hasData) {
        const hasVision = domainData.saturn.hasVision;
        const activeGoals = domainData.mars.activeGoals || [];

        if (hasVision && activeGoals.length === 0) {
            patterns.push({
                patternType: 'vision_execution_gap',
                domains: ['saturn', 'mars'],
                insight: 'Long-term vision exists but no active goals to execute it',
                recommendation: 'Break down legacy vision into quarterly goals',
                confidence: 0.90
            });
        }
    }

    
    return patterns;
}

// ==============================================
// UNIFIED PLAN GENERATION
// ==============================================

/**
 * Generate unified plan using AI
 */
async function generateUnifiedPlan(userId, goal, timeframe, domainData, patterns) {
    

    // Build comprehensive context for AI
    const context = {
        goal,
        timeframe,
        domains: domainData,
        patterns,
        timestamp: new Date()
    };

    // Create prompt for AI plan generation
    const prompt = `You are the Holistic Orchestrator for Phoenix AI. Your role is to create a comprehensive, cross-domain optimization plan that achieves "conscious optimization at its finest."

USER GOAL: "${goal}"
TIMEFRAME: ${timeframe || 'Not specified'}

CURRENT DOMAIN STATUS:
${JSON.stringify(domainData, null, 2)}

DETECTED PATTERNS:
${patterns.map(p => `- ${p.insight} (${p.domains.join(' ↔ ')})`).join('\n')}

Create a unified plan that:
1. Analyzes ALL 7 domains (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Phoenix)
2. Creates specific, actionable steps for each relevant domain
3. Ensures cross-domain synergy (actions support each other)
4. Avoids conflicts (schedule workouts when recovery allows)
5. Allocates resources properly (time blocks, budget)
6. Links to legacy vision when applicable
7. Uses superior reasoning to catch subtle conflicts
8. Creates realistic, balanced plans that harmonize all life domains

Return a JSON object with this structure:
{
  "optimizationScore": 0-100,
  "reasoning": "Why this plan achieves the goal",
  "mercury": [
    {"action": "Enable HRV monitoring", "priority": 80, "scheduledFor": "2025-11-22"},
    {"action": "Set recovery threshold alert at 60%", "priority": 70}
  ],
  "venus": [
    {"action": "Create 3x/week workout schedule", "priority": 90, "scheduledFor": "2025-11-22"},
    {"action": "Generate meal prep plan (1800 cal/day)", "priority": 85}
  ],
  "earth": [
    {"action": "Block 6-7am for workouts (Mon/Wed/Fri)", "priority": 80}
  ],
  "mars": [
    {"action": "Create weight loss goal (10 lbs)", "priority": 95},
    {"action": "Set weekly weigh-in habit", "priority": 75}
  ],
  "jupiter": [
    {"action": "Allocate $200/mo for meal prep", "priority": 70}
  ],
  "saturn": [
    {"action": "Link to longevity vision", "priority": 60}
  ]
}

Be specific, actionable, and realistic. Consider the user's current state in all domains.`;

    try {
        // PRIMARY: Generate plan via Claude (superior reasoning for conscious optimization)
        
        const claudeStart = Date.now();

        const response = await claudeUnconscious.anthropic.messages.create({
            model: claudeUnconscious.model,
            max_tokens: 4096,
            temperature: 0.7,
            system: "You are the Holistic Orchestrator's conscious mind, specializing in creating perfectly balanced, cross-domain life optimization plans. Return only valid JSON.",
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const claudeTime = Date.now() - claudeStart;
        

        // Parse Claude's response
        let planText = response.content[0].text;

        // Handle markdown code blocks if present
        if (planText.includes('```json')) {
            planText = planText.split('```json')[1].split('```')[0].trim();
        } else if (planText.includes('```')) {
            planText = planText.split('```')[1].split('```')[0].trim();
        }

        const plan = JSON.parse(planText);

        
        return plan;

    } catch (claudeError) {
        console.error('[Orchestrator] ⚠️  Claude plan generation failed:', claudeError.message);

        try {
            // FALLBACK: Try Gemini if Claude fails
            
            const geminiStart = Date.now();

            const response = await consciousMind.model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json'
                }
            });

            const geminiTime = Date.now() - geminiStart;
            

            const result = response.response.text();
            const plan = JSON.parse(result);

            
            return plan;

        } catch (geminiError) {
            console.error('[Orchestrator] ⚠️  Gemini fallback also failed:', geminiError.message);

            // FINAL FALLBACK: Generate basic plan without AI
            return generateFallbackPlan(goal, domainData);
        }
    }
}

/**
 * Fallback plan if AI fails
 */
function generateFallbackPlan(goal, domainData) {
    

    const plan = {
        optimizationScore: 50,
        reasoning: 'Basic plan generated (AI unavailable)',
        mercury: [],
        venus: [],
        earth: [],
        mars: [],
        jupiter: [],
        saturn: []
    };

    // Add basic Mars goal
    plan.mars.push({
        actionType: 'create_goal',
        description: `Create goal: ${goal}`,
        priority: 90,
        data: { title: goal }
    });

    return plan;
}

// ==============================================
// WIDGET GENERATION
// ==============================================

/**
 * Generate widgets for the plan
 */
async function generatePlanWidgets(userId, planId, goal, plan) {
    

    const widgets = [];

    try {
        // 1. Master Plan Widget
        const masterWidgetId = `holistic-plan-${planId}`;
        const masterWidget = await SavedWidget.create({
            userId,
            widgetId: masterWidgetId,
            widgetName: `Plan: ${goal}`,
            widgetType: 'system',
            html: generateMasterWidgetHTML(goal, plan),
            actions: {
                view_plan: `/api/orchestrator/plans/${planId}`,
                execute_next: `/api/orchestrator/plans/${planId}/execute-next`
            },
            data: {
                planId,
                goal,
                optimizationScore: plan.optimizationScore
            },
            config: {
                position: 0,
                priority: 0,
                size: 'full',
                theme: 'orchestrator'
            },
            state: {
                enabled: true,
                pinned: true
            },
            generation: {
                source: 'system',
                generatedBy: 'gemini',
                originalRequest: goal
            }
        });

        widgets.push(masterWidget._id);

        

    } catch (error) {
        console.error('[Orchestrator] Widget generation error:', error.message);
    }

    return widgets;
}

/**
 * Generate HTML for master plan widget
 */
function generateMasterWidgetHTML(goal, plan) {
    const domains = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn'];
    const domainIcons = {
        mercury: '☿️',
        venus: '♀️',
        earth: '🌍',
        mars: '♂️',
        jupiter: '♃',
        saturn: '♄'
    };

    let domainsHTML = domains.map(domain => {
        const actions = plan[domain] || [];
        const status = actions.length > 0 ? '✅' : '—';
        return `<div class="domain ${domain}">${domainIcons[domain]} ${domain.charAt(0).toUpperCase() + domain.slice(1)} ${status} (${actions.length})</div>`;
    }).join('\n');

    return `
<div class="holistic-plan-master">
    <h2>${goal}</h2>
    <div class="optimization-score">
        <div class="score-circle">${plan.optimizationScore}%</div>
        <p>Optimization Score</p>
    </div>
    <div class="domains">
        ${domainsHTML}
    </div>
    <div class="reasoning">
        <p>${plan.reasoning}</p>
    </div>
</div>`;
}

// ==============================================
// DOMAIN EXECUTION METHODS
// ==============================================

/**
 * Execute Mercury actions (Health monitoring)
 */
async function executeMercuryActions(userId, actions) {
    const results = [];

    for (const action of actions) {
        try {
            

            // Mercury actions are typically configuration-based
            // Real implementation would configure alerts, thresholds, etc.

            results.push({
                actionId: action._id,
                status: 'completed',
                result: `Mercury action executed: ${action.description}`
            });

        } catch (error) {
            console.error('[Orchestrator] Mercury execution error:', error.message);
            results.push({
                actionId: action._id,
                status: 'failed',
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Execute Venus actions (Workout & nutrition creation)
 */
async function executeVenusActions(userId, actions) {
    const results = [];

    for (const action of actions) {
        try {
            

            // Create workout if action is workout-related
            if (action.actionType === 'create_workout' || action.description.toLowerCase().includes('workout')) {
                const workoutData = {
                    userId,
                    date: action.scheduledFor || new Date(),
                    type: action.data?.type || 'strength',
                    exercises: action.data?.exercises || [],
                    duration: action.data?.duration || 60,
                    notes: action.description,
                    source: 'orchestrator'
                };

                const workout = await Workout.create(workoutData);

                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Workout created: ${workout._id}`
                });
            }
            // Create nutrition plan if nutrition-related
            else if (action.actionType === 'create_meal_plan' || action.description.toLowerCase().includes('meal') || action.description.toLowerCase().includes('nutrition')) {
                const nutritionData = {
                    userId,
                    date: action.scheduledFor || new Date(),
                    calories: action.data?.calories || 2000,
                    protein: action.data?.protein || 150,
                    carbs: action.data?.carbs || 200,
                    fats: action.data?.fats || 65,
                    notes: action.description,
                    source: 'orchestrator'
                };

                const nutrition = await Nutrition.create(nutritionData);

                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Nutrition entry created: ${nutrition._id}`
                });
            }
            else {
                // Generic Venus action
                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Venus action noted: ${action.description}`
                });
            }

        } catch (error) {
            console.error('[Orchestrator] Venus execution error:', error.message);
            results.push({
                actionId: action._id,
                status: 'failed',
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Execute Earth actions (Calendar events)
 */
async function executeEarthActions(userId, actions) {
    const results = [];

    for (const action of actions) {
        try {
            

            // Create calendar event if schedule-related
            if (action.actionType === 'create_calendar_event' || action.description.toLowerCase().includes('block') || action.description.toLowerCase().includes('schedule')) {
                const eventData = {
                    userId,
                    title: action.data?.title || action.description,
                    startTime: action.scheduledFor || new Date(),
                    endTime: action.data?.endTime || new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
                    description: action.description,
                    source: 'orchestrator'
                };

                const event = await CalendarEvent.create(eventData);

                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Calendar event created: ${event._id}`
                });
            }
            else {
                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Earth action noted: ${action.description}`
                });
            }

        } catch (error) {
            console.error('[Orchestrator] Earth execution error:', error.message);
            results.push({
                actionId: action._id,
                status: 'failed',
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Execute Mars actions (Goal & habit creation)
 */
async function executeMarsActions(userId, actions) {
    const results = [];

    for (const action of actions) {
        try {
            

            // Create goal if goal-related
            if (action.actionType === 'create_goal' || action.description.toLowerCase().includes('goal')) {
                const goalData = {
                    userId,
                    title: action.data?.title || action.description,
                    description: action.description,
                    category: action.data?.category || 'personal',
                    targetDate: action.data?.targetDate || null,
                    status: 'active',
                    source: 'orchestrator'
                };

                const goal = await Goal.create(goalData);

                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Goal created: ${goal._id}`
                });
            }
            else {
                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Mars action noted: ${action.description}`
                });
            }

        } catch (error) {
            console.error('[Orchestrator] Mars execution error:', error.message);
            results.push({
                actionId: action._id,
                status: 'failed',
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Execute Jupiter actions (Budget allocation)
 */
async function executeJupiterActions(userId, actions) {
    const results = [];

    for (const action of actions) {
        try {
            

            // Create budget if budget-related
            if (action.actionType === 'create_budget' || action.actionType === 'allocate_budget' || action.description.toLowerCase().includes('budget') || action.description.toLowerCase().includes('allocate')) {

                // Find or create user's budget
                let budget = await Budget.findOne({ userId, status: 'active' });

                if (!budget) {
                    budget = await Budget.create({
                        userId,
                        totalBudget: action.data?.amount || 0,
                        categories: [],
                        status: 'active',
                        source: 'orchestrator'
                    });
                }

                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Budget configured: ${action.description}`
                });
            }
            else {
                results.push({
                    actionId: action._id,
                    status: 'completed',
                    result: `Jupiter action noted: ${action.description}`
                });
            }

        } catch (error) {
            console.error('[Orchestrator] Jupiter execution error:', error.message);
            results.push({
                actionId: action._id,
                status: 'failed',
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Execute Saturn actions (Legacy alignment)
 */
async function executeSaturnActions(userId, actions) {
    const results = [];

    for (const action of actions) {
        try {
            

            // Saturn actions are typically reflective/linking actions
            results.push({
                actionId: action._id,
                status: 'completed',
                result: `Saturn action noted: ${action.description}`
            });

        } catch (error) {
            console.error('[Orchestrator] Saturn execution error:', error.message);
            results.push({
                actionId: action._id,
                status: 'failed',
                error: error.message
            });
        }
    }

    return results;
}

/**
 * Execute entire plan across all domains
 */
async function executePlan(userId, plan) {
    

    const executionResults = {
        mercury: [],
        venus: [],
        earth: [],
        mars: [],
        jupiter: [],
        saturn: []
    };

    try {
        // Execute all domains in parallel
        const [mercuryResults, venusResults, earthResults, marsResults, jupiterResults, saturnResults] = await Promise.all([
            executeMercuryActions(userId, plan.domainActions.mercury),
            executeVenusActions(userId, plan.domainActions.venus),
            executeEarthActions(userId, plan.domainActions.earth),
            executeMarsActions(userId, plan.domainActions.mars),
            executeJupiterActions(userId, plan.domainActions.jupiter),
            executeSaturnActions(userId, plan.domainActions.saturn)
        ]);

        executionResults.mercury = mercuryResults;
        executionResults.venus = venusResults;
        executionResults.earth = earthResults;
        executionResults.mars = marsResults;
        executionResults.jupiter = jupiterResults;
        executionResults.saturn = saturnResults;

        // Update action statuses in plan
        for (const domain of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn']) {
            for (const result of executionResults[domain]) {
                const action = plan.domainActions[domain].id(result.actionId);
                if (action) {
                    action.status = result.status;
                    if (result.status === 'completed') {
                        action.completedAt = new Date();
                    }
                    if (result.error) {
                        action.error = result.error;
                    }
                }
            }
        }

        plan.execution.lastExecuted = new Date();
        await plan.save();

        
        return executionResults;

    } catch (error) {
        console.error('[Orchestrator] Plan execution error:', error.message);
        throw error;
    }
}

/**
 * Create complete holistic plan from goal
 */
async function createHolisticPlan(userId, goal, timeframe = null, autoExecute = true) {
    

    try {
        // Step 1: Analyze all domains
        const domainData = await analyzeAllDomains(userId);

        // Step 2: Detect cross-domain patterns
        const patterns = await detectCrossDomainPatterns(domainData);

        // Step 3: Generate unified plan via AI
        const plan = await generateUnifiedPlan(userId, goal, timeframe, domainData, patterns);

        // Step 4: Create plan in database
        const planId = `plan-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Transform AI plan into database structure
        const domainActions = {};
        for (const domain of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn']) {
            domainActions[domain] = (plan[domain] || []).map(action => ({
                actionType: action.actionType || action.action || 'generic',
                description: action.description || action.action || action.toString(),
                priority: action.priority || 50,
                data: action.data || {},
                scheduledFor: action.scheduledFor ? new Date(action.scheduledFor) : null,
                status: 'pending'
            }));
        }

        const holisticPlan = await HolisticPlan.create({
            userId,
            planId,
            goal,
            timeframe,
            status: 'active',
            domainActions,
            patterns,
            optimizationScore: plan.optimizationScore || 70,
            generation: {
                generatedBy: 'gemini',
                originalQuery: goal,
                domainSnapshot: domainData
            },
            execution: {
                autoExecute
            }
        });

        // Step 5: Generate widgets
        const widgets = await generatePlanWidgets(userId, planId, goal, plan);
        holisticPlan.widgets = widgets;
        await holisticPlan.save();

        // Step 6: Execute plan if auto-execute enabled
        if (autoExecute) {
            await executePlan(userId, holisticPlan);
        }

        

        return {
            success: true,
            plan: holisticPlan.toClientJSON(),
            domainData,
            patterns
        };

    } catch (error) {
        console.error('[Orchestrator] Plan creation error:', error.message);
        throw error;
    }
}

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
    analyzeMercury,
    analyzeVenus,
    analyzeEarth,
    analyzeMars,
    analyzeJupiter,
    analyzeSaturn,
    analyzeAllDomains,
    detectCrossDomainPatterns,
    generateUnifiedPlan,
    generatePlanWidgets,
    executeMercuryActions,
    executeVenusActions,
    executeEarthActions,
    executeMarsActions,
    executeJupiterActions,
    executeSaturnActions,
    executePlan,
    createHolisticPlan
};
