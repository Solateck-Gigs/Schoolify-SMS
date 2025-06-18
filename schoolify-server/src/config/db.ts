import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupChangeStreams } from '../utils/changeStreams';

dotenv.config();

// console.log('process.env.MONGODB_URI:', process.env.MONGODB_URI);

const MONGODB_URI = process.env.MONGODB_URI || '';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
    
    // Add debug logging for change streams
    console.log('Setting up change streams...');
    try {
      await setupChangeStreams();
      console.log('Change streams initialized successfully');
    } catch (streamError) {
      console.error('Error setting up change streams:', streamError);
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
}); 