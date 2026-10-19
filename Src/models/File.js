// Src/models/File.js
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    fileId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    originalFilename: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    storagePath: {
      type: String,
      required: true
    },
    storageType: {
      type: String,
      enum: ['local', 's3'],
      default: 'local'
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

// Index for quick user file lookups
FileSchema.index({ userId: 1, uploadedAt: -1 });

// Virtual for file URL
FileSchema.virtual('url').get(function() {
  return `/api/files/${this.fileId}`;
});

module.exports = mongoose.model('File', FileSchema);
