// Src/models/PendingButlerTask.js
// Stores pending Butler tasks awaiting user answers

const mongoose = require('mongoose');

const pendingButlerTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  originalTask: {
    type: String,
    required: true
  },
  // Questions still needing answers
  pendingQuestions: [{
    field: { type: String, required: true },
    question: { type: String, required: true },
    type: { type: String, default: 'text' } // text, address, time, number, date
  }],
  // Answers collected so far
  collectedAnswers: {
    type: Map,
    of: String,
    default: {}
  },
  // Plan summary for context
  planSummary: String,
  // Status
  status: {
    type: String,
    enum: ['awaiting_answers', 'ready', 'executing', 'completed', 'expired', 'failed'],
    default: 'awaiting_answers'
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Auto-delete after 1 hour (TTL index)
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now
  }
});

// Find the most recent pending task for a user
pendingButlerTaskSchema.statics.findLatestForUser = async function(userId) {
  return this.findOne({
    userId,
    status: 'awaiting_answers'
  }).sort({ createdAt: -1 });
};

// Add an answer and check if ready
pendingButlerTaskSchema.methods.addAnswer = function(field, value) {
  this.collectedAnswers.set(field, value);

  // Remove from pending questions
  this.pendingQuestions = this.pendingQuestions.filter(q => q.field !== field);

  // Check if all questions answered
  if (this.pendingQuestions.length === 0) {
    this.status = 'ready';
  }

  this.lastUpdatedAt = new Date();
  return this.save();
};

// Get all collected answers as plain object
pendingButlerTaskSchema.methods.getAnswersObject = function() {
  const answers = {};
  this.collectedAnswers.forEach((value, key) => {
    answers[key] = value;
  });
  return answers;
};

// Get the next question to ask
pendingButlerTaskSchema.methods.getNextQuestion = function() {
  if (this.pendingQuestions.length === 0) return null;
  return this.pendingQuestions[0];
};

module.exports = mongoose.model('PendingButlerTask', pendingButlerTaskSchema);
