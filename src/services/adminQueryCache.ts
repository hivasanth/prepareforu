/**
 * Admin query cache with SWR support, persistence, and cross-tab invalidation.
 * Local Map handles SWR stale-data revalidation;
 * queryCache provides sessionStorage persistence + request dedup.
 */

import { queryCache } from '../utils/queryCache';
import { logError } from '../utils/logger';

const ADMIN_TTL = 60000; // 60 seconds

// Local Map for SWR stale-data revalidation
const swrCache = new Map<string, { data: unknown; time: number }>();

/**
 * Retrieves a fresh-only value (returns null if expired or missing).
 */
export function getCache<T>(key: string): T | null {
  const entry = swrCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > ADMIN_TTL) {
    swrCache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Stale-while-revalidate: returns data even if TTL expired.
 */
export function getCacheSWR<T>(key: string): { data: T; stale: boolean } | null {
  const entry = swrCache.get(key);
  if (!entry) {
    const persisted = queryCache.get(key) as T | null;
    if (persisted) {
      swrCache.set(key, { data: persisted, time: Date.now() });
      return { data: persisted, stale: false };
    }
    return null;
  }
  const stale = Date.now() - entry.time > ADMIN_TTL;
  return { data: entry.data as T, stale };
}

/**
 * Stores data in both local SWR cache and persisted query cache.
 */
export function setCache<T>(key: string, data: T): void {
  swrCache.set(key, { data, time: Date.now() });
  queryCache.set(key, data, ADMIN_TTL);
}

/**
 * Invalidates all cached admin data and dispatches cross-tab invalidation event.
 */
export function invalidateCache(): void {
  swrCache.clear();
  queryCache.clear();
  try {
    window.dispatchEvent(new CustomEvent('admin:cache-invalidated'));
  } catch (e) {
    logError('adminQueryCache.invalidateCache.error', { message: (e as Error).message });
  }
}
