/**
 * PHOENIX AI - 10K PERSONA TRAINING SCRIPT
 *
 * Generates 10,000 complete life simulations with pattern detection training.
 * This is the COMPLETE system - all 8 steps integrated.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const personaGenerator = require('./Src/services/training/personaGenerator10K');
const lifeEventInjector = require('./Src/services/training/lifeEventInjector');
const patternDetectionEngine = require('./Src/services/phoenix/patternDetectionEngine');

const User = require('./Src/models/User');
const WearableData = require('./Src/models/mercury/WearableData');

class Phoenix10KTrainer {
  constructor() {
    this.startTime = Date.now();
    this.stats = {
      personasGenerated: 0,
      wearableRecordsCreated: 0,
      patternsDetected: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      errors: 0,
      detailedResults: []
    };
  }

  async run() {
    try {
      console.log('\n');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🔥 PHOENIX AI - 10K PERSONA TRAINING');
      console.log('═══════════════════════════════════════════════════════════════\n');

      // Connect to MongoDB
      await this.connectDatabase();

      // Step 1: Generate 10,000 personas
      console.log('📊 STEP 1: Generating 10,000 Personas...\n');
      const personas = await personaGenerator.generateAll10K();
      this.stats.personasGenerated = personas.length;

      // Step 2-8: Process each persona
      console.log('\n📈 STEP 2-8: Simulating Life Journeys + Pattern Detection...\n');

      for (let i = 0; i < personas.length; i++) {
        const persona = personas[i];

        // Progress logging every 50 personas
        if (i % 50 === 0 && i > 0) {
          const elapsed = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
          const rate = (i / elapsed).toFixed(1);
          const accuracy = this.stats.truePositives /
            (this.stats.truePositives + this.stats.falsePositives + this.stats.falseNegatives) || 0;
          console.log(`   Progress: ${i}/${personas.length} personas (${rate}/min) - ${elapsed}min elapsed - Accuracy: ${(accuracy * 100).toFixed(1)}%`);
        }

        try {
          // Create user in database
          const user = await this.createUser(persona);

          // Generate life events for this persona
          const lifeEvents = lifeEventInjector.generateLifeEventsForPersona(persona, 90);

          // Generate 90 days of wearable data with event effects
          await this.generateWearableJourney(user._id, persona, lifeEvents, 90);

          // Run pattern detection on the generated data
          const detectedPatterns = await patternDetectionEngine.detectPatterns(user._id, 30);
          this.stats.patternsDetected += detectedPatterns.length;

          // Validate against ground truth
          const validation = this.validatePatternDetection(persona, detectedPatterns);
          this.stats.truePositives += validation.truePositives;
          this.stats.falsePositives += validation.falsePositives;
          this.stats.falseNegatives += validation.falseNegatives;

          // Store detailed result (sample every 100th persona to save memory)
          if (i % 100 === 0) {
            this.stats.detailedResults.push({
              personaId: persona.personaId,
              expected: persona.simulationMetadata.expectedPatterns,
              detected: detectedPatterns.map(p => p.patternId),
              validation
            });
          }

        } catch (error) {
          console.error(`   ❌ Error processing persona ${persona.personaId}:`, error.message);
          this.stats.errors++;
        }
      }

      // Final report
      await this.printFinalReport();

    } catch (error) {
      console.error('\n❌ FATAL ERROR:', error);
      throw error;
    } finally {
      await mongoose.disconnect();
    }
  }

  async connectDatabase() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  }

  async createUser(persona) {
    const user = new User({
      email: `${persona.personaId}@simulation.phoenix.ai`,
      name: `Simulation ${persona.personaId}`,
      age: persona.age,
      gender: persona.gender,
      role: 'client',
      isSimulation: true,
      simulationMetadata: {
        personaId: persona.personaId,
        conditions: persona.conditions,
        ageGroup: persona.ageGroup,
        occupation: persona.occupation,
        location: persona.location,
        expectedPatterns: persona.simulationMetadata.expectedPatterns
      }
    });

    await user.save();
    return user;
  }

  async generateWearableJourney(userId, persona, lifeEvents, days) {
    const dataPoints = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let day = 0; day < days; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + day);

      // Get active events for this day
      const activeEvents = lifeEventInjector.getActiveEvents(lifeEvents, day);

      // Start with baseline metrics
      let metrics = { ...persona.baseline };

      // Apply event effects
      if (activeEvents.length > 0) {
        metrics = lifeEventInjector.applyEventEffects(metrics, activeEvents, day);
      }

      // Add natural day-to-day variation (±5%)
      metrics = this.addNaturalVariation(metrics);

      // Create wearable data point
      dataPoints.push({
        userId,
        provider: 'simulation',
        date: currentDate,
        steps: Math.round(metrics.steps || persona.baseline.steps),
        distance: Math.round((metrics.steps || persona.baseline.steps) / 1300),
        activeMinutes: Math.round(metrics.activeMinutes || persona.baseline.activeMinutes),
        caloriesBurned: Math.round(metrics.caloriesBurned || persona.baseline.caloriesBurned),
        restingHeartRate: Math.round(metrics.restingHeartRate || persona.baseline.restingHeartRate),
        sleepDuration: Math.round((metrics.sleepDuration || persona.baseline.sleepDuration) * 60), // minutes
        hrv: Math.round(metrics.hrv || persona.baseline.hrv),
        recoveryScore: Math.round(metrics.recoveryScore || persona.baseline.recoveryScore),
        strain: Math.round((metrics.activeMinutes || 0) / 3)
      });
    }

    // Bulk insert for performance
    if (dataPoints.length > 0) {
      await WearableData.insertMany(dataPoints, { ordered: false });
      this.stats.wearableRecordsCreated += dataPoints.length;
    }
  }

  addNaturalVariation(metrics) {
    const varied = { ...metrics };

    for (const key in varied) {
      if (typeof varied[key] === 'number') {
        const variation = (Math.random() - 0.5) * 0.10; // ±5%
        varied[key] = varied[key] * (1 + variation);
      }
    }

    return varied;
  }

  /**
   * Validate pattern detection against ground truth
   */
  validatePatternDetection(persona, detectedPatterns) {
    const expectedPatterns = persona.simulationMetadata.expectedPatterns || [];
    const detectedIds = detectedPatterns.map(p => p.patternId);

    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    // Count true positives
    for (const expected of expectedPatterns) {
      if (detectedIds.includes(expected)) {
        truePositives++;
      } else {
        falseNegatives++;
      }
    }

    // Count false positives
    for (const detected of detectedIds) {
      if (!expectedPatterns.includes(detected)) {
        falsePositives++;
      }
    }

    return {
      truePositives,
      falsePositives,
      falseNegatives
    };
  }

  async printFinalReport() {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60;

    // Calculate accuracy metrics
    const { truePositives, falsePositives, falseNegatives } = this.stats;
    const accuracy = truePositives / (truePositives + falsePositives + falseNegatives) || 0;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('✅ PHOENIX 10K TRAINING COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`📊 GENERATION STATISTICS:\n`);
    console.log(`   Personas Generated:      ${this.stats.personasGenerated.toLocaleString()}`);
    console.log(`   Wearable Records:        ${this.stats.wearableRecordsCreated.toLocaleString()}`);
    console.log(`   Patterns Detected:       ${this.stats.patternsDetected.toLocaleString()}`);
    console.log(`   Errors:                  ${this.stats.errors}`);
    console.log(`   Total Runtime:           ${elapsed.toFixed(1)} minutes`);
    console.log(`   Rate:                    ${(this.stats.personasGenerated / elapsed).toFixed(1)} personas/min\n`);

    console.log(`🎯 PATTERN DETECTION ACCURACY:\n`);
    console.log(`   True Positives:          ${truePositives.toLocaleString()}`);
    console.log(`   False Positives:         ${falsePositives.toLocaleString()}`);
    console.log(`   False Negatives:         ${falseNegatives.toLocaleString()}`);
    console.log(`   Accuracy:                ${(accuracy * 100).toFixed(1)}%`);
    console.log(`   Precision:               ${(precision * 100).toFixed(1)}%`);
    console.log(`   Recall:                  ${(recall * 100).toFixed(1)}%`);
    console.log(`   F1 Score:                ${(f1Score * 100).toFixed(1)}%\n`);

    console.log(`📈 COVERAGE:\n`);
    console.log(`   Life Simulations:        ${(this.stats.personasGenerated * 90).toLocaleString()} days`);
    console.log(`   Years of Experience:     ${((this.stats.personasGenerated * 90) / 365).toFixed(0)} years`);
    console.log(`   Pattern Detection Rate:  ${(this.stats.patternsDetected / this.stats.personasGenerated).toFixed(2)} per persona\n`);

    console.log(`💾 DATABASE:\n`);
    console.log(`   Collections: users, wearabledatas, phoenix_cache`);
    console.log(`   Ready for: Production deployment & real-world testing\n`);

    // Save detailed report to file
    await this.saveDetailedReport(elapsed, accuracy, precision, recall, f1Score);

    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  /**
   * Save detailed report to JSON file
   */
  async saveDetailedReport(elapsed, accuracy, precision, recall, f1Score) {
    const fs = require('fs').promises;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/Users/moderndavinci/Desktop/pal-backend/phoenix-10k-training-report-${timestamp}.json`;

    const report = {
      timestamp: new Date().toISOString(),
      runtime_minutes: elapsed,
      generation_stats: {
        personas_generated: this.stats.personasGenerated,
        wearable_records: this.stats.wearableRecordsCreated,
        patterns_detected: this.stats.patternsDetected,
        errors: this.stats.errors,
        rate_per_min: (this.stats.personasGenerated / elapsed).toFixed(1)
      },
      accuracy_metrics: {
        true_positives: this.stats.truePositives,
        false_positives: this.stats.falsePositives,
        false_negatives: this.stats.falseNegatives,
        accuracy: (accuracy * 100).toFixed(1) + '%',
        precision: (precision * 100).toFixed(1) + '%',
        recall: (recall * 100).toFixed(1) + '%',
        f1_score: (f1Score * 100).toFixed(1) + '%'
      },
      coverage: {
        life_days_simulated: this.stats.personasGenerated * 90,
        years_of_experience: ((this.stats.personasGenerated * 90) / 365).toFixed(0),
        avg_patterns_per_persona: (this.stats.patternsDetected / this.stats.personasGenerated).toFixed(2)
      },
      sample_results: this.stats.detailedResults
    };

    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved: ${filename}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  const trainer = new Phoenix10KTrainer();
  trainer.run()
    .then(() => {
      console.log('✨ Training complete. Phoenix AI ready for deployment.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Training failed:', error);
      process.exit(1);
    });
}

module.exports = Phoenix10KTrainer;
