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
  userName 
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-content">
        <Logo onHome={onHome} />
        {isAuthenticated ? (
          <AuthenticatedNav
            onHome={onHome}
            onProfile={onProfile}
            onLogout={onLogout}
            userName={userName}
          />
        ) : (
          <UnauthenticatedNav
            onLogin={onLogin}
            onSignup={onSignup}
            onNavigation={onNavigation}
          />
        )}
      </div>
    </header>
  )
}