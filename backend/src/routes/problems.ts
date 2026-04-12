import { Router, Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import {
  getDailyProblem,
  getProblemList,
  getProblemDetail,
  getOfficialSolution,
  LeetCodeError,
} from '../services/leetcodeGraphql';

const router = Router();

// GET /api/problems/daily
router.get('/daily', asyncHandler(async (_req: Request, res: Response) => {
  const problem = await getDailyProblem();
  return res.json({ problem: problem.question, date: problem.date, link: problem.link });
}));

// GET /api/problems/list
router.get('/list', asyncHandler(async (req: Request, res: Response) => {
  const { difficulty, tags, limit, skip, search } = req.query;

  const parsedLimit = Math.min(parseInt(limit as string, 10) || 20, 50);
  const parsedSkip = parseInt(skip as string, 10) || 0;

  let parsedDifficulty: 'EASY' | 'MEDIUM' | 'HARD' | undefined;
  if (difficulty === 'Easy') parsedDifficulty = 'EASY';
  else if (difficulty === 'Medium') parsedDifficulty = 'MEDIUM';
  else if (difficulty === 'Hard') parsedDifficulty = 'HARD';

  const parsedTags = tags
    ? (tags as string).split(',').map(t => t.trim()).filter(Boolean)
    : undefined;

  const result = await getProblemList({
    difficulty: parsedDifficulty,
    tags: parsedTags,
    limit: parsedLimit,
    skip: parsedSkip,
    searchQuery: search as string | undefined,
  });

  return res.json(result);
}));

// GET /api/problems/select
router.get('/select', asyncHandler(async (req: Request, res: Response) => {
  const { titleSlug } = req.query;

  if (!titleSlug || typeof titleSlug !== 'string') {
    return res.status(400).json({ error: 'titleSlug query parameter is required', code: 'MISSING_PARAM' });
  }

  const problem = await getProblemDetail(titleSlug);
  return res.json({ problem });
}));

// GET /api/problems/official-solution
router.get('/official-solution', asyncHandler(async (req: Request, res: Response) => {
  const { titleSlug } = req.query;

  if (!titleSlug || typeof titleSlug !== 'string') {
    return res.status(400).json({ error: 'titleSlug query parameter is required', code: 'MISSING_PARAM' });
  }

  const solution = await getOfficialSolution(titleSlug);

  if (!solution) {
    return res.status(404).json({ error: 'No official solution available for this problem', code: 'NO_SOLUTION' });
  }

  return res.json({ solution });
}));

export const problemsRouter = router;
