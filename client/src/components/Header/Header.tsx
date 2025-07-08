import './Header.css'
import Logo from './Logo'
import AuthenticatedNav from './AuthenticatedNav'
import UnauthenticatedNav from './UnauthenticatedNav'

interface HeaderProps {
  onNavigation?: (path: string) => void
  isAuthenticated?: boolean
  onLogin?: () => void
  onSignup?: () => void
  onLogout?: () => void
  onHome?: () => void
  onProfile?: () => void
  onTransform?: () => void
  userName?: string
}

export default function Header({ 
  onNavigation, 
  isAuthenticated = false, 
  onLogin, 
  onSignup, 
  onLogout,
  onHome,
  onProfile,
  onTransform,
  userName 
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-content">
        <Logo onHome={onHome} />
        <button 
          className="nav-btn transform" 
          onClick={onTransform}
        >
          Transform
        </button>
        {isAuthenticated ? (
          <AuthenticatedNav
            onHome={onHome}
            onProfile={onProfile}
            onLogout={onLogout}
            onTransform={onTransform}
            userName={userName}
          />
        ) : (
          <UnauthenticatedNav
            onLogin={onLogin}
            onSignup={onSignup}
            onNavigation={onNavigation}
            onTransform={onTransform}
          />
        )}
      </div>
    </header>
  )
}