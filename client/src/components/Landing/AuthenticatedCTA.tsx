interface AuthenticatedCTAProps {
  userName?: string;
  onStartTransforming: () => void;
}

export default function AuthenticatedCTA({ userName, onStartTransforming }: AuthenticatedCTAProps) {
  return (
    <div className="cta-authenticated">
      <h2>Welcome back, {userName}!</h2>
      <p>Ready to transform more content?</p>
      <button onClick={onStartTransforming} className="btn-primary">
        Start Transforming
      </button>
    </div>
  );
}
