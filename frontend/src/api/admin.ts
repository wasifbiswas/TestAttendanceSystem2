import api from './axios';
import { AdminStats, User, LeaveRequest } from '../types';
import { useState } from 'react';

// Add the useAdminAPI hook
export const useAdminAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminStats = async (): Promise<AdminStats | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/stats');
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch admin stats';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  const getEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/employees');
      setIsLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch employees';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  const createEmployee = async (employeeData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/admin/employees', employeeData);
      setIsLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create employee';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  const updateEmployee = async (id: string, employeeData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put(`/admin/employees/${id}`, employeeData);
      setIsLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update employee';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  const deleteEmployee = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.delete(`/admin/employees/${id}`);
      setIsLoading(false);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete employee';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  return {
    isLoading,
    error,
    getAdminStats,
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
  };
};

/**
 * Get admin dashboard statistics
 * @returns AdminStats data including employee counts, attendance, etc.
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Get pending leave requests that need admin approval
 * @returns Array of pending leave requests
 */
export const getPendingLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const response = await api.get('/admin/leave-requests/pending');
  return response.data;
};

/**
 * Approve a leave request
 * @param leaveId - ID of the leave request to approve
 * @returns Success response
 */
export const approveLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/admin/leave-requests/${leaveId}/approve`);
  return response.data;
};

/**
 * Deny a leave request
 * @param leaveId - ID of the leave request to deny
 * @returns Success response
 */
export const denyLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/admin/leave-requests/${leaveId}/deny`);
  return response.data;
};

/**
 * Get department statistics
 * @returns Array of department data with employee counts
 */
export const getDepartmentStats = async (): Promise<{ department: string; employeeCount: number }[]> => {
  const response = await api.get('/admin/departments/stats');
  return response.data;
};

/**
 * Add a new employee to the system
 * @param employeeData - Employee data including name, email, department, etc.
 * @returns Created employee data
 */
export const addEmployee = async (employeeData: any): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/admin/employees', employeeData);
  return response.data;
};

/**
 * Generate attendance reports for a specified date range
 * @param startDate - Start date for the report
 * @param endDate - End date for the report
 * @param departmentId - Optional department ID to filter by
 * @returns Report data
 */
export const generateAttendanceReport = async (
  startDate: string, 
  endDate: string, 
  departmentId?: string
): Promise<Blob> => {
  const params = { startDate, endDate, departmentId };
  const response = await api.get('/admin/reports/attendance', { params, responseType: 'blob' });
  return response.data;
};

/**
 * Update system settings
 * @param settings - Settings object with configuration values
 * @returns Updated settings
 */
export const updateSystemSettings = async (settings: any) => {
  const response = await api.put('/admin/settings', settings);
  return response.data;
};

/**
 * Manage company holidays
 * @param year - Year to get holidays for
 * @returns List of holidays
 */
export const getHolidays = async (year: number): Promise<{ date: string; name: string; type: string }[]> => {
  const response = await api.get('/admin/holidays', { params: { year } });
  return response.data;
};

/**
 * Add a new holiday
 * @param holidayData - Holiday data including name, date, etc.
 * @returns Created holiday data
 */
export const addHoliday = async (holidayData: { date: string; name: string; type: string }): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/admin/holidays', holidayData);
  return response.data;
};

/**
 * Delete a holiday
 * @param holidayId - ID of the holiday to delete
 * @returns Success response
 */
export const deleteHoliday = async (holidayId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/admin/holidays/${holidayId}`);
  return response.data;
};

/**
 * Get all users in the system
 * @returns Array of users
 */
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/admin/users');
  return response.data;
};

/**
 * Get user details by ID including roles
 * @param userId - ID of the user to get
 * @returns User data with roles
 */
export const getUserById = async (userId: string): Promise<{ user: User; roles: string[]; employee: any }> => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Make a user an admin
 * @param userId - ID of the user to make admin
 * @param roleId - ID of the admin role
 * @returns Success response
 */
export const makeUserAdmin = async (userId: string, roleId: string): Promise<{ message: string; userRole: any }> => {
  const response = await api.post(`/admin/users/${userId}/roles`, { role_id: roleId });
  return response.data;
};

/**
 * Remove admin role from user
 * @param userId - ID of the user
 * @param roleId - ID of the admin role
 * @returns Success response
 */
export const removeAdminRole = async (userId: string, roleId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/users/${userId}/roles/${roleId}`);
  return response.data;
};

/**
 * Get available roles
 * @returns Array of roles
 */
export const getRoles = async (): Promise<{ _id: string; role_name: string; description: string }[]> => {
  const response = await api.get('/roles');
  return response.data;
};

/**
 * Assign a role to a user
 * @param userId - ID of the user
 * @param roleId - ID of the role to assign
 * @returns Success response
 */
export const assignRoleToUser = async (userId: string, roleId: string): Promise<{ message: string; userRole: any }> => {
  const response = await api.post(`/admin/users/${userId}/roles`, { role_id: roleId });
  return response.data;
};

/**
 * Remove a role from user
 * @param userId - ID of the user
 * @param roleId - ID of the role to remove
 * @returns Success response
 */
export const removeRoleFromUser = async (userId: string, roleId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/users/${userId}/roles/${roleId}`);
  return response.data;
};

/**
 * Get roles assigned to a user
 * @param userId - ID of the user
 * @returns Array of role IDs
 */
export const getUserRoles = async (userId: string): Promise<string[]> => {
  const response = await api.get(`/admin/users/${userId}/roles`);
  return response.data;
};

/**
 * Get user counts by role with employee IDs
 * @returns Object containing counts and IDs of employees, managers, and admins
 */
export const getUserRoleCounts = async (): Promise<{
  employees: { count: number, ids: string[] },
  managers: { count: number, ids: string[] },
  admins: { count: number, ids: string[] }
}> => {
  const response = await api.get('/admin/users/role-counts');
  return response.data;
};