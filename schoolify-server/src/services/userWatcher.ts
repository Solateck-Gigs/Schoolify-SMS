import { User } from '../models/User';
import { Teacher } from '../models/Teacher';
import { Student } from '../models/Student';
import { Parent } from '../models/Parent';
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
          switch (newUser.role) {
            case 'teacher':
              await createTeacherRecord(newUser);
              break;
            case 'student':
              await createStudentRecord(newUser);
              break;
            case 'parent':
              await createParentRecord(newUser);
              break;
            default:
              // For admin and super_admin, no additional records needed
              break;
          }
        } catch (error) {
          console.error(`Error creating ${newUser.role} record:`, error);
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

const createTeacherRecord = async (user: any) => {
  const teacher = new Teacher({
    user: user._id,
    employeeId: `TCH${String(user._id).slice(-6)}`, // Generate employee ID using last 6 chars of user ID
    dateOfHire: new Date(),
    subjectsTaught: [],
    assignedClasses: [],
    qualifications: [],
    experienceYears: 0
  });
  await teacher.save();
  console.log(`✅ Teacher record created for user: ${user.firstName} ${user.lastName}`);
};

const createStudentRecord = async (user: any) => {
  const student = new Student({
    user: user._id,
    admissionNumber: `STU${String(user._id).slice(-6)}`, // Generate admission number using last 6 chars of user ID
    dateOfBirth: new Date(), // This should be updated later
    gender: 'other', // This should be updated later
    class: null, // This should be assigned later
    parent: null, // This should be assigned later
  });
  await student.save();
  console.log(`✅ Student record created for user: ${user.firstName} ${user.lastName}`);
};

const createParentRecord = async (user: any) => {
  const parent = new Parent({
    user: user._id,
    homeAddress: '',
    occupation: '',
    children: []
  });
  await parent.save();
  console.log(`✅ Parent record created for user: ${user.firstName} ${user.lastName}`);
}; 