import { preloadCriticalData, startBackgroundRefresh, instantCache } from '../utils/ultraFastCache';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useNotificationStore } from '../store/notificationStore';

// Simple ultra-fast initialization
export const initializeUltraFastApp = async () => {
  console.log('🚀 Initializing Ultra-Fast App...');
  
  const startTime = performance.now();
  
  try {
    // Start background processes
    startBackgroundRefresh();
    
    // Preload critical data
    await preloadCriticalData();
    
    // Initialize stores if user is authenticated
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      const { fetchAttendanceSummary } = useAttendanceStore.getState();
      const { fetchUserNotifications } = useNotificationStore.getState();
      
      // Load in background without blocking
      Promise.allSettled([
        fetchAttendanceSummary(),
        fetchUserNotifications()
      ]);
    }
    
    // Pre-warm caches
    const dummyAttendance = {
      stats: { present: 0, absent: 0, late: 0, leaves: 0 },
      leaveBalance: { annual: 0, sick: 0, casual: 0 },
      lastCheckIn: null
    };
    
    instantCache.set('attendance-summary', dummyAttendance);
    instantCache.set('user-notifications', []);
    instantCache.set('dashboard-data', { loaded: true });
    
    const endTime = performance.now();
    console.log(`✅ Ultra-Fast App initialized in ${(endTime - startTime).toFixed(2)}ms`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Ultra-Fast App:', error);
    return false;
  }
};

// Network optimization
export const optimizeNetwork = () => {
  if (typeof window !== 'undefined') {
    // Preconnect to API endpoints
    const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = apiOrigin;
    document.head.appendChild(link);
  }
};

// Setup ultra-fast mode
export const setupUltraFastMode = async () => {
  console.log('⚡ Setting up Ultra-Fast Mode...');
  
  optimizeNetwork();
  await initializeUltraFastApp();
  
  console.log('🎯 Ultra-Fast Mode activated!');
  
  // Clean up on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      instantCache.clear();
    });
  }
};
