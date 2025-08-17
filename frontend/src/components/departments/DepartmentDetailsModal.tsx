import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  BanknotesIcon, 
  MapPinIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon 
} from '@heroicons/react/24/outline';
import { Department } from '../../api/departmentApi';
import DepartmentAPI from '../../api/departmentApi';

interface DepartmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
}

const DepartmentDetailsModal: React.FC<DepartmentDetailsModalProps> = ({
  isOpen,
  onClose,
  department
}) => {
  const [detailedDepartment, setDetailedDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && department) {
      fetchDepartmentDetails();
    }
  }, [isOpen, department]);

  const fetchDepartmentDetails = async () => {
    setLoading(true);
    try {
      const details = await DepartmentAPI.getById(department._id);
      setDetailedDepartment(details);
    } catch (error) {
      console.error('Error fetching department details:', error);
      setDetailedDepartment(department);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const deptData = detailedDepartment || department;

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <h3 className="text-xl leading-6 font-medium text-gray-900 dark:text-white">
                    {deptData.dept_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Department Details</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading details...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Department Name
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">{deptData.dept_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Status
                        </label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          deptData.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {deptData.status === 'ACTIVE' ? (
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircleIcon className="w-3 h-3 mr-1" />
                          )}
                          {deptData.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location
                        </label>
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <MapPinIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {deptData.location || 'Not specified'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Budget
                        </label>
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <BanknotesIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {formatCurrency(deptData.budget)}
                        </div>
                      </div>
                    </div>
                    {deptData.description && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">{deptData.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Department Head */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Department Head
                    </h4>
                    {deptData.dept_head_id ? (
                      <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <UserIcon className="w-12 h-12 text-blue-500 mr-4" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {deptData.dept_head_id.user_id.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Employee Code: {deptData.dept_head_id.employee_code}
                          </p>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <EnvelopeIcon className="w-4 h-4 mr-1" />
                            {deptData.dept_head_id.user_id.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">No department head assigned</p>
                      </div>
                    )}
                  </div>

                  {/* Employees List */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Department Employees
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        {deptData.employee_count} employees
                      </div>
                    </div>
                    
                    {deptData.employees && deptData.employees.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {deptData.employees.map((employee) => (
                          <div
                            key={employee._id}
                            className="flex items-center p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500"
                          >
                            <UserIcon className="w-8 h-8 text-gray-400 mr-3" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {employee.user_id.full_name}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {employee.employee_code}
                              </p>
                              {employee.position && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  {employee.position}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                                <EnvelopeIcon className="w-3 h-3 mr-1" />
                                {employee.user_id.email}
                              </div>
                              {employee.user_id.contact_number && (
                                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <PhoneIcon className="w-3 h-3 mr-1" />
                                  {employee.user_id.contact_number}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">No employees assigned</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics & Metadata */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Quick Stats
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Employees</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {deptData.employee_count}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Department Head</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {deptData.dept_head_id ? 'Assigned' : 'Not Assigned'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <span className={`text-sm font-medium ${
                          deptData.status === 'ACTIVE' 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {deptData.status}
                        </span>
                      </div>
                      {deptData.budget && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Budget</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(deptData.budget)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Metadata
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Created
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(deptData.createdAt)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Last Updated
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatDate(deptData.updatedAt)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Department ID
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                          {deptData._id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsModal;
