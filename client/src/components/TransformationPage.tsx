import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Persona, WebpageContent } from '../types/personas'
import { useAuth } from '../hooks/useAuth0'
import ApiService, { setTokenGetter } from '../utils/api'

export default function TransformationPage() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [url, setUrl] = useState('')
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url')
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState<WebpageContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingPersonas, setLoadingPersonas] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { getAccessToken } = useAuth()

  // Set up Auth0 token getter for API calls
  useEffect(() => {
    setTokenGetter(getAccessToken)
  }, [getAccessToken])

  // Load personas
  useEffect(() => {
    const loadPersonas = async () => {
      try {
        setLoadingPersonas(true)
        setError(null)
        const response = await ApiService.getPersonas()
        
        if (response.success) {
          const frontendPersonas: Persona[] = response.personas.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            emoji: '',
            theme: getPersonaTheme(p.id)
          }))
          setPersonas(frontendPersonas)
        } else {
          setError('Failed to load personas')
        }
      } catch (err) {
        console.error('Error loading personas:', err)
        setError('Failed to connect to server')
      } finally {
        setLoadingPersonas(false)
      }
    }

    loadPersonas()
  }, [])

  const getPersonaTheme = (id: string) => {
    const themeMap: { [key: string]: any } = {
      'eli5': { primary: '#FF6B6B', secondary: '#FFE66D', accent: '#4ECDC4' },
      'anime-hero': { primary: '#FF4757', secondary: '#FF6B7A', accent: '#FFA726' },
      'medieval-knight': { primary: '#8B4513', secondary: '#DAA520', accent: '#C0C0C0' },
      'hacker': { primary: '#00FF41', secondary: '#008F11', accent: '#000000' },
      'pirate': { primary: '#8B4513', secondary: '#DAA520', accent: '#FF6347' },
      'scientist': { primary: '#9C27B0', secondary: '#E1BEE7', accent: '#4CAF50' },
      'comedian': { primary: '#FF9800', secondary: '#FFE0B2', accent: '#F44336' },
      'zen-master': { primary: '#4CAF50', secondary: '#C8E6C9', accent: '#795548' }
    }
    return themeMap[id] || { primary: '#6B73FF', secondary: '#9096FF', accent: '#FF6B6B' }
  }

  const handleTransform = async () => {
    if (!selectedPersona || !url.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      let response;
      
      if (inputMode === 'text') {
        // For text mode, use the text directly as content to transform
        response = await ApiService.transformText({
          text: url.trim(),
          persona: selectedPersona.id
        })
      } else {
        // For URL mode, fetch and transform the webpage
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`
        response = await ApiService.transformWebpage({
          url: formattedUrl,
          persona: selectedPersona.id
        })
      }

      if (response.success) {
        const transformedContent: WebpageContent = {
          originalUrl: inputMode === 'url' ? (url.startsWith('http') ? url : `https://${url}`) : 'Direct Text Input',
          originalTitle: inputMode === 'url' ? response.originalContent?.title || 'Webpage Content' : 'Text Input',
          originalContent: inputMode === 'url' ? response.originalContent?.content || '' : url.trim(),
          transformedContent: response.transformedContent,
          persona: selectedPersona,
          timestamp: new Date()
        }
        setContent(transformedContent)
      } else {
        setError(response.error || `Failed to transform the ${inputMode === 'url' ? 'webpage' : 'text'}`)
      }
    } catch (err) {
      console.error('Transform error:', err)
      setError(`Failed to transform the ${inputMode === 'url' ? 'webpage' : 'text'}. Please check your connection and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Compact Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e9ecef', padding: '12px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', fontSize: '14px', color: '#6c757d' }}>
            <span style={{ color: '#0066cc', fontWeight: '500' }}>1</span>
            <span style={{ margin: '0 8px' }}>Choose your persona</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span style={{ color: selectedPersona ? '#0066cc' : '#6c757d', fontWeight: selectedPersona ? '500' : 'normal', margin: '0 8px' }}>2</span>
            <span style={{ color: selectedPersona ? '#333' : '#6c757d' }}>Enter URL or text</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span style={{ color: selectedPersona && url ? '#ff6b35' : '#6c757d', fontWeight: selectedPersona && url ? '500' : 'normal', margin: '0 8px' }}>3</span>
            <span style={{ color: selectedPersona && url ? '#333' : '#6c757d' }}>Generate</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span style={{ color: content ? '#28a745' : '#6c757d', fontWeight: content ? '500' : 'normal', margin: '0 8px' }}>4</span>
            <span style={{ color: content ? '#333' : '#6c757d' }}>View result</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Choose your persona</h2>
              </div>
              <div style={{ padding: '24px' }}>
                {loadingPersonas ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '3px solid #f3f4f6', 
                      borderTopColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px'
                    }}></div>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Loading personas...</p>
                  </div>
                ) : (
                  <div>
                    <select 
                      value={selectedPersona?.id || ''}
                      onChange={(e) => {
                        const persona = personas.find(p => p.id === e.target.value)
                        setSelectedPersona(persona || null)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select a persona...</option>
                      {personas.map((persona) => (
                        <option key={persona.id} value={persona.id}>
                          {persona.name}
                        </option>
                      ))}
                    </select>

                    {selectedPersona && (
                      <div style={{ 
                        marginTop: '20px',
                        backgroundColor: '#f9fafb', 
                        borderRadius: '8px', 
                        padding: '16px' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            backgroundColor: 'white', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            flexShrink: 0
                          }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
                              {selectedPersona.name.charAt(0)}
                            </span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                              {selectedPersona.name}
                            </h3>
                            <p style={{ margin: '0', fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                              {selectedPersona.description}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                              Recommended Genres
                            </h4>
                            <div style={{ 
                              backgroundColor: 'white', 
                              borderRadius: '6px', 
                              padding: '12px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#9ca3af' }}>Best for:</p>
                              <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                                Content that fits with this persona's style and tone
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                              Example Texts
                            </h4>
                            <div style={{ 
                              backgroundColor: 'white', 
                              borderRadius: '6px', 
                              padding: '12px',
                              border: '1px solid #e5e7eb'
                            }}>
                              <p style={{ margin: '0', fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
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

            {/* Original Text Card */}
            {content && (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                  <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Original Text</h2>
                  {content.originalUrl !== 'Direct Text Input' && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                      Source: {content.originalTitle}
                    </p>
                  )}
                </div>
                <div style={{ padding: '24px' }}>                <div style={{ 
                  backgroundColor: '#f9fafb', 
                  borderRadius: '8px', 
                  padding: '16px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#374151', 
                    lineHeight: '1.6'
                  }}>
                    <ReactMarkdown
                      components={{
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
                      }}
                    >
                      {content.originalContent}
                    </ReactMarkdown>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* URL Input Card */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Enter URL or text</h2>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '8px', 
                    padding: '4px' 
                  }}>
                    <button
                      onClick={() => setInputMode('url')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: inputMode === 'url' ? 'white' : 'transparent',
                        color: inputMode === 'url' ? '#1f2937' : '#6b7280',
                        cursor: 'pointer',
                        boxShadow: inputMode === 'url' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      URL
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: inputMode === 'text' ? 'white' : 'transparent',
                        color: inputMode === 'text' ? '#1f2937' : '#6b7280',
                        cursor: 'pointer',
                        boxShadow: inputMode === 'text' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      Text
                    </button>
                  </div>
                </div>

                {inputMode === 'url' ? (
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter the URL..."
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                ) : (
                  <textarea
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your text here..."
                    disabled={isLoading}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Generate Button */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Generate your text</h2>
              </div>
              <div style={{ padding: '24px' }}>
                <button
                  onClick={handleTransform}
                  disabled={isLoading || !selectedPersona || !url.trim()}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: (isLoading || !selectedPersona || !url.trim()) ? '#9ca3af' : '#ff6b35',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (isLoading || !selectedPersona || !url.trim()) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid transparent', 
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    !selectedPersona || !url.trim() ? 'Select persona and enter URL first' : 'Generate'
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '12px', 
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Read converted text</h2>
                {content && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#6b7280',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Full Screen
                  </button>
                )}
              </div>
              <div style={{ padding: '24px' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '3px solid #f3f4f6', 
                      borderTopColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 12px'
                    }}></div>
                    <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>Transforming content...</p>
                  </div>
                ) : content ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
                          {content.persona.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '500', color: '#1f2937' }}>
                          {content.persona.name}
                        </h3>
                        <p style={{ margin: '0', fontSize: '13px', color: '#6b7280' }}>Avatar</p>
                      </div>
                    </div>

                    <div style={{ 
                      backgroundColor: '#f9fafb', 
                      borderRadius: '8px', 
                      padding: '16px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#374151', 
                        lineHeight: '1.6'
                      }}>
                        <ReactMarkdown
                          components={{
                            p: ({...props}) => <p style={{ margin: '0 0 12px 0' }} {...props} />,
                            strong: ({...props}) => <strong style={{ fontWeight: '600' }} {...props} />,
                            em: ({...props}) => <em style={{ fontStyle: 'italic' }} {...props} />,
                            h1: ({...props}) => <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 16px 0', color: '#1f2937' }} {...props} />,
                            h2: ({...props}) => <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 14px 0', color: '#1f2937' }} {...props} />,
                            h3: ({...props}) => <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0', color: '#1f2937' }} {...props} />,
                            ul: ({...props}) => <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px' }} {...props} />,
                            ol: ({...props}) => <ol style={{ margin: '0 0 12px 0', paddingLeft: '20px' }} {...props} />,
                            li: ({...props}) => <li style={{ margin: '0 0 4px 0' }} {...props} />,
                            blockquote: ({...props}) => <blockquote style={{ margin: '0 0 12px 0', paddingLeft: '16px', borderLeft: '3px solid #d1d5db', fontStyle: 'italic' }} {...props} />,
                            code: ({...props}) => <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px', fontSize: '13px', fontFamily: 'monospace' }} {...props} />
                          }}
                        >
                          {content.transformedContent}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      Select a persona and enter a URL to see the magic happen!
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            marginTop: '24px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <svg style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p style={{ margin: '0', fontSize: '14px', color: '#dc2626', flex: 1 }}>{error}</p>
            <button
              onClick={() => setError(null)}
              style={{ 
                color: '#ef4444', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '0',
                flexShrink: 0
              }}
            >
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && content && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false)
            }
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '800px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '24px 32px', 
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
                    {content.persona.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
                    {content.persona.name} Transformation
                  </h2>
                  <p style={{ margin: '0', fontSize: '14px', color: '#6b7280' }}>
                    {content.originalUrl !== 'Direct Text Input' ? `Source: ${content.originalTitle}` : 'Text Input'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div 
              style={{ 
                padding: '32px',
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#fafafa'
              }}
            >
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                fontSize: '16px',
                color: '#374151',
                lineHeight: '1.7'
              }}>
                <ReactMarkdown
                  components={{
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
                  }}
                >
                  {content.transformedContent}
                </ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '20px 32px', 
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
