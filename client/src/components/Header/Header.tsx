import { useState } from 'react'
import './Header.css'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import UserMenu from './UserMenu'

interface HeaderProps {
  isAuthenticated?: boolean
  onLogin?: () => void
  onSignup?: () => void
  onHome?: () => void
  onProfile?: () => void
  onTransform?: () => void
  userName?: string
}

export default function Header({ 
  isAuthenticated = false, 
  onLogin, 
  onSignup, 
  onHome,
  onProfile,
  onTransform,
  userName 
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Left side: Logo + Theme Toggle */}
        <div className="nav-left">
          <Logo onHome={onHome} />
          <ThemeToggle />
        </div>

        {/* Center: Transform button */}
        <div className="nav-center">
          <button 
            className="nav-btn transform" 
            onClick={onTransform}
          >
            Transform
          </button>
        </div>

        {/* Right side: User menu or auth buttons */}
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
                <button
                  onClick={onLogin}
                  className="nav-btn secondary"
                >
                  Log In
                </button>
                <button
                  onClick={onSignup}
                  className="nav-btn primary"
                >
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
  )
}