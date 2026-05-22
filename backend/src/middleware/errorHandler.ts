import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
  code?:       string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const code       = err.code ?? err.name ?? 'INTERNAL_ERROR';
  const message    = err.message || 'An unexpected error occurred';

  if (statusCode >= 500) {
    logger.error('Unhandled error:', err);
  } else {
    logger.warn(`Client error [${code}]:`, message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
}
