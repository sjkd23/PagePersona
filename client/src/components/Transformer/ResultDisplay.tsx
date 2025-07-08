import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { WebpageContent } from '../../types/personas'

interface ResultDisplayProps {
  content: WebpageContent | null
  isLoading: boolean
  onCopyToClipboard: () => Promise<void>
  copySuccess: boolean
}

export default function ResultDisplay({ 
  content, 
  isLoading, 
  onCopyToClipboard, 
  copySuccess 
}: ResultDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const markdownComponents = {
    p: ({...props}) => <p style={{ margin: '0 0 12px 0' }} {...props} />,
    strong: ({...props}) => <strong style={{ fontWeight: '600' }} {...props} />,
    em: ({...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
    h1: ({...props}) => <h1 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 14px 0', color: '#1f2937' }} {...props} />,
    h2: ({...props}) => <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: '#1f2937' }} {...props} />,
    h3: ({...props}) => <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 10px 0', color: '#1f2937' }} {...props} />,
    ul: ({...props}) => <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }} {...props} />,
    ol: ({...props}) => <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px' }} {...props} />,
    li: ({...props}) => <li style={{ margin: '0 0 4px 0' }} {...props} />,
    blockquote: ({...props}) => <blockquote style={{ margin: '0 0 12px 0', paddingLeft: '16px', borderLeft: '3px solid #d1d5db', fontStyle: 'italic' }} {...props} />,
    code: ({...props}) => <code style={{ backgroundColor: '#e5e7eb', padding: '2px 4px', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace' }} {...props} />
  }

  const transformedMarkdownComponents = {
    ...markdownComponents,
    h1: ({...props}) => <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 16px 0', color: '#1f2937' }} {...props} />,
    h2: ({...props}) => <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 14px 0', color: '#1f2937' }} {...props} />,
    h3: ({...props}) => <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: '#1f2937' }} {...props} />,
    code: ({...props}) => <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace' }} {...props} />
  }

  const modalMarkdownComponents = {
    p: ({...props}) => <p style={{ margin: '0 0 16px 0' }} {...props} />,
    strong: ({...props}) => <strong style={{ fontWeight: '600' }} {...props} />,
    em: ({...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
    h1: ({...props}) => <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 20px 0', color: '#1f2937' }} {...props} />,
    h2: ({...props}) => <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 18px 0', color: '#1f2937' }} {...props} />,
    h3: ({...props}) => <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0', color: '#1f2937' }} {...props} />,
    ul: ({...props}) => <ul style={{ margin: '0 0 16px 0', paddingLeft: '24px' }} {...props} />,
    ol: ({...props}) => <ol style={{ margin: '0 0 16px 0', paddingLeft: '24px' }} {...props} />,
    li: ({...props}) => <li style={{ margin: '0 0 6px 0' }} {...props} />,
    blockquote: ({...props}) => <blockquote style={{ margin: '0 0 16px 0', paddingLeft: '20px', borderLeft: '4px solid #d1d5db', fontStyle: 'italic', backgroundColor: '#f9fafb', padding: '16px 20px', borderRadius: '6px' }} {...props} />,
    code: ({...props}) => <code style={{ backgroundColor: '#f3f4f6', padding: '3px 6px', borderRadius: '4px', fontSize: '14px', fontFamily: 'monospace' }} {...props} />
  }

  return (
    <div className="left-column">
      {/* Original Text Card */}
      {content && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Original Text</h2>
            {content.originalUrl !== 'Direct Text Input' && (
              <p className="source-info">
                Source: {content.originalTitle}
              </p>
            )}
          </div>
          <div className="card-content">
            <div className="content-display">
              <div className="content-text">
                <ReactMarkdown components={markdownComponents}>
                  {content.originalContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transformed Results Card */}
      <div className="card">
        <div className="card-header-with-action">
          <h2 className="card-title">Read your new site/text!</h2>
          {content && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="fullscreen-button"
            >
              Full Screen
            </button>
          )}
        </div>
        <div className="card-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Transforming content...</p>
            </div>
          ) : content ? (
            <div>
              <div className="persona-result-header">
                <div className="persona-result-avatar">
                  <span className="persona-avatar-initial">
                    {content.persona.label.charAt(0)}
                  </span>
                </div>
                <div className="persona-result-info">
                  <h3>{content.persona.label}</h3>
                  <p>Avatar</p>
                </div>
              </div>

              <div className="content-display">
                <div className="content-text">
                  <ReactMarkdown components={transformedMarkdownComponents}>
                    {content.transformedContent}
                  </ReactMarkdown>
                </div>
              </div>
              
              {/* Copy to Clipboard Button */}
              <div className="copy-tooltip">
                <button
                  onClick={onCopyToClipboard}
                  className="action-button copy-button"
                >
                  <svg className="action-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                  Copy to Clipboard
                </button>
                
                {/* Success Tooltip */}
                {copySuccess && (
                  <div className="copy-success-tooltip">
                    Copied to clipboard!
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state-text">
                Select a persona and enter a URL to see the magic happen!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && content && (
        <div 
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
            }
          }}
        >
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-avatar">
                  <span className="persona-avatar-initial">
                    {content.persona.label.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="modal-title">
                    {content.persona.label} Transformation
                  </h2>
                  <p className="modal-subtitle">
                    {content.originalUrl !== 'Direct Text Input' ? `Source: ${content.originalTitle}` : 'Text Input'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
              >
                <svg className="modal-close-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="modal-content">
              <div className="modal-text-container">
                <ReactMarkdown components={modalMarkdownComponents}>
                  {content.transformedContent}
                </ReactMarkdown>
                
                {/* Copy to Clipboard Button for Modal */}
                <div className="modal-copy-container">
                  <button
                    onClick={onCopyToClipboard}
                    className="modal-copy-button"
                  >
                    <svg className="modal-copy-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy to Clipboard
                  </button>
                  
                  {/* Success Tooltip for Modal */}
                  {copySuccess && (
                    <div className="modal-copy-tooltip">
                      Copied to clipboard!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-footer-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
