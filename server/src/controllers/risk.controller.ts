import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MedicalReport } from '../models/MedicalReport.js';
import { ExtractedMeasurement } from '../models/ExtractedMeasurement.js';
import { RiskAssessment, AssessmentType } from '../models/RiskAssessment.js';
import { WhatIfScenario } from '../models/WhatIfScenario.js';
import { riskAssessmentService, AssessmentResult } from '../services/risk/riskAssessmentService.js';
import { getSupportedAssessments, getCategoryDefinition } from '../services/categoryRegistry.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const evaluateRisk = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { assessmentType, manualInputs } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Report not found or access denied.', 404);
      return;
    }

    const measurements = await ExtractedMeasurement.find({ reportId: id, userId });

    let assessmentResult: AssessmentResult;

    switch (assessmentType as AssessmentType) {
      case 'ada_diabetes_prediabetes':
        assessmentResult = riskAssessmentService.evaluateAdaDiabetesRisk(measurements);
        break;
      case 'ckd_egfr':
        assessmentResult = riskAssessmentService.evaluateCkdRisk(
          measurements,
          req.user!,
          manualInputs
        );
        break;
      case 'cardiovascular_ascvd':
        assessmentResult = riskAssessmentService.evaluateAscvdRisk(
          measurements,
          req.user!,
          manualInputs
        );
        break;
      case 'thyroid_reference_range':
        assessmentResult = riskAssessmentService.evaluateThyroidReferenceRange(measurements);
        break;
      case 'cbc_reference_range':
        assessmentResult = riskAssessmentService.evaluateCbcReferenceRange(measurements);
        break;
      case 'stroke_nihss_risk_factors':
        assessmentResult = riskAssessmentService.evaluateStrokeRiskFactors(measurements, manualInputs);
        break;
      default:
        sendError(res, `Unsupported assessment type: ${assessmentType}. Supported: ada_diabetes_prediabetes, ckd_egfr, cardiovascular_ascvd, thyroid_reference_range, cbc_reference_range, stroke_nihss_risk_factors`, 400);
        return;
    }

    // Check if the assessment type is supported for this report's category
    const supportedForCategory = getSupportedAssessments(report.category);
    const isCategoryMismatch = supportedForCategory.length > 0 && !supportedForCategory.includes(assessmentType as AssessmentType);
    const categoryWarning = isCategoryMismatch
      ? `Note: ${assessmentType} is not in the primary supported assessments for category "${report.category}". Supported: ${supportedForCategory.join(', ')}.`
      : undefined;

    // Persist or update the risk assessment for this report
    const assessment = await RiskAssessment.findOneAndUpdate(
      { reportId: id, userId, assessmentType },
      {
        userId,
        reportId: id,
        assessmentType: assessmentResult.assessmentType,
        methodType: assessmentResult.methodType,
        methodIdentifier: assessmentResult.methodIdentifier,
        methodVersion: assessmentResult.methodVersion,
        isEligible: assessmentResult.isEligible,
        missingInputs: assessmentResult.missingInputs,
        inputSnapshot: assessmentResult.inputSnapshot,
        output: assessmentResult.output,
        explanation: assessmentResult.explanation,
        limitations: assessmentResult.limitations,
      },
      { upsert: true, new: true }
    );

    logger.info(`Risk assessment executed: ${assessment._id} (${assessmentType})`);

    sendSuccess(
      res,
      { assessment, categoryWarning },
      assessmentResult.isEligible
        ? 'Risk assessment computed successfully'
        : 'Assessment evaluated: insufficient data available'
    );
  } catch (error) {
    logger.error('Evaluate risk error', error);
    sendError(res, 'Failed to evaluate risk assessment.', 500);
  }
};

export const getReportRiskAssessments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const assessments = await RiskAssessment.find({ reportId: id, userId });
    sendSuccess(res, { assessments });
  } catch (error) {
    logger.error('Get risk assessments error', error);
    sendError(res, 'Failed to retrieve risk assessments.', 500);
  }
};

export const getRiskAssessmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid assessment ID', 400);
      return;
    }

    const assessment = await RiskAssessment.findOne({ _id: id, userId });
    if (!assessment) {
      sendError(res, 'Risk assessment not found or access denied.', 404);
      return;
    }

    const scenarios = await WhatIfScenario.find({ riskAssessmentId: id, userId }).sort({ createdAt: -1 });

    sendSuccess(res, { assessment, scenarios });
  } catch (error) {
    logger.error('Get assessment by ID error', error);
    sendError(res, 'Failed to retrieve risk assessment.', 500);
  }
};

