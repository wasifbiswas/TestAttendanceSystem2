import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios';

const RoleDebugger = () => {
  const { user, token, isAdmin, isAuthenticated } = useAuthStore();
  const [roleInfo, setRoleInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);

  const fetchRoleInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/auth/debug/roles');
      setRoleInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch role information');
      console.error('Role fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    alert('Local storage cleared. Please refresh the page.');
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const toggleDebugger = () => {
    setShowDebugger(prev => !prev);
    if (!showDebugger && !roleInfo) {
      fetchRoleInfo();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={toggleDebugger}
        className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg"
      >
        {showDebugger ? 'Hide' : 'Debug Roles'}
      </button>

      {showDebugger && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Auth Debug Information</h2>
              <button 
                onClick={toggleDebugger}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Auth Store State</h3>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                  <p><strong>Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
                  <p><strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'None'}</p>
                  <p><strong>Username:</strong> {user?.username || 'Not logged in'}</p>
                  <p><strong>Roles from Store:</strong> {user?.roles ? JSON.stringify(user.roles) : 'None'}</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading role information...</p>
                </div>
              ) : error ? (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
                  <p className="font-medium">Error: {error}</p>
                  <button 
                    onClick={fetchRoleInfo}
                    className="mt-2 text-sm bg-red-200 dark:bg-red-800 px-3 py-1 rounded hover:bg-red-300 dark:hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              ) : roleInfo ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Role Information</h3>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                    <p><strong>Username:</strong> {roleInfo.user.username}</p>
                    <p><strong>Admin Status:</strong> {roleInfo.isAdmin ? 'Yes' : 'No'}</p>
                    <p><strong>Role Names:</strong> {JSON.stringify(roleInfo.roleNames)}</p>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Role Details:</h4>
                      <ul className="space-y-2">
                        {roleInfo.roleDetails.map((role: any, index: number) => (
                          <li key={index} className="bg-gray-200 dark:bg-gray-600 p-2 rounded">
                            <p><strong>Role Name:</strong> {role.role_name}</p>
                            <p><strong>Role ID:</strong> {role.role_id}</p>
                            <p><strong>Assigned:</strong> {new Date(role.assigned_date).toLocaleString()}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={fetchRoleInfo}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    Fetch Role Info
                  </button>
                  <button
                    onClick={clearLocalStorage}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
                  >
                    Clear Local Storage
                  </button>
                  <button
                    onClick={refreshPage}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleDebugger; 