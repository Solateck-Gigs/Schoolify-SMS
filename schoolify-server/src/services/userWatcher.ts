import { User } from '../models/User';
import mongoose from 'mongoose';

export const initializeUserWatcher = async () => {
  try {
    // Watch for new user documents
    const changeStream = User.watch([
      {
        $match: {
          operationType: 'insert'
        }
      }
    ]);

    console.log('👀 User watcher initialized. Listening for new users...');

    changeStream.on('change', async (change) => {
      if (change.operationType === 'insert') {
        const newUser = change.fullDocument;
        
        try {
          // With centralized User model, all data is already in the user document
          // Just log the user creation
          console.log(`✅ New ${newUser.role} user created: ${newUser.firstName} ${newUser.lastName}`);
          
          // Optional: Add any additional initialization logic here
          switch (newUser.role) {
            case 'teacher':
              console.log(`📚 Teacher ${newUser.firstName} ${newUser.lastName} ready for class assignments`);
              break;
            case 'student':
              console.log(`🎓 Student ${newUser.firstName} ${newUser.lastName} ready for enrollment`);
              break;
            case 'parent':
              console.log(`👨‍👩‍👧‍👦 Parent ${newUser.firstName} ${newUser.lastName} account created`);
              break;
            case 'admin':
            case 'super_admin':
              console.log(`🔐 Admin user ${newUser.firstName} ${newUser.lastName} created`);
              break;
            default:
              console.log(`👤 User ${newUser.firstName} ${newUser.lastName} created with role: ${newUser.role}`);
              break;
          }
        } catch (error) {
          console.error(`Error processing new ${newUser.role} user:`, error);
        }
      }
    });

    changeStream.on('error', (error) => {
      console.error('Error in user change stream:', error);
      // Attempt to reinitialize after a delay
      setTimeout(() => initializeUserWatcher(), 5000);
    });

  } catch (error) {
    console.error('Error initializing user watcher:', error);
    // Attempt to reinitialize after a delay
    setTimeout(() => initializeUserWatcher(), 5000);
  }
}; 