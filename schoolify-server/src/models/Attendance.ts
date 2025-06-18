import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late';
  academic_year: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  marked_by: mongoose.Types.ObjectId;
  reason?: string;
  created_at: Date;
  updated_at: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  academic_year: {
    type: String,
    required: true,
    trim: true
  },
  term: {
    type: String,
    enum: ['Term 1', 'Term 2', 'Term 3'],
    required: true
  },
  marked_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    trim: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Ensure a student can only have one attendance record per day per class
AttendanceSchema.index(
  { student: 1, class: 1, date: 1 },
  { unique: true }
);

// Indexes for better query performance
AttendanceSchema.index({ class: 1, date: 1 });
AttendanceSchema.index({ student: 1, academic_year: 1, term: 1 });
AttendanceSchema.index({ marked_by: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema); 