/**
 * QueryCache
 * A production-grade caching layer with memory and sessionStorage persistence.
 * Includes request deduplication to prevent redundant API calls.
 */
class QueryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  private inFlight = new Map<string, Promise<any>>();
  private PREFIX = 'qc_';

  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
          if (now > item.expiry) {
            this.cache.delete(key);
          }
        }
      }, 60000);
    }
  }

  /**
   * Retrieves data from memory or sessionStorage if not expired.
   */
  get(key: string) {
    const storageKey = this.PREFIX + key;
    
    // 1. Check memory cache
    const item = this.cache.get(key);
    if (item) {
      if (Date.now() < item.expiry) return item.data;
      this.cache.delete(key);
    }

    // 2. Fallback to sessionStorage
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() < parsed.expiry) {
          // Hydrate memory cache for faster subsequent access
          this.cache.set(key, parsed);
          return parsed.data;
        }
        sessionStorage.removeItem(storageKey);
      }
    } catch (e) {
      // Ignore storage errors (e.g. quota exceeded)
    }

    return null;
  }

  /**
   * Stores data in memory and sessionStorage with a TTL.
   */
  set(key: string, data: any, ttl = 300000) {
    const storageKey = this.PREFIX + key;
    const item = {
      data,
      expiry: Date.now() + ttl
    };

    this.cache.set(key, item);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(item));
    } catch (e) {
      // Handle quota errors silently
    }
  }

  /**
   * Deduplicates in-flight requests and caches the result.
   * @param force If true, bypasses the cache and fetches fresh data.
   */
  async fetchWithDedup(key: string, fn: () => Promise<any>, ttl = 300000, force = false) {
    // 1. Check if we already have a valid cached version (unless forced)
    if (!force) {
      const cached = this.get(key);
      if (cached !== null) return cached;
    }

    // 2. Check if a request for this key is already in progress
    if (this.inFlight.has(key)) return this.inFlight.get(key);

    // 3. Create the promise and track it
    const promise = fn()
      .then(data => {
        this.set(key, data, ttl);
        return data;
      })
      .finally(() => {
        // Cleanup: remove from in-flight map as soon as resolved/rejected
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Manually invalidates a specific cache entry.
   */
  invalidate(key: string) {
    const storageKey = this.PREFIX + key;
    this.cache.delete(key);
    sessionStorage.removeItem(storageKey);
  }

  /**
   * Invalidates all keys starting with a given prefix.
   */
  invalidateByPrefix(prefix: string) {
    // 1. Clear from memory
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
    
    // 2. Clear from sessionStorage
    const storagePrefix = this.PREFIX + prefix;
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(storagePrefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Clears all cache entries managed by this utility.
   */
  clear() {
    this.cache.clear();
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

export const queryCache = new QueryCache();
