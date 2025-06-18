import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IStudent extends Document {
  user: mongoose.Types.ObjectId | IUser;
  admissionNumber: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  class: mongoose.Types.ObjectId;
  parent: mongoose.Types.ObjectId | IUser;
  medicalConditions?: string[];
  bloodType?: string;
  allergies?: string[];
  specialNeeds?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  admissionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
studentSchema.index({ parent: 1 });
studentSchema.index({ class: 1 });

export const Student = mongoose.model<IStudent>('Student', studentSchema); 