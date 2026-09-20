export type CacheEntry<T> = {expires: number; value: T};

export type AssistCache<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs: number): void;
  clear(): void;
};

/** Process-local cache. Enough for the unpaid baseline; resets on cold start. */
export function createMemoryCache<T>(): AssistCache<T> {
  const store = new Map<string, CacheEntry<T>>();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expires <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value, ttlMs) {
      store.set(key, {expires: Date.now() + ttlMs, value});
    },
    clear() {
      store.clear();
    },
  };
}

/**
 * Durable cache hook. When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are both set, a future adapter can swap this for Redis. Until then the
 * baseline stays in-memory and does not require a paid store.
 */
export function createAssistCache<T>(): AssistCache<T> {
  const durable = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (durable) {
    // Reserved: implement Upstash get/set here without changing Jev call sites.
  }
  return createMemoryCache();
}
