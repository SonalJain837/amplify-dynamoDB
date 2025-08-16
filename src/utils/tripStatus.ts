/**
 * Trip status utilities for contextually appropriate status labels
 * Based on trip dates and current date comparison
 */

export enum TripStatus {
  UPCOMING = "Upcoming",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed", 
  DEPARTING_TODAY = "Departing Today",
  RETURNING_TODAY = "Returning Today",
  NO_DATE = "No Date"
}

export interface TripDates {
  departureDate: Date | string | null | undefined;
  returnDate?: Date | string | null | undefined;
  flightTime?: string | null | undefined;
}

export interface TripStatusResult {
  status: TripStatus;
  color: 'success' | 'warning' | 'default' | 'info' | 'error';
  bgColor: string;
  textColor: string;
}

/**
 * Safely parse date from various formats
 */
function parseDate(dateInput: Date | string | null | undefined): Date | null {
  if (!dateInput) {
    return null;
  }

  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    if (typeof dateInput === 'string') {
      // Handle common date formats
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  } catch (error) {
    console.warn('Error parsing date:', dateInput, error);
    return null;
  }
}

/**
 * Check if two dates are the same day (ignoring time)
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Get normalized date (midnight of the same day)
 */
function getNormalizedDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Estimate return date based on departure date and trip type
 * This is a fallback when return date is not available
 */
function estimateReturnDate(departureDate: Date, flightDetails?: string): Date {
  const estimated = new Date(departureDate);
  
  // Default to same day return for domestic/short trips
  let daysToAdd = 0;
  
  // Simple heuristics based on flight details
  if (flightDetails) {
    const details = flightDetails.toLowerCase();
    if (details.includes('business') || details.includes('conference')) {
      daysToAdd = 3; // Business trips typically 3 days
    } else if (details.includes('vacation') || details.includes('holiday')) {
      daysToAdd = 7; // Vacation trips typically a week
    } else if (details.includes('international') || details.includes('overseas')) {
      daysToAdd = 10; // International trips typically longer
    } else {
      daysToAdd = 1; // Default to day trip
    }
  } else {
    daysToAdd = 1; // Default assumption for same day or next day return
  }
  
  estimated.setDate(estimated.getDate() + daysToAdd);
  return estimated;
}

/**
 * Core function to determine trip status based on dates
 */
export function getTripStatus(trip: TripDates): TripStatusResult {
  const now = new Date();
  const today = getNormalizedDate(now);
  
  // Parse departure date
  const departureDate = parseDate(trip.departureDate);
  if (!departureDate) {
    return {
      status: TripStatus.NO_DATE,
      color: 'default',
      bgColor: '#f3f4f6',
      textColor: '#374151'
    };
  }

  const departure = getNormalizedDate(departureDate);
  
  // Parse return date or estimate it
  let returnDate = parseDate(trip.returnDate);
  if (!returnDate) {
    returnDate = estimateReturnDate(departureDate, trip.flightTime || '');
  }
  const returnDay = getNormalizedDate(returnDate);

  // Determine status based on date relationships
  if (isSameDay(departure, today)) {
    return {
      status: TripStatus.DEPARTING_TODAY,
      color: 'info',
      bgColor: '#dbeafe',
      textColor: '#1e40af'
    };
  }

  if (isSameDay(returnDay, today)) {
    return {
      status: TripStatus.RETURNING_TODAY,
      color: 'info', 
      bgColor: '#dbeafe',
      textColor: '#1e40af'
    };
  }

  if (today < departure) {
    return {
      status: TripStatus.UPCOMING,
      color: 'success',
      bgColor: '#d1fae5',
      textColor: '#065f46'
    };
  }

  if (today > returnDay) {
    return {
      status: TripStatus.COMPLETED,
      color: 'default',
      bgColor: '#f3f4f6',
      textColor: '#374151'
    };
  }

  // Current date is between departure and return
  return {
    status: TripStatus.IN_PROGRESS,
    color: 'warning',
    bgColor: '#fef3c7',
    textColor: '#92400e'
  };
}

/**
 * Get status color mapping for Material-UI components
 */
export function getStatusColor(status: TripStatus): 'success' | 'warning' | 'default' | 'info' | 'error' {
  switch (status) {
    case TripStatus.UPCOMING:
      return 'success';
    case TripStatus.IN_PROGRESS:
      return 'warning';
    case TripStatus.COMPLETED:
      return 'default';
    case TripStatus.DEPARTING_TODAY:
    case TripStatus.RETURNING_TODAY:
      return 'info';
    case TripStatus.NO_DATE:
      return 'default';
    default:
      return 'default';
  }
}

/**
 * Get appropriate icon for trip status (optional)
 */
export function getStatusIcon(status: TripStatus): string | null {
  switch (status) {
    case TripStatus.UPCOMING:
      return '✈️';
    case TripStatus.IN_PROGRESS:
      return '🌍';
    case TripStatus.COMPLETED:
      return '✅';
    case TripStatus.DEPARTING_TODAY:
      return '🛫';
    case TripStatus.RETURNING_TODAY:
      return '🛬';
    case TripStatus.NO_DATE:
      return '📅';
    default:
      return null;
  }
}

/**
 * Format status for display with optional icon
 */
export function formatTripStatus(statusResult: TripStatusResult, includeIcon: boolean = false): string {
  const icon = includeIcon ? getStatusIcon(statusResult.status) : null;
  return icon ? `${icon} ${statusResult.status}` : statusResult.status;
}