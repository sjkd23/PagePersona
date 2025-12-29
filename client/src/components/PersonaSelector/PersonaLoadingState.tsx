import React from "react";

const PersonaLoadingState: React.FC = () => (
  <div className="loading-state">
    <div className="spinner" />
    <p>Loading personas...</p>
  </div>
);

export default PersonaLoadingState;
