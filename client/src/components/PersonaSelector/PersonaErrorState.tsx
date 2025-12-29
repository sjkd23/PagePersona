import React from "react";

interface PersonaErrorStateProps {
  error: string;
  onRetry: () => void;
}

const PersonaErrorState: React.FC<PersonaErrorStateProps> = ({
  error,
  onRetry,
}) => (
  <div className="error-state">
    <div className="error-message">{error}</div>
    <button onClick={onRetry}>Try Again</button>
  </div>
);

export default PersonaErrorState;
