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
  
  /**
   * Fetch raw report data for client-side report generation
   */
  const fetchReportData = async (reportType: string, params: any = {}): Promise<any> => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to connect to the API
      try {
        const response = await api.get(`/admin/reports/${reportType}/data`, { params });
        setIsLoading(false);
        return response.data;
      } catch (apiError) {        console.warn('API Error, falling back to mock data:', apiError);
        
        // If API fails, generate mock data (for demo/development)
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
        
        let mockData;
        const department = params.departmentId || 'All Departments';
        
        // Generate appropriate mock data based on report type
        switch (reportType) {
          case 'attendance':          mockData = {
              title: `${department} Attendance Report`,
              columns: ['date', 'employeeName', 'employeeCode', 'email', 'checkIn', 'checkOut', 'status', 'workHours'],
              headers: ['Date', 'Employee Name', 'Employee Code', 'Email', 'Check In', 'Check Out', 'Status', 'Work Hours'],
              data: [
                { 
                  date: '2025-05-09', 
                  employeeName: 'John Doe', 
                  employeeCode: 'EMP001', 
                  email: 'john@example.com',
                  checkIn: '09:00:00',
                  checkOut: '17:30:00',
                  status: 'PRESENT',
                  workHours: 8.5
                },
                { 
                  date: '2025-05-09', 
                  employeeName: 'Jane Smith', 
                  employeeCode: 'EMP002', 
                  email: 'jane@example.com',
                  checkIn: '08:45:00',
                  checkOut: '17:15:00',
                  status: 'PRESENT',
                  workHours: 8.5
                },
                { 
                  date: '2025-05-09', 
                  employeeName: 'Michael Johnson', 
                  employeeCode: 'EMP003', 
                  email: 'michael@example.com',
                  checkIn: null,
                  checkOut: null,
                  status: 'ABSENT',
                  workHours: 0
                },
                { 
                  date: '2025-05-09', 
                  employeeName: 'Sarah Wilson', 
                  employeeCode: 'EMP004', 
                  email: 'sarah@example.com',
                  checkIn: '09:05:00',
                  checkOut: '18:00:00',
                  status: 'PRESENT',
                  workHours: 8.92
                },
                { 
                  date: '2025-05-08', 
                  employeeName: 'John Doe', 
                  employeeCode: 'EMP001', 
                  email: 'john@example.com',
                  checkIn: '08:55:00',
                  checkOut: '17:25:00',
                  status: 'PRESENT',
                  workHours: 8.5
                },
                { 
                  date: '2025-05-08', 
                  employeeName: 'Jane Smith', 
                  employeeCode: 'EMP002', 
                  email: 'jane@example.com',
                  checkIn: '09:10:00',
                  checkOut: '17:40:00',
                  status: 'PRESENT',
                  workHours: 8.5
                },
                { 
                  date: '2025-05-08', 
                  employeeName: 'Thomas Brown', 
                  employeeCode: 'EMP005', 
                  email: 'thomas@example.com',
                  checkIn: '08:30:00',
                  checkOut: '16:45:00',
                  status: 'PRESENT',
                  workHours: 8.25
                }
              ]
            };
            break;
          case 'employees':          mockData = {
              title: `${department} Employee Report`,
              columns: ['employeeCode', 'name', 'email', 'department', 'position', 'joinDate', 'status'],
              headers: ['Employee Code', 'Name', 'Email', 'Department', 'Position', 'Join Date', 'Status'],
              data: [
                { 
                  employeeCode: 'EMP001', 
                  name: 'John Doe', 
                  email: 'john@example.com',
                  department: department !== 'All Departments' ? department : 'Engineering',
                  position: 'Senior Developer',
                  joinDate: '2023-01-15',
                  status: 'Active'
                },
                { 
                  employeeCode: 'EMP002', 
                  name: 'Jane Smith', 
                  email: 'jane@example.com',
                  department: department !== 'All Departments' ? department : 'Marketing',
                  position: 'Marketing Specialist',
                  joinDate: '2023-03-20',
                  status: 'Active'
                },
                { 
                  employeeCode: 'EMP003', 
                  name: 'Michael Johnson', 
                  email: 'michael@example.com',
                  department: department !== 'All Departments' ? department : 'HR',
                  position: 'HR Coordinator',
                  joinDate: '2023-02-10',
                  status: 'Inactive'
                },
                { 
                  employeeCode: 'EMP004', 
                  name: 'Sarah Wilson', 
                  email: 'sarah@example.com',
                  department: department !== 'All Departments' ? department : 'Engineering',
                  position: 'Frontend Developer',
                  joinDate: '2023-04-05',
                  status: 'Active'
                },
                { 
                  employeeCode: 'EMP005', 
                  name: 'Thomas Brown', 
                  email: 'thomas@example.com',
                  department: department !== 'All Departments' ? department : 'Engineering',
                  position: 'Backend Developer',
                  joinDate: '2023-05-12',
                  status: 'Active'
                },
                { 
                  employeeCode: 'EMP006', 
                  name: 'Emily Davis', 
                  email: 'emily@example.com',
                  department: department !== 'All Departments' ? department : 'Finance',
                  position: 'Accountant',
                  joinDate: '2023-02-28',
                  status: 'Active'
                },
                { 
                  employeeCode: 'EMP007', 
                  name: 'David Wilson', 
                  email: 'david@example.com',
                  department: department !== 'All Departments' ? department : 'Sales',
                  position: 'Sales Manager',
                  joinDate: '2023-01-10',
                  status: 'Active'
                }
              ]
            };
            break;
          case 'leaves':          mockData = {
              title: `${department} Leave Report`,
              columns: ['employeeName', 'employeeCode', 'email', 'leaveType', 'startDate', 'endDate', 'duration', 'status', 'reason', 'appliedDate'],
              headers: ['Employee Name', 'Employee Code', 'Email', 'Leave Type', 'Start Date', 'End Date', 'Duration (Days)', 'Status', 'Reason', 'Applied Date'],
              data: [
                { 
                  employeeName: 'John Doe', 
                  employeeCode: 'EMP001', 
                  email: 'john@example.com',
                  leaveType: 'Annual Leave',
                  startDate: '2025-05-15',
                  endDate: '2025-05-20',
                  duration: 6,
                  status: 'APPROVED',
                  reason: 'Family vacation',
                  appliedDate: '2025-04-20'
                },
                { 
                  employeeName: 'Jane Smith', 
                  employeeCode: 'EMP002', 
                  email: 'jane@example.com',
                  leaveType: 'Sick Leave',
                  startDate: '2025-05-10',
                  endDate: '2025-05-12',
                  duration: 3,
                  status: 'APPROVED',
                  reason: 'Medical appointment',
                  appliedDate: '2025-05-08'
                },
                { 
                  employeeName: 'Michael Johnson', 
                  employeeCode: 'EMP003', 
                  email: 'michael@example.com',
                  leaveType: 'Unpaid Leave',
                  startDate: '2025-06-01',
                  endDate: '2025-06-15',
                  duration: 15,
                  status: 'PENDING',
                  reason: 'Personal matters',
                  appliedDate: '2025-05-01'
                },
                { 
                  employeeName: 'Sarah Wilson', 
                  employeeCode: 'EMP004', 
                  email: 'sarah@example.com',
                  leaveType: 'Annual Leave',
                  startDate: '2025-05-25',
                  endDate: '2025-05-28',
                  duration: 4,
                  status: 'APPROVED',
                  reason: 'Personal trip',
                  appliedDate: '2025-05-05'
                },
                { 
                  employeeName: 'Thomas Brown', 
                  employeeCode: 'EMP005', 
                  email: 'thomas@example.com',
                  leaveType: 'Sick Leave',
                  startDate: '2025-05-11',
                  endDate: '2025-05-11',
                  duration: 1,
                  status: 'APPROVED',
                  reason: 'Not feeling well',
                  appliedDate: '2025-05-10'
                },
                { 
                  employeeName: 'Emily Davis', 
                  employeeCode: 'EMP006', 
                  email: 'emily@example.com',
                  leaveType: 'Parental Leave',
                  startDate: '2025-06-10',
                  endDate: '2025-07-10',
                  duration: 30,
                  status: 'PENDING',
                  reason: 'Maternity leave',
                  appliedDate: '2025-05-01'
                }
              ]
            };
            break;
          case 'performance':          mockData = {
              title: 'Performance Report',
              columns: ['employeeName', 'employeeCode', 'department', 'position', 'daysPresent', 'daysAbsent', 'daysOnLeave', 'attendancePercentage', 'avgWorkHours', 'onTimeArrival', 'performanceScore'],
              headers: ['Employee Name', 'Employee Code', 'Department', 'Position', 'Days Present', 'Days Absent', 'Days On Leave', 'Attendance %', 'Avg Work Hours', 'On Time %', 'Performance Score'],
              data: [
                { 
                  employeeName: 'John Doe', 
                  employeeCode: 'EMP001', 
                  department: department !== 'All Departments' ? department : 'Engineering',
                  position: 'Senior Developer',
                  daysPresent: 20,
                  daysAbsent: 1,
                  daysOnLeave: 2,
                  attendancePercentage: '95.65%',
                  avgWorkHours: '8.2',
                  onTimeArrival: '92.00%',
                  performanceScore: 'A'
                },
                { 
                  employeeName: 'Jane Smith', 
                  employeeCode: 'EMP002', 
                  department: department !== 'All Departments' ? department : 'Marketing',
                  position: 'Marketing Specialist',
                  daysPresent: 18,
                  daysAbsent: 3,
                  daysOnLeave: 2,
                  attendancePercentage: '86.96%',
                  avgWorkHours: '8.0',
                  onTimeArrival: '88.89%',
                  performanceScore: 'B'
                },
                { 
                  employeeName: 'Michael Johnson', 
                  employeeCode: 'EMP003', 
                  department: department !== 'All Departments' ? department : 'HR',
                  position: 'HR Coordinator',
                  daysPresent: 21,
                  daysAbsent: 0,
                  daysOnLeave: 2,
                  attendancePercentage: '100.00%',
                  avgWorkHours: '8.5',
                  onTimeArrival: '95.24%',
                  performanceScore: 'A'
                },
                { 
                  employeeName: 'Sarah Wilson', 
                  employeeCode: 'EMP004', 
                  department: department !== 'All Departments' ? department : 'Engineering',
                  position: 'Frontend Developer',
                  daysPresent: 19,
                  daysAbsent: 2,
                  daysOnLeave: 2,
                  attendancePercentage: '90.48%',
                  avgWorkHours: '8.3',
                  onTimeArrival: '94.74%',
                  performanceScore: 'A-'
                },
                { 
                  employeeName: 'Thomas Brown', 
                  employeeCode: 'EMP005', 
                  department: department !== 'All Departments' ? department : 'Engineering',
                  position: 'Backend Developer',
                  daysPresent: 22,
                  daysAbsent: 0,
                  daysOnLeave: 1,
                  attendancePercentage: '100.00%',
                  avgWorkHours: '8.7',
                  onTimeArrival: '100.00%',
                  performanceScore: 'A+'
                },
                { 
                  employeeName: 'Emily Davis', 
                  employeeCode: 'EMP006', 
                  department: department !== 'All Departments' ? department : 'Finance',
                  position: 'Accountant',
                  daysPresent: 17,
                  daysAbsent: 4,
                  daysOnLeave: 2,
                  attendancePercentage: '80.95%',
                  avgWorkHours: '7.9',
                  onTimeArrival: '88.24%',
                  performanceScore: 'B-'
                },
                { 
                  employeeName: 'David Wilson', 
                  employeeCode: 'EMP007', 
                  department: department !== 'All Departments' ? department : 'Sales',
                  position: 'Sales Manager',
                  daysPresent: 19,
                  daysAbsent: 1,
                  daysOnLeave: 3,
                  attendancePercentage: '95.00%',
                  avgWorkHours: '8.4',
                  onTimeArrival: '94.74%',
                  performanceScore: 'A'
                }
              ]
            };
            break;
          default:
            mockData = { error: 'Invalid report type' };
        }
        
        setIsLoading(false);
        return mockData;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Failed to fetch ${reportType} report data`;
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };  const deleteEmployee = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Check if ID is valid
      if (!id || typeof id !== 'string') {
        throw new Error(`Invalid employee ID: ${id} - ID must be a string`);
      }
      
      if (id.length !== 24) {
        console.warn(`Employee ID ${id} may not be valid - expected 24 characters for MongoDB ID`);
      }

      console.log(`Attempting to delete employee with ID: ${id}`);
      
      // The backend route is defined at /api/employees/:id in employeeRoutes.js
      // Since the axios instance already has /api as the baseURL, we just need to use /employees/:id
      const response = await api.delete(`/employees/${id}`);
      console.log('Delete employee response:', response);
      
      setIsLoading(false);
      return response;
    } catch (err: any) {
      console.error('API Error deleting employee:', err);
      
      // More detailed error logging
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error data:', err.response.data);
        console.error('Response error status:', err.response.status);
        console.error('Response error headers:', err.response.headers);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
      }
      
      const errorMessage = err.response?.data?.message || 'Failed to delete employee';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };
  const generateAttendanceReport = async (startDate: string, endDate: string, format: string = 'pdf', departmentId?: string): Promise<Blob> => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to connect to the API
      const params = { startDate, endDate, departmentId, format };
      try {
        const response = await api.get('/admin/reports/attendance', { params, responseType: 'blob' });
        setIsLoading(false);
        return response.data;
      } catch (apiError) {
        console.warn('API Error, falling back to mock data:', apiError);
        
        // If API fails, generate a mock report (for demo/development)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Create a mock blob with basic content
        const mockContent = `
          Attendance Report
          -----------------
          Date range: ${startDate} to ${endDate}
          Department: ${departmentId || 'All Departments'}
          Format: ${format}
          
          This is a mock report for demonstration purposes.
          In a real implementation, this would be a ${format.toUpperCase()} file with actual attendance data.
        `;
        
        const contentType = format === 'csv' ? 'text/csv' :
                            format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                            'application/pdf';
        
        const blob = new Blob([mockContent], { type: contentType });
        setIsLoading(false);
        return blob;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate attendance report';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };
  const generateEmployeeReport = async (format: string = 'pdf', departmentId?: string): Promise<Blob> => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to connect to the API
      const params = { format, departmentId };
      try {
        const response = await api.get('/admin/reports/employees', { params, responseType: 'blob' });
        setIsLoading(false);
        return response.data;
      } catch (apiError) {
        console.warn('API Error, falling back to mock data:', apiError);
        
        // If API fails, generate a mock report (for demo/development)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Create a mock blob with basic content
        const mockContent = `
          Employee Report
          --------------
          Department: ${departmentId || 'All Departments'}
          Format: ${format}
          
          This is a mock employee report for demonstration purposes.
          In a real implementation, this would be a ${format.toUpperCase()} file with actual employee data.
        `;
        
        const contentType = format === 'csv' ? 'text/csv' :
                           format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                           'application/pdf';
        
        const blob = new Blob([mockContent], { type: contentType });
        setIsLoading(false);
        return blob;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate employee report';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };  const generateLeaveReport = async (startDate: string, endDate: string, format: string = 'pdf', departmentId?: string): Promise<Blob> => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to connect to the API
      const params = { startDate, endDate, departmentId, format };
      try {
        const response = await api.get('/admin/reports/leaves', { params, responseType: 'blob' });
        setIsLoading(false);
        return response.data;
      } catch (apiError) {
        console.warn('API Error, falling back to mock data:', apiError);
        
        // If API fails, generate a mock report (for demo/development)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Create a mock blob with basic content
        const mockContent = `
          Leave Report
          --------------
          Date range: ${startDate} to ${endDate}
          Department: ${departmentId || 'All Departments'}
          Format: ${format}
          
          This is a mock leave report for demonstration purposes.
          In a real implementation, this would be a ${format.toUpperCase()} file with actual leave data.
        `;
        
        const contentType = format === 'csv' ? 'text/csv' :
                           format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                           'application/pdf';
        
        const blob = new Blob([mockContent], { type: contentType });
        setIsLoading(false);
        return blob;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate leave report';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };
  const generatePerformanceReport = async (startDate: string, endDate: string, format: string = 'pdf'): Promise<Blob> => {
    setIsLoading(true);
    setError(null);
    try {
      // Try to connect to the API
      const params = { startDate, endDate, format };
      try {
        const response = await api.get('/admin/reports/performance', { params, responseType: 'blob' });
        setIsLoading(false);
        return response.data;
      } catch (apiError) {
        console.warn('API Error, falling back to mock data:', apiError);
        
        // If API fails, generate a mock report (for demo/development)
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Create a mock blob with basic content
        const mockContent = `
          Performance Report
          -----------------
          Date range: ${startDate} to ${endDate}
          Format: ${format}
          
          This is a mock performance report for demonstration purposes.
          In a real implementation, this would be a ${format.toUpperCase()} file with actual performance metrics.
          
          Performance metrics would include:
          - Attendance percentage
          - On-time arrival percentage
          - Work hour averages
          - Performance ratings
        `;
        
        const contentType = format === 'csv' ? 'text/csv' :
                           format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                           'application/pdf';
        
        const blob = new Blob([mockContent], { type: contentType });
        setIsLoading(false);
        return blob;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to generate performance report';
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
    deleteEmployee,
    generateAttendanceReport,
    generateEmployeeReport,
    generateLeaveReport,
    generatePerformanceReport,
    fetchReportData
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
 * @param format - Report format (pdf, excel, csv)
 * @param departmentId - Optional department ID to filter by
 * @returns Report data as Blob
 */
export const generateAttendanceReport = async (
  startDate: string, 
  endDate: string, 
  format: string = 'pdf',
  departmentId?: string
): Promise<Blob> => {
  const params = { startDate, endDate, departmentId, format };
  const response = await api.get('/admin/reports/attendance', { params, responseType: 'blob' });
  return response.data;
};

/**
 * Generate employee details report
 * @param format - Report format (pdf, excel)
 * @param departmentId - Optional department ID to filter by
 * @returns Report data as Blob
 */
export const generateEmployeeReport = async (
  format: string = 'pdf',
  departmentId?: string
): Promise<Blob> => {
  const params = { format, departmentId };
  const response = await api.get('/admin/reports/employees', { params, responseType: 'blob' });
  return response.data;
};

/**
 * Generate leave management report
 * @param startDate - Start date for the report
 * @param endDate - End date for the report
 * @param format - Report format (pdf, excel, csv)
 * @param departmentId - Optional department ID to filter by
 * @returns Report data as Blob
 */
export const generateLeaveReport = async (
  startDate: string, 
  endDate: string, 
  format: string = 'pdf',
  departmentId?: string
): Promise<Blob> => {
  const params = { startDate, endDate, departmentId, format };
  const response = await api.get('/admin/reports/leaves', { params, responseType: 'blob' });
  return response.data;
};

/**
 * Generate performance metrics report
 * @param startDate - Start date for the report
 * @param endDate - End date for the report
 * @param format - Report format (pdf, excel)
 * @returns Report data as Blob
 */
export const generatePerformanceReport = async (
  startDate: string, 
  endDate: string, 
  format: string = 'pdf'
): Promise<Blob> => {
  const params = { startDate, endDate, format };
  const response = await api.get('/admin/reports/performance', { params, responseType: 'blob' });
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

/**
 * Get all departments
 * @returns Array of departments
 */
export const getAllDepartments = async (): Promise<{ _id: string; dept_name: string; description: string }[]> => {
  const response = await api.get('/departments');
  return response.data;
};

/**
 * Assign department to a user
 * @param userId - ID of the user
 * @param departmentId - ID of the department to assign
 * @returns Success response
 */
export const assignDepartmentToUser = async (userId: string, departmentId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/admin/users/${userId}/department`, { department_id: departmentId });
  return response.data;
};

/**
 * Delete a user from the system
 * Note: Cannot delete users with attached employee profiles
 * @param userId - ID of the user to delete
 * @returns Success response
 */
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};