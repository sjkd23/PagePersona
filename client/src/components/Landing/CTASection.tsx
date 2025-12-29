import AuthenticatedCTA from "./AuthenticatedCTA";
import UnauthenticatedCTA from "./UnauthenticatedCTA";

interface CTASectionProps {
  isAuthenticated?: boolean;
  userName?: string;
  onShowLogin: () => void;
  onShowSignup: () => void;
}

export default function CTASection({
  isAuthenticated = false,
  userName,
  onShowLogin,
  onShowSignup,
}: CTASectionProps) {
  return (
    <div className="landing-cta">
      {isAuthenticated ? (
        <AuthenticatedCTA
          userName={userName}
          onStartTransforming={onShowLogin}
        />
      ) : (
        <UnauthenticatedCTA
          onShowSignup={onShowSignup}
          onShowLogin={onShowLogin}
        />
      )}
    </div>
  );
}
