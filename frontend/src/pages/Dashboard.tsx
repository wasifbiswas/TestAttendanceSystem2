import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useNotificationStore } from '../store/notificationStore';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import LeaveRequestModal from '../components/LeaveRequestModal';
import ScheduleModal from '../components/ScheduleModal';
import Toast from '../components/Toast';
import TwoFactorDialog from '../components/TwoFactorDialog';
import { EmployeeLeaveBalance, getEmployeeLeaveBalances, cancelLeaveRequest } from '../api/attendance';
import RecentLeaves from '../components/RecentLeaves';
import NotificationDrawer from '../components/NotificationDrawer';
import { FaSync, FaVenus, FaMars, FaBell, FaGoogle, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa';

// Gender-specific leave type codes
const GENDER_SPECIFIC_LEAVES = {
  FEMALE: ['ML', 'MATERNITY'], // Maternity leave codes
  MALE: ['PL', 'PATERNITY'],   // Paternity leave codes
};

interface DashboardProps {
  isManagerView?: boolean;
  onSwitchToManagerView?: () => void;
}

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
  // State for modals and notifications
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
  
  // New state for detailed leave balances and gender
  const [detailedLeaveBalances, setDetailedLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [userGender, setUserGender] = useState<'MALE' | 'FEMALE' | null>(null);
  // We don't need this state anymore since we removed the leave status tracking functionality
  
    // Add a new state for tracking refresh animation
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  // Add state for notification drawer
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  // Add state for Google Calendar sync
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);  // Add state for Two-Factor Authentication dialog
  const [twoFactorDialog, setTwoFactorDialog] = useState<{
    isOpen: boolean;
    action: 'checkin' | 'checkout';
    checkInTime?: string;
  }>({
    isOpen: false,
    action: 'checkin'
  });
  // We don't need leave status tracking anymore, but we could log leaves if needed
  useEffect(() => {
    if (userLeaves && userLeaves.length > 0) {
      console.debug(`User has ${userLeaves.length} leave requests in the system`);
    }
  }, [userLeaves]);

  // Determine user's gender based on profile info
  useEffect(() => {
    // If we have user gender in the profile or employee info, use it
    // For now, use a heuristic based on the user's full name or role
    // This should be replaced with actual gender data from your API when available
    if (user) {
      // Simple heuristic - in a real app, replace this logic with actual gender data
      const name = user.full_name || '';
      // This is a simplified example - in a real app, you'd get the gender from the user profile
      if (name.endsWith('a') || name.endsWith('i')) {
        setUserGender('FEMALE');
      } else {
        setUserGender('MALE');
      }
    }
  }, [user]);

  // Helper function to check exact leave code match
  const exactCodeMatch = (code: string, patterns: string[]): boolean => {
    return patterns.some(pattern => pattern === code);
  };

  // Helper function to determine if a leave type is gender-specific
  const getLeaveGenderType = (leaveBalance: EmployeeLeaveBalance): 'MALE' | 'FEMALE' | null => {
    if (!leaveBalance?.leave_type_id) return null;
    
    const code = leaveBalance.leave_type_id.leave_code || '';
    const name = leaveBalance.leave_type_id.leave_name || '';
    
    // Check for female-specific leaves with exact code matching
    if (exactCodeMatch(code, GENDER_SPECIFIC_LEAVES.FEMALE) || 
        name.toUpperCase().includes('MATERNITY')) {
      return 'FEMALE';
    }
    
    // Check for male-specific leaves with exact code matching
    if (exactCodeMatch(code, GENDER_SPECIFIC_LEAVES.MALE) || 
        name.toUpperCase().includes('PATERNITY')) {
      return 'MALE';
    }
    
    return null;
  };

  // Get gender icon for leave balance
  const getLeaveTypeIcon = (leaveBalance: EmployeeLeaveBalance) => {
    const genderType = getLeaveGenderType(leaveBalance);
    if (genderType === 'FEMALE') {
      return <FaVenus className="text-pink-500 ml-1" />;
    } else if (genderType === 'MALE') {
      return <FaMars className="text-blue-500 ml-1" />;
    }
    return null;
  };

  useEffect(() => {
    // Fetch attendance data and user leaves when component mounts or refresh is triggered
    const loadData = async () => {
      await fetchAttendanceSummary();
      await fetchUserLeaves();
      
      // Fetch detailed leave balances if we have the employee ID
      if (attendanceSummary?.employee_id) {
        try {
          const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
          setDetailedLeaveBalances(balances);
        } catch (error) {
          console.error('Error fetching detailed leave balances:', error);
        }
      }
    };
    
    loadData();
      // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      loadData(); // Just reload the data directly
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchAttendanceSummary, fetchUserLeaves, attendanceSummary?.employee_id]);

  // Effect to fetch notifications when component mounts
  useEffect(() => {
    const fetchAndLogNotifications = async () => {
      try {
        console.log('Fetching notifications for employee dashboard...');
        await fetchUserNotifications();
        console.log('Notifications fetched successfully, unread count:', unreadCount);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchAndLogNotifications();
    
    // Set up interval to fetch notifications periodically
    const intervalId = setInterval(() => {
      fetchAndLogNotifications();
    }, 60000); // Every minute
    
    return () => clearInterval(intervalId);
  }, [fetchUserNotifications, unreadCount]);

  // Other useEffect hooks remain the same...  // Function to start the check-in process with 2FA
  const initiateCheckIn = () => {
    setTwoFactorDialog({
      isOpen: true,
      action: 'checkin'
    });
  };
  
  // Function to start the check-out process with 2FA
  const initiateCheckOut = () => {
    setTwoFactorDialog({
      isOpen: true,
      action: 'checkout',
      checkInTime: attendanceSummary?.lastCheckIn
    });
  };
  
  // The actual check-in function that will be called after 2FA confirmation
  const handleCheckIn = async () => {
    try {
      await checkIn();
      await fetchAttendanceSummary(); // Refresh stats after check-in
      
      // Refresh leave balances after check-in (might affect certain types of leave)
      if (attendanceSummary?.employee_id) {
        const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
        setDetailedLeaveBalances(balances);
      }
      
      // Show success toast
      setToast({
        visible: true,
        message: 'Successfully checked in!',
        type: 'success'
      });
    } catch (error) {
      // Error is already handled in the store
    }
  };

  // The actual check-out function that will be called after 2FA confirmation
  const handleCheckOut = async () => {
    try {
      await checkOut();
      await fetchAttendanceSummary(); // Refresh stats after check-out
      
      // Refresh leave balances after check-out (might affect certain types of leave)
      if (attendanceSummary?.employee_id) {
        const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
        setDetailedLeaveBalances(balances);
      }
      
      // Show success toast
      setToast({
        visible: true,
        message: 'Successfully checked out!',
        type: 'success'
      });
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const handleLeaveRequest = async (leaveData: any) => {
    try {
      await requestLeave(leaveData);
      await fetchUserLeaves(); // Refresh leaves list after new request
      
      // Refresh detailed leave balances after submitting a leave request
      if (attendanceSummary?.employee_id) {
        try {
          const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
          setDetailedLeaveBalances(balances);
        } catch (error) {
          console.error('Error fetching detailed leave balances:', error);
        }
      }
      
      setToast({
        visible: true,
        message: 'Leave request submitted successfully',
        type: 'success'
      });
    } catch (error: any) {
      // Show error message
      setToast({
        visible: true,
        message: error.message || 'Failed to submit leave request',
        type: 'error'
      });
    }
  };

  // Function to handle deleting a single leave request
  const handleDeleteLeave = async (leaveId: string) => {
    try {
      // Call API to cancel the leave request
      await cancelLeaveRequest(leaveId);
      
      // Refresh user leaves list after deletion
      await fetchUserLeaves();
      
      // Also refresh attendance summary and leave balances
      if (attendanceSummary?.employee_id) {
        await fetchAttendanceSummary();
        const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
        setDetailedLeaveBalances(balances);
      }
      
      setToast({
        visible: true,
        message: 'Leave request deleted successfully',
        type: 'success'
      });
    } catch (error: any) {
      console.error('Error deleting leave request:', error);
      setToast({
        visible: true,
        message: error.message || 'Failed to delete leave request',
        type: 'error'
      });
    }
  };

  // Function to clear all leave requests
  const handleClearAllLeaves = async () => {
    try {
      // Process all leave requests sequentially to avoid race conditions
      if (userLeaves && userLeaves.length > 0) {
        setToast({
          visible: true,
          message: 'Clearing all leave requests...',
          type: 'info'
        });
        
        // Create a promise for all cancellation operations
        await Promise.all(
          userLeaves.map(leave => cancelLeaveRequest(leave.id))
        );
        
        // After all are processed, refresh the data
        await fetchUserLeaves();
        
        // Also refresh attendance summary and leave balances
        if (attendanceSummary?.employee_id) {
          await fetchAttendanceSummary();
          const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
          setDetailedLeaveBalances(balances);
        }
        
        setToast({
          visible: true,
          message: 'All leave requests cleared successfully',
          type: 'success'
        });
      }
    } catch (error: any) {
      console.error('Error clearing all leave requests:', error);
      setToast({
        visible: true,
        message: error.message || 'Failed to clear leave requests',
        type: 'error'
      });
    }
  };

  // Function to handle clearing all leave requests from dashboard (locally)
  const handleClearDashboardLeaves = () => {
    // This only clears the leaves from the frontend state without affecting the database
    setToast({
      visible: true,
      message: 'Dashboard cleared. Leave requests still exist in the system.',
      type: 'info'
    });
    
    // Store the original leaves in case user wants to restore them
    const originalLeaves = [...userLeaves];
    
    // Clear the leaves from the state
    useAttendanceStore.setState({ userLeaves: [] });
    
    // Option to restore the leaves (using setTimeout to auto-dismiss)
    const restoreTimeout = setTimeout(() => {
      // After 10 seconds, clean up the restore option
      setToast({
        visible: false,
        message: '',
        type: 'info'
      });
    }, 10000);

    // Return a toast with a restore button
    setToast({
      visible: true,
      message: 'Dashboard cleared. Click here to restore.',
      type: 'info',
      action: () => {
        // Restore the leaves when clicked
        useAttendanceStore.setState({ userLeaves: originalLeaves });
        clearTimeout(restoreTimeout);
        setToast({
          visible: true,
          message: 'Leave requests restored',
          type: 'success'
        });
      }
    });
  };

  // Calculate the remaining balance for a leave type
  const calculateRemainingBalance = (leaveBalance: EmployeeLeaveBalance): number => {
    const remaining = leaveBalance.allocated_leaves + 
           leaveBalance.carried_forward - 
           leaveBalance.used_leaves - 
           leaveBalance.pending_leaves;
    
    return remaining;
  };

  // Filter leave balances based on gender for display
  const getFilteredLeaveBalances = (): EmployeeLeaveBalance[] => {
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
  };

  // Fallback to simple leave balance if detailed isn't available
  const renderSimpleLeaveBalance = () => {
    // Use detailed leave balances if available
    const annualLeave = detailedLeaveBalances.find(
      balance => balance.leave_type_id.leave_code === 'AL'
    );
    const sickLeave = detailedLeaveBalances.find(
      balance => balance.leave_type_id.leave_code === 'SL'
    );
    const casualLeave = detailedLeaveBalances.find(
      balance => balance.leave_type_id.leave_code === 'CL'
    );
    
    // Calculate remaining balances if available
    const annualRemaining = annualLeave ? 
      calculateRemainingBalance(annualLeave) : 
      (attendanceSummary?.leaveBalance.annual || 0);
    
    const sickRemaining = sickLeave ? 
      calculateRemainingBalance(sickLeave) : 
      (attendanceSummary?.leaveBalance.sick || 0);
    
    const casualRemaining = casualLeave ? 
      calculateRemainingBalance(casualLeave) : 
      (attendanceSummary?.leaveBalance.casual || 0);
    
    return (
      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
          <span className="text-sm sm:text-base text-white">Annual Leave</span>
          <span className="font-bold text-sm sm:text-base text-white">
            {annualRemaining} days
          </span>
        </div>
        <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
          <span className="text-sm sm:text-base text-white">Sick Leave</span>
          <span className="font-bold text-sm sm:text-base text-white">
            {sickRemaining} days
          </span>
        </div>
        <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
          <span className="text-sm sm:text-base text-white">Casual Leave</span>
          <span className="font-bold text-sm sm:text-base text-white">
            {casualRemaining} days
          </span>
        </div>
      </div>
    );
  };

  // Detailed leave balance with gender-specific styling and animation
  const renderDetailedLeaveBalance = () => {
    const filteredBalances = getFilteredLeaveBalances();
    
    if (!filteredBalances.length) {
      return renderSimpleLeaveBalance();
    }
    
    return (
      <div className="space-y-2 sm:space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {filteredBalances.map((balance) => {
          const genderType = getLeaveGenderType(balance);
          const remaining = calculateRemainingBalance(balance);
          
          return (
            <motion.div 
              key={balance._id} 
              className={`flex justify-between items-center backdrop-blur-sm p-2 sm:p-3 rounded-lg
                ${genderType === 'FEMALE' 
                  ? 'bg-pink-500/20 border border-pink-400/30' 
                  : genderType === 'MALE' 
                    ? 'bg-blue-500/20 border border-blue-400/30' 
                    : 'bg-white/20'}`}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center">
                <span className="text-sm sm:text-base text-white">
                  {balance.leave_type_id.leave_name}
                </span>
                {getLeaveTypeIcon(balance)}
              </div>
              <motion.span 
                className="font-bold text-sm sm:text-base text-white"
                key={`${balance._id}-${remaining}`}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {remaining} days
              </motion.span>
            </motion.div>
          );
        })}
      </div>
    );
  };

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
  };  // Get employee code from attendance summary
  useEffect(() => {
    // The employee code is directly in the attendance summary
    // No need for additional state
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">      {/* Employee header with welcome message */}
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
          
          {/* Google Sync Button */}
          <button
            onClick={async () => {
              try {
                setIsSyncingGoogle(true);
                // Initialize Google Calendar if not already initialized
                if (!isInitialized) {
                  await initialize();
                }
                
                // Toggle sign-in/sign-out
                if (!isSignedIn) {
                  await signIn();
                  setToast({
                    visible: true,
                    message: 'Successfully connected to Google Calendar',
                    type: 'success'
                  });
                } else {
                  await signOut();
                  setToast({
                    visible: true,
                    message: 'Disconnected from Google Calendar',
                    type: 'info'
                  });
                }
              } catch (error) {
                console.error('Error syncing with Google Calendar:', error);
                setToast({
                  visible: true,
                  message: 'Failed to connect to Google Calendar',
                  type: 'error'
                });
              } finally {
                setIsSyncingGoogle(false);
              }
            }}
            className="px-4 py-2 flex items-center justify-center bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={isSyncingGoogle}
          >
            <FaGoogle className="mr-2" />
            {isSyncingGoogle ? 'Connecting...' : isSignedIn ? 'Google Connected' : 'Connect Google'}
          </button>
          
          {/* Logout Button */}
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

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={5000}
        action={toast.action}
      />

      {/* Leave request modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSubmit={handleLeaveRequest}
      />      {/* Schedule modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />
      
      {/* Notification drawer */}      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
      
      {/* Two-Factor Authentication Dialog for check-in/check-out confirmation */}      <TwoFactorDialog
        isOpen={twoFactorDialog.isOpen}
        action={twoFactorDialog.action}
        checkInTime={twoFactorDialog.checkInTime}
        onClose={() => setTwoFactorDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => twoFactorDialog.action === 'checkin' ? handleCheckIn() : handleCheckOut()}
      />

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Quick actions card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="col-span-1"
        >
          <div className="bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl overflow-hidden shadow-xl h-auto sm:h-64">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button 
                  className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={initiateCheckIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </div>
                  ) : 'Check In'}
                </button>
                <button 
                  className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={initiateCheckOut}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </div>
                  ) : 'Check Out'}
                </button>
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
                </button>                <button 
                  className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base"
                  onClick={() => navigate('/attendance-logs')}
                >
                  Attendance Logs
                </button>
                <button
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  className="relative bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base flex items-center justify-center"
                >
                  <FaBell className="mr-1" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Attendance stats */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="col-span-1"
        >
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl overflow-hidden shadow-xl h-auto sm:h-64">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Attendance This Month</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center">
                  <span className="block text-xl sm:text-3xl font-bold text-white">
                    {attendanceSummary?.stats.present || 0}
                  </span>
                  <span className="text-sm sm:text-base text-white/80">Present</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center">
                  <span className="block text-xl sm:text-3xl font-bold text-white">
                    {attendanceSummary?.stats.absent || 0}
                  </span>
                  <span className="text-sm sm:text-base text-white/80">Absent</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center">
                  <span className="block text-xl sm:text-3xl font-bold text-white">
                    {attendanceSummary?.stats.late || 0}
                  </span>
                  <span className="text-sm sm:text-base text-white/80">Late</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg text-center">
                  <span className="block text-xl sm:text-3xl font-bold text-white">
                    {attendanceSummary?.stats.leaves || 0}
                  </span>
                  <span className="text-sm sm:text-base text-white/80">Leaves</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Leave balance */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="col-span-1"
        >
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl overflow-hidden shadow-xl h-auto sm:h-64">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center justify-between">
                <span>Leave Balance</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={async () => {
                      if (attendanceSummary?.employee_id) {
                        try {
                          setRefreshingBalances(true);
                          setDetailedLeaveBalances([]);
                          await fetchAttendanceSummary();
                          const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
                          setDetailedLeaveBalances(balances);
                          setToast({
                            visible: true,
                            message: 'Leave balances refreshed',
                            type: 'success'
                          });
                        } catch (error) {
                          console.error('Error refreshing leave balances:', error);
                        } finally {
                          setTimeout(() => setRefreshingBalances(false), 1000);
                        }
                      }
                    }}
                    className="text-xs font-normal bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center px-2 py-1"
                    title="Force refresh leave balances"
                    disabled={refreshingBalances}
                  >
                    <FaSync className={`w-3 h-3 mr-1 refresh-spin ${refreshingBalances ? 'active' : ''}`} /> Refresh
                  </button>
                  {userGender && (
                    <span className="text-xs font-normal bg-white/20 rounded-full px-2 py-1 flex items-center">
                      {userGender === 'FEMALE' ? (
                        <><FaVenus className="mr-1" /> Female</>
                      ) : (
                        <><FaMars className="mr-1" /> Male</>
                      )}
                    </span>
                  )}
                </div>
              </h3>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                renderDetailedLeaveBalance()
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Leave Requests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8"
      >
        <RecentLeaves 
          leaves={userLeaves || []}
          onSyncSuccess={() => {
            setToast({
              visible: true,
              message: 'Leave synced to Google Calendar',
              type: 'success'
            });
          }}
          onSyncError={(_, error) => {
            setToast({
              visible: true,
              message: `Failed to sync leave: ${error}`,
              type: 'error'
            });
          }}
          onDeleteLeave={handleDeleteLeave}
          onClearAllLeaves={handleClearAllLeaves}
          onClearDashboard={handleClearDashboardLeaves}
        />
      </motion.div>
    </div>
  );
};

export default Dashboard;
