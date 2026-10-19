/**
 * HOLISTIC ORCHESTRATOR CONTROLLER
 * Handles autonomous cross-domain optimization requests
 * Creates, manages, and executes holistic plans
 */

const HolisticPlan = require('../models/phoenix/HolisticPlan');
const orchestrator = require('../services/phoenix/holisticOrchestrator');

/**
 * Create holistic optimization plan
 * POST /api/orchestrator/optimize
 */
exports.createPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { goal, timeframe, autoExecute = true } = req.body;

        if (!goal) {
            return res.status(400).json({
                success: false,
                message: 'Goal is required'
            });
        }

        

        // Create holistic plan
        const result = await orchestrator.createHolisticPlan(userId, goal, timeframe, autoExecute);

        res.status(201).json({
            success: true,
            message: 'Holistic plan created successfully',
            data: result
        });

    } catch (error) {
        console.error('[Orchestrator] Create plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all plans for user
 * GET /api/orchestrator/plans
 */
exports.getAllPlans = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query || {};

        

        let plans;
        if (status) {
            plans = await HolisticPlan.getPlansByStatus(userId, status);
        } else {
            plans = await HolisticPlan.find({ userId })
                .sort({ createdAt: -1 })
                .populate('widgets')
                .lean();
        }

        res.json({
            success: true,
            count: plans.length,
            data: plans
        });

    } catch (error) {
        console.error('[Orchestrator] Get plans error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plans',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get specific plan
 * GET /api/orchestrator/plans/:planId
 */
exports.getPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.params;

        

        const plan = await HolisticPlan.findOne({ userId, planId })
            .populate('widgets')
            .lean();

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.json({
            success: true,
            data: plan
        });

    } catch (error) {
        console.error('[Orchestrator] Get plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Execute plan
 * POST /api/orchestrator/plans/:planId/execute
 */
exports.executePlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.params;

        

        const plan = await HolisticPlan.findOne({ userId, planId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        if (plan.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Cannot execute plan with status: ${plan.status}`
            });
        }

        // Execute plan
        const results = await orchestrator.executePlan(userId, plan);

        res.json({
            success: true,
            message: 'Plan executed successfully',
            data: {
                planId: plan.planId,
                executionResults: results,
                plan: plan.toClientJSON()
            }
        });

    } catch (error) {
        console.error('[Orchestrator] Execute plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Execute next action in plan
 * POST /api/orchestrator/plans/:planId/execute-next
 */
exports.executeNextAction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.params;

        

        const plan = await HolisticPlan.findOne({ userId, planId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        const nextAction = plan.getNextAction();

        if (!nextAction) {
            return res.json({
                success: true,
                message: 'No pending actions',
                data: {
                    planId: plan.planId,
                    complete: true
                }
            });
        }

        // Execute the next action
        const domain = nextAction.domain;
        const executorMap = {
            mercury: orchestrator.executeMercuryActions,
            venus: orchestrator.executeVenusActions,
            earth: orchestrator.executeEarthActions,
            mars: orchestrator.executeMarsActions,
            jupiter: orchestrator.executeJupiterActions,
            saturn: orchestrator.executeSaturnActions
        };

        const results = await executorMap[domain](userId, [nextAction]);

        // Update action status
        const action = plan.domainActions[domain].id(nextAction.actionId);
        if (action && results[0]) {
            action.status = results[0].status;
            if (results[0].status === 'completed') {
                action.completedAt = new Date();
            }
            if (results[0].error) {
                action.error = results[0].error;
            }
            await plan.save();
        }

        res.json({
            success: true,
            message: 'Next action executed',
            data: {
                planId: plan.planId,
                action: nextAction,
                result: results[0],
                remainingActions: plan.execution.pendingActions - 1
            }
        });

    } catch (error) {
        console.error('[Orchestrator] Execute next action error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute next action',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Pause plan
 * POST /api/orchestrator/plans/:planId/pause
 */
exports.pausePlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.params;

        const plan = await HolisticPlan.findOne({ userId, planId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        plan.status = 'paused';
        await plan.save();

        res.json({
            success: true,
            message: 'Plan paused',
            data: plan.toClientJSON()
        });

    } catch (error) {
        console.error('[Orchestrator] Pause plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to pause plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Resume plan
 * POST /api/orchestrator/plans/:planId/resume
 */
exports.resumePlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.params;

        const plan = await HolisticPlan.findOne({ userId, planId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        if (plan.status !== 'paused') {
            return res.status(400).json({
                success: false,
                message: 'Can only resume paused plans'
            });
        }

        plan.status = 'active';
        await plan.save();

        res.json({
            success: true,
            message: 'Plan resumed',
            data: plan.toClientJSON()
        });

    } catch (error) {
        console.error('[Orchestrator] Resume plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resume plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Cancel plan
 * DELETE /api/orchestrator/plans/:planId
 */
exports.cancelPlan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId } = req.params;

        const plan = await HolisticPlan.findOne({ userId, planId });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        plan.status = 'cancelled';
        await plan.save();

        res.json({
            success: true,
            message: 'Plan cancelled',
            data: plan.toClientJSON()
        });

    } catch (error) {
        console.error('[Orchestrator] Cancel plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel plan',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get plan statistics
 * GET /api/orchestrator/stats
 */
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await HolisticPlan.getUserPlanStats(userId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('[Orchestrator] Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Analyze domains (without creating plan)
 * GET /api/orchestrator/analyze
 */
exports.analyzeDomains = async (req, res) => {
    try {
        const userId = req.user.id;

        

        const domainData = await orchestrator.analyzeAllDomains(userId);
        const patterns = await orchestrator.detectCrossDomainPatterns(domainData);

        res.json({
            success: true,
            data: {
                domains: domainData,
                patterns,
                patternCount: patterns.length,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('[Orchestrator] Analyze domains error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze domains',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
