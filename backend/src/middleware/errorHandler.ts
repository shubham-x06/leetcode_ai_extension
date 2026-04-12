import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Zod validation errors
  if ((err as any).name === 'ZodError') {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: (err as any).errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`),
    });
    return;
  }

  // LeetCode GraphQL errors
  if ((err as any).name === 'LeetCodeError') {
    const statusCode = (err as any).statusCode || 502;
    res.status(statusCode).json({
      error: err.message,
      code: (err as any).code || 'LEETCODE_ERROR',
    });
    return;
  }

  // Mongoose validation errors
  if ((err as any).name === 'ValidationError') {
    res.status(400).json({
      error: err.message,
      code: 'DB_VALIDATION_ERROR',
    });
    return;
  }

  // Unknown errors — never expose stack traces
  console.error('[ErrorHandler] Unhandled error:', err.message);
  res.status(500).json({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
}
