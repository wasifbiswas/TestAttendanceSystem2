import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetailedLeaveRequest, EmployeeLeaveBalance, getLeaveRequestDetails, getEmployeeLeaveBalances } from '../../api/attendance';

interface LeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveId: string | null;
}

const LeaveDetailModal = ({ isOpen, onClose, leaveId }: LeaveDetailModalProps) => {
  const [leaveDetails, setLeaveDetails] = useState<DetailedLeaveRequest | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!leaveId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching leave details for ID:', leaveId);
        // Get leave request details
        const details = await getLeaveRequestDetails(leaveId);
        console.log('Received leave details:', details);
        setLeaveDetails(details);
        
        if (!details.emp_id || !details.emp_id._id) {
          throw new Error('Employee details not found in leave request');
        }
        
        // Get employee leave balances
        const balances = await getEmployeeLeaveBalances(details.emp_id._id);
        setLeaveBalances(balances);
      } catch (err: any) {
        console.error('Error fetching leave details:', err);
        setError(err.message || 'Failed to load leave details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen && leaveId) {
      fetchDetails();
    } else {
      // Reset state when modal closes
      setLeaveDetails(null);
      setLeaveBalances([]);
    }
  }, [isOpen, leaveId]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Calculate remaining leave balance
  const calculateRemainingBalance = (leaveTypeId: string) => {
    const balance = leaveBalances.find(balance => 
      balance.leave_type_id._id === leaveTypeId
    );
    
    if (!balance) return 'N/A';
    
    const remaining = balance.allocated_leaves + 
                     balance.carried_forward - 
                     balance.used_leaves - 
                     balance.pending_leaves;
                     
    return remaining;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Leave Request Details</h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
              {isLoading ? (
                <div className="p-6 flex justify-center">
                  <svg className="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : error ? (
                <div className="p-6">
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
                    {error}
                  </div>
                </div>
              ) : leaveDetails && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee Information */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white text-lg mb-4">Employee Details</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Name</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {leaveDetails.emp_id.user_id.full_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Employee ID</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {leaveDetails.emp_id.employee_code}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Designation</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {leaveDetails.emp_id.designation}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Email</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {leaveDetails.emp_id.user_id.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Leave Information */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white text-lg mb-4">Leave Details</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Leave Type</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {leaveDetails.leave_type_id.leave_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Duration</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {leaveDetails.duration} day(s)
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Period</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(leaveDetails.start_date).toLocaleDateString()} - {new Date(leaveDetails.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">Status</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            leaveDetails.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                            leaveDetails.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {leaveDetails.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white text-lg mb-2">Leave Reason</h4>
                    <p className="text-gray-700 dark:text-gray-300">{leaveDetails.reason}</p>
                  </div>

                  {/* Leave Balance */}
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 dark:text-white text-lg mb-4">Leave Balances</h4>
                    <div className="overflow-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Leave Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Used</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pending</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Remaining</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {leaveBalances.map((balance) => (
                            <tr key={balance._id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {balance.leave_type_id.leave_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {balance.allocated_leaves + balance.carried_forward}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {balance.used_leaves}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {balance.pending_leaves}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {calculateRemainingBalance(balance.leave_type_id._id)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeaveDetailModal;