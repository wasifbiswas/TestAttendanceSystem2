import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UserIcon,
  EnvelopeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { BuildingOfficeIcon as BuildingOfficeSolidIcon } from '@heroicons/react/24/solid';
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
  const createdDate = new Date(deptData.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const updatedDate = new Date(deptData.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Background overlay with blur effect */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        ></div>

        {/* Modal Container */}
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all duration-300 w-full max-w-4xl mx-4 overflow-hidden">
          
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <BuildingOfficeSolidIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {deptData.dept_name}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Department Details & Overview
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                disabled={loading}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600 dark:text-gray-400 text-lg">Loading department details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status and Key Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Status Card */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        deptData.status === 'ACTIVE' 
                          ? 'bg-green-500' 
                          : 'bg-red-500'
                      }`}>
                        {deptData.status === 'ACTIVE' ? (
                          <CheckCircleIcon className="w-6 h-6 text-white" />
                        ) : (
                          <XCircleIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {deptData.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Employee Count Card */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {deptData.employee_count}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Department Type Card */}
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          Operations
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Created Date Card */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-600/30 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {createdDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Basic Information */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <IdentificationIcon className="w-5 h-5 mr-2 text-blue-500" />
                        Basic Information
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                              Department Name
                            </label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {deptData.dept_name}
                            </p>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                              Department Code
                            </label>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {deptData.dept_name.substring(0, 3).toUpperCase()}{deptData.employee_count.toString().padStart(3, '0')}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                            Description
                          </label>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {deptData.description || 'No description provided for this department.'}
                          </p>
                        </div>

                        {/* Working Hours & Priority */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                              Working Hours
                            </label>
                            <div className="flex items-center space-x-2">
                              <ClockIcon className="w-4 h-4 text-blue-500" />
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                9:00 AM - 5:00 PM
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                              Priority Level
                            </label>
                            <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Medium Priority
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Department Head & Statistics */}
                  <div className="space-y-6">
                    
                    {/* Department Head */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <span className="text-lg mr-2">👑</span>
                        Department Head
                      </h4>
                      {deptData.dept_head_id ? (
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                              <UserIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {deptData.dept_head_id.user_id.full_name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Employee ID: {deptData.dept_head_id.employee_code}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-600">
                            <div className="flex items-center space-x-2 mb-2">
                              <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {deptData.dept_head_id.user_id.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <UserIcon className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            No department head assigned
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2 text-green-500" />
                        Quick Statistics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Employees</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{deptData.employee_count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Active Status</span>
                          <span className={`font-semibold ${
                            deptData.status === 'ACTIVE' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {deptData.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Created On</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{createdDate}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{updatedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee List Preview */}
                {detailedDepartment?.employees && detailedDepartment.employees.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-2 text-blue-500" />
                      Department Employees ({detailedDepartment.employees.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {detailedDepartment.employees.map((employee) => (
                        <div key={employee._id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {employee.user_id.full_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {employee.employee_code}
                                {employee.position && ` • ${employee.position}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Department ID: {deptData._id}
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetailsModal;
