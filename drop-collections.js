const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldCollections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolify');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // List of collections to drop
    const collectionsToDrop = ['teachers', 'students', 'parents'];
    
    // Get all existing collections
    const collections = await db.listCollections().toArray();
    const existingCollectionNames = collections.map(col => col.name);
    
    console.log('Existing collections:', existingCollectionNames);
    
    // Drop each collection if it exists
    for (const collectionName of collectionsToDrop) {
      if (existingCollectionNames.includes(collectionName)) {
        await db.collection(collectionName).drop();
        console.log(`✅ Dropped collection: ${collectionName}`);
      } else {
        console.log(`⚠️  Collection ${collectionName} doesn't exist, skipping...`);
      }
    }
    
    console.log('🎉 Collection cleanup completed!');
    
  } catch (error) {
    console.error('Error dropping collections:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

dropOldCollections(); 