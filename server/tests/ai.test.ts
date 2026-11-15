import { describe, it, expect } from 'vitest';
import { StructuredAiResponseSchema, GeminiService } from '../src/services/ai/geminiService.js';

describe('Gemini AI Service & Schema Validation Tests', () => {
  it('validates a conformant AI response schema', () => {
    const validPayload = {
      extractedSummary: 'Complete blood count reveals normal white cell counts and hemoglobin with borderline low platelets.',
      measurements: [
        {
          testName: 'Hemoglobin',
          originalTestName: 'Hb (Hemoglobin)',
          rawValue: '14.5 g/dL',
          numericValue: 14.5,
          unit: 'g/dL',
          referenceRangeText: '13.0 - 17.0 g/dL',
          referenceLow: 13.0,
          referenceHigh: 17.0,
          resultFlag: 'normal',
          sourcePage: 1,
        },
        {
          testName: 'Platelet Count',
          originalTestName: 'Platelets',
          rawValue: '145,000 /uL',
          numericValue: 145000,
          unit: '/uL',
          referenceRangeText: '150,000 - 450,000 /uL',
          referenceLow: 150000,
          referenceHigh: 450000,
          resultFlag: 'low',
          sourcePage: 1,
        },
      ],
      explanations: [
        {
          testName: 'Hemoglobin',
          valueAndUnit: '14.5 g/dL',
          referenceRange: '13.0 - 17.0 g/dL',
          status: 'normal',
          simpleExplanation: 'Carries oxygen throughout the body in red blood cells.',
          limitationsAndFactors: 'Hydration levels can transiently alter concentration.',
          clinicianQuestions: ['Is my hemoglobin level stable compared to last year?'],
        },
      ],
      warnings: ['Platelet count is slightly below laboratory reference range.'],
      limitations: ['Single measurement, clinical correlation advised.'],
    };

    const parsed = StructuredAiResponseSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('rejects malformed AI response payloads missing required fields', () => {
    const invalidPayload = {
      extractedSummary: 'Short',
      // Missing measurements
    };

    const parsed = StructuredAiResponseSchema.safeParse(invalidPayload);
    expect(parsed.success).toBe(false);
  });

  it('reports unconfigured status when GEMINI_API_KEY is not set', () => {
    const service = new GeminiService();
    // In test environment without key, it must report isConfigured false
    if (!process.env.GEMINI_API_KEY) {
      expect(service.isConfigured()).toBe(false);
    }
  });
});
