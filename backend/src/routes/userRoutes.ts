import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { patchUserBodySchema } from '../validation/schemas';
import { User, type TargetDifficulty, type ThemePreference } from '../models/User';
import { getWeakTopicsForUser } from '../services/userContext';
import { alfaGet } from '../services/alfaClient';

export const userRouter = Router();

function attachStale(res: import('express').Response, stale: boolean, reason?: string): void {
  if (stale) {
    res.setHeader('X-Data-Stale', 'true');
    if (reason) res.setHeader('X-Data-Stale-Reason', reason);
  }
}

userRouter.get(
  '/me/context',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    const weakTopics = await getWeakTopicsForUser(req.userId!);
    res.json({
      leetcodeUsername: user.leetcodeUsername,
      weakTopics,
    });
  })
);

userRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      leetcodeUsername: user.leetcodeUsername,
      preferredLanguage: user.preferredLanguage,
      targetDifficulty: user.targetDifficulty,
      dailyGoal: user.dailyGoal,
      theme: user.theme,
    });
  })
);

/** Merged Alfa profile + solved + skill + language (parallel fetch). */
userRouter.get(
  '/me/stats',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).lean();
    if (!user?.leetcodeUsername?.trim()) {
      throw new AppError(400, 'Set your LeetCode username in settings.', 'NO_LC_USER');
    }
    const u = encodeURIComponent(user.leetcodeUsername.trim());
    const [profile, solved, skill, language] = await Promise.all([
      alfaGet(`/${u}/profile`),
      alfaGet(`/${u}/solved`),
      alfaGet(`/${u}/skill`),
      alfaGet(`/${u}/language`),
    ]);
    const stale = profile.stale || solved.stale || skill.stale || language.stale;
    const staleReason = profile.staleReason || solved.staleReason;
    attachStale(res, stale, staleReason);
    res.json({
      profile: profile.data,
      solved: solved.data,
      skill: skill.data,
      language: language.data,
      meta: { stale, staleReason },
    });
  })
);

userRouter.get(
  '/me/calendar',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).lean();
    if (!user?.leetcodeUsername?.trim()) {
      throw new AppError(400, 'Set your LeetCode username in settings.', 'NO_LC_USER');
    }
    const year =
      typeof req.query.year === 'string' ? req.query.year : String(new Date().getFullYear());
    const u = encodeURIComponent(user.leetcodeUsername.trim());
    const { data, stale, staleReason } = await alfaGet(
      `/${u}/calendar?year=${encodeURIComponent(year)}`
    );
    attachStale(res, stale, staleReason);
    res.json({ data, meta: { stale, staleReason } });
  })
);

userRouter.patch(
  '/me',
  validateBody(patchUserBodySchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    const b = req.body as {
      leetcodeUsername?: string;
      preferredLanguage?: string;
      targetDifficulty?: TargetDifficulty;
      dailyGoal?: number;
      theme?: ThemePreference;
    };

    if (typeof b.leetcodeUsername === 'string') {
      user.leetcodeUsername = b.leetcodeUsername.trim() || undefined;
    }
    if (typeof b.preferredLanguage === 'string') {
      user.preferredLanguage = b.preferredLanguage;
    }
    if (b.targetDifficulty) {
      user.targetDifficulty = b.targetDifficulty;
    }
    if (typeof b.dailyGoal === 'number') {
      user.dailyGoal = b.dailyGoal;
    }
    if (b.theme) {
      user.theme = b.theme;
    }

    await user.save();
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      leetcodeUsername: user.leetcodeUsername,
      preferredLanguage: user.preferredLanguage,
      targetDifficulty: user.targetDifficulty,
      dailyGoal: user.dailyGoal,
      theme: user.theme,
    });
  })
);
