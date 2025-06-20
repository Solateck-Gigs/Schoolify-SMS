import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IClass extends Document {
  name: string;
  section: string;
  academicYear: string;
  teacher?: mongoose.Types.ObjectId | IUser;
  capacity: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>({
  name: {
    type: String,
    required: true,
    trim: true
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

// Compound index for unique class name + section + academicYear
classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true });
classSchema.index({ teacher: 1 });

export const Class = mongoose.model<IClass>('Class', classSchema); 