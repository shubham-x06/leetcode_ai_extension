import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { linkLeetcodeBodySchema } from '../validation/schemas';
import { User } from '../models/User';
import { alfaGet } from '../services/alfaClient';

/**
 * Authenticated routes still under `/api/auth/*` (e.g. link LeetCode).
 */
export const protectedAuthRouter = Router();

protectedAuthRouter.post(
  '/link-leetcode',
  validateBody(linkLeetcodeBodySchema),
  asyncHandler(async (req, res) => {
    const { leetcodeUsername } = req.body as { leetcodeUsername: string };
    const username = leetcodeUsername.trim();

    try {
      await alfaGet(`/${encodeURIComponent(username)}/profile`);
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === 'PRIVATE_PROFILE') {
        throw new AppError(404, 'LeetCode username not found', 'LEETCODE_USER_NOT_FOUND');
      }
      const msg = err.message || '';
      if (msg.includes('404') || msg.includes('HTTP 404')) {
        throw new AppError(404, 'LeetCode username not found', 'LEETCODE_USER_NOT_FOUND');
      }
      throw new AppError(502, 'Could not verify LeetCode username', 'ALFA_ERROR');
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    user.leetcodeUsername = username;
    await user.save();

    res.json({ success: true, leetcodeUsername: username });
  })
);
