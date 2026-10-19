/**
 * CUSTOM TRACKER MODEL
 * Defines tracker templates for business management
 */

const mongoose = require('mongoose');

const customTrackerSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: '📊'
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['business', 'health', 'finance', 'personal', 'productivity', 'custom'],
        default: 'business'
    },
    fields: [{
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['text', 'number', 'date', 'select', 'multiselect', 'email', 'phone', 'currency', 'percentage', 'url'],
            required: true
        },
        label: {
            type: String,
            required: true
        },
        required: {
            type: Boolean,
            default: false
        },
        options: [String], // For select/multiselect fields
        defaultValue: mongoose.Schema.Types.Mixed
    }],
    display: {
        type: {
            type: String,
            enum: ['table', 'kanban', 'list', 'calendar', 'cards'],
            default: 'table'
        },
        sortBy: String,
        groupBy: String,
        filters: mongoose.Schema.Types.Mixed
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
customTrackerSchema.index({ userId: 1, category: 1 });
customTrackerSchema.index({ userId: 1, active: 1 });

const CustomTracker = mongoose.model('CustomTracker', customTrackerSchema);

module.exports = CustomTracker;
