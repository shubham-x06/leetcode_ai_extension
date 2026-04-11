import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { getDailyProblem, getProblemList, getProblem, getOfficialSolution, AlfaApiError } from '../services/alfaApi';

export const problemsRouter = Router();

function unwrapDailyProblem(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const o = data as Record<string, unknown>;
  if (o.problem && typeof o.problem === 'object') return o.problem;
  if (o.dailyQuestion && typeof o.dailyQuestion === 'object') return o.dailyQuestion;
  if (o.data && typeof o.data === 'object') {
    const inner = o.data as Record<string, unknown>;
    if (inner.problem) return inner.problem;
    return o.data;
  }
  return data;
}

problemsRouter.get(
  '/daily',
  asyncHandler(async (_req, res) => {
    try {
      const data = await getDailyProblem();
      res.json({ problem: unwrapDailyProblem(data) });
    } catch (e: any) {
      throw new AppError(502, e.message || 'Upstream LeetCode proxy failed', 'ALFA_ERROR');
    }
  })
);

problemsRouter.get(
  '/list',
  asyncHandler(async (req, res) => {
    try {
      const rawLimit = Number(req.query.limit) || 20;
      const limit = Math.min(50, Math.max(1, rawLimit));
      const skip = Math.max(0, Number(req.query.skip) || 0);

      let tags = req.query.tags as string | undefined;
      if (tags) {
        tags = tags.replace(/\s+/g, '+').replace(/,/g, '+');
      }

      let difficulty = req.query.difficulty as string | undefined;
      if (difficulty) {
        const d = difficulty.toUpperCase();
        if (d === 'EASY' || d === 'MEDIUM' || d === 'HARD') difficulty = d;
      }
      
      const search = req.query.search as string | undefined;

      const data = await getProblemList({ limit, skip, tags, difficulty, search: search?.trim() });
      
      const arr = data.problemsetQuestionList || data.data?.problemsetQuestionList || data.problems || [];
      const total = data.totalQuestions || data.data?.totalQuestions || data.total || arr.length;
      
      res.json({ problems: arr, total });
    } catch (e: any) {
      throw new AppError(502, e.message || 'Upstream LeetCode proxy failed', 'ALFA_ERROR');
    }
  })
);

problemsRouter.get(
  '/select',
  asyncHandler(async (req, res) => {
    const schema = z.object({ titleSlug: z.string().min(1) });
    const { titleSlug } = schema.parse(req.query);
    
    try {
      const data = await getProblem(titleSlug);
      res.json(data);
    } catch (e: any) {
      throw new AppError(502, e.message || 'Upstream LeetCode proxy failed', 'ALFA_ERROR');
    }
  })
);

function extractSolutionContent(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (typeof o.content === 'string') return o.content;
    if (o.solution && typeof o.solution === 'object') {
      const s = o.solution as Record<string, unknown>;
      if (typeof s.content === 'string') return s.content;
    }
    if (o.data && typeof o.data === 'object') {
      return extractSolutionContent(o.data);
    }
  }
  return null;
}

problemsRouter.get(
  '/official-solution',
  asyncHandler(async (req, res) => {
    const schema = z.object({ titleSlug: z.string().min(1) });
    const { titleSlug } = schema.parse(req.query);
    
    try {
      const data = await getOfficialSolution(titleSlug);
      const content = extractSolutionContent(data);
      if (content == null || content === '') {
        throw new AppError(404, 'No official solution available', 'NO_OFFICIAL_SOLUTION');
      }
      res.json({ solution: { content } });
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      if (e instanceof AlfaApiError && e.status === 404) {
        throw new AppError(404, 'No official solution available', 'NO_OFFICIAL_SOLUTION');
      }
      throw new AppError(502, e.message || '', 'ALFA_ERROR');
    }
  })
);
