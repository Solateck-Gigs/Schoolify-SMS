import mongoose, { Document, Schema } from 'mongoose';

export interface ISubjectResult {
  subject: string;
  testScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remarks: string;
  teacherComment?: string;
}

export interface IReportCard extends Document {
  student: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  academicYear: string;
  term: string;
  subjects: ISubjectResult[];
  totalScore: number;
  averageScore: number;
  position: number;
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    tardy: number;
    percentage: number;
  };
  classTeacherRemarks: string;
  principalRemarks?: string;
  promotionStatus: 'promoted' | 'retained' | 'pending';
  sentToParent: boolean;
  sentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportCardSchema = new Schema({
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
  academicYear: {
    type: String,
    required: true
  },
  term: {
    type: String,
    required: true
  },
  subjects: [{
    subject: {
      type: String,
      required: true
    },
    testScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    examScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    grade: {
      type: String,
      required: true,
      enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']
    },
    remarks: {
      type: String,
      required: true,
      enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Fair', 'Poor', 'Very Poor']
    },
    teacherComment: {
      type: String
    }
  }],
  totalScore: {
    type: Number,
    required: true
  },
  averageScore: {
    type: Number,
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  attendance: {
    totalDays: {
      type: Number,
      required: true
    },
    present: {
      type: Number,
      required: true
    },
    absent: {
      type: Number,
      required: true
    },
    tardy: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      required: true
    }
  },
  classTeacherRemarks: {
    type: String,
    required: true
  },
  principalRemarks: {
    type: String
  },
  promotionStatus: {
    type: String,
    enum: ['promoted', 'retained', 'pending'],
    default: 'pending'
  },
  sentToParent: {
    type: Boolean,
    default: false
  },
  sentDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
ReportCardSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });
ReportCardSchema.index({ class: 1, academicYear: 1, term: 1 });
ReportCardSchema.index({ sentToParent: 1 });

export const ReportCard = mongoose.model<IReportCard>('ReportCard', ReportCardSchema); 