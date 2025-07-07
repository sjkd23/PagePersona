import type { HistoryItem } from '../hooks/useTransformationHistory'
import type { WebpageContent } from '../types/personas'

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
        style={{
          position: 'fixed',
          left: '0',
          top: '0',
          height: '100vh',
          width: '320px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          boxShadow: isOpen ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 'none',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 9998,
          paddingTop: '80px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div style={{ 
            padding: '24px 20px 20px 20px', 
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                color: '#1f2937',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '24px' }}>📜</span>
                History
              </h3>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  style={{
                    fontSize: '12px',
                    color: '#dc2626',
                    fontWeight: '600',
                    background: 'none',
                    border: '1px solid #fecaca',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    backgroundColor: '#fef2f2'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2'
                    e.currentTarget.style.borderColor = '#fca5a5'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2'
                    e.currentTarget.style.borderColor = '#fecaca'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                  title="Clear all history"
                >
                  Clear All
                </button>
              )}
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              margin: '0',
              fontWeight: '500'
            }}>
              {history.length} transformation{history.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* History List */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '20px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb'
          }}>
            {history.length === 0 ? (
              <div style={{ 
                padding: '60px 20px', 
                textAlign: 'center', 
                color: '#9ca3af' 
              }}>
                <div style={{ 
                  fontSize: '64px', 
                  marginBottom: '20px',
                  opacity: '0.6'
                }}>�</div>
                <p style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#6b7280'
                }}>
                  No transformations yet
                </p>
                <p style={{ 
                  fontSize: '14px', 
                  margin: '0',
                  color: '#9ca3af',
                  lineHeight: '1.6',
                  maxWidth: '240px',
                  marginLeft: 'auto',
                  marginRight: 'auto'
                }}>
                  Your transformation history will appear here as you generate content with different personas
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid #e5e7eb',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                    onClick={() => onRestoreTransformation(item)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc'
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white'
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Persona Info */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      marginBottom: '16px' 
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)',
                        flexShrink: 0
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: 'white'
                        }}>
                          {item.persona.name.charAt(0)}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#1f2937',
                          margin: '0'
                        }}>
                          {item.persona.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          margin: '2px 0 0 0',
                          fontWeight: '500'
                        }}>
                          {formatDate(item.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Source Info */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #dbeafe',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '8px'
                      }}>
                        <span>{item.originalUrl === 'Direct Text Input' ? '📝' : '🌐'}</span>
                        {item.originalUrl === 'Direct Text Input' ? 'Text Input' : getUrlDomain(item.originalUrl)}
                      </div>
                      {item.originalTitle && (
                        <p style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          margin: '0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: '500'
                        }}>
                          {item.originalTitle}
                        </p>
                      )}
                    </div>

                    {/* Content Preview */}
                    <p style={{
                      fontSize: '13px',
                      color: '#4b5563',
                      lineHeight: '1.5',
                      margin: '0 0 16px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      backgroundColor: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {truncateText(item.transformedContent, 120)}
                    </p>

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRestoreTransformation(item)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: 'white',
                          fontWeight: '600',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <span>↩</span>
                        Restore
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveItem(item.id)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#dc2626',
                          background: 'none',
                          border: '1px solid #fecaca',
                          cursor: 'pointer',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          transition: 'all 0.2s',
                          backgroundColor: '#fef2f2'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2'
                          e.currentTarget.style.borderColor = '#fca5a5'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2'
                          e.currentTarget.style.borderColor = '#fecaca'
                          e.currentTarget.style.transform = 'scale(1)'
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
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 9997,
            backdropFilter: 'blur(4px)',
            transition: 'all 0.3s ease-in-out'
          }}
          onClick={onToggle}
        />
      )}
    </>
  )
}
