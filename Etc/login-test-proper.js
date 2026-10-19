const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0';

async function getTestUsers() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.connection.collection('users');
    const users = await User.find({}).limit(10).toArray();

    console.log('📋 USERS IN DATABASE:\n');
    users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
        console.log('');
    });

    console.log(`Total users found: ${users.length}\n`);

    // Test the known working account
    console.log('🧪 TESTING LOGIN WITH: simple@phoenix.com / test123456\n');

    const response = await fetch('https://pal-backend-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'simple@phoenix.com',
            password: 'test123456'
        })
    });

    const result = await response.json();

    if (result.success) {
        console.log('✅ LOGIN SUCCESSFUL');
        console.log('Token:', result.token.substring(0, 40) + '...');
        console.log('User:', result.user.name, '(' + result.user.email + ')');

        // Now test frontend login with proper URL
        console.log('\n🧪 TESTING FRONTEND URL PATH:\n');

        console.log('❌ WRONG (what frontend does now):');
        console.log('   https://pal-backend-production.up.railway.app/api/api/auth/login');

        console.log('\n✅ CORRECT (what it should be):');
        console.log('   https://pal-backend-production.up.railway.app/api/auth/login');

    } else {
        console.log('❌ LOGIN FAILED:', result.message);
    }

    await mongoose.disconnect();
}

getTestUsers().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
