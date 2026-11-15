import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MedicalReport, ReportCategory, DocumentType } from '../models/MedicalReport.js';
import { ExtractedMeasurement } from '../models/ExtractedMeasurement.js';
import { ReportAnalysis } from '../models/ReportAnalysis.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { WhatIfScenario } from '../models/WhatIfScenario.js';
import { ReportComparison } from '../models/ReportComparison.js';
import { storageService } from '../services/storage/localStorageAdapter.js';
import { extractTextFromPdf } from '../services/ai/pdfParser.js';
import { geminiService } from '../services/ai/geminiService.js';
import { llamaService } from '../services/ai/llamaService.js';
import { ENV } from '../config/env.js';
import { extractMeasurementsFromText, generateLocalExplanations } from '../services/ai/localExtractor.js';
import { detectCategoryMismatch, getCategoryDefinition } from '../services/categoryRegistry.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const uploadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      sendError(res, 'No file uploaded. Please select a PDF or image file.', 400);
      return;
    }

    const userId = req.user!._id;
    const { title, category, documentType, userNotes, reportDate, tags } = req.body;

    // Save to private storage
    const storageResult = await storageService.saveFile(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const report = await MedicalReport.create({
      userId,
      title: title && title.trim() ? title.trim() : file.originalname,
      category: (category as ReportCategory) || 'general',
      documentType: (documentType as DocumentType) || 'lab_report',
      storageProvider: 'local',
      privateStorageKey: storageResult.storageKey,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: storageResult.fileSize,
      reportDate: reportDate ? new Date(reportDate) : undefined,
      userNotes: userNotes ? userNotes.trim() : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      processingStatus: 'uploaded',
      analysisStatus: 'none',
    });

    logger.info(`Report uploaded successfully: ${report._id} for user ${userId}`);

    sendSuccess(res, { report }, 'Medical report uploaded successfully', 201);
  } catch (error: any) {
    logger.error('Report upload failed', error);
    sendError(res, error.message || 'Failed to upload report', 500);
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const {
      category,
      documentType,
      search,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: Record<string, unknown> = { userId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (documentType && documentType !== 'all') {
      query.documentType = documentType;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { userNotes: searchRegex },
        { originalFilename: searchRegex },
        { tags: searchRegex },
      ];
    }

    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = new Set(['createdAt', 'updatedAt', 'reportDate', 'title']);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortField =
      typeof sortBy === 'string' && allowedSortFields.has(sortBy) ? sortBy : 'createdAt';

    const [reports, totalCount] = await Promise.all([
      MedicalReport.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MedicalReport.countDocuments(query),
    ]);

    sendSuccess(
      res,
      {
        reports,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      },
      'Reports retrieved successfully'
    );
  } catch (error) {
    logger.error('Get reports error', error);
    sendError(res, 'Failed to retrieve reports.', 500);
  }
};

export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Medical report not found or access denied.', 404);
      return;
    }

    const [measurements, analysis, riskAssessments] = await Promise.all([
      ExtractedMeasurement.find({ reportId: id, userId }).sort({ createdAt: 1 }),
      ReportAnalysis.findOne({ reportId: id, userId }),
      RiskAssessment.find({ reportId: id, userId }),
    ]);

    // Add supported assessments for this category to help the UI show relevant options
    const categoryDef = getCategoryDefinition(report.category);
    const supportedAssessments = categoryDef.supportedAssessments;

    sendSuccess(
      res,
      {
        report,
        measurements,
        analysis,
        riskAssessments,
        supportedAssessments,
      },
      'Report details retrieved'
    );
  } catch (error) {
    logger.error('Get report by ID error', error);
    sendError(res, 'Failed to fetch report details.', 500);
  }
};

