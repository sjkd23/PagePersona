import React from 'react'
import type { Persona } from '../../types/personas'

interface PersonaDetailsProps {
  persona: Persona
}

const PersonaDetails: React.FC<PersonaDetailsProps> = ({ persona }) => (
  <div className="bg-gray-50 rounded-md p-3 text-sm">
    <div className="flex items-start space-x-2">
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200 flex-shrink-0">
        <img src={persona.avatarUrl} alt={persona.label} className="w-full h-full rounded-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 mb-1">{persona.label}</div>
        <div className="text-gray-600 text-xs leading-relaxed">{persona.description}</div>
        {persona.exampleTexts && (
          <div className="text-gray-500 text-xs mt-1 italic">"{persona.exampleTexts}"</div>
        )}
      </div>
    </div>
  </div>
)

export default PersonaDetails
