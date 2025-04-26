// Get start of the current day (midnight)
export const getStartOfDay = (date = new Date()) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

// Get end of the current day (23:59:59.999)
export const getEndOfDay = (date = new Date()) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

// Get start of the month
export const getStartOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Get end of the month
export const getEndOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

// Check if a date is a weekend (Saturday or Sunday)
export const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

// Get the number of working days (Mon-Fri) between two dates
export const getWorkingDaysInRange = (startDate, endDate) => {
  // Convert to date objects if they're not already
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Ensure start date is at the beginning of the day
  start.setHours(0, 0, 0, 0);

  // Ensure end date is at the beginning of the day
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  let workingDays = 0;
  const currentDate = new Date(start);

  // Iterate through each day in the range
  while (currentDate <= endDay) {
    // Check if the day is a weekday (Monday to Friday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

// Format date as YYYY-MM-DD
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Calculate time difference in hours
export const getHoursDifference = (startTime, endTime) => {
  return (endTime - startTime) / (1000 * 60 * 60);
};

// Check if date is today
export const isToday = (date) => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Get a date range array between two dates
export const getDateRange = (startDate, endDate) => {
  const dateArray = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set time to beginning of day
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  // Loop through days and add to array
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dateArray.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
};

// Helper functions for date manipulation

/**
 * Get the start and end of a day for a given date
 * @param {Date} date The date to get boundaries for
 * @returns {Object} Object with startOfDay and endOfDay
 */
export const getDayBoundaries = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

/**
 * Get the month range (first and last day of month)
 * @param {Number} year The year
 * @param {Number} month The month (0-11)
 * @returns {Object} Object with firstDay and lastDay
 */
export const getMonthRange = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return { firstDay, lastDay };
};

/**
 * Add days to a date
 * @param {Date} date The original date
 * @param {Number} days Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Calculate the difference in days between two dates
 * @param {Date} date1 First date
 * @param {Date} date2 Second date
 * @returns {Number} Difference in days
 */
export const dateDiffInDays = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 First date
 * @param {Date} date2 Second date
 * @returns {Boolean} True if same day, false otherwise
 */
export const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if two date ranges overlap
 * @param {Date} start1 First range start
 * @param {Date} end1 First range end
 * @param {Date} start2 Second range start
 * @param {Date} end2 Second range end
 * @returns {Boolean} True if ranges overlap
 */
export const dateRangesOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && start2 <= end1;
};

/**
 * Get working days between two dates (excluding weekends)
 * @param {Date} startDate Start date
 * @param {Date} endDate End date
 * @returns {Number} Working days
 */
export const getWorkingDays = (startDate, endDate) => {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};
