import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import LeaveRequestModal from '../components/LeaveRequestModal';
import ScheduleModal from '../components/ScheduleModal';
import Toast from '../components/Toast';
import { LeaveRequest, EmployeeLeaveBalance, getEmployeeLeaveBalances, cancelLeaveRequest } from '../api/attendance';
import RecentLeaves from '../components/RecentLeaves';
import { FaGoogle, FaSync, FaVenus, FaMars } from 'react-icons/fa';
import api from '../api/axios';

// Gender-specific leave type codes
const GENDER_SPECIFIC_LEAVES = {
  FEMALE: ['ML', 'MATERNITY'], // Maternity leave codes
  MALE: ['PL', 'PATERNITY'],   // Paternity leave codes
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    checkIn, 
    checkOut, 
    requestLeave, 
    fetchAttendanceSummary, 
    fetchUserLeaves,
    syncLeavesToCalendar,
    attendanceSummary, 
    userLeaves,
    lastCheckInOut, 
    isLoading, 
    error 
  } = useAttendanceStore();
  const { isInitialized, isSignedIn, initialize, signIn } = useGoogleCalendar();

  // State for employee code display
  const [employeeCode, setEmployeeCode] = useState<string>("");

  // State for modals and notifications
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
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

  // New state to track last data refresh time
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // State to track previous leave status
  const [previousLeaveStatuses, setPreviousLeaveStatuses] = useState<Record<string, string>>({});
  
  // Add a new state for tracking refresh animation
  const [refreshingBalances, setRefreshingBalances] = useState(false);
  
  // Function to check if any leave status has changed from PENDING to APPROVED
  const checkLeaveStatusChanges = (currentLeaves: LeaveRequest[]) => {
    let statusChanged = false;
    const newStatusMap: Record<string, string> = {};
    
    // Build status map and check for changes
    currentLeaves.forEach(leave => {
      newStatusMap[leave.id] = leave.status;
      
      // Check if this leave previously existed and status changed from PENDING to APPROVED
      if (
        previousLeaveStatuses[leave.id] && 
        previousLeaveStatuses[leave.id] === 'PENDING' && 
        leave.status === 'APPROVED'
      ) {
        statusChanged = true;
        console.log(`Leave ${leave.id} status changed from PENDING to APPROVED`);
      }
    });
    
    // Update the status map for next comparison
    setPreviousLeaveStatuses(newStatusMap);
    
    return statusChanged;
  };

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
      setLastRefreshTime(Date.now());
    }, 30000); // 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchAttendanceSummary, fetchUserLeaves, attendanceSummary?.employee_id]);

  // Additional effect to handle data refreshes
  useEffect(() => {
    const refreshData = async () => {
      if (!attendanceSummary?.employee_id) return;
      
      try {
        // Refresh user leaves to get updated status
        await fetchUserLeaves();
        
        // Refresh leave balances with fresh data
        const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
        setDetailedLeaveBalances(balances);
      } catch (error) {
        console.error('Error refreshing leave data:', error);
      }
    };
    
    refreshData();
  }, [lastRefreshTime, attendanceSummary?.employee_id]);

  // Effect to update leave balances whenever attendanceSummary changes
  useEffect(() => {
    const updateLeaveBalances = async () => {
      if (attendanceSummary && attendanceSummary.employee_id) {
        try {
          const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
          setDetailedLeaveBalances(balances);
        } catch (error) {
          console.error('Error fetching detailed leave balances:', error);
        }
      }
    };
    
    updateLeaveBalances();
  }, [attendanceSummary]);

  // Show toast notification for errors
  useEffect(() => {
    if (error) {
      setToast({
        visible: true,
        message: error,
        type: 'error'
      });
    }
  }, [error]);

  // Show toast notification for successful check-in/out
  useEffect(() => {
    if (lastCheckInOut) {
      setToast({
        visible: true,
        message: lastCheckInOut.message,
        type: 'success'
      });
    }
  }, [lastCheckInOut]);

  // Effect to monitor leave status changes
  useEffect(() => {
    if (!userLeaves || userLeaves.length === 0) return;
    
    // Check if any leave status changed from PENDING to APPROVED
    const statusChanged = checkLeaveStatusChanges(userLeaves);
    
    // Force refresh leave balances on component mount or when leaves change
    // This ensures we always have latest data, even if status didn't change
    (async () => {
      if (!attendanceSummary?.employee_id) return;
      
      try {
        console.log('Refreshing leave balances due to leaves changes or refresh');
        // Force a refetch of attendance summary to get updated stats
        await fetchAttendanceSummary();
        
        // Explicitly fetch the latest leave balances with cache busting
        const timestamp = new Date().getTime();
        const freshBalances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
        setDetailedLeaveBalances(freshBalances);
        
        if (statusChanged) {
          setToast({
            visible: true,
            message: 'Leave approved! Your leave balance has been updated.',
            type: 'success'
          });
        }
      } catch (error) {
        console.error('Failed to refresh balances after leave changes:', error);
      }
    })();
  }, [userLeaves, attendanceSummary?.employee_id]);

  // Effect to get employee code from the attendance summary
  useEffect(() => {
    if (attendanceSummary?.employee_code) {
      console.log('Found employee code in attendance summary:', attendanceSummary.employee_code);
      setEmployeeCode(attendanceSummary.employee_code);
    } else if (attendanceSummary?.employee_id) {
      // If employee_code is not available, at least show something to the user
      console.log('Employee code not found, using ID as fallback:', attendanceSummary.employee_id);
      // Just use the last 5 characters of ID as a simpler identifier
      const shortId = attendanceSummary.employee_id.substring(attendanceSummary.employee_id.length - 5);
      setEmployeeCode(`EMP-${shortId}`);
    }
  }, [attendanceSummary]);

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

  // Enhanced check-in handler with leave balance refresh
  const handleCheckIn = async () => {
    try {
      await checkIn();
      await fetchAttendanceSummary(); // Refresh stats after check-in
      
      // Refresh leave balances after check-in (might affect certain types of leave)
      if (attendanceSummary?.employee_id) {
        const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
        setDetailedLeaveBalances(balances);
      }
    } catch (error) {
      // Error is already handled in the store
    }
  };

  // Enhanced check-out handler with leave balance refresh
  const handleCheckOut = async () => {
    try {
      await checkOut();
      await fetchAttendanceSummary(); // Refresh stats after check-out
      
      // Refresh leave balances after check-out (might affect certain types of leave)
      if (attendanceSummary?.employee_id) {
        const balances = await getEmployeeLeaveBalances(attendanceSummary.employee_id);
        setDetailedLeaveBalances(balances);
      }
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const handleLeaveRequest = async (leaveData: any) => {
    try {
      // The data is already correctly formatted in LeaveRequestModal
      // Don't transform it again, just pass it directly
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

  const handleLogout = () => {
    logout();
    setToast({
      visible: true,
      message: 'Successfully logged out',
      type: 'success'
    });
    // Redirect to login page after a short delay to show the toast
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const handleSyncToCalendar = async () => {
    try {
      setIsSyncingCalendar(true);
      
      try {
        // Initialize Google Calendar if needed
        if (!isInitialized) {
          await initialize();
        }
        
        // Sign in if not already signed in
        if (!isSignedIn) {
          await signIn();
        }
      } catch (authError: any) {
        setToast({
          visible: true,
          message: 'Failed to authenticate with Google Calendar. Please try again.',
          type: 'error'
        });
        setIsSyncingCalendar(false);
        return;
      }
      
      // Sync leaves to calendar
      await syncLeavesToCalendar();
      
      setToast({
        visible: true,
        message: 'Leaves successfully synced to Google Calendar',
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        visible: true,
        message: error.message || 'Failed to sync leaves to Google Calendar',
        type: 'error'
      });
    } finally {
      setIsSyncingCalendar(false);
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
      // Show loading state if needed
      
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
  // Useful for just cleaning up the UI
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
    // Add debug logging to see the actual values
    const remaining = leaveBalance.allocated_leaves + 
           leaveBalance.carried_forward - 
           leaveBalance.used_leaves - 
           leaveBalance.pending_leaves;
    
    // Log detailed breakdown for AL (Annual Leave)
    if (leaveBalance.leave_type_id.leave_code === 'AL') {
      console.log(`Leave Balance (${leaveBalance.leave_type_id.leave_name}):`);
      console.log(`- Allocated: ${leaveBalance.allocated_leaves}`);
      console.log(`- Carried Forward: ${leaveBalance.carried_forward}`);
      console.log(`- Used: ${leaveBalance.used_leaves}`);
      console.log(`- Pending: ${leaveBalance.pending_leaves}`);
      console.log(`= Remaining: ${remaining}`);
    }
    
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
                key={`${balance._id}-${remaining}`} // Forces re-render when value changes
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.full_name || 'User'}!
          </h1>
          {employeeCode && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Employee Code: <span className="font-semibold">{employeeCode}</span>
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncToCalendar}
            disabled={isSyncingCalendar || isLoading}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm
              ${(isSyncingCalendar || isLoading) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'}
              transition-colors duration-200
            `}
          >
            {isSyncingCalendar ? (
              <>
                <FaSync className="animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <FaGoogle />
                <span>Sync to Calendar</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="bg-white/90 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
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
      />

      {/* Schedule modal */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
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
                  onClick={handleCheckIn}
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
                  onClick={handleCheckOut}
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
                </button>
                <button 
                  className="bg-white/30 backdrop-blur-sm hover:bg-white/40 text-white p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base"
                  onClick={() => navigate('/attendance-logs')}
                >
                  Attendance Logs
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
                          // Set refreshing state to trigger animation
                          setRefreshingBalances(true);
                          
                          // Clear existing leave balances first
                          setDetailedLeaveBalances([]);
                          
                          // Force immediate refresh of leave balances
                          console.log('Forcing refresh of leave balances...');
                          
                          // Reset attendance store data
                          await fetchAttendanceSummary();
                          await fetchUserLeaves();
                          
                          // Add random param to completely bypass cache
                          const randomParam = Math.floor(Math.random() * 1000000);
                          const balances = await getEmployeeLeaveBalances(`${attendanceSummary.employee_id}?force=${randomParam}`);
                          
                          console.log('Received fresh leave balances:', balances);
                          setDetailedLeaveBalances(balances);
                          
                          setToast({
                            visible: true,
                            message: 'Leave balances refreshed',
                            type: 'success'
                          });
                        } catch (error) {
                          console.error('Error refreshing leave balances:', error);
                          setToast({
                            visible: true,
                            message: 'Failed to refresh leave balances',
                            type: 'error'
                          });
                        } finally {
                          // Set timeout to let animation complete
                          setTimeout(() => setRefreshingBalances(false), 1000);
                        }
                      }
                    }}
                    className="text-xs font-normal bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center px-2 py-1"
                    title="Force refresh leave balances"
                    disabled={refreshingBalances}
                  >
                    <FaSync className={`w-3 h-3 mr-1 refresh-spin ${refreshingBalances ? 'active' : ''}`} /> Refresh Balances
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

      {/* Recent Leave Requests - using real data from API */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8"
      >
        <RecentLeaves 
          leaves={userLeaves || []}
          onSyncSuccess={(id) => {
            setToast({
              visible: true,
              message: 'Leave synced to Google Calendar',
              type: 'success'
            });
          }}
          onSyncError={(id, error) => {
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