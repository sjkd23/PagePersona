import React from 'react';
import type { ClientPersona as Persona } from '../../../../shared/types/personas';

interface PersonaDropdownProps {
  personas: Persona[];
  selectedPersona: string | null;
  onSelect: (persona: Persona) => void;
}

const PersonaDropdown: React.FC<PersonaDropdownProps> = ({
  personas,
  selectedPersona,
  onSelect,
}) => (
  <select
    value={selectedPersona || ''}
    onChange={(e) => {
      const persona = personas.find((p) => p.id === e.target.value);
      if (persona) onSelect(persona);
    }}
    aria-label="Select a persona"
    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
  >
    <option value="">Select a persona...</option>
    {personas.map((persona) => (
      <option key={persona.id} value={persona.id}>
        {persona.label}
      </option>
    ))}
  </select>
);

export default PersonaDropdown;
