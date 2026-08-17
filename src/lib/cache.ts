// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export function getCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.timestamp + item.ttl) {
    cache.delete(key);
    return null;
  }
  
  return item.data as T;
}

export function setCache<T>(key: string, data: T, ttl: number = 300000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  });
}

export function clearCache(pattern?: string): void {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

// Cache key generators
export const cacheKeys = {
  categories: () => 'categories',
  providers: (filters?: string) => `providers:${filters || 'all'}`,
  providerProfile: (slug: string) => `provider:${slug}`,
  portfolioItems: (providerId: string) => `portfolio:${providerId}`,
  reviews: (providerId: string) => `reviews:${providerId}`,
};
