import React from 'react'
import type { Persona } from '../../types/personas'

interface PersonaDropdownProps {
  personas: Persona[]
  selectedPersona: string | null
  onSelect: (persona: Persona) => void
}

const PersonaDropdown: React.FC<PersonaDropdownProps> = ({ personas, selectedPersona, onSelect }) => (
  <select 
    value={selectedPersona || ''}
    onChange={e => {
      const persona = personas.find(p => p.id === e.target.value)
      if (persona) onSelect(persona)
    }}
    aria-label="Select a persona"
    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
  >
    <option value="">Select a persona...</option>
    {personas.map(persona => (
      <option key={persona.id} value={persona.id}>
        {persona.label}
      </option>
    ))}
  </select>
)

export default PersonaDropdown
