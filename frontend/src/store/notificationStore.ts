import { create } from 'zustand';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  createNotification,
  getAllNotifications,
  Notification
} from '../api/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUserNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  sendNotification: (notificationData: {
    title: string;
    message: string;
    recipients?: string[];
    department_id?: string;
    all_employees?: boolean;
    priority?: 'low' | 'medium' | 'high';
    expires_at?: string;
  }) => Promise<void>;
  fetchAllNotifications: (page?: number, limit?: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
    // Fetch notifications for the current user
  fetchUserNotifications: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`notificationStore: Fetching user notifications (page ${page}, limit ${limit})`);
      const response = await getUserNotifications(page, limit);
      
      // Check if we got a valid response with data property
      if (!response || !response.data) {
        console.error('Invalid notification response structure:', response);
        throw new Error('Invalid notification response');
      }
      
      // Detailed logging of notification data
      console.log('Notification response details:', {
        count: response.count,
        total: response.total,
        unread: response.unread,
        page: response.page,
        totalPages: response.pages
      });
      
      if (response.data.length > 0) {
        console.log('Sample notification:', {
          id: response.data[0]._id,
          title: response.data[0].title,
          from: response.data[0].sender?.username || 'Unknown sender',
          read: response.data[0].read
        });
      }
      
      set({
        notifications: response.data,
        unreadCount: response.unread,
        totalCount: response.total,
        currentPage: response.page,
        totalPages: response.pages,
        isLoading: false
      });
      
      console.log(`notificationStore: Updated with ${response.data.length} notifications, ${response.unread} unread`);
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      set({ 
        error: error.message || 'Failed to fetch notifications',
        isLoading: false 
      });
    }
  },
  
  // Mark a specific notification as read
  markAsRead: async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      const { notifications, unreadCount } = get();
      const updatedNotifications = notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true, read_at: new Date().toISOString() } 
          : notification
      );
      
      set({
        notifications: updatedNotifications,
        unreadCount: Math.max(0, unreadCount - 1)
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark notification as read' });
    }
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsRead();
      
      // Update local state
      const { notifications } = get();
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true,
        read_at: new Date().toISOString()
      }));
      
      set({
        notifications: updatedNotifications,
        unreadCount: 0
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark all notifications as read' });
    }
  },
  
  // Remove a notification
  removeNotification: async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      
      // Update local state
      const { notifications, unreadCount, totalCount } = get();
      const notification = notifications.find(n => n._id === notificationId);
      const updatedNotifications = notifications.filter(n => n._id !== notificationId);
      
      set({
        notifications: updatedNotifications,
        unreadCount: notification && !notification.read ? Math.max(0, unreadCount - 1) : unreadCount,
        totalCount: Math.max(0, totalCount - 1)
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete notification' });
    }
  },
    // Send a new notification (admin/manager)
  sendNotification: async (notificationData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Sending notification:', notificationData);
      const result = await createNotification(notificationData);
      console.log('Notification sent successfully, response:', result);
      
      // Always refresh notifications after sending - this helps ensure
      // the UI is synchronized with the latest state on the server
      const { fetchUserNotifications } = get();
      
      // Set loading to false before fetching to avoid UI lockup
      set({ isLoading: false });
      
      // Refresh notifications in background after a short delay to allow server processing
      setTimeout(() => {
        console.log('Refreshing notifications after sending new notification');
        fetchUserNotifications();
      }, 300);
      
      // Return the result so the caller can use it
      return result;
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      set({ 
        error: error.message || 'Failed to send notification',
        isLoading: false 
      });
      throw error; // Re-throw to let the caller handle it
    }
  },
  
  // Fetch all notifications (admin only)
  fetchAllNotifications: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getAllNotifications(page, limit);
      set({
        notifications: response.data,
        totalCount: response.total,
        currentPage: response.page,
        totalPages: response.pages,
        isLoading: false
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch all notifications',
        isLoading: false 
      });
    }
  }
}));
