import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import LeaveRequestModal from '../components/LeaveRequestModal';
import ScheduleModal from '../components/ScheduleModal';
import Toast from '../components/Toast';
import { LeaveRequest } from '../api/attendance';
import RecentLeaves from '../components/RecentLeaves';
import { FaGoogle, FaSync } from 'react-icons/fa';

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

  // State for modals and notifications
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });

  useEffect(() => {
    // Fetch attendance data and user leaves when component mounts
    const loadData = async () => {
      await fetchAttendanceSummary();
      await fetchUserLeaves();
    };
    
    loadData();
  }, [fetchAttendanceSummary, fetchUserLeaves]);

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

  const handleCheckIn = async () => {
    try {
      await checkIn();
      await fetchAttendanceSummary(); // Refresh stats after check-in
    } catch (error) {
      // Error is already handled in the store
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      await fetchAttendanceSummary(); // Refresh stats after check-out
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8 flex justify-between items-center"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.full_name || 'User'}!
        </h1>
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
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Leave Balance</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                  <span className="text-sm sm:text-base text-white">Annual Leave</span>
                  <span className="font-bold text-sm sm:text-base text-white">
                    {attendanceSummary?.leaveBalance.annual || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                  <span className="text-sm sm:text-base text-white">Sick Leave</span>
                  <span className="font-bold text-sm sm:text-base text-white">
                    {attendanceSummary?.leaveBalance.sick || 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg">
                  <span className="text-sm sm:text-base text-white">Casual Leave</span>
                  <span className="font-bold text-sm sm:text-base text-white">
                    {attendanceSummary?.leaveBalance.casual || 0} days
                  </span>
                </div>
              </div>
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
        />
      </motion.div>
    </div>
  );
};

export default Dashboard;