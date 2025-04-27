import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ReactNode, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import RoleDebugger from './components/RoleDebugger';

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

function App() {
  const { getProfile, isAuthenticated, isAdmin } = useAuthStore();

  // Check if user is already authenticated on app load
  useEffect(() => {
    if (isAuthenticated) {
      getProfile();
    }
  }, [isAuthenticated, getProfile]);

  return (
    <Router>
      {/* Debug tool for development */}
      <RoleDebugger />
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          isAuthenticated ? (
            isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
          ) : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? (
            isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
          ) : <Register />
        } />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        <Route path="/admin/users" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />

        {/* Redirect root to admin, dashboard or login based on authentication status */}
        <Route path="/" element={
          isAuthenticated ? (
            isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />
          ) : <Navigate to="/login" replace />
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
    </Router>
  );
}

export default App;
