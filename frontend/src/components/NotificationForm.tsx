import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { getAllDepartments } from '../api/admin';
import { FaTimes } from 'react-icons/fa';

// Interface for department data
interface Department {
  _id: string;
  dept_name: string;
  description?: string;
}

interface NotificationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationForm: React.FC<NotificationFormProps> = ({ isOpen, onClose }) => {
  const { isAdmin, isManager, user } = useAuthStore();
  const { sendNotification, isLoading, error } = useNotificationStore();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [expiryDays, setExpiryDays] = useState(7);
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [success, setSuccess] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  
  // Fetch departments 
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!isOpen) return;
      
      try {
        setFetchLoading(true);
        // Use the real API call instead of mock data
        const departmentsData = await getAllDepartments();
        setDepartments(departmentsData);
          // For managers, if department info is stored in the auth state, auto-select it
        if (isManager && departments.length > 0) {
          // Since we don't have direct departmentId in user, we'll either use cached info in auth state
          // or select the first available department if manager has only one department
          const managerDept = departments.length === 1 ? departments[0]._id : undefined;
          if (managerDept) {
            setSelectedDepartment(managerDept);
          }
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchDepartments();
  }, [isOpen, isManager, user]);
  
  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      // Reset after closing animation completes
      setTimeout(() => {
        setTitle('');
        setMessage('');
        setPriority('medium');
        setExpiryDays(7);
        setSendToAll(false);
        setSelectedDepartment('');
        setSuccess(false);
      }, 300);
    }
  }, [isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Calculate expires_at date
      const expires = new Date();
      expires.setDate(expires.getDate() + expiryDays);
      
      const notificationData = {
        title,
        message,
        priority,
        expires_at: expires.toISOString(),
        // Set the appropriate targeting based on user selection and role
        ...(isAdmin && sendToAll ? { all_employees: true } : {}),
        ...(isAdmin && !sendToAll && selectedDepartment ? { department_id: selectedDepartment } : {}),
        ...(isManager ? { department_id: selectedDepartment } : {})
      };
      
      await sendNotification(notificationData);
      setSuccess(true);
      
      // Auto close after 1.5 seconds on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        onClick={onClose}
      />
      
      {/* Form Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Send Notification
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4">
            {success ? (
              <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 p-4 rounded mb-4">
                Notification sent successfully!
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                    maxLength={100}
                    placeholder="Notification title"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="message" className="block text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                    maxLength={500}
                    placeholder="Notification message"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="priority" className="block text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="expiry" className="block text-gray-700 dark:text-gray-300 mb-2">
                    Expires After (days)
                  </label>
                  <select
                    id="expiry"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="1">1 day</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
                
                {/* Recipients Selection - Only for Admin */}
                {isAdmin && (
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id="sendToAll"
                        checked={sendToAll}
                        onChange={(e) => setSendToAll(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="sendToAll" className="text-gray-700 dark:text-gray-300">
                        Send to all employees
                      </label>
                    </div>
                    
                    {!sendToAll && (
                      <div>
                        <label htmlFor="department" className="block text-gray-700 dark:text-gray-300 mb-2">
                          Select Department
                        </label>
                        {fetchLoading ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span>Loading departments...</span>
                          </div>
                        ) : (
                          <select
                            id="department"
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            required={!sendToAll}
                          >
                            <option value="">Select a department</option>
                            {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.dept_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}
                  {/* Manager can only send to their department */}
                {isManager && (
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300">
                      Recipients: Your department{' '}
                      {selectedDepartment && departments.find(d => d._id === selectedDepartment)?.dept_name}
                    </p>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default NotificationForm;
