import NodeCache from 'node-cache';

/** In-memory cache for Alfa JSON responses (TTL per key). */
export const alfaResponseCache = new NodeCache({
  stdTTL: 600,
  checkperiod: 120,
  useClones: false,
});

export function alfaCacheGet<T>(key: string): T | undefined {
  return alfaResponseCache.get<T>(key);
}

export function alfaCacheSet<T>(key: string, value: T, ttlSeconds: number): boolean {
  return alfaResponseCache.set(key, value, ttlSeconds);
}
