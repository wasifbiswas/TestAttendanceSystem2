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
        ...formData,
        dept_name: formData.dept_name.trim(),
        description: formData.description?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        budget: formData.budget || undefined
      });
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

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Department Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      name="dept_name"
                      value={formData.dept_name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.dept_name
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      placeholder="Enter department name"
                    />
                    {errors.dept_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.dept_name}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter department description"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter department location"
                    />
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Budget ($)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={formData.budget || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter department budget"
                    />
                  </div>

                  {/* Employee Count (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Employees
                    </label>
                    <input
                      type="text"
                      value={`${department.employee_count} employees`}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Department'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDepartmentModal;
