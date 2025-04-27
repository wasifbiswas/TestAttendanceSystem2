import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/Toast';
import { AdminStats } from '../types';
import { 
  getAdminStats, 
  getPendingLeaveRequests, 
  approveLeaveRequest, 
  denyLeaveRequest,
  getDepartmentStats,
  useAdminAPI
} from '../api/admin';
import { BiLoaderAlt } from 'react-icons/bi';
import { FaUserPlus, FaChartBar, FaCog, FaCalendarAlt, FaUsers } from 'react-icons/fa';

// Removed mock admin data

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });
  const { getAdminStats: useAdminStats } = useAdminAPI();

  useEffect(() => {
    // Check if user is admin, redirect to regular dashboard if not
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Fetch admin stats
    fetchAdminStats();
    fetchPendingLeaveRequests();
    fetchDepartmentStats();
  }, [isAdmin, navigate]);

  const fetchAdminStats = async () => {
    try {
      const data = await useAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setToast({
        visible: true,
        message: 'Failed to fetch admin statistics',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingLeaveRequests = async () => {
    try {
      const data = await getPendingLeaveRequests();
      setPendingLeaves(data);
    } catch (error) {
      console.error('Error fetching pending leave requests:', error);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const data = await getDepartmentStats();
      setDepartmentStats(data);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const handleApproveLeave = async (leaveId: string) => {
    try {
      await approveLeaveRequest(leaveId);
      setToast({
        visible: true,
        message: 'Leave request approved successfully',
        type: 'success'
      });
      // Refresh the pending leave requests
      fetchPendingLeaveRequests();
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
    } catch (error) {
      console.error('Error denying leave request:', error);
      setToast({
        visible: true,
        message: 'Failed to deny leave request',
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/employees')}
          className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-300"
        >
          <FaUserPlus className="text-3xl text-blue-500 mb-2" />
          <span className="font-medium">Add Employee</span>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.employees || 0}</p>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.attendance?.present || 0}</p>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.attendance?.absent || 0}</p>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.attendance?.onLeave || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

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
                  <div key={leave.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{leave.userName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{leave.type} Leave: {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                      {leave.reason && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Reason: {leave.reason}</p>}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveLeave(leave.id)}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDenyLeave(leave.id)}
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
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Department Overview</h3>
          </div>
          <div className="p-6">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Employees
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
                        {dept.employeeCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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