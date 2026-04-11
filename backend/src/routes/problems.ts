import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { alfaGet, secondsUntilNextUtcMidnight } from '../services/alfaApi';
import { extractProblemsArray, extractTotalCount } from '../services/alfaProblems';

export const problemsRouter = Router();

function rethrowAlfa(e: unknown): never {
  const msg = e instanceof Error ? e.message : 'Upstream LeetCode proxy failed';
  const code = (e as Error & { code?: string }).code;
  if (code === 'PRIVATE_PROFILE') {
    throw new AppError(403, msg, code);
  }
  throw new AppError(502, msg, 'ALFA_ERROR');
}

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
      const ttl = secondsUntilNextUtcMidnight();
      const { data } = await alfaGet('/daily', { ttlSeconds: ttl });
      res.json({ problem: unwrapDailyProblem(data) });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

problemsRouter.get(
  '/list',
  asyncHandler(async (req, res) => {
    try {
      const q = new URLSearchParams();
      const tags = req.query.tags;
      const difficulty = req.query.difficulty;
      const search = req.query.search;
      const rawLimit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 20;
      const rawSkip = typeof req.query.skip === 'string' ? Number(req.query.skip) : 0;
      const limit = Number.isFinite(rawLimit) ? Math.min(50, Math.max(1, Math.floor(rawLimit))) : 20;
      const skip = Number.isFinite(rawSkip) ? Math.max(0, Math.floor(rawSkip)) : 0;
      if (typeof tags === 'string' && tags) q.set('tags', tags.replace(/\s+/g, '+').replace(/,/g, '+'));
      if (typeof difficulty === 'string' && difficulty) {
        const d = difficulty.toUpperCase();
        q.set('difficulty', d === 'EASY' || d === 'MEDIUM' || d === 'HARD' ? d : difficulty);
      }
      if (typeof search === 'string' && search.trim()) q.set('search', search.trim());
      q.set('limit', String(limit));
      q.set('skip', String(skip));
      const path = `/problems?${q.toString()}`;
      const { data } = await alfaGet(path);
      const arr = extractProblemsArray(data);
      const total = extractTotalCount(data, arr.length);
      res.json({ problems: arr, total });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

problemsRouter.get(
  '/select',
  asyncHandler(async (req, res) => {
    const titleSlug = typeof req.query.titleSlug === 'string' ? req.query.titleSlug.trim() : '';
    if (!titleSlug) {
      throw new AppError(400, 'titleSlug required', 'VALIDATION');
    }
    try {
      const { data } = await alfaGet(`/select?titleSlug=${encodeURIComponent(titleSlug)}`);
      res.json(data);
    } catch (e) {
      rethrowAlfa(e);
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
    const titleSlug = typeof req.query.titleSlug === 'string' ? req.query.titleSlug.trim() : '';
    if (!titleSlug) {
      throw new AppError(400, 'titleSlug required', 'VALIDATION');
    }
    try {
      const { data } = await alfaGet(`/officialSolution?titleSlug=${encodeURIComponent(titleSlug)}`);
      const content = extractSolutionContent(data);
      if (content == null || content === '') {
        throw new AppError(404, 'No official solution available', 'NO_OFFICIAL_SOLUTION');
      }
      res.json({ solution: { content } });
    } catch (e) {
      if (e instanceof AppError) throw e;
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('404') || msg.includes('HTTP 404')) {
        throw new AppError(404, 'No official solution available', 'NO_OFFICIAL_SOLUTION');
      }
      rethrowAlfa(e);
    }
  })
);
