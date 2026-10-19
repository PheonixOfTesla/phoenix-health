/**
 * MARS CONTROLLER - Goals, Habits, Milestones, Progress Tracking
 * 
 * Phoenix Backend - Planetary System Architecture
 * File: Src/controllers/marsController.js
 * Route: Src/routes/mars.js
 * Base Path: /api/mars
 * Total Methods: 18
 * 
 * CONSOLIDATES:
 * - goalController.js (expanded from 10 to 18 methods)
 * 
 * MODELS USED:
 * - Goal
 * - Habit
 * - Milestone
 * - GoalProgress
 * - MotivationalIntervention
 * 
 * SERVICES USED:
 * - goalTracker.js - Goal management
 * - smartGoalGenerator.js - AI goal creation
 * - motivationEngine.js - Motivational features
 */

const asyncHandler = require('express-async-handler');
const Goal = require('../models/mars/Goal');
// Note: Habits and Milestones are embedded in Goal model
// Services may need to be created if they don't exist yet
const goalTracker = require('../services/mars/goalTracker');
const smartGoalGenerator = require('../services/mars/smartGoalGenerator');
const motivationEngine = require('../services/mars/motivationEngine');
const domainEvents = require('../services/phoenix/domainEventEmitter');

// ========================================
// A. GOAL MANAGEMENT (6 methods)
// ========================================

/**
 * @desc    Create a new goal
 * @route   POST /api/mars/goals
 * @access  Private
 */
exports.createGoal = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    type,
    targetValue,
    currentValue,
    unit,
    targetDate,
    priority,
    milestones,
    habits,
    tags
  } = req.body;

  // Create goal
  const goal = await Goal.create({
    userId: req.user.id,
    title,
    description,
    category,
    type,
    targetValue,
    currentValue: currentValue || 0,
    unit,
    startDate: Date.now(),
    targetDate,
    priority: priority || 'medium',
    status: 'active',
    milestones: milestones || [],
    habits: habits || [],
    tags: tags || [],
    progress: 0
  });

  // Auto-generate milestones if not provided
  if (!milestones || milestones.length === 0) {
    const autoMilestones = await goalTracker.generateMilestones(goal);
    goal.milestones = autoMilestones;
    await goal.save();
  }

  // ✨ EMIT EVENT: Goal created
  domainEvents.emitGoalCreated(req.user.id, {
    title: goal.title,
    category: goal.category,
    targetDate: goal.targetDate,
    priority: goal.priority
  });

  res.status(201).json({
    success: true,
    data: goal,
    message: 'Goal created successfully'
  });
});

/**
 * @desc    Get all goals for user
 * @route   GET /api/mars/goals
 * @access  Private
 */
exports.getGoals = asyncHandler(async (req, res) => {
  const { status, category, type, priority } = req.query || {};

  // Build query
  const query = { userId: req.user.id };

  if (status) query.status = status;
  if (category) query.category = category;
  if (type) query.type = type;
  if (priority) query.priority = priority;

  // Fetch goals
  const goals = await Goal.find(query).sort('-createdAt').lean();

  // Calculate stats
  const stats = {
    total: await Goal.countDocuments({ userId: req.user.id }),
    active: await Goal.countDocuments({ userId: req.user.id, status: 'active' }),
    completed: await Goal.countDocuments({ userId: req.user.id, status: 'completed' }),
    paused: await Goal.countDocuments({ userId: req.user.id, status: 'paused' })
  };

  res.status(200).json({
    success: true,
    count: goals.length,
    stats,
    data: goals
  });
});

/**
 * @desc    Get single goal by ID
 * @route   GET /api/mars/goals/:id
 * @access  Private
 */
exports.getGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id).lean();

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this goal');
  }

  // Get insights using virtual fields and calculations
  const insights = {
    daysRemaining: goal.daysRemaining,
    progressRate: goal.progressRate,
    milestonesCompleted: goal.milestones.filter(m => m.completed).length,
    totalMilestones: goal.milestones.length
  };

  res.status(200).json({
    success: true,
    data: {
      goal,
      insights
    }
  });
});

/**
 * @desc    Update goal
 * @route   PUT /api/mars/goals/:id
 * @access  Private
 */
