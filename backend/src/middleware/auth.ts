import { Request, Response, NextFunction } from 'express';
import { verifyUserToken } from '../services/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  
  if (!token) {
    res.status(401).json({ error: 'No token provided', code: 'AUTH_NO_TOKEN' });
    return;
  }
  
  try {
    const payload = verifyUserToken(token);
    req.userId = payload.userId;
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
    const payload = verifyUserToken(token);
    req.userId = payload.userId;
  } catch {
    /* ignore */
  }
  next();
}
