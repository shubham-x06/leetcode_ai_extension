import { Router } from 'express';
import type { Types } from 'mongoose';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody } from '../middleware/validate';
import {
  bookmarkCreateSchema,
  preferencesPatchSchema,
} from '../validation/schemas';
import { User, normalizeBookmarkDifficulty } from '../models/User';
import { alfaGet } from '../services/alfaApi';
import { parseSubmissionCalendarMap, streaksFromCalendarMap } from '../lib/computeStreaks';
import { extractWeakestTopicsByProblemsSolved } from '../lib/computeWeakTopics';

export const userRouter = Router();

async function requireLeetcodeUsername(userId: Types.ObjectId): Promise<string> {
  const u = await User.findById(userId).lean();
  const n = u?.leetcodeUsername?.trim();
  if (!n) {
    throw new AppError(400, 'Set your LeetCode username in settings.', 'NO_LC_USER');
  }
  return n;
}

function serializeMe(user: import('mongoose').HydratedDocument<import('../models/User').IUser>) {
  return {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    leetcodeUsername: user.leetcodeUsername,
    preferences: user.preferences,
    bookmarkedProblems: user.bookmarkedProblems,
    cachedWeakTopics: user.cachedWeakTopics,
  };
}

userRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    res.json(serializeMe(user));
  })
);

userRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId!);
    const u = encodeURIComponent(username);
    const [profile, solved, skill, language] = await Promise.all([
      alfaGet(`/${u}/profile`),
      alfaGet(`/${u}/solved`),
      alfaGet(`/${u}/skill`),
      alfaGet(`/${u}/language`),
    ]);

    res.json({
      profile: profile.data,
      solved: solved.data,
      skills: skill.data,
      languages: language.data,
    });

    const weak = extractWeakestTopicsByProblemsSolved(skill.data, 3);
    if (weak.length) {
      void User.findByIdAndUpdate(req.userId, { cachedWeakTopics: weak }).catch(() => {});
    }
  })
);

userRouter.get(
  '/calendar',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId!);
    const year =
      typeof req.query.year === 'string' && req.query.year
        ? req.query.year
        : String(new Date().getUTCFullYear());
    const u = encodeURIComponent(username);
    const { data } = await alfaGet(`/${u}/calendar?year=${encodeURIComponent(year)}`);

    let submissionCalendar = '';
    const root = data as Record<string, unknown>;
    const rawCal =
      typeof root?.submissionCalendar === 'string'
        ? root.submissionCalendar
        : typeof data === 'string'
          ? data
          : JSON.stringify(data ?? {});
    submissionCalendar = typeof rawCal === 'string' ? rawCal : JSON.stringify(rawCal);

    const map = parseSubmissionCalendarMap(data);
    const { current, longest, totalActiveDays } = streaksFromCalendarMap(map);

    res.json({
      submissionCalendar,
      streak: current,
      longestStreak: longest,
      totalActiveDays,
    });
  })
);

userRouter.get(
  '/contest',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId!);
    const u = encodeURIComponent(username);
    const [contest, history] = await Promise.all([
      alfaGet(`/${u}/contest`),
      alfaGet(`/${u}/contest/history`),
    ]);

    const unwrap = (payload: unknown): unknown => {
      if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
        return (payload as { data: unknown }).data;
      }
      return payload;
    };

    let contestDetails = unwrap(contest.data) as Record<string, unknown>;
    if (contestDetails && typeof contestDetails === 'object' && 'data' in contestDetails) {
      contestDetails = contestDetails.data as Record<string, unknown>;
    }

    let contestHistory = unwrap(history.data);
    if (!Array.isArray(contestHistory) && contestHistory && typeof contestHistory === 'object') {
      const h = contestHistory as Record<string, unknown>;
      contestHistory = (h.contestHistory as unknown[]) || (h.data as unknown[]) || [];
    }
    if (!Array.isArray(contestHistory)) {
      contestHistory = [];
    }

    res.json({
      contestDetails: contestDetails ?? {},
      contestHistory,
    });
  })
);

userRouter.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId!);
    const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 10;
    const limit = Number.isFinite(rawLimit) ? Math.min(20, Math.max(1, Math.floor(rawLimit))) : 10;
    const u = encodeURIComponent(username);
    const { data } = await alfaGet(`/${u}/acSubmission?limit=${limit}`, { ttlSeconds: 300 });

    const rows: unknown[] = [];
    const visit = (node: unknown, depth = 0): void => {
      if (depth > 22 || node == null) return;
      if (Array.isArray(node)) {
        node.forEach((x) => visit(x, depth + 1));
        return;
      }
      if (typeof node !== 'object') return;
      const o = node as Record<string, unknown>;
      if (typeof o.title === 'string' && typeof o.titleSlug === 'string') {
        rows.push({
          title: o.title,
          titleSlug: o.titleSlug,
          timestamp: String(o.timestamp ?? o.date ?? ''),
          statusDisplay: typeof o.statusDisplay === 'string' ? o.statusDisplay : 'Accepted',
          lang: typeof o.lang === 'string' ? o.lang : typeof o.language === 'string' ? o.language : '',
        });
      }
      for (const v of Object.values(o)) visit(v, depth + 1);
    };
    visit(data);

    const submissions = rows.slice(0, limit) as Array<{
      title: string;
      titleSlug: string;
      timestamp: string;
      statusDisplay: string;
      lang: string;
    }>;

    res.json({ submissions });
  })
);

userRouter.patch(
  '/preferences',
  validateBody(preferencesPatchSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    const b = req.body as Partial<{
      targetDifficulty: string;
      dailyGoalCount: number;
      preferredLanguage: string;
      theme: string;
    }>;
    if (b.targetDifficulty) user.preferences.targetDifficulty = b.targetDifficulty as never;
    if (typeof b.dailyGoalCount === 'number') user.preferences.dailyGoalCount = b.dailyGoalCount;
    if (typeof b.preferredLanguage === 'string') user.preferences.preferredLanguage = b.preferredLanguage;
    if (b.theme) user.preferences.theme = b.theme as never;
    await user.save();
    res.json({ success: true, preferences: user.preferences });
  })
);

userRouter.post(
  '/bookmarks',
  validateBody(bookmarkCreateSchema),
  asyncHandler(async (req, res) => {
    const { titleSlug, title, difficulty } = req.body as {
      titleSlug: string;
      title: string;
      difficulty: string;
    };
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    const exists = user.bookmarkedProblems.some((b) => b.titleSlug === titleSlug);
    if (exists) {
      throw new AppError(409, 'Already bookmarked', 'ALREADY_BOOKMARKED');
    }
    user.bookmarkedProblems.push({
      titleSlug,
      title,
      difficulty: normalizeBookmarkDifficulty(difficulty),
      addedAt: new Date(),
    });
    await user.save();
    res.json({ success: true });
  })
);

userRouter.delete(
  '/bookmarks/:titleSlug',
  asyncHandler(async (req, res) => {
    const slug = req.params.titleSlug;
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    user.bookmarkedProblems = user.bookmarkedProblems.filter((b) => b.titleSlug !== slug);
    await user.save();
    res.json({ success: true });
  })
);
