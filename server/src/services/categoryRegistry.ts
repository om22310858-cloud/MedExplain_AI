/**
 * Category Registry
 *
 * Defines per-category:
 *  - Human label and description
 *  - Whether AI extraction (lab measurements) is applicable
 *  - Key measurement names expected (used for mismatch detection and category-specific prompt hints)
 *  - Supported risk assessment types
 *  - Extraction context string passed to the AI model
 *
 * This registry is the single source of truth for category-specific behaviour.
 * Adding a new category requires only one addition here (plus the enum in MedicalReport.ts).
 */

import { AssessmentType } from '../models/RiskAssessment.js';
import { ReportCategory } from '../models/MedicalReport.js';

export interface CategoryDefinition {
  /** Human-readable label for UI display */
  label: string;
  /** Short description for display in upload UI */
  description: string;
  /**
   * Whether this category supports structured lab measurement extraction.
   * Non-lab document types (prescription, imaging, etc.) stored under 'general'
   * should not be forced through the measurement extraction pipeline.
   */
  supportsExtraction: boolean;
  /**
   * Canonical names of key measurements expected in this category.
   * Used to detect category mismatches (if none of these are found in extracted data).
   */
  keyMeasurementNames: string[];
  /**
   * Risk assessment method identifiers supported for this category.
   */
  supportedAssessments: AssessmentType[];
  /**
   * Detailed context injected into the Gemini extraction prompt.
   * Should list the specific biomarkers and context relevant to this category.
   */
  extractionContext: string;
}

