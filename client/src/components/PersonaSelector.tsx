import { useState, useEffect } from 'react'
import type { Persona } from '../types/personas'
import ApiService from '../utils/api'

interface PersonaSelectorProps {
  selectedPersona: string | null
  onPersonaSelect: (persona: Persona) => void
}

export default function PersonaSelector({ selectedPersona, onPersonaSelect }: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPersonas = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await ApiService.getPersonas()
        
        if (response.success) {
          // Convert backend persona format to frontend format
          const frontendPersonas: Persona[] = response.personas.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            emoji: getPersonaEmoji(p.id),
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
        setLoading(false)
      }
    }

    loadPersonas()
  }, [])

  // Helper function to get emoji for persona
  const getPersonaEmoji = (id: string): string => {
    const emojiMap: { [key: string]: string } = {
      'eli5': '🧒',
      'anime-hero': '⚔️',
      'medieval-knight': '🛡️',
      'hacker': '💻',
      'pirate': '🏴‍☠️',
      'scientist': '🧪',
      'comedian': '😂',
      'zen-master': '🧘'
    }
    return emojiMap[id] || '🎭'
  }

  // Helper function to get theme for persona
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

  const selectedPersonaData = personas.find(p => p.id === selectedPersona)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Persona Dropdown */}
      <div>
        <select 
          value={selectedPersona || ''}
          onChange={(e) => {
            const persona = personas.find(p => p.id === e.target.value)
            if (persona) onPersonaSelect(persona)
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">Select a persona...</option>
          {personas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Persona Details */}
      {selectedPersonaData && (
        <div className="bg-gray-50 rounded-md p-3 text-sm">
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 flex-shrink-0">
              <span className="text-lg">{selectedPersonaData.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 mb-1">{selectedPersonaData.name}</div>
              <div className="text-gray-600 text-xs leading-relaxed">{selectedPersonaData.description}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
