import mongoose, { Schema, Document } from 'mongoose';

export interface IMark extends Document {
  student: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  subject: string;
  score: number;
  totalScore: number;
  grade: string;
  assessmentType: string;
  term: string;
  academicYear: string;
  remarks?: string;
  teacher: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarkSchema = new Schema({
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
  subject: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalScore: {
    type: Number,
    required: true,
    default: 100
  },
  grade: {
    type: String,
    required: true,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'F']
  },
  assessmentType: {
    type: String,
    required: true,
    enum: ['test', 'exam']
  },
  term: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    default: new Date().getFullYear().toString()
  },
  remarks: {
    type: String
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MarkSchema.index({ student: 1, class: 1, subject: 1, academicYear: 1, term: 1 });
MarkSchema.index({ teacher: 1 });
MarkSchema.index({ class: 1 });

export const Mark = mongoose.model<IMark>('Mark', MarkSchema); 