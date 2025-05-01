import { create } from 'zustand';
import { 
  checkIn as apiCheckIn, 
  checkOut as apiCheckOut,
  requestLeave as apiRequestLeave,
  getAttendanceSummary as apiGetAttendanceSummary,
  getUserLeaves as apiGetUserLeaves,
  AttendanceSummary, 
  LeaveRequest,
  CheckInOutResponse
} from '../api/attendance';
import { googleCalendarService } from '../services/GoogleCalendarService';

interface AttendanceState {
  isLoading: boolean;
  error: string | null;
  lastCheckInOut: CheckInOutResponse | null;
  attendanceSummary: AttendanceSummary | null;
  userLeaves: LeaveRequest[];
  calendarSynced: boolean;
  
  // Actions
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  requestLeave: (leaveData: LeaveRequest) => Promise<void>;
  fetchAttendanceSummary: () => Promise<void>;
  fetchUserLeaves: () => Promise<LeaveRequest[]>;
  syncLeavesToCalendar: () => Promise<void>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  isLoading: false,
  error: null,
  lastCheckInOut: null,
  attendanceSummary: null,
  userLeaves: [],
  calendarSynced: false,

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
      // Ensure data format matches API expectations
      const apiLeaveData = {
        ...leaveData,
        start_date: leaveData.start_date || leaveData.startDate,
        end_date: leaveData.end_date || leaveData.endDate,
        type: leaveData.type || leaveData.leaveType
      };
      
      const response = await apiRequestLeave(apiLeaveData);
      set({ isLoading: false });
      
      // Re-fetch attendance summary and user leaves to update leave balances
      get().fetchAttendanceSummary();
      const leaves = await get().fetchUserLeaves();
      
      // If the leave request was successful, attempt to sync with Google Calendar
      try {
        if (googleCalendarService.isUserSignedIn()) {
          const startDate = new Date(apiLeaveData.start_date);
          const endDate = new Date(apiLeaveData.end_date);
          endDate.setDate(endDate.getDate() + 1); // Add 1 day for Google Calendar all-day events
          
          await googleCalendarService.createLeaveEvent(
            `${apiLeaveData.type} Leave Request (Pending)`,
            startDate,
            endDate,
            `Reason: ${apiLeaveData.reason}\nStatus: Pending`
          );
          
          set({ calendarSynced: true });
        }
      } catch (syncError) {
        console.error('Failed to sync leave with Google Calendar', syncError);
        // Don't throw the error as the leave request was successful
      }
      
      return response;
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

  fetchUserLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const leaves = await apiGetUserLeaves();
      set({ 
        userLeaves: leaves,
        isLoading: false
      });
      return leaves;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch leave history.', 
        isLoading: false 
      });
      throw error;
    }
  },

  syncLeavesToCalendar: async () => {
    set({ isLoading: true, error: null });
    try {
      // First make sure we have the latest leaves
      const leaves = await get().fetchUserLeaves();
      
      // Only sync approved leaves
      const approvedLeaves = leaves.filter(leave => leave.status === 'Approved');
      
      // Make sure Google Calendar is initialized and user is signed in
      if (!googleCalendarService.isUserSignedIn()) {
        await googleCalendarService.init();
        await googleCalendarService.signIn();
      }
      
      // Sync each leave to Google Calendar
      for (const leave of approvedLeaves) {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        endDate.setDate(endDate.getDate() + 1); // Add 1 day for Google Calendar all-day events
        
        await googleCalendarService.createLeaveEvent(
          `${leave.type} Leave`,
          startDate,
          endDate,
          `Reason: ${leave.reason}\nStatus: ${leave.status}`
        );
      }
      
      set({ 
        calendarSynced: true,
        isLoading: false
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to sync leaves with Google Calendar.', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));