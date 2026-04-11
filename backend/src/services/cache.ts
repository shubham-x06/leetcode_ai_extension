import NodeCache from 'node-cache';

const nodeCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export function getCache<T>(key: string): T | undefined {
  return nodeCache.get<T>(key);
}

export function setCache<T>(key: string, value: T, ttlSeconds?: number): void {
  if (ttlSeconds !== undefined) {
    nodeCache.set(key, value, ttlSeconds);
  } else {
    nodeCache.set(key, value);
  }
}

export function deleteCache(key: string): void {
  nodeCache.del(key);
}