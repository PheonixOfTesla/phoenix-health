const mongoose = require('mongoose');

const wearableDataSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    provider: {
        type: String,
        enum: ['fitbit', 'apple', 'garmin', 'whoop', 'oura', 'polar', 'manual', 'simulation'],
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    
    // Activity Metrics
    steps: { type: Number, default: 0 },
    distance: { type: Number, default: 0 }, // in miles
    activeMinutes: { type: Number, default: 0 },
    caloriesBurned: { type: Number, default: 0 },
    
    // Heart Rate
    restingHeartRate: { type: Number },
    averageHeartRate: { type: Number },
    maxHeartRate: { type: Number },
    heartRateZones: [{
        name: String,
        min: Number,
        max: Number,
        minutes: Number
    }],
    
    // Sleep
    sleepDuration: { type: Number }, // in minutes
    deepSleep: { type: Number },
    lightSleep: { type: Number },
    remSleep: { type: Number },
    awakeTime: { type: Number }, // NEW for IMG Academy
    sleepScore: { type: Number }, // 0-100, NEW for IMG Academy
    sleepEfficiency: { type: Number }, // NEW for IMG Academy
    
    // Recovery (NEW for IMG Academy)
    hrv: { type: Number }, // Heart Rate Variability
    recoveryScore: { type: Number }, // 0-100, NEW
    strain: { type: Number }, // 0-21 (WHOOP style)
    trainingLoad: { type: Number }, // 0-100, NEW for IMG Academy
    
    // Body Metrics
    weight: { type: Number },
    bodyFat: { type: Number },
    bmi: { type: Number },
    leanBodyMass: { type: Number },
    bodyMassIndex: { type: Number },
    waistCircumference: { type: Number },

    // Advanced Vitals (Apple HealthKit + Google Fit)
    respiratoryRate: { type: Number }, // breaths per minute
    spo2: { type: Number }, // Blood oxygen saturation %
    vo2Max: { type: Number }, // Cardio fitness ml/kg/min
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    bloodGlucose: { type: Number }, // mg/dL
    bodyTemperature: { type: Number }, // Fahrenheit
    basalBodyTemperature: { type: Number },

    // Activity Details
    floors: { type: Number }, // Stairs climbed
    floorsDescended: { type: Number },
    exerciseMinutes: { type: Number }, // Apple Watch ring
    standHours: { type: Number }, // Apple Watch stand ring
    moveCalories: { type: Number }, // Active calories
    basalEnergyBurned: { type: Number }, // Resting calories
    swimmingDistance: { type: Number }, // yards
    swimmingStrokes: { type: Number },
    cyclingDistance: { type: Number },
    cyclingCadence: { type: Number }, // RPM
    cyclingPower: { type: Number }, // Watts
    cyclingSpeed: { type: Number }, // mph
    runningSpeed: { type: Number },
    runningPower: { type: Number },
    runningCadence: { type: Number }, // steps/min
    runningStrideLength: { type: Number },
    runningVerticalOscillation: { type: Number },
    runningGroundContactTime: { type: Number },
    walkingSpeed: { type: Number },
    walkingAsymmetry: { type: Number },
    walkingDoubleSupportPercentage: { type: Number },

    // Environmental & Exposure
    audioExposure: { type: Number }, // Decibels
    environmentalAudioExposure: { type: Number },
    headphoneAudioExposure: { type: Number },
    uvExposure: { type: Number }, // UV index
    timeInDaylight: { type: Number }, // minutes

    // Wellness & Mindfulness
    mindfulMinutes: { type: Number },
    stressLevel: { type: Number }, // 1-10 scale
    mood: { type: String }, // happy/sad/anxious/calm/etc
    energyLevel: { type: Number }, // 1-10

    // Hydration & Nutrition
    waterIntake: { type: Number }, // ml
    caffeineIntake: { type: Number }, // mg

    // Nutrition Macros (comprehensive)
    nutrition: {
        calories: { type: Number },
        protein: { type: Number }, // grams
        carbs: { type: Number },
        fat: { type: Number },
        fiber: { type: Number },
        sugar: { type: Number },
        saturatedFat: { type: Number },
        unsaturatedFat: { type: Number },
        transFat: { type: Number },
        cholesterol: { type: Number }, // mg
        sodium: { type: Number }, // mg
        potassium: { type: Number },
        // Vitamins
        vitaminA: { type: Number },
        vitaminC: { type: Number },
        vitaminD: { type: Number },
        vitaminE: { type: Number },
        vitaminK: { type: Number },
        vitaminB6: { type: Number },
        vitaminB12: { type: Number },
        thiamin: { type: Number },
        riboflavin: { type: Number },
        niacin: { type: Number },
        folate: { type: Number },
        // Minerals
        calcium: { type: Number },
        iron: { type: Number },
        magnesium: { type: Number },
        phosphorus: { type: Number },
        zinc: { type: Number },
        // Meal timing
        meals: [{
            time: Date,
            type: String, // breakfast/lunch/dinner/snack
            calories: Number,
            description: String
        }]
    },

    // Reproductive Health (Apple HealthKit)
    menstrualFlow: { type: String }, // none/light/medium/heavy
    ovulationTest: { type: String }, // positive/negative
    cervicalMucus: { type: String },
    basalBodyTemp: { type: Number },
    sexualActivity: { type: Boolean },

    // Respiratory
    inhalerUsage: { type: Number },
    peakExpiratoryFlowRate: { type: Number },
    forcedExpiratoryVolume: { type: Number },

    // Additional Google Fit Metrics
    heartPoints: { type: Number }, // Google Fit specific
    moveMinutes: { type: Number }, // Google Fit (different from active minutes)

    // Whoop-Specific Advanced Metrics
    skinTemp: { type: Number },
    sleepNeed: { type: Number }, // hours needed
    sleepDebt: { type: Number }, // cumulative hours
    respiratoryDisturbances: { type: Number },
    sleepConsistency: { type: Number }, // 0-100

    // Oura Ring Specific
    activityScore: { type: Number }, // 0-100
    readinessScore: { type: Number }, // 0-100
    temperatureDeviation: { type: Number }, // from baseline

    // Raw Data Storage (for provider-specific data)
    rawData: { type: mongoose.Schema.Types.Mixed },
    
    // Sync Info
    lastSynced: {
        type: Date,
        default: Date.now
    },
    syncStatus: {
        type: String,
        enum: ['success', 'partial', 'failed'],
        default: 'success'
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
wearableDataSchema.index({ userId: 1, date: -1 });
wearableDataSchema.index({ userId: 1, provider: 1, date: -1 });

module.exports = mongoose.model('WearableData', wearableDataSchema);
