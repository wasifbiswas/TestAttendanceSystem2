import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { Department, Employee } from '../../api/departmentApi';
import DepartmentAPI from '../../api/departmentApi';

interface AssignHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (employeeId: string) => Promise<void>;
  onRemove: (department: Department) => Promise<void>;
  department: Department;
}

const AssignHeadModal: React.FC<AssignHeadModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  onRemove,
  department
}) => {
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);

  // Fetch available employees when modal opens
  useEffect(() => {
    if (isOpen && department) {
      fetchAvailableEmployees();
    }
  }, [isOpen, department]);

  const fetchAvailableEmployees = async () => {
    setFetchingEmployees(true);
    try {
      const employees = await DepartmentAPI.getAvailableHeads(department._id);
      setAvailableEmployees(employees);
      // Set current head as selected if exists
      if (department.dept_head_id) {
        setSelectedEmployeeId(department.dept_head_id._id);
      }
    } catch (error) {
      console.error('Error fetching available employees:', error);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedEmployeeId) return;
    
    setLoading(true);
    try {
      await onAssign(selectedEmployeeId);
    } catch (error) {
      console.error('Error assigning department head:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await onRemove(department);
    } catch (error) {
      console.error('Error removing department head:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentHead = department.dept_head_id;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Manage Department Head
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Department Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department: {department.dept_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Employees: {department.employee_count}
                  </p>
                </div>

                {/* Current Department Head */}
                {currentHead && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Current Department Head
                    </h4>
                    <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <UserIcon className="w-10 h-10 text-blue-500 mr-3" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {currentHead.user_id.full_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {currentHead.employee_code} • {currentHead.user_id.email}
                        </p>
                      </div>
                      <button
                        onClick={handleRemove}
                        disabled={loading}
                        className="ml-3 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Available Employees */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {currentHead ? 'Change Department Head' : 'Assign Department Head'}
                  </h4>

                  {fetchingEmployees ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading employees...</span>
                    </div>
                  ) : availableEmployees.length === 0 ? (
                    <div className="text-center py-8">
                      <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No employees available in this department
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableEmployees.map((employee) => (
                        <label
                          key={employee._id}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedEmployeeId === employee._id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="employeeHead"
                            value={employee._id}
                            checked={selectedEmployeeId === employee._id}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="sr-only"
                          />
                          <UserIcon className="w-8 h-8 text-gray-400 mr-3" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {employee.user_id.full_name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {employee.employee_code} • {employee.user_id.email}
                            </p>
                            {employee.position && (
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {employee.position}
                              </p>
                            )}
                          </div>
                          {selectedEmployeeId === employee._id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {selectedEmployeeId && selectedEmployeeId !== currentHead?._id && (
              <button
                type="button"
                onClick={handleAssign}
                disabled={loading || !selectedEmployeeId}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Assigning...' : 'Assign as Head'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {selectedEmployeeId && selectedEmployeeId !== currentHead?._id ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignHeadModal;
