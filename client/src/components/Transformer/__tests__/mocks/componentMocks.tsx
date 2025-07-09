import { vi } from 'vitest';

// Mock the imports used in TransformerForm
vi.mock('../InputModeToggle', () => ({
  default: ({ mode, onModeChange, disabled }: any) => (
    <div className="mode-toggle" data-testid="mode-toggle">
      <button
        onClick={() => onModeChange('url')}
        className={mode === 'url' ? 'active' : ''}
        disabled={disabled}
        data-testid="url-mode-button"
      >
        URL
      </button>
      <button
        onClick={() => onModeChange('text')}
        className={mode === 'text' ? 'active' : ''}
        disabled={disabled}
        data-testid="text-mode-button"
      >
        Text
      </button>
    </div>
  ),
}));

vi.mock('../ValidationError', () => ({
  default: ({ error }: any) => error ? <div data-testid="error">{error}</div> : null,
}));

vi.mock('../TextInput', () => ({
  default: ({ value, onChange, placeholder, disabled, hasError, 'data-testid': testId }: any) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={testId || "text-input"}
      className={hasError ? 'text-input-error' : ''}
    />
  ),
}));

vi.mock('../TextArea', () => ({
  default: ({ value, onChange, placeholder, disabled, maxLength, hasError, 'data-testid': testId }: any) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      data-testid={testId || "text-area"}
      className={hasError ? 'text-area-error' : ''}
    />
  ),
}));

vi.mock('../CharacterCount', () => ({
  default: ({ current, max, hasError }: any) => (
    <div 
      data-testid="character-count"
      className={hasError ? 'character-count-error' : ''}
    >
      {current} / {max} characters
    </div>
  ),
}));

// Also mock InputField for consistency
vi.mock('../InputField', () => ({
  default: ({ 
    mode, 
    value, 
    onModeChange, 
    onChange, 
    urlError, 
    textError, 
    maxLength, 
    disabled,
    'data-testid': testId 
  }: any) => {
    const currentError = mode === 'url' ? urlError : textError;
    
    return (
      <div data-testid={testId || "input-field"}>
        <button onClick={() => onModeChange('url')} disabled={disabled}>URL</button>
        <button onClick={() => onModeChange('text')} disabled={disabled}>Text</button>
        
        {mode === 'url' ? (
          <input 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            data-testid="url-input"
          />
        ) : (
          <>
            <textarea 
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              maxLength={maxLength}
              data-testid="text-input"
            />
            <div data-testid="character-count">{value.length} / {maxLength} characters</div>
          </>
        )}
        
        {currentError && <div data-testid="error">{currentError}</div>}
      </div>
    );
  },
}));
