import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { WebpageContent } from '../../../../shared/types/personas';
import './styles/ResultDisplay.css';

interface ResultDisplayProps {
  content: WebpageContent | null;
  isLoading: boolean;
  onCopyToClipboard: () => Promise<void>;
  copySuccess: boolean;
}

export default function ResultDisplay({
  content,
  isLoading,
  onCopyToClipboard,
  copySuccess,
}: ResultDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const markdownComponents = {
    p: ({ ...props }) => <p className="result-markdown-p dark:text-slate-200" {...props} />,
    strong: ({ ...props }) => (
      <strong className="result-markdown-strong dark:text-slate-100" {...props} />
    ),
    em: ({ ...props }) => <em className="result-markdown-em dark:text-slate-200" {...props} />,
    h1: ({ ...props }) => <h1 className="result-markdown-h1" {...props} />,
    h2: ({ ...props }) => <h2 className="result-markdown-h2" {...props} />,
    h3: ({ ...props }) => <h3 className="result-markdown-h3" {...props} />,
    ul: ({ ...props }) => <ul className="result-markdown-ul dark:text-slate-200" {...props} />,
    ol: ({ ...props }) => <ol className="result-markdown-ol dark:text-slate-200" {...props} />,
    li: ({ ...props }) => <li className="result-markdown-li dark:text-slate-200" {...props} />,
    blockquote: ({ ...props }) => (
      <blockquote className="result-markdown-blockquote dark:text-slate-200" {...props} />
    ),
    code: ({ ...props }) => (
      <code className="result-markdown-code dark:text-slate-200" {...props} />
    ),
  };

  const transformedMarkdownComponents = {
    ...markdownComponents,
    h1: ({ ...props }) => <h1 className="result-modal-h1" {...props} />,
    h2: ({ ...props }) => <h2 className="result-modal-h2" {...props} />,
    h3: ({ ...props }) => <h3 className="result-modal-h3" {...props} />,
    code: ({ ...props }) => <code className="result-modal-code dark:text-slate-200" {...props} />,
  };

  const modalMarkdownComponents = {
    p: ({ ...props }) => <p className="result-fullscreen-p dark:text-slate-200" {...props} />,
    strong: ({ ...props }) => (
      <strong className="result-markdown-strong dark:text-slate-100" {...props} />
    ),
    em: ({ ...props }) => <em className="result-markdown-em dark:text-slate-200" {...props} />,
    h1: ({ ...props }) => <h1 className="result-fullscreen-h1" {...props} />,
    h2: ({ ...props }) => <h2 className="result-fullscreen-h2" {...props} />,
    h3: ({ ...props }) => <h3 className="result-fullscreen-h3" {...props} />,
    ul: ({ ...props }) => <ul className="result-fullscreen-ul dark:text-slate-200" {...props} />,
    ol: ({ ...props }) => <ol className="result-fullscreen-ol dark:text-slate-200" {...props} />,
    li: ({ ...props }) => <li className="result-fullscreen-li dark:text-slate-200" {...props} />,
    blockquote: ({ ...props }) => (
      <blockquote className="result-fullscreen-blockquote dark:text-slate-200" {...props} />
    ),
    code: ({ ...props }) => (
      <code className="result-fullscreen-code dark:text-slate-200" {...props} />
    ),
  };

  return (
    <div className="card">
      <div className="card-header-with-action">
        <div className="step-header">
          <span className={`step-number completed`}>4</span>
          <h2 className="card-title">Read your new site/text!</h2>
        </div>
        {content && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="fullscreen-button"
            title="Open in fullscreen"
          >
            <svg className="fullscreen-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="fullscreen-text">Fullscreen</span>
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
                <img
                  src={content.persona.avatarUrl}
                  alt={content.persona.label}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="persona-result-info">
                <h3>{content.persona.label}</h3>
                <p>Avatar</p>
              </div>
            </div>
            <div className="content-display">
              <div className="content-text-box">
                <ReactMarkdown components={transformedMarkdownComponents}>
                  {content.transformedContent}
                </ReactMarkdown>
              </div>
            </div>{' '}
            {/* Copy to Clipboard Button */}
            <div className="copy-tooltip">
              <button
                onClick={onCopyToClipboard}
                className="copy-button-compact"
                title="Copy to clipboard"
              >
                <svg className="copy-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy
              </button>

              {/* Success Tooltip */}
              {copySuccess && <div className="copy-success-tooltip">Copied!</div>}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state-text">
              Your transformed content will appear here after generation
            </p>
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && content && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="modal-container">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-avatar">
                  <img
                    src={content.persona.avatarUrl}
                    alt={content.persona.label}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h2 className="modal-title">{content.persona.label} Transformation</h2>
                  <p className="modal-subtitle">
                    {content.originalUrl !== 'Direct Text Input'
                      ? `Source: ${content.originalTitle}`
                      : 'Text Input'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <svg className="modal-close-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
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
                  <button onClick={onCopyToClipboard} className="modal-copy-button">
                    <svg className="modal-copy-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy to Clipboard
                  </button>

                  {/* Success Tooltip for Modal */}
                  {copySuccess && <div className="modal-copy-tooltip">Copied to clipboard!</div>}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button onClick={() => setIsModalOpen(false)} className="modal-footer-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
