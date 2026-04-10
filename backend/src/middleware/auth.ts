import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyUserToken } from '../services/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });
    return;
  }
  try {
    const { sub } = verifyUserToken(token);
    if (!mongoose.Types.ObjectId.isValid(sub)) {
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }
    req.userId = new mongoose.Types.ObjectId(sub);
    next();
  } catch {
    res.status(401).json({ error: 'Token expired or invalid', code: 'JWT_INVALID' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    next();
    return;
  }
  try {
    const { sub } = verifyUserToken(token);
    if (mongoose.Types.ObjectId.isValid(sub)) {
      req.userId = new mongoose.Types.ObjectId(sub);
    }
  } catch {
    /* ignore */
  }
  next();
}
