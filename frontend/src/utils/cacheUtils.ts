import { create } from 'zustand';

interface CacheState {
  cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  set: (key: string, data: any, ttl?: number) => void;
  get: (key: string) => any | null;
  clear: () => void;
  clearExpired: () => void;
}

// Create a cache store for API responses (simplified without persistence for Map)
export const useCacheStore = create<CacheState>()((set, get) => ({
  cache: new Map(),
  
  set: (key: string, data: any, ttl: number = 5 * 60 * 1000) => { // 5 minutes default
    const timestamp = Date.now();
    set((state) => ({
      cache: new Map(state.cache).set(key, { data, timestamp, ttl })
    }));
  },
  
  get: (key: string) => {
    const { cache } = get();
    const cached = cache.get(key);
    
    if (!cached) return null;
    
    // Check if cache has expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      // Remove expired item
      set((state) => {
        const newCache = new Map(state.cache);
        newCache.delete(key);
        return { cache: newCache };
      });
      return null;
    }
    
    return cached.data;
  },
  
  clear: () => set({ cache: new Map() }),
  
  clearExpired: () => {
    const now = Date.now();
    set((state) => {
      const newCache = new Map();
      state.cache.forEach((value, key) => {
        if (now - value.timestamp <= value.ttl) {
          newCache.set(key, value);
        }
      });
      return { cache: newCache };
    });
  }
}));

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

// Create cached API wrapper
export const createCachedAPI = <T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  cacheKey: string,
  ttl?: number
) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const cache = useCacheStore.getState();
    const key = `${cacheKey}-${JSON.stringify(args)}`;
    
    // Try to get from cache first
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }
    
    // If not in cache, make API call
    try {
      const result = await apiFunction(...args);
      cache.set(key, result, ttl);
      return result;
    } catch (error) {
      throw error;
    }
  };
};
