import mongoose, { Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Optional for students
  role: 'admin' | 'super_admin' | 'teacher' | 'parent' | 'student';
  user_id_number: string;
  phone?: string;
  isActive: boolean;
  
  // Teacher-specific fields
  employeeId?: string;
  dateOfHire?: Date;
  subjectsTaught?: string[];
  assignedClasses?: mongoose.Types.ObjectId[];
  qualifications?: string[];
  experienceYears?: number;
  
  // Student-specific fields
  admissionNumber?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  class?: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  medicalConditions?: string[];
  bloodType?: string;
  allergies?: string[];
  specialNeeds?: string[];
  studentNotes?: string;
  
  // Parent-specific fields
  children?: mongoose.Types.ObjectId[];
  homeAddress?: string;
  occupation?: string;
  
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  // Basic fields for all users
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  user_id_number: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: function(this: IUser) {
      // Password not required for students
      return this.role !== 'student';
    }
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin', 'teacher', 'parent', 'student'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Teacher-specific fields
  employeeId: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values
    unique: true
  },
  dateOfHire: {
    type: Date
  },
  subjectsTaught: [{
    type: String,
    trim: true
  }],
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  }],
  qualifications: [{
    type: String,
    trim: true
  }],
  experienceYears: {
    type: Number,
    default: 0
  },
  
  // Student-specific fields
  admissionNumber: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  medicalConditions: [{
    type: String,
    trim: true
  }],
  bloodType: {
    type: String,
    trim: true
  },
  allergies: [{
    type: String,
    trim: true
  }],
  specialNeeds: [{
    type: String,
    trim: true
  }],
  studentNotes: {
    type: String,
    trim: true
  },
  
  // Parent-specific fields
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to student users
  }],
  homeAddress: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving (only if password exists)
userSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    if (!this.password) return false; // Students don't have passwords
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Create indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ parent: 1 });
userSchema.index({ class: 1 });
userSchema.index({ isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema); 