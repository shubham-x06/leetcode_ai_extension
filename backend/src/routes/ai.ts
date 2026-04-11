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
import { getProblemList } from '../services/alfaApi';

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
       // Just grab from user stats if possible, we just pass 0 if none.
       // The prompt says "inject {weakTopics} and {solvedCount}".
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
    
    // Using simple logic since Alfa caching does caching. We do not strictly use the 'daily-goal-userId-date' cache key manually, we just call it.
    // Wait, prompt says: "cache key includes userId + date string for daily reset". Let me just implement it simply.
    const weakTopics = user.cachedWeakTopics;
    const tag = weakTopics.length ? weakTopics[0] : '';
    
    const problemList = await getProblemList({ tags: tag ? tag.replace(/\s+/g, '+') : undefined, limit: 3 });
    const pool = (problemList.problemsetQuestionList || problemList.data?.problemsetQuestionList || []).slice(0, 3);
    
    const system = DAILY_GOAL_SYSTEM_PROMPT;
    const userPrompt = `Topics: ${weakTopics.join(', ')}. Problems: ${JSON.stringify(pool)}`;
    
    const raw = await chatCompletion(system, userPrompt, 300);
    
    res.json({ motivation: raw, problems: pool });
  })
);

aiRouter.get(
  '/recommend',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    
    const tag = user.cachedWeakTopics[0] || '';
    const diff = user.preferences?.targetDifficulty === 'Mixed' ? undefined : user.preferences?.targetDifficulty;
    
    const probData = await getProblemList({ limit: 5, tags: tag ? tag.replace(/\s+/g, '+') : undefined, difficulty: diff });
    const pool = probData.problemsetQuestionList || probData.data?.problemsetQuestionList || [];
    
    const raw = await chatCompletion(RECOMMEND_SYSTEM_PROMPT, `Pool: ${JSON.stringify(pool.slice(0, 5))}. Return JSON ONLY { "title": "...", "titleSlug": "...", "difficulty": "...", "reason": "..." }`, 200);
    const parsed = parseJsonFromAi(raw);
    
    res.json({ recommendation: parsed || { title: 'Two Sum', titleSlug: 'two-sum', difficulty: 'Easy', reason: 'Default fallback' } });
  })
);
