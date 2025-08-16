// Date Formatter Utilities for DD-MON-YYYY Format
// For use in React components

export interface DateFormatterUtils {
  formatDate: (date: Date) => string;
  parseDate: (dateString: string) => Date | null;
  validateDateFormat: (dateString: string) => boolean;
  isValidDate: (dateString: string) => boolean;
  formatInputValue: (value: string) => string;
}

export class ReactDateFormatter implements DateFormatterUtils {
  private monthNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];
  
  private monthNumbers = {
    'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
    'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
  };

  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = this.monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    const formatRegex = /^(\d{2})-([A-Z]{3})-(\d{4})$/;
    const match = dateString.match(formatRegex);
    
    if (!match) return null;
    
    const [, day, month, year] = match;
    
    if (!this.monthNumbers.hasOwnProperty(month)) return null;
    
    const date = new Date(parseInt(year), this.monthNumbers[month as keyof typeof this.monthNumbers], parseInt(day));
    
    // Check if date is valid
    if (date.getDate() !== parseInt(day) ||
        date.getMonth() !== this.monthNumbers[month as keyof typeof this.monthNumbers] ||
        date.getFullYear() !== parseInt(year)) {
      return null;
    }
    
    return date;
  }

  validateDateFormat(dateString: string): boolean {
    if (!dateString) return true; // Empty is valid (optional field)
    
    // Check format: DD-MON-YYYY
    const formatRegex = /^(\d{2})-([A-Z]{3})-(\d{4})$/;
    const match = dateString.match(formatRegex);
    
    if (!match) return false;
    
    const [, day, month, year] = match;
    
    // Validate month
    if (!this.monthNumbers.hasOwnProperty(month)) return false;
    
    // Create date object and validate
    const dateObj = new Date(parseInt(year), this.monthNumbers[month as keyof typeof this.monthNumbers], parseInt(day));
    
    return dateObj.getDate() === parseInt(day) &&
           dateObj.getMonth() === this.monthNumbers[month as keyof typeof this.monthNumbers] &&
           dateObj.getFullYear() === parseInt(year);
  }

  isValidDate(dateString: string): boolean {
    if (!this.validateDateFormat(dateString)) return false;
    
    const date = this.parseDate(dateString);
    if (!date) return false;
    
    // Check if date is not in the past (for trip dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today;
  }

  formatInputValue(value: string): string {
    // Remove any non-alphanumeric characters and convert to uppercase
    let cleanValue = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
    
    // Format as user types
    let formatted = '';
    
    // Day (2 digits)
    if (cleanValue.length >= 1) {
      formatted += cleanValue.substring(0, 2);
    }
    
    // First hyphen + Month (3 letters)
    if (cleanValue.length >= 3) {
      formatted += '-' + cleanValue.substring(2, 5);
    }
    
    // Second hyphen + Year (4 digits)
    if (cleanValue.length >= 6) {
      formatted += '-' + cleanValue.substring(5, 9);
    }
    
    return formatted;
  }

  // Convert standard date input (YYYY-MM-DD) to DD-MON-YYYY
  convertFromStandardDate(standardDate: string): string {
    if (!standardDate) return '';
    
    const date = new Date(standardDate);
    if (isNaN(date.getTime())) return '';
    
    return this.formatDate(date);
  }

  // Convert DD-MON-YYYY to standard date input format (YYYY-MM-DD)
  convertToStandardDate(customDate: string): string {
    const date = this.parseDate(customDate);
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Get today's date in DD-MON-YYYY format
  getTodayFormatted(): string {
    return this.formatDate(new Date());
  }

  // Get validation error message
  getValidationError(dateString: string): string | null {
    if (!dateString) return null;
    
    if (!this.validateDateFormat(dateString)) {
      return 'Please enter date in DD-MON-YYYY format (e.g., 15-JAN-2024)';
    }
    
    const date = this.parseDate(dateString);
    if (!date) {
      return 'Invalid date. Please check day, month, and year.';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return 'Flight date cannot be in the past';
    }
    
    return null;
  }
}

// Export singleton instance
export const dateFormatter = new ReactDateFormatter();

// Helper function for React components
export const useDateFormatter = () => {
  return dateFormatter;
};

// Format helper functions
export const formatDateForDisplay = (date: Date | string): string => {
  if (typeof date === 'string') {
    const parsedDate = dateFormatter.parseDate(date);
    return parsedDate ? dateFormatter.formatDate(parsedDate) : date;
  }
  return dateFormatter.formatDate(date);
};

export const validateTripDate = (dateString: string): { isValid: boolean; error?: string } => {
  const error = dateFormatter.getValidationError(dateString);
  return {
    isValid: error === null,
    error: error || undefined
  };
};