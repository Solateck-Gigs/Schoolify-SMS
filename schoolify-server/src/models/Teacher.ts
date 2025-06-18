import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface ITeacher extends Document {
  user: mongoose.Types.ObjectId;
  employeeId: string;
  dateOfHire: Date;
  subjectsTaught: string[];
  assignedClasses: mongoose.Types.ObjectId[];
  qualifications: string[];
  experienceYears: number;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    dateOfHire: {
      type: Date,
      required: true,
    },
    subjectsTaught: {
      type: [String],
      default: [],
    },
    assignedClasses: [{
      type: Schema.Types.ObjectId,
      ref: 'Class'
    }],
    qualifications: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
TeacherSchema.index({ assignedClasses: 1 });

export const Teacher = mongoose.model<ITeacher>('Teacher', TeacherSchema); 