const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, default: '(No Subject)' },
  body: { type: String, default: '' },
  snippet: { type: String, default: '' },
  source: { type: String, enum: ['phoenix', 'google-import'], default: 'phoenix' },
  googleId: { type: String, default: null },
  date: { type: Date, default: Date.now, index: true },
  read: { type: Boolean, default: false },
  archived: { type: Boolean, default: false },
  labels: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate snippet from body if not provided
messageSchema.pre('save', function(next) {
  if (!this.snippet && this.body) {
    this.snippet = this.body.substring(0, 100).replace(/\n/g, ' ');
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Message', messageSchema);
