import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  targetAudience: [{
    type: String,
    enum: ['all', 'students', 'teachers', 'parents', 'admins'],
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
AnnouncementSchema.index({ createdAt: -1 });
AnnouncementSchema.index({ targetAudience: 1 });
AnnouncementSchema.index({ isActive: 1 });
AnnouncementSchema.index({ priority: 1 });
AnnouncementSchema.index({ readBy: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema); 