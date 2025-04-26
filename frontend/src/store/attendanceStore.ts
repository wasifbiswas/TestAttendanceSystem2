import { create } from 'zustand';
import { 
  checkIn as apiCheckIn, 
  checkOut as apiCheckOut,
  requestLeave as apiRequestLeave,
  getAttendanceSummary as apiGetAttendanceSummary,
  AttendanceSummary, 
  LeaveRequest,
  CheckInOutResponse
} from '../api/attendance';

interface AttendanceState {
  isLoading: boolean;
  error: string | null;
  lastCheckInOut: CheckInOutResponse | null;
  attendanceSummary: AttendanceSummary | null;
  
  // Actions
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  requestLeave: (leaveData: LeaveRequest) => Promise<void>;
  fetchAttendanceSummary: () => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  isLoading: false,
  error: null,
  lastCheckInOut: null,
  attendanceSummary: null,

  checkIn: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiCheckIn();
      set({ 
        lastCheckInOut: response,
        isLoading: false
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to check in. Please try again.', 
        isLoading: false 
      });
      throw error;
    }
  },

  checkOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiCheckOut();
      set({ 
        lastCheckInOut: response,
        isLoading: false
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to check out. Please try again.', 
        isLoading: false 
      });
      throw error;
    }
  },

  requestLeave: async (leaveData) => {
    set({ isLoading: true, error: null });
    try {
      await apiRequestLeave(leaveData);
      set({ isLoading: false });
      // Re-fetch attendance summary to update leave balances
      get().fetchAttendanceSummary();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to request leave. Please try again.', 
        isLoading: false 
      });
      throw error;
    }
  },

  fetchAttendanceSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await apiGetAttendanceSummary();
      set({ 
        attendanceSummary: summary,
        isLoading: false
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch attendance summary.', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
})); 