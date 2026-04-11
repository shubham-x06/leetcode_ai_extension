import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody } from '../middleware/validate';
import { googleAuthBodySchema, linkLeetcodeBodySchema } from '../validation/schemas';
import { User, type IUser } from '../models/User';
import { verifyGoogleAccessToken, verifyGoogleIdToken } from '../services/googleAuth';
import { signUserToken } from '../services/jwt';
import { alfaGet } from '../services/alfaApi';

/** Public: `POST /api/auth/google` */
export const publicAuthRouter = Router();

/** Authenticated: `POST /api/auth/link-leetcode` (mounted under protected `/api`) */
export const protectedAuthRouter = Router();

function serializeAuthUser(u: Pick<IUser, 'name' | 'email' | 'avatarUrl' | 'leetcodeUsername'>) {
  return {
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    leetcodeUsername: u.leetcodeUsername,
  };
}

publicAuthRouter.post(
  '/google',
  validateBody(googleAuthBodySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { token?: string; accessToken?: string };

    let googleUser;
    try {
      googleUser = body.token
        ? await verifyGoogleIdToken(body.token)
        : await verifyGoogleAccessToken(body.accessToken!);
    } catch {
      throw new AppError(401, 'Invalid Google token', 'AUTH_INVALID_TOKEN');
    }

    let user = await User.findOne({ googleId: googleUser.sub });
    if (!user) {
      user = await User.create({
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        leetcodeUsername: null,
      });
    } else {
      user.email = googleUser.email;
      user.name = googleUser.name ?? user.name;
      user.avatarUrl = googleUser.picture ?? user.avatarUrl;
      await user.save();
    }

    const token = signUserToken(user._id);
    res.json({
      token,
      needsLeetCodeLink: !user.leetcodeUsername,
      user: serializeAuthUser(user),
    });
  })
);

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
