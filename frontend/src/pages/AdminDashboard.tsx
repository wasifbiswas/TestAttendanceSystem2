import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import Toast from '../components/Toast';
import { AdminStats } from '../types';
import { 
  getPendingLeaveRequests, 
  approveLeaveRequest, 
  denyLeaveRequest,
  getDepartmentStats,
  useAdminAPI,
  getUserRoleCounts
} from '../api/admin';
import { BiLoaderAlt } from 'react-icons/bi';
import { FaUserPlus, FaChartBar, FaCog, FaCalendarAlt, FaUsers, FaUserTie, FaUserShield, FaVenus, FaMars, FaBriefcase, FaBuilding, FaUsersCog, FaBell } from 'react-icons/fa';
import LeaveDetailModal from '../components/admin/LeaveDetailModal';
import NotificationForm from '../components/NotificationForm';
import { hasDateChangedInIndianTimezone, getStartOfDayTimestampInIndianTimezone } from '../utils/dateUtils';

// Key for storing the last check date in localStorage
const LAST_ATTENDANCE_CHECK_KEY = 'admin_last_attendance_check';

// Gender-specific leave types
const GENDER_SPECIFIC_LEAVES = {
  FEMALE: ['ML', 'MATERNITY'], // Maternity leave codes
  MALE: ['PL', 'PATERNITY'],   // Paternity leave codes
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);  const [roleCounts, setRoleCounts] = useState<{
    employees: { count: number, ids: string[] },
    managers: { count: number, ids: string[] },
    admins: { count: number, ids: string[] }
  }>({
    employees: { count: 0, ids: [] },
    managers: { count: 0, ids: [] },
    admins: { count: 0, ids: [] }
  });
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });
  // State variables for leave detail modal
  const [isLeaveDetailModalOpen, setIsLeaveDetailModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);  // State to track if attendance has been reset for the day
  const [attendanceResetForToday, setAttendanceResetForToday] = useState(false);
  const [refreshingDeptStats, setRefreshingDeptStats] = useState(false);
  const [refreshingRoleCounts, setRefreshingRoleCounts] = useState(false);
  // New state for notification form
  const [isNotificationFormOpen, setIsNotificationFormOpen] = useState(false);

  const { getAdminStats: useAdminStats } = useAdminAPI();

  // Calculate total employees from department stats as a fallback
  const totalEmployees = departmentStats.length > 0 
    ? departmentStats.reduce((sum, dept) => sum + dept.employeeCount, 0) 
    : (stats?.employees || 0);

  useEffect(() => {
    // Check if user is admin, redirect to regular dashboard if not
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Check if the date has changed since the last check (Indian timezone)
    const lastCheckTimestamp = Number(localStorage.getItem(LAST_ATTENDANCE_CHECK_KEY) || '0');
    const dateChanged = hasDateChangedInIndianTimezone(lastCheckTimestamp);
    
    if (dateChanged && !attendanceResetForToday) {
      // Update the last check timestamp to current day start in Indian timezone
      const currentDayStartTimestamp = getStartOfDayTimestampInIndianTimezone();
      localStorage.setItem(LAST_ATTENDANCE_CHECK_KEY, currentDayStartTimestamp.toString());
      setAttendanceResetForToday(true);
      
      console.log('Date has changed in Indian timezone. Resetting attendance counts.');
      // Set a toast notification to inform admin
      setToast({
        visible: true,
        message: 'Attendance counts reset for new day (Indian timezone)',
        type: 'info'
      });
    }

    // Fetch admin stats
    fetchAdminStats();
    fetchPendingLeaveRequests();
    fetchDepartmentStats();
    fetchRoleCounts();
  }, [isAdmin, navigate]);
  const fetchAdminStats = async () => {
    // We'll use setIsLoading instead of setRefreshingStats
    setIsLoading(true);
    try {
      const data = await useAdminStats();
      
      // If date has changed in Indian timezone, show zero counts for today's attendance
      if (attendanceResetForToday && data) {
        setStats({
          users: data.users || 0,
          employees: data.employees || 0,
          departments: data.departments || 0,
          pendingLeaveRequests: data.pendingLeaveRequests || 0,
          departmentStats: data.departmentStats || [],
          attendance: {
            total: data.attendance?.total || 0,
            present: 0,
            absent: 0,
            onLeave: 0
          }
        });
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setToast({
        visible: true,
        message: 'Failed to fetch admin statistics',
        type: 'error'
      });    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check exact leave code match
  const exactCodeMatch = (code: string, patterns: string[]): boolean => {
    return patterns.some(pattern => pattern === code);
  };

  // Helper function to determine if a leave type is gender-specific
  const getLeaveGenderType = (leave: any): 'MALE' | 'FEMALE' | null => {
    const leaveTypeCode = leave.leave_type_id?.leave_code || '';
    const leaveTypeName = leave.leave_type_id?.leave_name || leave.type || '';
    
    // Check for female-specific leaves with exact code matching
    if (exactCodeMatch(leaveTypeCode, GENDER_SPECIFIC_LEAVES.FEMALE) || 
        leaveTypeName.toUpperCase().includes('MATERNITY')) {
      return 'FEMALE';
    }
    
    // Check for male-specific leaves with exact code matching
    if (exactCodeMatch(leaveTypeCode, GENDER_SPECIFIC_LEAVES.MALE) || 
        leaveTypeName.toUpperCase().includes('PATERNITY')) {
      return 'MALE';
    }
    
    return null;
  };

  // Get the appropriate icon for gender-specific leave types
  const getLeaveTypeIcon = (leave: any) => {
    const genderType = getLeaveGenderType(leave);
    if (genderType === 'FEMALE') {
      return <FaVenus className="text-pink-500 ml-1" />;
    } else if (genderType === 'MALE') {
      return <FaMars className="text-blue-500 ml-1" />;
    }
    return null;
  };

  const fetchPendingLeaveRequests = async () => {
    try {
      console.log('Fetching pending leave requests...');
      const data = await getPendingLeaveRequests();
      
      // Log the results to help with debugging
      console.log('Pending leave requests data:', data);
      
      if (!data || data.length === 0) {
        console.log('No pending leave requests found');
        setPendingLeaves([]);
        return;
      }
      
      // Ensure each leave request has an employee_code and is properly formatted
      const enhancedData = data.map(leave => ({
        ...leave,
        employee_code: leave.employee_code || 'EMP-' + leave.id.substring(0, 5),
        // Make sure other required fields are present
        userId: leave.userId || (leave.emp_id ? leave.emp_id.toString() : ''),
        userName: leave.userName || 'Unknown Employee',
        type: leave.type || (leave.leave_type_id ? leave.leave_type_id.leave_name : 'Unknown Leave'),
        // Add gender info for leave display
        genderSpecific: getLeaveGenderType(leave)
      }));
      
      setPendingLeaves(enhancedData);
      console.log('Processed pending leaves with employee codes:', enhancedData);
    } catch (error) {
      console.error('Error fetching pending leave requests:', error);
      setToast({
        visible: true,
        message: 'Failed to fetch pending leave requests',
        type: 'error'
      });
    }
  };

  const fetchDepartmentStats = async () => {
    setRefreshingDeptStats(true);
    try {
      const data = await getDepartmentStats();
      setDepartmentStats(data);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    } finally {
      setTimeout(() => setRefreshingDeptStats(false), 1000);
    }
  };

  const fetchRoleCounts = async () => {
    setRefreshingRoleCounts(true);
    try {
      const data = await getUserRoleCounts();
      setRoleCounts(data);
    } catch (error) {
      console.error('Error fetching role counts:', error);
    } finally {
      setTimeout(() => setRefreshingRoleCounts(false), 1000);
    }
  };
  const handleApproveLeave = async (leaveId: string) => {
    try {
      await approveLeaveRequest(leaveId);
      setToast({
        visible: true,
        message: 'Leave request approved successfully. Leave balance updated.',
        type: 'success'
      });
      // Refresh the pending leave requests
      fetchPendingLeaveRequests();
      // Refresh admin stats to update leave counts
      fetchAdminStats();
    } catch (error) {
      console.error('Error approving leave request:', error);
      setToast({
        visible: true,
        message: 'Failed to approve leave request',
        type: 'error'
      });
    }
  };

  const handleDenyLeave = async (leaveId: string) => {
    try {
      await denyLeaveRequest(leaveId);
      setToast({
        visible: true,
        message: 'Leave request denied successfully',
        type: 'success'
      });
      // Refresh the pending leave requests
      fetchPendingLeaveRequests();
      // Refresh admin stats to update counts
      fetchAdminStats();
    } catch (error) {
      console.error('Error denying leave request:', error);
      setToast({
        visible: true,
        message: 'Failed to deny leave request',
        type: 'error'
      });
    }
  };

  const handleLeaveClick = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setIsLeaveDetailModalOpen(true);
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

  // Admin action buttons section
  const renderAdminActions = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/employees')}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <FaUsersCog className="text-3xl text-blue-500 mb-2" />
          <span className="font-medium">Manage Employee</span>
        </button>
        
        <button
          onClick={() => navigate('/admin/reports')}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <FaChartBar className="text-3xl text-green-500 mb-2" />
          <span className="font-medium">Generate Reports</span>
        </button>
        
        <button
          onClick={() => navigate('/admin/settings')}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <FaCog className="text-3xl text-purple-500 mb-2" />
          <span className="font-medium">System Settings</span>
        </button>
        
        <button
          onClick={() => navigate('/admin/holidays')}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <FaCalendarAlt className="text-3xl text-orange-500 mb-2" />
          <span className="font-medium">Manage Holidays</span>
        </button>

        <button
          onClick={() => navigate('/notifications')}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300 relative"
        >          <FaBell className="text-3xl text-yellow-500 mb-2" />
          {unreadCount > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <span className="font-medium">Notifications</span>
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome, {user?.full_name || 'Admin'}
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Manage Users
          </button>
          <button
            onClick={() => navigate('/attendance-logs')}
            className="bg-white/90 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Attendance Logs
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
          <button
            onClick={() => setIsNotificationFormOpen(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center"
          >
            <FaBell className="h-5 w-5 mr-2" />
            Send Notification
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

      {/* Leave Detail Modal */}
      <LeaveDetailModal
        isOpen={isLeaveDetailModalOpen}
        onClose={() => setIsLeaveDetailModalOpen(false)}
        leaveId={selectedLeaveId}
      />

      {/* Notification Form Modal */}
      <NotificationForm
        isOpen={isNotificationFormOpen}
        onClose={() => setIsNotificationFormOpen(false)}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Employees</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.employees || totalEmployees}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Present Today</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{attendanceResetForToday ? 0 : (stats?.attendance?.present || 0)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Absent Today</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{attendanceResetForToday ? 0 : (stats?.attendance?.absent || 0)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">On Leave</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{attendanceResetForToday ? 0 : (stats?.attendance?.onLeave || 0)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Role-based Summary Dashboard */}
      <motion.div
        custom={7}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8"
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Employee Summary by Role</h3>
          <button 
            onClick={() => fetchRoleCounts()}
            className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
            disabled={refreshingRoleCounts}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 refresh-spin ${refreshingRoleCounts ? 'active' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Employees Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 flex items-center justify-between border border-blue-100 dark:border-blue-800">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 mr-4">
                  <FaUsers className="text-2xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">Employees</h4>
              </div>
              <div className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-lg text-xl font-bold">
                {roleCounts.employees.count}
              </div>
            </div>

            {/* Managers Card */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 flex items-center justify-between border border-green-100 dark:border-green-800">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-800/50 text-green-600 dark:text-green-400 mr-4">
                  <FaUserTie className="text-2xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">Managers</h4>
              </div>
              <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-300 px-4 py-2 rounded-lg text-xl font-bold">
                {roleCounts.managers.count}
              </div>
            </div>

            {/* Admins Card */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 flex items-center justify-between border border-purple-100 dark:border-purple-800">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-400 mr-4">
                  <FaUserShield className="text-2xl" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">Administrators</h4>
              </div>
              <div className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-300 px-4 py-2 rounded-lg text-xl font-bold">
                {roleCounts.admins.count}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pending Approvals and Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pending Leave Requests</h3>
          </div>
          <div className="p-6">
            {pendingLeaves.length > 0 ? (
              <div className="space-y-4">
                {pendingLeaves.map((leave) => (
                  <div 
                    key={leave.id} 
                    className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors cursor-pointer"
                    onClick={() => handleLeaveClick(leave.id)}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 dark:text-white">{leave.userName}</p>
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded text-xs">
                          {leave.employee_code || 'N/A'}
                        </span>
                        {/* Gender indicator for leave type */}
                        {leave.genderSpecific && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            leave.genderSpecific === 'FEMALE' 
                              ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {leave.genderSpecific === 'FEMALE' ? 'Maternity' : 'Paternity'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {leave.type} Leave: {new Date(leave.start_date).toLocaleDateString('en-GB')} - {new Date(leave.end_date).toLocaleDateString('en-GB')}
                        </p>
                        {getLeaveTypeIcon(leave)}
                      </div>
                      {leave.reason && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reason: {leave.reason}</p>}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveLeave(leave.id);
                        }}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDenyLeave(leave.id);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No pending leave requests</p>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <FaBuilding className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Department Overview</h3>
            </div>
            <button 
              onClick={() => fetchDepartmentStats()}
              className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
              disabled={refreshingDeptStats}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 refresh-spin ${refreshingDeptStats ? 'active' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="p-6">
            <div className="overflow-y-auto max-h-80 custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <BiLoaderAlt className="animate-spin text-blue-500 text-3xl" />
                </div>
              ) : departmentStats.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Employees
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {departmentStats.map((dept) => (
                      <tr key={dept.department}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {dept.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-300 font-medium px-2.5 py-0.5 rounded">
                            {dept.employeeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            dept.employeeCount > 0 ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400'
                          }`}>
                            {dept.employeeCount > 0 ? 'Active' : 'No Employees'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center h-40">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No departments found</p>
                  <button 
                    onClick={() => fetchDepartmentStats()}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors flex items-center"
                    disabled={refreshingDeptStats}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 refresh-spin ${refreshingDeptStats ? 'active' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Departments
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Admin Actions */}
      <motion.div
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8"
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Admin Actions</h3>
        </div>
        <div className="p-6">
          {renderAdminActions()}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;