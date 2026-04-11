import type { Types } from 'mongoose';
import NodeCache from 'node-cache';
import { AppError } from '../errors/AppError';
import { User } from '../models/User';
import { getProblemList, secondsUntilNextUtcMidnight } from './alfaApi';
import { chatCompletion } from './groq';
import { getWeakTopicsForUser } from './userContext';
import { extractProblemsArray, toSlimProblems, type SlimProblem } from './alfaProblems';

const dailyGoalCache = new NodeCache({ checkperiod: 300, useClones: false });

export type DailyGoalResponse = {
  motivation: string;
  problems: SlimProblem[];
};

function cacheKey(userId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `dailyGoal:${userId}:${day}`;
}

export async function getOrBuildDailyGoal(userId: Types.ObjectId): Promise<DailyGoalResponse> {
  const key = cacheKey(userId.toString());
  const cached = dailyGoalCache.get<DailyGoalResponse>(key);
  if (cached) return cached;

  const user = await User.findById(userId);
  if (!user?.leetcodeUsername?.trim()) {
    throw new AppError(400, 'Set LeetCode username first', 'NO_LC_USER');
  }

  let weakTopics = user.cachedWeakTopics?.length
    ? user.cachedWeakTopics
    : await getWeakTopicsForUser(userId);
  if (!weakTopics.length) weakTopics = ['Array'];

  const tag = weakTopics[0].replace(/\s+/g, '+');
  const td = user.preferences?.targetDifficulty ?? 'Mixed';
  const difficulty = td !== 'Mixed' ? td.toUpperCase() : undefined;
  const goalCount = Math.min(5, Math.max(1, user.preferences?.dailyGoalCount ?? 1));

  const data = await getProblemList({ tags: tag, difficulty, limit: 40 });
  const rawList = extractProblemsArray(data);
  let pool = toSlimProblems(rawList, 40);

  if (pool.length === 0) {
    const fallback = await getProblemList({ limit: 30 });
    pool = toSlimProblems(extractProblemsArray(fallback), 40);
  }

  const system = `You plan a LeetCode study session. Return JSON ONLY (no markdown):
{"motivation":"one encouraging paragraph, max 80 words","slugs":["slug1","slug2",...]}
Rules:
- Choose exactly ${goalCount} distinct titleSlug values from the "problems" list only.
- Slugs must match exactly.
- Reference weak topics naturally in motivation: ${weakTopics.join(', ')}.`;

  const userPrompt = JSON.stringify({
    weakTopics,
    targetDifficulty: td,
    problems: pool.slice(0, 35).map((p) => ({ titleSlug: p.titleSlug, title: p.title, difficulty: p.difficulty })),
  });

  const raw = await chatCompletion(system, userPrompt, 500);
  let slugs: string[] = [];
  let motivation = 'Focus on steady progress today — one problem at a time.';
  try {
    const cleaned = raw.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { motivation?: string; slugs?: string[] };
    if (typeof parsed.motivation === 'string' && parsed.motivation.trim()) {
      motivation = parsed.motivation.trim();
    }
    if (Array.isArray(parsed.slugs)) {
      slugs = parsed.slugs.filter((s) => typeof s === 'string').slice(0, goalCount);
    }
  } catch {
    slugs = pool.slice(0, goalCount).map((p) => p.titleSlug);
  }

  const bySlug = new Map(pool.map((p) => [p.titleSlug, p]));
  const picked: SlimProblem[] = [];
  for (const s of slugs) {
    const p = bySlug.get(s);
    if (p) picked.push(p);
  }
  while (picked.length < goalCount && picked.length < pool.length) {
    const next = pool.find((p) => !picked.some((x) => x.titleSlug === p.titleSlug));
    if (!next) break;
    picked.push(next);
  }

  const result: DailyGoalResponse = { motivation, problems: picked.slice(0, goalCount) };
  const ttl = secondsUntilNextUtcMidnight();
  dailyGoalCache.set(key, result, ttl);
  return result;
}
