interface AuthenticatedCTAProps {
  userName?: string;
  onStartTransforming: () => void;
}

export default function AuthenticatedCTA({ onStartTransforming }: AuthenticatedCTAProps) {
  return (
    <div className="cta-authenticated">
      <div className="cta-buttons">
        <button onClick={onStartTransforming} className="btn-primary">
          Start Transforming
        </button>
      </div>
    </div>
  );
}
