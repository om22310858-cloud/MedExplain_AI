import mongoose, { Document, Schema } from 'mongoose';

export type AssessmentType =
  | 'cardiovascular_ascvd'
  | 'ckd_egfr'
  | 'ada_diabetes_prediabetes'
  | 'thyroid_reference_range'
  | 'cbc_reference_range'
  | 'stroke_nihss_risk_factors';

export interface IRiskOutput {
  status: 'low' | 'borderline' | 'intermediate' | 'high' | 'inconclusive';
  score?: number | null;
  scoreLabel?: string | null;
  summary: string;
  details: string;
  recommendations: string[];
}

export interface IRiskAssessment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  assessmentType: AssessmentType;
  methodType: 'rule-based' | 'clinical-guideline';
  methodIdentifier: string;
  methodVersion: string;
  inputSnapshot: Record<string, unknown>;
  output?: IRiskOutput;
  explanation: string;
  missingInputs: string[];
  limitations: string[];
  isEligible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RiskAssessmentSchema = new Schema<IRiskAssessment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalReport',
      required: true,
      index: true,
    },
    assessmentType: {
      type: String,
      enum: ['cardiovascular_ascvd', 'ckd_egfr', 'ada_diabetes_prediabetes', 'thyroid_reference_range', 'cbc_reference_range', 'stroke_nihss_risk_factors'],
      required: true,
      index: true,
    },
    methodType: {
      type: String,
      enum: ['rule-based', 'clinical-guideline'],
      default: 'clinical-guideline',
    },
    methodIdentifier: {
      type: String,
      required: true,
    },
    methodVersion: {
      type: String,
      required: true,
      default: '1.0',
    },
    inputSnapshot: {
      type: Schema.Types.Mixed,
      default: {},
    },
    output: {
      status: {
        type: String,
        enum: ['low', 'borderline', 'intermediate', 'high', 'inconclusive'],
      },
      score: { type: Number, default: null },
      scoreLabel: { type: String, default: null },
      summary: { type: String },
      details: { type: String },
      recommendations: [{ type: String }],
    },
    explanation: {
      type: String,
      required: true,
    },
    missingInputs: [{ type: String }],
    limitations: [{ type: String }],
    isEligible: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

RiskAssessmentSchema.index({ reportId: 1, assessmentType: 1 });

export const RiskAssessment = mongoose.model<IRiskAssessment>(
  'RiskAssessment',
  RiskAssessmentSchema
);