export const updateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const { title, category, documentType, userNotes, reportDate, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Medical report not found or access denied.', 404);
      return;
    }

    if (title !== undefined) report.title = title.trim();
    if (category !== undefined) report.category = category;
    if (documentType !== undefined) report.documentType = documentType;
    if (userNotes !== undefined) report.userNotes = userNotes.trim();
    if (reportDate !== undefined) report.reportDate = reportDate ? new Date(reportDate) : undefined;
    if (tags !== undefined) report.tags = tags;

    await report.save();
    logger.info(`Report updated: ${report._id}`);
    sendSuccess(res, { report }, 'Report updated successfully');
  } catch (error) {
    logger.error('Update report error', error);
    sendError(res, 'Failed to update report.', 500);
  }
};

export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Medical report not found or access denied.', 404);
      return;
    }

    // Delete physical file from storage
    try {
      await storageService.deleteFile(report.privateStorageKey);
    } catch (err) {
      logger.warn(`Could not delete physical storage key: ${report.privateStorageKey}`);
    }

    // Cascade delete linked entities
    await Promise.all([
      MedicalReport.deleteOne({ _id: id }),
      ExtractedMeasurement.deleteMany({ reportId: id }),
      ReportAnalysis.deleteMany({ reportId: id }),
      RiskAssessment.deleteMany({ reportId: id }),
      WhatIfScenario.deleteMany({ reportId: id }),
      ReportComparison.deleteMany({
        $or: [{ olderReportId: id }, { newerReportId: id }],
      }),
    ]);

    logger.info(`Report and all dependencies deleted: ${id}`);
    sendSuccess(res, null, 'Report and all associated analysis records deleted successfully');
  } catch (error) {
    logger.error('Delete report error', error);
    sendError(res, 'Failed to delete report.', 500);
  }
};

export const downloadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Medical report not found or access denied.', 404);
      return;
    }

    const stream = await storageService.getFileStream(report.privateStorageKey);

    res.setHeader('Content-Type', report.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(report.originalFilename)}"`
    );
    res.setHeader('Content-Length', report.fileSize);

    stream.pipe(res);
  } catch (error: any) {
    logger.error('Download report error', error);
    sendError(res, 'Failed to stream document. The file may be missing from storage.', 404);
  }
};

