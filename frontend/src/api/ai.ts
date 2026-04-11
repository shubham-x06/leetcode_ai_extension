import { apiClient } from './axios';

export async function getHint(problemDescription: string, userCode: string, language: string) {
  const res = await apiClient.post('/ai/hint', { problemDescription, userCode, language });
  return res.data;
}

export async function getSolution(problemDescription: string, userCode: string | undefined, language: string) {
  const res = await apiClient.post('/ai/solution', { problemDescription, userCode, language });
  return res.data;
}

export async function analyzeCode(problemDescription: string, userCode: string, language: string) {
  const res = await apiClient.post('/ai/analyze', { problemDescription, userCode, language });
  return res.data;
}

export async function getDailyGoal() {
  const res = await apiClient.get('/ai/daily-goal');
  return res.data;
}

export async function getRecommendation() {
  const res = await apiClient.get('/ai/recommend');
  return res.data;
}