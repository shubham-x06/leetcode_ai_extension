import { apiClient } from './axios';

export async function getMe() {
  const res = await apiClient.get('/user/me');
  return res.data;
}

export async function getUserStats() {
  const res = await apiClient.get('/user/stats');
  return res.data;
}

export async function getUserCalendar(year?: string) {
  const res = await apiClient.get('/user/calendar' + (year ? `?year=${year}` : ''));
  return res.data;
}

export async function getUserContest() {
  const res = await apiClient.get('/user/contest');
  return res.data;
}

export async function getSubmissions(limit: number = 10) {
  const res = await apiClient.get(`/user/submissions?limit=${limit}`);
  return res.data;
}

export async function updatePreferences(changes: any) {
  const res = await apiClient.patch('/user/preferences', changes);
  return res.data;
}

export async function addBookmark(problem: { titleSlug: string; title: string; difficulty: string }) {
  const res = await apiClient.post('/user/bookmarks', problem);
  return res.data;
}

export async function removeBookmark(titleSlug: string) {
  const res = await apiClient.delete(`/user/bookmarks/${encodeURIComponent(titleSlug)}`);
  return res.data;
}