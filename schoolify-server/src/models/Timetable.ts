import mongoose, { Document, Schema } from 'mongoose';

export interface ITimetable extends Document {
  class: mongoose.Types.ObjectId;
  subject: string;
  teacher: mongoose.Types.ObjectId;
  dayOfWeek: number; // 1-5 (Monday-Friday)
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  academicYear: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema = new Schema<ITimetable>({
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 5 // Monday to Friday
  },
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  term: {
    type: String,
    enum: ['Term 1', 'Term 2', 'Term 3'],
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure no time conflicts for the same class or teacher on the same day
TimetableSchema.index(
  { class: 1, dayOfWeek: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

TimetableSchema.index(
  { teacher: 1, dayOfWeek: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

export const Timetable = mongoose.model<ITimetable>('Timetable', TimetableSchema); 