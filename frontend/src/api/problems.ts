import { apiClient } from './axios';

export async function getDailyProblem() {
  const res = await apiClient.get('/problems/daily');
  return res.data;
}

export async function getProblemList(params: { limit?: number; skip?: number; tags?: string; difficulty?: string; search?: string }) {
  const q = new URLSearchParams();
  if (params.limit) q.set('limit', params.limit.toString());
  if (params.skip) q.set('skip', params.skip.toString());
  if (params.tags) q.set('tags', params.tags);
  if (params.difficulty) q.set('difficulty', params.difficulty);
  if (params.search) q.set('search', params.search);
  const res = await apiClient.get(`/problems/list?${q.toString()}`);
  return res.data;
}

export async function getProblem(titleSlug: string) {
  const res = await apiClient.get(`/problems/select?titleSlug=${encodeURIComponent(titleSlug)}`);
  return res.data;
}

export async function getOfficialSolution(titleSlug: string) {
  const res = await apiClient.get(`/problems/official-solution?titleSlug=${encodeURIComponent(titleSlug)}`);
  return res.data;
}