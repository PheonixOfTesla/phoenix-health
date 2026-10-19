/**
 * NOTE MODEL
 * Stores user notes that feed Phoenix consciousness
 * Part of DESK Mode - The Business Brain
 */

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  source: {
    type: String,
    enum: ['desk', 'voice', 'manual', 'auto'],
    default: 'desk'
  },
  tags: [{
    type: String
  }],
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
noteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
