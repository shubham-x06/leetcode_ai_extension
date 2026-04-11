import type { Types } from 'mongoose';

export {};

declare global {
  namespace Express {
    interface Request {
      userId?: Types.ObjectId;
    }
  }
}