exports.updateGoal = asyncHandler(async (req, res) => {
  let goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this goal');
  }

  // Update goal
  goal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: goal
  });
});

/**
 * @desc    Delete goal
 * @route   DELETE /api/mars/goals/:id
 * @access  Private
 */
exports.deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this goal');
  }

  await goal.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Complete goal
 * @route   POST /api/mars/goals/:id/complete
 * @access  Private
 */
exports.completeGoal = asyncHandler(async (req, res) => {
  const { reflection, achievements } = req.body;

  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to complete this goal');
  }

  // Mark as completed
  goal.status = 'completed';
  goal.progress = 100;
  goal.currentValue = goal.targetValue;
  await goal.save();

  // ✨ EMIT EVENT: Goal completed (triggers celebration in Intelligence Loop)
  domainEvents.emitGoalCompleted(req.user.id, {
    id: goal._id,
    title: goal.title,
    completedAt: new Date()
  });

  // Generate celebration message
  const celebration = await motivationEngine.generateCelebration(goal);

  res.status(200).json({
    success: true,
    data: goal,
    celebration
  });
});

// ========================================
// B. AI GOAL GENERATION (3 methods)
// ========================================

/**
 * @desc    Generate SMART goal from vague input
 * @route   POST /api/mars/goals/generate-smart
 * @access  Private
 */
exports.generateSmartGoal = asyncHandler(async (req, res) => {
  const { generalGoal, domain } = req.body;

  if (!generalGoal) {
    res.status(400);
    throw new Error('Please provide a general goal');
  }

  // Use AI to convert to SMART goal
  const smartGoal = await smartGoalGenerator.generate(req.user.id, {
    generalGoal,
    domain
  });

  res.status(200).json({
    success: true,
    data: smartGoal
  });
});

/**
 * @desc    Get personalized goal suggestions
 * @route   POST /api/mars/goals/suggest
 * @access  Private
 */
exports.getGoalSuggestions = asyncHandler(async (req, res) => {
  const { domain } = req.body;

  // Generate AI-powered suggestions based on user data
  const suggestions = await smartGoalGenerator.suggest(req.user.id, domain);

  res.status(200).json({
    success: true,
    data: suggestions
  });
});

/**
 * @desc    Get goal templates
 * @route   GET /api/mars/goals/templates
 * @access  Private
 */
exports.getGoalTemplates = asyncHandler(async (req, res) => {
  const { category, difficulty } = req.query || {};

  // Fetch templates
  const templates = await smartGoalGenerator.getTemplates({
    category,
    difficulty
  });

  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

// ========================================
// C. PROGRESS TRACKING (4 methods)
// ========================================

/**
 * @desc    Log progress update
 * @route   POST /api/mars/goals/:id/progress
 * @access  Private
 */
exports.logProgress = asyncHandler(async (req, res) => {
  const { value, notes, date } = req.body;

  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this goal');
  }

  // Update current value
  goal.currentValue = value;
  
  // Calculate percentage complete (handled by pre-save hook in model)
  const percentComplete = goal.targetValue > 0 
    ? ((value / goal.targetValue) * 100).toFixed(2) 
    : 0;
  
  goal.progress = percentComplete;
  
  // Check if goal is completed (handled by pre-save hook)
  if (percentComplete >= 100) {
    goal.status = 'completed';
  }

  await goal.save();

  // ✨ EMIT EVENT: Progress logged
  domainEvents.emitProgressLogged(req.user.id, {
    goalId: goal._id,
    value: value,
    percentComplete: percentComplete
  });

  // Calculate trend using goalTracker service
  const trend = await goalTracker.calculateTrend(goal._id);

  res.status(200).json({
    success: true,
    data: {
      goal,
      percentComplete,
      trend,
      notes
    }
  });
});

/**
 * @desc    Get progress history
 * @route   GET /api/mars/goals/:id/progress
 * @access  Private
 */
exports.getProgress = asyncHandler(async (req, res) => {
  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this goal');
  }

  // Calculate trend using virtual fields and services
  const trend = await goalTracker.calculateTrend(goal._id);

  // Calculate projected completion
  const projectedCompletion = await goalTracker.projectCompletion(goal._id);

  res.status(200).json({
    success: true,
    data: {
      currentValue: goal.currentValue,
      targetValue: goal.targetValue,
      progress: goal.progress,
      status: goal.status,
      daysRemaining: goal.daysRemaining,
      progressRate: goal.progressRate,
      trend,
      projectedCompletion
    }
  });
});

