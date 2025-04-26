import api from './axios';
import { AdminStats, LeaveRequest } from '../types';

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