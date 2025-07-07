interface LogoProps {
  onHome?: () => void
}

export default function Logo({ onHome }: LogoProps) {
  return (
    <div className="logo" onClick={onHome} style={{ cursor: onHome ? 'pointer' : 'default' }}>
      <div className="logo-icon">P</div>
      <h1>PagePersona</h1>
    </div>
  )
}