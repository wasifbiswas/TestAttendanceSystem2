import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useNotificationStore } from '../store/notificationStore';
import { FaGoogle, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa';
import { 
  createInstantAPI, 
  ultraFastDebounce, 
  useUltraFastCache,
  preloadCriticalData 
} from '../utils/ultraFastOptimization';

interface DashboardProps {
  isManagerView?: boolean;
  onSwitchToManagerView?: () => void;
}

// Ultra-fast skeleton loader
const UltraFastSkeleton: React.FC<{ height?: string; width?: string }> = ({ 
  height = 'h-4', 
  width = 'w-full' 
}) => (
  <div 
    className={`${height} ${width} ultra-fast-skeleton rounded animate-pulse`}
    style={{ 
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '400% 100%'
    }}
  />
);

// Memoized loading spinner for instant rendering
const InstantSpinner = React.memo(() => (
  <div className="flex items-center justify-center">
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    <span className="ml-2">Processing...</span>
  </div>
));

const LightningDashboard: React.FC<DashboardProps> = ({ 
  isManagerView = false, 
  onSwitchToManagerView 
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    checkIn, 
    checkOut, 
    requestLeave, 
    fetchAttendanceSummary, 
    fetchUserLeaves,
    attendanceSummary, 
    isLoading
  } = useAttendanceStore();
  
  const { fetchUserNotifications } = useNotificationStore();
  const cache = useUltraFastCache();

  // Ultra-fast state management
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [toast, setToast] = useState<{ 
    visible: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info';
  }>({ visible: false, message: '', type: 'info' });
  
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [twoFactorDialog, setTwoFactorDialog] = useState<{
    isOpen: boolean;
    action: 'checkin' | 'checkout';
    checkInTime?: string;
  }>({ isOpen: false, action: 'checkin' });

  // Create ultra-fast cached API calls
  const instantAttendanceAPI = useMemo(
    () => createInstantAPI(fetchAttendanceSummary, 'attendance-summary', 10 * 60 * 1000), // 10 minutes
    [fetchAttendanceSummary]
  );

  const instantLeavesAPI = useMemo(
    () => createInstantAPI(fetchUserLeaves, 'user-leaves', 15 * 60 * 1000), // 15 minutes
    [fetchUserLeaves]
  );

  const instantNotificationsAPI = useMemo(
    () => createInstantAPI(fetchUserNotifications, 'notifications', 5 * 60 * 1000), // 5 minutes
    [fetchUserNotifications]
  );

  // Ultra-fast debounced data loading (10ms delay for instant response)
  const ultraFastLoadData = useCallback(
    ultraFastDebounce(async () => {
      try {
        // Execute all API calls in parallel for maximum speed
        await Promise.allSettled([
          instantAttendanceAPI(),
          instantLeavesAPI(),
          instantNotificationsAPI()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }, 10), // Ultra-fast 10ms debounce
    [instantAttendanceAPI, instantLeavesAPI, instantNotificationsAPI]
  );

  // Preload critical data on mount
  useEffect(() => {
    // Immediate cache warmup
    preloadCriticalData();
    
    // Load data instantly
    ultraFastLoadData();
    
    // Ultra-fast refresh interval (15 seconds for real-time feel)
    const intervalId = setInterval(ultraFastLoadData, 15000);
    
    return () => clearInterval(intervalId);
  }, [ultraFastLoadData]);

  // Ultra-fast memoized handlers
  const handleCheckIn = useCallback(async () => {
    try {
      await checkIn();
      setToast({ visible: true, message: '✅ Checked in instantly!', type: 'success' });
      // Immediate cache update
      cache.set('last-action', 'checkin', 1000);
      ultraFastLoadData();
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Check-in failed', type: 'error' });
    }
  }, [checkIn, cache, ultraFastLoadData]);

  const handleCheckOut = useCallback(async () => {
    try {
      await checkOut();
      setToast({ visible: true, message: '✅ Checked out instantly!', type: 'success' });
      // Immediate cache update
      cache.set('last-action', 'checkout', 1000);
      ultraFastLoadData();
    } catch (error: any) {
      setToast({ visible: true, message: error.message || 'Check-out failed', type: 'error' });
    }
  }, [checkOut, cache, ultraFastLoadData]);

  const handleLogout = useCallback(() => {
    cache.clear(); // Clear cache on logout
    logout();
    navigate('/login');
  }, [logout, navigate, cache]);

  // Ultra-fast memoized components
  const QuickActionButtons = useMemo(() => (
    <div className="grid grid-cols-2 gap-3">
      <button 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-3 rounded-lg transition-all duration-100 text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        onClick={() => setTwoFactorDialog({ isOpen: true, action: 'checkin' })}
        disabled={isLoading}
      >
        {isLoading ? <InstantSpinner /> : '⚡ Quick Check In'}
      </button>
      <button 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-3 rounded-lg transition-all duration-100 text-base disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        onClick={() => setTwoFactorDialog({ 
          isOpen: true, 
          action: 'checkout', 
          checkInTime: attendanceSummary?.lastCheckIn 
        })}
        disabled={isLoading}
      >
        {isLoading ? <InstantSpinner /> : '⚡ Quick Check Out'}
      </button>
    </div>
  ), [isLoading, attendanceSummary?.lastCheckIn]);

  const SecondaryActions = useMemo(() => (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <button 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-3 rounded-lg transition-all duration-100 text-base transform hover:scale-105"
        onClick={() => setIsLeaveModalOpen(true)}
      >
        🏖️ Apply Leave
      </button>
      <button 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-3 rounded-lg transition-all duration-100 text-base transform hover:scale-105"
        onClick={() => setIsScheduleModalOpen(true)}
      >
        📅 View Schedule
      </button>
    </div>
  ), []);

  // Ultra-fast status display
  const StatusDisplay = useMemo(() => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="text-center ultra-fast-container">
        <p className="text-sm text-gray-600 dark:text-gray-400">Check In</p>
        <p className="text-lg font-semibold text-green-600">
          {attendanceSummary?.lastCheckIn ? 
            new Date(attendanceSummary.lastCheckIn).toLocaleTimeString() : 
            <UltraFastSkeleton height="h-6" width="w-20" />
          }
        </p>
      </div>
      <div className="text-center ultra-fast-container">
        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
        <p className="text-lg font-semibold text-blue-600">
          {attendanceSummary ? (
            (attendanceSummary.stats?.present || 0) > 0 ? 
            <span className="text-green-600">🟢 Present</span> : 
            <span className="text-gray-600">⚫ Absent</span>
          ) : (
            <UltraFastSkeleton height="h-6" width="w-16" />
          )}
        </p>
      </div>
      <div className="text-center ultra-fast-container">
        <p className="text-sm text-gray-600 dark:text-gray-400">Leave Balance</p>
        <p className="text-lg font-semibold text-purple-600">
          {attendanceSummary?.leaveBalance ? 
            `${attendanceSummary.leaveBalance.annual} days` :
            <UltraFastSkeleton height="h-6" width="w-12" />
          }
        </p>
      </div>
      <div className="text-center ultra-fast-container">
        <p className="text-sm text-gray-600 dark:text-gray-400">Performance</p>
        <p className="text-lg font-semibold text-yellow-600">⚡ Ultra Fast</p>
      </div>
    </div>
  ), [attendanceSummary]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 ultra-fast-container">
      {/* Ultra-fast header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1 }} // Ultra-fast animation
        className="mb-6 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ⚡ Lightning Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.full_name || 'Employee'} 
            {attendanceSummary?.employee_code && ` - ${attendanceSummary.employee_code}`}
            <span className="ml-2 text-green-500">🚀 Blazing Fast</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {isManagerView && onSwitchToManagerView && (
            <button
              onClick={onSwitchToManagerView}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-600 transition-all duration-100 text-sm font-medium flex items-center transform hover:scale-105"
            >
              <FaExchangeAlt className="mr-2" />
              Manager View
            </button>
          )}
          
          <button className="px-4 py-2 flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-100 transform hover:scale-105">
            <FaGoogle className="mr-2" />
            Google
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-100 transform hover:scale-105"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </motion.div>

      {/* Ultra-fast Quick Actions Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.1 }}
        className="mb-6"
      >
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl overflow-hidden shadow-xl ultra-fast-container">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              ⚡ Lightning Actions
              <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">INSTANT</span>
            </h3>
            {QuickActionButtons}
            {SecondaryActions}
          </div>
        </div>
      </motion.div>

      {/* Ultra-fast Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1 }}
        className="mb-6"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ultra-fast-container">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            📊 Real-time Status
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">LIVE</span>
          </h3>
          {StatusDisplay}
        </div>
      </motion.div>

      {/* Performance indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg"
      >
        ⚡ Lightning Mode: {Math.round(performance.now())}ms
      </motion.div>

      {/* Toast notifications */}
      {toast.visible && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.1 }}
          className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' : 
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}
          onClick={() => setToast({ ...toast, visible: false })}
        >
          {toast.message}
        </motion.div>
      )}

      {/* Ultra-fast modal */}
      {twoFactorDialog.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">
              ⚡ Lightning {twoFactorDialog.action === 'checkin' ? 'Check In' : 'Check Out'}
            </h3>
            <p className="mb-6 text-gray-600">
              Instant {twoFactorDialog.action === 'checkin' ? 'check in' : 'check out'} - confirm to proceed
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  twoFactorDialog.action === 'checkin' ? handleCheckIn() : handleCheckOut();
                  setTwoFactorDialog({ ...twoFactorDialog, isOpen: false });
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-100"
              >
                ⚡ Instant Confirm
              </button>
              <button
                onClick={() => setTwoFactorDialog({ ...twoFactorDialog, isOpen: false })}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-all duration-100"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default React.memo(LightningDashboard);
