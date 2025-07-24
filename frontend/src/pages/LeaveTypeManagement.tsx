import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/Toast';
import { 
  getLeaveTypes, 
  createLeaveType, 
  updateLeaveType, 
  deleteLeaveType,
  LeaveType,
  CreateLeaveTypeData,
  UpdateLeaveTypeData
} from '../api/attendance';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaArrowLeft, 
  FaSave, 
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';

interface LeaveTypeFormData {
  leave_code: string;
  leave_name: string;
  description: string;
  is_carry_forward: boolean;
  default_annual_quota: number;
  requires_approval: boolean;
  max_consecutive_days: number;
}

interface FormErrors {
  leave_code?: string;
  leave_name?: string;
  description?: string;
  default_annual_quota?: string;
  requires_approval?: string;
  max_consecutive_days?: string;
}

const LeaveTypeManagement: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const [formData, setFormData] = useState<LeaveTypeFormData>({
    leave_code: '',
    leave_name: '',
    description: '',
    is_carry_forward: false,
    default_annual_quota: 0,
    requires_approval: true,
    max_consecutive_days: 0
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  // Check if user is admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchLeaveTypes();
  }, [isAdmin, navigate]);

  const fetchLeaveTypes = async () => {
    setIsLoading(true);
    try {
      const data = await getLeaveTypes();
      setLeaveTypes(data);
    } catch (error) {
      setToast({
        visible: true,
        message: 'Failed to fetch leave types',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.leave_code.trim()) {
      newErrors.leave_code = 'Leave code is required';
    } else if (!/^[A-Z0-9_]+$/.test(formData.leave_code)) {
      newErrors.leave_code = 'Leave code must contain only uppercase letters, numbers, and underscores';
    } else if (formData.leave_code.length > 10) {
      newErrors.leave_code = 'Leave code cannot exceed 10 characters';
    }

    if (!formData.leave_name.trim()) {
      newErrors.leave_name = 'Leave name is required';
    } else if (formData.leave_name.length > 100) {
      newErrors.leave_name = 'Leave name cannot exceed 100 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    if (formData.default_annual_quota < 0 || formData.default_annual_quota > 365) {
      newErrors.default_annual_quota = 'Annual quota must be between 0 and 365 days';
    }

    if (formData.max_consecutive_days < 0 || formData.max_consecutive_days > 365) {
      newErrors.max_consecutive_days = 'Max consecutive days must be between 0 and 365 days';
    }

    // Check for duplicate leave code (excluding current editing item)
    const duplicateCode = leaveTypes.find(lt => 
      lt.leave_code === formData.leave_code && 
      (!editingLeaveType || lt._id !== editingLeaveType._id)
    );
    if (duplicateCode) {
      newErrors.leave_code = 'Leave code already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingLeaveType) {
        // Update existing leave type
        const updateData: UpdateLeaveTypeData = { ...formData };
        await updateLeaveType(editingLeaveType._id, updateData);
        setToast({
          visible: true,
          message: 'Leave type updated successfully',
          type: 'success'
        });
      } else {
        // Create new leave type
        const createData: CreateLeaveTypeData = { ...formData };
        await createLeaveType(createData);
        setToast({
          visible: true,
          message: 'Leave type created successfully',
          type: 'success'
        });
      }
      
      await fetchLeaveTypes();
      handleCloseModal();
    } catch (error: any) {
      setToast({
        visible: true,
        message: error.response?.data?.message || 'Failed to save leave type',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
    setFormData({
      leave_code: leaveType.leave_code,
      leave_name: leaveType.leave_name,
      description: leaveType.description || '',
      is_carry_forward: leaveType.is_carry_forward,
      default_annual_quota: leaveType.default_annual_quota,
      requires_approval: leaveType.requires_approval,
      max_consecutive_days: leaveType.max_consecutive_days
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLeaveType(id);
      setToast({
        visible: true,
        message: 'Leave type deleted successfully',
        type: 'success'
      });
      await fetchLeaveTypes();
    } catch (error: any) {
      setToast({
        visible: true,
        message: error.response?.data?.message || 'Failed to delete leave type',
        type: 'error'
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleOpenModal = () => {
    setEditingLeaveType(null);
    setFormData({
      leave_code: '',
      leave_name: '',
      description: '',
      is_carry_forward: false,
      default_annual_quota: 0,
      requires_approval: true,
      max_consecutive_days: 0
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLeaveType(null);
    setFormData({
      leave_code: '',
      leave_name: '',
      description: '',
      is_carry_forward: false,
      default_annual_quota: 0,
      requires_approval: true,
      max_consecutive_days: 0
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               name === 'default_annual_quota' || name === 'max_consecutive_days' ? 
               parseInt(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={5000}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-between items-center"
      >
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin')}
            className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            aria-label="Go back to admin dashboard"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Leave Type Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure and manage leave types for your organization
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Leave Type
        </button>
      </motion.div>

      {/* Leave Types List */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Current Leave Types ({leaveTypes.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Annual Quota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Max Consecutive
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leaveTypes.map((leaveType, index) => (
                <motion.tr
                  key={leaveType._id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
                      {leaveType.leave_code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {leaveType.leave_name}
                      </div>
                      {leaveType.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {leaveType.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {leaveType.default_annual_quota} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {leaveType.is_carry_forward && (
                        <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded text-xs">
                          Carry Forward
                        </span>
                      )}
                      {leaveType.requires_approval && (
                        <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded text-xs">
                          Approval Required
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {leaveType.max_consecutive_days === 0 ? 'Unlimited' : `${leaveType.max_consecutive_days} days`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(leaveType)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit leave type"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(leaveType._id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete leave type"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {leaveTypes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No leave types found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Leave Code *
                  </label>
                  <input
                    type="text"
                    name="leave_code"
                    value={formData.leave_code}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      errors.leave_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., AL, SL, ML"
                    maxLength={10}
                  />
                  {errors.leave_code && (
                    <p className="mt-1 text-sm text-red-600">{errors.leave_code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Annual Quota (Days) *
                  </label>
                  <input
                    type="number"
                    name="default_annual_quota"
                    value={formData.default_annual_quota}
                    onChange={handleInputChange}
                    min="0"
                    max="365"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                      errors.default_annual_quota ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.default_annual_quota && (
                    <p className="mt-1 text-sm text-red-600">{errors.default_annual_quota}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Leave Name *
                </label>
                <input
                  type="text"
                  name="leave_name"
                  value={formData.leave_name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    errors.leave_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Annual Leave, Sick Leave"
                  maxLength={100}
                />
                {errors.leave_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.leave_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Optional description of the leave type"
                  maxLength={500}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Consecutive Days (0 = Unlimited)
                </label>
                <input
                  type="number"
                  name="max_consecutive_days"
                  value={formData.max_consecutive_days}
                  onChange={handleInputChange}
                  min="0"
                  max="365"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    errors.max_consecutive_days ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.max_consecutive_days && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_consecutive_days}</p>
                )}
              </div>

              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_carry_forward"
                    checked={formData.is_carry_forward}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Allow Carry Forward
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requires_approval"
                    checked={formData.requires_approval}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Requires Approval
                  </span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      {editingLeaveType ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
                <FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Leave Type
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this leave type? This will remove it permanently 
              and may affect existing leave records.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
              >
                <FaTrash className="mr-2" />
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LeaveTypeManagement;
