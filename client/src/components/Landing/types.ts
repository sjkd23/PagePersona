export interface CTAProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
  userName?: string;
}

export interface LandingPageProps extends CTAProps {
  isAuthenticated?: boolean;
}

export interface StepData {
  stepNumber: number;
  title: string;
  subtitle?: string;
  description?: string;
}
