import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IParent extends Document {
  user: IUser['_id'];
  children: mongoose.Types.ObjectId[]; // Array of student IDs
  homeAddress: string;
  occupation: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    homeAddress: {
      type: String,
      trim: true,
    },
    occupation: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

ParentSchema.index({ 'children': 1 });

export const Parent = mongoose.model<IParent>('Parent', ParentSchema); 