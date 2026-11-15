import mongoose, { Document, Schema } from 'mongoose';
import { IRiskOutput } from './RiskAssessment.js';

export interface IWhatIfScenario extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  riskAssessmentId?: mongoose.Types.ObjectId;
  scenarioName: string;
  originalInputs: Record<string, unknown>;
  hypotheticalInputs: Record<string, unknown>;
  changedInputs: Record<string, { original: unknown; hypothetical: unknown }>;
  result: IRiskOutput;
  explanation: string;
  createdAt: Date;
}

const WhatIfScenarioSchema = new Schema<IWhatIfScenario>(
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
    riskAssessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'RiskAssessment',
    },
    scenarioName: {
      type: String,
      required: true,
      default: 'Hypothetical Scenario',
    },
    originalInputs: {
      type: Schema.Types.Mixed,
      required: true,
    },
    hypotheticalInputs: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changedInputs: {
      type: Schema.Types.Mixed,
      required: true,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const WhatIfScenario = mongoose.model<IWhatIfScenario>(
  'WhatIfScenario',
  WhatIfScenarioSchema
);
