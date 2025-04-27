import { useState } from 'react';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import { FaGoogle, FaSync } from 'react-icons/fa';

interface HolidaySyncButtonProps {
  holidays: Array<{
    id: string;
    name: string;
    date: string;
    type: string;
  }>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const HolidaySyncButton = ({ holidays, onSuccess, onError }: HolidaySyncButtonProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { isInitialized, isSignedIn, isLoading, initialize, signIn, syncHolidays } = useGoogleCalendar();

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
      
      // Sync holidays to Google Calendar
      await syncHolidays(holidays);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to sync holidays to Google Calendar', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error.message || 'Failed to sync holidays to Google Calendar');
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
        flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium
        ${(isSyncing || isLoading) 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'}
        transition-colors duration-200
      `}
    >
      {isSyncing || isLoading ? (
        <>
          <FaSync className="animate-spin" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <FaGoogle />
          <span>Sync to Google Calendar</span>
        </>
      )}
    </button>
  );
};

export default HolidaySyncButton; 