// ...moved and refactored code from PersonaSelector.tsx...
import { useState, useEffect } from 'react'
import type { Persona } from '../../types/personas'
import ApiService from '../../lib/apiClient'
import PersonaDropdown from './PersonaDropdown'
import PersonaDetails from './PersonaDetails'
import PersonaLoadingState from './PersonaLoadingState'
import PersonaErrorState from './PersonaErrorState'
import { getPersonaTheme } from './personaUtils'

interface PersonaSelectorProps {
  selectedPersona: string | null
  onPersonaSelect: (persona: Persona) => void
}

const PersonaSelector = ({ selectedPersona, onPersonaSelect }: PersonaSelectorProps) => {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPersonas = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await ApiService.getPersonas()
      if (response.success && response.data) {
        interface PersonaData {
          id: string;
          label?: string;
          name?: string;
          description: string;
          exampleTexts?: string;
          avatarUrl?: string;
          theme?: {
            primary: string;
            secondary: string;
            accent: string;
          };
        }
        const frontendPersonas: Persona[] = response.data.personas.map((p: PersonaData) => ({
          id: p.id,
          label: p.label || p.name || p.id, // fallback to name or id if label doesn't exist
          name: p.label || p.name || p.id, // ensure name is present
          description: p.description,
          exampleTexts: p.exampleTexts || '',
          avatarUrl: p.avatarUrl || `/avatars/${p.id}.png`,
          theme: p.theme || getPersonaTheme(p.id)
        }))
        setPersonas(frontendPersonas)
      } else {
        setError(response.error || 'Failed to load personas')
      }
    } catch (err) {
      console.error('Error loading personas:', err)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersonas()
  }, [])

  const selectedPersonaData = personas.find(p => p.id === selectedPersona)

  if (loading) {
    return <PersonaLoadingState />
  }

  if (error) {
    return <PersonaErrorState error={error} onRetry={fetchPersonas} />
  }

  return (
    <div className="space-y-3">
      <PersonaDropdown 
        personas={personas} 
        selectedPersona={selectedPersona} 
        onSelect={onPersonaSelect} 
      />
      {selectedPersonaData && <PersonaDetails persona={selectedPersonaData} />}
    </div>
  )
}

export default PersonaSelector
