import { useState } from 'react';
import { motion } from 'framer-motion';
import LeaveSyncButton from './LeaveSyncButton';

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  type: string;
  status: string;
}

interface RecentLeavesProps {
  leaves: LeaveRequest[];
  onSyncSuccess?: (id: string) => void;
  onSyncError?: (id: string, error: string) => void;
}

const RecentLeaves = ({ leaves, onSyncSuccess, onSyncError }: RecentLeavesProps) => {
  const [syncStatus, setSyncStatus] = useState<{[key: string]: 'syncing' | 'success' | 'error' | null}>({});

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

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">Recent Leave Requests</h3>
      </div>
      
      {leaves.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          No recent leave requests found.
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {leaves.map((leave, index) => (
            <motion.div 
              key={leave.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="block font-medium text-gray-900 dark:text-white">{leave.type} Leave</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                  </span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                  {leave.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-3">{leave.reason}</p>
              
              {leave.status === 'Approved' && (
                <div className="flex justify-end">
                  <LeaveSyncButton 
                    leaveRequest={leave}
                    onSuccess={() => handleSyncSuccess(leave.id)}
                    onError={(error) => handleSyncError(leave.id, error)}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentLeaves; 