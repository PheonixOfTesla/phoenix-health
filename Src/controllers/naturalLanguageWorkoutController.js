// Natural Language Workout Controller
// Endpoint for users to generate workouts using plain English

const nlWorkoutGen = require('../services/venus/naturalLanguageWorkoutGenerator');
const Workout = require('../models/venus/Workout');

/**
 * Generate workout from natural language request
 * POST /api/venus/workouts/natural-language
 * Body: { request: "I want to get a fat ass" }
 */
exports.generateFromNaturalLanguage = async (req, res) => {
  try {
    const { request, saveWorkout = true } = req.body;
    const userId = req.user._id;

    // Validate request
    if (!request || typeof request !== 'string' || request.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Request text is required',
        examples: [
          "I want a fat ass",
          "Give me a workout to lose weight",
          "I'm tired, make me something light",
          "Build muscle in my arms",
          "I want to get shredded"
        ]
      });
    }

    // Check request length
    if (request.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Request too long (max 500 characters)'
      });
    }

    
    
    
    
    

    // Generate workout
    const result = await nlWorkoutGen.generateFromNaturalLanguage(
      userId,
      request,
      {
        saveWorkout,
        timezone: req.body.timezone || 'America/New_York'
      }
    );

    // Optionally save the workout to the database
    if (saveWorkout && result.workout) {
      const savedWorkout = await Workout.create({
        ...result.workout,
        userId,
        naturalLanguageRequest: request,
        generatedBy: 'ai',
        createdAt: new Date()
      });

      result.workoutId = savedWorkout._id;
      result.saved = true;
    }

    // Log success
    
    
    
    

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Natural language workout generation error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to generate workout',
      message: error.message,
      suggestion: 'Try rephrasing your request or use more specific terms'
    });
  }
};

/**
 * Get example requests
 * GET /api/venus/workouts/natural-language/examples
 */
exports.getExamples = async (req, res) => {
  try {
    const examples = {
      goalBased: [
        {
          request: "I want a fat ass",
          description: "Glute-focused hypertrophy workout",
          targetMuscles: ["glutes", "hamstrings"],
          workoutType: "hypertrophy"
        },
        {
          request: "Help me lose weight fast",
          description: "High-intensity metabolic workout",
          targetMuscles: ["full-body"],
          workoutType: "metabolic"
        },
        {
          request: "Build muscle in my arms",
          description: "Arm hypertrophy workout",
          targetMuscles: ["biceps", "triceps"],
          workoutType: "hypertrophy"
        },
        {
          request: "Get me shredded",
          description: "Fat loss circuit training",
          targetMuscles: ["full-body"],
          workoutType: "metabolic"
        },
        {
          request: "Make me stronger",
          description: "Strength training with compound lifts",
          targetMuscles: ["chest", "back", "legs"],
          workoutType: "strength"
        }
      ],

      moodBased: [
        {
          request: "I'm tired today, give me something light",
          description: "Low intensity recovery workout",
          intensity: 0.6
        },
        {
          request: "I'm feeling pumped, give me a killer workout",
          description: "High intensity full body blast",
          intensity: 1.0
        },
        {
          request: "I'm sore from yesterday",
          description: "Active recovery or different muscle group",
          intensity: 0.7
        }
      ],

      timeBased: [
        {
          request: "Quick 30 minute workout",
          description: "Efficient high-intensity session",
          duration: 30
        },
        {
          request: "I have 2 hours to train",
          description: "Extended training session",
          duration: 120
        }
      ],

      specificRequests: [
        {
          request: "Home workout with no equipment",
          description: "Bodyweight exercises only"
        },
        {
          request: "Low impact, no jumping",
          description: "Joint-friendly exercises"
        },
        {
          request: "I'm a beginner",
          description: "Beginner-friendly movements with form guidance"
        }
      ],

      advanced: [
        {
          request: "I want to build a thick back and wide shoulders",
          description: "Upper body hypertrophy focusing on back and delts"
        },
        {
          request: "Give me a leg day that will destroy me",
          description: "Intense lower body session with high volume"
        },
        {
          request: "I need cardio but I hate running",
          description: "Alternative cardio options (rowing, cycling, circuits)"
        }
      ]
    };

    res.status(200).json({
      success: true,
      data: examples,
      totalExamples: Object.values(examples).flat().length
    });

  } catch (error) {
    console.error('Error getting examples:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Refine a generated workout with additional requests
 * POST /api/venus/workouts/:workoutId/refine
 * Body: { request: "Make it harder" }
 */
exports.refineWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { request } = req.body;
    const userId = req.user._id;

    // Get original workout
    const originalWorkout = await Workout.findOne({
      _id: workoutId,
      userId
    });

    if (!originalWorkout) {
      return res.status(404).json({
        success: false,
        error: 'Workout not found'
      });
    }

    // Generate refined version
    const refinedRequest = `${originalWorkout.naturalLanguageRequest}. ${request}`;

    const result = await nlWorkoutGen.generateFromNaturalLanguage(
      userId,
      refinedRequest,
      {
        saveWorkout: false,
        originalWorkout: originalWorkout.toObject()
      }
    );

    res.status(200).json({
      success: true,
      data: {
        original: originalWorkout,
        refined: result.workout,
        changes: `Applied refinement: "${request}"`
      }
    });

  } catch (error) {
    console.error('Error refining workout:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
