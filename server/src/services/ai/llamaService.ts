import { ENV } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { getCategoryDefinition } from '../categoryRegistry.js';
import { StructuredAiResponse, StructuredAiResponseSchema } from './geminiService.js';
import { generateLocalExplanations } from './localExtractor.js';

export class LlamaService {
  private baseUrl: string;
  private modelName: string;
  private isAvailableCache: boolean | null = null;
  private lastCheckTime = 0;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
    this.modelName = process.env.OLLAMA_MODEL || 'llama3.2:latest';
  }

  async isAvailable(): Promise<boolean> {
    const now = Date.now();
    // Cache availability check for 10 seconds to avoid unnecessary network calls
    if (this.isAvailableCache !== null && now - this.lastCheckTime < 10000) {
      return this.isAvailableCache;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        this.isAvailableCache = false;
        return false;
      }

      const data: any = await res.json();
      const models = data.models || [];
      const hasModel = models.some(
        (m: any) =>
          m.name === this.modelName ||
          m.name.startsWith(this.modelName) ||
          m.name.includes('llama3.2')
      );

      this.isAvailableCache = hasModel || models.length > 0;
      this.lastCheckTime = now;
      return this.isAvailableCache;
    } catch {
      this.isAvailableCache = false;
      return false;
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  private extractionPrompt(category: string, sourceNote: string): string {
    const catDef = getCategoryDefinition(category as any);
    const categoryContext = catDef?.extractionContext ?? `Report Category: ${category}`;

    return `${categoryContext}

Source: ${sourceNote}

Extract all laboratory tests found in this document into strictly valid JSON with fields:
{
  "extractedSummary": "A concise 1-2 sentence clinical summary of tests conducted.",
  "measurements": [
    {
      "testName": "Standardized test name per category context above",
      "originalTestName": "Exact test name as printed in report",
      "rawValue": "Exact value as printed, e.g. 1.9 mg/dL or Negative",
      "numericValue": 1.9,
      "unit": "mg/dL",
      "referenceRangeText": "0.7 - 1.3 mg/dL",
      "referenceLow": 0.7,
      "referenceHigh": 1.3,
      "resultFlag": "normal",
      "sourcePage": 1
    }
  ],
  "explanations": [],
  "warnings": [],
  "limitations": []
}`;
  }

  private sanitizeAndParseJson(rawText: string): StructuredAiResponse {
    let clean = rawText.trim();
    // Strip markdown code fences if model returned ```json ... ```
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }

    let rawJson: any;
    try {
      rawJson = JSON.parse(clean);
    } catch {
      // Graceful repair of truncated JSON responses
      let repaired = false;
      let lastCloseBrace = clean.lastIndexOf('}');
      while (lastCloseBrace > 0) {
        const candidate = clean.slice(0, lastCloseBrace + 1);
        const suffixes = [
          ']}',
          ']}}',
          '"}',
          '"]}',
          '"}',
          '}',
        ];
        for (const suffix of suffixes) {
          try {
            rawJson = JSON.parse(candidate + suffix);
            repaired = true;
            break;
          } catch {}
        }
        if (repaired) break;
        lastCloseBrace = clean.lastIndexOf('}', lastCloseBrace - 1);
      }
      if (!repaired) {
        throw new Error('Unable to parse JSON from AI model response.');
      }
    }

    // Normalize resultFlag and status enum values
    const validFlags = new Set(['normal', 'high', 'low', 'abnormal', 'unknown']);

    const coerceNumber = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const measurements = Array.isArray(rawJson.measurements)
      ? rawJson.measurements.map((m: any, idx: number) => {
          const rawFlag = String(m.resultFlag || 'unknown').toLowerCase().trim();
          const resultFlag = validFlags.has(rawFlag) ? rawFlag : 'unknown';
          return {
            testName: String(m.testName || `Test ${idx + 1}`),
            originalTestName: String(m.originalTestName || m.testName || `Test ${idx + 1}`),
            rawValue: String(m.rawValue || m.numericValue || 'N/A'),
            numericValue: coerceNumber(m.numericValue),
            unit: m.unit ? String(m.unit) : null,
            referenceRangeText: m.referenceRangeText ? String(m.referenceRangeText) : null,
            referenceLow: coerceNumber(m.referenceLow),
            referenceHigh: coerceNumber(m.referenceHigh),
            resultFlag,
            sourcePage: Number(m.sourcePage) || 1,
          };
        })
      : [];

    let explanations = Array.isArray(rawJson.explanations)
      ? rawJson.explanations.map((e: any, idx: number) => {
          const rawStatus = String(e.status || 'unknown').toLowerCase().trim();
          const status = validFlags.has(rawStatus) ? rawStatus : 'unknown';
          return {
            testName: String(e.testName || `Test ${idx + 1}`),
            valueAndUnit: String(e.valueAndUnit || 'N/A'),
            referenceRange: e.referenceRange ? String(e.referenceRange) : undefined,
            status,
            simpleExplanation:
              typeof e.simpleExplanation === 'string' && e.simpleExplanation.length >= 10
                ? e.simpleExplanation
                : 'Measures body biomarker concentration according to clinical laboratory standards.',
            limitationsAndFactors: e.limitationsAndFactors ? String(e.limitationsAndFactors) : undefined,
            clinicianQuestions: Array.isArray(e.clinicianQuestions)
              ? e.clinicianQuestions.map((q: any) => String(q))
              : ['What does this test result mean in the context of my overall health?'],
          };
        })
      : [];

    // If explanations list is shorter than measurements or missing tests, auto-fill using local clinical definitions
    if (measurements.length > explanations.length) {
      const existingTests = new Set(explanations.map((e) => e.testName.toLowerCase()));
      const fallbackExplanations = generateLocalExplanations(measurements as any);
      for (const fallback of fallbackExplanations) {
        if (!existingTests.has(fallback.testName.toLowerCase())) {
          explanations.push({
            testName: fallback.testName,
            valueAndUnit: fallback.valueAndUnit,
            referenceRange: fallback.referenceRange,
            status: fallback.status as any,
            simpleExplanation: fallback.simpleExplanation,
            limitationsAndFactors: fallback.limitationsAndFactors,
            clinicianQuestions: fallback.clinicianQuestions,
          });
        }
      }
    }

    const sanitized = {
      extractedSummary:
        typeof rawJson.extractedSummary === 'string' && rawJson.extractedSummary.length >= 5
          ? rawJson.extractedSummary
          : 'Laboratory document analyzed with structured test extraction.',
      measurements,
      explanations,
      warnings: Array.isArray(rawJson.warnings) ? rawJson.warnings.map(String) : [],
      limitations: Array.isArray(rawJson.limitations)
        ? rawJson.limitations.map(String)
        : ['AI extraction provides educational context only and does not replace medical consultation.'],
    };

    return StructuredAiResponseSchema.parse(sanitized);
  }

  async analyzeReportText(
    extractedText: string,
    category: string
  ): Promise<StructuredAiResponse> {
    if (!extractedText || extractedText.trim().length < 15) {
      throw new Error(
        'The document contains insufficient readable text for AI analysis. You can enter measurements manually.'
      );
    }

    const prompt = `${this.extractionPrompt(category, 'plain text extracted from a PDF')}

Raw Extracted Report Text:
"""
${extractedText.slice(0, 10000)}
"""`;

    try {
      logger.info(`Analyzing report with local Llama 3.2 (${this.modelName})...`);

      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert clinical laboratory document extraction system. Read medical laboratory reports, extract structured values, and produce strictly valid JSON matching the schema without markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          format: 'json',
          stream: false,
          options: {
            temperature: 0.1,
            num_ctx: 4096,
            num_predict: 1000,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama request failed (${res.status}): ${errorText}`);
      }

      const data: any = await res.json();
      const rawContent = data.message?.content || '{}';

      return this.sanitizeAndParseJson(rawContent);
    } catch (error: any) {
      logger.error('Llama 3.2 analysis failed', error);
      throw new Error(`Llama 3.2 analysis failed: ${error.message || 'Unknown error'}`);
    }
  }

  async analyzeReportImage(
    imageBuffer: Buffer,
    mimeType: string,
    category: string
  ): Promise<StructuredAiResponse> {
    const prompt = `${this.extractionPrompt(
      category,
      'image of a medical laboratory report'
    )}`;

    try {
      logger.info(`Analyzing report image with Llama 3.2 (${this.modelName})...`);

      const base64Image = imageBuffer.toString('base64');

      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert clinical laboratory document extraction system. Read medical laboratory reports from images, extract structured values, and produce strictly valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
              images: [base64Image],
            },
          ],
          format: 'json',
          stream: false,
          options: {
            temperature: 0.1,
            num_ctx: 4096,
            num_predict: 1000,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama image request failed (${res.status}): ${errorText}`);
      }

      const data: any = await res.json();
      const rawContent = data.message?.content || '{}';

      return this.sanitizeAndParseJson(rawContent);
    } catch (error: any) {
      logger.error('Llama image analysis failed', error);
      throw new Error(
        `Llama 3.2 image analysis failed (note: image OCR requires a vision model such as llama3.2-vision): ${error.message}`
      );
    }
  }
}

export const llamaService = new LlamaService();
