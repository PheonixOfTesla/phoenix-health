/**
 * CUSTOM TRACKER ENTRY MODEL
 * Flexible schema for storing any type of tracking data
 * Supports AI-generated widgets with dynamic fields
 */

const mongoose = require('mongoose');

const customTrackerEntrySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    widgetId: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    actionName: {
        type: String,
        required: true,
        trim: true,
        default: 'log'
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can be string, number, object, array
        default: null
    },
    note: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // Flexible metadata for custom fields
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index for efficient queries
customTrackerEntrySchema.index({ userId: 1, widgetId: 1, timestamp: -1 });

// Virtual for formatted timestamp
customTrackerEntrySchema.virtual('formattedTime').get(function() {
    return this.timestamp.toLocaleString();
});

// Method to get entry as plain object with virtuals
customTrackerEntrySchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const CustomTrackerEntry = mongoose.model('CustomTrackerEntry', customTrackerEntrySchema);

module.exports = CustomTrackerEntry;
