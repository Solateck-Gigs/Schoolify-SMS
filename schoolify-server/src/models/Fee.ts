import mongoose, { Document, Schema, HydratedDocument } from 'mongoose';

export interface IFee extends Document {
  student: mongoose.Types.ObjectId;
  academicYear: string;
  term: string;
  amountDue: number;
  amountPaid: number;
  dueDate: Date;
  status: 'paid' | 'partially_paid' | 'unpaid';
  createdAt: Date;
  updatedAt: Date;
}

const FeeSchema: Schema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    term: {
      type: String,
      required: true,
      enum: ['Term 1', 'Term 2', 'Term 3', 'Annual'],
      trim: true,
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['paid', 'partially_paid', 'unpaid'],
      default: 'unpaid',
    },
  },
  { timestamps: true }
);

FeeSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });
FeeSchema.index({ academicYear: 1 });
FeeSchema.index({ term: 1 });

// Pre-save hook to update status based on amountPaid and amountDue
FeeSchema.pre('save', function (next) {
  const doc = this as any; // Cast to any to access properties
  if (doc.amountPaid >= doc.amountDue) {
    doc.status = 'paid';
  } else if (doc.amountPaid > 0 && doc.amountPaid < doc.amountDue) {
    doc.status = 'partially_paid';
  } else {
    doc.status = 'unpaid';
  }
  next();
});

export const Fee = mongoose.model<IFee>('Fee', FeeSchema); 