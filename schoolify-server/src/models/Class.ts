import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IClass extends Document {
  classType: 'Primary' | 'JHS';
  gradeId: number;
  section: string;
  academicYear: string;
  capacity: number;
  teacher?: mongoose.Types.ObjectId | IUser;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>({
  classType: {
    type: String,
    required: true,
    enum: ['Primary', 'JHS']
  },
  gradeId: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index for unique class identification
classSchema.index({ classType: 1, gradeId: 1, section: 1, academicYear: 1 }, { unique: true });
classSchema.index({ teacher: 1 });

export const Class = mongoose.model<IClass>('Class', classSchema); 