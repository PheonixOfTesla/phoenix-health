/**
 * CUSTOM TRACKER CONTROLLER
 * Handles dynamic tracking for AI-generated widgets
 * Stores data in flexible schema for any tracking type
 */

const CustomTrackerEntry = require('../models/CustomTrackerEntry');
const BehaviorPattern = require('../models/phoenix/BehaviorPattern');

/**
 * Log entry for any custom tracker
 */
exports.logEntry = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;
        const { value, note, metadata } = req.body;

        

        const entry = new CustomTrackerEntry({
            userId,
            widgetId,
            actionName: 'log',
            value,
            note,
            metadata,
            timestamp: new Date()
        });

        await entry.save();

        // 🔥 FEED DATA TO BEHAVIOR PATTERN SYSTEM
        // This closes the loop: CustomTrackerEntry → BehaviorPattern → ML Training
        try {
            await this.updateBehaviorPattern(userId, widgetId, 'custom_tracking');
        } catch (patternError) {
            console.error('[CustomTracker] Behavior pattern update failed:', patternError);
            // Don't fail the request if pattern update fails
        }

        // Get recent history for display
        const recentEntries = await CustomTrackerEntry.find({
            userId,
            widgetId
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();

        res.json({
            success: true,
            message: 'Entry logged successfully',
            data: {
                entry,
                recentEntries,
                totalCount: recentEntries.length
            }
        });

    } catch (error) {
        console.error('[CustomTracker] Log entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Execute custom action for a widget
 */
exports.executeAction = async (req, res) => {
    try {
        const { widgetId, actionName } = req.params;
        const userId = req.user.id;
        const { value, note, metadata } = req.body;

        

        const entry = new CustomTrackerEntry({
            userId,
            widgetId,
            actionName,
            value,
            note,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            },
            timestamp: new Date()
        });

        await entry.save();

        // 🔥 FEED DATA TO BEHAVIOR PATTERN SYSTEM
        try {
            await this.updateBehaviorPattern(userId, widgetId, 'custom_tracking');
        } catch (patternError) {
            console.error('[CustomTracker] Behavior pattern update failed:', patternError);
        }

        // Calculate stats for this widget
        const stats = await this.calculateStats(userId, widgetId);

        res.json({
            success: true,
            message: `Action ${actionName} executed successfully`,
            data: {
                entry,
                stats
            }
        });

    } catch (error) {
        console.error('[CustomTracker] Execute action error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute action',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get history for a custom tracker
 */
exports.getHistory = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        const entries = await CustomTrackerEntry.find({
            userId,
            widgetId
        })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean();

        const total = await CustomTrackerEntry.countDocuments({
            userId,
            widgetId
        });

        res.json({
            success: true,
            data: {
                entries,
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > (parseInt(offset) + entries.length)
            }
        });

    } catch (error) {
        console.error('[CustomTracker] Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get statistics for a custom tracker
 */
exports.getStats = async (req, res) => {
    try {
        const { widgetId } = req.params;
        const userId = req.user.id;

        const stats = await this.calculateStats(userId, widgetId);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('[CustomTracker] Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete entry from custom tracker
 */
exports.deleteEntry = async (req, res) => {
    try {
        const { widgetId, entryId } = req.params;
        const userId = req.user.id;

        const entry = await CustomTrackerEntry.findOneAndDelete({
            _id: entryId,
            userId,
            widgetId
        });

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Entry not found'
            });
        }

        res.json({
            success: true,
            message: 'Entry deleted successfully'
        });

    } catch (error) {
        console.error('[CustomTracker] Delete entry error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete entry',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all custom trackers for current user
 */
exports.getAllUserTrackers = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get unique widget IDs for this user
        const trackers = await CustomTrackerEntry.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$widgetId',
                    lastEntry: { $max: '$timestamp' },
                    totalEntries: { $sum: 1 },
                    actions: { $addToSet: '$actionName' }
                }
            },
            { $sort: { lastEntry: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                trackers,
                total: trackers.length
            }
        });

    } catch (error) {
        console.error('[CustomTracker] Get all trackers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trackers',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Calculate statistics for a widget (helper method)
 */
exports.calculateStats = async (userId, widgetId) => {
    const entries = await CustomTrackerEntry.find({
        userId,
        widgetId
    }).sort({ timestamp: -1 }).lean();

    if (entries.length === 0) {
        return {
            totalEntries: 0,
            firstEntry: null,
            lastEntry: null,
            actionsCount: {}
        };
    }

    // Count actions
    const actionsCount = {};
    entries.forEach(entry => {
        actionsCount[entry.actionName] = (actionsCount[entry.actionName] || 0) + 1;
    });

    // Calculate streaks if entries are daily
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 0; i < entries.length - 1; i++) {
        const dayDiff = Math.floor(
            (new Date(entries[i].timestamp) - new Date(entries[i + 1].timestamp))
            / (1000 * 60 * 60 * 24)
        );

        if (dayDiff === 1) {
            tempStreak++;
            if (i === 0) currentStreak = tempStreak;
        } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
        }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
        totalEntries: entries.length,
        firstEntry: entries[entries.length - 1].timestamp,
        lastEntry: entries[0].timestamp,
        actionsCount,
        currentStreak,
        longestStreak,
        averagePerDay: entries.length / Math.max(1,
            Math.ceil((new Date() - new Date(entries[entries.length - 1].timestamp)) / (1000 * 60 * 60 * 24))
        )
    };
};

/**
 * 🔥 UPDATE BEHAVIOR PATTERN
 * Feeds custom tracker data into the behavior pattern system
 * This closes the loop: CustomTrackerEntry → BehaviorPattern → ML Training
 */
exports.updateBehaviorPattern = async (userId, widgetId, patternType = 'custom_tracking') => {
    try {
        // Find or create behavior pattern for this widget
        let pattern = await BehaviorPattern.findOne({
            userId,
            patternType,
            pattern: widgetId
        });

        if (!pattern) {
            // Create new pattern
            

            pattern = new BehaviorPattern({
                userId,
                patternType,
                pattern: widgetId,
                description: `Custom tracking: ${widgetId}`,
                frequency: 1,
                confidence: 0.3, // Start with low confidence
                validated: false,
                firstOccurrence: new Date(),
                lastOccurrence: new Date(),
                dataPoints: [{
                    timestamp: new Date(),
                    value: 1,
                    context: { source: 'custom_tracker', widgetId }
                }]
            });

            await pattern.save();
            
        } else {
            // Update existing pattern
            pattern.frequency += 1;
            pattern.lastOccurrence = new Date();

            // Add data point
            pattern.dataPoints.push({
                timestamp: new Date(),
                value: 1,
                context: { source: 'custom_tracker', widgetId }
            });

            // Keep only last 100 data points
            if (pattern.dataPoints.length > 100) {
                pattern.dataPoints = pattern.dataPoints.slice(-100);
            }

            // Increase confidence based on frequency
            // More frequent tracking = higher confidence
            if (pattern.frequency >= 30) {
                pattern.confidence = Math.min(0.9, 0.3 + (pattern.frequency / 100));
            } else if (pattern.frequency >= 10) {
                pattern.confidence = Math.min(0.7, 0.3 + (pattern.frequency / 50));
            } else if (pattern.frequency >= 5) {
                pattern.confidence = 0.5;
            }

            // Auto-validate if confidence is high enough
            if (pattern.confidence >= 0.7 && !pattern.validated) {
                pattern.validated = true;
                
            }

            await pattern.save();
            
        }

        return pattern;
    } catch (error) {
        console.error('[CustomTracker] updateBehaviorPattern error:', error);
        throw error;
    }
};

module.exports = exports;
