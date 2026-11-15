import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MedicalReport } from '../models/MedicalReport.js';
import { ExtractedMeasurement } from '../models/ExtractedMeasurement.js';
import { ReportComparison } from '../models/ReportComparison.js';
import { comparisonService } from '../services/comparison/comparisonService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const createComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { olderReportId, newerReportId } = req.body;

    if (!olderReportId || !newerReportId) {
      sendError(res, 'Both olderReportId and newerReportId are required.', 400);
      return;
    }

    if (olderReportId === newerReportId) {
      sendError(res, 'Cannot compare a report to itself. Please select two distinct reports.', 400);
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(olderReportId) ||
      !mongoose.Types.ObjectId.isValid(newerReportId)
    ) {
      sendError(res, 'Invalid report ID format provided.', 400);
      return;
    }

    const [olderReport, newerReport] = await Promise.all([
      MedicalReport.findOne({ _id: olderReportId, userId }),
      MedicalReport.findOne({ _id: newerReportId, userId }),
    ]);

    if (!olderReport || !newerReport) {
      sendError(res, 'One or both selected reports were not found or access is denied.', 404);
      return;
    }

    const [olderMeasurements, newerMeasurements] = await Promise.all([
      ExtractedMeasurement.find({ reportId: olderReportId, userId }),
      ExtractedMeasurement.find({ reportId: newerReportId, userId }),
    ]);

    if (olderMeasurements.length === 0 || newerMeasurements.length === 0) {
      sendError(
        res,
        'One or both reports do not have extracted laboratory measurements to compare.',
        422
      );
      return;
    }

    const comparisonResult = comparisonService.compareReports(
      olderReport,
      olderMeasurements,
      newerReport,
      newerMeasurements
    );

    const comparison = await ReportComparison.findOneAndUpdate(
      { userId, olderReportId, newerReportId },
      {
        userId,
        olderReportId,
        newerReportId,
        matchedMeasurements: comparisonResult.matchedMeasurements,
        comparisonSummary: comparisonResult.summary,
      },
      { upsert: true, new: true }
    )
      .populate('olderReportId', 'title reportDate category originalFilename')
      .populate('newerReportId', 'title reportDate category originalFilename');

    logger.info(`Report comparison generated: ${comparison._id}`);

    sendSuccess(res, { comparison }, 'Comparison generated successfully', 201);
  } catch (error) {
    logger.error('Create comparison error', error);
    sendError(res, 'Failed to compare reports.', 500);
  }
};

export const getComparisons = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const comparisons = await ReportComparison.find({ userId })
      .populate('olderReportId', 'title reportDate category originalFilename')
      .populate('newerReportId', 'title reportDate category originalFilename')
      .sort({ createdAt: -1 });

    sendSuccess(res, { comparisons }, 'Comparisons retrieved');
  } catch (error) {
    logger.error('Get comparisons error', error);
    sendError(res, 'Failed to fetch comparisons.', 500);
  }
};

export const getComparisonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid comparison ID', 400);
      return;
    }

    const comparison = await ReportComparison.findOne({ _id: id, userId })
      .populate('olderReportId')
      .populate('newerReportId');

    if (!comparison) {
      sendError(res, 'Comparison record not found or access denied.', 404);
      return;
    }

    sendSuccess(res, { comparison });
  } catch (error) {
    logger.error('Get comparison by ID error', error);
    sendError(res, 'Failed to fetch comparison.', 500);
  }
};

export const deleteComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendError(res, 'Invalid comparison ID', 400);
      return;
    }

    const deleted = await ReportComparison.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      sendError(res, 'Comparison not found or access denied.', 404);
      return;
    }

    sendSuccess(res, null, 'Comparison record deleted successfully');
  } catch (error) {
    logger.error('Delete comparison error', error);
    sendError(res, 'Failed to delete comparison.', 500);
  }
};
