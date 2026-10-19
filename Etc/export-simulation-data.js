const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = "mongodb+srv://digitalappleco_db_user:tZoVnKGdoYMx9IbV@cluster0.epf3g44.mongodb.net/pal-fitness?retryWrites=true&w=majority&appName=Cluster0";

async function exportData() {
  await mongoose.connect(MONGODB_URI);
  
  console.log('Connected to MongoDB');
  
  // Get all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\nAvailable collections:', collections.map(c => c.name));
  
  // Export wearable data
  const WearableData = mongoose.connection.db.collection('wearabledatas');
  const wearableCount = await WearableData.countDocuments();
  console.log(`\nWearable data records: ${wearableCount}`);
  
  // Export sample of data
  const sample = await WearableData.find().limit(10).toArray();
  console.log('\nSample wearable data:', JSON.stringify(sample.slice(0, 2), null, 2));
  
  // Export all wearable data to JSON
  console.log('\nExporting all wearable data...');
  const allData = await WearableData.find().toArray();
  
  fs.writeFileSync(
    '/Users/moderndavinci/Desktop/phoenix-simulation-wearable-data.json',
    JSON.stringify(allData, null, 2)
  );
  
  console.log(`✅ Exported ${allData.length} wearable records to Desktop`);
  
  // Get users created during simulation
  const User = mongoose.connection.db.collection('users');
  const simUsers = await User.find({ email: /simulation_/ }).toArray();
  console.log(`\nSimulation users: ${simUsers.length}`);
  
  fs.writeFileSync(
    '/Users/moderndavinci/Desktop/phoenix-simulation-users.json',
    JSON.stringify(simUsers, null, 2)
  );
  
  console.log(`✅ Exported ${simUsers.length} simulation users to Desktop`);
  
  await mongoose.disconnect();
}

exportData().catch(console.error);
