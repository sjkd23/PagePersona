/**
 * Reusable text area component with error state and length limiting
 * 
 * This component provides a styled text area with error state handling,
 * configurable rows, maximum length constraints, and forwarded refs for
 * form integration. Designed for multi-line text input scenarios.
 * 
 * @module TextArea
 */

import { forwardRef } from 'react'

/**
 * Props for the TextArea component
 * 
 * @interface TextAreaProps
 * @property {string} value - Current textarea value
 * @property {function} onChange - Handler for value changes
 * @property {string} [placeholder] - Placeholder text for the textarea
 * @property {boolean} [disabled=false] - Whether the textarea is disabled
 * @property {boolean} [hasError=false] - Whether to show error styling
 * @property {number} [rows=3] - Number of visible text rows
 * @property {number} [maxLength] - Maximum character length
 * @property {string} [className] - Additional CSS classes
 * @property {string} [data-testid] - Test identifier for testing frameworks
 */
interface TextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  rows?: number
  maxLength?: number
  className?: string
  'data-testid'?: string
}

/**
 * TextArea component with ref forwarding and constraint support
 * 
 * Renders a styled textarea element with optional error styling, character
 * limits, configurable row count, and disabled state. Uses forwardRef for
 * integration with form libraries and parent component control.
 */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  hasError = false,
  rows = 3,
  maxLength,
  className = '',
  'data-testid': testId,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      maxLength={maxLength}
      data-testid={testId || 'text-area'}
      className={`text-area ${hasError ? 'text-area-error' : ''} ${className}`}
      {...props}
    />
  )
})

TextArea.displayName = 'TextArea'

export default TextArea
