import { Router, type RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { validateBody } from '../middleware/validate';
import {
  analyzeCodeBodySchema,
  hintBodySchema,
  postSolveBodySchema,
  solutionBodySchema,
  studyPlanBodySchema,
} from '../validation/schemas';
import { User } from '../models/User';
import { chatTextStream, mapGroqError, normalizeSolutionCode } from '../services/groqAi';
import { alfaGet } from '../services/alfaClient';
import { getWeakTopicsForUser } from '../services/userContext';
import { buildDailyGoalsPayload } from '../services/dailyGoalService';

export const aiRouter = Router();

function groqThrow(err: unknown): never {
  const m = mapGroqError(err);
  throw new AppError(m.status, m.message, m.code);
}

async function resolveWeakTopics(
  req: import('express').Request,
  bodyWeak?: string[]
): Promise<string[]> {
  if (Array.isArray(bodyWeak) && bodyWeak.length) {
    return bodyWeak.filter((x) => typeof x === 'string').slice(0, 12);
  }
  if (req.userId) {
    return getWeakTopicsForUser(req.userId);
  }
  return [];
}

export const postHintHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { problemDescription, userCode, language, weakTopics } = req.body as {
    problemDescription: string;
    userCode: string;
    language: string;
    weakTopics?: string[];
  };
  const weak = await resolveWeakTopics(req, weakTopics);
  const weakLine =
    weak.length > 0
      ? `User's weaker areas (personalize hint toward these, do not name all at once): ${weak.join(', ')}.`
      : '';

  const systemPrompt = `You are a LeetCode assistant. Provide ONE concise hint to help the user. It should be specific to the problem and code provided. The hint should guide the user towards the next step in solving the problem without giving away the full solution. DO NOT provide a full solution or code snippet. Maximum 40 words. ${weakLine}`;

  const userPrompt = `Problem: ${problemDescription}\n\nMy code (in ${language}):\n${userCode}\n\nWhat's my next step?`;

  try {
    const hint = await chatTextStream(systemPrompt, userPrompt, 120);
    res.json({ hint });
  } catch (err) {
    groqThrow(err);
  }
});

export const postSolutionHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { problemDescription, userCode, language, weakTopics } = req.body as {
    problemDescription: string;
    userCode?: string;
    language: string;
    weakTopics?: string[];
  };
  const code = userCode || '';
  await resolveWeakTopics(req, weakTopics);

  let normalizedLanguage = language;
  if (language.toLowerCase().includes('python')) {
    normalizedLanguage = 'Python';
  } else if (language === 'C++') {
    normalizedLanguage = 'C++';
  } else if (language === 'C#') {
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
});

aiRouter.post('/hint', validateBody(hintBodySchema), postHintHandler);
aiRouter.post('/solution', validateBody(solutionBodySchema), postSolutionHandler);

aiRouter.post(
  '/analyze-code',
  validateBody(analyzeCodeBodySchema),
  asyncHandler(async (req, res) => {
    const { problemDescription, userCode, language, weakTopics } = req.body as {
      problemDescription: string;
      userCode: string;
      language: string;
      weakTopics?: string[];
    };
    const weak = await resolveWeakTopics(req, weakTopics);
    const weakLine = weak.length ? `Weak areas to relate feedback to: ${weak.join(', ')}.` : '';

    const system = `You are a senior interviewer. Analyze the user's approach. Return markdown with sections: ## Complexity, ## What works, ## Improvements, ## Topics reinforced. Be concise. ${weakLine}`;
    const user = `Problem:\n${problemDescription}\n\nLanguage: ${language}\n\nCode:\n${userCode}`;
    try {
      const text = await chatTextStream(system, user, 900);
      res.json({ analysis: text });
    } catch (err) {
      groqThrow(err);
    }
  })
);

aiRouter.get(
  '/daily-goal',
  asyncHandler(async (req, res) => {
    const payload = await buildDailyGoalsPayload(req.userId!);
    res.json(payload);
  })
);

