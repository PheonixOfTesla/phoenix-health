// Test Natural Language Workout Generator
// Run with: node test-natural-language-workout.js

require('dotenv').config();
const mongoose = require('mongoose');

// Import the service directly
const nlWorkoutGen = require('./Src/services/venus/naturalLanguageWorkoutGenerator');

const testRequests = [
  "I want a fat ass",
  "Help me lose weight fast",
  "I'm tired, give me something light",
  "Build muscle in my arms",
  "I want to get shredded for summer",
  "Quick 30 minute home workout",
  "I'm sore from yesterday but I want to train",
  "Give me a leg day that will destroy me",
  "Upper body strength workout"
];

async function testNaturalLanguageWorkouts() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TESTING NATURAL LANGUAGE WORKOUT GENERATOR');
    console.log('='.repeat(80) + '\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phoenix');
    console.log('✅ Connected to MongoDB\n');

    // Test each request
    for (let i = 0; i < testRequests.length; i++) {
      const request = testRequests[i];

      console.log(`\n${'─'.repeat(80)}`);
      console.log(`TEST ${i + 1}/${testRequests.length}`);
      console.log(`${'─'.repeat(80)}`);
      console.log(`📝 User Request: "${request}"`);
      console.log('');

      try {
        // Create a mock user ID (in production this would be a real user)
        const mockUserId = new mongoose.Types.ObjectId();

        // Generate workout
        const result = await nlWorkoutGen.generateFromNaturalLanguage(
          mockUserId,
          request
        );

        console.log('✅ RESULT:');
        console.log('');
        console.log(`📊 Parsed Intent:`);
        console.log(`   Primary Goal: ${result.parsedIntent.primaryGoal}`);
        console.log(`   Target Muscles: ${result.parsedIntent.targetMuscles.join(', ')}`);
        console.log(`   Workout Type: ${result.parsedIntent.workoutType}`);
        console.log(`   Intensity: ${(result.parsedIntent.intensity * 100).toFixed(0)}%`);
        console.log(`   Duration: ${result.parsedIntent.duration} minutes`);
        console.log(`   Mood: ${result.parsedIntent.mood}`);
        console.log(`   Confidence: ${(result.parsedIntent.confidence * 100).toFixed(0)}%`);
        console.log('');

        console.log(`🏋️  Generated Workout:`);
        console.log(`   Name: ${result.workout.name}`);
        console.log(`   Exercises: ${result.workout.exercises?.length || 0}`);
        console.log(`   Chaos Level: ${(result.workout.chaosLevel * 100).toFixed(0)}%`);
        console.log(`   Plateau Break: ${result.workout.plateauBreakProtocol ? 'YES ⚡' : 'No'}`);
        console.log('');

        console.log(`💬 Explanation:`);
        console.log(`   ${result.explanation.split('\n').join('\n   ')}`);

        if (result.workout.exercises && result.workout.exercises.length > 0) {
          console.log('');
          console.log(`📋 Exercise List:`);
          result.workout.exercises.slice(0, 5).forEach((ex, idx) => {
            console.log(`   ${idx + 1}. ${ex.name || 'Exercise'}: ${ex.sets || 3} sets × ${ex.reps || '10-12'} reps`);
          });
          if (result.workout.exercises.length > 5) {
            console.log(`   ... and ${result.workout.exercises.length - 5} more exercises`);
          }
        }

      } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.stack) {
          console.error('Stack trace:', error.stack.split('\n').slice(0, 3).join('\n'));
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error(error.stack);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
    process.exit(0);
  }
}

// Run tests
testNaturalLanguageWorkouts();
