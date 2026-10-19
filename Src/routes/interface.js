const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InterfacePreferences = require('../models/phoenix/InterfacePreferences');
const InterfaceInteraction = require('../models/phoenix/InterfaceInteraction');
const geminiMind = require('../services/gemini/consciousMind');
const claudeMind = require('../services/claude/consciousMind');

// Integration with existing services
const RecoveryScore = require('../models/mercury/RecoveryScore');
const Prediction = require('../models/phoenix/Prediction');
const Intervention = require('../models/phoenix/Intervention');
const CorrelationPattern = require('../models/phoenix/CorrelationPattern');
const BehaviorPattern = require('../models/phoenix/BehaviorPattern');
const HolisticPlan = require('../models/phoenix/HolisticPlan');
const phoenixCache = require('../services/phoenix/phoenixCache');

// Cross-Domain Models (for holistic voice query context)
const Workout = require('../models/venus/Workout');
const Nutrition = require('../models/venus/Nutrition');
const CalendarEvent = require('../models/earth/CalendarEvent');
const Goal = require('../models/mars/Goal');
const Transaction = require('../models/jupiter/Transaction');
const Budget = require('../models/jupiter/Budget');

// Conversation Memory
const VoiceSession = require('../models/phoenix/VoiceSession');
const UserProfile = require('../models/phoenix/UserProfile');

