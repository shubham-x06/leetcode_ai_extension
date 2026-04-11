import { api } from './axios';

export async function getHint(body: {
  problemDescription: string;
  userCode: string;
  language: string;
  problemSlug?: string;
}): Promise<{ hint: string }> {
  const { data } = await api.post('/api/ai/hint', body);
  return data;
}

export async function getSolution(body: {
  problemDescription: string;
  userCode?: string;
  language: string;
}): Promise<{ solution: string }> {
  const { data } = await api.post('/api/ai/solution', body);
  return data;
}

export async function analyzeCode(body: {
  problemDescription: string;
  userCode: string;
  language: string;
}): Promise<Record<string, unknown>> {
  const { data } = await api.post('/api/ai/analyze', body);
  return data;
}

export async function getDailyGoal(): Promise<{ motivation: string; problems: unknown[] }> {
  const { data } = await api.get('/api/ai/daily-goal');
  return data;
}

export async function getRecommendation(): Promise<{
  recommendation: {
    title: string;
    titleSlug: string;
    difficulty: string;
    reason: string;
  };
}> {
  const { data } = await api.get('/api/ai/recommend');
  return data;
}
