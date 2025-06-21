import mongoose from 'mongoose';
import { User } from '../models/User';
import { Admin } from '../models/Admin';

export const setupChangeStreams = async () => {
  // First check if change streams are supported
  try {
    const changeStreamTest = User.watch();
    await changeStreamTest.close();
    console.log('Change streams are supported');
  } catch (error) {
    console.error('Change streams are not supported:', error);
    throw new Error('Change streams are not supported by your MongoDB setup. Please ensure you are using a replica set or MongoDB Atlas.');
  }

  // Watch the Users collection for new documents
  const userChangeStream = User.watch([
    {
      $match: {
        operationType: 'insert'  // Only watch for new documents
      }
    }
  ]);

  userChangeStream.on('change', async (change) => {
    try {
      console.log('Detected new user:', change.fullDocument);
      const newUser = change.fullDocument;
      
      // Only create Admin documents for admin/super_admin roles
      // All other user data is stored directly in the User model
      switch (newUser.role) {
        case 'admin':
        case 'super_admin':
          console.log('Creating admin document...');
          const admin = await Admin.create({
            user: newUser._id
          });
          console.log('Admin document created:', admin);
          break;

        case 'student':
        case 'teacher':
        case 'parent':
          console.log(`User created with role: ${newUser.role}. All data stored in User model.`);
          break;

        default:
          console.warn('Unknown role:', newUser.role);
      }
    } catch (error) {
      console.error('Error in change stream handler:', error);
      // Don't throw the error - we want the change stream to continue running
    }
  });

  // Handle errors
  userChangeStream.on('error', (error) => {
    console.error('Change stream error:', error);
    // Attempt to resume the change stream after a delay
    setTimeout(() => {
      console.log('Attempting to restart change streams...');
      setupChangeStreams();
    }, 5000);
  });

  // Handle close events
  userChangeStream.on('close', () => {
    console.log('Change stream closed. Attempting to restart...');
    setTimeout(() => {
      console.log('Attempting to restart change streams...');
      setupChangeStreams();
    }, 5000);
  });

  return userChangeStream; // Return the stream so we can close it if needed
}; 