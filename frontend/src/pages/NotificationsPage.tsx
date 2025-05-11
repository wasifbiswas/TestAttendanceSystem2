import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationForm from '../components/NotificationForm';
import Toast from '../components/Toast';
import { FaBell, FaFilter, FaCheck, FaTrash } from 'react-icons/fa';

// Animation variants
const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
    },
  }),
};

interface Department {
  _id: string;
  name: string;
}

interface Sender {
  _id: string;
  username: string;
  full_name: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  sender: Sender;
  department?: Department | null;
  created_at: string;
  expires_at: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  read_at: string | null;
}

interface FilterOptions {
  priority: 'all' | 'low' | 'medium' | 'high';
  department: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

const NotificationsPage = () => {
  const { isAdmin, isManager } = useAuthStore();
  const { 
    notifications, 
    fetchUserNotifications, 
    fetchAllNotifications,
    markAsRead,
    removeNotification,
    isLoading
  } = useNotificationStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([...notifications]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    priority: 'all',
    department: 'all',
    dateRange: 'all'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [departments, setDepartments] = useState<{_id: string, name: string}[]>([]);
  const [toast, setToast] = useState<{ 
    visible: boolean; 
    message: string; 
    type: 'success' | 'error' | 'info';
  }>({ 
    visible: false, 
    message: '', 
    type: 'info'
  });

  // Fetch notifications when component mounts
  useEffect(() => {
    if (isAdmin) {
      fetchAllNotifications();
    } else {
      fetchUserNotifications();
    }
  }, [isAdmin, fetchAllNotifications, fetchUserNotifications]);  // Apply filters when notifications or filter options change
  useEffect(() => {
    applyFilters();
  }, [notifications, filterOptions]);
  // Extract unique departments from notifications for filter dropdown
  useEffect(() => {
    const uniqueDepartments = notifications
      .filter(notification => notification.department !== null && notification.department !== undefined)
      .reduce((acc: {_id: string, name: string}[], notification) => {
        // Since we've filtered out notifications without departments, we can assert the type
        const dept = notification.department!;
        if (!acc.some(d => d._id === dept._id)) {
          acc.push({
            _id: dept._id,
            name: dept.name
          });
        }
        return acc;
      }, []);
    
    setDepartments(uniqueDepartments);
  }, [notifications]);
  const applyFilters = useCallback(() => {
    let filtered = [...notifications];
    
    // Filter by priority
    if (filterOptions.priority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterOptions.priority);
    }
      // Filter by department
    if (filterOptions.department !== 'all') {
      filtered = filtered.filter(n => 
        n.department !== null && 
        n.department !== undefined && 
        n.department._id === filterOptions.department
      );
    }
    
    // Filter by date range
    if (filterOptions.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      filtered = filtered.filter(n => {
        const createdDate = new Date(n.created_at);
        switch (filterOptions.dateRange) {
          case 'today':
            return createdDate >= today;
          case 'week':
            return createdDate >= weekAgo;
          case 'month':
            return createdDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filterOptions]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    setToast({
      visible: true,
      message: 'Notification marked as read',
      type: 'success'
    });
  };

  const handleDelete = async (id: string) => {
    await removeNotification(id);
    setToast({
      visible: true,
      message: 'Notification deleted',
      type: 'success'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get priority class for notification
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-6"
      initial="hidden"
      animate="visible"
      variants={pageTransition}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {isAdmin ? 'System Notifications' : 'My Notifications'}
        </h1>
        
        <div className="flex space-x-2">
          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg flex items-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <FaFilter className="mr-2" />
            Filter
          </button>
          
          {/* Create Notification Button (Admin/Manager only) */}
          {(isAdmin || isManager) && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center hover:bg-blue-600 transition-colors"
            >
              <FaBell className="mr-2" />
              Send Notification
            </button>
          )}
        </div>
      </div>
      
      {/* Filter Panel */}
      {isFilterOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={filterOptions.priority}
                onChange={(e) => setFilterOptions({...filterOptions, priority: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                value={filterOptions.department}
                onChange={(e) => setFilterOptions({...filterOptions, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <select
                value={filterOptions.dateRange}
                onChange={(e) => setFilterOptions({...filterOptions, dateRange: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <FaBell className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No notifications found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filterOptions.priority !== 'all' || filterOptions.department !== 'all' || filterOptions.dateRange !== 'all'
                  ? 'Try changing your filter settings'
                  : 'You have no notifications at the moment'}
              </p>
            </div>
          </div>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification._id}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 ${
                notification.read 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : 'border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClass(notification.priority)}`}>
                      {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                    </span>
                    {!notification.read && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-blue-500"></span>
                    )}                    {notification.department !== null && notification.department !== undefined && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {notification.department.name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>From: {notification.sender.full_name || notification.sender.username}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(notification.created_at)}</span>
                    <span className="mx-2">•</span>
                    <span>Expires: {formatDate(notification.expires_at)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Mark as read"
                    >
                      <FaCheck className="h-4 w-4 text-green-500" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Delete"
                  >
                    <FaTrash className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={3000}
      />
      
      {/* Notification Form Modal */}
      <NotificationForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </motion.div>
  );
};

export default NotificationsPage;
