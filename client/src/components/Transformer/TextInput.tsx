import { forwardRef } from 'react'

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
