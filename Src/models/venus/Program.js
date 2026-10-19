/**
 * Program Model - Venus Fitness Programs
 * Stores user-generated fitness programs with weekly schedules and nutrition plans
 */

const mongoose = require('mongoose');

// Exercise within workout schema
const programExerciseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    sets: { type: mongoose.Schema.Types.Mixed, required: true },
    reps: { type: String, required: true },
    rest: { type: Number, default: 60 },
    notes: { type: String, maxlength: 500 },
    alternatives: [String]
}, { _id: false });

// Workout schema
const programWorkoutSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['strength', 'cardio', 'flexibility', 'recovery', 'hiit', 'mixed'], required: true },
    duration: { type: Number, required: true },
    targetMuscles: [String],
    exercises: [programExerciseSchema],
    warmup: String,
    cooldown: String
}, { _id: false });

// Nutrition tip schema
const nutritionTipSchema = new mongoose.Schema({
    timing: { type: String, enum: ['pre_workout', 'post_workout', 'general', 'morning', 'evening'], default: 'general' },
    tip: { type: String, required: true },
    importance: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
}, { _id: false });

// Daily schedule schema
const dailyScheduleSchema = new mongoose.Schema({
    dayOfWeek: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], required: true },
    isRestDay: { type: Boolean, default: false },
    workout: programWorkoutSchema,
    nutritionTips: [nutritionTipSchema]
}, { _id: false });

// Phase schema
const phaseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    weeks: [Number],
    focus: String
}, { _id: false });

// Main Program schema
const programSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },

    // Goal configuration
    goal: {
        type: { type: String, enum: ['fat_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness', 'athletic_performance', 'body_recomposition', 'muscle', 'lean', 'athletic'], required: true },
        target: String,
        deadline: Date
    },

    experience: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
    style: { type: String, enum: ['traditional', 'circuit', 'hiit', 'crossfit', 'powerlifting', 'bodybuilding', 'functional', 'yoga', 'mixed', 'hit', 'volume', 'powerbuilding', 'balanced'], default: 'traditional' },

    // Diet configuration (ClockWork 10 diet types)
    dietPreferences: {
        type: { type: String, enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'flexible', 'halal', 'kosher'], default: 'flexible' },
        allergies: [String],
        cuisines: [String]
    },

    // Body stats at generation
    bodyStats: {
        weight: Number,
        weightUnit: { type: String, enum: ['kg', 'lbs'], default: 'lbs' },
        height: Number,
        heightUnit: { type: String, enum: ['cm', 'in'], default: 'in' },
        age: Number,
        gender: { type: String, enum: ['male', 'female', 'other'] }
    },

    // Program duration
    duration: {
        weeks: { type: Number, required: true, min: 1, max: 52, default: 12 },
        phases: [phaseSchema]
    },

    // Weekly schedule
    weeklySchedule: [dailyScheduleSchema],

    // Nutrition plan
    nutritionPlan: {
        dailyCalories: Number,
        macros: { protein: Number, carbs: Number, fat: Number },
        hydrationTarget: { type: Number, default: 2.5 },
        weeklyTips: [String]
    },

    // Status tracking
    status: { type: String, enum: ['draft', 'active', 'completed', 'paused', 'archived'], default: 'draft', index: true },
    isActive: { type: Boolean, default: false, index: true },
    startDate: Date,
    completedDate: Date,

    // Generation metadata
    generatedBy: { type: String, enum: ['gemini', 'claude', 'template', 'manual'], default: 'template' },
    generationReasoning: [String],

    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Indexes
programSchema.index({ userId: 1, status: 1 });
programSchema.index({ userId: 1, isActive: 1 });

// Virtuals
programSchema.virtual('currentWeek').get(function() {
    if (!this.startDate || this.status !== 'active') return null;
    const now = new Date();
    const start = new Date(this.startDate);
    const diffTime = now - start;
    const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.min(diffWeeks, this.duration.weeks);
});

programSchema.virtual('todayWorkout').get(function() {
    if (this.status !== 'active') return null;
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    return this.weeklySchedule.find(s => s.dayOfWeek === today) || null;
});

// Instance methods
programSchema.methods.activate = async function(startDate = new Date()) {
    await this.constructor.updateMany(
        { userId: this.userId, isActive: true, _id: { $ne: this._id } },
        { isActive: false, status: 'paused' }
    );
    this.isActive = true;
    this.status = 'active';
    this.startDate = startDate;
    return this.save();
};

// Static methods
programSchema.statics.getActiveProgram = function(userId) {
    return this.findOne({ userId, isActive: true, isDeleted: false });
};

programSchema.statics.getUserPrograms = function(userId, status = null) {
    const query = { userId, isDeleted: false };
    if (status) query.status = status;
    return this.find(query).sort({ createdAt: -1 });
};

// Pre-save hook
programSchema.pre('save', async function(next) {
    if (this.isActive && this.isModified('isActive')) {
        await this.constructor.updateMany(
            { userId: this.userId, isActive: true, _id: { $ne: this._id } },
            { isActive: false }
        );
    }
    next();
});

programSchema.set('toJSON', { virtuals: true });
programSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Program', programSchema);
