/**
 * Character count display component with status indication
 * 
 * This component displays current character count against a maximum limit
 * with visual status indicators for normal, warning, and error states.
 * Provides formatted number display for better readability.
 * 
 * @module CharacterCount
 */

/**
 * Props for the CharacterCount component
 * 
 * @interface CharacterCountProps
 * @property {number} current - Current character count
 * @property {number} max - Maximum allowed character count
 * @property {boolean} [hasError=false] - Whether to show error styling
 * @property {string} [className] - Additional CSS classes
 */
interface CharacterCountProps {
  current: number
  max: number
  hasError?: boolean
  className?: string
}

/**
 * CharacterCount component that displays character usage with visual feedback
 * 
 * Shows current character count against maximum limit with color-coded
 * status indication. Provides warning state when nearing limit and error
 * state when limit is exceeded.
 * 
 * @param {CharacterCountProps} props - Component props
 * @returns {JSX.Element} The rendered character count display
 */
export default function CharacterCount({ 
  current, 
  max, 
  hasError = false,
  className = ''
}: CharacterCountProps) {
  const percentage = (current / max) * 100
  const isWarning = percentage > 90 && !hasError
  
  return (
    <div className={`character-count ${
      hasError ? 'character-count-error' : 
      isWarning ? 'character-count-warning' : 
      'character-count-normal'
    } ${className}`}>
      {current.toLocaleString()} / {max.toLocaleString()} characters
    </div>
  )
}
