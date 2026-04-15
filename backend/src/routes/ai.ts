import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { User } from '../models/User';
import { chatCompletion } from '../services/groq';
import {
  HINT_SYSTEM_PROMPT,
  SOLUTION_SYSTEM_PROMPT,
  ANALYZE_SYSTEM_PROMPT,
  DAILY_GOAL_SYSTEM_PROMPT,
  RECOMMEND_SYSTEM_PROMPT
} from '../lib/constants';
import { getProblemList, getUserSolved } from '../services/leetcodeGraphql';

export const aiRouter = Router();

function parseJsonFromAi(raw: string): any {
  try {
    const cleaned = raw.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

aiRouter.post(
  '/hint',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      problemDescription: z.string(),
      userCode: z.string(),
      language: z.string(),
    });
    const { problemDescription, userCode, language } = schema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    const weakLine = user.cachedWeakTopics.join(', ') || 'general practice';
    
    let solvedTotal = 0;
    if (user.leetcodeUsername) {
      try {
        const solved = await getUserSolved(user.leetcodeUsername);
        solvedTotal = solved.solvedProblem ?? 0;
      } catch {
        // Non-blocking — if fetch fails, hint still works with 0
        solvedTotal = 0;
      }
    }

    const systemPrompt = HINT_SYSTEM_PROMPT
      .replace('{weakTopics}', weakLine)
      .replace('{solvedTotal}', solvedTotal.toString())
      .replace('{solvedCount}', solvedTotal.toString()); 
    const userPrompt = `Problem: ${problemDescription}\n\nMy code (in ${language}):\n${userCode}\n\nWhat's my next step?`;

    const hint = await chatCompletion(systemPrompt, userPrompt, 150);

    // Append hintHistory async (slice to 5)
    setTimeout(async () => {
      try {
        const u = await User.findById(req.userId);
        if (u) {
          u.hintHistory.push({ problemSlug: 'unknown', hint, askedAt: new Date() });
          if (u.hintHistory.length > 5) {
            u.hintHistory = u.hintHistory.slice(-5);
          }
          await u.save();
        }
      } catch {}
    }, 0);

    res.json({ hint });
  })
);

aiRouter.post(
  '/solution',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      problemDescription: z.string(),
      userCode: z.string().optional(),
      language: z.string(),
    });
    
    // User schema preferences.preferredLanguage
    let { problemDescription, userCode, language } = schema.parse(req.body);

    const user = await User.findById(req.userId);
    if (!language || /^(auto|default)$/i.test(language)) {
      language = user?.preferences?.preferredLanguage || 'Python';
    }

    const systemPrompt = SOLUTION_SYSTEM_PROMPT.replace(/\{language\}/g, language);
    const userPrompt = `Write a solution for:\n${problemDescription}\nContext:\n${userCode || ''}`;
    
    const raw = await chatCompletion(systemPrompt, userPrompt, 1200);
    const solution = raw.replace(/```[\w+#-]*\n?/g, '').replace(/```/g, '').trim();

    res.json({ solution });
  })
);

aiRouter.post(
  '/analyze',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      problemDescription: z.string(),
      userCode: z.string(),
      language: z.string()
    });
    const { problemDescription, userCode, language } = schema.parse(req.body);

    const system = ANALYZE_SYSTEM_PROMPT;
    const userPrompt = `Problem:\n${problemDescription}\n\nLanguage: ${language}\n\nCode:\n${userCode}`;
    
    let raw = await chatCompletion(system, userPrompt, 900);
    let parsed = parseJsonFromAi(raw);
    
    // If parse fails retries once with stricter prompt
    if (!parsed) {
      raw = await chatCompletion(`${system}\nCRITICAL: OUTPUT JSON ONLY. NO MARKDOWN WRAPPERS OR BACKTICKS.`, userPrompt, 900);
      parsed = parseJsonFromAi(raw);
    }
    
    res.json(parsed || { timeComplexity: "Unknown", spaceComplexity: "Unknown", alternativeApproaches: [], topicReinforced: "Unknown", improvementTips: [] });
  })
);

