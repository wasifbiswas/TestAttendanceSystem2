import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AggressiveCacheState {
  cache: Record<string, { data: any; timestamp: number; ttl: number }>;
  set: (key: string, data: any, ttl?: number) => void;
  get: (key: string) => any | null;
  clear: () => void;
  clearExpired: () => void;
  preload: (key: string, dataLoader: () => Promise<any>, ttl?: number) => Promise<void>;
}

// Aggressive caching with 15-minute TTL and persistence
export const useAggressiveCacheStore = create<AggressiveCacheState>()(
  persist(
    (set, get) => ({
      cache: {},
      
      set: (key: string, data: any, ttl: number = 15 * 60 * 1000) => { // 15 minutes default
        const timestamp = Date.now();
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: { data, timestamp, ttl }
          }
        }));
      },
      
      get: (key: string) => {
        const { cache } = get();
        const cached = cache[key];
        
        if (!cached) return null;
        
        // Check if cache has expired
        if (Date.now() - cached.timestamp > cached.ttl) {
          // Remove expired item
          set((state) => {
            const newCache = { ...state.cache };
            delete newCache[key];
            return { cache: newCache };
          });
          return null;
        }
        
        return cached.data;
      },
      
      clear: () => set({ cache: {} }),
      
      clearExpired: () => {
        const now = Date.now();
        set((state) => {
          const newCache: Record<string, any> = {};
          Object.entries(state.cache).forEach(([key, value]) => {
            if (now - value.timestamp <= value.ttl) {
              newCache[key] = value;
            }
          });
          return { cache: newCache };
        });
      },

      // Preload data for instant access
      preload: async (key: string, dataLoader: () => Promise<any>, ttl?: number) => {
        try {
          const data = await dataLoader();
          get().set(key, data, ttl);
        } catch (error) {
          console.error(`Failed to preload ${key}:`, error);
        }
      }
    }),
    {
      name: 'aggressive-cache-storage',
      version: 1,
    }
  )
);

// Ultra-fast debounce with immediate execution for first call
export const ultraFastDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 100 // Much shorter delay
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  let isFirstCall = true;
  
  return (...args: Parameters<T>) => {
    if (isFirstCall) {
      isFirstCall = false;
      func(...args);
      return;
    }
    
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

// Instant cache with memory storage for frequently accessed data
class InstantCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly maxSize = 100; // Limit memory usage
  
  set(key: string, data: any) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  
  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Update timestamp for LRU
    this.cache.delete(key);
    this.cache.set(key, cached);
    
    return cached.data;
  }
  
  clear() {
    this.cache.clear();
  }
}

export const instantCache = new InstantCache();

// Create ultra-fast cached API wrapper
export const createInstantAPI = <T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  cacheKey: string,
  useInstantCache: boolean = true
) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = `${cacheKey}-${JSON.stringify(args)}`;
    
    // Try instant cache first
    if (useInstantCache) {
      const instantResult = instantCache.get(key);
      if (instantResult) {
        return instantResult;
      }
    }
    
    // Try persistent cache
    const persistentResult = useAggressiveCacheStore.getState().get(key);
    if (persistentResult) {
      // Also store in instant cache for next time
      if (useInstantCache) {
        instantCache.set(key, persistentResult);
      }
      return persistentResult;
    }
    
    // If not in cache, make API call
    try {
      const result = await apiFunction(...args);
      
      // Store in both caches
      useAggressiveCacheStore.getState().set(key, result);
      if (useInstantCache) {
        instantCache.set(key, result);
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };
};

// Preload critical data on app start
export const preloadCriticalData = async () => {
  const cache = useAggressiveCacheStore.getState();
  
  // Define critical data to preload
  const criticalAPIs = [
    {
      key: 'attendance-summary',
      loader: async () => {
        const { getAttendanceSummary } = await import('../api/attendance');
        return getAttendanceSummary();
      }
    },
    {
      key: 'user-notifications',
      loader: async () => {
        const { getUserNotifications } = await import('../api/notification');
        return getUserNotifications(1, 10);
      }
    }
  ];
  
  // Preload all critical APIs in parallel
  await Promise.allSettled(
    criticalAPIs.map(({ key, loader }) => 
      cache.preload(key, loader, 10 * 60 * 1000) // 10 minutes cache
    )
  );
};

// Background refresh for stale data
export const startBackgroundRefresh = () => {
  setInterval(() => {
    useAggressiveCacheStore.getState().clearExpired();
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // Preload critical data every 8 minutes
  setInterval(() => {
    preloadCriticalData().catch(console.error);
  }, 8 * 60 * 1000);
};

// Batch API calls to reduce network requests
export const batchAPI = <T extends (...args: any[]) => Promise<any>>(
  apiCalls: Array<{ fn: T; args: Parameters<T>; key: string }>
): Promise<Record<string, Awaited<ReturnType<T>>>> => {
  return new Promise(async (resolve) => {
    const results: Record<string, any> = {};
    
    // Execute all API calls in parallel
    const promises = apiCalls.map(async ({ fn, args, key }) => {
      try {
        results[key] = await fn(...args);
      } catch (error) {
        console.error(`Batch API call failed for ${key}:`, error);
        results[key] = null;
      }
    });
    
    await Promise.allSettled(promises);
    resolve(results);
  });
};
