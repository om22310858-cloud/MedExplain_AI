export type Theme = 'light' | 'dark' | 'system';

export interface UserProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  bloodGroup?: string;
  phone?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  themePreference: Theme;
  accountStatus: 'active' | 'suspended';
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

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

export interface MedicalReport {
  _id: string;
  userId: string;
  title: string;
  category: ReportCategory;
  documentType: DocumentType;
  storageProvider: 'local' | 'supabase';
  privateStorageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  reportDate?: string;
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
  createdAt: string;
  updatedAt: string;
}

export type ResultFlag = 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
export type ProvenanceType = 'ai-extracted' | 'text-extracted' | 'user-corrected' | 'user-entered';

export interface ExtractedMeasurement {
  _id: string;
  reportId: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface TestExplanation {
  testName: string;
  valueAndUnit: string;
  referenceRange?: string;
  status: 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
  simpleExplanation: string;
  limitationsAndFactors?: string;
  clinicianQuestions?: string[];
}

export interface ReportAnalysis {
  _id: string;
  reportId: string;
  userId: string;
  provider: string;
  modelIdentifier: string;
  promptVersion: string;
  status: 'completed' | 'failed' | 'unconfigured';
  extractedSummary: string;
  explanations: TestExplanation[];
  warnings: string[];
  limitations: string[];
  disclaimer: string;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentType =
  | 'cardiovascular_ascvd'
  | 'ckd_egfr'
  | 'ada_diabetes_prediabetes'
  | 'thyroid_reference_range'
  | 'cbc_reference_range'
  | 'stroke_nihss_risk_factors';

export interface RiskOutput {
  status: 'low' | 'borderline' | 'intermediate' | 'high' | 'inconclusive';
  score?: number | null;
  scoreLabel?: string | null;
  summary: string;
  details: string;
  recommendations: string[];
}

export interface RiskAssessment {
  _id: string;
  userId: string;
  reportId: string;
  assessmentType: AssessmentType;
  methodType: 'rule-based' | 'clinical-guideline';
  methodIdentifier: string;
  methodVersion: string;
  inputSnapshot: Record<string, unknown>;
  output?: RiskOutput;
  explanation: string;
  missingInputs: string[];
  limitations: string[];
  isEligible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatIfScenario {
  _id: string;
  userId: string;
  reportId: string;
  riskAssessmentId?: string;
  scenarioName: string;
  originalInputs: Record<string, unknown>;
  hypotheticalInputs: Record<string, unknown>;
  changedInputs: Record<string, { original: unknown; hypothetical: unknown }>;
  result: RiskOutput;
  explanation: string;
  createdAt: string;
}

export interface MatchedMeasurement {
  testName: string;
  olderValue: {
    raw: string;
    numeric?: number | null;
    unit?: string | null;
    date?: string;
  };
  newerValue: {
    raw: string;
    numeric?: number | null;
    unit?: string | null;
    date?: string;
  };
  normalizedUnit?: string | null;
  changeAbsolute?: number | null;
  changePercentage?: number | null;
  direction: 'increased' | 'decreased' | 'unchanged' | 'incomparable';
  comparisonStatus: 'comparable' | 'unit_mismatch_unconvertible' | 'non_numeric';
  referenceRange?: string | null;
}

export interface ReportComparison {
  _id: string;
  userId: string;
  olderReportId: MedicalReport | string;
  newerReportId: MedicalReport | string;
  matchedMeasurements: MatchedMeasurement[];
  comparisonSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalReports: number;
  totalAnalyses: number;
  totalMeasurements: number;
  totalComparisons: number;
  totalRiskAssessments: number;
  recentReports: MedicalReport[];
  categoryCounts: Record<ReportCategory, number>;
}

/** Human-readable labels and metadata for each category (mirrors server categoryRegistry) */
export const CATEGORY_META: Record<ReportCategory, { label: string; description: string; color: string }> = {
  blood_cbc:      { label: 'Blood / CBC',               description: 'Complete Blood Count panel', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
  diabetes:       { label: 'Diabetes / Glucose',         description: 'Glycaemic assessments',      color: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  cardiovascular: { label: 'Heart Health',               description: 'Lipid profile and cardiac',  color: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300' },
  thyroid:        { label: 'Thyroid',                    description: 'TSH, T3, T4 panel',          color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  kidney:         { label: 'Kidney / Renal',             description: 'Creatinine, eGFR, electrolytes', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  stroke:         { label: 'Stroke-Related',             description: 'Coagulation & inflammatory', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  general:        { label: 'General / Other',            description: 'Other medical documents',    color: 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300' },
};

/** Human-readable labels for assessment types */
export const ASSESSMENT_META: Record<AssessmentType, { label: string; category: ReportCategory; shortLabel: string }> = {
  ada_diabetes_prediabetes:   { label: 'ADA 2024 Glycaemic / Prediabetes',         category: 'diabetes',       shortLabel: 'ADA Glycaemic' },
  ckd_egfr:                   { label: 'KDIGO 2012 / CKD-EPI 2021 eGFR',           category: 'kidney',         shortLabel: 'CKD-EPI eGFR' },
  cardiovascular_ascvd:       { label: '2013 ACC/AHA 10-Year ASCVD Risk',           category: 'cardiovascular', shortLabel: 'ASCVD 10-Year Risk' },
  thyroid_reference_range:    { label: 'Thyroid Reference Range Comparison',        category: 'thyroid',        shortLabel: 'Thyroid Ranges' },
  cbc_reference_range:        { label: 'CBC Reference Range Comparison',            category: 'blood_cbc',      shortLabel: 'CBC Ranges' },
  stroke_nihss_risk_factors:  { label: 'Stroke Workup Reference Range Review',      category: 'stroke',         shortLabel: 'Stroke Workup' },
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: Record<string, unknown>;
}
