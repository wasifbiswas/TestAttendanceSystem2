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
    console.log(`Fetching user notifications - page ${page}, limit ${limit}`);
    const response = await api.get<NotificationsResponse>(`/notifications?page=${page}&limit=${limit}`);
    console.log('Notifications response:', {
      count: response.data.count,
      unread: response.data.unread,
      total: response.data.total,
      data: response.data.data.length ? `${response.data.data.length} notifications` : 'No notifications'
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

// Function to mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.put('/notifications/read-all');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Function to delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    throw error;
  }
};  // Function to create a notification (admin/manager only)
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
    // Validate inputs before sending to server
    if (!notificationData.title || !notificationData.message) {
      throw new Error('Title and message are required');
    }
    
    // Ensure there's at least one recipient method specified
    if (!notificationData.recipients?.length && 
        !notificationData.department_id && 
        !notificationData.all_employees) {
      throw new Error('You must specify recipients, a department, or all employees');
    }
    
    console.log('API - createNotification - Request payload:', notificationData);
    
    // Log which endpoint we're calling
    console.log('API - createNotification - Calling endpoint: /notifications');
    
    // Since API_URL already includes '/api', we don't need to repeat it here
    const response = await api.post('/notifications', notificationData);
    console.log('API - createNotification - Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('API - Error creating notification:', error);
    
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      
      // Format error message based on server response
      const errorMessage = error.response.data?.message || 
                          (typeof error.response.data === 'string' ? error.response.data : 'Server error');
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something happened in setting up the request
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
};

// Function to get all notifications (admin only)
export const getAllNotifications = async (page = 1, limit = 10) => {
  try {
    const response = await api.get<NotificationsResponse>(`/notifications/all?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }
};
