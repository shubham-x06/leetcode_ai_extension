import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { User, normalizeBookmarkDifficulty } from '../models/User';
import {
  getUserProfile,
  getUserSolved,
  getUserSkills,
  getUserLanguages,
  getUserCalendar,
  getUserContest,
  getUserContestHistory,
  getUserSubmissions
} from '../services/alfaApi';
import { computeStreaks } from '../lib/computeStreaks';
import { computeWeakTopics } from '../lib/computeWeakTopics';

export const userRouter = Router();

async function requireLeetcodeUsername(userId: string): Promise<string> {
  const u = await User.findById(userId).lean();
  const n = u?.leetcodeUsername?.trim();
  if (!n) {
    throw new AppError(400, 'Set your LeetCode username in settings.', 'NO_LC_USER');
  }
  return n;
}

userRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).select('-__v -googleId -_id');
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    res.json(user);
  })
);

userRouter.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId);
    const [profile, solved, skill, language] = await Promise.all([
      getUserProfile(username),
      getUserSolved(username),
      getUserSkills(username),
      getUserLanguages(username),
    ]);

    res.json({
      profile,
      solved,
      skills: skill,
      languages: language,
    });

    const weak = computeWeakTopics(skill);
    if (weak.length) {
      User.findByIdAndUpdate(req.userId, { cachedWeakTopics: weak }).catch(() => {});
    }
  })
);

userRouter.get(
  '/calendar',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId);
    const year = typeof req.query.year === 'string' && req.query.year ? req.query.year : '';
    const data = await getUserCalendar(username, year);

    let submissionCalendarJson = '';
    if (data.submissionCalendar) {
      submissionCalendarJson = typeof data.submissionCalendar === 'string' ? data.submissionCalendar : JSON.stringify(data.submissionCalendar);
    } else {
      submissionCalendarJson = JSON.stringify(data);
    }

    const streakData = computeStreaks(submissionCalendarJson);

    res.json({
      submissionCalendar: submissionCalendarJson,
      ...streakData
    });
  })
);

userRouter.get(
  '/contest',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId);
    const [contestDetails, history] = await Promise.all([
      getUserContest(username),
      getUserContestHistory(username),
    ]);

    let contestHistory = history;
    if (history.contestHistory) {
      contestHistory = history.contestHistory;
    } else if (history.data) {
      contestHistory = history.data;
    }
    if (!Array.isArray(contestHistory)) {
      contestHistory = [];
    }

    res.json({
      contestDetails: contestDetails || {},
      contestHistory,
    });
  })
);

userRouter.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req.userId);
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
    const data = await getUserSubmissions(username, limit);

    const rows: unknown[] = [];
    const visit = (node: unknown, depth = 0): void => {
      if (depth > 20 || node == null) return;
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

    res.json({ submissions: rows.slice(0, limit) });
  })
);

userRouter.patch(
  '/preferences',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      targetDifficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).optional(),
      dailyGoalCount: z.number().min(1).max(5).optional(),
      preferredLanguage: z.string().optional(),
      theme: z.enum(['light', 'dark']).optional(),
    });
    const parsed = schema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    user.preferences = {
      ...user.preferences,
      ...parsed
    };
    await user.save();
    
    res.json({ success: true, preferences: user.preferences });
  })
);

userRouter.post(
  '/bookmarks',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      titleSlug: z.string().min(1),
      title: z.string().min(1),
      difficulty: z.string().min(1)
    });
    const { titleSlug, title, difficulty } = schema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    if (user.bookmarkedProblems.some((b) => b.titleSlug === titleSlug)) {
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
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    user.bookmarkedProblems = user.bookmarkedProblems.filter((b) => b.titleSlug !== slug);
    await user.save();
    res.json({ success: true });
  })
);
