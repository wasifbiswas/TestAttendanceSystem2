// Date utility functions for timezone operations
export const INDIAN_TIMEZONE = 'Asia/Kolkata';

/**
 * Get the current date in Indian timezone (IST)
 * @returns Date object in Indian Standard Time
 */
export const getCurrentDateInIndianTimezone = (): Date => {
  // Create a date object with the current UTC time
  const now = new Date();
  
  // Format date to Indian timezone string
  const options: Intl.DateTimeFormatOptions = {
    timeZone: INDIAN_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };
  
  const indianDateStr = now.toLocaleString('en-IN', options);
  return new Date(indianDateStr);
};

/**
 * Check if the date has changed since the last check (based on Indian timezone)
 * @param lastCheckTimestamp - The timestamp of the last check
 * @returns boolean - true if the date has changed, false otherwise
 */
export const hasDateChangedInIndianTimezone = (lastCheckTimestamp: number): boolean => {
  // If no last check timestamp provided, assume date has changed
  if (!lastCheckTimestamp) return true;
  
  const lastCheckDate = new Date(lastCheckTimestamp);
  const currentIndianDate = getCurrentDateInIndianTimezone();
  
  // Extract date components for comparison
  const lastDay = lastCheckDate.getDate();
  const lastMonth = lastCheckDate.getMonth();
  const lastYear = lastCheckDate.getFullYear();
  
  const currentDay = currentIndianDate.getDate();
  const currentMonth = currentIndianDate.getMonth();
  const currentYear = currentIndianDate.getFullYear();
  
  // Return true if the date has changed
  return currentDay !== lastDay || currentMonth !== lastMonth || currentYear !== lastYear;
};

/**
 * Get the timestamp for the start of the day in Indian timezone
 * @returns number - Timestamp representing the start of the current day in IST
 */
export const getStartOfDayTimestampInIndianTimezone = (): number => {
  const indianDate = getCurrentDateInIndianTimezone();
  indianDate.setHours(0, 0, 0, 0);
  return indianDate.getTime();
};