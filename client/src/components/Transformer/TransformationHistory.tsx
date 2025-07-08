import '../Transformer/TransformationHistory.css'
import type { HistoryItem } from '../../hooks/useTransformationHistory'
import type { WebpageContent } from '../../types/personas'

interface TransformationHistoryProps {
  history: HistoryItem[]
  onRestoreTransformation: (content: WebpageContent) => void
  onRemoveItem: (id: string) => void
  onClearHistory: () => void
  isOpen: boolean
  onToggle: () => void
}

export default function TransformationHistory({
  history,
  onRestoreTransformation,
  onRemoveItem,
  onClearHistory,
  isOpen,
  onToggle
}: TransformationHistoryProps) {
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const getUrlDomain = (url: string) => {
    try {
      return new URL(url).hostname
    } catch {
      return url
    }
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={`transformation-history-sidebar${isOpen ? '' : ' closed'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div className="transformation-history-header">
            <div className="transformation-history-header-row">
              <h3 className="transformation-history-title">
                <span style={{ fontSize: '24px' }}>📜</span>
                History
              </h3>
              {history.length > 0 && (
                <button
                  className="transformation-history-clear-btn"
                  onClick={onClearHistory}
                  title="Clear all history"
                >
                  Clear All
                </button>
              )}
            </div>
            <p className="transformation-history-summary">
              {history.length} transformation{history.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* History List */}
          <div className="transformation-history-list">
            {history.length === 0 ? (
              <div className="transformation-history-empty">
                <div className="transformation-history-empty-icon">📜</div>
                <p className="transformation-history-empty-title">
                  No transformations yet
                </p>
                <p className="transformation-history-empty-desc">
                  Your transformation history will appear here as you generate content with different personas
                </p>
              </div>
            ) : (
              <div className="transformation-history-items">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="transformation-history-item"
                    onClick={() => onRestoreTransformation(item)}
                  >
                    {/* Persona Info */}
                    <div className="transformation-history-persona-row">
                      <div className="transformation-history-persona-avatar">
                        <span className="transformation-history-persona-avatar-initial">
                          {item.persona.label.charAt(0)}
                        </span>
                      </div>
                      <div className="transformation-history-persona-info">
                        <div className="transformation-history-persona-name">
                          {item.persona.label}
                        </div>
                        <div className="transformation-history-persona-date">
                          {formatDate(item.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Source Info */}
                    <div className="transformation-history-source">
                      <div className="transformation-history-source-chip">
                        <span>{item.originalUrl === 'Direct Text Input' ? '📝' : '🌐'}</span>
                        {item.originalUrl === 'Direct Text Input' ? 'Text Input' : getUrlDomain(item.originalUrl)}
                      </div>
                      {item.originalTitle && (
                        <p className="transformation-history-source-title">
                          {item.originalTitle}
                        </p>
                      )}
                    </div>

                    {/* Content Preview */}
                    <p className="transformation-history-content-preview">
                      {truncateText(item.transformedContent, 120)}
                    </p>

                    {/* Actions */}
                    <div className="transformation-history-actions">
                      <button
                        className="transformation-history-restore-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRestoreTransformation(item)
                        }}
                      >
                        <span>↩</span>
                        Restore
                      </button>
                      <button
                        className="transformation-history-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveItem(item.id)
                        }}
                        title="Remove from history"
                      >
                        <span>🗑</span>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="transformation-history-overlay"
          onClick={onToggle}
        />
      )}
    </>
  )
}

// Remove old component files after modularization
