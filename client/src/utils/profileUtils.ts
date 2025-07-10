/**
 * Profile Utility Functions
 * 
 * Collection of utility functions for handling user profile data formatting,
 * validation, and display. Provides consistent handling of optional profile
 * fields with appropriate fallbacks and formatting for user interface display.
 * 
 * Features:
 * - Profile field formatting with fallback values
 * - Name validation and concatenation utilities
 * - Null/undefined safe string processing
 * - Consistent empty state handling
 */

/**
 * Format profile field with fallback for empty values
 * 
 * Safely formats profile field values by trimming whitespace and
 * providing consistent fallback text for empty or invalid values.
 * 
 * @param value - Profile field value to format
 * @returns Formatted string or fallback text
 */
export const formatProfileField = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return 'Not provided';
  }
  return value.trim();
};

/**
 * Validate presence of user name fields
 * 
 * Checks if user has provided either first name or last name
 * for profile completeness validation.
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns True if any name field is present and valid
 */
export const hasValidName = (firstName?: string, lastName?: string): boolean => {
  return !!(
    (firstName && firstName.trim() !== '') || 
    (lastName && lastName.trim() !== '')
  );
};

/**
 * Format complete user name from separate fields
 * 
 * Combines first and last name fields into a properly formatted
 * full name string with appropriate spacing and fallback handling.
 * 
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns Formatted full name string
 */
export const formatFullName = (firstName?: string, lastName?: string): string => {
  const first = firstName && firstName.trim() !== '' ? firstName.trim() : '';
  const last = lastName && lastName.trim() !== '' ? lastName.trim() : '';
  
  if (first && last) {
    return `${first} ${last}`;
  } else if (first) {
    return first;
  } else if (last) {
    return last;
  }
  
  return '';
};
