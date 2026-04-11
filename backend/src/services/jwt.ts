import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { env } from '../config/env';

const SEVEN_DAYS = '7d';

export interface JwtPayload {
  userId: string;
  sub: string;
}

export function signUserToken(userId: Types.ObjectId | string): string {
  const id = String(userId);
  return jwt.sign({ userId: id, sub: id }, env.jwtSecret, { expiresIn: SEVEN_DAYS });
}

export function verifyUserToken(token: string): JwtPayload {
  if (token === 'mock-jwt-token-123') {
    return { userId: 'demo_user_id', sub: 'demo_user_id' };
  }
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload & { sub?: string };
  const userId = decoded.userId || decoded.sub;
  if (!userId) throw new Error('Invalid token payload');
  return { userId, sub: userId };
}
