interface CharacterCountProps {
  current: number
  max: number
  hasError?: boolean
  className?: string
}

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
