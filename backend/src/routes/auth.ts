import { Router } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../errors/AppError';
import { User, IUser } from '../models/User';
import { signUserToken } from '../services/jwt';
import { asyncHandler } from '../lib/asyncHandler';
import { getUserProfile, LeetCodeError } from '../services/leetcodeGraphql';


export const publicAuthRouter = Router();
export const protectedAuthRouter = Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  asyncHandler(async (req, res) => {
    const schema = z.object({ token: z.string().min(1) });
    const { token } = schema.parse(req.body);

    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new AppError(401, 'Invalid Google token', 'AUTH_INVALID_TOKEN');
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.name) {
      throw new AppError(401, 'Invalid Google profile info', 'AUTH_INVALID_PROFILE');
    }

    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.create({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        avatarUrl: payload.picture || '',
        leetcodeUsername: null,
      });
    } else {
      user.email = payload.email;
      user.name = payload.name;
      if (payload.picture) {
        user.avatarUrl = payload.picture;
      }
      await user.save();
    }

    const jwtToken = signUserToken(user._id);
    res.json({
      token: jwtToken,
      needsLeetCodeLink: !user.leetcodeUsername,
      user: serializeAuthUser(user),
    });
  })
);

protectedAuthRouter.post(
  '/link-leetcode',
  asyncHandler(async (req, res) => {
    const schema = z.object({ leetcodeUsername: z.string().min(1).max(35).regex(/^[a-zA-Z0-9_-]+$/) });
    const { leetcodeUsername } = schema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    try {
      await getUserProfile(leetcodeUsername);
    } catch (error) {
      if (error instanceof LeetCodeError && error.code === 'USER_NOT_FOUND') {
        return res.status(404).json({
          error: 'LeetCode username not found or profile is private. Make sure your LeetCode profile is set to public.',
          code: 'LEETCODE_USER_NOT_FOUND',
        });
      }
      throw error;
    }
    
    user.leetcodeUsername = leetcodeUsername;
    await user.save();

    res.json({ success: true, leetcodeUsername });
  })
);

protectedAuthRouter.post(
  '/unlink-leetcode',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    user.leetcodeUsername = null;
    user.cachedWeakTopics = [];
    await user.save();

    res.json({ success: true, message: 'LeetCode account unlinked successfully' });
  })
);
