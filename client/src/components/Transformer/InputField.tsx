import InputModeToggle from './InputModeToggle'
import ValidationError from './ValidationError'
import TextInput from './TextInput'
import TextArea from './TextArea'
import CharacterCount from './CharacterCount'
import './styles/InputField.css'

interface InputFieldProps {
  mode: 'url' | 'text'
  value: string
  onModeChange: (mode: 'url' | 'text') => void
  onChange: (value: string) => void
  urlError?: string | null
  textError?: string | null
  maxLength?: number
  disabled?: boolean
  className?: string
  'data-testid'?: string
}

export default function InputField({
  mode,
  value,
  onModeChange,
  onChange,
  urlError,
  textError,
  maxLength = 10000,
  disabled = false,
  className = '',
  'data-testid': testId = 'input-field'
}: InputFieldProps) {
  const currentError = mode === 'url' ? (urlError || null) : (textError || null)
  const hasError = Boolean(currentError)

  return (
    <div className={`input-field-container ${className}`} data-testid={testId}>
      <InputModeToggle 
        mode={mode} 
        onModeChange={onModeChange} 
        disabled={disabled}
      />
      
      <div className="input-wrapper">
        {mode === 'url' ? (
          <TextInput
            value={value}
            onChange={onChange}
            placeholder="https://example.com"
            disabled={disabled}
            hasError={hasError}
            className="url-input"
            data-testid="url-input"
          />
        ) : (
          <>
            <TextArea
              value={value}
              onChange={onChange}
              placeholder="Paste or type your text here..."
              disabled={disabled}
              hasError={hasError}
              rows={4}
              maxLength={maxLength}
              className="text-input"
              data-testid="text-input"
            />
            <div className="text-meta">
              <CharacterCount 
                current={value.length} 
                max={maxLength} 
                hasError={hasError}
              />
            </div>
          </>
        )}
        
        <ValidationError error={currentError} />
      </div>
    </div>
  )
}
