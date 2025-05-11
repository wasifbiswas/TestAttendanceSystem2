import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheck, FaTrash, FaCheckDouble, FaChevronDown } from 'react-icons/fa';
import { format } from 'date-fns';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    totalCount,
    fetchUserNotifications, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    isLoading,
    currentPage,
    totalPages
  } = useNotificationStore();
  
  // State for pagination
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Reset to page 1 and fetch fresh notifications when drawer opens
      setPage(1);
      fetchUserNotifications(1);
    }
  }, [isOpen, fetchUserNotifications]);
  
  // Function to load more notifications
  const loadMoreNotifications = async () => {
    if (isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      await fetchUserNotifications(nextPage);
      setPage(nextPage);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  const handleDelete = async (id: string) => {
    await removeNotification(id);
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get priority class
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - closes drawer when clicked */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          
          {/* Notification drawer panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-lg z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    title="Mark all as read"
                  >
                    <FaCheckDouble className="text-blue-500 h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  title="Close"
                >
                  <FaTimes className="text-gray-600 dark:text-gray-400 h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Notification list */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading && notifications.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg relative ${
                        notification.read
                          ? 'bg-gray-50 dark:bg-gray-700'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                      }`}
                    >
                      {/* Priority badge */}
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityClass(notification.priority)}`}>
                          {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                        </span>
                        
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              title="Mark as read"
                            >
                              <FaCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification._id)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title="Delete"
                          >
                            <FaTrash className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Title and content */}
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {notification.title}
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      {/* Footer with meta information */}
                      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <div>
                          <p>From: {notification.sender.full_name || notification.sender.username}</p>
                          {notification.department && (
                            <p>Department: {notification.department.name}</p>
                          )}
                        </div>
                        <p>{formatDate(notification.created_at)}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Load more button */}
                  {currentPage < totalPages && (
                    <div className="pt-4 pb-2">
                      <button
                        onClick={loadMoreNotifications}
                        disabled={isLoadingMore}
                        className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center justify-center transition-colors"
                      >
                        {isLoadingMore ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        ) : (
                          <FaChevronDown className="mr-2" />
                        )}
                        {isLoadingMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;
