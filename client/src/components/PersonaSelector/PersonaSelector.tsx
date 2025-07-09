import './PersonaSelector.css'
import { useState, useEffect } from 'react'
import type { Persona } from '../../types/personas'
import ApiService from '../../lib/apiClient'
import PersonaDropdown from './PersonaDropdown'
import PersonaDetails from './PersonaDetails'
import PersonaLoadingState from './PersonaLoadingState'
import PersonaErrorState from './PersonaErrorState'

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
        // Backend now returns complete ClientPersona objects
        const frontendPersonas: Persona[] = response.data.personas
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
