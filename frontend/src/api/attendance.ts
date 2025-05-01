import api from './axios';

export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  leaves: number;
}

export interface LeaveBalance {
  annual: number;
  sick: number;
  casual: number;
}

export interface AttendanceSummary {
  stats: AttendanceStats;
  leaveBalance: LeaveBalance;
  employee_id?: string;  // Added to match the backend response
}

export interface CheckInOutResponse {
  success: boolean;
  message: string;
  timestamp: string;
  status: 'IN' | 'OUT';
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: 'ANNUAL' | 'SICK' | 'CASUAL';
  start_date: string;  // Changed from startDate to match API
  end_date: string;    // Changed from endDate to match API
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';  // Changed DENIED to REJECTED to match API
  createdAt: string;
  updatedAt: string;
}

export interface LeaveResponse {
  success: boolean;
  message: string;
  id: string;
}

export interface AttendanceRecord {
  _id: string;
  emp_id: {
    _id: string;
    user_id: {
      _id: string;
      username: string;
      full_name: string;
      email: string;
    };
    employee_code: string;
    designation: string;
  };
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY' | 'HALF_DAY' | 'WEEKEND';
  work_hours: number;
  is_leave: boolean;
  leave_request_id?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceFilter {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
  status?: string;
}

export interface LeaveType {
  _id: string;
  leave_code: string;
  leave_name: string;
  description?: string;
  default_annual_quota: number;
}

export const checkIn = async (): Promise<CheckInOutResponse> => {
  try {
    const response = await api.post<CheckInOutResponse>('/attendance/check-in');
    return response.data;
  } catch (error) {
    console.error('Check-in error:', error);
    throw error;
  }
};

export const checkOut = async (): Promise<CheckInOutResponse> => {
  try {
    const response = await api.post<CheckInOutResponse>('/attendance/check-out');
    return response.data;
  } catch (error) {
    console.error('Check-out error:', error);
    throw error;
  }
};

export const requestLeave = async (leaveData: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'status' | 'createdAt' | 'updatedAt'>): Promise<LeaveResponse> => {
  try {
    // Get the attendance summary which includes the employee_id
    const summaryResponse = await api.get('/user/attendance/summary');
    
    // Check if we have the employee ID in the response
    if (!summaryResponse.data || !summaryResponse.data.employee_id) {
      console.error('Employee data not found in response:', summaryResponse.data);
      
      // Check if there's a message in the response indicating no employee profile
      if (summaryResponse.data && summaryResponse.data.message && 
          summaryResponse.data.message.includes('No employee profile found')) {
        throw new Error(summaryResponse.data.message);
      } else {
        throw new Error('No employee profile found for current user');
      }
    }
    
    // Get the employee ID from the attendance summary
    const employeeId = summaryResponse.data.employee_id;
    
    // Add employee ID to the leave request data
    const requestData = {
      ...leaveData,
      emp_id: employeeId
    };
    
    // Send the request with the employee ID included
    const response = await api.post<LeaveResponse>('/leaves', requestData);
    return response.data;
  } catch (error) {
    console.error('Leave request error:', error);
    throw error;
  }
};

export const getAttendanceSummary = async (): Promise<AttendanceSummary> => {
  try {
    const response = await api.get<AttendanceSummary>('/user/attendance/summary');
    return response.data;
  } catch (error) {
    console.error('Get attendance summary error:', error);
    throw error;
  }
};

export const getUserLeaves = async (): Promise<LeaveRequest[]> => {
  try {
    const response = await api.get<LeaveRequest[]>('/user/leaves');
    return response.data;
  } catch (error) {
    console.error('Error fetching user leaves:', error);
    throw error;
  }
};

export const cancelLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.put<{ success: boolean; message: string }>(`/leaves/${leaveId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Cancel leave request error:', error);
    throw error;
  }
};

export const getAttendanceLogs = async (filters?: AttendanceFilter): Promise<AttendanceRecord[]> => {
  try {
    // Build query string based on filters
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) {
      queryParams.append('start_date', filters.startDate);
    }
    
    if (filters?.endDate) {
      queryParams.append('end_date', filters.endDate);
    }
    
    if (filters?.departmentId) {
      queryParams.append('department', filters.departmentId);
    }
    
    if (filters?.employeeId) {
      queryParams.append('employee_id', filters.employeeId);
    }
    
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/attendance?${queryString}` : '/attendance';
    
    const response = await api.get<AttendanceRecord[]>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    throw error;
  }
};

export const getEmployeeAttendanceLogs = async (
  employeeId: string, 
  filters?: Omit<AttendanceFilter, 'employeeId'>
): Promise<AttendanceRecord[]> => {
  try {
    // Build query string based on filters
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) {
      queryParams.append('start_date', filters.startDate);
    }
    
    if (filters?.endDate) {
      queryParams.append('end_date', filters.endDate);
    }
    
    if (filters?.status) {
      queryParams.append('status', filters.status);
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/attendance/employee/${employeeId}?${queryString}` : `/attendance/employee/${employeeId}`;
    
    const response = await api.get<AttendanceRecord[]>(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee attendance logs:', error);
    throw error;
  }
};

export const getLeaveTypes = async (): Promise<LeaveType[]> => {
  try {
    const response = await api.get<LeaveType[]>('/leaves/types');
    return response.data;
  } catch (error) {
    console.error('Error fetching leave types:', error);
    throw error;
  }
};