export const triggerAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Medical report not found or access denied.', 404);
      return;
    }

    report.processingStatus = 'processing';
    report.analysisStatus = 'pending';
    await report.save();

    // Read file buffer from private storage
    const fileBuffer = await storageService.getFileBuffer(report.privateStorageKey);

    let extractedText = '';
    let pdfParseError: string | undefined;
    if (report.mimeType === 'application/pdf') {
      try {
        const parsedPdf = await extractTextFromPdf(fileBuffer);
        extractedText = parsedPdf.text;
      } catch (pdfErr: any) {
        pdfParseError = pdfErr.message;
      }
    }

    // Determine active AI provider (Llama 3.2 via Ollama or Gemini)
    const llamaAvailable = await llamaService.isAvailable();
    const useLlama =
      ENV.AI_PROVIDER === 'llama' ||
      (ENV.AI_PROVIDER === 'auto' && llamaAvailable && !geminiService.isConfigured());

    const isAiConfigured = useLlama ? llamaAvailable : geminiService.isConfigured();

    if (!isAiConfigured) {
      // --- LOCAL EXTRACTION PATH ---
      // Gemini not configured. Attempt local regex-based extraction from PDF text.
      if (report.mimeType === 'application/pdf') {
        if (!extractedText || extractedText.trim().length < 10) {
          report.processingStatus = 'review_required';
          report.analysisStatus = 'unavailable';
          report.errorMessage =
            pdfParseError ||
            'This PDF contains no extractable text (may be a scan). Add GEMINI_API_KEY to .env for AI image analysis, or enter measurements manually.';
          await report.save();
          sendSuccess(res, { report, analysisStatus: 'unavailable', message: report.errorMessage }, 'PDF has no readable text.');
          return;
        }

        // Run local extraction
        const localResult = extractMeasurementsFromText(extractedText, report.category);
        const localExplanations = generateLocalExplanations(localResult.measurements);

        // Clear old measurements and analysis for this report
        await ExtractedMeasurement.deleteMany({ reportId: id });
        await ReportAnalysis.deleteMany({ reportId: id });

        let createdMeasurements: Awaited<ReturnType<typeof ExtractedMeasurement.insertMany>> = [];
        if (localResult.measurements.length > 0) {
          const measurementDocs = localResult.measurements.map((m) => ({
            reportId: report._id,
            userId: report.userId,
            testName: m.testName,
            originalTestName: m.originalTestName,
            rawValue: m.rawValue,
            numericValue: m.numericValue,
            unit: m.unit,
            referenceRangeText: m.referenceRangeText,
            referenceLow: m.referenceLow,
            referenceHigh: m.referenceHigh,
            resultFlag: m.resultFlag,
            sourcePage: m.sourcePage,
            provenance: 'text-extracted' as const,
            userConfirmed: false,
          }));
          createdMeasurements = await ExtractedMeasurement.insertMany(measurementDocs);
        }

        const createdAnalysis = await ReportAnalysis.create({
          reportId: report._id,
          userId: report.userId,
          provider: 'local-text-extraction',
          modelIdentifier: 'regex-pattern-v1',
          promptVersion: 'v1.0.0',
          status: 'completed',
          extractedSummary: localResult.extractedSummary,
          explanations: localExplanations,
          warnings: localResult.warnings,
          limitations: [
            ...localResult.limitations,
            'Extracted using local clinical rule engine and deterministic reference ranges.',
            'Review extracted values in the Extracted Values tab and verify against original lab report.',
          ],
        });

        if (localResult.demographics) {
          const d = localResult.demographics;
          if (d.patientName) report.patientName = d.patientName;
          if (d.patientGender) report.patientGender = d.patientGender;
          if (d.patientAge != null) report.patientAge = d.patientAge;
          if (d.patientDob) report.patientDob = d.patientDob;
          if (d.physicianName) report.physicianName = d.physicianName;
          if (d.laboratoryName) report.laboratoryName = d.laboratoryName;
          if (d.specimenDate && !report.reportDate) {
            const parts = d.specimenDate.split(/[./-]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              let year = parseInt(parts[2], 10);
              if (year < 100) year += year > 30 ? 1900 : 2000;
              report.reportDate = new Date(year, month, day);
            }
          }
        }

        const extractedNames = localResult.measurements.map((m) => m.testName);
        const mismatchNote = detectCategoryMismatch(report.category, extractedNames);
        report.categoryMismatchFlag = mismatchNote ?? undefined;
        report.processingStatus = 'review_required';
        report.analysisStatus = localResult.measurements.length > 0 ? 'completed' : 'unavailable';
        report.errorMessage = localResult.measurements.length === 0
          ? 'Local extraction found no recognised laboratory measurements. Add values manually or upload a text-based PDF.'
          : undefined;
        await report.save();

        const msg = localResult.measurements.length > 0
          ? `Local clinical analysis completed: ${localResult.measurements.length} measurement(s) successfully extracted. Review them in the Extracted Values tab.`
          : 'No laboratory measurements were identified by local extraction. You can add values manually.';

        logger.info(`Local extraction completed for report ${report._id}: ${localResult.measurements.length} measurements`);
        sendSuccess(res, { report, measurements: createdMeasurements, analysis: createdAnalysis }, msg);
        return;
      }

      // Image file without Gemini
      report.processingStatus = 'review_required';
      report.analysisStatus = 'unavailable';
      report.errorMessage = 'Image analysis requires GEMINI_API_KEY in the server .env. Manual entry is available.';
      await report.save();
      sendSuccess(res, { report, analysisStatus: 'unavailable', message: 'Image analysis requires a Gemini API key.' }, 'AI service unconfigured.');
      return;
    }

    try {
      const isImage = report.mimeType.startsWith('image/');
      const insufficientPdfText = report.mimeType === 'application/pdf' && extractedText.trim().length < 15;

      let aiResponse;
      let activeProvider = 'gemini';
      let activeModel = 'gemini-1.5-flash';

      if (useLlama) {
        activeProvider = 'llama';
        activeModel = llamaService.getModelName();
        if (isImage) {
          aiResponse = await llamaService.analyzeReportImage(
            fileBuffer,
            report.mimeType,
            report.category
          );
        } else if (insufficientPdfText) {
          report.processingStatus = 'review_required';
          report.analysisStatus = 'failed';
          report.errorMessage =
            pdfParseError ||
            'This PDF contains little or no extractable text (it may be a scan). Enter measurements manually, or upload a text-based PDF or a clear image of the report.';
          await report.save();
          sendError(res, report.errorMessage, 422);
          return;
        } else {
          aiResponse = await llamaService.analyzeReportText(extractedText, report.category);
        }
      } else {
        if (isImage) {
          aiResponse = await geminiService.analyzeReportImage(
            fileBuffer,
            report.mimeType,
            report.category
          );
        } else if (insufficientPdfText) {
          report.processingStatus = 'review_required';
          report.analysisStatus = 'failed';
          report.errorMessage =
            pdfParseError ||
            'This PDF contains little or no extractable text (it may be a scan). Enter measurements manually, or upload a text-based PDF or a clear image of the report.';
          await report.save();
          sendError(res, report.errorMessage, 422);
          return;
        } else {
          aiResponse = await geminiService.analyzeReportText(extractedText, report.category);
        }
      }

      // Invalidate old measurements for this report
      await ExtractedMeasurement.deleteMany({ reportId: id });
      await ReportAnalysis.deleteMany({ reportId: id });

      // Persist extracted measurements
      const measurementDocs = aiResponse.measurements.map((m) => ({
        reportId: report._id,
        userId: report.userId,
        testName: m.testName,
        originalTestName: m.originalTestName,
        rawValue: m.rawValue,
        numericValue: m.numericValue ?? null,
        unit: m.unit ?? null,
        referenceRangeText: m.referenceRangeText ?? null,
        referenceLow: m.referenceLow ?? null,
        referenceHigh: m.referenceHigh ?? null,
        resultFlag: m.resultFlag,
        sourcePage: m.sourcePage || 1,
        provenance: 'ai-extracted' as const,
        userConfirmed: false,
      }));

      const createdMeasurements = await ExtractedMeasurement.insertMany(measurementDocs);

      // Persist analysis summary and explanations
      const createdAnalysis = await ReportAnalysis.create({
        reportId: report._id,
        userId: report.userId,
        provider: activeProvider,
        modelIdentifier: activeModel,
        promptVersion: 'v1.0.0',
        status: 'completed',
        extractedSummary: aiResponse.extractedSummary,
        explanations: aiResponse.explanations,
        warnings: aiResponse.warnings,
        limitations: aiResponse.limitations,
      });

      report.processingStatus = 'review_required';
      report.analysisStatus = 'completed';
      report.errorMessage = undefined;

      // Category mismatch detection
      const extractedNames = aiResponse.measurements.map((m) => m.testName);
      const mismatchNote = detectCategoryMismatch(report.category, extractedNames);
      report.categoryMismatchFlag = mismatchNote ?? undefined;

      await report.save();

      logger.info(`AI Analysis completed for report: ${report._id}`);

      sendSuccess(
        res,
        {
          report,
          measurements: createdMeasurements,
          analysis: createdAnalysis,
        },
        'Report analysis completed successfully'
      );
    } catch (aiErr: any) {
      report.processingStatus = 'failed';
      report.analysisStatus = 'failed';
      report.errorMessage = aiErr.message || 'AI analysis failed';
      await report.save();

      sendError(res, aiErr.message || 'AI document analysis failed', 500);
    }
  } catch (error: any) {
    logger.error('Trigger analysis error', error);
    sendError(res, 'Failed to complete report analysis', 500);
  }
};

