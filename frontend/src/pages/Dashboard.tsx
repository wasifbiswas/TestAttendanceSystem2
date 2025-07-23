import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useNotificationStore } from '../store/notificationStore';
import { FaGoogle, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa';
import { 
  createInstantAPI, 
  instantCache, 
  ultraFastDebounce, 
  preloadCriticalData,
  useAggressiveCacheStore 
} from '../utils/ultraFastCache';

interface UltraFastDashboardProps {
  isManagerView?: boolean;
  onSwitchToManagerView?: () => void;
}

// Pre-load components immediately without lazy loading for critical path
const QuickActions = React.memo(() => {
  const { checkIn, checkOut, isLoading } = useAttendanceStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickCheckIn = useCallback(async () => {
    setIsProcessing(true);
    try {
      await checkIn();
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [checkIn]);

  const handleQuickCheckOut = useCallback(async () => {
    setIsProcessing(true);
    try {
      await checkOut();
    } catch (error) {
      console.error('Check-out failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [checkOut]);

  return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-3 rounded-lg transition-all duration-150 disabled:opacity-50"
          onClick={handleQuickCheckIn}
          disabled={isLoading || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Check In'}
        </button>
        <button 
          className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-3 rounded-lg transition-all duration-150 disabled:opacity-50"
          onClick={handleQuickCheckOut}
          disabled={isLoading || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Check Out'}
        </button>
      </div>
    </div>
  );
});

// Ultra-fast status display with cached data
const StatusDisplay = React.memo(() => {
  const { attendanceSummary } = useAttendanceStore();
  const [cachedStatus, setCachedStatus] = useState(null);

  useEffect(() => {
    // Try to get cached status immediately
    const cached = instantCache.get('attendance-status');
    if (cached) {
      setCachedStatus(cached);
    }
  }, []);

  const displayData = attendanceSummary || cachedStatus;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Status</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Check In</p>
          <p className="text-lg font-semibold text-green-600">
            {displayData?.lastCheckIn ? 
              new Date(displayData.lastCheckIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
              '--:--'
            }
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
          <p className="text-lg font-semibold text-blue-600">
            {(displayData?.stats?.present || 0) > 0 ? 'Present' : 'Absent'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Leave Balance</p>
          <p className="text-lg font-semibold text-orange-600">
            {displayData?.leaveBalance?.annual || 0} days
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
          <p className="text-lg font-semibold text-purple-600">
            {displayData?.stats?.present || 0} days
          </p>
        </div>
      </div>
    </div>
  );
});

const UltraFastDashboard: React.FC<UltraFastDashboardProps> = ({ 
  isManagerView = false, 
  onSwitchToManagerView 
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { fetchAttendanceSummary, attendanceSummary } = useAttendanceStore();
  const { fetchUserNotifications } = useNotificationStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  // Ultra-fast API calls with instant caching
  const cachedFetchAttendance = useMemo(
    () => createInstantAPI(fetchAttendanceSummary, 'attendance-summary'),
    [fetchAttendanceSummary]
  );

  const cachedFetchNotifications = useMemo(
    () => createInstantAPI(fetchUserNotifications, 'user-notifications'),
    [fetchUserNotifications]
  );

  // Ultra-fast debounced data loading
  const ultraFastLoadData = useCallback(
    ultraFastDebounce(async () => {
      try {
        // Load from cache first, then update if needed
        const cached = useAggressiveCacheStore.getState().get('dashboard-data');
        if (cached) {
          setIsInitialized(true);
          return;
        }

        // Batch load critical data
        await Promise.allSettled([
          cachedFetchAttendance(),
          cachedFetchNotifications()
        ]);

        // Cache the loaded state
        useAggressiveCacheStore.getState().set('dashboard-data', { loaded: true }, 5 * 60 * 1000);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setIsInitialized(true); // Show UI even if data loading fails
      }
    }, 50), // Ultra-short 50ms debounce
    [cachedFetchAttendance, cachedFetchNotifications]
  );

  // Initialize immediately on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      
      // Start preloading critical data immediately
      preloadCriticalData().catch(console.error);
      
      // Load dashboard data with ultra-fast debounce
      ultraFastLoadData();
    }
  }, [ultraFastLoadData]);

  // Memoized handlers for instant response
  const handleLogout = useCallback(() => {
    // Clear caches on logout
    instantCache.clear();
    useAggressiveCacheStore.getState().clear();
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const handleSwitchToManager = useCallback(() => {
    if (onSwitchToManagerView) {
      onSwitchToManagerView();
    }
  }, [onSwitchToManagerView]);

  // Show loading only for the first 100ms
  if (!isInitialized) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-300 rounded mb-6"></div>
          <div className="h-48 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Header - Renders immediately */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Employee Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.full_name || 'Employee'} 
            {attendanceSummary?.employee_code && ` - ${attendanceSummary.employee_code}`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Switch to Manager View Button */}
          {isManagerView && onSwitchToManagerView && (
            <button
              onClick={handleSwitchToManager}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-600 transition-colors text-sm font-medium flex items-center"
            >
              <FaExchangeAlt className="mr-2" />
              Switch to Manager View
            </button>
          )}
          
          {/* Google Calendar Button */}
          <button className="px-4 py-2 flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            <FaGoogle className="mr-2" />
            Connect Google
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Left Column */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Status Display - Right Columns */}
        <div className="lg:col-span-2">
          <StatusDisplay />
        </div>
      </div>

      {/* Additional Quick Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Present Days</p>
              <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                {attendanceSummary?.stats?.present || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Absent Days</p>
              <p className="text-lg font-semibold text-red-900 dark:text-red-100">
                {attendanceSummary?.stats?.absent || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Late Days</p>
              <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                {attendanceSummary?.stats?.late || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Leave Days</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {attendanceSummary?.stats?.leaves || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(UltraFastDashboard);
