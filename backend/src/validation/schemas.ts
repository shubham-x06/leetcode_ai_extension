import { z } from 'zod';

export const googleAuthBodySchema = z.object({
  accessToken: z.string().min(1, 'accessToken required'),
});

export const hintBodySchema = z.object({
  problemDescription: z.string().min(1),
  userCode: z.string(),
  language: z.string().min(1),
  weakTopics: z.array(z.string()).optional(),
});

export const solutionBodySchema = z.object({
  problemDescription: z.string().min(1),
  userCode: z.string().optional(),
  language: z.string().min(1),
  weakTopics: z.array(z.string()).optional(),
});

export const analyzeCodeBodySchema = z.object({
  problemDescription: z.string().min(1),
  userCode: z.string().min(1),
  language: z.string().min(1),
  weakTopics: z.array(z.string()).optional(),
});

export const bookmarkCreateSchema = z.object({
  titleSlug: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.string().min(1),
});

export const studyPlanBodySchema = z.object({
  topic: z.string().min(1),
});

export const postSolveBodySchema = z.object({
  problemTitle: z.string().optional(),
  code: z.string().min(1),
  language: z.string().min(1),
});

export const patchUserBodySchema = z.object({
  leetcodeUsername: z.string().optional(),
  preferredLanguage: z.string().optional(),
  targetDifficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'MIXED']).optional(),
  dailyGoal: z.number().int().min(1).max(5).optional(),
  theme: z.enum(['light', 'dark']).optional(),
});
