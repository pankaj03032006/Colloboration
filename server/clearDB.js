// clearDB.js
const mongoose = require('mongoose');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/collab');
    console.log('✅ Connected to MongoDB');

    // Delete all users
    const result = await mongoose.connection.collection('users').deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} users`);
    
    console.log('✅ All users cleared!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

clearDatabase();