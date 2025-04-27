import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Toast from '../components/Toast';
import CreateUserForm from '../components/CreateUserForm';
import { User } from '../types';
import { 
  getAllUsers,
  getRoles,
  makeUserAdmin,
  removeAdminRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles
} from '../api/admin';

interface Role {
  _id: string;
  role_name: string;
  description: string;
}

interface UserWithRoles extends User {
  assignedRoles: string[];
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionType, setActionType] = useState<'add' | 'remove'>('add');
  const [toast, setToast] = useState({ 
    visible: false, 
    message: '', 
    type: 'info' as 'success' | 'error' | 'info' 
  });

  useEffect(() => {
    // Check if user is admin, redirect to regular dashboard if not
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Fetch users and roles
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, rolesData] = await Promise.all([
        getAllUsers(),
        getRoles()
      ]);
      
      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        usersData.map(async (user) => {
          try {
            const userRoles = await getUserRoles(user._id);
            return {
              ...user,
              assignedRoles: userRoles
            };
          } catch (error) {
            console.error(`Error fetching roles for user ${user._id}:`, error);
            return {
              ...user,
              assignedRoles: []
            };
          }
        })
      );
      
      setUsers(usersWithRoles);
      setRoles(rolesData);
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

  const showRoleManagement = (userId: string) => {
    setSelectedUser(userId);
    setShowRoleModal(true);
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage users and their roles
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
        >
          Create New User
        </button>
      </motion.div>

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
                            handleRemoveRole(selectedUserData._id, roleId);
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
            </div>
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
              {users.map((user, index) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => showRoleManagement(user._id)}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Manage Roles
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 