aiRouter.post(
  '/mentor/daily-blurb',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user?.leetcodeUsername) {
      throw new AppError(400, 'Set LeetCode username first', 'NO_LC_USER');
    }
    const weak = await getWeakTopicsForUser(req.userId!);
    const { data: daily } = await alfaGet('/daily');
    const system =
      'You motivate a learner. In 2-3 sentences, explain why attempting the daily LeetCode problem helps them, referencing weak areas if provided. No spoilers. Friendly tone.';
    const userPrompt = `Daily problem payload (JSON excerpt): ${JSON.stringify(daily).slice(0, 4000)}\nWeak topics: ${weak.join(', ') || 'unknown'}`;
    try {
      const blurb = await chatTextStream(system, userPrompt, 200);
      res.json({ blurb, weakTopics: weak });
    } catch (err) {
      groqThrow(err);
    }
  })
);

aiRouter.post(
  '/mentor/daily-goals',
  asyncHandler(async (req, res) => {
    const payload = await buildDailyGoalsPayload(req.userId!);
    res.json(payload);
  })
);

aiRouter.post(
  '/mentor/next-problem',
  asyncHandler(async (req, res) => {
    const weak = await getWeakTopicsForUser(req.userId!);
    const user = await User.findById(req.userId);
    const diff = user?.targetDifficulty || 'MIXED';
    const path =
      diff === 'MIXED'
        ? `/problems?limit=12${weak[0] ? `&tags=${encodeURIComponent(weak[0])}` : ''}`
        : `/problems?difficulty=${encodeURIComponent(diff)}&limit=12${
            weak[0] ? `&tags=${encodeURIComponent(weak[0])}` : ''
          }`;
    const { data: problems } = await alfaGet(path);
    const system =
      'Recommend ONE next problem. JSON only: {"titleSlug":"","title":"","difficulty":"","why":""} from the provided list.';
    const userPrompt = `Weak: ${weak.join(', ')}. List: ${JSON.stringify(problems).slice(0, 8000)}`;
    try {
      const raw = await chatTextStream(system, userPrompt, 350);
      let rec: unknown = {};
      try {
        rec = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
      } catch {
        rec = { parseError: true, raw };
      }
      res.json(rec);
    } catch (err) {
      groqThrow(err);
    }
  })
);

aiRouter.post(
  '/mentor/study-plan',
  validateBody(studyPlanBodySchema),
  asyncHandler(async (req, res) => {
    const { topic } = req.body as { topic: string };
    const { data: problems } = await alfaGet(
      `/problems?tags=${encodeURIComponent(topic)}&limit=40`
    );
    const system = `Create a 7-day study plan using ONLY problems from the JSON list (use real titleSlug and title). JSON only:
{"days":[{"day":1,"problems":[{"titleSlug":"","title":"","focus":""}],"note":""}, ...]}`;
    const userPrompt = `Topic: ${topic}.\nProblems: ${JSON.stringify(problems).slice(0, 12000)}`;
    try {
      const raw = await chatTextStream(system, userPrompt, 1200);
      let plan: unknown = {};
      try {
        plan = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
      } catch {
        plan = { parseError: true, raw };
      }
      res.json(plan);
    } catch (err) {
      groqThrow(err);
    }
  })
);

aiRouter.post(
  '/mentor/post-solve',
  validateBody(postSolveBodySchema),
  asyncHandler(async (req, res) => {
    const { problemTitle, code, language } = req.body as {
      problemTitle?: string;
      code: string;
      language: string;
    };
    const weak = await getWeakTopicsForUser(req.userId!);
    const system =
      'Post-solve coaching: markdown with ## Complexity, ## Alternative ideas, ## Drill suggestions. Be concise.';
    const userPrompt = `Problem: ${problemTitle || 'Unknown'}\nWeak topics: ${weak.join(', ')}\nLanguage: ${language}\nCode:\n${code}`;
    try {
      const text = await chatTextStream(system, userPrompt, 900);
      res.json({ analysis: text });
    } catch (err) {
      groqThrow(err);
    }
  })
);
