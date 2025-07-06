import { useState } from 'react'

interface UrlInputProps {
  url: string
  onUrlChange: (url: string) => void
  isLoading: boolean
}

export default function UrlInput({ url, onUrlChange, isLoading }: UrlInputProps) {
  const [isValidUrl, setIsValidUrl] = useState(true)
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url')

  const validateUrl = (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setIsValidUrl(true)
      return
    }

    try {
      new URL(inputUrl)
      setIsValidUrl(true)
    } catch {
      // Check if it's just missing protocol
      try {
        new URL(`https://${inputUrl}`)
        setIsValidUrl(true)
      } catch {
        setIsValidUrl(false)
      }
    }
  }

  const handleUrlChange = (newUrl: string) => {
    onUrlChange(newUrl)
    if (inputMode === 'url') {
      validateUrl(newUrl)
    } else {
      setIsValidUrl(true) // Text mode is always valid
    }
  }

  const handleModeChange = (mode: 'url' | 'text') => {
    setInputMode(mode)
    if (mode === 'text') {
      setIsValidUrl(true)
    } else {
      validateUrl(url)
    }
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
        <button
          type="button"
          onClick={() => handleModeChange('url')}
          className={`flex-1 px-3 py-1 text-sm font-medium rounded transition-colors ${
            inputMode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          URL
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('text')}
          className={`flex-1 px-3 py-1 text-sm font-medium rounded transition-colors ${
            inputMode === 'text'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Text
        </button>
      </div>

      {/* Input Field */}
      <div>
        {inputMode === 'url' ? (
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
              !isValidUrl
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
            disabled={isLoading}
          />
        ) : (
          <textarea
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste or type your text here..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            disabled={isLoading}
          />
        )}
        
        {!isValidUrl && inputMode === 'url' && (
          <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Please enter a valid URL</span>
          </div>
        )}
      </div>
    </div>
  )
}
