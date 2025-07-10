/**
 * Persona Selector Component
 * 
 * Interactive persona selection interface allowing users to browse and
 * select from available AI transformation personas. Handles persona
 * loading, error states, and selection management with detailed persona
 * information display and responsive dropdown interface.
 * 
 * Features:
 * - Dynamic persona loading from API
 * - Dropdown selection interface with search
 * - Detailed persona information display
 * - Loading and error state handling
 * - Responsive design for mobile and desktop
 */

import './PersonaSelector.css'
import { useState, useEffect } from 'react'
import type { ClientPersona as Persona } from '../../../../shared/types/personas'
import ApiService from '../../lib/apiClient'
import PersonaDropdown from './PersonaDropdown'
import PersonaDetails from './PersonaDetails'
import PersonaLoadingState from './PersonaLoadingState'
import PersonaErrorState from './PersonaErrorState'
import ErrorDisplay from '../Transformer/ErrorDisplay'
import { ErrorMapper, type UserFriendlyError } from '../../../../shared/types/errors'

/**
 * Persona selector component props interface
 */
interface PersonaSelectorProps {
  selectedPersona: string | null
  onPersonaSelect: (persona: Persona) => void
}

/**
 * Persona Selector Component
 * 
 * Manages persona selection workflow including data fetching, user
 * interaction, and selection state management with comprehensive
 * error handling and loading states.
 */
const PersonaSelector = ({ selectedPersona, onPersonaSelect }: PersonaSelectorProps) => {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enhancedError, setEnhancedError] = useState<UserFriendlyError | null>(null)

  /**
   * Fetch available personas from API
   * 
   * Loads complete persona data including UI configuration and
   * transformation parameters from the backend API endpoint.
   */
  const fetchPersonas = async () => {
    try {
      setLoading(true)
      setError(null)
      setEnhancedError(null)
      const response = await ApiService.getPersonas()
      if (response.success && response.data) {
        // Backend returns complete ClientPersona objects with UI fields
        const frontendPersonas: Persona[] = response.data.personas
        setPersonas(frontendPersonas)
      } else {
        const mappedError = ErrorMapper.mapError(new Error(response.error || 'Failed to load personas'))
        setEnhancedError(mappedError)
        setError(response.error || 'Failed to load personas')
      }
    } catch (err) {
      console.error('Error loading personas:', err)
      const mappedError = ErrorMapper.mapError(err)
      setEnhancedError(mappedError)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersonas()
  }, [])

  const selectedPersonaData = personas.find(p => p.id === selectedPersona)

  // Render loading state during persona data fetch
  if (loading) {
    return <PersonaLoadingState />
  }

  // Render error state if persona loading fails
  if (enhancedError || error) {
    return enhancedError ? (
      <ErrorDisplay
        error={enhancedError.message}
        errorCode={enhancedError.code}
        title={enhancedError.title}
        helpText={enhancedError.helpText}
        actionText={enhancedError.actionText || 'Try Again'}
        onAction={fetchPersonas}
        onDismiss={() => {
          setEnhancedError(null)
          setError(null)
        }}
        compact={true}
        className="persona-error"
      />
    ) : (
      <PersonaErrorState error={error || 'Unknown error'} onRetry={fetchPersonas} />
    )
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
