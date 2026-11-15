import mongoose, { Document, Schema } from 'mongoose';

export type ResultFlag = 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
export type ProvenanceType = 'ai-extracted' | 'text-extracted' | 'user-corrected' | 'user-entered';

export interface IExtractedMeasurement extends Document {
  _id: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  testName: string;
  originalTestName: string;
  rawValue: string;
  numericValue?: number | null;
  unit?: string | null;
  referenceRangeText?: string | null;
  referenceLow?: number | null;
  referenceHigh?: number | null;
  resultFlag: ResultFlag;
  sourcePage?: number | null;
  provenance: ProvenanceType;
  userConfirmed: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExtractedMeasurementSchema = new Schema<IExtractedMeasurement>(
  {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalReport',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Standardized test name is required'],
      trim: true,
      index: true,
    },
    originalTestName: {
      type: String,
      required: [true, 'Original test name is required'],
      trim: true,
    },
    rawValue: {
      type: String,
      required: [true, 'Raw value is required'],
      trim: true,
    },
    numericValue: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      trim: true,
      default: null,
    },
    referenceRangeText: {
      type: String,
      trim: true,
      default: null,
    },
    referenceLow: {
      type: Number,
      default: null,
    },
    referenceHigh: {
      type: Number,
      default: null,
    },
    resultFlag: {
      type: String,
      enum: ['normal', 'high', 'low', 'abnormal', 'unknown'],
      default: 'unknown',
    },
    sourcePage: {
      type: Number,
      default: 1,
    },
    provenance: {
      type: String,
      enum: ['ai-extracted', 'text-extracted', 'user-corrected', 'user-entered'],
      default: 'ai-extracted',
    },
    userConfirmed: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

ExtractedMeasurementSchema.index({ reportId: 1, testName: 1 });
ExtractedMeasurementSchema.index({ userId: 1, testName: 1 });

export const ExtractedMeasurement = mongoose.model<IExtractedMeasurement>(
  'ExtractedMeasurement',
  ExtractedMeasurementSchema
);
