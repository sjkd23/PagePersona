import { forwardRef } from 'react'

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
