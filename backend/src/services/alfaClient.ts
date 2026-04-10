import axios, { type AxiosError } from 'axios';
import NodeCache from 'node-cache';
import { env } from '../config/env';

export type AlfaStaleReason = 'network' | 'rate_limit' | 'server_error';

const alfaCache = new NodeCache({ stdTTL: 600, checkperiod: 120, useClones: false });
const staleFallback = new Map<string, unknown>();

function isPrivateProfileError(err: unknown): boolean {
  const ax = err as AxiosError<{ errors?: Array<{ message?: string }> }>;
  const status = ax.response?.status;
  const msg = JSON.stringify(ax.response?.data || '').toLowerCase();
  if (status === 404) return true;
  if (msg.includes('private') || msg.includes('not found')) return true;
  return false;
}

export interface AlfaFetchResult<T = unknown> {
  data: T;
  stale: boolean;
  staleReason?: AlfaStaleReason;
}

export function secondsUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return Math.max(1, Math.floor((next.getTime() - now.getTime()) / 1000));
}

/**
 * GET against Alfa with configurable TTL (default 600s). Uses node-cache `set(key, val, ttl)`.
 */
export async function alfaGet<T = unknown>(
  path: string,
  options?: { ttlSeconds?: number }
): Promise<AlfaFetchResult<T>> {
  const ttl = options?.ttlSeconds ?? 600;
  const key = `${ttl}:${path.startsWith('/') ? path : `/${path}`}`;
  const url = `${env.alfaApiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const hit = alfaCache.get<T>(key);
  if (hit !== undefined) {
    return { data: hit, stale: false };
  }

  try {
    const res = await axios.get<T>(url, { timeout: 25000, validateStatus: () => true });
    const httpStatus = res.status;
    if (httpStatus === 404 || httpStatus >= 400) {
      throw new Error(`Alfa HTTP ${httpStatus}`);
    }
    const data = res.data;
    const bodyStatus = (data as { statusCode?: number })?.statusCode;
    if (typeof bodyStatus === 'number' && bodyStatus >= 400) {
      throw new Error(`Alfa error status ${bodyStatus}`);
    }
    alfaCache.set(key, data, ttl);
    staleFallback.set(key, data);
    return { data, stale: false };
  } catch (err) {
    const fallback = staleFallback.get(key);
    if (fallback !== undefined) {
      const reason: AlfaStaleReason = axios.isAxiosError(err)
        ? err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED'
          ? 'network'
          : err.response?.status === 429
            ? 'rate_limit'
            : 'server_error'
        : 'server_error';
      return { data: fallback as T, stale: true, staleReason: reason };
    }
    if (isPrivateProfileError(err)) {
      const e = new Error('LeetCode profile appears private or unavailable. Make your profile public to sync stats.');
      (e as Error & { code?: string }).code = 'PRIVATE_PROFILE';
      throw e;
    }
    throw err;
  }
}
