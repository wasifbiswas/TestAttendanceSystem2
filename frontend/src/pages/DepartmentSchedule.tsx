import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useManagerAPI } from '../api/manager';
import { motion } from 'framer-motion';
import Toast from '../components/Toast';
import { FaCalendarAlt, FaArrowLeft, FaPlus, FaSave, FaTimes } from 'react-icons/fa';

interface ScheduleItem {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  shift: 'morning' | 'evening' | 'night';
  status: 'scheduled' | 'completed' | 'missed';
}

interface EmployeeOption {
  id: string;
  name: string;
}

const DepartmentSchedule = () => {
  const navigate = useNavigate();
  const { isManager, department } = useAuthStore();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });
  
  // Form state
  const [newSchedule, setNewSchedule] = useState({
    employeeId: '',
    date: '',
    shift: 'morning' as ScheduleItem['shift']
  });

  // Mock data
  const mockEmployees: EmployeeOption[] = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Michael Brown' },
    { id: '4', name: 'Emily Wilson' }
  ];

  const mockSchedules: ScheduleItem[] = [
    { 
      id: '1', 
      employeeId: '1', 
      employeeName: 'John Doe', 
      date: '2023-09-15', 
      shift: 'morning', 
      status: 'completed' 
    },
    { 
      id: '2', 
      employeeId: '2', 
      employeeName: 'Jane Smith', 
      date: '2023-09-15', 
      shift: 'evening', 
      status: 'completed' 
    },
    { 
      id: '3', 
      employeeId: '3', 
      employeeName: 'Michael Brown', 
      date: '2023-09-16', 
      shift: 'morning', 
      status: 'scheduled' 
    },
    { 
      id: '4', 
      employeeId: '4', 
      employeeName: 'Emily Wilson', 
      date: '2023-09-16', 
      shift: 'night', 
      status: 'scheduled' 
    }
  ];

  useEffect(() => {
    // Check if user is manager
    if (!isManager) {
      navigate('/dashboard');
      return;
    }

    // Fetch department data
    fetchData();
  }, [isManager, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, call APIs to fetch department employees and schedules
      // const employeesResponse = await getDepartmentEmployees();
      // const schedulesResponse = await getDepartmentSchedules();
      
      // Mock successful API call
      setTimeout(() => {
        setEmployees(mockEmployees);
        setSchedules(mockSchedules);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching department data:', error);
      setToast({
        visible: true,
        message: 'Failed to fetch department data',
        type: 'error'
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSchedule({
      ...newSchedule,
      [name]: value
    });
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const employee = employees.find(emp => emp.id === newSchedule.employeeId);
      if (!employee) return;

      // Mock successful API call
      const newScheduleItem: ScheduleItem = {
        id: Date.now().toString(),
        employeeId: newSchedule.employeeId,
        employeeName: employee.name,
        date: newSchedule.date,
        shift: newSchedule.shift,
        status: 'scheduled'
      };
      
      // In a real implementation, call API to add schedule
      // await addDepartmentSchedule(newSchedule);
      
      // Update local state
      setSchedules([...schedules, newScheduleItem]);
      setIsAddingSchedule(false);
      setNewSchedule({
        employeeId: '',
        date: '',
        shift: 'morning'
      });

      setToast({
        visible: true,
        message: 'Schedule added successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding schedule:', error);
      setToast({
        visible: true,
        message: 'Failed to add schedule',
        type: 'error'
      });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        // In a real implementation, call API to delete schedule
        // await deleteDepartmentSchedule(id);
        
        // Update local state
        setSchedules(schedules.filter(item => item.id !== id));
        
        setToast({
          visible: true,
          message: 'Schedule deleted successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting schedule:', error);
        setToast({
          visible: true,
          message: 'Failed to delete schedule',
          type: 'error'
        });
      }
    }
  };

  const getShiftColor = (shift: ScheduleItem['shift']) => {
    switch (shift) {
      case 'morning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'evening':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'night':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/manager')}
            className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Go back"
          >
            <FaArrowLeft className="text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {department} Department Schedule
          </h1>
        </div>
        
        <button
          onClick={() => setIsAddingSchedule(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" />
          Add Schedule
        </button>
      </div>

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={5000}
      />

      {/* Schedule Form Modal */}
      {isAddingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add New Schedule
              </h2>
              <button
                onClick={() => setIsAddingSchedule(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Employee
                </label>
                <select
                  name="employeeId"
                  value={newSchedule.employeeId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={newSchedule.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Shift
                </label>
                <select
                  name="shift"
                  value={newSchedule.shift}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="morning">Morning Shift (8AM - 4PM)</option>
                  <option value="evening">Evening Shift (4PM - 12AM)</option>
                  <option value="night">Night Shift (12AM - 8AM)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddingSchedule(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Employee Schedules
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Shift
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {schedules.length > 0 ? (
                schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {schedule.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(schedule.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getShiftColor(schedule.shift)}`}>
                        {schedule.shift.charAt(0).toUpperCase() + schedule.shift.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                        {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No schedules found. Click "Add Schedule" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSchedule; 