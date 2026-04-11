import axios, { type AxiosError } from 'axios';
import { getCache, setCache } from './cache';

const ALFA_API_BASE_URL = 'https://alfa-leetcode-api.onrender.com';
export class AlfaApiError extends Error {
  constructor(public status: number, message: string, public code: string) {
    super(message);
    this.name = 'AlfaApiError';
  }
}

function isPrivateProfileError(err: unknown): boolean {
  const ax = err as AxiosError<{ errors?: Array<{ message?: string }> }>;
  const status = ax.response?.status;
  const msg = JSON.stringify(ax.response?.data || '').toLowerCase();
  if (status === 404) return true;
  if (msg.includes('private') || msg.includes('not found')) return true;
  return false;
}

export function secondsUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(1, Math.floor((next.getTime() - now.getTime()) / 1000));
}

async function fetchAlfaOnce<T>(url: string): Promise<T> {
  const res = await axios.get<T>(url, { timeout: 45000, validateStatus: () => true });
  if (res.status >= 400) {
    throw new AlfaApiError(res.status, `Alfa HTTP ${res.status}`, 'ALFA_HTTP_ERROR');
  }
  const data = res.data;
  const bodyStatus = (data as { statusCode?: number })?.statusCode;
  if (typeof bodyStatus === 'number' && bodyStatus >= 400) {
    throw new AlfaApiError(bodyStatus, `Alfa error status ${bodyStatus}`, 'ALFA_BODY_ERROR');
  }
  return data;
}

async function fetchAlfa<T>(path: string, ttlSeconds = 600): Promise<T> {
  const key = `alfa:${path}`;
  const hit = getCache<T>(key);
  if (hit !== undefined) return hit;

  const url = `${ALFA_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  try {
    let data: T;
    try {
      data = await fetchAlfaOnce<T>(url);
    } catch (firstErr) {
      // Retry once — Render free tier cold-starts can take 30-50s
      console.warn(`[alfa] Attempt 1 failed for ${path}:`, (firstErr as Error).message);
      data = await fetchAlfaOnce<T>(url);
    }
    setCache(key, data, ttlSeconds);
    return data;
  } catch (err) {
    console.error(`[alfa] Permanent failure for ${path}:`, (err as Error).message);
    if (err instanceof AlfaApiError) throw err;
    if (isPrivateProfileError(err)) {
      const e = new Error('LeetCode profile appears private or unavailable. Make your profile public to sync stats.');
      (e as Error & { code?: string }).code = 'PRIVATE_PROFILE';
      throw e;
    }
    throw new AlfaApiError(500, err instanceof Error ? err.message : 'Unknown error', 'ALFA_UNKNOWN_ERROR');
  }
}

export interface LeetCodeProfile { [key: string]: any }
export interface LeetCodeSolved { [key: string]: any }
export interface LeetCodeSkills { [key: string]: any }
export interface LeetCodeLanguages { [key: string]: any }
export interface LeetCodeCalendar { [key: string]: any }
export interface LeetCodeContest { [key: string]: any }
export interface LeetCodeContestHistory { [key: string]: any }
export interface LeetCodeSubmissions { [key: string]: any }
export interface LeetCodeDailyProblem { [key: string]: any }
export interface ProblemListParams { limit?: number; skip?: number; tags?: string; difficulty?: string; search?: string }
export interface LeetCodeProblemList { [key: string]: any }
export interface LeetCodeProblem { [key: string]: any }
export interface LeetCodeSolution { [key: string]: any }

export async function getUserProfile(username: string): Promise<LeetCodeProfile> {
  return fetchAlfa<LeetCodeProfile>(`/${encodeURIComponent(username)}/profile`);
}
export async function getUserSolved(username: string): Promise<LeetCodeSolved> {
  return fetchAlfa<LeetCodeSolved>(`/${encodeURIComponent(username)}/solved`);
}
export async function getUserSkills(username: string): Promise<LeetCodeSkills> {
  return fetchAlfa<LeetCodeSkills>(`/${encodeURIComponent(username)}/skill`);
}
export async function getUserLanguages(username: string): Promise<LeetCodeLanguages> {
  return fetchAlfa<LeetCodeLanguages>(`/${encodeURIComponent(username)}/language`);
}
export async function getUserCalendar(username: string, year?: string): Promise<LeetCodeCalendar> {
  return fetchAlfa<LeetCodeCalendar>(`/${encodeURIComponent(username)}/calendar${year ? `?year=${year}` : ''}`);
}
export async function getUserContest(username: string): Promise<LeetCodeContest> {
  return fetchAlfa<LeetCodeContest>(`/${encodeURIComponent(username)}/contest`);
}
export async function getUserContestHistory(username: string): Promise<LeetCodeContestHistory> {
  return fetchAlfa<LeetCodeContestHistory>(`/${encodeURIComponent(username)}/contest/history`);
}
export async function getUserSubmissions(username: string, limit?: number): Promise<LeetCodeSubmissions> {
  return fetchAlfa<LeetCodeSubmissions>(`/${encodeURIComponent(username)}/acSubmission?limit=${limit || 10}`, 300);
}
export async function getDailyProblem(): Promise<LeetCodeDailyProblem> {
  return fetchAlfa<LeetCodeDailyProblem>('/daily', secondsUntilNextUtcMidnight());
}
export async function getProblemList(params: ProblemListParams): Promise<LeetCodeProblemList> {
  const q = new URLSearchParams();
  if (params.limit) q.set('limit', params.limit.toString());
  if (params.skip) q.set('skip', params.skip.toString());
  if (params.tags) q.set('tags', params.tags);
  if (params.difficulty) q.set('difficulty', params.difficulty);
  if (params.search) q.set('search', params.search);
  return fetchAlfa<LeetCodeProblemList>(`/problems?${q.toString()}`);
}
export async function getProblem(titleSlug: string): Promise<LeetCodeProblem> {
  return fetchAlfa<LeetCodeProblem>(`/select?titleSlug=${encodeURIComponent(titleSlug)}`);
}
export async function getOfficialSolution(titleSlug: string): Promise<LeetCodeSolution> {
  return fetchAlfa<LeetCodeSolution>(`/officialSolution?titleSlug=${encodeURIComponent(titleSlug)}`);
}
