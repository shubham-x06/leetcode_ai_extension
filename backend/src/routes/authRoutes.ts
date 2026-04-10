import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { googleAuthBodySchema } from '../validation/schemas';
import { User } from '../models/User';
import { verifyGoogleAccessToken } from '../services/googleAuth';
import { signUserToken } from '../services/jwt';

export const authRouter = Router();

authRouter.post(
  '/google',
  validateBody(googleAuthBodySchema),
  asyncHandler(async (req, res) => {
    const { accessToken } = req.body as { accessToken: string };

    let googleUser;
    try {
      googleUser = await verifyGoogleAccessToken(accessToken);
    } catch {
      throw new AppError(401, 'Google token invalid or revoked', 'GOOGLE_AUTH_FAILED');
    }

    let user = await User.findOne({ googleId: googleUser.sub });
    if (!user) {
      user = await User.create({
        googleId: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });
    } else {
      user.email = googleUser.email;
      user.name = googleUser.name ?? user.name;
      user.picture = googleUser.picture ?? user.picture;
      await user.save();
    }

    const token = signUserToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        leetcodeUsername: user.leetcodeUsername,
        preferredLanguage: user.preferredLanguage,
        targetDifficulty: user.targetDifficulty,
        dailyGoal: user.dailyGoal,
        theme: user.theme,
      },
    });
  })
);
