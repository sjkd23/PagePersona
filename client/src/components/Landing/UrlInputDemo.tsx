interface UrlInputDemoProps {
  placeholder?: string;
  className?: string;
  showCursor?: boolean;
}

export default function UrlInputDemo({ 
  placeholder = "https://example.com", 
  className = '',
  showCursor = true 
}: UrlInputDemoProps) {
  return (
    <div className={`visual-item ${className}`}>
      <div className="url-input-demo">
        <input type="text" placeholder={placeholder} disabled />
        {showCursor && <div className="cursor-icon">🖱️</div>}
      </div>
    </div>
  );
}
