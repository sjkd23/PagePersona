interface UnauthenticatedNavProps {
  onLogin?: () => void
  onSignup?: () => void
  onNavigation?: (path: string) => void
}

export default function UnauthenticatedNav({ 
  onLogin, 
  onSignup, 
  onNavigation 
}: UnauthenticatedNavProps) {
  const handleNavClick = (path: string) => {
    if (onNavigation) {
      onNavigation(path)
    } else {
      // Placeholder for future navigation
      alert(`${path} page coming soon!`)
    }
  }

  const handleLogin = () => {
    if (onLogin) {
      onLogin()
    } else {
      handleNavClick('login')
    }
  }

  const handleSignup = () => {
    if (onSignup) {
      onSignup()
    } else {
      handleNavClick('signup')
    }
  }

  return (
    <nav className="nav-buttons">
      <button 
        className="nav-btn secondary" 
        onClick={handleLogin}
      >
        Log In
      </button>
      <button 
        className="nav-btn secondary" 
        onClick={handleSignup}
      >
        Sign Up
      </button>
      <button 
        className="nav-btn primary" 
        onClick={() => handleNavClick('contact')}
      >
        Contact
      </button>
    </nav>
  )
}