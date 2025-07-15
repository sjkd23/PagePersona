interface ValidationErrorProps {
  error: string | null;
  className?: string;
}

export default function ValidationError({ error, className = '' }: ValidationErrorProps) {
  if (!error) return null;

  return (
    <div className={`validation-error ${className}`}>
      <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="error-text">{error}</span>
    </div>
  );
}