// POST /api/interface/orchestrate - Main consciousness orchestration endpoint
router.post('/orchestrate', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { context, voiceQuery, biometrics, screenContext, isAlwaysOnMode } = req.body;

    // FAST PATH: Check PhoenixCache first (unless voice query)
    if (!voiceQuery) {
      const cached = await phoenixCache.get(userId, 'dashboard_layout');
      if (cached) {
        return res.json({
          success: true,
          orchestration: cached,
          cached: true,
          timestamp: new Date()
        });
      }
    }

    // Get user preferences
    const preferences = await InterfacePreferences.getOrCreateForUser(userId);

    // Determine time of day
    const hour = new Date().getHours();
    let timeOfDay;
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[new Date().getDay()];

    // === INTEGRATION WITH EXISTING SERVICES ===

    // 1. Get recovery analysis from Mercury (replaces manual biometric checks)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recoveryAnalysis = await RecoveryScore.findOne({
      userId,
      date: { $gte: today }
    }).sort({ date: -1 });

    // 2. Get active predictions from predictionEngine
    const predictions = await Prediction.find({
      userId,
      status: 'active',
      targetDate: { $gte: today }
    }).sort({ 'prediction.confidence': -1 }).limit(5);

    // 3. Get pending interventions (proactive alerts)
    const interventions = await Intervention.find({
      userId,
      userAcknowledged: false,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }).sort({ severity: -1, timestamp: -1 });

    // 4. Get active correlation patterns
    const correlations = await CorrelationPattern.find({
      userId,
      isActive: true,
      'correlation.confidence': { $gte: 0.7 }
    }).sort({ 'correlation.strength': -1 }).limit(5);

    // 5. Get engagement patterns from BehaviorPattern (replaces InterfaceInteraction)
    const engagementPatterns = await BehaviorPattern.find({
      userId,
      patternType: 'engagement',
      status: 'active'
    }).sort({ confidence: -1 }).limit(10);

    // Fallback to InterfaceInteraction if no BehaviorPatterns yet
    let engagedWidgets, leastEngagedWidgets;
    if (engagementPatterns.length > 0) {
      engagedWidgets = engagementPatterns
        .filter(p => p.validated)
        .map(p => ({ widgetId: p.metadata?.widgetId || p.pattern, frequency: p.frequency }));
      leastEngagedWidgets = [];
    } else {
      engagedWidgets = await InterfaceInteraction.getMostEngagedWidgets(userId, 7, 10);
      leastEngagedWidgets = await InterfaceInteraction.getLeastEngagedWidgets(userId, 7, 10);
    }

    // 6. Get active holistic plans
    const activePlans = await HolisticPlan.find({
      userId,
      status: 'active'
    }).sort({ createdAt: -1 }).populate('widgets').limit(3);

    // Build orchestration decision
    const orchestration = {
      layout: {
        priority: [],
        widgets: [],
        hidden: [],
        dimmed: []
      },
      message: '',
      reasoning: {
        services: {
          recovery: !!recoveryAnalysis,
          predictions: predictions.length,
          interventions: interventions.length,
          correlations: correlations.length
        }
      },
      personality: preferences.preferredPersonality
    };

    // Get time-based widget preferences
    const timePrefs = preferences.timeBasedDisplay[timeOfDay];
    let widgetPriorities = [...timePrefs.widgets];

    // === APPLY INTELLIGENCE FROM EXISTING SERVICES ===

    // A. CRITICAL INTERVENTIONS (highest priority)
    const criticalInterventions = interventions.filter(i => i.severity === 'critical' || i.severity === 'high');
    if (criticalInterventions.length > 0) {
      const intervention = criticalInterventions[0];
      widgetPriorities.unshift(`intervention-${intervention.type}`);
      orchestration.reasoning.primaryFactor = 'critical_intervention';
      orchestration.message = intervention.action;

      // Add intervention as widget
      orchestration.layout.widgets.push({
        id: `intervention-${intervention._id}`,
        type: 'intervention',
        position: 'center',
        size: 'large',
        urgency: 'high',
        priority: 0,
        data: {
          interventionId: intervention._id,
          type: intervention.type,
          action: intervention.action,
          reason: intervention.reason,
          severity: intervention.severity
        }
      });
    }

    // A2. ACTIVE HOLISTIC PLANS (very high priority, just below critical interventions)
    if (activePlans.length > 0 && !voiceQuery) {
      const primaryPlan = activePlans[0];
      const domainStatus = primaryPlan.getDomainStatus();

      // Add plan master widget to layout
      widgetPriorities.unshift(`holistic-plan-${primaryPlan.planId}`);

      orchestration.layout.widgets.push({
        id: `holistic-plan-${primaryPlan.planId}`,
        type: 'orchestrator_master',
        position: 'center',
        size: 'full',
        urgency: 'high',
        priority: 1, // Just after critical interventions (priority 0)
        data: {
          planId: primaryPlan.planId,
          goal: primaryPlan.goal,
          progress: primaryPlan.progress,
          optimizationScore: primaryPlan.optimizationScore,
          domainStatus,
          nextAction: primaryPlan.getNextAction(),
          totalActions: primaryPlan.execution.totalActions,
          completedActions: primaryPlan.execution.completedActions
        }
      });

      // Set orchestration message if no critical intervention
      if (!orchestration.message) {
        const completedPercent = Math.round(primaryPlan.progress);
        orchestration.message = `Your plan "${primaryPlan.goal}" is ${completedPercent}% complete. Keep going!`;
        orchestration.reasoning.primaryFactor = 'active_holistic_plan';
      }

      // Add plan data to orchestration for frontend
      orchestration.holisticPlan = {
        planId: primaryPlan.planId,
        goal: primaryPlan.goal,
        progress: primaryPlan.progress,
        optimizationScore: primaryPlan.optimizationScore,
        status: primaryPlan.status,
        domainStatus,
        nextAction: primaryPlan.getNextAction()
      };
    }

    // B. RECOVERY-BASED RECOMMENDATIONS (from Mercury)
    // Skip if voice query - let AI handle the response contextually
    if (recoveryAnalysis && !orchestration.message && !voiceQuery) {
      const recommendation = recoveryAnalysis.recommendation;
      const totalScore = recoveryAnalysis.totalScore;

      if (recommendation === 'rest' || recommendation === 'active_recovery') {
        widgetPriorities.unshift('health-recovery');
        orchestration.reasoning.primaryFactor = 'low_recovery';
        orchestration.message = `Recovery: ${totalScore}%. ${recoveryAnalysis.insights[0] || 'Consider light activity today.'}`;
      } else if (recommendation === 'high_intensity') {
        widgetPriorities.unshift('workout-plan');
        orchestration.reasoning.primaryFactor = 'high_recovery';
        orchestration.message = `Recovery: ${totalScore}%. ${recoveryAnalysis.insights[0] || 'Perfect day for intense training!'}`;
      } else {
        orchestration.reasoning.recoveryScore = totalScore;
        orchestration.message = `Recovery: ${totalScore}%. ${recoveryAnalysis.insights[0] || 'Moderate intensity recommended.'}`;
      }
    }

    // C. PREDICTIONS (illness, injury, burnout)
    // Skip if voice query - let AI handle the response contextually
    if (!orchestration.message && !voiceQuery) {
      const illnessPrediction = predictions.find(p => p.predictionType === 'illness_risk');
      const injuryPrediction = predictions.find(p => p.predictionType === 'injury_risk');
      const burnoutPrediction = predictions.find(p => p.predictionType === 'burnout_risk');

      if (illnessPrediction && illnessPrediction.prediction.confidence > 0.7) {
        widgetPriorities.unshift('health-recovery');
        orchestration.reasoning.primaryFactor = 'illness_prediction';
        orchestration.message = `${(illnessPrediction.prediction.probability * 100).toFixed(0)}% illness risk detected. ${illnessPrediction.recommendations[0]?.action || 'Focus on recovery.'}`;
      } else if (injuryPrediction && injuryPrediction.prediction.confidence > 0.7) {
        widgetPriorities.unshift('injury-prevention');
        orchestration.layout.hidden.push('workout-plan');
        orchestration.reasoning.primaryFactor = 'injury_prediction';
        orchestration.message = `${(injuryPrediction.prediction.probability * 100).toFixed(0)}% injury risk. ${injuryPrediction.recommendations[0]?.action || 'Reduce training volume.'}`;
      } else if (burnoutPrediction && burnoutPrediction.prediction.confidence > 0.7) {
        widgetPriorities.unshift('recovery-protocols');
        orchestration.reasoning.primaryFactor = 'burnout_prediction';
        orchestration.message = `Burnout risk detected. ${burnoutPrediction.recommendations[0]?.action || 'Take a rest day.'}`;
      }
    }

    // Apply day-specific priorities (for calendar reorganization)
    const dayPriorities = preferences.dayPriorities[dayOfWeek];
    orchestration.reasoning.dayPriorities = dayPriorities;

    // Remove duplicates and apply engagement learning
    widgetPriorities = [...new Set(widgetPriorities)];

    // Boost widgets user actually engages with
    const engagedWidgetIds = engagedWidgets.map(w => w.widgetId);
    widgetPriorities = widgetPriorities.sort((a, b) => {
      const aEngaged = engagedWidgetIds.indexOf(a);
      const bEngaged = engagedWidgetIds.indexOf(b);
      if (aEngaged !== -1 && bEngaged !== -1) return aEngaged - bEngaged;
      if (aEngaged !== -1) return -1;
      if (bEngaged !== -1) return 1;
      return 0;
    });

    // Hide least engaged widgets
    const leastEngagedIds = leastEngagedWidgets
      .filter(w => w.ignoreRate > 70) // Ignored more than 70% of the time
      .map(w => w.widgetId);

    orchestration.layout.hidden = leastEngagedIds;

    // Build widget list with priorities
    widgetPriorities.forEach((widgetId, index) => {
      if (leastEngagedIds.includes(widgetId)) return; // Skip hidden widgets

      const urgency = index === 0 ? 'high' : index < 3 ? 'medium' : 'low';
      const size = index === 0 ? 'large' : index < 3 ? 'medium' : 'small';
      const position = index === 0 ? 'center' : index < 3 ? 'top' : 'bottom';

      orchestration.layout.widgets.push({
        id: widgetId,
        position,
        size,
        urgency,
        priority: index
      });
    });

    orchestration.layout.priority = widgetPriorities.filter(w => !leastEngagedIds.includes(w));

    // Apply display rules
    preferences.displayRules.forEach(rule => {
      if (!rule.enabled) return;

      // Evaluate rule condition (simple eval for now)
      try {
        let shouldTrigger = false;

        if (rule.condition.includes('recovery_score') && biometrics?.recoveryScore) {
          const match = rule.condition.match(/recovery_score\s*([<>=!]+)\s*(\d+)/);
          if (match) {
            const operator = match[1];
            const threshold = parseInt(match[2]);
            const score = biometrics.recoveryScore;

            if (operator === '<' && score < threshold) shouldTrigger = true;
            else if (operator === '>' && score > threshold) shouldTrigger = true;
            else if (operator === '==' && score === threshold) shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          orchestration.reasoning.triggeredRules = orchestration.reasoning.triggeredRules || [];
          orchestration.reasoning.triggeredRules.push(rule.name);

          // Apply rule action
          if (rule.action.includes('highlight')) {
            const widgetMatch = rule.action.match(/highlight_(\w+)/);
            if (widgetMatch) {
              const widgetId = widgetMatch[1];
              // Move to front of priority list
              orchestration.layout.priority = [widgetId, ...orchestration.layout.priority.filter(w => w !== widgetId)];
            }
          }
        }
      } catch (error) {
        console.error('Error evaluating display rule:', error);
      }
    });

    // D. VOICE QUERY HANDLING (use existing consciousMind with full context)
    if (voiceQuery) {
      try {
        // === CROSS-DOMAIN DATA LOADING (for holistic intelligence) ===
        const domainData = {};

        // VENUS (Fitness & Nutrition) - Most recent workout
        try {
          const recentWorkout = await Workout.findOne({ userId })
            .sort({ date: -1 })
            .limit(1)
            .lean();
          if (recentWorkout) {
            domainData.venus = {
              hasData: true,
              recentWorkout: {
                date: recentWorkout.date,
                type: recentWorkout.type,
                exercises: recentWorkout.exercises?.slice(0, 3).map(e => ({
                  name: e.exercise,
                  weight: e.weight,
                  reps: e.reps,
                  sets: e.sets
                }))
              }
            };
          }
        } catch (err) { console.error('[Domain] Venus load error:', err); }

        // EARTH (Calendar & Schedule) - This week's events
        try {
          const weekStart = new Date();
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const upcomingEvents = await CalendarEvent.find({
            userId,
            startTime: { $gte: weekStart, $lte: weekEnd }
          })
          .sort({ startTime: 1 })
          .limit(10)
          .lean();

          if (upcomingEvents && upcomingEvents.length > 0) {
            domainData.earth = {
              hasData: true,
              upcomingEvents: upcomingEvents.map(e => ({
                title: e.title,
                start: e.startTime,
                duration: e.duration
              })),
              eventCount: upcomingEvents.length
            };
          }
        } catch (err) { console.error('[Domain] Earth load error:', err); }

        // MARS (Goals & Habits) - Active goals
        try {
          const activeGoals = await Goal.find({
            userId,
            status: 'active'
          })
          .sort({ priority: -1 })
          .limit(5)
          .lean();

          if (activeGoals && activeGoals.length > 0) {
            domainData.mars = {
              hasData: true,
              activeGoals: activeGoals.map(g => ({
                title: g.title,
                category: g.category,
                progress: g.progress,
                target: g.target,
                deadline: g.deadline
              }))
            };
          }
        } catch (err) { console.error('[Domain] Mars load error:', err); }

        // JUPITER (Finance) - Budget status & recent spending
        try {
          const currentBudget = await Budget.findOne({
            userId,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          }).lean();

          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const recentTransactions = await Transaction.find({
            userId,
            date: { $gte: monthStart }
          })
          .sort({ date: -1 })
          .limit(10)
          .lean();

          if (currentBudget || recentTransactions.length > 0) {
            domainData.jupiter = {
              hasData: true,
              budget: currentBudget ? {
                totalBudget: currentBudget.totalBudget,
                spent: currentBudget.spent,
                remaining: currentBudget.remaining
              } : null,
              recentSpending: recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
              transactionCount: recentTransactions.length
            };
          }
        } catch (err) { console.error('[Domain] Jupiter load error:', err); }

        // MERCURY (Health) - Already loaded as recoveryAnalysis
        if (recoveryAnalysis) {
          domainData.mercury = {
            hasData: true,
            recovery: {
              score: recoveryAnalysis.totalScore,
              recommendation: recoveryAnalysis.recommendation,
              insights: recoveryAnalysis.insights
            }
          };
        }

        // === USER PROFILE (Personal facts Phoenix remembers forever) ===
        let userProfile = null;
        try {
          userProfile = await UserProfile.getOrCreateForUser(userId);
          
        } catch (profileError) {
          console.error('[UserProfile] Error loading profile:', profileError);
          // Continue without profile rather than failing
        }

        // === CONVERSATION MEMORY (Phoenix remembers what you said) ===
        let activeSession;
        let conversationHistory = [];

        try {
          // Get or create active voice session
          let sessions = await VoiceSession.getActiveSessions(userId);

          if (sessions && sessions.length > 0) {
            activeSession = sessions[0];
          } else {
            // Create new session
            activeSession = new VoiceSession({
              userId,
              status: 'active',
              intent: 'general_conversation',
              messages: []
            });
            await activeSession.save();
            
          }

          // Load recent conversation history (last 10 messages for context)
          if (activeSession.messages && activeSession.messages.length > 0) {
            conversationHistory = activeSession.messages.slice(-10).map(m => ({
              role: m.role,
              message: m.content,
              timestamp: m.timestamp
            }));
            
          }

        } catch (sessionError) {
          console.error('[VoiceSession] Error loading session:', sessionError);
          // Continue without conversation history rather than failing
        }

        // Build voice context with ALL available domain data
        const voiceContext = {
          userName: (context && context.userName) || (req.user && req.user.name) || 'there',
          location: (context && context.location) || 'your city',
          weather: (context && context.weather) || null,
          currentBiometrics: recoveryAnalysis ? {
            recoveryScore: recoveryAnalysis.totalScore,
            recommendation: recoveryAnalysis.recommendation,
            insights: recoveryAnalysis.insights
          } : biometrics,
          timeOfDay,
          dayOfWeek,
          activeInterventions: interventions.map(i => i.type),
          predictions: predictions.map(p => ({ type: p.predictionType, confidence: p.prediction.confidence })),
          // Cross-domain data for holistic intelligence
          domainData,
          domainStatus: {
            mercury: !!domainData.mercury,
            venus: !!domainData.venus,
            earth: !!domainData.earth,
            mars: !!domainData.mars,
            jupiter: !!domainData.jupiter,
            saturn: false // Not implemented yet
          },
          // Conversation history for context
          conversationHistory,
          // User profile (personal facts)
          userProfile,
          // Screen context for always-on mode
          screenContext: screenContext || null,
          isAlwaysOnMode: isAlwaysOnMode || false,
          // Screen-specific AI guidance
          guidance: getScreenGuidance(screenContext)
        };

        // Helper function to get screen-specific guidance for AI
        function getScreenGuidance(ctx) {
          if (!ctx) return null;
          const guidance = [];

          // Mode-specific guidance
          if (ctx.mode === 'GENESIS') {
            guidance.push('User is in Genesis mode. Help with document creation, code generation, or file uploads.');
          } else if (ctx.mode === 'DESK') {
            guidance.push('User is in DESK mode. Help with web browsing, research, or desktop tasks.');
          } else if (ctx.mode === 'VOICE') {
            guidance.push('User is in voice-only mode. Keep responses concise and voice-friendly.');
          }

          // Modal-specific guidance
          if (ctx.activeModal) {
            const modalId = ctx.activeModal.id || ctx.activeModal;
            if (modalId === 'butler-widget' || modalId.includes('butler')) {
              guidance.push('User has Butler open. Help with automation tasks like ordering food, booking rides, or sending messages.');
            } else if (modalId.includes('settings')) {
              guidance.push('User is in settings. Help configure preferences.');
            } else if (modalId.includes('connect') || modalId.includes('integration')) {
              guidance.push('User is connecting integrations. Offer guidance on OAuth flow.');
            }
          }

          // Planet-specific guidance
          if (ctx.activePlanet) {
            const planetGuidance = {
              mercury: 'User is viewing health/biometrics. Help with wearable data, sleep, HRV.',
              venus: 'User is in fitness section. Help with workouts, nutrition, body composition.',
              earth: 'User is viewing calendar. Help with scheduling, energy optimization.',
              mars: 'User is in goals section. Help with goal setting, habit tracking.',
              jupiter: 'User is viewing finances. Help with budgets, transactions, financial planning.',
              saturn: 'User is in legacy/vision section. Help with long-term planning, reviews.',
              uranus: 'User is in learning section. Help with skill development.',
              neptune: 'User is in mindfulness section. Help with meditation, mood tracking.',
              phoenix: 'User is in AI core. Help with patterns, predictions, insights.'
            };
            if (planetGuidance[ctx.activePlanet]) {
              guidance.push(planetGuidance[ctx.activePlanet]);
            }
          }

          return guidance.length > 0 ? guidance.join(' ') : null;
        }

        // SELECT AI PROVIDER (Claude or Gemini)
        // Check user preference, default to Gemini for backward compatibility
        const aiProvider = preferences.preferredAI || 'gemini';
        const selectedMind = aiProvider === 'claude' ? claudeMind : geminiMind;
        

        const geminiResponse = await selectedMind.respondToQuery(voiceQuery, userId, voiceContext);

        // === SAVE CONVERSATION TO MEMORY ===
        if (activeSession && geminiResponse && geminiResponse.message) {
          try {
            // Save user query
            await activeSession.addMessage('user', voiceQuery);

            // Save Phoenix response
            await activeSession.addMessage('assistant', geminiResponse.message);

            
          } catch (saveError) {
            console.error('[VoiceSession] Error saving messages:', saveError);
            // Don't fail the request if saving fails
          }
        }

        // === EXTRACT AND SAVE PERSONAL FACTS (non-blocking) ===
        // This happens async - doesn't slow down response
        // Use Gemini for fact extraction (Claude doesn't have this method yet)
        if (geminiResponse && geminiResponse.message && geminiMind.extractAndSaveFacts) {
          geminiMind.extractAndSaveFacts(voiceQuery, geminiResponse.message, userId)
            .then(result => {
              if (result.extracted) {
                
              }
            })
            .catch(err => {
              console.error('[FactExtractor] Async extraction error:', err);
            });
        }
        if (geminiResponse && geminiResponse.message) {
          // Strip [CONFIDENCE: XX%] tag from message before displaying
          let cleanMessage = geminiResponse.message.replace(/\[CONFIDENCE:\s*\d+%\]\s*$/i, '').trim();
          orchestration.message = cleanMessage;
          orchestration.reasoning.primaryFactor = 'voice_query';

          // If voice query suggests specific widgets, prioritize them
          if (geminiResponse.suggestedWidgets && Array.isArray(geminiResponse.suggestedWidgets)) {
            widgetPriorities = [...geminiResponse.suggestedWidgets, ...widgetPriorities];
          }
        }

        // DYNAMIC WIDGET GENERATION: Detect if user wants to track something custom
        const trackingKeywords = /track|log|monitor|count|measure|record/i;
        if (trackingKeywords.test(voiceQuery) && geminiMind.generateCustomWidget) {
          

          const widgetResult = await geminiMind.generateCustomWidget(voiceQuery, voiceContext);

          if (widgetResult.success && widgetResult.widget) {
            const customWidget = widgetResult.widget;

            // Add custom widget to layout with highest priority
            orchestration.layout.widgets.unshift({
              id: customWidget.widgetId,
              type: 'custom',
              position: 'center',
              size: 'large',
              urgency: 'high',
              priority: 0,
              data: {
                ...customWidget.data,
                html: customWidget.html,
                actions: customWidget.actions,
                trackingFields: customWidget.trackingFields,
                widgetName: customWidget.widgetName
              }
            });

            orchestration.message = `I've created a custom ${customWidget.widgetName} for you. ${orchestration.message || ''}`;
            orchestration.reasoning.customWidget = customWidget.widgetId;
          }
        }

      } catch (error) {
        console.error('Voice query error:', error);
        orchestration.reasoning.voiceQueryError = error.message;
      }
    }

    // E. CORRELATION PATTERNS (personalized patterns like stress-spending)
    for (const correlation of correlations) {
      if (correlation.patternType === 'stress_spending' && recoveryAnalysis && recoveryAnalysis.hrvScore < 40) {
        orchestration.layout.hidden.push('finance-overview');
        orchestration.reasoning.correlationApplied = 'stress_spending_hidden';
        if (!orchestration.message) {
          orchestration.message = 'I notice you tend to overspend when stressed. Hiding finance widgets for now.';
        }
      }

      if (correlation.patternType === 'sleep_performance' && recoveryAnalysis && recoveryAnalysis.sleepScore < 60) {
        orchestration.layout.hidden.push('workout-plan');
        orchestration.reasoning.correlationApplied = 'poor_sleep_no_workout';
        if (!orchestration.message) {
          orchestration.message = 'Your sleep quality affects performance. Consider rest today.';
        }
      }
    }

    // Default message if none set
    if (!orchestration.message) {
      if (timeOfDay === 'morning') {
        orchestration.message = 'Good morning! Here\'s what matters today.';
      } else if (timeOfDay === 'evening') {
        orchestration.message = 'Evening! Time to review your day and prepare for tomorrow.';
      } else {
        orchestration.message = 'Here\'s your current status.';
      }
    }

    // Set layout type based on preferences
    orchestration.layout.layoutType = timePrefs.layout;

    // === CACHE RESULT (5 minute TTL) ===
    if (!voiceQuery) {
      await phoenixCache.set(userId, 'dashboard_layout', orchestration, 300);
    }

    res.json({
      success: true,
      orchestration,
      cached: false,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Orchestration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/interface/interaction - Log user interaction
router.post('/interaction', protect, async (req, res) => {
  let interaction = null;
  try {
    const userId = req.user._id;
    const { widgetId, action, dwellTime, interactionDepth, outcome } = req.body;

    // Log to InterfaceInteraction (for analytics)
    try {
      interaction = await InterfaceInteraction.logInteraction({
        userId,
        ...req.body
      });
    } catch (logError) {
      console.warn('Analytics logging failed (non-critical):', logError.message);
      // Continue execution - don't fail the request just because analytics failed
    }

    // === INTEGRATION: Feed into BehaviorPattern system ===
    // This creates patterns that the 540-pattern system can learn from
    try {
      let pattern = await BehaviorPattern.findOne({
        userId,
        patternType: 'engagement',
        pattern: widgetId,
        status: 'active'
      });

      if (!pattern) {
        // Create new engagement pattern
        pattern = new BehaviorPattern({
          userId,
          patternType: 'engagement',
          pattern: widgetId,
          description: `User engagement with ${widgetId} widget`,
          frequency: 1,
          confidence: 0.1,
          statistics: {
            firstObserved: new Date(),
            lastObserved: new Date(),
            averageInterval: null,
            successRate: outcome === 'helpful' ? 100 : 0
          },
          dataPoints: [{
            timestamp: new Date(),
            value: action === 'interacted' ? 1 : 0,
            context: { dwellTime, interactionDepth, outcome }
          }],
          metadata: {
            widgetId,
            modelVersion: 'v1.0',
            algorithm: 'frequency_tracker',
            features: ['dwellTime', 'interactionDepth', 'outcome']
          },
          status: 'active',
          validated: false,
          validatedBy: 'system'
        });
      } else {
        // Update existing pattern
        pattern.frequency += 1;
        pattern.statistics.lastObserved = new Date();

        // Update success rate
        if (outcome === 'helpful') {
          const currentSuccess = pattern.statistics.successRate || 0;
          pattern.statistics.successRate = (currentSuccess * (pattern.frequency - 1) + 100) / pattern.frequency;
        } else if (outcome === 'dismissed') {
          const currentSuccess = pattern.statistics.successRate || 0;
          pattern.statistics.successRate = (currentSuccess * (pattern.frequency - 1)) / pattern.frequency;
        }

        // Add data point
        pattern.dataPoints.push({
          timestamp: new Date(),
          value: action === 'interacted' ? 1 : 0,
          context: { dwellTime, interactionDepth, outcome }
        });

        // Limit data points to last 100
        if (pattern.dataPoints.length > 100) {
          pattern.dataPoints = pattern.dataPoints.slice(-100);
        }

        // Update confidence based on frequency and success rate
        const frequencyFactor = Math.min(pattern.frequency / 50, 1); // Max at 50 observations
        const successFactor = (pattern.statistics.successRate || 50) / 100;
        pattern.confidence = frequencyFactor * successFactor;

        // Auto-validate if confidence > 0.7
        if (pattern.confidence > 0.7 && !pattern.validated) {
          pattern.validated = true;
          pattern.validatedBy = 'system';
          pattern.validatedAt = new Date();
        }
      }

      await pattern.save();

    } catch (behaviorError) {
      console.error('BehaviorPattern integration error:', behaviorError);
      // Don't fail the request if BehaviorPattern update fails
    }

    res.json({
      success: true,
      interaction
    });

  } catch (error) {
    console.error('Interaction logging error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/interface/preferences - Get user preferences
router.get('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = await InterfacePreferences.getOrCreateForUser(userId);

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/interface/preferences - Update user preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = await InterfacePreferences.findOneAndUpdate(
      { userId },
      { $set: req.body },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/interface/priorities/:day - Update day-specific priorities
router.put('/priorities/:day', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { day } = req.params;
    const { priorities } = req.body;

    const preferences = await InterfacePreferences.getOrCreateForUser(userId);
    await preferences.updateDayPriorities(day, priorities);

    res.json({
      success: true,
      day,
      priorities: preferences.dayPriorities[day.toLowerCase()]
    });

  } catch (error) {
    console.error('Update priorities error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/interface/analytics - Get engagement analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;

    const mostEngaged = await InterfaceInteraction.getMostEngagedWidgets(userId, days, 10);
    const leastEngaged = await InterfaceInteraction.getLeastEngagedWidgets(userId, days, 10);

    res.json({
      success: true,
      analytics: {
        mostEngaged,
        leastEngaged,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
