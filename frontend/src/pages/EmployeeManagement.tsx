import React, { useState, useEffect } from 'react';
import { useAdminAPI } from '../api/admin';
import { useManagerAPI } from '../api/manager';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/Toast';
import LeaveBalanceManager from '../components/admin/LeaveBalanceManager';
import { BiLoaderAlt } from 'react-icons/bi';
import { FaUserPlus, FaEdit, FaTrash, FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  joinDate: string;
  status: 'active' | 'inactive';
};

interface EmployeeManagementProps {
  departmentOnly?: boolean;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ departmentOnly = false }) => {
  const { isAdmin, isManager, department } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddingEmployee, setIsAddingEmployee] = useState<boolean>(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState<boolean>(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [showLeaveBalanceManager, setShowLeaveBalanceManager] = useState<boolean>(false);
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    password: ''
  });
  
  // API hooks as complete objects to avoid unused variable warnings
  const adminAPI = useAdminAPI();
  const managerAPI = useManagerAPI();
  
  // Flag to toggle between mock data and real API
  const useMockData = true;

  // Mock data for development
  const mockEmployees: Employee[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      department: 'Engineering',
      position: 'Software Developer',
      joinDate: '2021-05-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      department: 'HR',
      position: 'HR Manager',
      joinDate: '2020-03-10',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      department: 'Marketing',
      position: 'Marketing Specialist',
      joinDate: '2022-01-20',
      status: 'inactive'
    }
  ];

  useEffect(() => {
    fetchEmployees();
  }, [departmentOnly]);  
  
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      if (!useMockData) {
        // Use real API
        if (departmentOnly) {
          // Manager API returns the data directly
          const fetchedEmployees = await managerAPI.getDepartmentEmployees();
          if (fetchedEmployees) {
            setEmployees(fetchedEmployees);
          }
        } else {
          // Admin API returns the full Axios response
          const response = await adminAPI.getEmployees();
          if (response && response.data) {
            setEmployees(response.data);
          }
        }
      } else {
        // Use mock data
        setTimeout(() => {
          if (departmentOnly && department) {
            // Filter by the manager's department
            const filteredEmployees = mockEmployees.filter(
              emp => emp.department.toLowerCase() === department.toLowerCase()
            );
            setEmployees(filteredEmployees);
          } else {
            setEmployees(mockEmployees);
          }
        }, 1000);
      }
    } catch (error) {
      showToast('Failed to fetch employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department: departmentOnly && department ? department : '',
      position: '',
      password: ''
    });
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Force department for manager adding employees
      const employeeData = departmentOnly && department 
        ? { ...formData, department }
        : formData;

      if (!useMockData) {
        // Use real API
        await adminAPI.createEmployee(employeeData);
        await fetchEmployees(); // Refresh the list
      } else {
        // Mock implementation
        const newEmployee: Employee = {
          id: Date.now().toString(),
          name: employeeData.name,
          email: employeeData.email,
          department: employeeData.department,
          position: employeeData.position,
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active'
        };
        
        setEmployees([...employees, newEmployee]);
      }
      
      resetForm();
      setIsAddingEmployee(false);
      showToast('Employee added successfully', 'success');
    } catch (error) {
      showToast('Failed to add employee', 'error');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      department: departmentOnly && department ? department : employee.department,
      position: employee.position,
      password: '' // Don't set password for edit
    });
    setIsEditingEmployee(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEmployee) return;

    try {
      // Force department for manager updating employees
      const employeeData = departmentOnly && department 
        ? { ...formData, department }
        : formData;

      if (!useMockData) {
        // Use real API
        await adminAPI.updateEmployee(currentEmployee.id, employeeData);
        await fetchEmployees(); // Refresh the list
      } else {
        // Mock implementation
        const updatedEmployee: Employee = {
          ...currentEmployee,
          name: employeeData.name,
          email: employeeData.email,
          department: employeeData.department,
          position: employeeData.position
        };
        
        setEmployees(employees.map(emp => 
          emp.id === currentEmployee.id ? updatedEmployee : emp
        ));
      }
      
      resetForm();
      setIsEditingEmployee(false);
      setCurrentEmployee(null);
      showToast('Employee updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update employee', 'error');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        if (!useMockData) {
          // Use real API
          await adminAPI.deleteEmployee(id);
          await fetchEmployees(); // Refresh the list
        } else {
          // Mock implementation
          setEmployees(employees.filter(emp => emp.id !== id));
        }
        
        showToast('Employee deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete employee', 'error');
      }
    }
  };

  // Function to show toast notifications
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({
      visible: true,
      message,
      type
    });
  };

  const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {isEdit ? 'Edit Employee' : 'Add New Employee'}
        </h2>
        <button 
          onClick={() => {
            resetForm();
            isEdit ? setIsEditingEmployee(false) : setIsAddingEmployee(false);
            setCurrentEmployee(null);
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <span className="sr-only">Close</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <form onSubmit={isEdit ? handleUpdateEmployee : handleAddEmployee}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="john.doe@example.com"
            />
          </div>
          
          {!departmentOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Engineering"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Position
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Software Developer"
            />
          </div>
          
          {!isEdit && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEdit}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              resetForm();
              isEdit ? setIsEditingEmployee(false) : setIsAddingEmployee(false);
              setCurrentEmployee(null);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isEdit ? 'Update Employee' : 'Add Employee'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={5000}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin')}
            className="mr-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            aria-label="Go back to admin dashboard"
          >
            <FaArrowLeft className="text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Employee Management</h1>
        </div>
        {!isAddingEmployee && !isEditingEmployee && (
          <div className="flex space-x-3">
            <button
              onClick={() => setIsAddingEmployee(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaUserPlus className="mr-2" />
              Add Employee
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowLeaveBalanceManager(true)}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                <FaCalendarAlt className="mr-2" />
                Manage Leave Balances
              </button>
            )}
          </div>
        )}
      </div>

      {isAddingEmployee && <EmployeeForm />}
      {isEditingEmployee && <EmployeeForm isEdit={true} />}

      {!isAddingEmployee && !isEditingEmployee && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <BiLoaderAlt className="animate-spin text-blue-500 text-3xl" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {employee.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {employee.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {employee.position}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {employee.joinDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'
                        }`}>
                          {employee.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <FaEdit className="text-lg" />
                            <span className="sr-only">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <FaTrash className="text-lg" />
                            <span className="sr-only">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {employees.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No employees found.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leave Balance Manager Modal */}
      <LeaveBalanceManager
        employees={employees.map(emp => ({
          _id: emp.id,
          employee_code: emp.id, // Using id as employee_code for now
          user_id: {
            full_name: emp.name,
            email: emp.email
          },
          designation: emp.position,
          department: emp.department
        }))}
        isOpen={showLeaveBalanceManager}
        onClose={() => setShowLeaveBalanceManager(false)}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
};

export default EmployeeManagement;
