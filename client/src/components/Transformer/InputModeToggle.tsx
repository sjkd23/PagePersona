interface InputModeToggleProps {
  mode: 'url' | 'text';
  onModeChange: (mode: 'url' | 'text') => void;
  disabled?: boolean;
  className?: string;
}

export default function InputModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className = '',
}: InputModeToggleProps) {
  return (
    <div className={`mode-toggle ${className}`}>
      <div className="mode-buttons">
        <button
          type="button"
          onClick={() => onModeChange('url')}
          disabled={disabled}
          className={`mode-button ${
            mode === 'url' ? 'mode-button-active' : 'mode-button-inactive'
          }`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => onModeChange('text')}
          disabled={disabled}
          className={`mode-button ${
            mode === 'text' ? 'mode-button-active' : 'mode-button-inactive'
          }`}
        >
          Text
        </button>
      </div>
    </div>
  );
}
