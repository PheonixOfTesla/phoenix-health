/**
 * PHOENIX AI PATTERN DETECTION - COMPREHENSIVE TEST SCRIPT
 *
 * Tests pattern detection accuracy with 10 personas + 90 days of data.
 * Validates detection against ground truth expectations.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const personaGenerator = require('./Src/services/training/personaGenerator10K');
const lifeEventInjector = require('./Src/services/training/lifeEventInjector');
const patternDetectionEngine = require('./Src/services/phoenix/patternDetectionEngine');

const User = require('./Src/models/User');
const WearableData = require('./Src/models/mercury/WearableData');
const PhoenixCache = require('./Src/models/PhoenixCache');

class PatternDetectionTester {
  constructor() {
    this.testResults = {
      personasTested: 0,
      patternsDetected: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      detailedResults: []
    };
  }

  async run() {
    try {
      console.log('\n');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🧪 PHOENIX AI PATTERN DETECTION - TEST SUITE');
      console.log('═══════════════════════════════════════════════════════════════\n');

      // Connect to MongoDB
      await this.connectDatabase();

      // Clean up any existing test data
      await this.cleanupTestData();

      // Generate 10 test personas with diverse profiles
      console.log('📊 Step 1: Generating 10 Test Personas...\n');
      const personas = await this.generateTestPersonas(10);
      console.log(`✓ Generated ${personas.length} test personas\n`);

      // Process each persona
      console.log('📈 Step 2: Simulating Life Events + Pattern Detection...\n');

      for (let i = 0; i < personas.length; i++) {
        const persona = personas[i];
        console.log(`\n[${i + 1}/${personas.length}] Testing Persona: ${persona.personaId}`);
        console.log(`   Profile: ${persona.ageGroup}, ${persona.occupation}, ${persona.location}`);
        console.log(`   Conditions: ${persona.conditions.join(', ')}`);

        try {
          // Create user
          const user = await this.createTestUser(persona);

          // Generate life events
          const lifeEvents = lifeEventInjector.generateLifeEventsForPersona(persona, 90);
          console.log(`   Generated ${lifeEvents.length} life events`);

          // Generate 90 days of wearable data
          await this.generateWearableData(user._id, persona, lifeEvents, 90);
          console.log(`   Generated 90 days of wearable data`);

          // Run pattern detection
          const detectedPatterns = await patternDetectionEngine.detectPatterns(user._id, 30);
          console.log(`   Detected ${detectedPatterns.length} patterns`);

          if (detectedPatterns.length > 0) {
            detectedPatterns.forEach(p => {
              console.log(`      - ${p.patternName} (${p.confidence}% confidence)`);
            });
          }

          // Validate against ground truth
          const validation = this.validateDetection(persona, detectedPatterns);
          this.testResults.detailedResults.push({
            persona: persona.personaId,
            expected: persona.simulationMetadata.expectedPatterns,
            detected: detectedPatterns.map(p => p.patternId),
            validation
          });

          // Update statistics
          this.testResults.personasTested++;
          this.testResults.patternsDetected += detectedPatterns.length;
          this.testResults.truePositives += validation.truePositives;
          this.testResults.falsePositives += validation.falsePositives;
          this.testResults.falseNegatives += validation.falseNegatives;

          console.log(`   ✓ Validation: TP=${validation.truePositives}, FP=${validation.falsePositives}, FN=${validation.falseNegatives}`);

        } catch (error) {
          console.error(`   ❌ Error testing persona ${persona.personaId}:`, error.message);
        }
      }

      // Calculate final metrics
      this.calculateMetrics();

      // Print detailed report
      await this.printDetailedReport();

      // Save report to file
      await this.saveReportToFile();

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

  async cleanupTestData() {
    console.log('🧹 Cleaning up old test data...');
    await User.deleteMany({ isSimulation: true });
    await WearableData.deleteMany({ provider: 'simulation' });
    await PhoenixCache.deleteMany({});
    console.log('✓ Cleanup complete\n');
  }

  async generateTestPersonas(count) {
    // Generate diverse personas manually for controlled testing
    const personas = [];

    // Age group templates to distribute across
    const ageGroups = [
      { name: 'teenagers', config: { count: 1, ageRange: [14, 17], conditions: ['anxiety', 'adhd', 'athlete', 'student'] } },
      { name: 'college', config: { count: 1, ageRange: [18, 22], conditions: ['anxiety', 'depression', 'athlete', 'student', 'party_lifestyle'] } },
      { name: 'young_professional', config: { count: 1, ageRange: [23, 30], conditions: ['anxiety', 'athlete', 'single', 'career_stress'] } },
      { name: 'established_professional', config: { count: 1, ageRange: [31, 45], conditions: ['hypertension', 'diabetes', 'married', 'parent', 'career_stress'] } },
      { name: 'midlife', config: { count: 1, ageRange: [46, 60], conditions: ['hypertension', 'diabetes', 'arthritis', 'married', 'parent'] } },
      { name: 'senior', config: { count: 1, ageRange: [61, 75], conditions: ['hypertension', 'diabetes', 'arthritis', 'heart_disease', 'retired'] } }
    ];

    for (let i = 0; i < count; i++) {
      // Cycle through age groups to ensure diversity
      const ageGroupIndex = i % ageGroups.length;
      const { name, config } = ageGroups[ageGroupIndex];

      const personaId = `TEST-${String(i + 1).padStart(4, '0')}`;
      const persona = personaGenerator.generateSinglePersona(personaId, name, config);
      personas.push(persona);
    }

    return personas;
  }

  async createTestUser(persona) {
    const user = new User({
      email: `${persona.personaId}@test.phoenix.ai`,
      name: `Test ${persona.personaId}`,
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

  async generateWearableData(userId, persona, lifeEvents, days) {
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

      // Add natural variation
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
        sleepDuration: Math.round((metrics.sleepDuration || persona.baseline.sleepDuration) * 60),
        hrv: Math.round(metrics.hrv || persona.baseline.hrv),
        recoveryScore: Math.round(metrics.recoveryScore || persona.baseline.recoveryScore),
        strain: Math.round((metrics.activeMinutes || 0) / 3)
      });
    }

    if (dataPoints.length > 0) {
      await WearableData.insertMany(dataPoints, { ordered: false });
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

  validateDetection(persona, detectedPatterns) {
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

  calculateMetrics() {
    const { truePositives, falsePositives, falseNegatives } = this.testResults;

    // Precision = TP / (TP + FP)
    this.testResults.precision = truePositives / (truePositives + falsePositives) || 0;

    // Recall = TP / (TP + FN)
    this.testResults.recall = truePositives / (truePositives + falseNegatives) || 0;

    // Accuracy = TP / (TP + FP + FN)
    this.testResults.accuracy = truePositives / (truePositives + falsePositives + falseNegatives) || 0;

    // F1 Score = 2 * (Precision * Recall) / (Precision + Recall)
    this.testResults.f1Score = 2 * (this.testResults.precision * this.testResults.recall) /
      (this.testResults.precision + this.testResults.recall) || 0;
  }

  async printDetailedReport() {
    console.log('\n\n═══════════════════════════════════════════════════════════════');
    console.log('✅ PATTERN DETECTION TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📊 OVERALL METRICS:\n');
    console.log(`   Personas Tested:         ${this.testResults.personasTested}`);
    console.log(`   Patterns Detected:       ${this.testResults.patternsDetected}`);
    console.log(`   True Positives:          ${this.testResults.truePositives}`);
    console.log(`   False Positives:         ${this.testResults.falsePositives}`);
    console.log(`   False Negatives:         ${this.testResults.falseNegatives}\n`);

    console.log('🎯 PERFORMANCE METRICS:\n');
    console.log(`   Accuracy:                ${(this.testResults.accuracy * 100).toFixed(1)}%`);
    console.log(`   Precision:               ${(this.testResults.precision * 100).toFixed(1)}%`);
    console.log(`   Recall:                  ${(this.testResults.recall * 100).toFixed(1)}%`);
    console.log(`   F1 Score:                ${(this.testResults.f1Score * 100).toFixed(1)}%\n`);

    console.log('📋 PER-PERSONA RESULTS:\n');
    this.testResults.detailedResults.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.persona}`);
      console.log(`      Expected: [${result.expected.join(', ')}]`);
      console.log(`      Detected: [${result.detected.join(', ')}]`);
      console.log(`      TP=${result.validation.truePositives}, FP=${result.validation.falsePositives}, FN=${result.validation.falseNegatives}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  async saveReportToFile() {
    const fs = require('fs').promises;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/Users/moderndavinci/Desktop/pal-backend/pattern-detection-test-report-${timestamp}.json`;

    await fs.writeFile(filename, JSON.stringify(this.testResults, null, 2));
    console.log(`💾 Detailed report saved to: ${filename}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new PatternDetectionTester();
  tester.run()
    .then(() => {
      console.log('✨ Pattern detection testing complete.\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Testing failed:', error);
      process.exit(1);
    });
}

module.exports = PatternDetectionTester;
