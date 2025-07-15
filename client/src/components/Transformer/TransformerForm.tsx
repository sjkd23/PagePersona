/**
 * Main transformation form component
 *
 * This component provides the complete user interface for content transformation,
 * including persona selection, input mode toggling, content input, and the
 * transformation trigger. It manages the display of loading states, validation
 * errors, and persona preview information.
 *
 * @module TransformerForm
 */

import type { ClientPersona as Persona } from '@pagepersonai/shared';
import InputModeToggle from './InputModeToggle';
import ValidationError from './ValidationError';
import TextInput from './TextInput';
import TextArea from './TextArea';
import CharacterCount from './CharacterCount';
import './styles/TransformerForm.css';

/**
 * Props for the TransformerForm component
 *
 * @interface TransformerFormProps
 * @property {Persona | null} selectedPersona - Currently selected persona
 * @property {Persona[]} personas - Available personas list
 * @property {string} url - Current input value (used for both URL and text)
 * @property {'url' | 'text'} inputMode - Current input mode
 * @property {boolean} isLoading - Whether transformation is in progress
 * @property {boolean} loadingPersonas - Whether personas are being loaded
 * @property {string | null} urlError - Validation error for URL input
 * @property {string | null} textError - Validation error for text input
 * @property {number} maxTextLength - Maximum allowed text length
 * @property {function} onPersonaSelect - Handler for persona selection
 * @property {function} onInputChange - Handler for input value changes
 * @property {function} onModeChange - Handler for input mode changes
 * @property {function} onTransform - Handler for transformation trigger
 * @property {function} isValidInput - Function to check input validity
 */
interface TransformerFormProps {
  selectedPersona: Persona | null;
  personas: Persona[];
  url: string;
  inputMode: 'url' | 'text';
  isLoading: boolean;
  loadingPersonas: boolean;
  urlError: string | null;
  textError: string | null;
  maxTextLength: number;
  onPersonaSelect: (persona: Persona | null) => void;
  onInputChange: (value: string) => void;
  onModeChange: (mode: 'url' | 'text') => void;
  onTransform: () => Promise<void>;
  isValidInput: () => boolean;
}

/**
 * TransformerForm component that provides the complete transformation interface
 *
 * Renders a multi-section form with persona selection, input configuration,
 * and transformation controls. Manages loading states, validation display,
 * and dynamic button text based on current form state.
 *
 * @param {TransformerFormProps} props - Component props
 * @returns {JSX.Element} The rendered transformer form component
 */
export default function TransformerForm({
  selectedPersona,
  personas,
  url,
  inputMode,
  isLoading,
  loadingPersonas,
  urlError,
  textError,
  maxTextLength,
  onPersonaSelect,
  onInputChange,
  onModeChange,
  onTransform,
  isValidInput,
}: TransformerFormProps) {
  const currentError = inputMode === 'url' ? urlError : textError;
  const hasError = Boolean(currentError);

  return (
    <div className="right-column">
      {/* Persona Selection Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Choose your persona</h2>
        </div>
        <div className="card-content">
          {loadingPersonas ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading personas...</p>
            </div>
          ) : (
            <div>
              <select
                value={selectedPersona?.id || ''}
                onChange={(e) => {
                  const selected = personas.find((p) => p.id === e.target.value);
                  onPersonaSelect(selected || null);
                }}
                className="persona-select"
              >
                <option value="">Select a persona...</option>
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.label}
                  </option>
                ))}
              </select>

              {selectedPersona && (
                <div className="persona-preview">
                  <div className="persona-info">
                    <div className="persona-avatar">
                      <img
                        src={selectedPersona.avatarUrl}
                        alt={selectedPersona.label}
                        className="w-full h-full rounded-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="persona-details">
                      <h3 className="persona-name">{selectedPersona.label}</h3>
                      <p className="persona-description">{selectedPersona.description}</p>
                    </div>
                  </div>

                  <div className="persona-metadata">
                    <div>
                      <h4 className="metadata-title">Recommended Genres</h4>
                      <div className="metadata-section">
                        <p className="metadata-content">Best for:</p>
                        <p className="metadata-text">
                          Content that fits with this persona&apos;s style and tone
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="metadata-title">Example Texts</h4>
                      <div className="metadata-section">
                        <p className="metadata-example">
                          Examples of different personas/writing style used by this persona
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* URL/Text Input Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Enter URL or text</h2>
        </div>
        <div className="card-content">
          <InputModeToggle mode={inputMode} onModeChange={onModeChange} disabled={isLoading} />

          {inputMode === 'url' ? (
            <div>
              <TextInput
                value={url}
                onChange={onInputChange}
                placeholder="Enter the URL..."
                disabled={isLoading}
                hasError={hasError}
                className="url-input"
              />
              <ValidationError error={urlError} />
            </div>
          ) : (
            <div>
              <TextArea
                value={url}
                onChange={onInputChange}
                placeholder="Paste your text here..."
                disabled={isLoading}
                rows={4}
                maxLength={maxTextLength}
                hasError={hasError}
                className="text-input"
              />
              <div className="character-count-container">
                <CharacterCount current={url.length} max={maxTextLength} hasError={hasError} />
              </div>
              <ValidationError error={textError} />
            </div>
          )}
        </div>
      </div>

      {/* Generate Button */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Generate your text</h2>
        </div>
        <div className="card-content">
          <button
            onClick={onTransform}
            disabled={isLoading || !selectedPersona || !url.trim() || !isValidInput()}
            className={`generate-button ${isLoading || !selectedPersona || !url.trim() || !isValidInput() ? 'generate-button-disabled' : 'generate-button-active'}`}
          >
            {isLoading ? (
              <>
                <div className="generate-spinner"></div>
                <span>Generating...</span>
              </>
            ) : (
              (() => {
                if (!selectedPersona) return 'Select a persona first';
                if (!url.trim())
                  return inputMode === 'url' ? 'Enter a URL first' : 'Enter text first';
                if (inputMode === 'text' && textError) return '50 character minimum required';
                if (inputMode === 'url' && urlError) return 'Valid URL required';
                return 'Generate';
              })()
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
