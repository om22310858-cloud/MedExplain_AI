import { Request, Response, NextFunction } from 'express';
import { getDbStatus } from '../config/db.js';
import { sendError } from '../utils/response.js';

export const requireDatabase = (_req: Request, res: Response, next: NextFunction): void => {
  const status = getDbStatus();
  if (!status.connected) {
    sendError(
      res,
      'Database is unavailable. Start MongoDB locally, or set MONGODB_URI in .env to a MongoDB Atlas connection string. Registration, login, and medical records cannot be used until the database is connected.',
      503
    );
    return;
  }
  next();
};
