import mongoose, { Document, Schema } from 'mongoose';

export interface IMark extends Document {
  student: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  subject: string;
  academic_year: string;
  term: 'Term 1' | 'Term 2' | 'Term 3';
  assessment_type: 'quiz' | 'homework' | 'exam' | 'project';
  score: number;
  total_score: number;
  grade: string;
  remarks?: string;
  teacher: mongoose.Types.ObjectId;
  date: Date;
  created_at: Date;
  updated_at: Date;
}

const MarkSchema = new Schema<IMark>({
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
  subject: {
    type: String,
    required: true,
    trim: true
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
  assessment_type: {
    type: String,
    enum: ['quiz', 'homework', 'exam', 'project'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  total_score: {
    type: Number,
    required: true,
    min: 1
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for better query performance
MarkSchema.index({ student: 1, class: 1, subject: 1, academic_year: 1, term: 1 });
MarkSchema.index({ teacher: 1 });
MarkSchema.index({ class: 1 });

export const Mark = mongoose.model<IMark>('Mark', MarkSchema); 