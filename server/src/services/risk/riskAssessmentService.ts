import { IExtractedMeasurement } from '../../models/ExtractedMeasurement.js';
import { IUser } from '../../models/User.js';
import { AssessmentType, IRiskOutput } from '../../models/RiskAssessment.js';

export interface AssessmentResult {
  assessmentType: AssessmentType;
  methodType: 'rule-based' | 'clinical-guideline';
  methodIdentifier: string;
  methodVersion: string;
  isEligible: boolean;
  missingInputs: string[];
  inputSnapshot: Record<string, unknown>;
  output?: IRiskOutput;
  explanation: string;
  limitations: string[];
}

export class RiskAssessmentService {
  /**
   * Evaluates Glycemic Status according to American Diabetes Association (ADA) Standards of Care Criteria
   */
  evaluateAdaDiabetesRisk(
    measurements: IExtractedMeasurement[]
  ): AssessmentResult {
    const methodIdentifier = 'ADA Standards of Care in Diabetes (2024 Criteria)';
    const methodVersion = '2024.1';
    const missingInputs: string[] = [];

    const isLikelyRandomGlucose = (name: string) => {
      const n = name.toLowerCase();
      return (
        n.includes('random') ||
        n.includes('postprandial') ||
        n.includes('post-prandial') ||
        n.includes('ppbs') ||
        n.includes('2 hour') ||
        n.includes('2-hour') ||
        n.includes('ogtt')
      );
    };

    const toMgDlGlucose = (value: number, unit?: string | null): number => {
      const u = (unit || '').toLowerCase().replace(/\s/g, '');
      if (u === 'mmol/l' || u === 'mmol') {
        return value * 18.0182;
      }
      return value;
    };

    const glucoseMeasurement = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      const isGlucose =
        n.includes('glucose') || n.includes('fbs') || n.includes('fasting sugar') || n.includes('fasting plasma');
      return isGlucose && !isLikelyRandomGlucose(m.testName);
    });

    const hba1cMeasurement = measurements.find((m) =>
      m.testName.toLowerCase().includes('hba1c') ||
      m.testName.toLowerCase().includes('glycated hemoglobin')
    );

    const fpg =
      glucoseMeasurement?.numericValue != null
        ? Math.round(toMgDlGlucose(glucoseMeasurement.numericValue, glucoseMeasurement.unit) * 10) / 10
        : null;
    const hba1c = hba1cMeasurement?.numericValue ?? null;

    if (fpg === null && hba1c === null) {
      return {
        assessmentType: 'ada_diabetes_prediabetes',
        methodType: 'clinical-guideline',
        methodIdentifier,
        methodVersion,
        isEligible: false,
        missingInputs: ['Fasting Blood Glucose (mg/dL)', 'HbA1c (%)'],
        inputSnapshot: {},
        explanation:
          'Risk assessment is unavailable because neither Fasting Blood Glucose nor HbA1c was identified in this medical report.',
        limitations: [
          'Diagnosis of prediabetes or diabetes requires confirmed laboratory plasma testing performed on two separate occasions.',
          'Post-prandial (random) glucose levels cannot be evaluated using fasting reference thresholds.',
        ],
      };
    }

    const inputSnapshot = {
      fastingPlasmaGlucose: fpg,
      hba1c: hba1c,
    };

    let status: IRiskOutput['status'] = 'low';
    let summary = 'Normal Glycemic Profile';
    const findings: string[] = [];
    const recommendations: string[] = [];

    // ADA thresholds:
    // FPG: <100 normal, 100-125 prediabetes, >=126 diabetes threshold
    // HbA1c: <5.7% normal, 5.7-6.4% prediabetes, >=6.5% diabetes threshold

    const isDiabetesFpg = fpg !== null && fpg >= 126;
    const isDiabetesHba1c = hba1c !== null && hba1c >= 6.5;

    const isPrediabetesFpg = fpg !== null && fpg >= 100 && fpg < 126;
    const isPrediabetesHba1c = hba1c !== null && hba1c >= 5.7 && hba1c < 6.5;

    if (isDiabetesFpg || isDiabetesHba1c) {
      status = 'high';
      summary = 'Elevated Glycemic Marker (Diabetes Threshold)';
      if (isDiabetesFpg) {
        findings.push(`Fasting Plasma Glucose is ${fpg} mg/dL (ADA threshold >= 126 mg/dL).`);
      }
      if (isDiabetesHba1c) {
        findings.push(`HbA1c is ${hba1c}% (ADA threshold >= 6.5%).`);
      }
      recommendations.push(
        'This is an educational comparison with published ADA laboratory thresholds, not a diagnosis. Discuss confirmation and next steps with a licensed clinician.'
      );
      recommendations.push(
        'A single out-of-range value does not prove diabetes. Repeat testing and clinical context are required.'
      );
    } else if (isPrediabetesFpg || isPrediabetesHba1c) {
      status = 'borderline';
      summary = 'Impaired Fasting Glucose / Prediabetes Range';
      if (isPrediabetesFpg) {
        findings.push(`Fasting Plasma Glucose is ${fpg} mg/dL (prediabetes range 100–125 mg/dL).`);
      }
      if (isPrediabetesHba1c) {
        findings.push(`HbA1c is ${hba1c}% (prediabetes range 5.7%–6.4%).`);
      }
      recommendations.push(
        'Educational note: published ADA categories describe laboratory ranges, not a personal diagnosis. Ask your clinician whether repeat fasting plasma glucose or HbA1c testing is appropriate.'
      );
      recommendations.push(
        'Do not change diet, medication, or monitoring based on this educational summary alone.'
      );
    } else {
      status = 'low';
      summary = 'Normal Glycemic Status';
      if (fpg !== null) findings.push(`Fasting Plasma Glucose is ${fpg} mg/dL (normal < 100 mg/dL).`);
      if (hba1c !== null) findings.push(`HbA1c is ${hba1c}% (normal < 5.7%).`);
      recommendations.push(
        'Educational note: these values fall below published ADA prediabetes/diabetes laboratory thresholds on this single report. Routine care decisions belong with your clinician.'
      );
    }

    const explanation = `Evaluated against ${methodIdentifier}: ${findings.join(' ')}`;

    return {
      assessmentType: 'ada_diabetes_prediabetes',
      methodType: 'clinical-guideline',
      methodIdentifier,
      methodVersion,
      isEligible: true,
      missingInputs: [],
      inputSnapshot,
      output: {
        status,
        score: hba1c ?? fpg,
        scoreLabel: hba1c !== null ? `HbA1c ${hba1c}%` : `FPG ${fpg} mg/dL`,
        summary,
        details: findings.join(' '),
        recommendations,
      },
      explanation,
      limitations: [
        'Single laboratory measurements must be confirmed by a healthcare provider and are not a diagnosis.',
        'Random, post-prandial, or OGTT glucose values are not evaluated with fasting ADA thresholds.',
        'Hemoglobin variants or recent blood loss can affect HbA1c accuracy.',
      ],
    };
  }

  /**
   * Evaluates Kidney Health via CKD-EPI eGFR Classification (KDIGO 2012)
   */
  evaluateCkdRisk(
    measurements: IExtractedMeasurement[],
    user: IUser,
    manualInputs?: { age?: number; gender?: 'male' | 'female' }
  ): AssessmentResult {
    const methodIdentifier = 'KDIGO 2012 / CKD-EPI eGFR Classification';
    const methodVersion = '2021-Race-Free';
    const missingInputs: string[] = [];

    const creatMeasurement = measurements.find(
      (m) =>
        m.testName.toLowerCase().includes('creatinine') &&
        !m.testName.toLowerCase().includes('clearance') &&
        !m.testName.toLowerCase().includes('urine')
    );

    const toMgDlCreatinine = (value: number, unit?: string | null): number => {
      const u = (unit || '').toLowerCase().replace(/\s/g, '');
      if (u === 'umol/l' || u === 'µmol/l' || u === 'μmol/l') {
        return value / 88.4;
      }
      return value;
    };

    const creatinine =
      creatMeasurement?.numericValue != null
        ? Math.round(toMgDlCreatinine(creatMeasurement.numericValue, creatMeasurement.unit) * 1000) / 1000
        : null;
    const repAny = report as any;
    const age = manualInputs?.age ?? user.profile?.age ?? repAny?.patientAge ?? null;
    const rawGender = manualInputs?.gender ?? user.profile?.gender ?? repAny?.patientGender?.toLowerCase() ?? null;
    const gender = (rawGender === 'female' || rawGender === 'male') ? rawGender : null;

    if (!creatinine) {
      missingInputs.push('Serum Creatinine (mg/dL)');
    }
    if (!age) {
      missingInputs.push('Age (years, from profile or input)');
    }
    if (!gender || (gender !== 'male' && gender !== 'female')) {
      missingInputs.push('Biological Sex (male or female, required for CKD-EPI formula)');
    }

    if (missingInputs.length > 0) {
      return {
        assessmentType: 'ckd_egfr',
        methodType: 'clinical-guideline',
        methodIdentifier,
        methodVersion,
        isEligible: false,
        missingInputs,
        inputSnapshot: {
          serumCreatinine: creatinine,
          age,
          gender,
        },
        explanation: `Risk assessment is unavailable because required clinical information is not available: ${missingInputs.join(', ')}.`,
        limitations: [
          'CKD-EPI equation requires exact serum creatinine, age, and biological sex.',
          'eGFR cannot be accurately determined without all three parameters.',
        ],
      };
    }

    // 2021 CKD-EPI formula (Race-free):
    // Females:
    //   Scr <= 0.7: 142 * (Scr/0.7)^(-0.241) * (0.9938)^Age * 1.012
    //   Scr > 0.7: 142 * (Scr/0.7)^(-1.200) * (0.9938)^Age * 1.012
    // Males:
    //   Scr <= 0.9: 142 * (Scr/0.9)^(-0.302) * (0.9938)^Age
    //   Scr > 0.9: 142 * (Scr/0.9)^(-1.200) * (0.9938)^Age

    const isFemale = gender === 'female';
    const creat = creatinine!;
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale
      ? creat <= 0.7 ? -0.241 : -1.200
      : creat <= 0.9 ? -0.302 : -1.200;
    const sexFactor = isFemale ? 1.012 : 1.0;

    const eGFR = Math.round(
      142 *
        Math.pow(creat / kappa, alpha) *
        Math.pow(0.9938, age!) *
        sexFactor
    );

    let status: IRiskOutput['status'] = 'low';
    let stage = 'G1';
    let summary = 'Normal or High Kidney Filtration';
    const recommendations: string[] = [];

    if (eGFR >= 90) {
      status = 'low';
      stage = 'Stage G1 (eGFR >= 90 mL/min/1.73m²)';
      summary = 'Normal or high filtration rate';
      recommendations.push('Educational note only. Kidney health interpretation requires a clinician.');
    } else if (eGFR >= 60) {
      status = 'low';
      stage = 'Stage G2 (eGFR 60-89 mL/min/1.73m²)';
      summary = 'Mildly decreased kidney filtration rate';
      recommendations.push(
        'Educational note: G2 eGFR can occur with aging and is not a diagnosis of chronic kidney disease by itself.'
      );
    } else if (eGFR >= 45) {
      status = 'borderline';
      stage = 'Stage G3a (eGFR 45-59 mL/min/1.73m²)';
      summary = 'Mild-to-moderately decreased filtration rate';
      recommendations.push('Discuss this educational eGFR result with a clinician. Do not stop or start medicines based on this tool.');
    } else if (eGFR >= 30) {
      status = 'intermediate';
      stage = 'Stage G3b (eGFR 30-44 mL/min/1.73m²)';
      summary = 'Moderately-to-severely decreased kidney filtration';
      recommendations.push('Ask a clinician whether specialist review is appropriate. This tool does not prescribe treatment.');
    } else if (eGFR >= 15) {
      status = 'high';
      stage = 'Stage G4 (eGFR 15-29 mL/min/1.73m²)';
      summary = 'Severely decreased filtration rate';
      recommendations.push('Seek prompt clinical care. This educational calculator is not an emergency diagnostic device.');
    } else {
      status = 'high';
      stage = 'Stage G5 (eGFR < 15 mL/min/1.73m²)';
      summary = 'Kidney failure threshold';
      recommendations.push('Seek urgent clinical care. This is not a diagnosis of kidney failure.');
    }

    const details = `Calculated eGFR: ${eGFR} mL/min/1.73m² (${stage}) using Serum Creatinine: ${creatinine} mg/dL, Age: ${age}, Sex: ${gender}.`;
    const explanation = `Calculated using the 2021 CKD-EPI formula: ${details}`;

    return {
      assessmentType: 'ckd_egfr',
      methodType: 'clinical-guideline',
      methodIdentifier,
      methodVersion,
      isEligible: true,
      missingInputs: [],
      inputSnapshot: {
        serumCreatinine: creatinine,
        age,
        gender,
        calculatedEgfr: eGFR,
      },
      output: {
        status,
        score: eGFR,
        scoreLabel: `${eGFR} mL/min/1.73m²`,
        summary,
        details,
        recommendations,
      },
      explanation,
      limitations: [
        'eGFR equations assume stable serum creatinine and are invalid in acute kidney injury.',
        'Extremes of muscle mass (bodybuilders, amputees) can skew creatinine-based eGFR.',
      ],
    };
  }

  /**
   * Evaluates 10-Year ASCVD Cardiovascular Risk (AHA/ACC Pooled Cohort Equations)
   */
  evaluateAscvdRisk(
    measurements: IExtractedMeasurement[],
    user: IUser,
    manualInputs?: {
      age?: number;
      gender?: 'male' | 'female';
      systolicBp?: number;
      onBpMeds?: boolean;
      smoker?: boolean;
      diabetic?: boolean;
    }
  ): AssessmentResult {
    const methodIdentifier = '2013 ACC/AHA 10-Year ASCVD Risk Estimator';
    const methodVersion = '2013.1';
    const missingInputs: string[] = [];

    const totalCholM = measurements.find((m) =>
      m.testName.toLowerCase().includes('total cholesterol')
    );
    const hdlCholM = measurements.find((m) =>
      m.testName.toLowerCase().includes('hdl')
    );

    const totalChol = totalCholM?.numericValue ?? null;
    const hdlChol = hdlCholM?.numericValue ?? null;
    const repAny = report as any;
    const age = manualInputs?.age ?? user.profile?.age ?? repAny?.patientAge ?? null;
    const rawGender = manualInputs?.gender ?? user.profile?.gender ?? repAny?.patientGender?.toLowerCase() ?? null;
    const gender = (rawGender === 'female' || rawGender === 'male') ? rawGender : null;
    const systolicBp = manualInputs?.systolicBp ?? null;
    const smoker = manualInputs?.smoker ?? null;

    if (!totalChol) missingInputs.push('Total Cholesterol (mg/dL)');
    if (!hdlChol) missingInputs.push('HDL Cholesterol (mg/dL)');
    if (!age || age < 40 || age > 79) missingInputs.push('Age (must be between 40 and 79)');
    if (!gender || (gender !== 'male' && gender !== 'female')) missingInputs.push('Biological Sex (male or female)');
    if (!systolicBp) missingInputs.push('Systolic Blood Pressure (mmHg, not printed on standard lab report)');
    if (smoker === null) missingInputs.push('Smoking Status (Current Smoker: Yes/No)');

    if (missingInputs.length > 0) {
      return {
        assessmentType: 'cardiovascular_ascvd',
        methodType: 'clinical-guideline',
        methodIdentifier,
        methodVersion,
        isEligible: false,
        missingInputs,
        inputSnapshot: {
          totalCholesterol: totalChol,
          hdlCholesterol: hdlChol,
          age,
          gender,
          systolicBp,
          smoker,
        },
        explanation:
          'Risk assessment is unavailable because the required clinical information (such as blood pressure, smoking status, and complete lipid profile) is not available from this laboratory report alone.',
        limitations: [
          'The ACC/AHA ASCVD Risk Estimator requires physical measurements (Blood Pressure) and clinical history (Smoking, Treatment) that cannot be inferred from a lab slip.',
          'You may test hypothetical values using the What-If Analysis tool.',
        ],
      };
    }

    // ACC/AHA 10-year ASCVD algorithm approximation (Goff et al. 2013)
    const lnAge = Math.log(age!);
    const lnTotalChol = Math.log(totalChol!);
    const lnHdl = Math.log(hdlChol!);
    const lnSbp = Math.log(systolicBp!);

    let coeffSum = 0;
    let s10 = 0;
    let meanCoeff = 0;

    if (gender === 'male') {
      coeffSum =
        12.344 * lnAge +
        11.853 * lnTotalChol -
        2.664 * lnAge * lnTotalChol -
        7.99 * lnHdl +
        1.769 * lnAge * lnHdl +
        1.797 * lnSbp +
        (smoker ? 7.837 - 1.795 * lnAge : 0);
      s10 = 0.9144;
      meanCoeff = 61.18;
    } else {
      coeffSum =
        -29.799 * lnAge +
        4.884 * Math.pow(lnAge, 2) +
        13.54 * lnTotalChol -
        3.114 * lnAge * lnTotalChol -
        13.578 * lnHdl +
        3.149 * lnAge * lnHdl +
        2.019 * lnSbp +
        (smoker ? 7.574 - 1.665 * lnAge : 0);
      s10 = 0.9665;
      meanCoeff = -29.18;
    }

    const rawRisk = 1 - Math.pow(s10, Math.exp(coeffSum - meanCoeff));
    const scorePercentage = Math.min(Math.max(Math.round(rawRisk * 1000) / 10, 0.5), 99);

    let status: IRiskOutput['status'] = 'low';
    let summary = 'Low 10-Year ASCVD Risk (< 5%)';
    const recommendations: string[] = [];

    if (scorePercentage < 5) {
      status = 'low';
      summary = 'Low 10-Year ASCVD Risk (< 5%)';
      recommendations.push(
        'Educational estimate only. This is not a personal prognosis and does not recommend treatment.'
      );
    } else if (scorePercentage < 7.5) {
      status = 'borderline';
      summary = 'Borderline 10-Year ASCVD Risk (5% to 7.4%)';
      recommendations.push(
        'Discuss cardiovascular prevention with a clinician. This app does not recommend starting or stopping medicines.'
      );
    } else if (scorePercentage < 20) {
      status = 'intermediate';
      summary = 'Intermediate 10-Year ASCVD Risk (7.5% to 19.9%)';
      recommendations.push(
        'Guideline categories exist for clinician-patient discussion. This tool does not prescribe statins or any therapy.'
      );
    } else {
      status = 'high';
      summary = 'High 10-Year ASCVD Risk (>= 20%)';
      recommendations.push(
        'A clinician should interpret cardiovascular risk. This educational estimate is not a treatment plan.'
      );
    }

    const details = `Estimated 10-year risk of cardiovascular event is ${scorePercentage}%. Calculated with Total Cholesterol: ${totalChol} mg/dL, HDL: ${hdlChol} mg/dL, Systolic BP: ${systolicBp} mmHg, Age: ${age}, Sex: ${gender}, Smoker: ${smoker ? 'Yes' : 'No'}.`;

    return {
      assessmentType: 'cardiovascular_ascvd',
      methodType: 'clinical-guideline',
      methodIdentifier,
      methodVersion,
      isEligible: true,
      missingInputs: [],
      inputSnapshot: {
        totalCholesterol: totalChol,
        hdlCholesterol: hdlChol,
        systolicBp,
        age,
        gender,
        smoker,
        calculatedRiskScore: scorePercentage,
      },
      output: {
        status,
        score: scorePercentage,
        scoreLabel: `${scorePercentage}% 10-Year Risk`,
        summary,
        details,
        recommendations,
      },
      explanation: `${methodIdentifier}: ${details}`,
      limitations: [
        'This is an educational approximation of published 2013 ACC/AHA Pooled Cohort Equation terms for demonstration. It is not a certified clinical calculator.',
        'Race-specific equations, treated blood pressure, and diabetes status are not fully implemented; results are preliminary and must not be used for care decisions.',
        'Population-level statistical estimates are not an individual diagnosis or prognosis.',
      ],
    };
  }

  /**
   * Evaluates Thyroid Function against laboratory reference ranges.
   * Uses the reference ranges printed on the report (or ATA/AACE published ranges if not printed).
   * This is a reference-range comparison, NOT a clinical diagnosis.
   */
  evaluateThyroidReferenceRange(measurements: IExtractedMeasurement[]): AssessmentResult {
    const methodIdentifier = 'Thyroid Reference Range Comparison (Laboratory Printed Ranges)';
    const methodVersion = '1.0';

    const tshM = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return n.includes('tsh') || n.includes('thyroid stimulating');
    });
    const ft4M = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return (n.includes('ft4') || n.includes('free t4') || n.includes('free thyroxine')) && !n.includes('total');
    });
    const ft3M = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return (n.includes('ft3') || n.includes('free t3') || n.includes('free triiodothyronine')) && !n.includes('total');
    });

    if (!tshM && !ft4M && !ft3M) {
      return {
        assessmentType: 'thyroid_reference_range',
        methodType: 'rule-based',
        methodIdentifier,
        methodVersion,
        isEligible: false,
        missingInputs: ['TSH (Thyroid Stimulating Hormone)', 'Free T4 (FT4)', 'Free T3 (FT3)'],
        inputSnapshot: {},
        explanation: 'No thyroid function measurements (TSH, FT3, FT4) were found in this report.',
        limitations: [
          'Thyroid function assessment requires at least TSH from the report.',
          'Reference ranges vary between laboratories and reagent methods — always use the ranges printed on your specific report.',
        ],
      };
    }

    const findings: string[] = [];
    const inputSnapshot: Record<string, unknown> = {};
    let overallStatus: IRiskOutput['status'] = 'low';

    const evaluateAgainstRange = (
      measurement: IExtractedMeasurement | undefined,
      label: string
    ): 'normal' | 'high' | 'low' | 'unknown' => {
      if (!measurement) return 'unknown';
      const val = measurement.numericValue;
      if (val === null || val === undefined) return 'unknown';

      // Use printed reference ranges if available
      const lo = measurement.referenceLow;
      const hi = measurement.referenceHigh;

      if (lo !== null && lo !== undefined && hi !== null && hi !== undefined) {
        if (val < lo) return 'low';
        if (val > hi) return 'high';
        return 'normal';
      }

      // Use result flag from extraction if ranges not available
      if (measurement.resultFlag === 'high') return 'high';
      if (measurement.resultFlag === 'low') return 'low';
      if (measurement.resultFlag === 'normal') return 'normal';
      return 'unknown';
    };

    const tshStatus = evaluateAgainstRange(tshM, 'TSH');
    const ft4Status = evaluateAgainstRange(ft4M, 'FT4');
    const ft3Status = evaluateAgainstRange(ft3M, 'FT3');

    if (tshM) {
      inputSnapshot['tsh'] = tshM.numericValue;
      inputSnapshot['tshUnit'] = tshM.unit;
      inputSnapshot['tshRef'] = tshM.referenceRangeText;
      findings.push(`TSH: ${tshM.rawValue}${tshM.referenceRangeText ? ` (Ref: ${tshM.referenceRangeText})` : ''} → ${tshStatus.toUpperCase()}`);
    }
    if (ft4M) {
      inputSnapshot['ft4'] = ft4M.numericValue;
      inputSnapshot['ft4Unit'] = ft4M.unit;
      inputSnapshot['ft4Ref'] = ft4M.referenceRangeText;
      findings.push(`Free T4: ${ft4M.rawValue}${ft4M.referenceRangeText ? ` (Ref: ${ft4M.referenceRangeText})` : ''} → ${ft4Status.toUpperCase()}`);
    }
    if (ft3M) {
      inputSnapshot['ft3'] = ft3M.numericValue;
      inputSnapshot['ft3Unit'] = ft3M.unit;
      inputSnapshot['ft3Ref'] = ft3M.referenceRangeText;
      findings.push(`Free T3: ${ft3M.rawValue}${ft3M.referenceRangeText ? ` (Ref: ${ft3M.referenceRangeText})` : ''} → ${ft3Status.toUpperCase()}`);
    }

    const anyAbnormal = [tshStatus, ft4Status, ft3Status].some((s) => s === 'high' || s === 'low');
    const allNormal = [tshStatus, ft4Status, ft3Status].filter((s) => s !== 'unknown').every((s) => s === 'normal');

    overallStatus = anyAbnormal ? 'borderline' : allNormal ? 'low' : 'low';

    // Narrative pattern interpretation (educational only)
    let patternNote = '';
    if (tshStatus === 'high' && (ft4Status === 'low' || ft4Status === 'normal')) {
      patternNote = 'Pattern suggests possible primary hypothyroidism — but this comparison requires clinical confirmation.';
    } else if (tshStatus === 'low' && (ft4Status === 'high' || ft4Status === 'normal')) {
      patternNote = 'Pattern suggests possible hyperthyroidism or suppressed TSH — clinical confirmation required.';
    } else if (tshStatus === 'normal' && allNormal) {
      patternNote = 'All available thyroid values are within their printed reference ranges.';
    }

    return {
      assessmentType: 'thyroid_reference_range',
      methodType: 'rule-based',
      methodIdentifier,
      methodVersion,
      isEligible: true,
      missingInputs: [],
      inputSnapshot,
      output: {
        status: overallStatus,
        score: null,
        scoreLabel: null,
        summary: anyAbnormal
          ? 'One or more thyroid values outside printed reference range'
          : 'Thyroid values within printed reference ranges',
        details: findings.join('. ') + (patternNote ? ` ${patternNote}` : ''),
        recommendations: [
          'This comparison uses the reference ranges printed on this specific laboratory report, which vary between laboratories.',
          'Out-of-range values on a single test do not confirm a thyroid disorder. Clinical history and physical examination are required.',
          'Do not start, stop, or adjust thyroid medication based on this educational comparison.',
        ],
      },
      explanation: `Compared each measured value against the reference range printed on the report. ${findings.join('. ')}`,
      limitations: [
        'Thyroid reference ranges vary substantially between laboratories and reagent manufacturers.',
        'TSH has a log-normal distribution; the same value may mean different things in different clinical contexts.',
        'Subclinical thyroid dysfunction requires clinical judgement, not only laboratory comparison.',
        'Anti-TPO and Anti-TG antibodies (if present) are not evaluated by this reference-range comparison.',
      ],
    };
  }

  /**
   * CBC Reference Range Comparison.
   * Compares haemoglobin, WBC, platelet count against printed reference ranges.
   */
  evaluateCbcReferenceRange(measurements: IExtractedMeasurement[]): AssessmentResult {
    const methodIdentifier = 'CBC Reference Range Comparison (Laboratory Printed Ranges)';
    const methodVersion = '1.0';

    const hbM = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return n.includes('hemoglobin') || n.includes('haemoglobin') || (n === 'hb') || (n === 'hgb');
    });
    const wbcM = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return n.includes('wbc') || n.includes('white blood cell') || n.includes('total leukocyte') || n.includes('tlc');
    });
    const pltM = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return n.includes('platelet') || n === 'plt';
    });
    const rbcM = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return n.includes('rbc') || n.includes('red blood cell');
    });
    const hctM = measurements.find((m) => {
      const n = m.testName.toLowerCase();
      return n.includes('hematocrit') || n.includes('haematocrit') || n.includes('pcv');
    });

    if (!hbM && !wbcM && !pltM) {
      return {
        assessmentType: 'cbc_reference_range',
        methodType: 'rule-based',
        methodIdentifier,
        methodVersion,
        isEligible: false,
        missingInputs: ['Haemoglobin', 'WBC Count', 'Platelet Count'],
        inputSnapshot: {},
        explanation: 'No core CBC measurements (Haemoglobin, WBC, or Platelet Count) were found in this report.',
        limitations: [
          'CBC reference range comparison requires at least one of Haemoglobin, WBC Count, or Platelet Count.',
          'Reference ranges vary between laboratories and patient populations.',
        ],
      };
    }

    const findings: string[] = [];
    const inputSnapshot: Record<string, unknown> = {};

    const assess = (m: IExtractedMeasurement | undefined, label: string): 'normal' | 'high' | 'low' | 'unknown' => {
      if (!m) return 'unknown';
      const val = m.numericValue;
      if (val === null || val === undefined) return 'unknown';
      const lo = m.referenceLow;
      const hi = m.referenceHigh;
      if (lo !== null && lo !== undefined && hi !== null && hi !== undefined) {
        if (val < lo) return 'low';
        if (val > hi) return 'high';
        return 'normal';
      }
      if (m.resultFlag === 'high') return 'high';
      if (m.resultFlag === 'low') return 'low';
      if (m.resultFlag === 'normal') return 'normal';
      return 'unknown';
    };

    const hbStatus = assess(hbM, 'Haemoglobin');
    const wbcStatus = assess(wbcM, 'WBC');
    const pltStatus = assess(pltM, 'Platelets');

    const addFinding = (m: IExtractedMeasurement | undefined, label: string, status: string, key: string) => {
      if (!m) return;
      inputSnapshot[key] = m.numericValue;
      inputSnapshot[`${key}Unit`] = m.unit;
      inputSnapshot[`${key}Ref`] = m.referenceRangeText;
      findings.push(`${label}: ${m.rawValue}${m.referenceRangeText ? ` (Ref: ${m.referenceRangeText})` : ''} → ${status.toUpperCase()}`);
    };

    addFinding(hbM, 'Haemoglobin', hbStatus, 'hemoglobin');
    addFinding(wbcM, 'WBC', wbcStatus, 'wbc');
    addFinding(pltM, 'Platelets', pltStatus, 'platelets');
    addFinding(rbcM, 'RBC', assess(rbcM, 'RBC'), 'rbc');
    addFinding(hctM, 'Haematocrit/PCV', assess(hctM, 'HCT'), 'hct');

    const anyAbnormal = [hbStatus, wbcStatus, pltStatus].some((s) => s === 'high' || s === 'low');

    return {
      assessmentType: 'cbc_reference_range',
      methodType: 'rule-based',
      methodIdentifier,
      methodVersion,
      isEligible: true,
      missingInputs: [],
      inputSnapshot,
      output: {
        status: anyAbnormal ? 'borderline' : 'low',
        score: null,
        scoreLabel: null,
        summary: anyAbnormal
          ? 'One or more CBC values outside printed reference range'
          : 'Core CBC values within printed reference ranges',
        details: findings.join('. '),
        recommendations: [
          'This comparison uses the reference ranges printed on this laboratory report.',
          'Single out-of-range CBC values may have many causes. Clinical correlation and repeat testing are required before drawing conclusions.',
          'Do not start or stop any treatment based on this educational comparison.',
        ],
      },
      explanation: `Compared CBC measurements against the printed reference ranges. ${findings.join('. ')}`,
      limitations: [
        'Reference ranges vary between laboratories, reagent methods, and patient demographics.',
        'CBC interpretation requires clinical context: symptoms, medications, hydration status, and prior results.',
        'Differential count and reticulocyte count, if present, require separate clinical interpretation.',
      ],
    };
  }

  /**
   * Stroke-Related Risk Factor Assessment.
   * Checks coagulation and inflammatory markers against reference ranges and flags risk factors.
   * This is NOT a stroke prediction model — it is a structured reference-range review.
   */
  evaluateStrokeRiskFactors(
    measurements: IExtractedMeasurement[],
    manualInputs?: { hypertension?: boolean; atrialFibrillation?: boolean; diabetic?: boolean; smoker?: boolean; age?: number }
  ): AssessmentResult {
    const methodIdentifier = 'Stroke Workup Reference Range Review (Coagulation + Inflammatory Markers)';
    const methodVersion = '1.0';

    const inrM = measurements.find((m) => m.testName.toLowerCase().includes('inr'));
    const ptM = measurements.find((m) => m.testName.toLowerCase().includes('prothrombin time') || m.testName.toLowerCase() === 'pt');
    const apttM = measurements.find((m) => m.testName.toLowerCase().includes('aptt') || m.testName.toLowerCase().includes('ptt'));
    const ddimerM = measurements.find((m) => m.testName.toLowerCase().includes('d-dimer') || m.testName.toLowerCase().includes('d dimer'));
    const fibM = measurements.find((m) => m.testName.toLowerCase().includes('fibrinogen'));
    const crpM = measurements.find((m) => m.testName.toLowerCase().includes('crp') || m.testName.toLowerCase().includes('c-reactive'));
    const homocysM = measurements.find((m) => m.testName.toLowerCase().includes('homocysteine'));

    if (!inrM && !ptM && !apttM && !ddimerM && !fibM && !crpM && !homocysM) {
      return {
        assessmentType: 'stroke_nihss_risk_factors',
        methodType: 'rule-based',
        methodIdentifier,
        methodVersion,
        isEligible: false,
        missingInputs: ['INR', 'PT', 'APTT', 'D-Dimer', 'Fibrinogen', 'CRP', 'Homocysteine'],
        inputSnapshot: {},
        explanation: 'No coagulation or inflammatory markers associated with stroke workup were found in this report.',
        limitations: [
          'A stroke risk assessment requires laboratory measurements from a coagulation or thrombophilia screen.',
          'This tool cannot assess stroke risk from CBC or metabolic panels alone.',
        ],
      };
    }

    const findings: string[] = [];
    const inputSnapshot: Record<string, unknown> = {};
    let flagCount = 0;

    const addM = (m: IExtractedMeasurement | undefined, label: string, key: string): 'normal' | 'high' | 'low' | 'unknown' => {
      if (!m) return 'unknown';
      inputSnapshot[key] = m.numericValue ?? m.rawValue;
      inputSnapshot[`${key}Unit`] = m.unit;
      inputSnapshot[`${key}Ref`] = m.referenceRangeText;
      const lo = m.referenceLow;
      const hi = m.referenceHigh;
      let status: 'normal' | 'high' | 'low' | 'unknown' = 'unknown';
      if (m.numericValue !== null && m.numericValue !== undefined) {
        if (lo !== null && lo !== undefined && hi !== null && hi !== undefined) {
          status = m.numericValue < lo ? 'low' : m.numericValue > hi ? 'high' : 'normal';
        } else if (m.resultFlag === 'high') status = 'high';
        else if (m.resultFlag === 'low') status = 'low';
        else if (m.resultFlag === 'normal') status = 'normal';
      }
      findings.push(`${label}: ${m.rawValue}${m.referenceRangeText ? ` (Ref: ${m.referenceRangeText})` : ''} → ${status.toUpperCase()}`);
      if (status === 'high' || status === 'low') flagCount++;
      return status;
    };

    addM(inrM, 'INR', 'inr');
    addM(ptM, 'PT', 'pt');
    addM(apttM, 'aPTT', 'aptt');
    addM(ddimerM, 'D-Dimer', 'ddimer');
    addM(fibM, 'Fibrinogen', 'fibrinogen');
    addM(crpM, 'CRP', 'crp');
    addM(homocysM, 'Homocysteine', 'homocysteine');

    // Clinical risk factors from manual input
    const riskFactors: string[] = [];
    if (manualInputs?.hypertension) riskFactors.push('Self-reported hypertension');
    if (manualInputs?.atrialFibrillation) riskFactors.push('Self-reported atrial fibrillation');
    if (manualInputs?.diabetic) riskFactors.push('Self-reported diabetes');
    if (manualInputs?.smoker) riskFactors.push('Self-reported current smoker');
    if (manualInputs?.age && manualInputs.age >= 65) riskFactors.push(`Age ≥ 65 (${manualInputs.age})`);

    if (riskFactors.length > 0) {
      inputSnapshot['reportedRiskFactors'] = riskFactors;
    }

    return {
      assessmentType: 'stroke_nihss_risk_factors',
      methodType: 'rule-based',
      methodIdentifier,
      methodVersion,
      isEligible: true,
      missingInputs: [],
      inputSnapshot,
      output: {
        status: flagCount >= 2 ? 'intermediate' : flagCount === 1 ? 'borderline' : 'low',
        score: null,
        scoreLabel: null,
        summary: flagCount > 0
          ? `${flagCount} coagulation/inflammatory marker(s) outside printed reference range`
          : 'Available coagulation and inflammatory markers within printed reference ranges',
        details: findings.join('. ') + (riskFactors.length > 0 ? ` Reported clinical risk factors: ${riskFactors.join(', ')}.` : ''),
        recommendations: [
          'This is a structured review of printed reference ranges for educational purposes only.',
          'Coagulation and inflammatory markers require clinical context for meaningful interpretation.',
          'Stroke risk cannot be determined from laboratory values alone. A full neurological assessment and imaging are required.',
          'Do not change any medication (especially anticoagulants) based on this educational summary.',
        ],
      },
      explanation: `Compared stroke-related laboratory markers against printed reference ranges. ${findings.join('. ')}`,
      limitations: [
        'This is NOT a validated stroke-risk prediction model (e.g. CHA₂DS₂-VASc requires clinical scoring data not available from lab slips).',
        'D-Dimer elevation is non-specific and occurs in many conditions beyond thrombosis.',
        'A full thrombophilia screen requires specific antibody tests not always present in standard panels.',
        'Coagulation results depend on sample handling, tourniquet time, and anticoagulant use.',
      ],
    };
  }

}

export const riskAssessmentService = new RiskAssessmentService();
