import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ReactNode, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import UserManagement from './pages/UserManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import ReportsPage from './pages/ReportsPage';
import SystemSettings from './pages/SystemSettings';
import HolidayManagement from './pages/HolidayManagement';
import DepartmentSchedule from './pages/DepartmentSchedule';
import AttendanceLogs from './pages/AttendanceLogs';
import NotificationsPage from './pages/NotificationsPage';
import RoleDebugger from './components/RoleDebugger';
import Layout from './components/Layout';
import MinimalLayout from './components/MinimalLayout';
import { GoogleCalendarProvider } from './context/GoogleCalendarContext';

// Protected route component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // If not authenticated, redirect to login with the return path
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Admin route component
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not admin, redirect to regular dashboard
  if (isAuthenticated && !isAdmin && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Manager route component
const ManagerRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isManager, isLoading } = useAuthStore();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not manager, redirect to regular dashboard
  if (isAuthenticated && !isManager && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { getProfile, isAuthenticated, isAdmin, isManager } = useAuthStore();

  // Check if user is already authenticated on app load
  useEffect(() => {
    if (isAuthenticated) {
      getProfile();
    }
  }, [isAuthenticated, getProfile]);

  // Determine the appropriate redirect based on user role
  const getRedirectPath = () => {
    if (isAdmin) return "/admin";
    if (isManager) return "/manager";
    return "/dashboard";
  };

  return (
    <Router>
      <GoogleCalendarProvider>
        {/* Debug tool for development */}
        <RoleDebugger />
        
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to={getRedirectPath()} replace /> : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to={getRedirectPath()} replace /> : <Register />
          } />

          {/* Protected routes */}          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MinimalLayout>
                <Dashboard />
              </MinimalLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/attendance-logs" element={
            <ProtectedRoute>
              <Layout>
                <AttendanceLogs />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </AdminRoute>
          } />
          
          <Route path="/admin/users" element={
            <AdminRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </AdminRoute>
          } />

          <Route path="/admin/employees" element={
            <AdminRoute>
              <Layout>
                <EmployeeManagement />
              </Layout>
            </AdminRoute>
          } />

          <Route path="/admin/reports" element={
            <AdminRoute>
              <Layout>
                <ReportsPage />
              </Layout>
            </AdminRoute>
          } />

          <Route path="/admin/settings" element={
            <AdminRoute>
              <Layout>
                <SystemSettings />
              </Layout>
            </AdminRoute>
          } />

          <Route path="/admin/holidays" element={
            <AdminRoute>
              <Layout>
                <HolidayManagement />
              </Layout>
            </AdminRoute>
          } />

          {/* Manager routes */}
          <Route path="/manager" element={
            <ManagerRoute>
              <Layout>
                <ManagerDashboard />
              </Layout>
            </ManagerRoute>
          } />

          <Route path="/manager/employees" element={
            <ManagerRoute>
              <Layout>
                <EmployeeManagement departmentOnly={true} />
              </Layout>
            </ManagerRoute>
          } />

          <Route path="/manager/reports" element={
            <ManagerRoute>
              <Layout>
                <ReportsPage departmentOnly={true} />
              </Layout>
            </ManagerRoute>
          } />          <Route path="/manager/schedule" element={
            <ManagerRoute>
              <Layout>
                <DepartmentSchedule />
              </Layout>
            </ManagerRoute>
          } />

          {/* Shared routes */}
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Redirect root to admin, manager, dashboard, or login based on authentication status */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to={getRedirectPath()} replace /> : <Navigate to="/login" replace />
          } />

          {/* 404 page */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">404</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Page not found</p>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Go Back
              </button>
            </div>
          } />
        </Routes>
      </GoogleCalendarProvider>
    </Router>
  );
}

export default App;
