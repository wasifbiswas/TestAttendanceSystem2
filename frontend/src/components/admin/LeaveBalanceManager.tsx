import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaCalendarAlt, 
  FaEdit,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaCog
} from 'react-icons/fa';
import Toast from '../Toast';
import { 
  getLeaveTypes, 
  getEmployeeLeaveBalances, 
  updateLeaveBalance,
  LeaveType,
  EmployeeLeaveBalance
} from '../../api/attendance';

interface Employee {
  _id: string;
  employee_code: string;
  user_id: {
    full_name: string;
    email: string;
  };
  designation: string;
  department: string;
}

interface LeaveBalanceManagerProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
}

const LeaveBalanceManager: React.FC<LeaveBalanceManagerProps> = ({
  employees,
  isOpen,
  onClose
}) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [balances, setBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBalance, setEditingBalance] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const [bulkData, setBulkData] = useState<{
    leave_type_id: string;
    year: number;
    allocated_leaves: number;
    carried_forward: number;
  }>({
    leave_type_id: '',
    year: new Date().getFullYear(),
    allocated_leaves: 0,
    carried_forward: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchLeaveTypes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedEmployee && selectedYear) {
      fetchEmployeeBalances();
    }
  }, [selectedEmployee, selectedYear]);

  const fetchLeaveTypes = async () => {
    try {
      const data = await getLeaveTypes();
      setLeaveTypes(data);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchEmployeeBalances = async () => {
    if (!selectedEmployee) return;
    
    setIsLoading(true);
    try {
      const data = await getEmployeeLeaveBalances(selectedEmployee);
      // Filter by selected year
      const filteredData = data.filter(balance => balance.year === selectedYear);
      setBalances(filteredData);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setToast({
        visible: true,
        message: 'Failed to fetch leave balances',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBalance = async (balance: EmployeeLeaveBalance) => {
    setIsSubmitting(true);
    try {
      await updateLeaveBalance(selectedEmployee, {
        leave_type_id: balance.leave_type_id._id,
        year: selectedYear,
        allocated_leaves: balance.allocated_leaves,
        carried_forward: balance.carried_forward
      });
      
      setToast({
        visible: true,
        message: 'Leave balance updated successfully',
        type: 'success'
      });
      
      await fetchEmployeeBalances();
      setEditingBalance(null);
    } catch (error) {
      setToast({
        visible: true,
        message: 'Failed to update leave balance',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkData.leave_type_id || employees.length === 0) {
      setToast({
        visible: true,
        message: 'Please select a leave type and ensure employees are available',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = employees.map(employee =>
        updateLeaveBalance(employee._id, {
          leave_type_id: bulkData.leave_type_id,
          year: bulkData.year,
          allocated_leaves: bulkData.allocated_leaves,
          carried_forward: bulkData.carried_forward
        })
      );

      await Promise.all(promises);

      setToast({
        visible: true,
        message: `Successfully updated leave balances for ${employees.length} employees`,
        type: 'success'
      });

      // Refresh balances if an employee is selected
      if (selectedEmployee) {
        await fetchEmployeeBalances();
      }

      setBulkMode(false);
      setBulkData({
        leave_type_id: '',
        year: new Date().getFullYear(),
        allocated_leaves: 0,
        carried_forward: 0
      });
    } catch (error) {
      setToast({
        visible: true,
        message: 'Failed to update leave balances',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBalanceField = (balanceId: string, field: string, value: number) => {
    setBalances(prev => prev.map(balance => 
      balance._id === balanceId 
        ? { ...balance, [field]: value }
        : balance
    ));
  };

  const calculateRemainingDays = (balance: EmployeeLeaveBalance) => {
    return balance.allocated_leaves + balance.carried_forward - balance.used_leaves - balance.pending_leaves;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FaCalendarAlt className="h-6 w-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Leave Balance Manager
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.visible}
          onClose={() => setToast({ ...toast, visible: false })}
          duration={5000}
        />

        <div className="p-6">
          {/* Mode Selection */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={() => setBulkMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                !bulkMode 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <FaUsers className="inline mr-2" />
              Individual Management
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                bulkMode 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <FaCog className="inline mr-2" />
              Bulk Assignment
            </button>
          </div>

          {!bulkMode ? (
            // Individual Management Mode
            <div>
              {/* Employee and Year Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Employee
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(employee => (
                      <option key={employee._id} value={employee._id}>
                        {employee.user_id.full_name} ({employee.employee_code}) - {employee.designation}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Leave Balances Table */}
              {selectedEmployee && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Leave Balances for {selectedYear}
                    </h4>
                  </div>

                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading balances...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Leave Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Allocated
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Carried Forward
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Used
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Pending
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Remaining
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {balances.map((balance, index) => (
                            <tr key={balance._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {balance.leave_type_id.leave_name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {balance.leave_type_id.leave_code}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingBalance === balance._id ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={balance.allocated_leaves}
                                    onChange={(e) => updateBalanceField(balance._id, 'allocated_leaves', parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {balance.allocated_leaves} days
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {editingBalance === balance._id ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={balance.carried_forward}
                                    onChange={(e) => updateBalanceField(balance._id, 'carried_forward', parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {balance.carried_forward} days
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {balance.used_leaves} days
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {balance.pending_leaves} days
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${
                                  calculateRemainingDays(balance) > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {calculateRemainingDays(balance)} days
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {editingBalance === balance._id ? (
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => handleSaveBalance(balance)}
                                      disabled={isSubmitting}
                                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                    >
                                      <FaSave className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingBalance(null)}
                                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                      <FaTimes className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setEditingBalance(balance._id)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <FaEdit className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {balances.length === 0 && !isLoading && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No leave balances found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Bulk Assignment Mode
            <div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <div className="flex">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Bulk Assignment Mode
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This will update leave balances for all {employees.length} employees in the selected department/organization.
                      Use with caution as this action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Leave Type *
                  </label>
                  <select
                    value={bulkData.leave_type_id}
                    onChange={(e) => setBulkData({ ...bulkData, leave_type_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    <option value="">Select leave type...</option>
                    {leaveTypes.map(type => (
                      <option key={type._id} value={type._id}>
                        {type.leave_name} ({type.leave_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year *
                  </label>
                  <select
                    value={bulkData.year}
                    onChange={(e) => setBulkData({ ...bulkData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allocated Leaves *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={bulkData.allocated_leaves}
                    onChange={(e) => setBulkData({ ...bulkData, allocated_leaves: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Enter days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Carried Forward
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={bulkData.carried_forward}
                    onChange={(e) => setBulkData({ ...bulkData, carried_forward: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder="Enter days"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setBulkMode(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpdate}
                  disabled={isSubmitting || !bulkData.leave_type_id}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FaSave className="mr-2" />
                  )}
                  Update All Employees
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LeaveBalanceManager;
