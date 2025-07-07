import './LandingPage.css';
import type { LandingPageProps } from './types';
import HowItWorksSection from './HowItWorksSection';
import CTASection from './CTASection';
import LandingFooter from './LandingFooter';

export default function LandingPage({ 
  onShowLogin, 
  onShowSignup, 
  isAuthenticated = false, 
  userName 
}: LandingPageProps) {
  return (
    <div className="landing-page">
      {/* Main Content Section */}
      <section className="main-content">
        <HowItWorksSection />
        <CTASection 
          isAuthenticated={isAuthenticated}
          userName={userName}
          onShowLogin={onShowLogin}
          onShowSignup={onShowSignup}
        />
      </section>

      <LandingFooter />
    </div>
  );
}
