import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { Department, Employee } from '../../api/departmentApi';
import DepartmentAPI from '../../api/departmentApi';

interface AssignHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (employeeId: string) => Promise<void>;
  onRemove: () => Promise<void>;
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
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  // Fetch available employees when modal opens
  useEffect(() => {
    if (isOpen && department) {
      fetchAvailableEmployees();
      setSelectedEmployeeId(department.dept_head_id?._id || '');
    }
  }, [isOpen, department]);

  // Filter employees based on search term
  useEffect(() => {
    const filtered = availableEmployees.filter(employee =>
      employee.user_id.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.user_id.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.position && employee.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEmployees(filtered);
  }, [availableEmployees, searchTerm]);

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
      onClose();
    } catch (error) {
      console.error('Error assigning department head:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await onRemove();
      onClose();
    } catch (error) {
      console.error('Error removing department head:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentHead = department.dept_head_id;
  const hasChanges = selectedEmployeeId !== (department.dept_head_id?._id || '');
  const isRemoving = department.dept_head_id && !selectedEmployeeId;

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
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👑</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Manage Department Head
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {department.dept_name}
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
          <div className="p-6">
            {/* Current Head Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Current Department Head
              </h4>
              {currentHead ? (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <UserCircleIcon className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">👑</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {currentHead.user_id.full_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentHead.employee_code} • {currentHead.user_id.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Current Head
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                    <UserIcon className="w-5 h-5" />
                    <span>No department head assigned</span>
                  </div>
                </div>
              )}
            </div>

            {/* Search Section */}
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                Select New Department Head
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, email, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="max-h-80 overflow-y-auto">
              {fetchingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading employees...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No employees found matching your search' : 'No available employees found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* None option */}
                  <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    selectedEmployeeId === '' 
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="employee"
                      value=""
                      checked={selectedEmployeeId === ''}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400">✕</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Remove Department Head
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No one will be assigned as department head
                        </p>
                      </div>
                      {selectedEmployeeId === '' && (
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Employee options */}
                  {filteredEmployees.map((employee) => (
                    <label
                      key={employee._id}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selectedEmployeeId === employee._id 
                          ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="employee"
                        value={employee._id}
                        checked={selectedEmployeeId === employee._id}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="relative">
                          <UserCircleIcon className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                          {employee._id === currentHead?._id && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">👑</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {employee.user_id.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {employee.employee_code} • {employee.user_id.email}
                          </p>
                          {employee.position && (
                            <p className="text-sm text-purple-600 dark:text-purple-400">
                              {employee.position}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {employee._id === currentHead?._id && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mb-2">
                              Current
                            </span>
                          )}
                          {selectedEmployeeId === employee._id && (
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <CheckIcon className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {hasChanges && (
                  <span>
                    {isRemoving ? '⚠️ This will remove the current department head' : '✨ This will assign a new department head'}
                  </span>
                )}
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
                {hasChanges && (
                  <button
                    type="button"
                    onClick={isRemoving ? handleRemove : handleAssign}
                    disabled={loading}
                    className={`px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                      isRemoving 
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    } shadow-lg hover:shadow-xl disabled:opacity-50`}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{isRemoving ? 'Remove Head' : 'Assign Head'}</span>
                        <span>{isRemoving ? '🗑️' : '👑'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignHeadModal;
