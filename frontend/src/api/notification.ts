import api from './axios';

// Types
export interface Notification {
  _id: string;
  title: string;
  message: string;
  sender: {
    _id: string;
    username: string;
    full_name: string;
  };
  department?: {
    _id: string;
    name: string;
  } | null;
  created_at: string;
  expires_at: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  read_at: string | null;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  total: number;
  unread: number;
  page: number;
  pages: number;
  data: Notification[];
}

// Function to get user notifications with pagination
export const getUserNotifications = async (page = 1, limit = 10) => {
  try {
    const response = await api.get<NotificationsResponse>(`/api/notifications?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await api.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

// Function to mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Function to delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    const response = await api.delete(`/api/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
  }
};

// Function to create a notification (admin/manager only)
export const createNotification = async (notificationData: {
  title: string;
  message: string;
  recipients?: string[];
  department_id?: string;
  all_employees?: boolean;
  priority?: 'low' | 'medium' | 'high';
  expires_at?: string;
}) => {
  try {
    const response = await api.post('/api/notifications', notificationData);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Function to get all notifications (admin only)
export const getAllNotifications = async (page = 1, limit = 10) => {
  try {
    const response = await api.get<NotificationsResponse>(`/api/notifications/all?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }
};
