/**
 * Client-side validation utilities for input fields
 * 
 * This module provides comprehensive validation functions for various input types
 * used in the transformation interface, including URL and text validation with
 * appropriate error messaging and formatting utilities.
 * 
 * @module validation
 */

/**
 * Represents the result of a validation operation
 * 
 * @interface ValidationResult
 * @property {boolean} isValid - Whether the validation passed
 * @property {string | null} error - Error message if validation failed, null if valid
 */
export interface ValidationResult {
  isValid: boolean
  error: string | null
}

/**
 * Validates URL input with flexible formatting support
 * 
 * Accepts URLs with or without protocol prefix, automatically testing
 * with HTTPS if no protocol is provided. Performs basic domain structure
 * validation to ensure the URL is properly formatted.
 * 
 * @param {string} url - The URL string to validate
 * @returns {ValidationResult} Validation result with success status and error message
 */
export function validateUrl(url: string): ValidationResult {
  if (!url.trim()) {
    return { isValid: true, error: null }
  }

  try {
    // Try to parse as-is first
    new URL(url)
    return { isValid: true, error: null }
  } catch {
    // Try with https prefix
    try {
      new URL(`https://${url}`)
      // Additional check: make sure it has a valid domain structure
      const testUrl = new URL(`https://${url}`)
      if (!testUrl.hostname.includes('.') || testUrl.hostname.length < 3) {
        return { isValid: false, error: 'Please enter a valid URL' }
      }
      return { isValid: true, error: null }
    } catch {
      return { isValid: false, error: 'Please enter a valid URL' }
    }
  }
}

/**
 * Validates text input for length requirements
 * 
 * Ensures text meets minimum length requirements (50 characters after trimming)
 * and does not exceed the specified maximum length. Provides detailed error
 * messages with current character counts.
 * 
 * @param {string} text - The text string to validate
 * @param {number} [maxLength=10000] - Maximum allowed character length
 * @returns {ValidationResult} Validation result with success status and error message
 */
export function validateText(text: string, maxLength: number = 10000): ValidationResult {
  const trimmedText = text.trim()
  
  if (trimmedText.length < 50) {
    return {
      isValid: false,
      error: `Text must be at least 50 characters (currently ${trimmedText.length} characters)`
    }
  }

  if (text.length > maxLength) {
    return {
      isValid: false,
      error: `Text must be ${maxLength.toLocaleString()} characters or less (currently ${text.length.toLocaleString()} characters)`
    }
  }

  return { isValid: true, error: null }
}

/**
 * Validates input based on the specified mode
 * 
 * Delegates validation to the appropriate function based on input mode,
 * providing a unified interface for validating different types of content.
 * 
 * @param {string} value - The input value to validate
 * @param {'url' | 'text'} mode - The validation mode to apply
 * @param {number} [maxTextLength=10000] - Maximum text length for text mode validation
 * @returns {ValidationResult} Validation result with success status and error message
 */
export function validateInput(
  value: string, 
  mode: 'url' | 'text', 
  maxTextLength: number = 10000
): ValidationResult {
  if (mode === 'url') {
    return validateUrl(value)
  } else {
    return validateText(value, maxTextLength)
  }
}

/**
 * Formats URL by adding HTTPS protocol if needed
 * 
 * Automatically prepends 'https://' to URLs that don't already have a protocol
 * specified, ensuring proper URL formatting for API requests.
 * 
 * @param {string} url - The URL string to format
 * @returns {string} The formatted URL with protocol, or empty string if input is empty
 */
export function formatUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  
  return trimmed
}
