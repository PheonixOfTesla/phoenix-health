const mongoose = require('mongoose');

const phoenixZoomMeetingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    default: 'Meeting'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // in minutes
    default: 60
  },
  meetingLink: {
    type: String,
    default: ''
  },
  password: {
    type: String,
    default: ''
  },
  zoomMeetingId: {
    type: String // Only set if created via Zoom API
  },
  source: {
    type: String,
    enum: ['phoenix', 'zoom', 'email'],
    default: 'phoenix'
  },
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  notes: String,
  participants: [{
    email: String,
    name: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
phoenixZoomMeetingSchema.index({ userId: 1, startTime: -1 });
phoenixZoomMeetingSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('PhoenixZoomMeeting', phoenixZoomMeetingSchema);
