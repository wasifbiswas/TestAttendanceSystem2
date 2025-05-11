import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBadgeProps {
  onClick: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ onClick }) => {
  const { unreadCount, fetchUserNotifications, isLoading } = useNotificationStore();
  const [prevUnreadCount, setPrevUnreadCount] = useState<number>(0);
  const [newNotification, setNewNotification] = useState<boolean>(false);
  
  // Track changes in unread count to show animations
  useEffect(() => {
    if (unreadCount > prevUnreadCount && prevUnreadCount !== 0) {
      setNewNotification(true);
      const timeout = setTimeout(() => setNewNotification(false), 3000);
      return () => clearTimeout(timeout);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);
  
  useEffect(() => {
    // Fetch notifications when component mounts
    fetchUserNotifications();
    
    // Set up polling to check for new notifications every minute
    const intervalId = setInterval(() => {
      fetchUserNotifications();
    }, 60000); // 1 minute
    
    return () => clearInterval(intervalId);
  }, [fetchUserNotifications]);
  
  return (
    <button 
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Notifications"
    >
      <motion.div
        animate={newNotification ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <FaBell className={`h-5 w-5 ${unreadCount > 0 ? 'text-blue-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} />
      </motion.div>
      
      {/* Badge with notification count */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Loading indicator */}
      {isLoading && (
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
      )}
    </button>
  );
};

export default NotificationBadge;
