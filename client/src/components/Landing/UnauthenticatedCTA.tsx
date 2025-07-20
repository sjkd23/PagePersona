interface UnauthenticatedCTAProps {
  onShowSignup: () => void;
  onShowLogin: () => void;
}

export default function UnauthenticatedCTA({ onShowSignup, onShowLogin }: UnauthenticatedCTAProps) {
  return (
    <div className="cta-unauthenticated">
      <div className="cta-buttons">
        <button onClick={onShowSignup} className="btn-primary">
          Try It Free
        </button>
        <button onClick={onShowLogin} className="btn-outline">
          Log In
        </button>
      </div>
    </div>
  );
}
