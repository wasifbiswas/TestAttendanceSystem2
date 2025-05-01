import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaveRequest, LeaveType, getLeaveTypes } from '../api/attendance';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leaveData: any) => Promise<void>; // Changed type to any to match actual usage
}

const LeaveRequestModal = ({ isOpen, onClose, onSubmit }: LeaveRequestModalProps) => {
  // Update form data to track leaveTypeId instead of type
  const [formData, setFormData] = useState<{
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }>({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave types when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchLeaveTypes = async () => {
        setIsLoading(true);
        try {
          const types = await getLeaveTypes();
          setLeaveTypes(types);
          // Set the first leave type as default if available
          if (types.length > 0 && !formData.leaveTypeId) {
            setFormData(prev => ({ ...prev, leaveTypeId: types[0]._id }));
          }
          setIsLoading(false);
        } catch (err) {
          console.error('Failed to fetch leave types:', err);
          setError('Failed to load leave types. Please try again.');
          setIsLoading(false);
        }
      };

      fetchLeaveTypes();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Calculate duration in days
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const durationInDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Format the request according to backend API expectations
      const leaveRequest = {
        leave_type_id: formData.leaveTypeId, // Correct property name
        start_date: new Date(formData.startDate).toISOString(), // Correct property name
        end_date: new Date(formData.endDate).toISOString(), // Correct property name
        duration: durationInDays, // Required field
        reason: formData.reason,
        is_half_day: false // Default to false
      };

      // Send the properly formatted request to the API
      await onSubmit(leaveRequest);
      onClose();
      // Reset form
      setFormData({
        leaveTypeId: leaveTypes.length > 0 ? leaveTypes[0]._id : '',
        startDate: '',
        endDate: '',
        reason: ''
      });
    } catch (error: any) {
      setError(error.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Request Leave</h3>
            </div>
            
            {isLoading ? (
              <div className="p-6 flex justify-center">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6">
                {error && (
                  <div className="mb-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="leaveTypeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Leave Type
                    </label>
                    <select
                      id="leaveTypeId"
                      name="leaveTypeId"
                      value={formData.leaveTypeId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                      required
                    >
                      {leaveTypes.length === 0 && (
                        <option value="">No leave types available</option>
                      )}
                      {leaveTypes.map(type => (
                        <option key={type._id} value={type._id}>
                          {type.leave_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                        required
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm resize-none"
                      placeholder="Please provide a reason for your leave request"
                      required
                      minLength={5}
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || leaveTypes.length === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70 flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LeaveRequestModal;