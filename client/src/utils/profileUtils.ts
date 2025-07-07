/**
 * Utility functions for handling user profile data
 */

export const formatProfileField = (value: string | undefined | null): string => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return 'Not provided';
  }
  return value.trim();
};

export const hasValidName = (firstName?: string, lastName?: string): boolean => {
  return !!(
    (firstName && firstName.trim() !== '') || 
    (lastName && lastName.trim() !== '')
  );
};

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
