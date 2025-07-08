import { useState } from 'react'
import TransformationHistory from './TransformationHistory'
import TransformerForm from './TransformerForm'
import ResultDisplay from './ResultDisplay'
import { useTransformation } from '../../hooks/useTransformation'
import './TransformationPage.css'

export default function TransformationPage() {
  const [copySuccess, setCopySuccess] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

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

  const handleHistoryRestore = (item: any) => {
    actions.handleRestoreTransformation(item)
    setIsHistoryOpen(false)
  }

  return (
    <div className="transformation-page">
      {/* Compact Header */}
      <div className="transformation-header">
        <div className="header-container">
          <div className="progress-steps">
            <span className="step-active">1</span>
            <span className="step-text">Choose your persona</span>
            <span className="step-separator">•</span>
            <span className={state.selectedPersona ? "step-complete" : ""}>2</span>
            <span className={state.selectedPersona ? "step-complete" : ""}>Enter URL or text</span>
            <span className="step-separator">•</span>
            <span className={state.selectedPersona && state.url ? "step-generate" : ""}>3</span>
            <span className={state.selectedPersona && state.url ? "step-complete" : ""}>Generate</span>
            <span className="step-separator">•</span>
            <span className={state.content ? "step-result" : ""}>4</span>
            <span className={state.content ? "step-complete" : ""}>View result</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-grid">
          <ResultDisplay
            content={state.content}
            isLoading={state.isLoading}
            onCopyToClipboard={copyToClipboard}
            copySuccess={copySuccess}
          />

          <TransformerForm
            selectedPersona={state.selectedPersona}
            personas={state.personas}
            url={state.url}
            inputMode={state.inputMode}
            isLoading={state.isLoading}
            loadingPersonas={state.loadingPersonas}
            urlError={state.urlError}
            textError={state.textError}
            maxTextLength={MAX_TEXT_LENGTH}
            onPersonaSelect={actions.setSelectedPersona}
            onInputChange={actions.handleInputChange}
            onModeChange={actions.handleModeChange}
            onTransform={actions.handleTransform}
            isValidInput={actions.isValidInput}
          />
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="error-message">
            <svg className="error-icon-container" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="error-text">{state.error}</p>
            <button
              onClick={() => actions.setError(null)}
              className="error-close"
            >
              <svg className="error-close-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
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

      {/* History toggle button */}
      <button
        onClick={() => setIsHistoryOpen(prev => !prev)}
        className={`history-toggle ${isHistoryOpen ? 'history-toggle-open' : 'history-toggle-closed'}`}
        title={isHistoryOpen ? 'Close History' : 'Open History'}
      >
        <span className="history-toggle-emoji">
          {isHistoryOpen ? '←' : '📜'}
        </span>
        {!isHistoryOpen && (
          <span className="history-toggle-text">
            History
          </span>
        )}
      </button>
    </div>
  )
}
