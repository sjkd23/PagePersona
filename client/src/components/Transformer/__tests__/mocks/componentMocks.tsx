import { vi } from 'vitest';

// Mock the imports used in TransformerForm
vi.mock('../InputModeToggle', () => ({
  default: ({
    mode,
    onModeChange,
    disabled,
  }: {
    mode: 'url' | 'text';
    onModeChange: (mode: 'url' | 'text') => void;
    disabled: boolean;
  }) => (
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
  default: ({ error }: { error: string | null }) =>
    error ? <div data-testid="error">{error}</div> : null,
}));

vi.mock('../TextInput', () => ({
  default: ({
    value,
    onChange,
    placeholder,
    disabled,
    hasError,
    'data-testid': testId,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled: boolean;
    hasError: boolean;
    'data-testid': string;
  }) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={testId || 'text-input'}
      className={hasError ? 'text-input-error' : ''}
    />
  ),
}));

vi.mock('../TextArea', () => ({
  default: ({
    value,
    onChange,
    placeholder,
    disabled,
    maxLength,
    hasError,
    'data-testid': testId,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled: boolean;
    maxLength: number;
    hasError: boolean;
    'data-testid': string;
  }) => (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      data-testid={testId || 'text-area'}
      className={hasError ? 'text-area-error' : ''}
    />
  ),
}));

vi.mock('../CharacterCount', () => ({
  default: ({ current, max, hasError }: { current: number; max: number; hasError: boolean }) => (
    <div data-testid="character-count" className={hasError ? 'character-count-error' : ''}>
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
    'data-testid': testId,
  }: {
    mode: 'url' | 'text';
    value: string;
    onModeChange: (mode: 'url' | 'text') => void;
    onChange: (value: string) => void;
    urlError: string | null;
    textError: string | null;
    maxLength: number;
    disabled: boolean;
    'data-testid'?: string;
  }) => {
    const currentError = mode === 'url' ? urlError : textError;

    return (
      <div data-testid={testId || 'input-field'}>
        <button onClick={() => onModeChange('url')} disabled={disabled}>
          URL
        </button>
        <button onClick={() => onModeChange('text')} disabled={disabled}>
          Text
        </button>

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
            <div data-testid="character-count">
              {value.length} / {maxLength} characters
            </div>
          </>
        )}

        {currentError && <div data-testid="error">{currentError}</div>}
      </div>
    );
  },
}));
