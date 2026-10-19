/**
 * CONVERSATION HISTORY MODEL
 * Stores Phoenix conversation history for context awareness
 */

const mongoose = require('mongoose');

const conversationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    intent: String,
    mode: String,  // 'voice', 'manual', 'desk', 'genesis'
    actionTaken: String
  }
}, {
  timestamps: true
});

// Compound index for efficient user history queries
conversationHistorySchema.index({ userId: 1, timestamp: -1 });

// Auto-cleanup old conversations (keep last 30 days)
conversationHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ConversationHistory', conversationHistorySchema);
