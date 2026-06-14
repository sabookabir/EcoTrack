import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errorDetails = err.details || err.stack || '';

  logger.error(`${req.method} ${req.url} - Status: ${statusCode} - Error: ${message}`);

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
    message,
  });
};
