/**
 * Date utility functions for consistent date formatting throughout the application
 * Format: DD-MON-YYYY (e.g., 15-Jan-2024, 03-Dec-2023)
 */

// Month abbreviations
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Format a date to DD-MON-YYYY format
 * @param date - Date object, ISO string, or YYYY-MM-DD string
 * @returns Formatted date string (e.g., "15-Jan-2024")
 */
export const formatDateToDDMONYYYY = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Handle ISO string or YYYY-MM-DD format
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = MONTHS[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

/**
 * Convert DD-MON-YYYY format back to YYYY-MM-DD for database storage
 * @param ddMonYyyy - Date string in DD-MON-YYYY format
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 */
export const convertDDMONYYYYToISO = (ddMonYyyy: string): string => {
  if (!ddMonYyyy) return '';
  
  try {
    const parts = ddMonYyyy.split('-');
    if (parts.length !== 3) return '';
    
    const day = parts[0].padStart(2, '0');
    const monthStr = parts[1];
    const year = parts[2];
    
    const monthIndex = MONTHS.indexOf(monthStr);
    if (monthIndex === -1) return '';
    
    const month = (monthIndex + 1).toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.warn('Error converting DD-MON-YYYY to ISO:', error);
    return '';
  }
};

/**
 * Get today's date in DD-MON-YYYY format
 * @returns Today's date formatted as DD-MON-YYYY
 */
export const getTodayFormatted = (): string => {
  return formatDateToDDMONYYYY(new Date());
};

/**
 * Check if a date string is in the past (for validation)
 * @param dateStr - Date string in any format
 * @returns true if date is in the past
 */
export const isDateInPast = (dateStr: string): boolean => {
  if (!dateStr) return false;
  
  try {
    const inputDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
    
    return inputDate < today;
  } catch (error) {
    return false;
  }
};

/**
 * Format date for display in trip cards and lists
 * @param date - Date in any format
 * @returns Formatted date with fallback
 */
export const formatTripDate = (date: Date | string | null | undefined): string => {
  const formatted = formatDateToDDMONYYYY(date);
  return formatted || 'Date not set';
};