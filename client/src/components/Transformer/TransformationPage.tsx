import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import TransformationHistory from './TransformationHistory'
import ResultDisplay from './ResultDisplay'
import { useTransformation } from '../../hooks/useTransformation'
import './styles/TransformationPage.css'

export default function TransformationPage() {
  const [copySuccess, setCopySuccess] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const {
    state,
    actions,
    history,
    removeFromHistory,
    clearHistory,
    MAX_TEXT_LENGTH
  } = useTransformation()

  const copyToClipboard = async () => {
    if (!state.content?.transformedContent) return

    try {
      await navigator.clipboard.writeText(state.content.transformedContent)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = state.content.transformedContent
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleHistoryRestore = (item: import('../../types/personas').WebpageContent) => {
    actions.handleRestoreTransformation(item)
    setIsHistoryOpen(false)
  }

  const markdownComponents = {
    p: ({...props}) => <p className="dark:text-slate-200 markdown-p" {...props} />,
    strong: ({...props}) => <strong className="dark:text-slate-100 markdown-strong" {...props} />,
    em: ({...props}) => <em className="dark:text-slate-200 markdown-em" {...props} />,
    h1: ({...props}) => <h1 className="dark:text-slate-100 markdown-h1" {...props} />,
    h2: ({...props}) => <h2 className="dark:text-slate-100 markdown-h2" {...props} />,
    h3: ({...props}) => <h3 className="dark:text-slate-100 markdown-h3" {...props} />,
    ul: ({...props}) => <ul className="dark:text-slate-200 markdown-ul" {...props} />,
    ol: ({...props}) => <ol className="dark:text-slate-200 markdown-ol" {...props} />,
    li: ({...props}) => <li className="dark:text-slate-200 markdown-li" {...props} />,
    blockquote: ({...props}) => <blockquote className="dark:text-slate-200 dark:border-slate-600 markdown-blockquote" {...props} />,
    code: ({...props}) => <code className="dark:bg-slate-700 dark:text-slate-200 markdown-code" {...props} />
  }

  return (
    <div className="transformation-page">
      {/* Compact Header */}
      <div className="transformation-header">
        <div className="header-container">
          <div className="progress-steps">
            <div className={`progress-step ${!state.selectedPersona ? 'step-active' : 'step-complete'}`}>
              <span className="progress-number">1</span>
              <span className="progress-text">Choose persona</span>
            </div>
            <div className="progress-separator">•</div>
            <div className={`progress-step ${state.selectedPersona && !state.url ? 'step-active' : (state.selectedPersona && state.url ? 'step-complete' : 'step-pending')}`}>
              <span className="progress-number">2</span>
              <span className="progress-text">Enter content</span>
            </div>
            <div className="progress-separator">•</div>
            <div className={`progress-step ${state.selectedPersona && state.url && !state.content ? 'step-active' : (state.content ? 'step-complete' : 'step-pending')}`}>
              <span className="progress-number">3</span>
              <span className="progress-text">Generate</span>
            </div>
            <div className="progress-separator">•</div>
            <div className={`progress-step ${state.content ? 'step-result' : 'step-pending'}`}>
              <span className="progress-number">4</span>
              <span className="progress-text">View result</span>
            </div>
          </div>
          
          {/* History Button in Header */}
          <button
            onClick={() => setIsHistoryOpen(prev => !prev)}
            className="history-button-header"
            title={isHistoryOpen ? 'Close History' : 'Open History'}
          >
            <svg className="history-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="history-text">History</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Row: Steps 1 and 2 */}
        <div className="top-row">
          {/* Step 1: Persona Selection */}
          <div className={`step-card ${
            !state.selectedPersona ? 'active' : 
            state.selectedPersona && (!state.url.trim() || !actions.isValidInput()) ? 'completed' : 
            'completed'
          }`}>
            <div className="card">
              <div className="card-header">
                <div className="step-header">
                  <span className={`step-number ${state.selectedPersona ? 'completed' : 'active'}`}>1</span>
                  <h2 className="card-title">Choose your persona</h2>
                </div>
              </div>
              <div className="card-content">
                {state.loadingPersonas ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Loading personas...</p>
                  </div>
                ) : (
                  <div>
                    <div className="custom-dropdown" ref={dropdownRef}>
                      <button
                        className={`dropdown-trigger ${state.selectedPersona ? 'has-selection' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      >
                        <div className="dropdown-display">
                          {state.selectedPersona ? (
                            <div className="selected-persona">
                              <div className="persona-avatar-small">
                                <img 
                                  src={state.selectedPersona.avatarUrl} 
                                  alt={state.selectedPersona.label}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                              <span className="persona-name-small">{state.selectedPersona.label}</span>
                            </div>
                          ) : (
                            <span className="placeholder-text">Select a persona...</span>
                          )}
                        </div>
                        <svg className={`dropdown-arrow ${isDropdownOpen ? 'arrow-up' : 'arrow-down'}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {isDropdownOpen && (
                        <div className="dropdown-menu">
                          {state.personas.map((persona) => (
                            <button
                              key={persona.id}
                              className={`dropdown-item ${state.selectedPersona?.id === persona.id ? 'selected' : ''}`}
                              onClick={() => {
                                actions.setSelectedPersona(persona)
                                setIsDropdownOpen(false)
                              }}
                            >
                              <div className="persona-avatar-small">
                                <img 
                                  src={persona.avatarUrl} 
                                  alt={persona.label}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              </div>
                              <div className="persona-info-small">
                                <span className="persona-name-small">{persona.label}</span>
                                <span className="persona-desc-small">{persona.description}</span>
                              </div>
                              {state.selectedPersona?.id === persona.id && (
                                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {state.selectedPersona && (
                      <div className="persona-preview">
                        <div className="persona-info">
                          <div className="persona-avatar">
                            <img 
                              src={state.selectedPersona.avatarUrl} 
                              alt={state.selectedPersona.label}
                              className="w-full h-full rounded-full object-cover"
                            />
                          </div>
                          <div className="persona-details">
                            <h3 className="persona-name">
                              {state.selectedPersona.label}
                            </h3>
                            <p className="persona-description">
                              {state.selectedPersona.description}
                            </p>
                          </div>
                        </div>
                        
                        <div className="persona-metadata">
                          <div>
                            <h4 className="metadata-title">
                              Example Style
                            </h4>
                            <div className="metadata-section">
                              {Array.isArray(state.selectedPersona.exampleTexts) ? (
                                <ul className="metadata-example-list">
                                  {state.selectedPersona.exampleTexts.map((text, idx) => (
                                    <li key={idx} className="metadata-example">{text}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="metadata-example">
                                  {state.selectedPersona.exampleTexts}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: URL/Text Input */}
          <div className={`step-card ${
            !state.selectedPersona ? 'pending' :
            state.selectedPersona && (!state.url.trim() || !actions.isValidInput()) ? 'active' :
            state.selectedPersona && state.url.trim() && actions.isValidInput() && !state.hasClickedGenerate ? 'completed' :
            'completed'
          }`}>
            <div className="card">
              <div className="card-header">
                <div className="step-header">
                  <span className={`step-number ${
                    !state.selectedPersona ? 'pending' :
                    state.selectedPersona && state.url.trim() && actions.isValidInput() ? 'completed' : 'active'
                  }`}>2</span>
                  <h2 className="card-title">Enter URL or text</h2>
                </div>
              </div>
              <div className="card-content">
                <div className="mode-toggle">
                  <div className="mode-buttons">
                    <button
                      onClick={() => actions.handleModeChange('url')}
                      className={`mode-button ${state.inputMode === 'url' ? 'mode-button-active' : 'mode-button-inactive'}`}
                    >
                      URL
                    </button>
                    <button
                      onClick={() => actions.handleModeChange('text')}
                      className={`mode-button ${state.inputMode === 'text' ? 'mode-button-active' : 'mode-button-inactive'}`}
                    >
                      Text
                    </button>
                  </div>
                </div>

                {state.inputMode === 'url' ? (
                  <div>
                    <input
                      type="text"
                      value={state.url}
                      onChange={(e) => actions.handleInputChange(e.target.value)}
                      placeholder="Enter the URL..."
                      disabled={state.isLoading}
                      className={`input-field ${state.urlError ? 'input-url-error' : 'input-url'}`}
                    />
                    {state.urlError && (
                      <div className="input-error">
                        <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{state.urlError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={state.url}
                      onChange={(e) => actions.handleInputChange(e.target.value)}
                      placeholder="Paste your text here..."
                      disabled={state.isLoading}
                      rows={4}
                      maxLength={MAX_TEXT_LENGTH}
                      className={`input-field ${state.textError ? 'input-textarea-error' : 'input-textarea'}`}
                    />
                    <div className="character-count-container">
                      <div className={`character-count ${state.textError ? 'character-count-error' : (state.url.length > MAX_TEXT_LENGTH * 0.9 ? 'character-count-warning' : 'character-count-normal')}`}>
                        {state.url.length} / {MAX_TEXT_LENGTH} characters
                      </div>
                      {state.textError && (
                        <div className="input-error">
                          <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{state.textError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Generate Button */}
        <div className={`generate-section ${
          state.selectedPersona && state.url.trim() && actions.isValidInput() && !state.hasClickedGenerate ? 'active' : ''
        }`}>
          {/* Step Number */}
          <div className="step-header generate-step-header">
            <span className={`step-number ${
              !state.selectedPersona || !state.url.trim() || !actions.isValidInput() ? 'pending' :
              state.hasClickedGenerate ? 'completed' : 'active'
            }`}>3</span>
            <h2 className="card-title">Generate your text</h2>
          </div>
          
          {/* Error Message */}
          {state.error && (
            <div className="error-message-compact">
              <svg className="error-icon-small" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="error-text-small">{state.error}</p>
              <button
                onClick={() => actions.setError(null)}
                className="error-close-small"
                title="Dismiss error"
              >
                ×
              </button>
            </div>
          )}
          
          <button
            onClick={actions.handleTransform}
            disabled={state.isLoading || !state.selectedPersona || !state.url.trim() || !actions.isValidInput()}
            className={`generate-button-floating generate-button-orange ${(state.isLoading || !state.selectedPersona || !state.url.trim() || !actions.isValidInput()) ? 'generate-button-disabled' : 'generate-button-active'}`}
          >
            {state.isLoading ? (
              <>
                <div className="generate-spinner"></div>
                <span>Generating...</span>
              </>
            ) : (
              !state.selectedPersona || !state.url.trim() ? 'Complete steps 1 & 2 first' : 'Generate'
            )}
          </button>
        </div>

        {/* Results Row: Original Text and Transformed Text - Only show after generate button is clicked */}
        {state.hasClickedGenerate && (
          <div className="results-row">
            {/* Original Text */}
            <div className="result-card">
              {state.content ? (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Original Text</h2>
                    {state.content.originalUrl !== 'Direct Text Input' && (
                      <p className="source-info">
                        Source: {state.content.originalTitle}
                      </p>
                    )}
                  </div>
                  <div className="card-content">
                    <div className="content-display">
                      <div className="content-text-box">
                        <ReactMarkdown components={markdownComponents}>
                          {state.content.originalContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Original Text</h2>
                  </div>
                  <div className="card-content">
                    <div className="empty-state">
                      <p className="empty-state-text">
                        Your original content will appear here after generation
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transformed Results */}
            <div className="result-card">
              <ResultDisplay
                content={state.content}
                isLoading={state.isLoading}
                onCopyToClipboard={copyToClipboard}
                copySuccess={copySuccess}
              />
            </div>
          </div>
        )}
      </div>

      {/* TransformationHistory sidebar */}
      <TransformationHistory
        history={history}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(prev => !prev)}
        onRestoreTransformation={handleHistoryRestore}
        onRemoveItem={removeFromHistory}
        onClearHistory={clearHistory}
      />
    </div>
  )
}