aiRouter.get(
  '/daily-goal',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    
    const weakTopics = user.cachedWeakTopics || [];
    const tagToUse = weakTopics[0] ? weakTopics[0].toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'dynamic-programming';

    // Respect user's target difficulty (Mixed = no filter)
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' | undefined;
    if (user.preferences?.targetDifficulty && user.preferences.targetDifficulty !== 'Mixed') {
      difficulty = user.preferences.targetDifficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
    }

    // Respect user's daily goal count (capped at 5 per schema)
    const goalCount = Math.min(user.preferences?.dailyGoalCount || 3, 5);

    // --- Try specific weak topic first ---
    let pool: any[] = [];
    const specificList = await getProblemList({ tags: [tagToUse], difficulty, limit: goalCount + 10 });
    pool = specificList.questions || [];

    // --- If not enough problems, fall back to broader popular tags ---
    if (pool.length < goalCount) {
      const broadSkip = Math.floor(Math.random() * 200); // Increased range
      const broadList = await getProblemList({ difficulty, limit: 100, skip: broadSkip });
      const broadPool = broadList.questions || [];
      // Merge and deduplicate
      const seen = new Set(pool.map((p: any) => p.titleSlug));
      for (const p of broadPool) {
        if (!seen.has(p.titleSlug)) { 
          pool.push(p); 
          seen.add(p.titleSlug); 
        }
        if (pool.length >= goalCount + 10) break;
      }
    }

    // Shuffle for variety and slice to exactly goalCount
    pool = pool.sort(() => Math.random() - 0.5).slice(0, goalCount);
    
    const system = DAILY_GOAL_SYSTEM_PROMPT;
    const userPrompt = `Topics: ${weakTopics.join(', ')}. Target: ${goalCount} problems. Problems: ${JSON.stringify(pool)}`;
    const raw = await chatCompletion(system, userPrompt, 300);
    
    res.json({ motivation: raw, problems: pool });
  })
);

aiRouter.get(
  '/recommend',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    
    const weakTopics = user.cachedWeakTopics || [];

    const slugify = (name: string) => name.toLowerCase().replace(/[()]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Use popular tags that definitely have 100+ problems; prefer second weak topic
    const FALLBACK_TAGS = ['dynamic-programming', 'array', 'string', 'binary-search', 'graph', 'two-pointers', 'greedy', 'backtracking', 'tree', 'hash-table'];
    const mappedTag1 = weakTopics[1] ? slugify(weakTopics[1]) : null;
    const mappedTag0 = weakTopics[0] ? slugify(weakTopics[0]) : null;
    const mappedTag = mappedTag1 || mappedTag0 || FALLBACK_TAGS[Math.floor(Date.now() / 60000) % FALLBACK_TAGS.length]; // rotate every minute

    // Mixed = no difficulty filter. Otherwise respect user preference.
    let difficulty: 'EASY' | 'MEDIUM' | 'HARD' | undefined;
    if (user.preferences?.targetDifficulty && user.preferences.targetDifficulty !== 'Mixed') {
      difficulty = user.preferences.targetDifficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
    }
    
    // Use a unique random skip so every refresh gets a fresh batch
    const randomSkip = Math.floor(Math.random() * 300); // Much larger range

    const result = await getProblemList({ limit: 40, skip: randomSkip, tags: [mappedTag], difficulty });
    let pool = result.questions || [];

    // Safety net: if still small, query without topic tag with a very large skip
    if (pool.length < 5) {
      const fallbackSkip = Math.floor(Math.random() * 1000);
      const broadResult = await getProblemList({ limit: 50, skip: fallbackSkip, difficulty });
      pool = broadResult.questions || [];
    }

    // Shuffle so AI picks from a varied set
    pool = pool.sort(() => Math.random() - 0.5);
    
    const raw = await chatCompletion(
      RECOMMEND_SYSTEM_PROMPT,
      `User's weak topics: ${weakTopics.join(', ')}. Target difficulty: ${user.preferences?.targetDifficulty || 'Mixed'}. Pick ONE problem from this pool that best matches the weak topics. Pool: ${JSON.stringify(pool.slice(0, 10))}. Return JSON ONLY: { "title": "...", "titleSlug": "...", "difficulty": "...", "reason": "..." }`,
      250
    );
    const parsed = parseJsonFromAi(raw);
    
    // Fallback: random item from shuffled pool
    const fallback = pool[Math.floor(Math.random() * Math.min(pool.length, 5))] || { title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', reason: 'A great starting point for building problem-solving skills.' };
    res.json({ recommendation: parsed || fallback });
  })
);
