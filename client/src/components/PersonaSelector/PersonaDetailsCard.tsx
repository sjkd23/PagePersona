/**
 * Persona details card component
 *
 * This component renders a detailed card view of a persona with avatar,
 * description, and example text. It supports selection states and click
 * interactions with proper accessibility attributes.
 *
 * @module PersonaDetailsCard
 */

import React from 'react';
import type { ClientPersona as Persona } from '../../../../shared/types/personas';

/**
 * Props for the PersonaDetailsCard component
 *
 * @interface PersonaDetailsCardProps
 * @property {Persona} persona - The persona data to display
 * @property {boolean} [selected] - Whether this persona is currently selected
 * @property {function} [onClick] - Click handler for persona selection
 */
interface PersonaDetailsCardProps {
  persona: Persona;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * PersonaDetailsCard component that displays persona information in a card format
 *
 * Renders persona avatar, name, description, and example texts with interactive
 * selection state. Includes accessibility features and visual feedback for
 * user interactions.
 *
 * @param {PersonaDetailsCardProps} props - Component props
 * @returns {JSX.Element} The rendered persona details card
 */
const PersonaDetailsCard: React.FC<PersonaDetailsCardProps> = ({ persona, selected, onClick }) => (
  <div
    className={`persona-card${selected ? ' selected' : ''} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    onClick={onClick}
    tabIndex={0}
    role="button"
    aria-pressed={selected}
  >
    <img src={persona.avatarUrl} alt={persona.label} className="persona-avatar" />
    <div className="persona-name">{persona.label}</div>
    <div className="persona-description">{persona.description}</div>
    {persona.exampleTexts && (
      <div className="persona-example">&ldquo;{persona.exampleTexts}&rdquo;</div>
    )}
    {selected && (
      <div className="selected-indicator">
        <span className="checkmark">✓</span> Selected
      </div>
    )}
  </div>
);

export default PersonaDetailsCard;
