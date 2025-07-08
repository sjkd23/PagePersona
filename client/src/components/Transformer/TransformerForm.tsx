import type { Persona } from '../../types/personas'

interface TransformerFormProps {
  selectedPersona: Persona | null
  personas: Persona[]
  url: string
  inputMode: 'url' | 'text'
  isLoading: boolean
  loadingPersonas: boolean
  urlError: string | null
  textError: string | null
  maxTextLength: number
  onPersonaSelect: (persona: Persona | null) => void
  onInputChange: (value: string) => void
  onModeChange: (mode: 'url' | 'text') => void
  onTransform: () => Promise<void>
  isValidInput: () => boolean
}

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
  isValidInput
}: TransformerFormProps) {
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
                  const persona = personas.find(p => p.id === e.target.value)
                  onPersonaSelect(persona || null)
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
                      <span className="persona-avatar-initial">
                        {selectedPersona.label.charAt(0)}
                      </span>
                    </div>
                    <div className="persona-details">
                      <h3 className="persona-name">
                        {selectedPersona.label}
                      </h3>
                      <p className="persona-description">
                        {selectedPersona.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="persona-metadata">
                    <div>
                      <h4 className="metadata-title">
                        Recommended Genres
                      </h4>
                      <div className="metadata-section">
                        <p className="metadata-content">Best for:</p>
                        <p className="metadata-text">
                          Content that fits with this persona's style and tone
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="metadata-title">
                        Example Texts
                      </h4>
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
          <div className="mode-toggle">
            <div className="mode-buttons">
              <button
                onClick={() => onModeChange('url')}
                className={`mode-button ${inputMode === 'url' ? 'mode-button-active' : 'mode-button-inactive'}`}
              >
                URL
              </button>
              <button
                onClick={() => onModeChange('text')}
                className={`mode-button ${inputMode === 'text' ? 'mode-button-active' : 'mode-button-inactive'}`}
              >
                Text
              </button>
            </div>
          </div>

          {inputMode === 'url' ? (
            <div>
              <input
                type="text"
                value={url}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Enter the URL..."
                disabled={isLoading}
                className={`input-field ${urlError ? 'input-url-error' : 'input-url'}`}
              />
              {urlError && (
                <div className="input-error">
                  <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{urlError}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={url}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Paste your text here..."
                disabled={isLoading}
                rows={4}
                maxLength={maxTextLength}
                className={`input-field ${textError ? 'input-textarea-error' : 'input-textarea'}`}
              />
              <div className="character-count-container">
                <div className={`character-count ${textError ? 'character-count-error' : (url.length > maxTextLength * 0.9 ? 'character-count-warning' : 'character-count-normal')}`}>
                  {url.length} / {maxTextLength} characters
                </div>
                {textError && (
                  <div className="input-error">
                    <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{textError}</span>
                  </div>
                )}
              </div>
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
            className={`generate-button ${(isLoading || !selectedPersona || !url.trim() || !isValidInput()) ? 'generate-button-disabled' : 'generate-button-active'}`}
          >
            {isLoading ? (
              <>
                <div className="generate-spinner"></div>
                <span>Generating...</span>
              </>
            ) : (
              !selectedPersona || !url.trim() ? 'Select persona and enter URL first' : 'Generate'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
