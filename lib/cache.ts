/**
 * Client-side cache utilities for API responses (same pattern as chars)
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 хвилин

function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const item: CacheItem<T> = JSON.parse(cached);
    if (Date.now() >= item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.data;
  } catch {
    return null;
  }
}

function setCachedData<T>(
  key: string,
  data: T,
  duration: number = CACHE_DURATION
): void {
  if (typeof window === "undefined") return;

  try {
    const item: CacheItem<T> = {
      data,
      expiry: Date.now() + duration,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch {
    // ignore quota / private mode
  }
}

export async function cachedFetch<T>(
  url: string,
  cacheKey?: string,
  duration?: number
): Promise<T> {
  const key = cacheKey || `cache_${url}`;

  if (duration !== 0) {
    const cached = getCachedData<T>(key);
    if (cached) return cached;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data: T = await response.json();
  if (duration !== 0) {
    setCachedData(key, data, duration);
  }
  return data;
}

export const CACHE_KEYS = {
  PRODUCTS: "cache_products",
};

export function clearCachedData(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
