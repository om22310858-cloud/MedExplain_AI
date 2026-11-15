import { describe, it, expect } from 'vitest';
import { riskAssessmentService } from '../src/services/risk/riskAssessmentService.js';
import mongoose from 'mongoose';

describe('RiskAssessmentService Unit Tests', () => {
  const mockUser: any = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Sanika',
    profile: {
      age: 52,
      gender: 'female',
    },
  };

  it('correctly calculates ADA Prediabetes and Diabetes thresholds', () => {
    // Normal FPG (<100)
    const normalMeasurements: any[] = [
      { testName: 'Fasting Blood Glucose', numericValue: 88, unit: 'mg/dL' },
    ];
    const normalResult = riskAssessmentService.evaluateAdaDiabetesRisk(normalMeasurements);
    expect(normalResult.isEligible).toBe(true);
    expect(normalResult.output?.status).toBe('low');

    // Prediabetes FPG (100-125)
    const prediabetesMeasurements: any[] = [
      { testName: 'Glucose Fasting', numericValue: 112, unit: 'mg/dL' },
    ];
    const prediabetesResult = riskAssessmentService.evaluateAdaDiabetesRisk(prediabetesMeasurements);
    expect(prediabetesResult.isEligible).toBe(true);
    expect(prediabetesResult.output?.status).toBe('borderline');
    expect(prediabetesResult.output?.summary).toContain('Prediabetes');

    // Diabetes threshold FPG (>= 126)
    const diabetesMeasurements: any[] = [
      { testName: 'Fasting Plasma Glucose', numericValue: 135, unit: 'mg/dL' },
    ];
    const diabetesResult = riskAssessmentService.evaluateAdaDiabetesRisk(diabetesMeasurements);
    expect(diabetesResult.isEligible).toBe(true);
    expect(diabetesResult.output?.status).toBe('high');
  });

  it('rejects ADA risk assessment when no glucose or HbA1c is present', () => {
    const unrelatedMeasurements: any[] = [
      { testName: 'Hemoglobin', numericValue: 14.2, unit: 'g/dL' },
    ];
    const result = riskAssessmentService.evaluateAdaDiabetesRisk(unrelatedMeasurements);
    expect(result.isEligible).toBe(false);
    expect(result.missingInputs).toContain('Fasting Blood Glucose (mg/dL)');
    expect(result.output).toBeUndefined();
    expect(result.explanation).toContain('Risk assessment is unavailable');
  });

  it('correctly calculates CKD-EPI eGFR for female patient', () => {
    // 52yo female with creatinine 0.8 mg/dL
    const measurements: any[] = [
      { testName: 'Serum Creatinine', numericValue: 0.8, unit: 'mg/dL' },
    ];
    const result = riskAssessmentService.evaluateCkdRisk(measurements, mockUser);
    expect(result.isEligible).toBe(true);
    expect(result.output?.score).toBeGreaterThan(60);
    expect(result.output?.status).toBe('low');
    expect(result.explanation).toContain('2021 CKD-EPI formula');
  });

  it('flags missing parameters for CKD evaluation if creatinine is absent', () => {
    const measurements: any[] = [
      { testName: 'Total Cholesterol', numericValue: 200, unit: 'mg/dL' },
    ];
    const result = riskAssessmentService.evaluateCkdRisk(measurements, mockUser);
    expect(result.isEligible).toBe(false);
    expect(result.missingInputs).toContain('Serum Creatinine (mg/dL)');
  });

  it('flags missing blood pressure and clinical history for 10-year ASCVD risk', () => {
    const measurements: any[] = [
      { testName: 'Total Cholesterol', numericValue: 210, unit: 'mg/dL' },
      { testName: 'HDL Cholesterol', numericValue: 55, unit: 'mg/dL' },
    ];
    // Without blood pressure and smoking status provided
    const result = riskAssessmentService.evaluateAscvdRisk(measurements, mockUser);
    expect(result.isEligible).toBe(false);
    expect(result.missingInputs).toContain('Systolic Blood Pressure (mmHg, not printed on standard lab report)');
    expect(result.missingInputs).toContain('Smoking Status (Current Smoker: Yes/No)');
  });

  it('calculates 10-year ASCVD risk when all required inputs are provided', () => {
    const measurements: any[] = [
      { testName: 'Total Cholesterol', numericValue: 220, unit: 'mg/dL' },
      { testName: 'HDL Cholesterol', numericValue: 45, unit: 'mg/dL' },
    ];
    const manualInputs = {
      systolicBp: 130,
      smoker: false,
    };
    const result = riskAssessmentService.evaluateAscvdRisk(measurements, mockUser, manualInputs);
    expect(result.isEligible).toBe(true);
    expect(result.output?.score).toBeDefined();
    expect(result.output?.status).toBeDefined();
  });
});
