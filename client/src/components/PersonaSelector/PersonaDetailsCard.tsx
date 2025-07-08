import React from 'react'
import type { Persona } from '../../types/personas'

interface PersonaDetailsCardProps {
  persona: Persona
  selected?: boolean
  onClick?: () => void
}

const PersonaDetailsCard: React.FC<PersonaDetailsCardProps> = ({ persona, selected, onClick }) => (
  <div
    className={`persona-card${selected ? ' selected' : ''}`}
    onClick={onClick}
    tabIndex={0}
    role="button"
    aria-pressed={selected}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <img src={persona.avatarUrl} alt={persona.label} className="persona-avatar" />
    <div className="persona-name">{persona.label}</div>
    <div className="persona-description">{persona.description}</div>
    {persona.exampleTexts && (
      <div className="persona-example">"{persona.exampleTexts}"</div>
    )}
    {selected && (
      <div className="selected-indicator">
        <span className="checkmark">✔</span> Selected
      </div>
    )}
  </div>
)

export default PersonaDetailsCard
