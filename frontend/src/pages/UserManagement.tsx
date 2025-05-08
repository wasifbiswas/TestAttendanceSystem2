import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/Toast';
import CreateUserForm from '../components/CreateUserForm';
import { User } from '../types';
import api from '../api/axios';
import { 
  getAllUsers,
  getRoles,
  makeUserAdmin,
  removeAdminRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getAllDepartments,
  assignDepartmentToUser,
  deleteUser,
  useAdminAPI
} from '../api/admin';
import { ArrowLeftIcon, FunnelIcon, XCircleIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Role {
  _id: string;
  role_name: string;
  description: string;
}

interface Department {
  _id: string;
  dept_name: string;
  description?: string;
}

interface UserWithRoles extends User {
  assignedRoles: string[];
  employee?: {
    department?: string | { dept_name: string; _id?: string };
    designation?: string;
    employee_code?: string;
  };
}

const getOptionBackground = (deptName: string): string => {
  const deptStyleMap: {[key: string]: string} = {
    'HR': '#eef2ff',
    'Human Resources': '#eef2ff',
    'IT': '#f0fdf4',
    'Information Technology': '#f0fdf4',
    'Finance': '#eff6ff',
    'Finance & Accounting': '#eff6ff',
    'Marketing': '#fef2f2',
    'Marketing & Communications': '#fef2f2',
    'Operations': '#f8fafc',
    'Operations & Logistics': '#f8fafc',
    'Sales': '#fdf2f8',
    'Sales & Business Development': '#fdf2f8',
    'RnD': '#ecfdf5',
    'Research & Development': '#ecfdf5',
    'Legal': '#f5f3ff',
    'Legal & Compliance': '#f5f3ff',
    'Customer': '#fff7ed',
    'Customer Support': '#fff7ed',
    'Admin': '#f0f9ff',
    'Administration': '#f0f9ff',
    'Executive': '#fafafa',
    'Executive Leadership': '#fafafa',
    'Product': '#f0fdfa',
    'Product Management': '#f0fdfa'
  };
  
  // Return the background color or default to light gray
  return deptStyleMap[deptName] || '#f3f4f6';
};

const getOptionColor = (deptName: string): string => {
  const deptColorMap: {[key: string]: string} = {
    'HR': '#4f46e5',
    'Human Resources': '#4f46e5',
    'IT': '#166534',
    'Information Technology': '#166534',
    'Finance': '#1e40af',
    'Finance & Accounting': '#1e40af',
    'Marketing': '#b91c1c',
    'Marketing & Communications': '#b91c1c',
    'Operations': '#0f172a',
    'Operations & Logistics': '#0f172a',
    'Sales': '#9d174d',
    'Sales & Business Development': '#9d174d',
    'RnD': '#065f46',
    'Research & Development': '#065f46',
    'Legal': '#5b21b6',
    'Legal & Compliance': '#5b21b6',
    'Customer': '#c2410c',
    'Customer Support': '#c2410c',
    'Admin': '#0369a1',
    'Administration': '#0369a1',
    'Executive': '#171717',
    'Executive Leadership': '#171717',
    'Product': '#0f766e',
    'Product Management': '#0f766e'
  };
  
  // Return the text color or default to dark gray
  return deptColorMap[deptName] || '#374151';
};

const UserManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const { deleteEmployee } = useAdminAPI();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionType, setActionType] = useState<'add' | 'remove'>('add');
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });
  
  // Filter states
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [filterEmployeeCode, setFilterEmployeeCode] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Add new state variables for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRoles | null>(null);

  useEffect(() => {
    // Check if user is admin, redirect to regular dashboard if not
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Fetch users and roles
    fetchData();
  }, [isAdmin, navigate]);

  // Apply filters whenever users or filter values change
  useEffect(() => {
    applyFilters();
  }, [users, filterRole, filterDepartment, filterEmployeeCode]);

  const applyFilters = () => {
    let result = [...users];
    
    // Filter by role
    if (filterRole) {
      result = result.filter(user => {
        return user.assignedRoles.some(roleId => {
          const role = roles.find(r => r._id === roleId);
          return role && role.role_name === filterRole;
        });
      });
    }
    
    // Filter by department
    if (filterDepartment) {
      result = result.filter(user => {
        if (!user.employee || !user.employee.department) return false;
        
        const deptName = typeof user.employee.department === 'object' 
          ? user.employee.department.dept_name
          : user.employee.department;
          
        return deptName === filterDepartment;
      });
    }
    
    // Filter by employee code
    if (filterEmployeeCode) {
      const searchTerm = filterEmployeeCode.toLowerCase();
      result = result.filter(user => {
        return user.employee?.employee_code?.toLowerCase().includes(searchTerm);
      });
    }
    
    setFilteredUsers(result);
  };

  const clearFilters = () => {
    setFilterRole('');
    setFilterDepartment('');
    setFilterEmployeeCode('');
    setFilteredUsers(users);
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      // Use the proper API call with axios instance that handles authentication
      const response = await api.get(`/admin/users/${userId}`);
      console.log(`User details for ${userId}:`, response.data);
      
      // Extract the roles from the response
      const roles = response.data.roles || [];
      
      // Format the employee data correctly including department information
      let employee = null;
      if (response.data.employee) {
        employee = {
          ...response.data.employee,
          // Ensure department is properly structured for display
          department: response.data.employee.dept_id 
            ? {
                _id: response.data.employee.dept_id._id,
                dept_name: response.data.employee.dept_id.dept_name
              }
            : response.data.employee.department || null
        };

        // Add additional debug info
        console.log(`Employee data for ${userId}:`, {
          employee_code: employee.employee_code,
          department: employee.department,
          original: response.data.employee
        });
      }
      
      return {
        employee,
        roles
      };
    } catch (error) {
      console.error(`Error fetching details for user ${userId}:`, error);
      return {
        employee: null,
        roles: []
      };
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, rolesData, departmentsData] = await Promise.all([
        getAllUsers(),
        getRoles(),
        getAllDepartments()
      ]);
      
      // Fetch detailed user data including employee info and roles
      const usersWithDetails = await Promise.all(
        usersData.map(async (user) => {
          try {
            const userDetails = await fetchUserDetails(user._id);
            
            // Determine role IDs from role names
            const roleIds = [];
            if (userDetails.roles && userDetails.roles.length > 0) {
              for (const roleName of userDetails.roles) {
                const role = rolesData.find(r => r.role_name === roleName);
                if (role) {
                  roleIds.push(role._id);
                }
              }
            }
            
            return {
              ...user,
              assignedRoles: roleIds, // Use the roles from fetchUserDetails
              employee: userDetails?.employee
            };
          } catch (error) {
            console.error(`Error fetching data for user ${user._id}:`, error);
            return {
              ...user,
              assignedRoles: [],
              employee: null
            };
          }
        })
      );
      
      // Debug log to check if we're getting employee codes and roles
      console.log('Users with details:', usersWithDetails);
      
      setUsers(usersWithDetails);
      setRoles(rolesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setToast({
        visible: true,
        message: 'Failed to fetch user data',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await assignRoleToUser(userId, roleId);
      setToast({
        visible: true,
        message: 'Role assigned successfully',
        type: 'success'
      });
      // Close the modal after assigning role
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole(null);
      // Refresh the user list
      fetchData();
    } catch (error) {
      console.error('Error assigning role:', error);
      setToast({
        visible: true,
        message: 'Failed to assign role',
        type: 'error'
      });
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await removeRoleFromUser(userId, roleId);
      setToast({
        visible: true,
        message: 'Role removed successfully',
        type: 'success'
      });
      // Close the modal after removing role
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole(null);
      // Refresh the user list
      fetchData();
    } catch (error) {
      console.error('Error removing role:', error);
      setToast({
        visible: true,
        message: 'Failed to remove role',
        type: 'error'
      });
    }
  };

  const handleAssignDepartment = async (userId: string, departmentId: string) => {
    try {
      const response = await assignDepartmentToUser(userId, departmentId);
      
      // Find the selected department name for display in the toast
      const selectedDeptName = departments.find(dept => dept._id === departmentId)?.dept_name || 'Department';
      
      setToast({
        visible: true,
        message: `${selectedDeptName} assigned successfully`,
        type: 'success'
      });
      
      // Close the modal immediately to improve UX
      setShowDeptModal(false);
      setSelectedUser(null);
      setSelectedDepartment(null);
      
      // For debugging
      console.log('Department assignment response:', response);
      
      // Fetch fresh data after a small delay to ensure the backend has completed processing
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      console.error('Error assigning department:', error);
      setToast({
        visible: true,
        message: 'Failed to assign department',
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete._id);
      setToast({
        visible: true,
        message: 'User deleted successfully',
        type: 'success'
      });
      // Close the modal
      setShowDeleteModal(false);
      setUserToDelete(null);
      // Refresh the user list
      fetchData();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      // Show more specific error message if available from API
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error'
      });
    }
  };

  // New function to handle employee profile deletion
  const handleDeleteEmployeeProfile = async () => {
    if (!userToDelete || !userToDelete.employee) return;
    
    try {
      // Get the employee ID by a safer approach that extracts the ID from any property
      let employeeId = null;
      
      // Debug the entire employee object
      console.log("Employee object structure:", userToDelete.employee);
      
      if (userToDelete.employee) {
        // Try direct properties or nested properties that might contain the employee ID
        // Extract the first value that looks like a MongoDB ID (24 hex characters)
        
        // Define a helper function to extract the MongoDB ID from a value
        const getMongoId = (value: any): string | null => {
          if (typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value)) {
            return value; // Return the ID if it's a valid MongoDB ID
          }
          return null;
        };
        
        // Helper function to extract IDs from an object recursively
        const findMongoIdInObject = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;
          
          // Check explicitly named ID fields first
          const commonIdFields = ['_id', 'id', 'employee_id', 'employeeId'];
          for (const field of commonIdFields) {
            if (obj[field]) {
              const id = getMongoId(obj[field]);
              if (id) {
                console.log(`Found ID in field: ${field}`, id);
                return id;
              }
            }
          }
          
          // If not found in common fields, scan all fields recursively
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
              const id = getMongoId(value);
              if (id) {
                console.log(`Found ID in field: ${key}`, id);
                return id;
              }
            } else if (typeof value === 'object' && value !== null) {
              // Recursively check nested objects
              const id = findMongoIdInObject(value);
              if (id) return id;
            }
          }
          
          return null;
        };
        
        // Try to find a MongoDB ID in the employee object
        employeeId = findMongoIdInObject(userToDelete.employee);
      }
      
      // If still not found, try to extract from employee_code if present
      if (!employeeId && userToDelete.employee && typeof userToDelete.employee === 'object' && 'employee_code' in userToDelete.employee) {
        console.log("Trying to extract ID from employee code:", userToDelete.employee.employee_code);
      }
      
      // If still not found, log the object structure for debugging
      if (!employeeId) {
        console.error('Could not find a valid MongoDB ID in employee object:', JSON.stringify(userToDelete.employee, null, 2));
        setToast({
          visible: true,
          message: 'Could not find employee ID in the response data',
          type: 'error'
        });
        return;
      }
      
      console.log(`Attempting to delete employee with ID: ${employeeId}`);
      
      // Call the API to delete the employee profile
      const response = await deleteEmployee(employeeId);
      console.log('Delete employee response:', response);
      
      // Show success message
      setToast({
        visible: true,
        message: 'Employee profile deleted successfully',
        type: 'success'
      });
      
      // Store the user data in a temp variable before closing the modal
      const userToDeleteAfterProfile = { ...userToDelete };
      
      // Remove the employee data from this user so it will show the regular delete interface
      userToDeleteAfterProfile.employee = undefined;
      
      // Close the current modal
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Refresh the user list first to ensure data is up to date
      await fetchData();
      
      // Show the user delete confirmation modal immediately after employee profile deletion
      // Small delay to ensure state updates properly
      setTimeout(() => {
        setUserToDelete(userToDeleteAfterProfile);
        setShowDeleteModal(true);
      }, 100);
      
    } catch (error: any) {
      console.error('Error deleting employee profile:', error);
      
      // Show more specific error message if available from API
      const errorMessage = error.response?.data?.message || 'Failed to delete employee profile';
      setToast({
        visible: true,
        message: errorMessage,
        type: 'error'
      });
    }
  };

  const showRoleManagement = (userId: string) => {
    setSelectedUser(userId);
    setShowRoleModal(true);
  };

  const showDepartmentManagement = (userId: string) => {
    setSelectedUser(userId);
    setSelectedDepartment(null);
    setShowDeptModal(true);
  };

  const showDeleteConfirmation = (user: UserWithRoles) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmRoleAction = () => {
    if (!selectedUser || !selectedRole) return;
    
    if (actionType === 'add') {
      handleAssignRole(selectedUser, selectedRole);
    } else {
      handleRemoveRole(selectedUser, selectedRole);
    }
    
    setShowRoleModal(false);
    setSelectedUser(null);
    setSelectedRole(null);
  };
  
  const cancelRoleAction = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    setSelectedRole(null);
  };

  const cancelDeptAssignment = () => {
    setShowDeptModal(false);
    setSelectedUser(null);
    setSelectedDepartment(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleCreateUserSuccess = () => {
    setShowCreateForm(false);
    setToast({
      visible: true,
      message: 'User created successfully',
      type: 'success'
    });
    fetchData();
  };

  const getUserRoleNames = (user: UserWithRoles) => {
    return user.assignedRoles
      .map(roleId => {
        const role = roles.find(r => r._id === roleId);
        return role ? role.role_name : '';
      })
      .filter(name => name) // Filter out any empty strings
      .join(', ');
  };

  const hasRole = (user: UserWithRoles, roleName: string) => {
    return user.assignedRoles.some(roleId => {
      const role = roles.find(r => r._id === roleId);
      return role && role.role_name.toUpperCase() === roleName.toUpperCase();
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
      },
    }),
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const selectedUserData = selectedUser ? users.find(u => u._id === selectedUser) : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-between items-center"
      >
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to admin dashboard"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage users and their roles
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md flex items-center space-x-1 ${
              showFilters ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
              'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {(filterRole || filterDepartment || filterEmployeeCode) && (
              <span className="bg-blue-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {[filterRole, filterDepartment, filterEmployeeCode].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
          >
            Create New User
          </button>
        </div>
      </motion.div>

      {/* Filter panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filter Users</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1"
                disabled={!filterRole && !filterDepartment && !filterEmployeeCode}
              >
                <XCircleIcon className="w-4 h-4" />
                <span>Clear all</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role filter */}
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Role
              </label>
              <select
                id="role-filter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role._id} value={role.role_name}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Department filter */}
            <div>
              <label htmlFor="dept-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Department
              </label>
              <select
                id="dept-filter"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept.dept_name}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Employee code filter */}
            <div>
              <label htmlFor="emp-code-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Employee Code
              </label>
              <input
                type="text"
                id="emp-code-filter"
                value={filterEmployeeCode}
                onChange={(e) => setFilterEmployeeCode(e.target.value)}
                placeholder="Search employee code..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </motion.div>
      )}

      {/* Toast notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
        duration={5000}
      />

      {/* User creation form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <CreateUserForm 
              onCancel={() => setShowCreateForm(false)} 
              onSuccess={handleCreateUserSuccess} 
            />
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Manage Roles for {selectedUserData.full_name}
              </h2>
              <button
                onClick={cancelRoleAction}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Current Roles</h3>
              {selectedUserData.assignedRoles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedUserData.assignedRoles.map(roleId => {
                    const role = roles.find(r => r._id === roleId);
                    if (!role) return null;
                    
                    return (
                      <div 
                        key={roleId}
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {role.role_name}
                        <button 
                          onClick={() => {
                            setActionType('remove');
                            setSelectedRole(roleId);
                          }}
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No roles assigned</p>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Assign New Role</h3>
              <select
                value={selectedRole || ''}
                onChange={(e) => {
                  setSelectedRole(e.target.value || null);
                  setActionType('add');
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option 
                    key={role._id} 
                    value={role._id}
                    disabled={selectedUserData.assignedRoles.includes(role._id)}
                  >
                    {role.role_name} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRoleAction}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              {selectedRole && actionType === 'add' && (
                <button
                  onClick={() => handleAssignRole(selectedUserData._id, selectedRole)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Assign Role
                </button>
              )}
              {selectedRole && actionType === 'remove' && (
                <button
                  onClick={() => handleRemoveRole(selectedUserData._id, selectedRole)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Remove Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Department Assignment Modal */}
      {showDeptModal && selectedUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assign Department for {selectedUserData.full_name}
              </h2>
              <button
                onClick={cancelDeptAssignment}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Select a department to assign to this user. This will create an employee profile if one doesn't exist.
              </p>
              
              <select
                value={selectedDepartment || ''}
                onChange={(e) => setSelectedDepartment(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                style={{ 
                  backgroundColor: 'white',
                  color: '#374151'
                }}
              >
                <option value="" style={{ backgroundColor: '#f3f4f6', fontWeight: 'bold' }}>Select a department</option>
                {departments.map(dept => (
                  <option 
                    key={dept._id} 
                    value={dept._id}
                    style={{ 
                      backgroundColor: getOptionBackground(dept.dept_name),
                      color: getOptionColor(dept.dept_name) 
                    }}
                  >
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeptAssignment}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedDepartment && handleAssignDepartment(selectedUserData._id, selectedDepartment)}
                disabled={!selectedDepartment}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${!selectedDepartment 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                Assign Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="h-10 w-10 mr-4" />
              <h2 className="text-xl font-semibold">Delete User</h2>
            </div>

            {userToDelete.employee?.employee_code ? (
              <>
                <div className="mb-6">
                  <div className="p-4 border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-md mb-4">
                    <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                      This user has an employee profile and cannot be deleted directly.
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 mt-2 text-sm">
                      Employee Code: <span className="font-mono bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded">
                        {userToDelete.employee.employee_code}
                      </span>
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-400 mt-2 text-sm">
                      To delete this user, you must first delete their employee profile.
                    </p>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300">
                    Are you sure you want to delete the employee profile for <span className="font-semibold">{userToDelete.full_name}</span>?
                    <br/><span className="text-sm text-gray-500 dark:text-gray-400">This will remove all attendance records and leave history for this employee.</span>
                  </p>
                </div>
                
                <div className="flex justify-between space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteEmployeeProfile}
                    className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  >
                    Delete Employee Profile
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete user <span className="font-semibold">{userToDelete.full_name}</span>?
                  <br/><span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">This action cannot be undone.</span>
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employee Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Roles
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <motion.tr 
                    key={user._id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        @{user.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.employee?.employee_code ? (
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-1 rounded text-sm font-medium">
                          {user.employee.employee_code}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.employee && user.employee.department ? (
                          typeof user.employee.department === 'object' && user.employee.department.dept_name ? 
                            <span className="text-sm font-medium" style={{ color: getOptionColor(user.employee.department.dept_name) }}>
                              {user.employee.department.dept_name}
                            </span>
                          : typeof user.employee.department === 'string' ?
                              <span className="text-sm font-medium" style={{ color: getOptionColor(user.employee.department) }}>
                                {user.employee.department}
                              </span>
                            : "Not Assigned"
                        ) : (
                          "Not Assigned"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.assignedRoles.length > 0 ? (
                          user.assignedRoles.map(roleId => {
                            const role = roles.find(r => r._id === roleId);
                            if (!role) return null;
                            
                            return (
                              <span 
                                key={roleId}
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                                  ${role.role_name.toUpperCase() === 'ADMIN' 
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                    : role.role_name.toUpperCase() === 'MANAGER'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  }`}
                              >
                                {role.role_name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            No roles
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-y-2">
                      <div className="flex space-x-4 justify-end">
                        <button
                          onClick={() => showRoleManagement(user._id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Manage Roles
                        </button>
                        
                        {/* Department assignment button - only shown for users without a department */}
                        {(!user.employee || !user.employee.department) && (
                          <button
                            onClick={() => showDepartmentManagement(user._id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Assign Dept
                          </button>
                        )}
                        
                        {/* Delete user button */}
                        <button
                          onClick={() => showDeleteConfirmation(user)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                          title="Delete user"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    {users.length > 0 ? (
                      <>
                        <p className="font-medium mb-2">No users match the selected filters</p>
                        <button 
                          onClick={clearFilters}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      "No users found in the system"
                    )}
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

export default UserManagement;