/**
 * @desc    Get progress velocity
 * @route   GET /api/mars/progress/velocity
 * @access  Private
 */
exports.getProgressVelocity = asyncHandler(async (req, res) => {
  const { goalId } = req.query || {};

  if (!goalId) {
    res.status(400);
    throw new Error('Please provide a goalId');
  }

  const goal = await Goal.findById(goalId);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this goal');
  }

  // Calculate velocity
  const velocity = await goalTracker.calculateVelocity(goalId);

  res.status(200).json({
    success: true,
    data: velocity
  });
});

/**
 * @desc    Get progress predictions
 * @route   GET /api/mars/progress/predictions
 * @access  Private
 */
exports.getProgressPredictions = asyncHandler(async (req, res) => {
  const { goalId } = req.query || {};

  if (!goalId) {
    res.status(400);
    throw new Error('Please provide a goalId');
  }

  const goal = await Goal.findById(goalId);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this goal');
  }

  // Use prediction engine (from Phoenix services)
  const predictionEngine = require('../services/phoenix/predictionEngine');
  const predictions = await predictionEngine.predictGoalSuccess(goalId);

  res.status(200).json({
    success: true,
    data: predictions
  });
});

// ========================================
// D. MILESTONES (2 methods)
// ========================================

/**
 * @desc    Create milestone for goal
 * @route   POST /api/mars/goals/:id/milestones
 * @access  Private
 */
exports.createMilestone = asyncHandler(async (req, res) => {
  const { title, targetValue, targetDate } = req.body;

  const goal = await Goal.findById(req.params.id);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to modify this goal');
  }

  // Add milestone to embedded array
  goal.milestones.push({
    title,
    targetValue,
    targetDate,
    completed: false
  });

  await goal.save();

  res.status(201).json({
    success: true,
    data: goal.milestones
  });
});

/**
 * @desc    Complete milestone
 * @route   POST /api/mars/milestones/:id/complete
 * @access  Private
 */
exports.completeMilestone = asyncHandler(async (req, res) => {
  const milestoneId = req.params.id;

  // Find goal containing this milestone
  const goal = await Goal.findOne({
    userId: req.user.id,
    'milestones._id': milestoneId
  });

  if (!goal) {
    res.status(404);
    throw new Error('Milestone not found');
  }

  // Find and update milestone
  const milestone = goal.milestones.id(milestoneId);
  milestone.completed = true;
  milestone.completedAt = Date.now();

  await goal.save();

  // Find next incomplete milestone
  const nextMilestone = goal.milestones.find(m => !m.completed);

  res.status(200).json({
    success: true,
    data: {
      milestone,
      nextMilestone
    }
  });
});

// ========================================
// E. HABITS (2 methods)
// ========================================

/**
 * @desc    Get all habits for user
 * @route   GET /api/mars/habits
 * @access  Private
 */
exports.getHabits = asyncHandler(async (req, res) => {
  // Habits are embedded in goals, so get all user goals and extract habits
  const goals = await Goal.find({ userId: req.user.id });

  const habits = [];
  goals.forEach(goal => {
    if (goal.habits && goal.habits.length > 0) {
      goal.habits.forEach(habit => {
        habits.push({
          _id: habit._id,
          name: habit.title || habit.name,
          title: habit.title,
          frequency: habit.frequency,
          streak: habit.streak || 0,
          currentStreak: habit.streak || 0,
          lastCompleted: habit.lastCompleted,
          completedToday: habit.lastCompleted ?
            new Date(habit.lastCompleted).toDateString() === new Date().toDateString() : false,
          goalId: goal._id,
          goalTitle: goal.title
        });
      });
    }
  });

  res.json({
    success: true,
    habits: habits
  });
});

