interface GenerateButtonDemoProps {
  buttonText?: string;
  className?: string;
  showCursor?: boolean;
}

export default function GenerateButtonDemo({ 
  buttonText = "Generate", 
  className = '',
  showCursor = true 
}: GenerateButtonDemoProps) {
  return (
    <div className={`visual-item ${className}`}>
      <button className="generate-btn" disabled>
        {buttonText}
        {showCursor && <div className="cursor-icon">🖱️</div>}
      </button>
    </div>
  );
}
