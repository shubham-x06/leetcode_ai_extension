import type { Types } from 'mongoose';
import NodeCache from 'node-cache';
import { AppError } from '../errors/AppError';
import { User } from '../models/User';
import { alfaGet, secondsUntilNextUtcMidnight } from './alfaApi';
import { chatTextStream } from './groq';
import { getWeakTopicsForUser } from './userContext';
import {
  extractProblemsArray,
  toSlimProblems,
  type SlimProblem,
} from './alfaProblems';

const dailyGoalCache = new NodeCache({ checkperiod: 300, useClones: false });

export type DailyGoalResponse = {
  motivation: string;
  problems: SlimProblem[];
};

function cacheKey(userId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `dailyGoal:${userId}:${day}`;
}

function buildProblemsPath(user: { cachedWeakTopics?: string[]; preferences?: import('../models/User').UserPreferences }): string {
  const params = new URLSearchParams();
  const weak =
    Array.isArray(user.cachedWeakTopics) && user.cachedWeakTopics.length
      ? user.cachedWeakTopics
      : [];
  const tagSource = weak[0] || 'array';
  params.set('tags', tagSource.trim().replace(/\s+/g, '+'));
  const td = user.preferences?.targetDifficulty ?? 'Mixed';
  if (td === 'Easy') params.set('difficulty', 'EASY');
  else if (td === 'Medium') params.set('difficulty', 'MEDIUM');
  else if (td === 'Hard') params.set('difficulty', 'HARD');
  const goal = user.preferences?.dailyGoalCount ?? 1;
  params.set('limit', String(Math.min(50, Math.max(goal * 8, 20))));
  return `/problems?${params.toString()}`;
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

  const { data } = await alfaGet(buildProblemsPath(user));
  const rawList = extractProblemsArray(data);
  const pool = toSlimProblems(rawList, 40);
  if (pool.length === 0) {
    const fallback = await alfaGet('/problems?limit=30');
    const fbList = extractProblemsArray(fallback.data);
    pool.push(...toSlimProblems(fbList, 40));
  }

  const goalCount = Math.min(5, Math.max(1, user.preferences?.dailyGoalCount ?? 1));
  const system = `You plan a LeetCode study session. Return JSON ONLY (no markdown):
{"motivation":"one encouraging paragraph, max 80 words","slugs":["slug1","slug2",...]}
Rules:
- Choose exactly ${goalCount} distinct titleSlug values from the "problems" list only.
- Slugs must match exactly.
- Reference weak topics naturally in motivation: ${weakTopics.join(', ')}.`;

  const userPrompt = JSON.stringify({
    weakTopics,
    targetDifficulty: user.preferences?.targetDifficulty ?? 'Mixed',
    problems: pool.slice(0, 35).map((p) => ({ titleSlug: p.titleSlug, title: p.title, difficulty: p.difficulty })),
  });

  const raw = await chatTextStream(system, userPrompt, 500);
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
