import { Router } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { validateBody } from '../middleware/validate';
import { analyzeBodySchema, hintBodySchema, solutionBodySchema } from '../validation/schemas';
import { User } from '../models/User';
import { chatTextStream, mapGroqError, normalizeSolutionCode } from '../services/groq';
import { alfaGet } from '../services/alfaApi';
import { getWeakTopicsForUser } from '../services/userContext';
import { readSolvedProblemCount } from '../lib/computeWeakTopics';
import { getOrBuildDailyGoal } from '../services/dailyGoalService';
import { extractProblemsArray, toSlimProblems } from '../services/alfaProblems';

export const aiRouter = Router();

function groqThrow(err: unknown): never {
  const m = mapGroqError(err);
  throw new AppError(m.status, m.message, m.code);
}

function parseJsonFromAi(raw: string): unknown {
  const cleaned = raw.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleaned);
}

function appendHintHistory(userId: string, problemSlug: string, hint: string): void {
  void (async () => {
    const u = await User.findById(userId);
    if (!u) return;
    u.hintHistory.push({ problemSlug: problemSlug || 'unknown', hint, askedAt: new Date() });
    if (u.hintHistory.length > 5) {
      u.hintHistory = u.hintHistory.slice(-5);
    }
    await u.save();
  })().catch(() => {});
}

aiRouter.post(
  '/hint',
  validateBody(hintBodySchema),
  asyncHandler(async (req, res) => {
    const { problemDescription, userCode, language, problemSlug } = req.body as {
      problemDescription: string;
      userCode: string;
      language: string;
      problemSlug?: string;
    };

    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    let weakLine = '';
    let solvedTotal = 0;
    if (user.cachedWeakTopics?.length) {
      weakLine = user.cachedWeakTopics.join(', ');
    } else {
      const live = await getWeakTopicsForUser(req.userId!);
      weakLine = live.join(', ');
    }

    const lc = user.leetcodeUsername?.trim();
    if (lc) {
      try {
        const { data } = await alfaGet(`/${encodeURIComponent(lc)}/solved`);
        solvedTotal = readSolvedProblemCount(data);
      } catch {
        solvedTotal = 0;
      }
    }

    const systemPrompt = `You are a LeetCode AI assistant. The user's weak topics are: ${weakLine || 'not yet synced'}.
They have solved ${solvedTotal} problems total.
Provide ONE concise hint (max 40 words) to guide their next step.
Do NOT give the full solution. Do NOT write code. Guide their thinking.`;

    const userPrompt = `Problem: ${problemDescription}\n\nMy code (in ${language}):\n${userCode}\n\nWhat's my next step?`;

    try {
      const hint = await chatTextStream(systemPrompt, userPrompt, 120);
      res.json({ hint });
      appendHintHistory(req.userId!.toString(), problemSlug || '', hint);
    } catch (err) {
      groqThrow(err);
    }
  })
);

aiRouter.post(
  '/solution',
  validateBody(solutionBodySchema),
  asyncHandler(async (req, res) => {
    const { problemDescription, userCode, language } = req.body as {
      problemDescription: string;
      userCode?: string;
      language: string;
    };
    const code = userCode ?? '';

    const user = await User.findById(req.userId);
    let normalizedLanguage = language.trim();
    if (!normalizedLanguage || /^(auto|default)$/i.test(normalizedLanguage)) {
      normalizedLanguage = user?.preferences?.preferredLanguage || 'Python';
    }

    if (normalizedLanguage.toLowerCase().includes('python')) {
      normalizedLanguage = 'Python';
    } else if (normalizedLanguage === 'C++' || normalizedLanguage.toLowerCase() === 'cpp') {
      normalizedLanguage = 'C++';
    } else if (normalizedLanguage === 'C#') {
      normalizedLanguage = 'C#';
    }

    const systemPrompt = `You are a code generator. Return ONLY valid ${normalizedLanguage} code. No explanations. No examples. No text before or after the code.`;
    const userPrompt = `Write a complete solution for this LeetCode problem in ${normalizedLanguage}. Return ONLY the code, nothing else:

${problemDescription}

Context (user editor may be empty): ${code}

Rules:
1. Only output the code
2. No explanations or comments beyond minimal necessary
3. No examples or test cases
4. Code must be correct and efficient
5. Start directly with the class/function definition`;

    try {
      const raw = await chatTextStream(systemPrompt, userPrompt, 1200);
      const solution = normalizeSolutionCode(raw, normalizedLanguage);
      res.json({ solution });
    } catch (err) {
      groqThrow(err);
    }
  })
);

