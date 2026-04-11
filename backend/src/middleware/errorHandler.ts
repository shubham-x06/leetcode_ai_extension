import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (res.headersSent) {
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(process.env.NODE_ENV !== 'production' && err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => {
      const path = e.path.length ? e.path.join('.') : 'body';
      return `${path}: ${e.message}`;
    });
    res.status(400).json({
      error: 'Validation failed',
      details,
    });
    return;
  }

  const status = typeof (err as { status?: number }).status === 'number' ? (err as { status: number }).status : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', { status, message, stack: err instanceof Error ? err.stack : undefined });
  } else {
    console.error('[error]', { status, code: (err as { code?: string }).code });
  }

  res.status(status >= 400 && status < 600 ? status : 500).json({
    error: status === 500 ? 'Internal server error' : message,
    code: 'INTERNAL_ERROR',
  });
};
