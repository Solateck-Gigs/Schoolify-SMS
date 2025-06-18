import mongoose from 'mongoose';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Parent } from '../models/Parent';
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
      
      // Based on the user's role, create corresponding document
      switch (newUser.role) {
        case 'student':
          console.log('Creating student document...');
          const student = await Student.create({
            user: newUser._id,
            admission_number: '', // Will be set later by admin
            date_of_birth: new Date(),
            gender: 'other',
            class: null,
            parent: null,
            medical_conditions: [],
            blood_type: '',
            allergies: [],
            special_needs: [],
            notes: ''
          });
          console.log('Student document created:', student);
          break;

        case 'teacher':
          console.log('Creating teacher document...');
          const teacher = await Teacher.create({
            user: newUser._id,
            employee_id: `EMP${Math.floor(Math.random() * 10000)}`, // Temporary ID
            date_of_hire: new Date(),
            subjects_taught: [],
            qualifications: [],
            experience_years: 0
          });
          console.log('Teacher document created:', teacher);
          break;

        case 'parent':
          console.log('Creating parent document...');
          const parent = await Parent.create({
            user: newUser._id,
            children: [],
            home_address: '',
            occupation: ''
          });
          console.log('Parent document created:', parent);
          break;

        case 'admin':
        case 'super_admin':
          console.log('Creating admin document...');
          const admin = await Admin.create({
            user: newUser._id
          });
          console.log('Admin document created:', admin);
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