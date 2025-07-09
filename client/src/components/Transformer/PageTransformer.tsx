import { useState, useEffect } from 'react'
import type { Persona, WebpageContent } from '../../types/personas'
import PersonaSelector from '../PersonaSelector'
import UrlInput from '../Transformer/UrlInput'
import ContentDisplay from './ContentDisplay'
import Footer from '../Footer'
import TransformationHistory from '../Transformer/TransformationHistory'
import { useAuth } from '../../hooks/useAuthContext'
import { useTransformationHistory } from '../../hooks/useTransformationHistory'
import ApiService, { setTokenGetter } from '../../lib/apiClient'
import './styles/PageTransformer.css'

export default function PageTransformer() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState<WebpageContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const { getAccessToken } = useAuth()
  const { history, addToHistory, removeFromHistory, clearHistory } = useTransformationHistory()

  // Set up Auth0 token getter for API calls
  useEffect(() => {
    setTokenGetter(getAccessToken)
  }, [getAccessToken])

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona)
    setError(null)
  }

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    setError(null)
  }

  const handleRestoreTransformation = (historyContent: WebpageContent) => {
    setContent(historyContent)
    setSelectedPersona(historyContent.persona)
    setUrl(historyContent.originalUrl)
    setError(null)
    setIsHistoryOpen(false)
  }

  const formatUrl = (inputUrl: string) => {
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      return `https://${inputUrl}`
    }
    return inputUrl
  }

  const handleTransform = async () => {
    if (!selectedPersona) {
      setError('Please choose a persona before transforming.')
      return
    }
    if (!url.trim()) {
      setError('Please enter a URL or text to transform.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formattedUrl = formatUrl(url.trim())
      
      // Call the real backend API
      const response = await ApiService.transformWebpage({
        url: formattedUrl,
        persona: selectedPersona.id
      })

      if (response.success) {
        const transformedContent: WebpageContent = {
          originalUrl: formattedUrl,
          originalTitle: response.originalContent.title,
          originalContent: response.originalContent.content,
          transformedContent: response.transformedContent,
          persona: selectedPersona,
          timestamp: new Date()
        }

        setContent(transformedContent)
        // Add to history after successful transformation
        addToHistory(transformedContent)
      } else if ((response as any).limitExceeded) {
        // User has hit their limit
        const remaining = `${(response as any).currentUsage}/${(response as any).usageLimit}`
        setError(`Monthly limit reached (${remaining}). Please upgrade to continue.`)
      } else {
        // Show server-provided message or generic error
        const msg = (response as any).message || response.error || 'Failed to transform the webpage'
        setError(msg)
      }
      
      setIsLoading(false)

    } catch (err) {
      console.error('Transform error:', err)
      // Handle usage limit HTTP 429
      if (err instanceof Error && err.message.includes('429')) {
        setError("You've hit your monthly limit. Upgrade to continue.")
      } else {
        setError('Failed to transform the webpage. Please check your connection and try again.')
      }
      setIsLoading(false)
    }
  }

  const canTransform = selectedPersona && url.trim()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps Header */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <div></div> {/* Left spacer */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <span className="text-blue-600 font-medium">1</span>
                <span>Choose your persona</span>
                <span className="text-gray-400">•</span>
                <span className={selectedPersona ? 'text-blue-600 font-medium' : 'text-gray-400'}>2</span>
                <span className={selectedPersona ? 'text-gray-800' : 'text-gray-400'}>Enter URL or text</span>
                <span className="text-gray-400">•</span>
                <span className={canTransform ? 'text-orange-600 font-medium' : 'text-gray-400'}>3</span>
                <span className={canTransform ? 'text-gray-800' : 'text-gray-400'}>Generate</span>
                <span className="text-gray-400">•</span>
                <span className={content ? 'text-green-600 font-medium' : 'text-gray-400'}>4</span>
                <span className={content ? 'text-gray-800' : 'text-gray-400'}>View result</span>
              </div>
            </div>
            {/* History Button */}
            <button
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
              title="View Transformation History"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History ({history.length})
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3 flex items-center space-x-2">
            <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Persona */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose your persona</h2>
            <PersonaSelector
              selectedPersona={selectedPersona?.id || null}
              onPersonaSelect={handlePersonaSelect}
            />
          </div>

          {/* Right Column - Input and Output */}
          <div className="space-y-6">
            
            {/* URL Input Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter URL or text</h2>
              <UrlInput
                url={url}
                onUrlChange={handleUrlChange}
                isLoading={isLoading}
              />
            </div>

            {/* Generate Button Card */}
            {canTransform && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate</h2>
                <button
                  onClick={handleTransform}
                  disabled={isLoading || !canTransform}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate with {selectedPersona?.name}</span>
                  )}
                </button>
              </div>
            )}

            {/* Result Card */}
            {(content || isLoading) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">View result</h2>
                <ContentDisplay
                  content={content}
                  isLoading={isLoading}
                  selectedPersona={selectedPersona}
                />
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />

      {/* Transformation History Sidebar */}
      <TransformationHistory
        history={history}
        onRestoreTransformation={handleRestoreTransformation}
        onRemoveItem={removeFromHistory}
        onClearHistory={clearHistory}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />
    </div>
  )
}

// Remove old component files after modularization
