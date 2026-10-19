#!/usr/bin/env node

/**
 * Delete users by phone numbers: 8087510813 and 9413156906
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0';
const PHONE_NUMBERS = ['8087510813', '9413156906', '+18087510813', '+19413156906'];

// Simple User schema
const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function deleteUsersByPhone() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Search for users with these phone numbers
        console.log('🔍 Searching for users with phone numbers:', PHONE_NUMBERS.join(', '));

        const foundUsers = await User.find({
            phone: { $in: PHONE_NUMBERS }
        });

        if (foundUsers.length === 0) {
            console.log('❌ No users found with these phone numbers\n');
            console.log('Checking database for any users with phone field...');
            const usersWithPhone = await User.find({ phone: { $exists: true } }).limit(5);
            console.log(`Found ${usersWithPhone.length} users with phone field (showing first 5):`);
            usersWithPhone.forEach(user => {
                console.log(`   - Phone: ${user.phone}, Name: ${user.name || 'N/A'}`);
            });
            await mongoose.disconnect();
            return;
        }

        console.log(`\n📋 Found ${foundUsers.length} user(s):\n`);
        foundUsers.forEach(user => {
            console.log(`   - ID: ${user._id}`);
            console.log(`     Name: ${user.name || 'N/A'}`);
            console.log(`     Email: ${user.email || 'N/A'}`);
            console.log(`     Phone: ${user.phone}`);
            console.log('');
        });

        // Delete the users
        console.log('🗑️  Deleting users...');
        const result = await User.deleteMany({
            phone: { $in: PHONE_NUMBERS }
        });

        console.log(`✅ Successfully deleted ${result.deletedCount} user(s)\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB connection closed');
    }
}

deleteUsersByPhone().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
