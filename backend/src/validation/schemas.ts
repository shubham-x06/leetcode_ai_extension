import { z } from 'zod';

export const googleAuthBodySchema = z
  .object({
    token: z.string().min(1).optional(),
    accessToken: z.string().min(1).optional(),
  })
  .refine((d) => !!(d.token || d.accessToken), { message: 'token or accessToken required' });

export const linkLeetcodeBodySchema = z.object({
  leetcodeUsername: z
    .string()
    .min(3)
    .max(25)
    .regex(/^[a-zA-Z0-9_]+$/, 'username must be alphanumeric with underscores'),
});

export const hintBodySchema = z.object({
  problemDescription: z.string().min(1),
  userCode: z.string(),
  language: z.string().min(1),
  problemSlug: z.string().optional(),
});

export const solutionBodySchema = z.object({
  problemDescription: z.string().min(1),
  userCode: z.string().optional(),
  language: z.string().min(1),
});

export const analyzeBodySchema = z.object({
  problemDescription: z.string().min(1),
  userCode: z.string().min(1),
  language: z.string().min(1),
});

export const dailyGoalBodySchema = z.object({
  // No required fields for daily goal
});

export const recommendBodySchema = z.object({
  // No required fields for recommendations
});

export const preferencesPatchSchema = z.object({
  targetDifficulty: z.enum(['Easy', 'Medium', 'Hard', 'Mixed']).optional(),
  dailyGoalCount: z.number().int().min(1).max(5).optional(),
  preferredLanguage: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export const bookmarkCreateSchema = z.object({
  titleSlug: z.string().min(1),
  title: z.string().min(1),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});

export const studyPlanBodySchema = z.object({
  topic: z.string().min(1),
});
