import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  user: mongoose.Types.ObjectId;
  // Add admin-specific fields here if needed in the future
}

const adminSchema = new Schema<IAdmin>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  // Add more fields as needed
}, {
  timestamps: true
});

export const Admin = mongoose.model<IAdmin>('Admin', adminSchema); 