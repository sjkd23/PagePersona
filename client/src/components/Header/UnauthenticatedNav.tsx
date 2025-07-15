import { useState } from 'react';

interface UnauthenticatedNavProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onNavigation?: (path: string) => void;
  onTransform?: () => void;
}

export default function UnauthenticatedNav({
  onLogin,
  onSignup,
  onNavigation,
  onTransform,
}: UnauthenticatedNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (callback?: () => void) => {
    if (callback) callback();
    setIsMenuOpen(false); // Close menu after clicking an item
  };

  const handleNavClick = (path: string) => {
    if (onNavigation) {
      onNavigation(path);
    } else {
      // Placeholder for future navigation
      alert(`${path} page coming soon!`);
    }
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      handleNavClick('login');
    }
  };

  const handleSignup = () => {
    if (onSignup) {
      onSignup();
    } else {
      handleNavClick('signup');
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="nav-buttons desktop-nav">
        <button className="nav-btn secondary" onClick={handleLogin}>
          Log In
        </button>
        <button className="nav-btn secondary" onClick={handleSignup}>
          Sign Up
        </button>
        <button className="nav-btn primary" onClick={() => handleNavClick('contact')}>
          Contact
        </button>
      </nav>

      {/* Mobile Hamburger Menu */}
      <div className="mobile-nav">
        <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle navigation menu">
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        {isMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
            <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
              <button
                className="mobile-nav-btn transform"
                onClick={() => handleMenuItemClick(onTransform)}
              >
                Transform
              </button>
              <button className="mobile-nav-btn" onClick={() => handleMenuItemClick(handleLogin)}>
                Log In
              </button>
              <button className="mobile-nav-btn" onClick={() => handleMenuItemClick(handleSignup)}>
                Sign Up
              </button>
              <button
                className="mobile-nav-btn primary"
                onClick={() => handleMenuItemClick(() => handleNavClick('contact'))}
              >
                Contact
              </button>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
