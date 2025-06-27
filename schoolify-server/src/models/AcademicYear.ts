import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicYear extends Document {
  name: string;            // e.g., "2023-2024"
  startDate: Date;
  endDate: Date;
  terms: {
    name: string;          // e.g., "Term 1"
    startDate: Date;
    endDate: Date;
    workingDays: number;   // Target number of working days (typically 60)
    isActive: boolean;     // Whether this is the current active term
  }[];
  isActive: boolean;       // Whether this is the current academic year
  createdAt: Date;
  updatedAt: Date;
}

const AcademicYearSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  terms: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    workingDays: {
      type: Number,
      default: 60
    },
    isActive: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one academic year can be active at a time
AcademicYearSchema.pre('save', async function(next) {
  if (this.isActive) {
    await mongoose.model('AcademicYear').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Ensure only one term can be active at a time within an academic year
AcademicYearSchema.pre('save', function(next) {
  if (this.terms) {
    let activeTermCount = 0;
    this.terms.forEach(term => {
      if (term.isActive) activeTermCount++;
    });
    
    if (activeTermCount > 1) {
      return next(new Error('Only one term can be active at a time'));
    }
  }
  next();
});

export const AcademicYear = mongoose.model<IAcademicYear>('AcademicYear', AcademicYearSchema); 