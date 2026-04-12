import { Router, Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { User } from '../models/User';
import {
  getUserProfile,
  getUserSolved,
  getUserSkills,
  getUserLanguages,
  getUserCalendar,
  getUserContest,
  getUserSubmissions,
  getUserProgress,
  LeetCodeError,
} from '../services/leetcodeGraphql';
import { computeStreaks } from '../lib/computeStreaks';
import { computeWeakTopics } from '../lib/computeWeakTopics';

const router = Router();

// GET /api/user/me
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId).select('-__v -googleId');
  if (!user) {
    return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
  }
  return res.json(user);
}));

// GET /api/user/stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user?.leetcodeUsername) {
    return res.status(400).json({ error: 'LeetCode username not linked', code: 'NO_LEETCODE_USERNAME' });
  }

  const username = user.leetcodeUsername;

  // Fetch all in parallel — no sequential waterfall
  const [profile, solved, skills, languages, progress] = await Promise.all([
    getUserProfile(username),
    getUserSolved(username),
    getUserSkills(username),
    getUserLanguages(username),
    getUserProgress(username),
  ]);

  // Update cachedWeakTopics asynchronously — do not await
  const weakTopics = computeWeakTopics(skills);
  User.findByIdAndUpdate(req.userId, { cachedWeakTopics: weakTopics }).catch(() => {});

  return res.json({ profile, solved, skills, languages, progress });
}));

// GET /api/user/calendar
router.get('/calendar', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user?.leetcodeUsername) {
    return res.status(400).json({ error: 'LeetCode username not linked', code: 'NO_LEETCODE_USERNAME' });
  }

  const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
  const calendar = await getUserCalendar(user.leetcodeUsername, year);
  const streaks = computeStreaks(calendar.submissionCalendar);

  return res.json({ ...calendar, ...streaks });
}));

// GET /api/user/contest
router.get('/contest', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user?.leetcodeUsername) {
    return res.status(400).json({ error: 'LeetCode username not linked', code: 'NO_LEETCODE_USERNAME' });
  }

  const result = await getUserContest(user.leetcodeUsername);
  return res.json(result);
}));

// GET /api/user/submissions
router.get('/submissions', asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user?.leetcodeUsername) {
    return res.status(400).json({ error: 'LeetCode username not linked', code: 'NO_LEETCODE_USERNAME' });
  }

  const rawLimit = parseInt(req.query.limit as string, 10);
  const limit = isNaN(rawLimit) ? 10 : Math.min(rawLimit, 20);

  const submissions = await getUserSubmissions(user.leetcodeUsername, limit);
  return res.json({ submissions });
}));

// PATCH /api/user/preferences
router.patch('/preferences', asyncHandler(async (req: Request, res: Response) => {
  const allowed = ['targetDifficulty', 'dailyGoalCount', 'preferredLanguage', 'theme'];
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[`preferences.${key}`] = req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid preference fields provided', code: 'NO_FIELDS' });
  }

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.json({ success: true, preferences: user?.preferences });
}));

// POST /api/user/bookmarks
router.post('/bookmarks', asyncHandler(async (req: Request, res: Response) => {
  const { titleSlug, title, difficulty } = req.body;

  if (!titleSlug || !title || !difficulty) {
    return res.status(400).json({ error: 'titleSlug, title, and difficulty are required', code: 'MISSING_FIELDS' });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });

  const alreadyBookmarked = user.bookmarkedProblems.some(b => b.titleSlug === titleSlug);
  if (alreadyBookmarked) {
    return res.status(409).json({ error: 'Already bookmarked', code: 'ALREADY_BOOKMARKED' });
  }

  user.bookmarkedProblems.push({ titleSlug, title, difficulty, addedAt: new Date() });
  await user.save();

  return res.json({ success: true });
}));

// DELETE /api/user/bookmarks/:titleSlug
router.delete('/bookmarks/:titleSlug', asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(req.userId, {
    $pull: { bookmarkedProblems: { titleSlug: req.params.titleSlug } },
  });
  return res.json({ success: true });
}));

export const userRouter = router;
