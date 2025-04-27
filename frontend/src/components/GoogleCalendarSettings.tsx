import { useState } from 'react';
import { useGoogleCalendar } from '../context/GoogleCalendarContext';
import { FaGoogle, FaSync, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa';

interface GoogleCalendarSettingsProps {
  onChange?: (settings: {
    autoSyncHolidays: boolean;
    autoSyncLeave: boolean;
    autoSyncSchedule: boolean;
  }) => void;
  initialSettings?: {
    autoSyncHolidays: boolean;
    autoSyncLeave: boolean;
    autoSyncSchedule: boolean;
  };
}

const GoogleCalendarSettings = ({ 
  onChange,
  initialSettings = {
    autoSyncHolidays: false,
    autoSyncLeave: false,
    autoSyncSchedule: false
  }
}: GoogleCalendarSettingsProps) => {
  const [settings, setSettings] = useState(initialSettings);
  const { 
    isInitialized, 
    isSignedIn, 
    isLoading, 
    error,
    initialize, 
    signIn, 
    signOut 
  } = useGoogleCalendar();
  const [isInitializing, setIsInitializing] = useState(false);

  const handleConnect = async () => {
    try {
      setIsInitializing(true);
      
      // Initialize Google Calendar if not already initialized
      if (!isInitialized) {
        await initialize();
      }
      
      // Sign in if not already signed in
      if (!isSignedIn) {
        await signIn();
      }
    } catch (error) {
      console.error('Failed to connect to Google Calendar', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to disconnect from Google Calendar', error);
    }
  };

  const handleSettingsChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    if (onChange) {
      onChange(newSettings);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FaGoogle className="text-2xl text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Google Calendar Integration</h3>
        </div>
        
        {isSignedIn ? (
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
          >
            <FaSignOutAlt />
            <span>Disconnect</span>
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading || isInitializing}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-white
              ${isLoading || isInitializing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}
              transition-colors duration-200
            `}
          >
            {isLoading || isInitializing ? (
              <>
                <FaSync className="animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <FaSignInAlt />
                <span>Connect Google Calendar</span>
              </>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {isSignedIn && (
        <div className="p-3 mb-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
          Successfully connected to Google Calendar
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium text-gray-800 dark:text-white">Auto-sync Holidays</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically sync company holidays to Google Calendar</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.autoSyncHolidays}
              onChange={(e) => handleSettingsChange('autoSyncHolidays', e.target.checked)}
              disabled={!isSignedIn}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium text-gray-800 dark:text-white">Auto-sync Leave Requests</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically add approved leave requests to Google Calendar</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.autoSyncLeave}
              onChange={(e) => handleSettingsChange('autoSyncLeave', e.target.checked)}
              disabled={!isSignedIn}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-md font-medium text-gray-800 dark:text-white">Auto-sync Work Schedule</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Automatically sync work schedules to Google Calendar</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.autoSyncSchedule}
              onChange={(e) => handleSettingsChange('autoSyncSchedule', e.target.checked)}
              disabled={!isSignedIn}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      
      {isSignedIn && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Calendar permissions: <span className="font-medium text-green-600 dark:text-green-400">Active</span>
          </p>
          <p className="mt-1">
            Note: You can revoke access to your Google Calendar at any time by clicking "Disconnect" or through your Google Account settings.
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSettings; 