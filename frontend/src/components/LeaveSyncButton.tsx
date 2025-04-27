import { useState } from 'react';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import { FaGoogle, FaSync } from 'react-icons/fa';

interface LeaveSyncButtonProps {
  leaveRequest: {
    id: string;
    start_date: string;
    end_date: string;
    reason: string;
    type: string;
    status: string;
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const LeaveSyncButton = ({ leaveRequest, onSuccess, onError }: LeaveSyncButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { isInitialized, isSignedIn, isLoading, initialize, signIn, createLeaveEvent } = useGoogleCalendar();

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      // Initialize Google Calendar if not already initialized
      if (!isInitialized) {
        await initialize();
      }
      
      // Sign in if not already signed in
      if (!isSignedIn) {
        await signIn();
      }
      
      // Create leave event in Google Calendar
      const startDate = new Date(leaveRequest.start_date);
      const endDate = new Date(leaveRequest.end_date);
      // Add 1 day to end date for all-day events (Google Calendar convention)
      endDate.setDate(endDate.getDate() + 1);
      
      const title = `${leaveRequest.type} Leave`;
      const description = `Reason: ${leaveRequest.reason}\nStatus: ${leaveRequest.status}`;
      
      await createLeaveEvent(title, startDate, endDate, description);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to sync leave to Google Calendar', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error.message || 'Failed to sync leave to Google Calendar');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing || isLoading}
      className={`
        flex items-center gap-2 px-3 py-1 rounded text-white text-sm font-medium
        ${(isSyncing || isLoading) 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'}
        transition-colors duration-200
      `}
      title="Add to Google Calendar"
    >
      {isSyncing || isLoading ? (
        <>
          <FaSync className="animate-spin text-xs" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <FaGoogle className="text-xs" />
          <span>Add to Calendar</span>
        </>
      )}
    </button>
  );
};

export default LeaveSyncButton; 