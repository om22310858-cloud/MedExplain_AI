import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { MedicalReport } from '../models/MedicalReport.js';
import { ExtractedMeasurement } from '../models/ExtractedMeasurement.js';
import { ReportAnalysis } from '../models/ReportAnalysis.js';
import { RiskAssessment } from '../models/RiskAssessment.js';
import { WhatIfScenario } from '../models/WhatIfScenario.js';
import { ReportComparison } from '../models/ReportComparison.js';
import { storageService } from '../services/storage/localStorageAdapter.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { name, themePreference, profile } = req.body;

    if (name) user.name = name.trim();
    if (themePreference) user.themePreference = themePreference;

    if (profile) {
      user.profile = {
        ...user.profile,
        ...(profile.age !== undefined && { age: profile.age }),
        ...(profile.gender !== undefined && { gender: profile.gender }),
        ...(profile.bloodGroup !== undefined && { bloodGroup: profile.bloodGroup }),
        ...(profile.phone !== undefined && { phone: profile.phone }),
      };
    }

    await user.save();
    logger.info(`Profile updated for user: ${user._id}`);
    sendSuccess(res, { user: user.toJSON() }, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error', error);
    sendError(res, 'Failed to update profile.', 500);
  }
};

export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;

    // 1. Find all reports owned by the user and clean up physical storage
    const reports = await MedicalReport.find({ userId });
    for (const report of reports) {
      try {
        await storageService.deleteFile(report.privateStorageKey);
      } catch (err) {
        logger.warn(`Failed to delete physical file during account wipe: ${report.privateStorageKey}`);
      }
    }

    // 2. Cascade delete all associated records
    await Promise.all([
      MedicalReport.deleteMany({ userId }),
      ExtractedMeasurement.deleteMany({ userId }),
      ReportAnalysis.deleteMany({ userId }),
      RiskAssessment.deleteMany({ userId }),
      WhatIfScenario.deleteMany({ userId }),
      ReportComparison.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.clearCookie('token');
    logger.info(`Account deleted permanently: ${userId}`);
    sendSuccess(res, null, 'Account and all associated records deleted permanently');
  } catch (error) {
    logger.error('Delete account error', error);
    sendError(res, 'Failed to delete account.', 500);
  }
};
