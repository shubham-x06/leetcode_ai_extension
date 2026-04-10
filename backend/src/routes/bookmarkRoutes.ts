import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import { bookmarkCreateSchema } from '../validation/schemas';
import { User } from '../models/User';

export const bookmarkRouter = Router();

bookmarkRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    res.json({ bookmarks: user.bookmarks || [] });
  })
);

bookmarkRouter.post(
  '/',
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
    const exists = user.bookmarks.some((b) => b.titleSlug === titleSlug);
    if (!exists) {
      user.bookmarks.push({ titleSlug, title, difficulty, addedAt: new Date() });
      await user.save();
    }
    res.json({ bookmarks: user.bookmarks });
  })
);

bookmarkRouter.delete(
  '/:titleSlug',
  asyncHandler(async (req, res) => {
    const slug = req.params.titleSlug;
    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }
    user.bookmarks = user.bookmarks.filter((b) => b.titleSlug !== slug);
    await user.save();
    res.json({ bookmarks: user.bookmarks });
  })
);
