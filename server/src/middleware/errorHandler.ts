import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled Server Error', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'File size exceeds maximum allowed limit of 10MB.', 400);
      return;
    }
    sendError(res, `Upload error: ${err.message}`, 400);
    return;
  }

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const message = ENV.IS_PRODUCTION && statusCode === 500
    ? 'An unexpected internal server error occurred.'
    : err.message || 'Internal Server Error';

  sendError(res, message, statusCode);
};
