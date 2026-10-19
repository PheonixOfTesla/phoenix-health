const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        
        // Find a test user
        const User = mongoose.connection.collection('users');
        const testUser = await User.findOne({ email: /test/i });
        
        if (testUser) {
            console.log('\n📧 Test User Found:');
            console.log('Email:', testUser.email);
            console.log('Name:', testUser.name);
            console.log('ID:', testUser._id);
            console.log('\n⚠️  Password is hashed - use the password you set during registration');
        } else {
            console.log('\n❌ No test user found. Creating one...');
            
            // We can't create users directly - need to use the registration endpoint
            console.log('\nUse this to register:');
            console.log('Email: test@phoenix.ai');
            console.log('Password: Phoenix2025!');
        }
        
        mongoose.disconnect();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });
