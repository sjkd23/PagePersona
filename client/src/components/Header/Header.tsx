/**
 * Application Header Component
 *
 * Main navigation header providing application branding, navigation controls,
 * theme management, and user authentication interface. Adapts layout and
 * functionality based on authentication state with responsive design
 * for mobile and desktop experiences.
 *
 * Features:
 * - Logo and branding with home navigation
 * - Theme toggle for light/dark mode switching
 * - Authentication-aware navigation menu
 * - User profile and account management access
 * - Transform action quick access
 * - Responsive mobile menu implementation
 */

import { useState } from 'react';
import './Header.css';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

/**
 * Header component props interface
 *
 * Defines all possible navigation actions and authentication state
 * properties for flexible header configuration across different views.
 */
interface HeaderProps {
  isAuthenticated?: boolean;
  onLogin?: () => void;
  onSignup?: () => void;
  onHome?: () => void;
  onProfile?: () => void;
  onTransform?: () => void;
  userName?: string;
}

/**
 * Application Header Component
 *
 * Renders the main application navigation header with adaptive layout
 * based on authentication state and responsive design considerations.
 */
export default function Header({
  isAuthenticated = false,
  onLogin,
  onSignup,
  onHome,
  onProfile,
  onTransform,
  userName,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Left navigation section: Logo and theme controls */}
        <div className="nav-left">
          <Logo onHome={onHome} />
          <ThemeToggle />
        </div>

        {/* Center navigation section: Primary transform action */}
        <div className="nav-center">
          <button className="nav-btn transform" onClick={onTransform}>
            Transform
          </button>
        </div>

        {/* Right navigation section: User authentication and profile */}
        <div className="nav-right">
          {isAuthenticated ? (
            <>
              {/* User Menu - Always visible */}
              <UserMenu userName={userName} onProfile={onProfile} onTransform={onTransform} />
            </>
          ) : (
            <>
              {/* Unauthenticated buttons */}
              <div className="nav-buttons desktop-nav">
                <button onClick={onLogin} className="nav-btn secondary">
                  Log In
                </button>
                <button onClick={onSignup} className="nav-btn primary">
                  Sign Up
                </button>
              </div>

              {/* Mobile menu for unauthenticated users */}
              <div className="mobile-nav">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="hamburger-btn"
                  aria-label="Toggle mobile menu"
                >
                  <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                  <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                  <span className={`hamburger-line ${isMobileMenuOpen ? 'open' : ''}`}></span>
                </button>

                {isMobileMenuOpen && (
                  <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          onLogin?.();
                          setIsMobileMenuOpen(false);
                        }}
                        className="mobile-nav-btn"
                      >
                        Log In
                      </button>
                      <button
                        onClick={() => {
                          onSignup?.();
                          setIsMobileMenuOpen(false);
                        }}
                        className="mobile-nav-btn primary"
                      >
                        Sign Up
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
