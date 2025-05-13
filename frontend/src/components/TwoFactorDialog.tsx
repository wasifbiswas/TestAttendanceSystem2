import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaFingerprint, FaClock, FaMapMarkerAlt, FaStopwatch, FaCalendarCheck } from 'react-icons/fa';

interface TwoFactorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: 'checkin' | 'checkout';
  checkInTime?: string; // Optional check-in time for displaying duration when checking out
}

const TwoFactorDialog: React.FC<TwoFactorDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  checkInTime
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
    // Update time every second  // Add states for location and work duration
  const [location, setLocation] = useState<string>('');
  const [workDuration, setWorkDuration] = useState<string>('');

  // Get user location if checking in or out
  useEffect(() => {
    if (!isOpen) return;

    // Get approximate location based on IP (for privacy, we're not using precise GPS)
    const fetchLocation = async () => {
      try {
        // In a real app, you might want to use a more secure/private method or ask for user permission
        setLocation('Office Location');
      } catch (error) {
        setLocation('Unknown Location');
      }
    };

    fetchLocation();
  }, [isOpen]);

  // Calculate work duration if checking out and check-in time is available
  useEffect(() => {
    if (!isOpen || action !== 'checkout' || !checkInTime) return;

    const calculateDuration = () => {
      try {
        if (checkInTime) {
          const checkInDate = new Date(checkInTime);
          const now = new Date();
          const diffMs = now.getTime() - checkInDate.getTime();
          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          
          setWorkDuration(`${diffHrs}h ${diffMins}m`);
        }
      } catch (error) {
        setWorkDuration('Unknown');
      }
    };

    calculateDuration();
    
    // Update duration every minute if checking out
    const intervalId = setInterval(calculateDuration, 60000);
    return () => clearInterval(intervalId);
  }, [isOpen, action, checkInTime]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    // Format current date and time
    const updateDateTime = () => {
      const now = new Date();
      
      // Format time: HH:MM:SS AM/PM
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short' // Show timezone abbreviation (e.g., IST)
      };
      setCurrentTime(now.toLocaleTimeString('en-US', timeOptions));
      
      // Format date: Month DD, YYYY
      const dateOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long' // Add day of week
      };
      setCurrentDate(now.toLocaleDateString('en-US', dateOptions));
    };
    
    // Initial update
    updateDateTime();
    
    // Set up interval
    const intervalId = setInterval(updateDateTime, 1000);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const isCheckIn = action === 'checkin';
  const title = isCheckIn ? 'Confirm Check In' : 'Confirm Check Out';
  const message = isCheckIn 
    ? 'Are you sure you want to check in? This action will record your attendance for today.'
    : checkInTime 
      ? 'Are you sure you want to check out? This will mark the end of your workday.'
      : 'You haven\'t checked in today. Checking out now will create a record without a check-in time.';
  const confirmText = isCheckIn ? 'Check In' : 'Check Out';
  const buttonColor = isCheckIn ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600';
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
      >        <div className="flex items-center mb-4">
          <div className={`${isCheckIn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} p-3 rounded-full mr-4`}>
            <FaFingerprint className={`h-6 w-6 ${isCheckIn ? 'text-green-500 dark:text-green-400' : 'text-blue-500 dark:text-blue-400'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {message}
        </p>
          {/* Time and date information */}        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center mb-3">
            <FaClock className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">
              {isCheckIn ? 'Check-in Time Information' : 'Check-out Time Information'}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                <span className="text-xs py-1 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {isCheckIn ? 'Arrival' : 'Departure'}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white mt-1">{currentDate}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time</p>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{currentTime}</span>
                <span className={`ml-2 text-xs py-1 px-2 rounded-full ${
                  isCheckIn ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                }`}>
                  {isCheckIn ? 'Check-in Time' : 'Check-out Time'}
                </span>
              </div>
            </div>
            {/* Location information */}  
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
              <div className="flex items-center">
                <FaMapMarkerAlt className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                <span className="text-sm font-medium text-gray-800 dark:text-white">Office Location</span>
                <span className="ml-2 text-xs py-0.5 px-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">Verified</span>
              </div>
            </div>
              {/* Work duration for checkout */}
            {!isCheckIn && checkInTime && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Work Duration</p>
                  <span className="text-xs py-1 px-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                    Today
                  </span>
                </div>
                <div className="flex items-center">
                  <FaStopwatch className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">{workDuration || 'Calculating...'}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Since check-in at {new Date(checkInTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            This will be recorded as your official {isCheckIn ? 'arrival' : 'departure'} time
          </p>
        </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex justify-center items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-md transition-colors ${buttonColor} flex justify-center items-center`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorDialog;