/**
 * @desc    Create habit
 * @route   POST /api/mars/habits
 * @access  Private
 */
exports.createHabit = asyncHandler(async (req, res) => {
  const { title, name, frequency, category, linkedGoalId } = req.body;
  const habitName = title || name; // Support both field names

  if (!habitName) {
    res.status(400);
    throw new Error('Habit name/title is required');
  }

  let goal;

  if (linkedGoalId) {
    // Use specified goal
    goal = await Goal.findById(linkedGoalId);
    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }
    if (goal.userId.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to modify this goal');
    }
  } else {
    // Find or create "General Habits" goal for standalone habits
    goal = await Goal.findOne({
      userId: req.user.id,
      title: 'General Habits',
      category: 'habits'
    });

    if (!goal) {
      goal = await Goal.create({
        userId: req.user.id,
        title: 'General Habits',
        description: 'Container for standalone habits',
        category: 'habits',
        status: 'active',
        habits: []
      });
    }
  }

  // Add habit to embedded array
  goal.habits.push({
    title: habitName,
    frequency: frequency || 'daily',
    category: category || 'general',
    streak: 0,
    lastCompleted: null
  });

  await goal.save();

  const newHabit = goal.habits[goal.habits.length - 1];

  res.status(201).json({
    success: true,
    data: newHabit,
    habit: newHabit
  });
});

/**
 * @desc    Log habit completion
 * @route   POST /api/mars/habits/:id/log
 * @access  Private
 */
exports.logHabit = asyncHandler(async (req, res) => {
  const { completed, date } = req.body;
  const habitId = req.params.id;

  // Find goal containing this habit
  const goal = await Goal.findOne({
    userId: req.user.id,
    'habits._id': habitId
  });

  if (!goal) {
    res.status(404);
    throw new Error('Habit not found');
  }

  // Find habit
  const habit = goal.habits.id(habitId);

  // Update streak
  const logDate = date ? new Date(date) : new Date();
  habit.lastCompleted = logDate;

  if (completed) {
    habit.streak = (habit.streak || 0) + 1;
  } else {
    habit.streak = 0;
  }

  await goal.save();

  // Generate motivational message
  const motivation = await motivationEngine.generateHabitMotivation(habit, goal);

  res.status(200).json({
    success: true,
    data: {
      habit,
      streak: habit.streak,
      motivation
    }
  });
});

// ========================================
// F. ANALYTICS & BOTTLENECKS (1 method)
// ========================================

/**
 * @desc    Get bottleneck analysis
 * @route   GET /api/mars/progress/bottlenecks
 * @access  Private
 */
exports.getBottlenecks = asyncHandler(async (req, res) => {
  const { goalId } = req.query || {};

  if (!goalId) {
    res.status(400);
    throw new Error('Please provide a goalId');
  }

  const goal = await Goal.findById(goalId);

  if (!goal) {
    res.status(404);
    throw new Error('Goal not found');
  }

  // Verify ownership
  if (goal.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this goal');
  }

  // Analyze bottlenecks
  const bottlenecks = await goalTracker.analyzeBottlenecks(goalId);

  res.status(200).json({
    success: true,
    data: bottlenecks
  });
});

// ========================================
// G. MOTIVATIONAL SYSTEMS (2 methods)
// ========================================

/**
 * @desc    Get motivational interventions
 * @route   GET /api/mars/motivation/interventions
 * @access  Private
 */
exports.getMotivationalInterventions = asyncHandler(async (req, res) => {
  // Get interventions
  const interventions = await motivationEngine.getInterventions(req.user.id);

  res.status(200).json({
    success: true,
    data: interventions
  });
});

/**
 * @desc    Trigger motivation boost
 * @route   POST /api/mars/motivation/boost
 * @access  Private
 */
exports.triggerMotivationBoost = asyncHandler(async (req, res) => {
  const { goalId, reason } = req.body;

  // Generate motivational boost
  const boost = await motivationEngine.generateBoost(req.user.id, {
    goalId,
    reason
  });

  res.status(200).json({
    success: true,
    data: boost
  });
});

// ========================================
// H. HABIT ANALYTICS (2 methods)
// ========================================

