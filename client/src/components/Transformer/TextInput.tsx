/**
 * Reusable text input component with error state support
 * 
 * This component provides a styled text input with error state handling,
 * forwarded refs for form integration, and consistent styling patterns.
 * Designed for use in forms and input interfaces throughout the application.
 * 
 * @module TextInput
 */

import { forwardRef } from 'react'

/**
 * Props for the TextInput component
 * 
 * @interface TextInputProps
 * @property {string} value - Current input value
 * @property {function} onChange - Handler for value changes
 * @property {string} [placeholder] - Placeholder text for the input
 * @property {boolean} [disabled=false] - Whether the input is disabled
 * @property {boolean} [hasError=false] - Whether to show error styling
 * @property {string} [className] - Additional CSS classes
 * @property {boolean} [autoFocus=false] - Whether to auto-focus on mount
 * @property {string} [data-testid] - Test identifier for testing frameworks
 */
interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  className?: string
  autoFocus?: boolean
  'data-testid'?: string
}

/**
 * TextInput component with ref forwarding and error state support
 * 
 * Renders a styled text input field with optional error styling, disabled
 * state, and auto-focus capability. Uses forwardRef for integration with
 * form libraries and parent component control.
 */
const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  hasError = false,
  className = '',
  autoFocus = false,
  'data-testid': testId,
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      data-testid={testId || 'text-input'}
      className={`text-input ${hasError ? 'text-input-error' : ''} ${className}`}
      {...props}
    />
  )
})

TextInput.displayName = 'TextInput'

export default TextInput
