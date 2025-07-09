/**
 * Client-side validation utilities for input fields
 */

export interface ValidationResult {
  isValid: boolean
  error: string | null
}

/**
 * Validate URL input
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
 * Validate text input
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
 * Validate input based on mode
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
 * Format URL by adding https if needed
 */
export function formatUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  
  return trimmed
}
