import './Header.css'

interface HeaderProps {
  onNavigation?: (path: string) => void
}

export default function Header({ onNavigation }: HeaderProps) {
  const handleNavClick = (path: string) => {
    if (onNavigation) {
      onNavigation(path)
    } else {
      // Placeholder for future navigation
      alert(`${path} page coming soon!`)
    }
  }

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>PagePersona</h1>
          <div className="logo-icon">📄</div>
        </div>
        <nav className="nav-buttons">
          <button 
            className="nav-btn secondary" 
            onClick={() => handleNavClick('login')}
          >
            Log In
          </button>
          <button 
            className="nav-btn secondary" 
            onClick={() => handleNavClick('signup')}
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
      </div>
    </header>
  )
}
