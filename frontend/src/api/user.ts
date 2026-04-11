import { api } from './axios';
import type { AuthUser, UserPreferences } from '../store/useAuthStore';

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/api/user/me');
  return data;
}

export async function getStats(): Promise<{
  profile: unknown;
  solved: unknown;
  skills: unknown;
  languages: unknown;
}> {
  const { data } = await api.get('/api/user/stats');
  return data;
}

export async function getCalendar(year?: string): Promise<{
  submissionCalendar: string;
  streak: number;
  longestStreak: number;
  totalActiveDays: number;
}> {
  const q = year ? `?year=${encodeURIComponent(year)}` : '';
  const { data } = await api.get(`/api/user/calendar${q}`);
  return data;
}

export async function getContest(): Promise<{ contestDetails: unknown; contestHistory: unknown }> {
  const { data } = await api.get('/api/user/contest');
  return data;
}

export async function getSubmissions(limit = 10): Promise<{ submissions: unknown[] }> {
  const { data } = await api.get(`/api/user/submissions?limit=${limit}`);
  return data;
}

export async function patchPreferences(p: Partial<UserPreferences>): Promise<{
  success: boolean;
  preferences: UserPreferences;
}> {
  const { data } = await api.patch('/api/user/preferences', p);
  return data;
}

export async function addBookmark(body: {
  titleSlug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}): Promise<{ success: boolean }> {
  const { data } = await api.post('/api/user/bookmarks', body);
  return data;
}

export async function removeBookmark(titleSlug: string): Promise<{ success: boolean }> {
  const { data } = await api.delete(`/api/user/bookmarks/${encodeURIComponent(titleSlug)}`);
  return data;
}
