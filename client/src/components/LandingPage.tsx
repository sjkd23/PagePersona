import './LandingPage.css';

interface LandingPageProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

export default function LandingPage({ onShowLogin, onShowSignup, isAuthenticated = false, userName }: LandingPageProps) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="logo-section">
              <div className="logo-icon">
                <span>P</span>
              </div>
              <h1 className="brand-title">PagePersona AI</h1>
            </div>
            <h2 className="hero-headline">
              {isAuthenticated ? `Welcome back, ${userName}!` : 'Transform Any Website Content with AI-Powered Personas'}
            </h2>
            <p className="hero-description">
              {isAuthenticated 
                ? 'Ready to transform more content? Choose from our AI personas to give your web content a unique voice and personality.'
                : 'Give your web content a unique voice and personality. Our AI transforms plain text into engaging, persona-driven content that resonates with your audience - whether you need professional, casual, technical, or creative tones.'
              }
            </p>
            <div className="cta-buttons">
              {isAuthenticated ? (
                <button onClick={onShowLogin} className="btn-primary">
                  Start Transforming
                </button>
              ) : (
                <>
                  <button onClick={onShowSignup} className="btn-primary">
                    Get Started Free
                  </button>
                  <button onClick={onShowLogin} className="btn-secondary">
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="hero-visual">
            <div className="demo-card">
              <div className="demo-header">
                <div className="demo-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="demo-title">AI Transformation</span>
              </div>
              <div className="demo-content">
                <div className="demo-before">
                  <span className="demo-label">Before:</span>
                  <p>"Our product increases efficiency by 40%"</p>
                </div>
                <div className="demo-arrow">→</div>
                <div className="demo-after">
                  <span className="demo-label">After (Professional):</span>
                  <p>"Our innovative solution delivers a remarkable 40% enhancement in operational efficiency, empowering organizations to achieve superior performance metrics."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">How PagePersona AI Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">URL</div>
              <h3>1. Input Your URL</h3>
              <p>Simply paste any website URL or enter your text content directly</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">AI</div>
              <h3>2. Choose a Persona</h3>
              <p>Select from professional, casual, technical, creative, or custom personas</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">OUT</div>
              <h3>3. Get Transformed Content</h3>
              <p>Receive AI-powered content that matches your chosen personality and tone</p>
            </div>
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="personas-section">
        <div className="container">
          <h2 className="section-title">Available Personas</h2>
          <div className="personas-grid">
            <div className="persona-card">
              <div className="persona-icon">PRO</div>
              <h3>Professional</h3>
              <p>Formal, authoritative tone perfect for business communications and corporate content</p>
            </div>
            <div className="persona-card">
              <div className="persona-icon">FUN</div>
              <h3>Casual & Friendly</h3>
              <p>Warm, approachable language that connects with audiences on a personal level</p>
            </div>
            <div className="persona-card">
              <div className="persona-icon">TECH</div>
              <h3>Technical Expert</h3>
              <p>Precise, detailed explanations ideal for documentation and technical content</p>
            </div>
            <div className="persona-card">
              <div className="persona-icon">ART</div>
              <h3>Creative</h3>
              <p>Imaginative, engaging style that brings creativity and flair to your content</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>{isAuthenticated ? 'Ready to Continue?' : 'Ready to Transform Your Content?'}</h2>
            <p>{isAuthenticated ? 'Start transforming your content with our AI-powered personas' : 'Join thousands of content creators, marketers, and businesses using PagePersona AI'}</p>
            <div className="cta-buttons">
              {isAuthenticated ? (
                <button onClick={onShowLogin} className="btn-primary">
                  Go to Transformer
                </button>
              ) : (
                <>
                  <button onClick={onShowSignup} className="btn-primary">
                    Start Your Free Trial
                  </button>
                  <button onClick={onShowLogin} className="btn-secondary">
                    Already have an account? Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="logo-icon">
                <span>P</span>
              </div>
              <span>PagePersona AI</span>
            </div>
            <p>&copy; 2025 PagePersona AI. Transform your content with personality.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