export const updateMeasurement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, measurementId } = req.params;
    const userId = req.user!._id;
    const {
      testName,
      rawValue,
      numericValue,
      unit,
      referenceRangeText,
      referenceLow,
      referenceHigh,
      resultFlag,
      notes,
    } = req.body;

    const measurement = await ExtractedMeasurement.findOne({
      _id: measurementId,
      reportId: id,
      userId,
    });

    if (!measurement) {
      sendError(res, 'Measurement not found or access denied.', 404);
      return;
    }

    if (testName !== undefined) measurement.testName = testName.trim();
    if (rawValue !== undefined) measurement.rawValue = rawValue.trim();
    if (numericValue !== undefined) measurement.numericValue = numericValue;
    if (unit !== undefined) measurement.unit = unit ? unit.trim() : null;
    if (referenceRangeText !== undefined) measurement.referenceRangeText = referenceRangeText ? referenceRangeText.trim() : null;
    if (referenceLow !== undefined) measurement.referenceLow = referenceLow;
    if (referenceHigh !== undefined) measurement.referenceHigh = referenceHigh;
    if (resultFlag !== undefined) measurement.resultFlag = resultFlag;
    if (notes !== undefined) measurement.notes = notes ? notes.trim() : undefined;

    // Track provenance as user-corrected
    measurement.provenance = 'user-corrected';
    measurement.userConfirmed = true;

    await measurement.save();
    logger.info(`Measurement updated by user: ${measurement._id}`);

    sendSuccess(res, { measurement }, 'Measurement corrected and confirmed');
  } catch (error) {
    logger.error('Update measurement error', error);
    sendError(res, 'Failed to update measurement.', 500);
  }
};

