interface UnauthenticatedCTAProps {
  onShowSignup: () => void;
  onShowLogin: () => void;
}

export default function UnauthenticatedCTA({ onShowSignup, onShowLogin }: UnauthenticatedCTAProps) {
  return (
    <div className="cta-unauthenticated">
      <h2>Transform Any Website Content with AI-Powered Personas</h2>
      <p>Get started for free and give your content a unique voice and personality</p>
      
      <div className="cta-buttons">
        <button onClick={onShowSignup} className="btn-primary">
          Sign Up
        </button>
        <button onClick={onShowLogin} className="btn-primary">
          Log In
        </button>
      </div>
    </div>
  );
}
