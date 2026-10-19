const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: false },  // Optional for file uploads
  fileId: { type: String, index: true },  // Reference to uploaded file UUID
  type: { type: String, enum: ['business_plan', 'letter', 'report', 'proposal', 'essay', 'draft', 'genesis', 'resume', 'other'], default: 'other' },
  source: { type: String, default: 'phoenix' }, // voice, manual, desk, genesis
  mimeType: { type: String },  // MIME type of the file
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
