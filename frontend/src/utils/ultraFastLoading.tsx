import React from 'react';

// Proper Service Worker registration
export const registerServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  try {
    // Create a proper service worker file
    const serviceWorkerScript = `
      const CACHE_NAME = 'attendance-system-v1';
      const STATIC_RESOURCES = [
        '/',
        '/static/js/main.js',
        '/static/css/main.css',
        '/favicon.ico'
      ];

      // Install event - cache essential resources
      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.addAll(STATIC_RESOURCES.filter(url => {
                // Only cache resources that actually exist
                return fetch(url, { method: 'HEAD' })
                  .then(response => response.ok)
                  .catch(() => false);
              }));
            })
            .then(() => self.skipWaiting())
            .catch(error => console.error('Cache installation failed:', error))
        );
      });

      // Activate event - cleanup old caches
      self.addEventListener('activate', (event) => {
        event.waitUntil(
          caches.keys()
            .then((cacheNames) => {
              return Promise.all(
                cacheNames
                  .filter((cacheName) => cacheName !== CACHE_NAME)
                  .map((cacheName) => caches.delete(cacheName))
              );
            })
            .then(() => self.clients.claim())
        );
      });

      // Fetch event - network first, then cache
      self.addEventListener('fetch', (event) => {
        if (event.request.method !== 'GET') return;
        
        // Skip cross-origin requests
        if (!event.request.url.startsWith(self.location.origin)) return;

        event.respondWith(
          fetch(event.request)
            .then((networkResponse) => {
              // If network request is successful, cache it
              if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              // Network failed, try cache
              return caches.match(event.request);
            })
        );
      });
    `;

    // Create and register service worker
    const blob = new Blob([serviceWorkerScript], { type: 'application/javascript' });
    const serviceWorkerUrl = URL.createObjectURL(blob);
    
    const registration = await navigator.serviceWorker.register(serviceWorkerUrl);
    console.log('🚀 Service Worker registered successfully:', registration);
    
    // Clean up the blob URL
    URL.revokeObjectURL(serviceWorkerUrl);
    
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

// Proper component preloader with error handling
export const preloadCriticalComponents = async (): Promise<void> => {
  const componentImports = [
    { name: 'Dashboard', loader: () => import('../pages/Dashboard') },
    { name: 'ManagerDashboard', loader: () => import('../pages/ManagerDashboard') },
    { name: 'AdminDashboard', loader: () => import('../pages/AdminDashboard') },
    { name: 'LeaveRequestModal', loader: () => import('../components/LeaveRequestModal') },
    { name: 'TwoFactorDialog', loader: () => import('../components/TwoFactorDialog') },
    { name: 'Toast', loader: () => import('../components/Toast') },
    { name: 'ScheduleModal', loader: () => import('../components/ScheduleModal') },
    { name: 'NotificationDrawer', loader: () => import('../components/NotificationDrawer') },
  ];

  const preloadPromises = componentImports.map(async ({ name, loader }) => {
    try {
      await loader();
      console.log(`✅ Preloaded: ${name}`);
      return { name, success: true };
    } catch (error) {
      console.warn(`⚠️ Failed to preload ${name}:`, error);
      return { name, success: false, error };
    }
  });

  const results = await Promise.allSettled(preloadPromises);
  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;
  
  console.log(`🔥 Component preloading complete: ${successful}/${componentImports.length} components loaded`);
};

// Ultra-fast image cache with proper error handling
class ImageCache {
  private cache = new Map<string, string>();
  private loading = new Map<string, Promise<string>>();

  async get(src: string): Promise<string> {
    // Return cached version if available
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    // Return existing promise if already loading
    if (this.loading.has(src)) {
      return this.loading.get(src)!;
    }

    // Create new loading promise
    const loadPromise = this.loadImage(src);
    this.loading.set(src, loadPromise);

    try {
      const result = await loadPromise;
      this.cache.set(src, result);
      return result;
    } finally {
      this.loading.delete(src);
    }
  }

  private loadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Cannot get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const base64 = canvas.toDataURL('image/webp', 0.8);
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error(`Image load timeout: ${src}`)), 10000);
    });
  }

  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const imageCache = new ImageCache();

// Critical CSS injection with validation
export const injectCriticalCSS = (css: string): void => {
  try {
    if (!css || typeof css !== 'string') {
      console.warn('Invalid CSS provided to injectCriticalCSS');
      return;
    }

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    
    // Insert at the beginning of head for highest priority
    const head = document.head || document.getElementsByTagName('head')[0];
    head.insertBefore(style, head.firstChild);
    
    console.log('✅ Critical CSS injected successfully');
  } catch (error) {
    console.error('Failed to inject critical CSS:', error);
  }
};

// Optimized critical CSS
const criticalCSS = `
  /* Ultra-fast skeleton loading */
  .ultra-fast-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 400% 100%;
    animation: ultra-fast-loading 1.2s ease-in-out infinite;
  }
  
  @keyframes ultra-fast-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Fast fade-in animation */
  .ultra-fast-fade-in {
    animation: ultra-fast-fade 0.15s ease-out;
  }
  
  @keyframes ultra-fast-fade {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Performance optimizations */
  .ultra-fast-container {
    contain: layout style paint;
    transform: translateZ(0);
    will-change: transform;
  }
  
  /* Prevent layout shifts */
  .ultra-fast-container * {
    will-change: auto;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Optimize fonts */
  body {
    font-display: swap;
  }
`;

// DNS prefetching with validation
const prefetchDNS = (domains: string[]): void => {
  domains.forEach(domain => {
    try {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
      console.log(`🔗 DNS prefetch added for: ${domain}`);
    } catch (error) {
      console.warn(`Failed to prefetch DNS for ${domain}:`, error);
    }
  });
};

// Resource hints for better performance
const addResourceHints = (): void => {
  const hints = [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: true },
  ];

  hints.forEach(hint => {
    try {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossOrigin) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    } catch (error) {
      console.warn(`Failed to add resource hint for ${hint.href}:`, error);
    }
  });
};

// Main initialization function
export const initializeUltraFastOptimizations = async (): Promise<void> => {
  console.log('⚡ Initializing ultra-fast optimizations...');
  
  try {
    // 1. Inject critical CSS immediately
    injectCriticalCSS(criticalCSS);
    
    // 2. Add resource hints
    addResourceHints();
    
    // 3. Prefetch DNS for common domains
    const apiDomains = ['localhost:5000', 'localhost:3000'];
    prefetchDNS(apiDomains);
    
    // 4. Register service worker
    await registerServiceWorker();
    
    // 5. Preload critical components (non-blocking)
    preloadCriticalComponents().catch(error => {
      console.warn('Component preloading had issues:', error);
    });
    
    console.log('✅ Ultra-fast optimizations initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize ultra-fast optimizations:', error);
  }
};

// React component for easy integration
export const UltraFastPreloader: React.FC = () => {
  React.useEffect(() => {
    const initialize = async () => {
      try {
        await initializeUltraFastOptimizations();
      } catch (error) {
        console.error('UltraFastPreloader initialization failed:', error);
      }
    };
    
    initialize();
  }, []);
  
  return null;
};