export const addMeasurement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;
    const {
      testName,
      originalTestName,
      rawValue,
      numericValue,
      unit,
      referenceRangeText,
      referenceLow,
      referenceHigh,
      resultFlag,
      notes,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid report ID', 400);
      return;
    }

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Medical report not found or access denied.', 404);
      return;
    }

    if (!testName || !rawValue) {
      sendError(res, 'Test name and printed value are required.', 400);
      return;
    }

    const measurement = await ExtractedMeasurement.create({
      reportId: report._id,
      userId,
      testName: String(testName).trim(),
      originalTestName: String(originalTestName || testName).trim(),
      rawValue: String(rawValue).trim(),
      numericValue: numericValue === '' || numericValue === undefined ? null : Number(numericValue),
      unit: unit ? String(unit).trim() : null,
      referenceRangeText: referenceRangeText ? String(referenceRangeText).trim() : null,
      referenceLow: referenceLow === '' || referenceLow === undefined ? null : Number(referenceLow),
      referenceHigh: referenceHigh === '' || referenceHigh === undefined ? null : Number(referenceHigh),
      resultFlag: resultFlag || 'unknown',
      provenance: 'user-entered',
      userConfirmed: true,
      notes: notes ? String(notes).trim() : undefined,
    });

    if (report.processingStatus === 'uploaded' || report.processingStatus === 'failed') {
      report.processingStatus = 'review_required';
      await report.save();
    }

    logger.info(`Manual measurement added for report ${report._id}`);
    sendSuccess(res, { measurement }, 'Measurement saved as user-entered', 201);
  } catch (error) {
    logger.error('Add measurement error', error);
    sendError(res, 'Failed to add measurement.', 500);
  }
};

export const confirmMeasurements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    const report = await MedicalReport.findOne({ _id: id, userId });
    if (!report) {
      sendError(res, 'Report not found or access denied.', 404);
      return;
    }

    await ExtractedMeasurement.updateMany(
      { reportId: id, userId },
      { userConfirmed: true }
    );

    report.processingStatus = 'completed';
    await report.save();

    logger.info(`All measurements confirmed for report: ${id}`);
    sendSuccess(res, { report }, 'All extracted measurements confirmed');
  } catch (error) {
    logger.error('Confirm measurements error', error);
    sendError(res, 'Failed to confirm measurements.', 500);
  }
};
