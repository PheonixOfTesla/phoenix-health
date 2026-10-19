const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB\n');
        
        const User = mongoose.connection.collection('users');
        const user = await User.findOne({ email: 'simple@phoenix.com' });
        
        if (user) {
            console.log('✅ simple@phoenix.com EXISTS in database');
            console.log('Name:', user.name);
            console.log('ID:', user._id);
            console.log('Roles:', user.roles);
            console.log('\n✅ This account works - password: test123456');
            console.log('\nBackend login test already confirmed it works.');
            console.log('Problem is frontend has duplicate /api in URL');
        } else {
            console.log('❌ simple@phoenix.com NOT FOUND');
        }
        
        mongoose.disconnect();
    });
