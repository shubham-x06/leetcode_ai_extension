import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { googleAuthBodySchema } from '../validation/schemas';
import { User, type IUser } from '../models/User';
import { verifyGoogleAccessToken, verifyGoogleIdToken } from '../services/googleAuth';
import { signUserToken } from '../services/jwt';

export const authRouter = Router();

function serializeAuthUser(u: Pick<IUser, 'name' | 'email' | 'avatarUrl' | 'leetcodeUsername'>) {
  return {
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    leetcodeUsername: u.leetcodeUsername,
  };
}

authRouter.post(
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
