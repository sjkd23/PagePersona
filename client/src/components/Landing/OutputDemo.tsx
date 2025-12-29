interface OutputDemoProps {
  avatarSrc?: string;
  avatarAlt?: string;
  summaryText?: string;
  fullText?: string;
  className?: string;
}

export default function OutputDemo({
  avatarSrc = "/images/persona_avatars/Anime_Hacker_avatar.png",
  avatarAlt = "Anime Hacker",
  summaryText = "A brief summary of the page...",
  fullText = "The content rewritten to match the persona's style...",
  className = "",
}: OutputDemoProps) {
  return (
    <div className={`output-card ${className}`}>
      <div className="output-header">
        <div className="persona-avatar-large">
          <img src={avatarSrc} alt={avatarAlt} loading="lazy" />
        </div>
      </div>
      <div className="output-content">
        <div className="summary-section">
          <h4>Summary:</h4>
          <p>{summaryText}</p>
        </div>
        <div className="output-divider"></div>
        <div className="full-text-section">
          <h4>Full text:</h4>
          <p>{fullText}</p>
        </div>
      </div>
    </div>
  );
}
