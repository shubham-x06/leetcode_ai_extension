import { Router } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { AppError } from '../errors/AppError';
import { User, IUser } from '../models/User';
import { signUserToken } from '../services/jwt';
import { asyncHandler } from '../lib/asyncHandler';

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

/** Verify a LeetCode username exists using LeetCode's own public GraphQL API */
async function verifyLeetCodeUsername(username: string): Promise<boolean> {
  try {
    const res = await axios.post(
      'https://leetcode.com/graphql',
      {
        query: `query { matchedUser(username: "${username}") { username } }`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://leetcode.com',
        },
        timeout: 8000,
      }
    );
    return !!res.data?.data?.matchedUser?.username;
  } catch {
    // If LeetCode API is unreachable, assume the username is valid to avoid blocking users
    return true;
  }
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

    const exists = await verifyLeetCodeUsername(leetcodeUsername);
    if (!exists) {
      throw new AppError(404, 'LeetCode username not found. Please check and try again.', 'LEETCODE_USER_NOT_FOUND');
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    
    user.leetcodeUsername = leetcodeUsername;
    await user.save();

    res.json({ success: true, leetcodeUsername });
  })
);
