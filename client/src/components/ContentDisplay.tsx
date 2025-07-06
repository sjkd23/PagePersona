import type { Persona, WebpageContent } from '../types/personas'
import './ContentDisplay.css'

interface ContentDisplayProps {
  content: WebpageContent | null
  isLoading: boolean
  selectedPersona: Persona | null
}

export default function ContentDisplay({ content, isLoading, selectedPersona }: ContentDisplayProps) {
  if (isLoading) {
    return (
      <div className="text-center py-6">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-3"></div>
        <div className="space-y-1 text-gray-600 text-sm">
          <p>🔍 Fetching content...</p>
          <p>✨ Applying {selectedPersona?.name} persona...</p>
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
    <div className="space-y-4">
      {/* Persona Info */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
          <span className="text-sm font-bold text-gray-600">{content.persona.name.charAt(0)}</span>
        </div>
        <div>
          <div className="font-medium text-gray-900 text-sm">{content.persona.name}</div>
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
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          Copy text
        </button>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          Save
        </button>
      </div>
    </div>
  )
}