export const createWhatIfScenario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // riskAssessmentId
    const userId = req.user!._id;
    const { scenarioName, hypotheticalInputs } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid assessment ID', 400);
      return;
    }

    const assessment = await RiskAssessment.findOne({ _id: id, userId });
    if (!assessment) {
      sendError(res, 'Risk assessment not found or access denied.', 404);
      return;
    }

    const measurements = await ExtractedMeasurement.find({ reportId: assessment.reportId, userId });

    const overlay = (
      list: Array<Record<string, unknown>>,
      matcher: (name: string) => boolean,
      value: unknown,
      testName: string,
      unit: string
    ) => {
      if (value === undefined || value === null || value === '') {
        return list;
      }
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        return list;
      }
      const existing = list.find((m) => matcher(String(m.testName || '').toLowerCase()));
      if (existing) {
        existing.numericValue = numeric;
        existing.rawValue = `${numeric} ${unit}`;
        existing.unit = unit;
        return list;
      }
      list.push({
        testName,
        originalTestName: `Hypothetical ${testName}`,
        rawValue: `${numeric} ${unit}`,
        numericValue: numeric,
        unit,
      });
      return list;
    };

    let syntheticMeasurements: Array<Record<string, unknown>> = measurements.map((m) => m.toObject()) as unknown as Array<Record<string, unknown>>;
    syntheticMeasurements = overlay(
      syntheticMeasurements,
      (n) => n.includes('glucose') || n.includes('fbs') || n.includes('fasting sugar'),
      hypotheticalInputs.glucose,
      'Fasting Blood Glucose',
      'mg/dL'
    );
    syntheticMeasurements = overlay(
      syntheticMeasurements,
      (n) => n.includes('hba1c'),
      hypotheticalInputs.hba1c,
      'HbA1c',
      '%'
    );
    syntheticMeasurements = overlay(
      syntheticMeasurements,
      (n) => n.includes('creatinine') && !n.includes('urine'),
      hypotheticalInputs.creatinine,
      'Serum Creatinine',
      'mg/dL'
    );
    syntheticMeasurements = overlay(
      syntheticMeasurements,
      (n) => n.includes('total cholesterol'),
      hypotheticalInputs.totalCholesterol,
      'Total Cholesterol',
      'mg/dL'
    );
    syntheticMeasurements = overlay(
      syntheticMeasurements,
      (n) => n.includes('hdl'),
      hypotheticalInputs.hdl,
      'HDL Cholesterol',
      'mg/dL'
    );

    let simulatedResult: AssessmentResult;
    switch (assessment.assessmentType) {
      case 'ada_diabetes_prediabetes':
        simulatedResult = riskAssessmentService.evaluateAdaDiabetesRisk(syntheticMeasurements as any);
        break;
      case 'ckd_egfr':
        simulatedResult = riskAssessmentService.evaluateCkdRisk(
          syntheticMeasurements as any,
          req.user!,
          hypotheticalInputs
        );
        break;
      case 'cardiovascular_ascvd':
        simulatedResult = riskAssessmentService.evaluateAscvdRisk(
          syntheticMeasurements as any,
          req.user!,
          hypotheticalInputs
        );
        break;
      default:
        sendError(res, 'Unsupported assessment for scenario simulation', 400);
        return;
    }

    if (!simulatedResult.isEligible || !simulatedResult.output) {
      sendError(
        res,
        `Cannot calculate scenario: missing required parameters (${simulatedResult.missingInputs.join(', ')})`,
        422
      );
      return;
    }

    // Determine changed inputs
    const changedInputs: Record<string, { original: unknown; hypothetical: unknown }> = {};
    for (const [key, val] of Object.entries(hypotheticalInputs)) {
      const orig = assessment.inputSnapshot[key];
      if (orig !== val) {
        changedInputs[key] = { original: orig, hypothetical: val };
      }
    }

    const scenario = await WhatIfScenario.create({
      userId,
      reportId: assessment.reportId,
      riskAssessmentId: assessment._id,
      scenarioName: scenarioName && scenarioName.trim() ? scenarioName.trim() : 'Hypothetical Scenario',
      originalInputs: assessment.inputSnapshot,
      hypotheticalInputs,
      changedInputs,
      result: simulatedResult.output,
      explanation: `HYPOTHETICAL simulation only. Original report values were not changed. ${simulatedResult.explanation}`,
    });

    logger.info(`What-If Scenario created: ${scenario._id}`);
    sendSuccess(res, { scenario }, 'Hypothetical scenario calculated successfully', 201);
  } catch (error) {
    logger.error('Create what-if scenario error', error);
    sendError(res, 'Failed to calculate What-If scenario.', 500);
  }
};

export const getWhatIfScenarios = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const scenarios = await WhatIfScenario.find({ riskAssessmentId: id, userId }).sort({ createdAt: -1 });
    sendSuccess(res, { scenarios });
  } catch (error) {
    logger.error('Get scenarios error', error);
    sendError(res, 'Failed to fetch scenarios.', 500);
  }
};
