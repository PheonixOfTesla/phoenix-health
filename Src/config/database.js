const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // ⚡ OPTIMIZED CONNECTION OPTIONS for Railway/serverless
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Connection pool - keep connections ready
            maxPoolSize: 10,
            minPoolSize: 2,
            // Faster timeout for serverless
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // Keep connections alive
            heartbeatFrequencyMS: 10000,
            // Auto-reconnect settings
            retryWrites: true,
            retryReads: true
        };

        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/coastal-fitness',
            mongoOptions
        );

        

        // Handle connection events for monitoring
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected - will auto-reconnect');
        });

        mongoose.connection.on('reconnected', () => {
            
        });

    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;