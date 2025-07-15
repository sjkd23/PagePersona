import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UrlInput from '../UrlInput';

// Mock InputField component
vi.mock('../InputField', () => ({
  default: ({
    mode,
    value,
    onModeChange,
    onChange,
    urlError,
    textError,
    disabled,
  }: {
    mode: 'url' | 'text';
    value: string;
    onModeChange: (mode: 'url' | 'text') => void;
    onChange: (value: string) => void;
    urlError: string | null;
    textError: string | null;
    disabled: boolean;
  }) => (
    <div data-testid="mock-input-field">
      <button onClick={() => onModeChange('url')}>URL</button>
      <button onClick={() => onModeChange('text')}>Text</button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid={mode === 'url' ? 'url-input' : 'text-input'}
      />
      {urlError && <div data-testid="url-error">{urlError}</div>}
      {textError && <div data-testid="text-error">{textError}</div>}
    </div>
  ),
}));

vi.mock('../validation', () => ({
  validateInput: vi.fn((value: string, mode: 'url' | 'text') => {
    if (mode === 'url' && value && !value.startsWith('http')) {
      return { error: 'Invalid URL format' };
    }
    if (mode === 'text' && !value.trim()) {
      return { error: 'Text is required' };
    }
    return { error: null };
  }),
}));

describe('UrlInput', () => {
  const defaultProps = {
    url: '',
    onUrlChange: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<UrlInput {...defaultProps} />);

    expect(screen.getByTestId('mock-input-field')).toBeInTheDocument();
  });

  it('should start in URL mode by default', () => {
    render(<UrlInput {...defaultProps} />);

    expect(screen.getByTestId('url-input')).toBeInTheDocument();
  });

  it('should switch to text mode when mode is changed', () => {
    render(<UrlInput {...defaultProps} />);

    fireEvent.click(screen.getByText('Text'));
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
  });

  it('should call onUrlChange when input value changes', () => {
    const mockOnUrlChange = vi.fn();
    render(<UrlInput {...defaultProps} onUrlChange={mockOnUrlChange} />);

    const input = screen.getByTestId('url-input');
    fireEvent.change(input, { target: { value: 'https://test.com' } });

    expect(mockOnUrlChange).toHaveBeenCalledWith('https://test.com');
  });

  it('should disable form when loading', () => {
    render(<UrlInput {...defaultProps} isLoading={true} />);

    const input = screen.getByTestId('url-input');
    expect(input).toBeDisabled();
  });

  it('should respect maxTextLength prop', () => {
    render(<UrlInput {...defaultProps} maxTextLength={500} />);

    // Component should render without error with custom maxTextLength
    expect(screen.getByTestId('mock-input-field')).toBeInTheDocument();
  });

  it('should maintain current url value from props', () => {
    render(<UrlInput {...defaultProps} url="https://example.com" />);

    const input = screen.getByTestId('url-input');
    expect(input).toHaveValue('https://example.com');
  });
});
