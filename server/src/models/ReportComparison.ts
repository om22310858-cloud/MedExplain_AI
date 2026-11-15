import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchedMeasurement {
  testName: string;
  olderValue: {
    raw: string;
    numeric?: number | null;
    unit?: string | null;
    date?: Date;
  };
  newerValue: {
    raw: string;
    numeric?: number | null;
    unit?: string | null;
    date?: Date;
  };
  normalizedUnit?: string | null;
  changeAbsolute?: number | null;
  changePercentage?: number | null;
  direction: 'increased' | 'decreased' | 'unchanged' | 'incomparable';
  comparisonStatus: 'comparable' | 'unit_mismatch_unconvertible' | 'non_numeric';
  referenceRange?: string | null;
}

export interface IReportComparison extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  olderReportId: mongoose.Types.ObjectId;
  newerReportId: mongoose.Types.ObjectId;
  matchedMeasurements: IMatchedMeasurement[];
  comparisonSummary: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportComparisonSchema = new Schema<IReportComparison>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    olderReportId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalReport',
      required: true,
      index: true,
    },
    newerReportId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalReport',
      required: true,
      index: true,
    },
    matchedMeasurements: [
      {
        testName: { type: String, required: true },
        olderValue: {
          raw: { type: String, required: true },
          numeric: { type: Number, default: null },
          unit: { type: String, default: null },
          date: { type: Date },
        },
        newerValue: {
          raw: { type: String, required: true },
          numeric: { type: Number, default: null },
          unit: { type: String, default: null },
          date: { type: Date },
        },
        normalizedUnit: { type: String, default: null },
        changeAbsolute: { type: Number, default: null },
        changePercentage: { type: Number, default: null },
        direction: {
          type: String,
          enum: ['increased', 'decreased', 'unchanged', 'incomparable'],
          default: 'incomparable',
        },
        comparisonStatus: {
          type: String,
          enum: ['comparable', 'unit_mismatch_unconvertible', 'non_numeric'],
          default: 'comparable',
        },
        referenceRange: { type: String, default: null },
      },
    ],
    comparisonSummary: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ReportComparisonSchema.index({ userId: 1, olderReportId: 1, newerReportId: 1 });

export const ReportComparison = mongoose.model<IReportComparison>(
  'ReportComparison',
  ReportComparisonSchema
);
