import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'tardy';
  reason?: string;
  term: string;
  academicYear: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'tardy'],
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  term: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate attendance records
AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ class: 1, date: 1 });
AttendanceSchema.index({ student: 1, term: 1, academicYear: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema); 