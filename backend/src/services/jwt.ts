import jwt from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { env } from '../config/env';

const SEVEN_DAYS = '7d';

export interface JwtPayload {
  sub: string;
}

export function signUserToken(userId: Types.ObjectId | string): string {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: SEVEN_DAYS });
}

export function verifyUserToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
  if (!decoded?.sub) throw new Error('Invalid token payload');
  return decoded;
}
