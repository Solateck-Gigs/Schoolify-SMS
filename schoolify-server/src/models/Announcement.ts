import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId; // User ID of the author
  targetRoles: ('all' | 'admin' | 'teacher' | 'parent' | 'student')[];
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRoles: {
      type: [String],
      enum: ['all', 'admin', 'teacher', 'parent', 'student'],
      default: ['all'],
    },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ author: 1 });
AnnouncementSchema.index({ targetRoles: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema); 