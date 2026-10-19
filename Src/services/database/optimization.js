/**
 * DATABASE OPTIMIZATION SERVICE
 * Adds missing indexes and optimizes MongoDB queries
 * Run periodically to ensure optimal performance
 */

const mongoose = require('mongoose');

/**
 * Create indexes for all collections
 * This improves query performance significantly
 */
async function createIndexes() {
    

    try {
        const db = mongoose.connection.db;

        // SavedWidget indexes
        await db.collection('savedwidgets').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('savedwidgets').createIndex({ userId: 1, 'state.enabled': 1 });
        await db.collection('savedwidgets').createIndex({ userId: 1, 'state.pinned': 1 });
        await db.collection('savedwidgets').createIndex({ userId: 1, widgetType: 1 });
        await db.collection('savedwidgets').createIndex({ userId: 1, tags: 1 });
        await db.collection('savedwidgets').createIndex({ widgetId: 1 }, { unique: true });
        

        // CustomTrackerEntry indexes
        await db.collection('customtrackerentries').createIndex({ userId: 1, widgetId: 1, timestamp: -1 });
        await db.collection('customtrackerentries').createIndex({ userId: 1, timestamp: -1 });
        await db.collection('customtrackerentries').createIndex({ widgetId: 1, timestamp: -1 });
        

        // BehaviorPattern indexes
        await db.collection('behaviorpatterns').createIndex({ userId: 1, patternType: 1 });
        await db.collection('behaviorpatterns').createIndex({ userId: 1, confidence: -1 });
        await db.collection('behaviorpatterns').createIndex({ userId: 1, validated: 1 });
        await db.collection('behaviorpatterns').createIndex({ userId: 1, lastOccurrence: -1 });
        

        // PhoenixCache indexes
        await db.collection('phoenixcaches').createIndex({ userId: 1 }, { unique: true });
        await db.collection('phoenixcaches').createIndex({ lastUpdated: -1 });
        

        // User indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ createdAt: -1 });
        

        // WearableData indexes
        await db.collection('wearabledata').createIndex({ userId: 1, date: -1 });
        await db.collection('wearabledata').createIndex({ userId: 1, source: 1, date: -1 });
        

        // Workout indexes
        await db.collection('workouts').createIndex({ userId: 1, date: -1 });
        await db.collection('workouts').createIndex({ userId: 1, workoutType: 1, date: -1 });
        

        // Goal indexes
        await db.collection('goals').createIndex({ userId: 1, createdAt: -1 });
        await db.collection('goals').createIndex({ userId: 1, status: 1 });
        await db.collection('goals').createIndex({ userId: 1, category: 1 });
        

        

    } catch (error) {
        console.error('❌ [DB Optimization] Index creation failed:', error.message);
        throw error;
    }
}

/**
 * Analyze slow queries and suggest optimizations
 */
async function analyzeSlowQueries() {
    

    try {
        const db = mongoose.connection.db;

        // Enable profiling for slow queries (>100ms)
        await db.command({ profile: 1, slowms: 100 });

        // Get profiling data
        const profileData = await db.collection('system.profile')
            .find({ millis: { $gt: 100 } })
            .sort({ millis: -1 })
            .limit(10)
            .toArray();

        if (profileData.length === 0) {
            
            return;
        }

        
        profileData.forEach((query, i) => {
            
        });

    } catch (error) {
        console.error('❌ [DB Optimization] Analysis failed:', error.message);
    }
}

/**
 * Cleanup old data to keep database size manageable
 */
async function cleanupOldData() {
    

    try {
        const db = mongoose.connection.db;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        // Delete old session tokens (>30 days)
        const sessionsDeleted = await db.collection('sessions')
            .deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
        

        // Archive old behavior patterns (>90 days inactive)
        const patternsArchived = await db.collection('behaviorpatterns')
            .updateMany(
                { lastOccurrence: { $lt: ninetyDaysAgo }, archived: { $ne: true } },
                { $set: { archived: true } }
            );
        

        

    } catch (error) {
        console.error('❌ [DB Optimization] Cleanup failed:', error.message);
    }
}

/**
 * Get database statistics
 */
async function getDbStats() {
    try {
        const db = mongoose.connection.db;
        const stats = await db.stats();

        
        
        
        
        
        
        

        return stats;

    } catch (error) {
        console.error('❌ [DB Optimization] Stats retrieval failed:', error.message);
    }
}

/**
 * Run full optimization suite
 */
async function optimize() {
    

    try {
        await createIndexes();
        await analyzeSlowQueries();
        await cleanupOldData();
        await getDbStats();

        

    } catch (error) {
        console.error('\n❌ [DB Optimization] Optimization failed:', error.message);
        throw error;
    }
}

module.exports = {
    createIndexes,
    analyzeSlowQueries,
    cleanupOldData,
    getDbStats,
    optimize
};
