/**
 * GENESIS CONVERSATION MODEL
 * Stores Genesis conversation history for database persistence
 * Ensures conversations survive browser cache clears
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const genesisConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient user conversation queries
genesisConversationSchema.index({ userId: 1, updatedAt: -1 });
genesisConversationSchema.index({ userId: 1, conversationId: 1 }, { unique: true });

module.exports = mongoose.model('GenesisConversation', genesisConversationSchema);
