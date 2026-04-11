import { api } from './axios';

export async function getDaily(): Promise<{ problem: unknown }> {
  const { data } = await api.get('/api/problems/daily');
  return data;
}

export async function getProblemList(params: URLSearchParams): Promise<{ problems: unknown[]; total: number }> {
  const { data } = await api.get(`/api/problems/list?${params.toString()}`);
  return data;
}

export async function getProblem(titleSlug: string): Promise<unknown> {
  const { data } = await api.get(`/api/problems/select?titleSlug=${encodeURIComponent(titleSlug)}`);
  return data;
}

export async function getOfficialSolution(titleSlug: string): Promise<{ solution?: { content?: string } }> {
  const { data } = await api.get(`/api/problems/official-solution?titleSlug=${encodeURIComponent(titleSlug)}`);
  return data;
}
