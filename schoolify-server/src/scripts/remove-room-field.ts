import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolify');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error}`);
    process.exit(1);
  }
};

// Migration to remove room field from timetable entries
const removeRoomField = async () => {
  try {
    await connectDB();
    
    // Update all timetable documents to remove the room field
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const result = await db.collection('timetables').updateMany(
      {}, // Match all documents
      { $unset: { room: "" } } // Remove room field
    );
    
    console.log(`Migration completed successfully. Modified ${result.modifiedCount} documents.`);
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error(`Error during migration: ${error}`);
    process.exit(1);
  }
};

// Run the migration
removeRoomField(); 