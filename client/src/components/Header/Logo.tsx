interface LogoProps {
  onHome?: () => void
}

export default function Logo({ onHome }: LogoProps) {
  return (
    <div className={`logo ${onHome ? 'cursor-pointer' : 'cursor-default'}`} onClick={onHome}>
      <div className="logo-icon">
        <img src="/images/PagePersonAI_logo.png" alt="PagePersonAI Logo" />
      </div>
      <h1>PagePersona</h1>
    </div>
  )
}