import { useState } from 'react'
import type { Persona, WebpageContent } from '../../types/personas'
import './ContentDisplay.css'

interface ContentDisplayProps {
  content: WebpageContent | null
  isLoading: boolean
  selectedPersona: Persona | null
}

export default function ContentDisplay({ content, isLoading, selectedPersona }: ContentDisplayProps) {
  const [copySuccess, setCopySuccess] = useState(false)

  const copyToClipboard = async () => {
    if (!content?.transformedContent) return

    try {
      await navigator.clipboard.writeText(content.transformedContent)
      setCopySuccess(true)
      // Hide the tooltip after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = content.transformedContent
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

  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-3"></div>
        <div className="space-y-1 text-gray-600 text-sm">
          <p>🔍 Fetching content...</p>
          <p>✨ Applying {selectedPersona?.label} persona...</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-2">📄✨</div>
        <p className="text-gray-500 text-sm">Your transformed content will appear here</p>
      </div>
    )
  }

  return (
    <div className="content-container space-y-4">
      {/* Persona Info */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
          <span className="text-sm font-bold text-gray-600">{content.persona.label.charAt(0)}</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 text-sm">{content.persona.label}</div>
          <div className="text-xs text-gray-500">Transformed content</div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 rounded-md p-3 border border-gray-200 max-h-64 overflow-y-auto">
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {content.transformedContent}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between text-xs">
        <button
          className="text-blue-600 hover:text-blue-800 font-medium relative flex items-center gap-1"
          onClick={copyToClipboard}
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          Copy text
          {copySuccess && (
            <span className="absolute left-1/2 transform -translate-x-1/2 -top-8 bg-green-800 text-white text-xs rounded-md py-1 px-2 whitespace-nowrap z-10 shadow-lg">
              Copied to clipboard!
              <span className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-green-800"></span>
            </span>
          )}
        </button>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          Save
        </button>
      </div>
    </div>
  )
}
