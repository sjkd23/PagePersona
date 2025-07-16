import { useState } from 'react';

interface AuthenticatedNavProps {
  onHome?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  onTransform?: () => void;
  userName?: string;
}

export default function AuthenticatedNav({
  onHome,
  onProfile,
  onLogout,
  onTransform,
  userName,
}: AuthenticatedNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (callback?: () => void) => {
    if (callback) callback();
    setIsMenuOpen(false); // Close menu after clicking an item
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="nav-buttons desktop-nav">
        <button className="nav-btn secondary" onClick={onHome}>
          Home
        </button>
        <button className="nav-btn secondary" onClick={onProfile}>
          Profile
        </button>
        {/* Hide welcome text on mobile via CSS */}
        <span className="welcome-text desktop-only">Welcome, {userName}!</span>
        <button className="nav-btn primary" onClick={onLogout}>
          Log Out
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
              <div className="mobile-welcome">Welcome, {userName}!</div>
              <button className="mobile-nav-btn" onClick={() => handleMenuItemClick(onHome)}>
                Home
              </button>
              <button className="mobile-nav-btn" onClick={() => handleMenuItemClick(onProfile)}>
                Profile
              </button>
              <button
                className="mobile-nav-btn primary"
                onClick={() => handleMenuItemClick(onLogout)}
              >
                Log Out
              </button>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
