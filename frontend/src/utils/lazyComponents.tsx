import { lazy } from 'react';

// Lazy load heavy components to reduce initial bundle size
export const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
export const ManagerDashboard = lazy(() => import('../pages/ManagerDashboard'));
export const Dashboard = lazy(() => import('../pages/Dashboard'));
export const UserManagement = lazy(() => import('../pages/UserManagement'));
export const EmployeeManagement = lazy(() => import('../pages/EmployeeManagement'));
export const AttendanceLogs = lazy(() => import('../pages/AttendanceLogs'));
export const ReportsPage = lazy(() => import('../pages/ReportsPage'));
export const HolidayManagement = lazy(() => import('../pages/HolidayManagement'));
export const DepartmentSchedule = lazy(() => import('../pages/DepartmentSchedule'));

// Lazy load form components
export const NotificationForm = lazy(() => import('../components/NotificationForm'));
export const CreateUserForm = lazy(() => import('../components/CreateUserForm'));
export const LeaveRequestModal = lazy(() => import('../components/LeaveRequestModal'));
export const ScheduleModal = lazy(() => import('../components/ScheduleModal'));
export const TwoFactorDialog = lazy(() => import('../components/TwoFactorDialog'));
export const NotificationDrawer = lazy(() => import('../components/NotificationDrawer'));

// Create a loading component
export const LoadingFallback = () => (
  <div className="w-full h-screen flex justify-center items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);