export const CATEGORY_REGISTRY: Record<ReportCategory, CategoryDefinition> = {
  blood_cbc: {
    label: 'Blood / CBC',
    description: 'Complete Blood Count: haemoglobin, WBC, RBC, platelets and related indices',
    supportsExtraction: true,
    keyMeasurementNames: [
      'hemoglobin', 'haemoglobin', 'hb', 'hgb',
      'wbc', 'white blood cell', 'total leukocyte', 'tlc',
      'rbc', 'red blood cell',
      'platelet', 'plt',
      'hematocrit', 'haematocrit', 'pcv',
      'mcv', 'mch', 'mchc',
      'neutrophil', 'lymphocyte', 'eosinophil',
    ],
    supportedAssessments: ['cbc_reference_range'],
    extractionContext: `This is a Complete Blood Count (CBC) / Haematology panel.
Focus on extracting ALL of the following measurements when present (extract ONLY what is actually printed):
- Haemoglobin (Hb/HGB): value in g/dL or g/L
- Red Blood Cell Count (RBC): value in million/µL or ×10⁶/µL
- White Blood Cell Count (WBC/TLC/TEC): value in ×10³/µL or cells/µL
- Platelet Count (PLT): value in ×10³/µL or lakh/µL
- Haematocrit / PCV: percentage
- MCV (Mean Corpuscular Volume): fL
- MCH (Mean Corpuscular Haemoglobin): pg
- MCHC (Mean Corpuscular Haemoglobin Concentration): g/dL
- Differential count: Neutrophils (%), Lymphocytes (%), Monocytes (%), Eosinophils (%), Basophils (%)
- Absolute counts where printed: ANC, ALC, etc.
- ESR if present.
Preserve exact printed reference ranges. If differential count is given as absolute numbers AND percentages, extract both. Flag any value marked High/Low/Abnormal on the report.`,
  },

  diabetes: {
    label: 'Diabetes / Glucose',
    description: 'Glycaemic assessments: fasting glucose, HbA1c, OGTT, postprandial glucose',
    supportsExtraction: true,
    keyMeasurementNames: [
      'glucose', 'fbs', 'fasting blood glucose', 'fasting plasma glucose', 'fpg',
      'hba1c', 'glycated hemoglobin', 'glycosylated hemoglobin',
      'ppbs', 'postprandial glucose', 'random blood glucose',
      'ogtt', 'c-peptide', 'insulin',
    ],
    supportedAssessments: ['ada_diabetes_prediabetes'],
    extractionContext: `This is a Diabetes / Glycaemic assessment panel.
Focus on extracting ALL of the following measurements when present (extract ONLY what is actually printed):
- Fasting Blood Glucose (FBS/FPG/Fasting Plasma Glucose): mg/dL or mmol/L — note explicitly that this is FASTING
- Post-Prandial Blood Sugar (PPBS / 2-hour post meal): mg/dL or mmol/L — note explicitly that this is POST-MEAL
- Random Blood Glucose (RBG): mg/dL or mmol/L
- HbA1c / Glycated Haemoglobin: % and/or mmol/mol
- OGTT values if present: fasting and 2-hour values
- C-Peptide if present: ng/mL or nmol/L
- Insulin levels if present.
CRITICAL: Note in testName whether glucose measurement is fasting, random, or post-prandial. This context is essential for correct interpretation. Preserve exact printed reference ranges.`,
  },

  cardiovascular: {
    label: 'Heart Health / Cardiovascular',
    description: 'Lipid profile, cardiac markers, and cardiovascular risk measurements',
    supportsExtraction: true,
    keyMeasurementNames: [
      'total cholesterol', 'cholesterol',
      'hdl', 'high density lipoprotein',
      'ldl', 'low density lipoprotein',
      'triglycerides', 'vldl',
      'troponin', 'creatine kinase', 'ck-mb', 'bnp', 'nt-probnp',
      'homocysteine', 'lipoprotein', 'apo',
    ],
    supportedAssessments: ['cardiovascular_ascvd'],
    extractionContext: `This is a Cardiovascular / Lipid profile and cardiac marker panel.
Focus on extracting ALL of the following measurements when present (extract ONLY what is actually printed):
- Total Cholesterol: mg/dL or mmol/L
- HDL Cholesterol (High-Density Lipoprotein): mg/dL or mmol/L
- LDL Cholesterol (Low-Density Lipoprotein): mg/dL or mmol/L (may be calculated or direct)
- Triglycerides: mg/dL or mmol/L
- VLDL Cholesterol if present: mg/dL
- Non-HDL Cholesterol if present: mg/dL
- Lp(a) / Lipoprotein(a) if present
- Cardiac Troponin I or T if present: ng/mL, pg/mL, or µg/L — note high-sensitivity vs standard
- CK-MB if present: ng/mL or U/L
- BNP or NT-proBNP if present: pg/mL
- Homocysteine if present: µmol/L
Note Friedewald-calculated LDL vs direct-measured LDL if specified. Preserve exact printed reference ranges and any flag (desirable/borderline/high).`,
  },

  thyroid: {
    label: 'Thyroid Panel',
    description: 'Thyroid function: TSH, Free T3, Free T4 and related markers',
    supportsExtraction: true,
    keyMeasurementNames: [
      'tsh', 'thyroid stimulating hormone',
      'free t3', 'ft3', 'triiodothyronine', 't3',
      'free t4', 'ft4', 'thyroxine', 't4',
      'anti-tpo', 'anti-tg', 'thyroid antibody',
      'thyroglobulin', 'calcitonin',
    ],
    supportedAssessments: ['thyroid_reference_range'],
    extractionContext: `This is a Thyroid Function Test (TFT) panel.
Focus on extracting ALL of the following measurements when present (extract ONLY what is actually printed):
- TSH (Thyroid Stimulating Hormone): µIU/mL or mIU/L — the primary screening test
- Free T3 (FT3 / Free Triiodothyronine): pg/mL or pmol/L
- Free T4 (FT4 / Free Thyroxine): ng/dL or pmol/L
- Total T3 if present (distinct from Free T3): ng/dL or nmol/L
- Total T4 if present (distinct from Free T4): µg/dL or nmol/L
- Anti-TPO (Thyroid Peroxidase Antibody) if present: IU/mL
- Anti-Thyroglobulin (Anti-TG) if present: IU/mL
- Thyroglobulin if present: ng/mL
- Reverse T3 (rT3) if present: ng/dL
CRITICAL: Distinguish between Free (FT3/FT4) and Total (T3/T4) forms. Use the exact printed test name in originalTestName. Preserve exact printed reference ranges — thyroid reference ranges vary significantly between laboratories and reagent methods.`,
  },

  kidney: {
    label: 'Kidney / Renal Function',
    description: 'Renal function panel: creatinine, BUN, eGFR, electrolytes',
    supportsExtraction: true,
    keyMeasurementNames: [
      'creatinine', 'serum creatinine', 'blood creatinine',
      'blood urea nitrogen', 'bun', 'urea',
      'egfr', 'gfr',
      'uric acid',
      'sodium', 'potassium', 'chloride', 'bicarbonate', 'phosphorus',
      'albumin', 'protein',
      'microalbumin', 'albumin creatinine ratio',
    ],
    supportedAssessments: ['ckd_egfr'],
    extractionContext: `This is a Renal / Kidney Function panel.
Focus on extracting ALL of the following measurements when present (extract ONLY what is actually printed):
- Serum Creatinine: mg/dL or µmol/L — specify serum vs urine
- Blood Urea Nitrogen (BUN) or Serum Urea: mg/dL or mmol/L
- eGFR (if printed directly on the report): mL/min/1.73m² — note which formula used if specified
- Uric Acid / Serum Urate: mg/dL or µmol/L
- Sodium (Na): mEq/L or mmol/L
- Potassium (K): mEq/L or mmol/L
- Chloride (Cl): mEq/L or mmol/L
- Bicarbonate / CO2: mEq/L or mmol/L
- Phosphorus / Phosphate: mg/dL or mmol/L
- Calcium if present: mg/dL or mmol/L
- Albumin if present: g/dL
- Total Protein if present: g/dL
- Microalbumin (urine): µg/mg or mg/g creatinine if present
- 24-hour urine protein/creatinine if present.
Distinguish serum measurements from urine measurements. Preserve exact printed reference ranges.`,
  },

  stroke: {
    label: 'Stroke-Related Assessment',
    description: 'Coagulation, inflammatory markers, and stroke risk factor panel',
    supportsExtraction: true,
    keyMeasurementNames: [
      'pt', 'inr', 'prothrombin time',
      'aptt', 'ptt', 'activated partial thromboplastin',
      'd-dimer', 'fibrinogen',
      'crp', 'c-reactive protein', 'esr',
      'homocysteine',
      'platelet', 'plt',
      'factor', 'antiphospholipid', 'lupus anticoagulant',
      'protein c', 'protein s', 'antithrombin',
    ],
    supportedAssessments: ['stroke_nihss_risk_factors'],
    extractionContext: `This is a stroke-related workup or coagulation panel.
Focus on extracting ALL of the following measurements when present (extract ONLY what is actually printed):
- PT (Prothrombin Time): seconds and/or % activity
- INR (International Normalised Ratio): dimensionless
- APTT / aPTT (Activated Partial Thromboplastin Time): seconds
- D-Dimer: ng/mL FEU, µg/L, or mg/L
- Fibrinogen: mg/dL or g/L
- C-Reactive Protein (CRP): mg/L or mg/dL — note if high-sensitivity (hsCRP)
- ESR: mm/hr
- Homocysteine: µmol/L
- Platelet Count: ×10³/µL
- Protein C activity and/or antigen if present: %
- Protein S activity and/or antigen if present: %
- Antithrombin III if present: %
- Factor V Leiden / other thrombophilia markers if present (qualitative: Detected/Not Detected)
- Lupus Anticoagulant screen result (qualitative) if present
- Antiphospholipid antibodies (anti-cardiolipin IgG/IgM, anti-β2GP1) if present: GPL-U, MPL-U
CRITICAL: Coagulation test interpretation requires clinical context. Extract only printed values. Do not infer INR target ranges from condition — preserve the laboratory reference range as printed.`,
  },

  general: {
    label: 'General / Other',
    description: 'General medical report or document not fitting a specific clinical category',
    supportsExtraction: true,
    keyMeasurementNames: [], // No specific expectations
    supportedAssessments: [],
    extractionContext: `This is a general medical report or laboratory test not fitting a specific category.
Extract ALL numerical test results and qualitative findings actually printed in the document.
For each test, record: the exact printed test name, value, unit, and reference range.
Do not assume or invent any values. If the document is a prescription, discharge summary, or clinical note with no laboratory measurements, return an empty measurements array and explain in the extractedSummary what type of document this appears to be.`,
  },
};

