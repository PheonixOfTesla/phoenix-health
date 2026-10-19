const mongoose = require('mongoose');

const phoenixCallSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: 'Unknown'
  },
  type: {
    type: String,
    enum: ['incoming', 'outgoing', 'missed'],
    default: 'outgoing'
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  notes: String,
  viewed: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
phoenixCallSchema.index({ userId: 1, date: -1 });
phoenixCallSchema.index({ userId: 1, type: 1, viewed: 1 });

module.exports = mongoose.model('PhoenixCall', phoenixCallSchema);
