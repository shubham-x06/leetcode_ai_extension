import { Router, type Request, type Response } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/User';
import { alfaGet } from '../services/alfaClient';

export const leetcodeRouter = Router();

function attachStale(res: Response, stale: boolean, reason?: string): void {
  if (stale) {
    res.setHeader('X-Data-Stale', 'true');
    if (reason) res.setHeader('X-Data-Stale-Reason', reason);
  }
}

async function requireLeetcodeUsername(req: Request): Promise<string> {
  const u = await User.findById(req.userId).lean();
  const n = u?.leetcodeUsername?.trim();
  if (!n) {
    throw new AppError(400, 'Set your LeetCode username in settings.', 'NO_LC_USER');
  }
  return n;
}

function rethrowAlfa(e: unknown): never {
  const msg = e instanceof Error ? e.message : 'Upstream LeetCode proxy failed';
  const code = (e as Error & { code?: string }).code;
  if (code === 'PRIVATE_PROFILE') {
    throw new AppError(403, msg, code);
  }
  throw new AppError(502, msg, 'ALFA_ERROR');
}

leetcodeRouter.get(
  '/daily',
  asyncHandler(async (req, res) => {
    try {
      const { data, stale, staleReason } = await alfaGet('/daily');
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/problems',
  asyncHandler(async (req, res) => {
    try {
      const q = new URLSearchParams();
      const tags = req.query.tags;
      const difficulty = req.query.difficulty;
      const limit = req.query.limit;
      const skip = req.query.skip;
      const search = req.query.search;
      if (typeof tags === 'string' && tags) q.set('tags', tags);
      if (typeof difficulty === 'string' && difficulty) q.set('difficulty', difficulty);
      if (typeof limit === 'string' && limit) q.set('limit', limit);
      if (typeof skip === 'string' && skip) q.set('skip', skip);
      if (typeof search === 'string' && search) q.set('search', search);
      const path = `/problems${q.toString() ? `?${q.toString()}` : ''}`;
      const { data, stale, staleReason } = await alfaGet(path);
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/official-solution',
  asyncHandler(async (req, res) => {
    const titleSlug = typeof req.query.titleSlug === 'string' ? req.query.titleSlug : '';
    if (!titleSlug) {
      throw new AppError(400, 'titleSlug required', 'VALIDATION');
    }
    try {
      const { data, stale, staleReason } = await alfaGet(
        `/officialSolution?titleSlug=${encodeURIComponent(titleSlug)}`
      );
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/profile',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    try {
      const { data, stale, staleReason } = await alfaGet(`/${encodeURIComponent(username)}/profile`);
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/calendar',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    const year =
      typeof req.query.year === 'string' ? req.query.year : String(new Date().getFullYear());
    try {
      const { data, stale, staleReason } = await alfaGet(
        `/${encodeURIComponent(username)}/calendar?year=${encodeURIComponent(year)}`
      );
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/skill',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    try {
      const { data, stale, staleReason } = await alfaGet(`/${encodeURIComponent(username)}/skill`);
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/language',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    try {
      const { data, stale, staleReason } = await alfaGet(`/${encodeURIComponent(username)}/language`);
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/solved',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    try {
      const { data, stale, staleReason } = await alfaGet(`/${encodeURIComponent(username)}/solved`);
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/contest',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    try {
      const { data, stale, staleReason } = await alfaGet(`/${encodeURIComponent(username)}/contest`);
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/contest/history',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    try {
      const { data, stale, staleReason } = await alfaGet(
        `/${encodeURIComponent(username)}/contest/history`
      );
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/ac-submissions',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    const limit = typeof req.query.limit === 'string' ? req.query.limit : '10';
    try {
      const { data, stale, staleReason } = await alfaGet(
        `/${encodeURIComponent(username)}/acSubmission?limit=${encodeURIComponent(limit)}`
      );
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);

leetcodeRouter.get(
  '/me/progress',
  asyncHandler(async (req, res) => {
    const username = await requireLeetcodeUsername(req);
    try {
      const { data, stale, staleReason } = await alfaGet(`/${encodeURIComponent(username)}/progress`);
      attachStale(res, stale, staleReason);
      res.json({ data, meta: { stale, staleReason } });
    } catch (e) {
      rethrowAlfa(e);
    }
  })
);
