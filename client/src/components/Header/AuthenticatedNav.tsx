interface AuthenticatedNavProps {
  onHome?: () => void
  onProfile?: () => void
  onLogout?: () => void
  userName?: string
}

export default function AuthenticatedNav({ 
  onHome, 
  onProfile, 
  onLogout, 
  userName 
}: AuthenticatedNavProps) {
  return (
    <nav className="nav-buttons">
      <button 
        className="nav-btn secondary" 
        onClick={onHome}
      >
        Home
      </button>
      <button 
        className="nav-btn secondary" 
        onClick={onProfile}
      >
        Profile
      </button>
      <span className="welcome-text">Welcome, {userName}!</span>
      <button 
        className="nav-btn primary" 
        onClick={onLogout}
      >
        Log Out
      </button>
    </nav>
  )
}