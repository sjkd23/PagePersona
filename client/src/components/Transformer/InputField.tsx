/**
 * Unified input field component for both URL and text modes
 *
 * This component provides a flexible input interface that switches between
 * URL input and text area input modes, with integrated validation error
 * display and character counting for text mode.
 *
 * @module InputField
 */

import InputModeToggle from "./InputModeToggle";
import ValidationError from "./ValidationError";
import TextInput from "./TextInput";
import TextArea from "./TextArea";
import CharacterCount from "./CharacterCount";
import "./styles/InputField.css";

/**
 * Props for the InputField component
 *
 * @interface InputFieldProps
 * @property {'url' | 'text'} mode - Current input mode
 * @property {string} value - Current input value
 * @property {function} onModeChange - Handler for mode toggle
 * @property {function} onChange - Handler for value changes
 * @property {string | null} [urlError] - Validation error for URL mode
 * @property {string | null} [textError] - Validation error for text mode
 * @property {number} [maxLength=10000] - Maximum character length for text mode
 * @property {boolean} [disabled=false] - Whether the input is disabled
 * @property {string} [className] - Additional CSS classes
 * @property {string} [data-testid] - Test identifier for testing frameworks
 */
interface InputFieldProps {
  mode: "url" | "text";
  value: string;
  onModeChange: (mode: "url" | "text") => void;
  onChange: (value: string) => void;
  urlError?: string | null;
  textError?: string | null;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

/**
 * InputField component that adapts between URL and text input modes
 *
 * Renders appropriate input controls based on the current mode and manages
 * validation state display. Provides a consistent interface for both input
 * types with proper error handling and accessibility features.
 *
 * @param {InputFieldProps} props - Component props
 * @returns {JSX.Element} The rendered input field component
 */
export default function InputField({
  mode,
  value,
  onModeChange,
  onChange,
  urlError,
  textError,
  maxLength = 10000,
  disabled = false,
  className = "",
  "data-testid": testId = "input-field",
}: InputFieldProps) {
  const currentError = mode === "url" ? urlError || null : textError || null;
  const hasError = Boolean(currentError);

  return (
    <div className={`input-field-container ${className}`} data-testid={testId}>
      <InputModeToggle
        mode={mode}
        onModeChange={onModeChange}
        disabled={disabled}
      />

      <div className="input-wrapper">
        {mode === "url" ? (
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
  );
}