/**
 * Returns the supported assessment types for a given category.
 */
export function getSupportedAssessments(category: ReportCategory): AssessmentType[] {
  return CATEGORY_REGISTRY[category]?.supportedAssessments ?? [];
}

/**
 * Returns the category definition, or 'general' as a safe default.
 */
export function getCategoryDefinition(category: ReportCategory): CategoryDefinition {
  return CATEGORY_REGISTRY[category] ?? CATEGORY_REGISTRY.general;
}

/**
 * Checks whether the extracted measurements are consistent with the selected category.
 * Returns a mismatch description string if suspicious, null if no mismatch detected.
 *
 * Logic: if the category has defined keyMeasurementNames and none of them appear
 * in the extracted test names, flag as a potential mismatch.
 * (The AI may still extract meaningful data; this is a soft warning, not a hard block.)
 */
export function detectCategoryMismatch(
  category: ReportCategory,
  extractedTestNames: string[]
): string | null {
  const def = CATEGORY_REGISTRY[category];
  if (!def || def.keyMeasurementNames.length === 0) {
    return null; // 'general' has no expectations
  }

  const normalized = extractedTestNames.map((n) =>
    n.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim()
  );

  const matchedKeywords = def.keyMeasurementNames.filter((key) =>
    normalized.some((n) => n.includes(key.toLowerCase()))
  );

  if (matchedKeywords.length === 0 && extractedTestNames.length > 0) {
    return (
      `The extracted measurements do not appear to match the selected category "${def.label}". ` +
      `None of the expected biomarkers (${def.keyMeasurementNames.slice(0, 4).join(', ')}…) were found. ` +
      `The AI extracted: ${extractedTestNames.slice(0, 4).join(', ')}${extractedTestNames.length > 4 ? '…' : ''}. ` +
      `Please verify the category is correct. You can update it in the report settings.`
    );
  }

  return null;
}
