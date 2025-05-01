import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaveRequest, LeaveType, getLeaveTypes } from '../api/attendance';
import { useAuthStore } from '../store/authStore';
import { FaVenus, FaMars } from 'react-icons/fa';

// Gender-specific leave type codes
const GENDER_SPECIFIC_LEAVES = {
  FEMALE: ['ML', 'MATERNITY'], // Maternity leave codes
  MALE: ['PL', 'PATERNITY'],   // Paternity leave codes
};

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leaveData: any) => Promise<void>; // Changed type to any to match actual usage
}

const LeaveRequestModal = ({ isOpen, onClose, onSubmit }: LeaveRequestModalProps) => {
  const { user } = useAuthStore();
  
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
  const [filteredLeaveTypes, setFilteredLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<'MALE' | 'FEMALE' | null>(null);

  // Determine user's gender based on profile info
  useEffect(() => {
    // If we have user gender in the profile or employee info, use it
    // For now, use a heuristic based on the user's full name or role
    // This should be replaced with actual gender data from your API when available
    if (user) {
      // This is a simplified example - in a real app, you'd get the gender from the user profile
      const name = user.full_name || '';
      // Simple heuristic - in a real app, replace this logic with actual gender data
      // This is just a placeholder and should be replaced with proper gender determination
      if (name.endsWith('a') || name.endsWith('i')) {
        setUserGender('FEMALE');
      } else {
        setUserGender('MALE');
      }
    }
  }, [user]);

  // Helper function to determine if a leave type is gender-specific
  const getLeaveGenderType = (leaveType: LeaveType): 'MALE' | 'FEMALE' | null => {
    const code = leaveType.leave_code || '';
    const name = leaveType.leave_name || '';
    
    // Check for female-specific leaves
    if (GENDER_SPECIFIC_LEAVES.FEMALE.some(c => 
        code.includes(c) || 
        name.toUpperCase().includes('MATERNITY'))) {
      return 'FEMALE';
    }
    
    // Check for male-specific leaves
    if (GENDER_SPECIFIC_LEAVES.MALE.some(c => 
        code.includes(c) || 
        name.toUpperCase().includes('PATERNITY'))) {
      return 'MALE';
    }
    
    return null;
  };

  // Filter leave types based on gender
  useEffect(() => {
    if (leaveTypes.length > 0) {
      // Apply gender-based filtering
      const filtered = leaveTypes.filter(leaveType => {
        const genderType = getLeaveGenderType(leaveType);
        
        // If it's a gender-specific leave, check if it matches the user's gender
        if (genderType) {
          return genderType === userGender;
        }
        
        // Non-gender-specific leaves are available to all
        return true;
      });
      
      setFilteredLeaveTypes(filtered);
      
      // Update the selected leave type if the current one isn't available after filtering
      if (filtered.length > 0 && formData.leaveTypeId) {
        const currentTypeExists = filtered.some(type => type._id === formData.leaveTypeId);
        if (!currentTypeExists) {
          setFormData(prev => ({ ...prev, leaveTypeId: filtered[0]._id }));
        }
      }
    }
  }, [leaveTypes, userGender]);

  // Fetch leave types when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchLeaveTypes = async () => {
        setIsLoading(true);
        try {
          const types = await getLeaveTypes();
          setLeaveTypes(types);
          
          // Set the first valid leave type as default if available
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
        leaveTypeId: filteredLeaveTypes.length > 0 ? filteredLeaveTypes[0]._id : '',
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

  // Get gender icon for leave type
  const getLeaveTypeIcon = (leaveType: LeaveType) => {
    const genderType = getLeaveGenderType(leaveType);
    if (genderType === 'FEMALE') {
      return <FaVenus className="text-pink-500 ml-1" />;
    } else if (genderType === 'MALE') {
      return <FaMars className="text-blue-500 ml-1" />;
    }
    return null;
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get the selected leave type object
  const getSelectedLeaveType = (): LeaveType | undefined => {
    return leaveTypes.find(type => type._id === formData.leaveTypeId);
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
                    <div className="relative">
                      <select
                        id="leaveTypeId"
                        name="leaveTypeId"
                        value={formData.leaveTypeId}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white text-sm"
                        required
                      >
                        {filteredLeaveTypes.length === 0 && (
                          <option value="">No leave types available</option>
                        )}
                        {filteredLeaveTypes.map(type => (
                          <option key={type._id} value={type._id}>
                            {type.leave_name}
                          </option>
                        ))}
                      </select>
                      {/* Display gender icon for selected leave type */}
                      <div className="absolute right-10 top-2.5">
                        {getSelectedLeaveType() && getLeaveTypeIcon(getSelectedLeaveType()!)}
                      </div>
                    </div>
                    
                    {/* Gender-specific leave indicator if applicable */}
                    {getSelectedLeaveType() && getLeaveGenderType(getSelectedLeaveType()!) && (
                      <div className={`mt-1 text-xs font-medium inline-flex items-center rounded-full px-2 py-1 ${
                        getLeaveGenderType(getSelectedLeaveType()!) === 'FEMALE' 
                          ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {getLeaveGenderType(getSelectedLeaveType()!) === 'FEMALE' 
                          ? <><FaVenus className="mr-1" /> Maternity Leave</>
                          : <><FaMars className="mr-1" /> Paternity Leave</>
                        }
                      </div>
                    )}
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
                    disabled={isSubmitting || filteredLeaveTypes.length === 0}
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