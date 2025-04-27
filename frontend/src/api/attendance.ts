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
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
  updatedAt: string;
}

export interface LeaveResponse {
  success: boolean;
  message: string;
  id: string;
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
    const response = await api.post<LeaveResponse>('/attendance/leave', leaveData);
    return response.data;
  } catch (error) {
    console.error('Leave request error:', error);
    throw error;
  }
};

export const getAttendanceSummary = async (): Promise<AttendanceSummary> => {
  try {
    const response = await api.get<AttendanceSummary>('/attendance/summary');
    return response.data;
  } catch (error) {
    console.error('Get attendance summary error:', error);
    throw error;
  }
};

export const getUserLeaves = async (): Promise<LeaveRequest[]> => {
  try {
    const response = await api.get<LeaveRequest[]>('/leave/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user leaves:', error);
    throw error;
  }
};

export const cancelLeaveRequest = async (leaveId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/attendance/leave/${leaveId}`);
    return response.data;
  } catch (error) {
    console.error('Cancel leave request error:', error);
    throw error;
  }
}; 