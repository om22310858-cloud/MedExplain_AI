import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { z } from 'zod';
import { getCategoryDefinition } from '../categoryRegistry.js';

export const StructuredAiResponseSchema = z.object({
  extractedSummary: z.string().min(5),
  measurements: z.array(
    z.object({
      testName: z.string().min(1),
      originalTestName: z.string().min(1),
      rawValue: z.string().min(1),
      numericValue: z.number().nullable().optional(),
      unit: z.string().nullable().optional(),
      referenceRangeText: z.string().nullable().optional(),
      referenceLow: z.number().nullable().optional(),
      referenceHigh: z.number().nullable().optional(),
      resultFlag: z.enum(['normal', 'high', 'low', 'abnormal', 'unknown']),
      sourcePage: z.number().int().default(1),
    })
  ),
  explanations: z.array(
    z.object({
      testName: z.string().min(1),
      valueAndUnit: z.string().min(1),
      referenceRange: z.string().optional(),
      status: z.enum(['normal', 'high', 'low', 'abnormal', 'unknown']),
      simpleExplanation: z.string().min(10),
      limitationsAndFactors: z.string().optional(),
      clinicianQuestions: z.array(z.string()).default([]),
    })
  ),
  warnings: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
});

export type StructuredAiResponse = z.infer<typeof StructuredAiResponseSchema>;

export class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-1.5-flash';

  constructor() {
    if (ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim() !== '') {
      this.client = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  private getModel() {
    if (!this.client) {
      throw new Error(
        'Gemini AI API key is not configured. Please set GEMINI_API_KEY in the server .env file.'
      );
    }

    return this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
      systemInstruction: `You are an expert clinical laboratory document extraction and health literacy system.
Your job is to read medical laboratory report content and extract structured test values, then generate simple-language educational explanations.

CRITICAL RULES:
1. ONLY extract laboratory measurements actually present in the provided document.
2. PRESERVE exact values, units, and reference ranges printed on the report.
3. If a reference interval is not printed, leave referenceRangeText null. NEVER invent a reference range.
4. For non-numeric results (e.g. "Negative", "Reactive", "Clear"), keep numericValue null and store the raw text in rawValue.
5. An out-of-range flag does NOT mean the user has a disease. Never invent diagnoses or probabilities.
6. Provide helpful, non-prescriptive questions the patient could discuss with their physician.
7. Return strictly valid JSON adhering to the expected schema without any markdown formatting wrappers.
8. This output is educational, not a medical diagnosis.`,
    });
  }

  private extractionPrompt(category: string, sourceNote: string): string {
    // Get category-specific extraction context from the registry
    const catDef = getCategoryDefinition(category as any);
    const categoryContext = catDef?.extractionContext ?? `Report Category: ${category}`;

    return `${categoryContext}

Source: ${sourceNote}

Extract all laboratory tests found in this document into JSON with fields:
{
  "extractedSummary": "A 2-4 sentence neutral summary of what tests were conducted and what type of document this appears to be. Do NOT diagnose.",
  "measurements": [
    {
      "testName": "Standardized test name per the category context above (e.g. Haemoglobin, TSH, Fasting Blood Glucose, Total Cholesterol, Serum Creatinine)",
      "originalTestName": "Exact test name as printed in the report",
      "rawValue": "Exact value as printed, e.g. 13.8 g/dL or 105 or Negative",
      "numericValue": 13.8,
      "unit": "g/dL",
      "referenceRangeText": "12.0 - 15.0 g/dL",
      "referenceLow": 12.0,
      "referenceHigh": 15.0,
      "resultFlag": "normal",
      "sourcePage": 1
    }
  ],
  "explanations": [
    {
      "testName": "Test name matching above",
      "valueAndUnit": "e.g. 13.8 g/dL",
      "referenceRange": "e.g. 12.0 - 15.0 g/dL",
      "status": "normal",
      "simpleExplanation": "Plain-language explanation of what this specific biomarker measures in the body.",
      "limitationsAndFactors": "Common benign factors that can influence this level (e.g. hydration, time of day, recent meal, medication).",
      "clinicianQuestions": ["One specific, relevant question the patient could ask their doctor about this test."]
    }
  ],
  "warnings": ["Any observations requiring prompt clinician review — only if clearly justified by the printed values"],
  "limitations": ["Any unreadable sections, missing reference ranges, scanned/blurry areas, or partial extraction notes"]
}`;
  }

  private async parseModelJson(responseText: string): Promise<StructuredAiResponse> {
    const parsedJson = JSON.parse(responseText);
    return StructuredAiResponseSchema.parse(parsedJson);
  }

  async analyzeReportText(
    extractedText: string,
    category: string
  ): Promise<StructuredAiResponse> {
    if (!extractedText || extractedText.trim().length < 15) {
      throw new Error(
        'The document contains insufficient readable text for AI analysis. It may be scanned or empty. You can enter measurements manually.'
      );
    }

    const model = this.getModel();

    const prompt = `${this.extractionPrompt(category, 'plain text extracted from a PDF')}

Raw Extracted Report Text:
"""
${extractedText.slice(0, 15000)}
"""`;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      return await this.parseModelJson(responseText);
    } catch (error: any) {
      logger.error('Gemini API analysis failed', error);
      if (error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        throw new Error(
          'Gemini API free-tier quota has been temporarily exhausted. Please try again shortly or configure an upgraded quota.'
        );
      }
      if (error instanceof z.ZodError) {
        throw new Error(
          'AI provider returned an invalid schema. Extraction could not be validated safely.'
        );
      }
      throw new Error(`AI analysis failed: ${error.message || 'Unknown error'}`);
    }
  }

  async analyzeReportImage(
    imageBuffer: Buffer,
    mimeType: string,
    category: string
  ): Promise<StructuredAiResponse> {
    const model = this.getModel();
    const prompt = `${this.extractionPrompt(
      category,
      'image of a medical report. Read only visible printed values. If text is unreadable, return empty measurements and explain the limitation.'
    )}`;

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        },
      ]);
      const responseText = result.response.text();
      return await this.parseModelJson(responseText);
    } catch (error: any) {
      logger.error('Gemini image analysis failed', error);
      if (error instanceof z.ZodError) {
        throw new Error(
          'AI provider returned an invalid schema. Image extraction could not be validated safely.'
        );
      }
      throw new Error(`AI image analysis failed: ${error.message || 'Unknown error'}`);
    }
  }
}

export const geminiService = new GeminiService();
