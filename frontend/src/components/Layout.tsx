import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationBadge from './NotificationBadge';
import NotificationDrawer from './NotificationDrawer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAdmin, isManager, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  
  // Only show layout if user is logged in
  if (!user) {
    return <>{children}</>;
  }
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isManager) return '/manager';
    return '/dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Attendance System
          </h2>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {/* Common Routes */}
            <Link
              to={getDashboardPath()}
              className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                location.pathname === getDashboardPath() ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              Dashboard
            </Link>
            
            {/* Admin Routes */}
            {isAdmin && (
              <>
                <Link
                  to="/admin/users"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/admin/users' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Users
                </Link>
                <Link
                  to="/admin/employees"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/admin/employees' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Employees
                </Link>
                <Link
                  to="/admin/reports"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/admin/reports' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Reports
                </Link>
                <Link
                  to="/admin/holidays"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/admin/holidays' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Holidays
                </Link>
                <Link
                  to="/admin/settings"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/admin/settings' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Settings
                </Link>
              </>
            )}
            
            {/* Manager Routes */}
            {isManager && (
              <>
                <Link
                  to="/manager/employees"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/manager/employees' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Employees
                </Link>
                <Link
                  to="/manager/reports"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/manager/reports' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Reports
                </Link>
                <Link
                  to="/manager/schedule"
                  className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    location.pathname === '/manager/schedule' ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  Schedule
                </Link>
              </>
            )}
              {/* Employee Routes */}
            <Link
              to="/attendance-logs"
              className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                location.pathname === '/attendance-logs' ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              Attendance Logs
            </Link>
              {/* Notifications Route - Available to all users */}
            <Link
              to="/notifications"
              className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                location.pathname === '/notifications' ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <span className="flex items-center">
                Notifications
                {useNotificationStore().unreadCount > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 inline-flex items-center justify-center">
                    {useNotificationStore().unreadCount}
                  </span>
                )}
              </span>
            </Link>
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center h-16 px-6 bg-white dark:bg-gray-800 shadow">
          <div className="md:hidden">
            {/* Mobile Menu Button */}
            <button className="text-gray-600 dark:text-gray-300 focus:outline-none">
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center">
            <span className="text-gray-800 dark:text-white font-medium md:hidden">
              Attendance System
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notification Badge */}
            <NotificationBadge onClick={() => setIsNotificationDrawerOpen(true)} />
            
            {/* User Profile */}
            <div className="relative">
              <button className="flex items-center text-gray-700 dark:text-gray-300">
                <span className="hidden md:block mr-2">{user.full_name || user.username}</span>
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
      
      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />
    </div>
  );
};

export default Layout;
