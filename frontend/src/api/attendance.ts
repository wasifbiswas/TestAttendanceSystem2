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
  employee_code?: string; // Added for employee code display
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
  employee_id?: string;  // Added for employee identification
  employee_code?: string; // Added for employee code display
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

export interface EmployeeLeaveBalance {
  _id: string;
  leave_type_id: LeaveType;
  allocated_leaves: number;
  used_leaves: number;
  pending_leaves: number;
  carried_forward: number;
  year: number;
}

export interface DetailedLeaveRequest extends LeaveRequest {
  emp_id: {
    _id: string;
    employee_code: string;
    designation: string;
    user_id: {
      _id: string;
      username: string;
      full_name: string;
      email: string;
    };
  };
  leave_type_id: LeaveType;
  duration: number;
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
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    // There are two endpoints that provide this data, try both in case one fails
    console.log('Attempting to retrieve attendance summary...');
    
    try {
      // First try the user controller endpoint
      const response = await api.get<AttendanceSummary>(`/user/attendance/summary?_=${timestamp}`);
      console.log('Retrieved attendance summary from user controller:', response.data);
      return response.data;
    } catch (error) {
      console.log('First endpoint failed, trying attendance controller endpoint');
      // If that fails, try the attendance controller endpoint
      const response = await api.get<AttendanceSummary>(`/attendance/summary?_=${timestamp}`);
      console.log('Retrieved attendance summary from attendance controller:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Get attendance summary error (both endpoints failed):', error);
    throw error;
  }
};

export const getUserLeaves = async (): Promise<LeaveRequest[]> => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await api.get<LeaveRequest[]>(`/user/leaves?_=${timestamp}`);
    console.log('Retrieved user leaves:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user leaves:', error);
    throw error;
  }
};

export const cancelLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Attempting to cancel leave request with ID: ${leaveId}`);
    
    // Get all user leaves first to find the correct MongoDB _id
    const userLeaves = await getUserLeaves();
    console.log('Retrieved user leaves for ID matching:', userLeaves.length);
    
    // Find the leave with matching ID
    const matchingLeave = userLeaves.find(leave => {
      // Try various ways to match the leave
      return (
        leave.id === leaveId || 
        // Use optional chaining to safely access potential _id property
        (leave as any)?._id === leaveId ||
        // Additional fallback checks if needed
        (leave.id && typeof leave.id === 'string' && leaveId && typeof leaveId === 'string' && 
          (leave.id.includes(leaveId) || leaveId.includes(leave.id)))
      );
    });
    
    if (matchingLeave) {
      console.log('Found matching leave:', matchingLeave);
      
      // Use the proper MongoDB _id if available, otherwise use what we have
      const idToUse = (matchingLeave as any)?._id || leaveId;
      console.log(`Using ID for cancellation: ${idToUse}`);
      
      // Make the cancellation request
      const response = await api.put<{ success: boolean; message: string }>(`/leaves/${idToUse}/cancel`);
      
      console.log('Successfully cancelled leave request:', response.data);
      return {
        success: true,
        message: response.data.message || 'Leave request cancelled successfully'
      };
    } else {
      console.warn('Could not find matching leave in user leaves');
      
      // Try direct cancellation as fallback
      try {
        const response = await api.put<{ success: boolean; message: string }>(`/leaves/${leaveId}/cancel`);
        
        console.log('Successfully cancelled leave request with direct approach:', response.data);
        return {
          success: true,
          message: response.data.message || 'Leave request cancelled successfully'
        };
      } catch (directError: any) {
        console.error('Direct cancellation failed:', directError.message);
        throw directError; // Re-throw to be caught by the outer catch
      }
    }
  } catch (error: any) {
    console.error('Cancel leave request error:', error);
    
    // Provide more detailed error information
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data || 'No data');
      
      // Return a user-friendly error message based on the status code
      if (error.response.status === 404) {
        throw new Error('Leave request not found. It may have been already deleted.');
      } else if (error.response.status === 403) {
        throw new Error('You are not authorized to delete this leave request.');
      } else if (error.response.status === 400) {
        // More specific error for 400 Bad Request
        const errorMsg = error.response.data?.message || 'Invalid leave request format';
        throw new Error(`${errorMsg}. Please try again or refresh the page.`);
      } else if (error.response.status === 500) {
        throw new Error('Server error while deleting leave request. Please try again later.');
      }
    }
    
    // Fallback error message
    throw new Error(error.message || 'Failed to cancel leave request');
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

// Get leave request details by ID
export const getLeaveRequestDetails = async (leaveId: string): Promise<DetailedLeaveRequest> => {
  try {
    console.log('Fetching leave request details for ID:', leaveId);
    const response = await api.get<DetailedLeaveRequest>(`/leaves/${leaveId}`);
    
    // Check if the response includes the employee details
    if (!response.data.emp_id || !response.data.emp_id.employee_code) {
      console.warn('Employee code missing in leave request details:', response.data);
      
      // Add a default employee code if missing
      if (response.data.emp_id) {
        response.data.emp_id.employee_code = response.data.emp_id.employee_code || 'N/A';
      }
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching leave request details:', error);
    
    // Check for specific error types and provide better error messages
    if (error.response && error.response.status === 404) {
      throw new Error('Leave request not found. It may have been deleted.');
    }
    
    throw error;
  }
};

// Get employee leave balances
export const getEmployeeLeaveBalances = async (employeeId: string): Promise<EmployeeLeaveBalance[]> => {
  try {
    // Add timestamp and random nonce to prevent caching at all levels
    const timestamp = new Date().getTime();
    const nonce = Math.random().toString(36).substring(2, 15);
    
    // Handle case where employeeId contains query parameters
    let url = `/leaves/balance/${employeeId}`;
    if (!url.includes('?')) {
      url += `?_=${timestamp}&nonce=${nonce}`;
    } else {
      url += `&_=${timestamp}&nonce=${nonce}`;
    }
    
    console.log('Fetching employee leave balances from URL:', url);
    const response = await api.get<EmployeeLeaveBalance[]>(url);
    
    // Log the retrieved leave balances for debugging
    console.log('Retrieved leave balances:', response.data);
    
    // Check specifically for Annual Leave (AL) to debug the issue
    const annualLeave = response.data.find(b => b.leave_type_id?.leave_code === 'AL');
    if (annualLeave) {
      console.log('Annual Leave details:', {
        allocated: annualLeave.allocated_leaves,
        used: annualLeave.used_leaves,
        pending: annualLeave.pending_leaves,
        carried: annualLeave.carried_forward,
        remaining: annualLeave.allocated_leaves + annualLeave.carried_forward - 
                  annualLeave.used_leaves - annualLeave.pending_leaves
      });
    } else {
      console.log('No Annual Leave record found in the response');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching employee leave balances:', error);
    throw error;
  }
};