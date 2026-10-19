const mongoose = require('mongoose');

const phoenixSMSSchema = new mongoose.Schema({
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
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['incoming', 'outgoing'],
    default: 'outgoing'
  },
  read: {
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
phoenixSMSSchema.index({ userId: 1, date: -1 });
phoenixSMSSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('PhoenixSMS', phoenixSMSSchema);
