const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0';

async function verifyUser() {
    await mongoose.connect(MONGODB_URI);

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Find user by phone - try multiple fields
    let user = await User.findOne({
        $or: [
            { phoneNumber: '8087510813' },
            { phone: '8087510813' },
            { email: '8087510813' }
        ]
    });

    if (!user) {
        console.log('User not found, searching all users...');
        const allUsers = await User.find({}).limit(10);
        console.log('\nFound users:', allUsers.map(u => ({
            email: u.email,
            phone: u.phoneNumber || u.phone,
            verified: u.emailVerified || u.phoneVerified
        })));

        // Try to find by any field containing the number
        user = allUsers.find(u =>
            (u.phoneNumber && u.phoneNumber.includes('8087510813')) ||
            (u.phone && u.phone.includes('8087510813')) ||
            (u.email && u.email.includes('8087510813'))
        );
    }

    if (user) {
        console.log('\n✅ Found user:', user.email || user.phoneNumber || user.phone);
        console.log('Email verified:', user.emailVerified);
        console.log('Phone verified:', user.phoneVerified);

        // Verify both
        user.emailVerified = true;
        user.phoneVerified = true;
        await user.save();

        console.log('\n✅ User verified! You can now login.');
    } else {
        console.log('\n❌ User 8087510813 not found in database.');
    }

    await mongoose.disconnect();
}

verifyUser().catch(console.error);
