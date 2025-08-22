import React, { useState, useEffect } from 'react';
import { XMarkIcon, PencilSquareIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { BuildingOfficeIcon } from '@heroicons/react/24/solid';
import { Department, UpdateDepartmentData } from '../../api/departmentApi';

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateDepartmentData) => Promise<void>;
  department: Department;
}

const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  department
}) => {
  const [formData, setFormData] = useState<UpdateDepartmentData>({
    dept_name: '',
    description: '',
    status: 'ACTIVE',
    location: '',
    budget: undefined
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when department changes
  useEffect(() => {
    if (department) {
      setFormData({
        dept_name: department.dept_name,
        description: department.description || '',
        status: department.status,
        location: department.location || '',
        budget: department.budget
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Basic validation
      if (!formData.dept_name?.trim()) {
        setErrors({ dept_name: 'Department name is required' });
        return;
      }

      await onSubmit({
        dept_name: formData.dept_name.trim(),
        description: formData.description?.trim() || '',
        status: formData.status,
        location: formData.location?.trim() || '',
        budget: formData.budget
      });
      onClose();
    } catch (error) {
      console.error('Error updating department:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? (value ? parseFloat(value) : undefined) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Background overlay with blur effect */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all duration-300 w-full max-w-2xl mx-4 overflow-hidden">
          
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Edit Department
                  </h3>
                  <p className="text-indigo-100 text-sm">
                    Update department information
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                disabled={loading}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Current Department Info */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {department.dept_name}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <span className={`w-2 h-2 rounded-full ${
                        department.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      <span>{department.status}</span>
                    </div>
                    <div>👥 {department.employee_count} employees</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Department Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  name="dept_name"
                  value={formData.dept_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                    errors.dept_name 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter department name"
                  required
                />
                {errors.dept_name && (
                  <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                    <ExclamationCircleIcon className="w-4 h-4 mr-1" />
                    {errors.dept_name}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Enter department description (optional)"
                />
              </div>

              {/* Status and Location Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">🟢 Active</option>
                    <option value="INACTIVE">🔴 Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter location"
                  />
                </div>
              </div>

              {/* Budget and Employee Count Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter budget"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Current Employees
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 flex items-center">
                    <span className="text-lg mr-2">👥</span>
                    <span className="font-medium">{department.employee_count} employees</span>
                  </div>
                </div>
              </div>

              {/* Department Head Info */}
              {department.dept_head_id && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Department Head
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center space-x-3">
                    <span className="text-lg">👑</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {department.dept_head_id.user_id.full_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {department.dept_head_id.employee_code}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span>* Required fields</span>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Update Department</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