/**
 * @desc    Get habit streak data
 * @route   GET /api/mars/habits/streak
 * @access  Private
 */
exports.getHabitStreak = asyncHandler(async (req, res) => {
  // Get all goals with habits for user
  const goals = await Goal.find({ userId: req.user.id });

  let totalStreak = 0;
  let longestStreak = 0;

  goals.forEach(goal => {
    if (goal.habits && goal.habits.length > 0) {
      goal.habits.forEach(habit => {
        if (habit.streak) {
          totalStreak += habit.streak;
          if (habit.streak > longestStreak) {
            longestStreak = habit.streak;
          }
        }
      });
    }
  });

  res.status(200).json({
    success: true,
    streak: {
      current: totalStreak,
      longest: longestStreak,
      thisWeek: Math.min(totalStreak, 7)
    }
  });
});

/**
 * @desc    Get habit grid (GitHub-style activity)
 * @route   GET /api/mars/habits/grid
 * @access  Private
 */
exports.getHabitGrid = asyncHandler(async (req, res) => {
  const days = parseInt((req.query || {}).days) || 365;

  // Generate empty grid for now
  const grid = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    grid.push({
      date: date.toISOString().split('T')[0],
      count: 0,
      level: 0
    });
  }

  res.status(200).json({
    success: true,
    grid,
    totalDays: days
  });
});

// ========================================
// I. OKR MANAGEMENT (3 methods)
// ========================================

/**
 * @desc    Get current OKR
 * @route   GET /api/mars/okr/current
 * @access  Private
 */
exports.getCurrentOKR = asyncHandler(async (req, res) => {
  // Find goals that are OKR-type
  const okrGoals = await Goal.find({
    userId: req.user.id,
    type: 'okr',
    status: 'active'
  }).sort({ createdAt: -1 }).limit(1);

  if (okrGoals.length === 0) {
    return res.status(200).json({
      success: true,
      okr: null,
      message: 'No active OKR found'
    });
  }

  const okr = okrGoals[0];

  res.status(200).json({
    success: true,
    okr: {
      id: okr._id,
      objective: okr.title,
      keyResults: okr.milestones || [],
      progress: okr.currentValue || 0,
      createdAt: okr.createdAt
    }
  });
});

/**
 * @desc    Create OKR
 * @route   POST /api/mars/okr
 * @access  Private
 */
exports.createOKR = asyncHandler(async (req, res) => {
  const { objective, keyResults, timeline } = req.body;

  if (!objective) {
    res.status(400);
    throw new Error('Objective is required');
  }

  // Create as a special goal with type 'okr'
  const okr = await Goal.create({
    userId: req.user.id,
    title: objective,
    description: `OKR: ${objective}`,
    type: 'okr',
    category: 'okr',
    status: 'active',
    milestones: (keyResults || []).map(kr => ({
      title: kr.title || kr,
      targetValue: kr.target || 100,
      currentValue: kr.current || 0,
      status: 'pending'
    })),
    targetDate: timeline ? new Date(Date.now() + (timeline === 'quarterly' ? 90 : 30) * 24 * 60 * 60 * 1000) : null
  });

  res.status(201).json({
    success: true,
    okr: {
      id: okr._id,
      objective: okr.title,
      keyResults: okr.milestones
    }
  });
});

/**
 * @desc    Get all key results
 * @route   GET /api/mars/key-results/list
 * @access  Private
 */
exports.getKeyResults = asyncHandler(async (req, res) => {
  // Get all OKR goals and extract key results
  const okrGoals = await Goal.find({
    userId: req.user.id,
    type: 'okr'
  });

  const keyResults = [];
  okrGoals.forEach(okr => {
    if (okr.milestones && okr.milestones.length > 0) {
      okr.milestones.forEach(kr => {
        keyResults.push({
          id: kr._id,
          title: kr.title,
          target: kr.targetValue,
          current: kr.currentValue,
          progress: kr.targetValue ? Math.round((kr.currentValue / kr.targetValue) * 100) : 0,
          objective: okr.title,
          okrId: okr._id
        });
      });
    }
  });

  res.status(200).json({
    success: true,
    keyResults
  });
});

module.exports = exports;
