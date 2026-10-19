/**
 * DATABASE OPTIMIZATION RUNNER
 * Run this script to optimize database performance
 */

const mongoose = require('mongoose');
const dbOptimization = require('./Src/services/database/optimization');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected\n');

        await dbOptimization.optimize();

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
