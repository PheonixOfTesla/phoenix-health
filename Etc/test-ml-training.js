/**
 * TEST SCRIPT: ML Training Pipeline
 * Tests the complete ML training system
 */

const mongoose = require('mongoose');
const mlTrainingService = require('./Src/services/phoenix/mlTrainingService');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0';

async function testMLTraining() {
  console.log('\n🎯 === ML TRAINING PIPELINE TEST ===\n');

  try {
    // 1. Connect to MongoDB
    console.log('1️⃣  Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected\n');

    // 2. Initialize ML Service
    console.log('2️⃣  Initializing ML Training Service...');
    await mlTrainingService.initialize();
    console.log('✅ ML Service Initialized\n');

    // 3. Train All Models
    console.log('3️⃣  Training all 4 ML models...\n');
    const results = await mlTrainingService.trainAllModels();

    console.log('\n✅ === TRAINING COMPLETE ===\n');
    console.log('Results:', JSON.stringify(results, null, 2));

    // 4. Verify Model Files Created
    console.log('\n4️⃣  Verifying model files...');
    const fs = require('fs');
    const path = require('path');

    const modelTypes = ['recovery', 'performance', 'goalSuccess', 'intervention'];
    const modelPath = path.join(__dirname, 'Src', 'ml-models');

    for (const type of modelTypes) {
      const dir = path.join(modelPath, type);
      const modelFile = path.join(dir, 'model.json');

      if (fs.existsSync(modelFile)) {
        console.log(`✅ ${type} model saved successfully`);
      } else {
        console.log(`❌ ${type} model NOT found`);
      }
    }

    console.log('\n✅ === TEST COMPLETE ===\n');

  } catch (error) {
    console.error('\n❌ === TEST FAILED ===\n');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testMLTraining();
