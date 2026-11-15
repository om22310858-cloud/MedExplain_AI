import mongoose, { Document, Schema } from 'mongoose';

export interface ITestExplanation {
  testName: string;
  valueAndUnit: string;
  referenceRange?: string;
  status: 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
  simpleExplanation: string;
  limitationsAndFactors?: string;
  clinicianQuestions?: string[];
}

export interface IReportAnalysis extends Document {
  _id: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: string;
  modelIdentifier: string;
  promptVersion: string;
  status: 'completed' | 'failed' | 'unconfigured';
  extractedSummary: string;
  explanations: ITestExplanation[];
  warnings: string[];
  limitations: string[];
  disclaimer: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportAnalysisSchema = new Schema<IReportAnalysis>(
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
    provider: {
      type: String,
      required: true,
      default: 'gemini',
    },
    modelIdentifier: {
      type: String,
      required: true,
      default: 'gemini-1.5-flash',
    },
    promptVersion: {
      type: String,
      required: true,
      default: 'v1.0.0',
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'unconfigured'],
      default: 'completed',
    },
    extractedSummary: {
      type: String,
      required: true,
    },
    explanations: [
      {
        testName: { type: String, required: true },
        valueAndUnit: { type: String, required: true },
        referenceRange: { type: String },
        status: {
          type: String,
          enum: ['normal', 'high', 'low', 'abnormal', 'unknown'],
          default: 'unknown',
        },
        simpleExplanation: { type: String, required: true },
        limitationsAndFactors: { type: String },
        clinicianQuestions: [{ type: String }],
      },
    ],
    warnings: [{ type: String }],
    limitations: [{ type: String }],
    disclaimer: {
      type: String,
      default:
        'This analysis is provided for educational and organizational purposes only. It does not provide medical diagnoses or replace consultations with licensed healthcare professionals.',
    },
  },
  {
    timestamps: true,
  }
);

export const ReportAnalysis = mongoose.model<IReportAnalysis>(
  'ReportAnalysis',
  ReportAnalysisSchema
);
