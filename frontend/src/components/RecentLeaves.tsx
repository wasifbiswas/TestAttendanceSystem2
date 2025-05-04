import { useState } from 'react';
import { motion } from 'framer-motion';
import LeaveSyncButton from './LeaveSyncButton';
import { FaTrash, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  status: string;
  leave_type_id?: {
    _id: string;
    leave_name: string;
    leave_code?: string;
  };
}

interface RecentLeavesProps {
  leaves: LeaveRequest[];
  onSyncSuccess?: (id: string) => void;
  onSyncError?: (id: string, error: string) => void;
  onDeleteLeave?: (id: string) => void;
  onClearAllLeaves?: () => void;
  onClearDashboard?: () => void; // Adding the missing prop
}

const RecentLeaves = ({ 
  leaves, 
  onSyncSuccess, 
  onSyncError,
  onDeleteLeave,
  onClearAllLeaves,
  onClearDashboard // Adding the prop to destructuring
}: RecentLeavesProps) => {
  const [syncStatus, setSyncStatus] = useState<{[key: string]: 'syncing' | 'success' | 'error' | null}>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleSyncSuccess = (id: string) => {
    setSyncStatus(prev => ({ ...prev, [id]: 'success' }));
    if (onSyncSuccess) onSyncSuccess(id);
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, [id]: null }));
    }, 3000);
  };

  const handleSyncError = (id: string, error: string) => {
    setSyncStatus(prev => ({ ...prev, [id]: 'error' }));
    if (onSyncError) onSyncError(id, error);
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setSyncStatus(prev => ({ ...prev, [id]: null }));
    }, 3000);
  };

  const handleDeleteLeave = (id: string) => {
    if (onDeleteLeave) {
      onDeleteLeave(id);
    }
    setShowDeleteConfirm(null);
  };

  const handleClearAll = () => {
    if (onClearAllLeaves) {
      onClearAllLeaves();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  // Helper function to get the leave name
  const getLeaveName = (leave: LeaveRequest) => {
    // If leave_type_id with leave_name exists, use that
    if (leave.leave_type_id && leave.leave_type_id.leave_name) {
      return leave.leave_type_id.leave_name;
    }
    // Otherwise fall back to the type property
    return leave.type ? `${leave.type} Leave` : 'Leave';
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center cursor-pointer" onClick={toggleExpanded}>
          {isExpanded ? 
            <FaChevronDown className="text-gray-500 dark:text-gray-400 mr-2" /> : 
            <FaChevronUp className="text-gray-500 dark:text-gray-400 mr-2" />
          }
          <h3 className="font-medium text-gray-900 dark:text-white">Recent Leave Requests</h3>
        </div>
        {leaves.length > 0 && isExpanded && (
          <button
            onClick={handleClearAll}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center"
            title="Clear all leave requests"
          >
            <FaTrash className="mr-1" size={14} />
            Clear All
          </button>
        )}
      </div>
      
      {!isExpanded ? null : leaves.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          No recent leave requests found.
        </div>
      ) : (
        <motion.div 
          className="divide-y divide-gray-200 dark:divide-gray-700"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {leaves.map((leave, index) => (
            <motion.div 
              key={leave.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors relative"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="block font-medium text-gray-900 dark:text-white">{getLeaveName(leave)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(leave.start_date).toLocaleDateString('en-GB')} - {new Date(leave.end_date).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                  {leave.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3 pr-6">{leave.reason}</p>
              
              <div className="flex justify-end items-center">
                {leave.status === 'Approved' && (
                  <LeaveSyncButton 
                    leaveRequest={leave}
                    onSuccess={() => handleSyncSuccess(leave.id)}
                    onError={(error) => handleSyncError(leave.id, error)}
                  />
                )}
                
                {/* Delete button */}
                {showDeleteConfirm === leave.id ? (
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleDeleteLeave(leave.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white text-xs px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(leave.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                    title="Delete leave request"
                  >
                    <FaTrash size={14} />
                  </button>
                )}
              </div>

              {/* Absolute positioned delete button for small screens */}
              {showDeleteConfirm !== leave.id && (
                <button
                  onClick={() => setShowDeleteConfirm(leave.id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 md:hidden"
                  title="Delete leave request"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default RecentLeaves;