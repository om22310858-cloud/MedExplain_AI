import mongoose, { Document, Schema } from 'mongoose';

export type ReportCategory =
  | 'thyroid'
  | 'cardiovascular'
  | 'blood_cbc'
  | 'diabetes'
  | 'kidney'
  | 'stroke'
  | 'general';

export type DocumentType =
  | 'lab_report'
  | 'prescription'
  | 'doctor_notes'
  | 'discharge_summary'
  | 'imaging'
  | 'other';

export type ProcessingStatus =
  | 'uploaded'
  | 'processing'
  | 'review_required'
  | 'completed'
  | 'failed';

export type AnalysisStatus =
  | 'none'
  | 'pending'
  | 'completed'
  | 'failed'
  | 'unavailable';

export interface IMedicalReport extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  category: ReportCategory;
  documentType: DocumentType;
  storageProvider: 'local' | 'supabase';
  privateStorageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  reportDate?: Date;
  patientName?: string;
  patientGender?: string;
  patientAge?: number;
  patientDob?: string;
  physicianName?: string;
  laboratoryName?: string;
  processingStatus: ProcessingStatus;
  analysisStatus: AnalysisStatus;
  userNotes?: string;
  tags?: string[];
  errorMessage?: string;
  categoryMismatchFlag?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalReportSchema = new Schema<IMedicalReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    category: {
      type: String,
      enum: ['thyroid', 'cardiovascular', 'blood_cbc', 'diabetes', 'kidney', 'stroke', 'general'],
      default: 'general',
      index: true,
    },
    documentType: {
      type: String,
      enum: ['lab_report', 'prescription', 'doctor_notes', 'discharge_summary', 'imaging', 'other'],
      default: 'lab_report',
      index: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 'supabase'],
      default: 'local',
    },
    privateStorageKey: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    reportDate: {
      type: Date,
      index: true,
    },
    patientName: {
      type: String,
      trim: true,
    },
    patientGender: {
      type: String,
      trim: true,
    },
    patientAge: {
      type: Number,
    },
    patientDob: {
      type: String,
      trim: true,
    },
    physicianName: {
      type: String,
      trim: true,
    },
    laboratoryName: {
      type: String,
      trim: true,
    },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'review_required', 'completed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    analysisStatus: {
      type: String,
      enum: ['none', 'pending', 'completed', 'failed', 'unavailable'],
      default: 'none',
      index: true,
    },
    userNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    tags: [{
      type: String,
      trim: true,
    }],
    errorMessage: {
      type: String,
    },
    categoryMismatchFlag: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user query performance and sorting
MedicalReportSchema.index({ userId: 1, createdAt: -1 });
MedicalReportSchema.index({ userId: 1, category: 1 });
MedicalReportSchema.index({ userId: 1, documentType: 1 });

export const MedicalReport = mongoose.model<IMedicalReport>(
  'MedicalReport',
  MedicalReportSchema
);
