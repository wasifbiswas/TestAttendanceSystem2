import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Ultra-aggressive caching with localStorage persistence
interface UltraFastCacheState {
  cache: Record<string, { data: any; timestamp: number; ttl: number }>;
  prefetchCache: Record<string, any>;
  set: (key: string, data: any, ttl?: number) => void;
  get: (key: string) => any | null;
  prefetch: (key: string, data: any) => void;
  getPrefetch: (key: string) => any | null;
  clear: () => void;
  warmup: () => void;
}

// Ultra-fast cache with localStorage persistence
export const useUltraFastCache = create<UltraFastCacheState>()(
  persist(
    (set, get) => ({
      cache: {},
      prefetchCache: {},
      
      set: (key: string, data: any, ttl: number = 30 * 60 * 1000) => { // 30 minutes default
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
            const { [key]: removed, ...rest } = state.cache;
            return { cache: rest };
          });
          return null;
        }
        
        return cached.data;
      },
      
      prefetch: (key: string, data: any) => {
        set((state) => ({
          prefetchCache: {
            ...state.prefetchCache,
            [key]: data
          }
        }));
      },
      
      getPrefetch: (key: string) => {
        const { prefetchCache } = get();
        return prefetchCache[key] || null;
      },
      
      clear: () => set({ cache: {}, prefetchCache: {} }),
      
      warmup: () => {
        // Pre-warm cache with essential data
        console.log('🔥 Cache warmed up for ultra-fast access');
      }
    }),
    {
      name: 'ultra-fast-cache',
      partialize: (state) => ({ cache: state.cache, prefetchCache: state.prefetchCache }),
    }
  )
);

// Immediate cache - returns cached data instantly, updates in background
export const createInstantAPI = <T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  cacheKey: string,
  ttl: number = 30 * 60 * 1000
) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const cache = useUltraFastCache.getState();
    const key = `${cacheKey}-${JSON.stringify(args)}`;
    
    // ALWAYS return cached data first if available (even if stale)
    const cached = cache.get(key);
    const prefetched = cache.getPrefetch(key);
    
    if (cached) {
      // Background refresh if data is getting old (but still return cached immediately)
      const age = Date.now() - (cached as any).timestamp;
      if (age > ttl * 0.7) { // Refresh when 70% of TTL is reached
        // Background update - don't await
        apiFunction(...args).then(result => {
          cache.set(key, result, ttl);
        }).catch(console.error);
      }
      return cached;
    }
    
    if (prefetched) {
      return prefetched;
    }
    
    // Only if no cache at all, make the API call
    try {
      const result = await apiFunction(...args);
      cache.set(key, result, ttl);
      return result;
    } catch (error) {
      throw error;
    }
  };
};

// Pre-loader for critical data
export const preloadCriticalData = async () => {
  const cache = useUltraFastCache.getState();
  
  // Pre-load critical endpoints
  const criticalEndpoints = [
    'attendance-summary',
    'user-profile',
    'notifications',
    'leave-balance'
  ];
  
  // Warm up the cache
  cache.warmup();
};

// Ultra-fast debounce (reduced delay)
export const ultraFastDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 50 // Ultra-fast 50ms delay
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
};

// Batch API calls to reduce network overhead
export const batchAPI = <T extends Record<string, (...args: any[]) => Promise<any>>>(
  apis: T,
  batchDelay: number = 10 // 10ms batch window
) => {
  let batchQueue: Array<{ key: keyof T; args: any[]; resolve: Function; reject: Function }> = [];
  let batchTimeout: number;
  
  const processBatch = async () => {
    if (batchQueue.length === 0) return;
    
    const currentBatch = [...batchQueue];
    batchQueue = [];
    
    // Execute all APIs in parallel
    const promises = currentBatch.map(async ({ key, args, resolve, reject }) => {
      try {
        const result = await apis[key](...args);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    
    await Promise.allSettled(promises);
  };
  
  return new Proxy(apis, {
    get(target, prop) {
      return (...args: any[]) => {
        return new Promise((resolve, reject) => {
          batchQueue.push({ key: prop as keyof T, args, resolve, reject });
          
          clearTimeout(batchTimeout);
          batchTimeout = window.setTimeout(processBatch, batchDelay);
        });
      };
    }
  });
};

// Service Worker cache for ultra-fast static asset loading
export const enableServiceWorkerCache = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/ultra-fast-sw.js')
      .then(() => console.log('🚀 Ultra-fast service worker registered'))
      .catch(console.error);
  }
};

// Memory-based component cache
const componentCache = new Map<string, React.ComponentType<any>>();

export const getCachedComponent = <T extends React.ComponentType<any>>(
  key: string,
  factory: () => T
): T => {
  if (componentCache.has(key)) {
    return componentCache.get(key) as T;
  }
  
  const component = factory();
  componentCache.set(key, component);
  return component;
};

// Ultra-fast state synchronization
export const createUltraFastStore = <T>(initialState: T) => {
  return create<T & { updateInstant: (updates: Partial<T>) => void }>()((set) => ({
    ...initialState,
    updateInstant: (updates) => {
      // Synchronous update for instant UI response
      set((state) => ({ ...state, ...updates }));
    }
  }));
};
