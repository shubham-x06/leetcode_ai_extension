import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  
  if (!token) {
    res.status(401).json({ error: 'No token provided', code: 'AUTH_NO_TOKEN' });
    return;
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.userId = (payload as { userId: string }).userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_INVALID_TOKEN' });
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
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.userId = (payload as { userId: string }).userId;
  } catch {
    /* ignore */
  }
  next();
}
