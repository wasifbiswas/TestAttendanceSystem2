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
  removeAdminRole
} from '../api/admin';

const UserManagement = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ _id: string; role_name: string; description: string }[]>([]);
  const [adminRoleId, setAdminRoleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
      
      setUsers(usersData);
      setRoles(rolesData);
      
      // Find the admin role ID
      const adminRole = rolesData.find(role => role.role_name === 'ADMIN');
      if (adminRole) {
        setAdminRoleId(adminRole._id);
      }
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

  const handleMakeAdmin = async (userId: string) => {
    if (!adminRoleId) {
      setToast({
        visible: true,
        message: 'Admin role not found',
        type: 'error'
      });
      return;
    }

    try {
      await makeUserAdmin(userId, adminRoleId);
      setToast({
        visible: true,
        message: 'User is now an admin',
        type: 'success'
      });
      // Refresh the user list
      fetchData();
    } catch (error) {
      console.error('Error making user admin:', error);
      setToast({
        visible: true,
        message: 'Failed to make user an admin',
        type: 'error'
      });
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!adminRoleId) {
      setToast({
        visible: true,
        message: 'Admin role not found',
        type: 'error'
      });
      return;
    }

    try {
      await removeAdminRole(userId, adminRoleId);
      setToast({
        visible: true,
        message: 'Admin role removed from user',
        type: 'success'
      });
      // Refresh the user list
      fetchData();
    } catch (error) {
      console.error('Error removing admin role:', error);
      setToast({
        visible: true,
        message: 'Failed to remove admin role',
        type: 'error'
      });
    }
  };

  const showAdminConfirmation = (userId: string, action: 'add' | 'remove') => {
    setSelectedUser(userId);
    setActionType(action);
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    if (!selectedUser) return;
    
    if (actionType === 'add') {
      handleMakeAdmin(selectedUser);
    } else {
      handleRemoveAdmin(selectedUser);
    }
    
    setShowConfirmation(false);
    setSelectedUser(null);
  };
  
  const cancelAction = () => {
    setShowConfirmation(false);
    setSelectedUser(null);
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
            Manage user administration access
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add User
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

      {/* Create User Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <CreateUserForm 
              onSuccess={handleCreateUserSuccess} 
              onCancel={() => setShowCreateForm(false)} 
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {actionType === 'add' ? 'Make User Admin' : 'Remove Admin Role'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {actionType === 'add' 
                ? 'Are you sure you want to make this user an admin? They will have full access to the admin dashboard and functions.'
                : 'Are you sure you want to remove admin privileges from this user?'
              }
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelAction}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-white rounded-md ${
                  actionType === 'add' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">System Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Full Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user, index) => {
                const isAdmin = user.roles?.includes('ADMIN');
                
                return (
                  <motion.tr 
                    key={user._id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{user.full_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${isAdmin 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {isAdmin ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAdmin ? (
                        <button
                          onClick={() => showAdminConfirmation(user._id, 'remove')}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => showAdminConfirmation(user._id, 'add')}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Make Admin
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 