aiRouter.post(
  '/analyze',
  validateBody(analyzeBodySchema),
  asyncHandler(async (req, res) => {
    const { problemDescription, userCode, language } = req.body as {
      problemDescription: string;
      userCode: string;
      language: string;
    };

    const system = `You are a senior engineer. Respond with JSON ONLY (no markdown), matching this shape:
{
  "timeComplexity": "e.g. O(n)",
  "spaceComplexity": "e.g. O(1)",
  "alternativeApproaches": ["short bullet strings"],
  "topicReinforced": "one topic name",
  "improvementTips": ["short tips"]
}`;

    const userPrompt = `Problem:\n${problemDescription}\n\nLanguage: ${language}\n\nCode:\n${userCode}`;

    try {
      const raw = await chatTextStream(system, userPrompt, 900);
      const parsed = parseJsonFromAi(raw) as Record<string, unknown>;
      res.json(parsed);
    } catch (err) {
      groqThrow(err);
    }
  })
);

aiRouter.get(
  '/daily-goal',
  asyncHandler(async (req, res) => {
    const payload = await getOrBuildDailyGoal(req.userId!);
    res.json(payload);
  })
);

aiRouter.get(
  '/recommend',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user?.leetcodeUsername?.trim()) {
      throw new AppError(400, 'Set LeetCode username first', 'NO_LC_USER');
    }

    const weak = await getWeakTopicsForUser(req.userId!);
    const diff = user.preferences?.targetDifficulty ?? 'Mixed';
    const params = new URLSearchParams();
    params.set('limit', '24');
    if (diff === 'Easy') params.set('difficulty', 'EASY');
    else if (diff === 'Medium') params.set('difficulty', 'MEDIUM');
    else if (diff === 'Hard') params.set('difficulty', 'HARD');
    if (weak[0]) params.set('tags', weak[0].replace(/\s+/g, '+'));

    const { data } = await alfaGet(`/problems?${params.toString()}`);
    const pool = toSlimProblems(extractProblemsArray(data), 24);
    if (pool.length === 0) {
      throw new AppError(502, 'Could not load problems for recommendation', 'ALFA_ERROR');
    }

    const system = `Pick the single best next LeetCode problem for this learner. Return JSON ONLY:
{"title":"","titleSlug":"","difficulty":"Easy|Medium|Hard","reason":"one sentence why"}
You MUST copy title, titleSlug, difficulty exactly from the provided list.`;
    const userPrompt = `Weak topics: ${weak.join(', ') || 'general practice'}.\nProblems: ${JSON.stringify(pool)}`;

    try {
      const raw = await chatTextStream(system, userPrompt, 400);
      const parsed = parseJsonFromAi(raw) as {
        title?: string;
        titleSlug?: string;
        difficulty?: string;
        reason?: string;
      };
      const match = pool.find((p) => p.titleSlug === parsed.titleSlug) || pool[0];
      res.json({
        recommendation: {
          title: parsed.title || match.title,
          titleSlug: parsed.titleSlug || match.titleSlug,
          difficulty: parsed.difficulty || match.difficulty,
          reason: parsed.reason || 'Targets your current practice gaps.',
        },
      });
    } catch (err) {
      groqThrow(err);
    }
  })
);
