import api from './axios';
import { useState } from 'react';
import { LeaveRequest } from '../types';

// Manager API hook for accessing department-specific data
export const useManagerAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get department stats for the manager's department
  const getDepartmentStats = async (): Promise<any | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/manager/department-stats');
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch department stats';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  // Get employees for the manager's department
  const getDepartmentEmployees = async (): Promise<any[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/manager/employees');
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch department employees';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  // Get pending leave requests for employees in the manager's department
  const getDepartmentLeaveRequests = async (): Promise<LeaveRequest[] | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/manager/leave-requests');
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch department leave requests';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  // Generate department attendance report
  const getDepartmentAttendanceReport = async (
    startDate: string,
    endDate: string,
    format: string = 'pdf'
  ): Promise<Blob> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { startDate, endDate, format };
      const response = await api.get('/manager/reports/attendance', {
        params,
        responseType: 'blob'
      });
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate department attendance report';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Generate department employee report
  const getDepartmentEmployeeReport = async (format: string = 'pdf'): Promise<Blob> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { format };
      const response = await api.get('/manager/reports/employees', {
        params,
        responseType: 'blob'
      });
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate department employee report';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };
  // Generate department leave report
  const getDepartmentLeaveReport = async (
    startDate: string,
    endDate: string,
    format: string = 'pdf'
  ): Promise<Blob> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { startDate, endDate, format };
      const response = await api.get('/manager/reports/leaves', {
        params,
        responseType: 'blob'
      });
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate department leave report';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Approve a department leave request
  const approveDepartmentLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/manager/leave-requests/${leaveId}/approve`);
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to approve leave request';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  // Deny a department leave request
  const denyDepartmentLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/manager/leave-requests/${leaveId}/deny`);
      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to deny leave request';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  return {
    isLoading,
    error,
    getDepartmentStats,
    getDepartmentEmployees,
    getDepartmentLeaveRequests,
    approveDepartmentLeaveRequest,
    denyDepartmentLeaveRequest,
    getDepartmentAttendanceReport,
    getDepartmentEmployeeReport,
    getDepartmentLeaveReport
  };
};

/**
 * Get manager's department statistics
 * @returns Department stats data including employee counts, attendance, etc.
 */
export const getDepartmentStats = async () => {
  const response = await api.get('/manager/department-stats');
  return response.data;
};

/**
 * Get all employees in the manager's department
 * @returns Array of employees
 */
export const getDepartmentEmployees = async () => {
  const response = await api.get('/manager/employees');
  return response.data;
};

/**
 * Get pending leave requests for the manager's department
 * @returns Array of pending leave requests
 */
export const getDepartmentLeaveRequests = async () => {
  const response = await api.get('/manager/leave-requests');
  return response.data;
};

/**
 * Approve a leave request
 * @param leaveId - ID of the leave request to approve
 * @returns Success response
 */
export const approveLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/manager/leave-requests/${leaveId}/approve`);
  return response.data;
};

/**
 * Deny a leave request
 * @param leaveId - ID of the leave request to deny
 * @returns Success response
 */
export const denyLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/manager/leave-requests/${leaveId}/deny`);
  return response.data;
};

/**
 * Get attendance report for the manager's department
 * @param startDate - Start date for the report
 * @param endDate - End date for the report
 * @returns Report data
 */
export const getDepartmentAttendanceReport = async (startDate: string, endDate: string): Promise<any> => {
  const params = { startDate, endDate };
  const response = await api.get('/manager/reports/attendance', { params });
  return response.data;
};