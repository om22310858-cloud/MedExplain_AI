import { Request, Response } from 'express';
import { MedicalReport } from '../models/MedicalReport.js';
import { ExtractedMeasurement } from '../models/ExtractedMeasurement.js';
import { ReportAnalysis } from '../models/ReportAnalysis.js';
import { ReportComparison } from '../models/ReportComparison.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    const [
      totalReports,
      recentReports,
      totalAnalyses,
      totalMeasurements,
      totalComparisons,
      totalRiskAssessments,
      categoryCounts,
    ] = await Promise.all([
      MedicalReport.countDocuments({ userId }),
      MedicalReport.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      ReportAnalysis.countDocuments({ userId, status: 'completed' }),
      ExtractedMeasurement.countDocuments({ userId }),
      ReportComparison.countDocuments({ userId }),
      RiskAssessment.countDocuments({ userId, isEligible: true }),
      MedicalReport.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    const formattedCategoryCounts: Record<string, number> = {
      thyroid: 0,
      cardiovascular: 0,
      blood_cbc: 0,
      diabetes: 0,
      kidney: 0,
      general: 0,
    };

    categoryCounts.forEach((c) => {
      if (c._id) {
        formattedCategoryCounts[c._id] = c.count;
      }
    });

    sendSuccess(
      res,
      {
        totalReports,
        totalAnalyses,
        totalMeasurements,
        totalComparisons,
        totalRiskAssessments,
        recentReports,
        categoryCounts: formattedCategoryCounts,
      },
      'Dashboard stats loaded'
    );
  } catch (error) {
    logger.error('Dashboard stats error', error);
    sendError(res, 'Failed to fetch dashboard statistics.', 500);
  }
};
