import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useNotificationStore } from '../store/notificationStore';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import { EmployeeLeaveBalance, getEmployeeLeaveBalances } from '../api/attendance';
import { FaGoogle, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa';
import { debounce, createCachedAPI } from '../utils/optimizedCache';

// Lazy load heavy components
const LeaveRequestModal = React.lazy(() => import('../components/LeaveRequestModal'));
const ScheduleModal = React.lazy(() => import('../components/ScheduleModal'));
const Toast = React.lazy(() => import('../components/Toast'));
const TwoFactorDialog = React.lazy(() => import('../components/TwoFactorDialog'));
const NotificationDrawer = React.lazy(() => import('../components/NotificationDrawer'));

// Gender-specific leave type codes
const GENDER_SPECIFIC_LEAVES = {
  FEMALE: ['ML', 'MATERNITY'], // Maternity leave codes
  MALE: ['PL', 'PATERNITY'],   // Paternity leave codes
};

interface DashboardProps {
  isManagerView?: boolean;
  onSwitchToManagerView?: () => void;
}

// Memoized components for better performance
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center">
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span>Processing...</span>
  </div>
));

const Dashboard: React.FC<DashboardProps> = ({ isManagerView = false, onSwitchToManagerView }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    checkIn, 
    checkOut, 
    requestLeave, 
    fetchAttendanceSummary, 
    fetchUserLeaves,
    attendanceSummary, 
    userLeaves,
    isLoading
  } = useAttendanceStore();

  const { 
    isInitialized, 
    isSignedIn, 
    initialize, 
    signIn,
    signOut
  } = useGoogleCalendar();
  
  const { fetchUserNotifications, unreadCount } = useNotificationStore();

  // State management
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [toast, setToast] = useState<{ 
    visible: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info';
    action?: () => void;
  }>({ 
    visible: false, 
    message: '', 
    type: 'info'
  });
  
  const [detailedLeaveBalances, setDetailedLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [userGender, setUserGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [twoFactorDialog, setTwoFactorDialog] = useState<{
    isOpen: boolean;
    action: 'checkin' | 'checkout';
    checkInTime?: string;
  }>({
    isOpen: false,
    action: 'checkin'
  });

  // Create cached API calls
  const cachedGetLeaveBalances = useMemo(
    () => createCachedAPI(getEmployeeLeaveBalances, 'leave-balances', 2 * 60 * 1000), // 2 minutes cache
    []
  );

  // Debounced functions for better performance
  const debouncedFetchData = useCallback(
    debounce(async () => {
      if (attendanceSummary?.employee_id) {
        try {
          const balances = await cachedGetLeaveBalances(attendanceSummary.employee_id);
          setDetailedLeaveBalances(balances);
        } catch (error) {
          console.error('Error fetching detailed leave balances:', error);
        }
      }
    }, 500),
    [attendanceSummary?.employee_id, cachedGetLeaveBalances]
  );

  // Optimized data loading with better error handling
  const loadInitialData = useCallback(async () => {
    try {
      const promises = [
        fetchAttendanceSummary(),
        fetchUserLeaves(),
        fetchUserNotifications()
      ];

      // Run in parallel for better performance
      await Promise.allSettled(promises);

      // Load leave balances after we have employee_id
      if (attendanceSummary?.employee_id) {
        debouncedFetchData();
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setToast({
        visible: true,
        message: 'Failed to load some data. Please refresh the page.',
        type: 'error'
      });
    }
  }, [fetchAttendanceSummary, fetchUserLeaves, fetchUserNotifications, attendanceSummary?.employee_id, debouncedFetchData]);

  // Optimized useEffect with cleanup
  useEffect(() => {
    loadInitialData();

    // Reduced polling frequency for better performance (increased from 30s to 60s)
    const intervalId = setInterval(loadInitialData, 60000);
    
    return () => clearInterval(intervalId);
  }, [loadInitialData]);

  // Memoized calculations
  const getLeaveGenderType = useCallback((balance: EmployeeLeaveBalance): 'MALE' | 'FEMALE' | null => {
    const leaveCode = balance.leave_type_id.leave_code.toUpperCase();
    
    if (GENDER_SPECIFIC_LEAVES.FEMALE.includes(leaveCode)) {
      return 'FEMALE';
    }
    if (GENDER_SPECIFIC_LEAVES.MALE.includes(leaveCode)) {
      return 'MALE';
    }
    return null;
  }, []);

  const filteredLeaveBalances = useMemo(() => {
    if (!detailedLeaveBalances.length) return [];
    
    return detailedLeaveBalances.filter(balance => {
      const genderType = getLeaveGenderType(balance);
      
      // If it's a gender-specific leave, check if it matches the user's gender
      if (genderType) {
        return genderType === userGender;
      }
      
      // Non-gender-specific leaves are available to all
      return true;
    });
  }, [detailedLeaveBalances, userGender, getLeaveGenderType]);

  // Memoized handlers
  const handleCheckIn = useCallback(async () => {
    try {
      await checkIn();
      setToast({
        visible: true,
        message: 'Successfully checked in!',
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        visible: true,
        message: error.message || 'Failed to check in',
        type: 'error'
      });
    }
  }, [checkIn]);

  const handleCheckOut = useCallback(async () => {
    try {
      await checkOut();
      setToast({
        visible: true,
        message: 'Successfully checked out!',
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        visible: true,
        message: error.message || 'Failed to check out',
        type: 'error'
      });
    }
  }, [checkOut]);

  const initiateCheckIn = useCallback(() => {
    setTwoFactorDialog({
      isOpen: true,
      action: 'checkin'
    });
  }, []);

  const initiateCheckOut = useCallback(() => {
    setTwoFactorDialog({
      isOpen: true,
      action: 'checkout',
      checkInTime: attendanceSummary?.lastCheckIn || undefined
    });
  }, [attendanceSummary?.lastCheckIn]);

  // Memoized components
  const renderCheckInOutButtons = useMemo(() => (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <button 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={initiateCheckIn}
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner /> : 'Check In'}
      </button>
      <button 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={initiateCheckOut}
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner /> : 'Check Out'}
      </button>
    </div>
  ), [isLoading, initiateCheckIn, initiateCheckOut]);

  // Simplified motion variants for better performance
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Employee Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.full_name || 'Employee'} {attendanceSummary?.employee_code && `- ${attendanceSummary.employee_code}`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Switch to Manager View Button - only shown when called from manager dashboard */}
          {isManagerView && onSwitchToManagerView && (
            <button
              onClick={onSwitchToManagerView}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-600 transition-colors text-sm font-medium flex items-center"
            >
              <FaExchangeAlt className="mr-2" />
              Switch to Manager View
            </button>
          )}
          
          {/* Other header buttons... */}
          <button
            className="px-4 py-2 flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSyncingGoogle}
          >
            <FaGoogle className="mr-2" />
            {isSyncingGoogle ? 'Connecting...' : isSignedIn ? 'Google Connected' : 'Connect Google'}
          </button>
          
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </motion.div>

      {/* Quick Actions Card with optimized rendering */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="col-span-1"
      >
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl overflow-hidden shadow-xl h-auto sm:h-64">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h3>
            
            {/* Check In/Out Buttons */}
            {renderCheckInOutButtons}
            
            {/* Other action buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
              <button 
                className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base"
                onClick={() => setIsLeaveModalOpen(true)}
              >
                Apply Leave
              </button>
              <button 
                className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base"
                onClick={() => setIsScheduleModalOpen(true)}
              >
                View Schedule
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lazy loaded components with Suspense */}
      <React.Suspense fallback={<div className="animate-pulse h-8 bg-gray-300 rounded"></div>}>
        {toast.visible && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.visible}
            onClose={() => setToast({ ...toast, visible: false })}
            duration={5000}
            action={toast.action}
          />
        )}

        {isLeaveModalOpen && (
          <LeaveRequestModal
            isOpen={isLeaveModalOpen}
            onClose={() => setIsLeaveModalOpen(false)}
            onSubmit={requestLeave}
          />
        )}

        {isScheduleModalOpen && (
          <ScheduleModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
          />
        )}

        {isNotificationDrawerOpen && (
          <NotificationDrawer
            isOpen={isNotificationDrawerOpen}
            onClose={() => setIsNotificationDrawerOpen(false)}
          />
        )}

        {twoFactorDialog.isOpen && (
          <TwoFactorDialog
            isOpen={twoFactorDialog.isOpen}
            action={twoFactorDialog.action}
            checkInTime={twoFactorDialog.checkInTime}
            onClose={() => setTwoFactorDialog(prev => ({ ...prev, isOpen: false }))}
            onConfirm={() => twoFactorDialog.action === 'checkin' ? handleCheckIn() : handleCheckOut()}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export default React.memo(Dashboard);
