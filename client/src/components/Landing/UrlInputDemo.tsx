interface UrlInputDemoProps {
  className?: string;
}

export default function UrlInputDemo({ className = '' }: UrlInputDemoProps) {
  return (
    <div className={`visual-item ${className}`}>
      <img
        src="/images/URL_img.png"
        alt="URL input demo with mouse cursor"
        className="url-input-demo-image"
      />
    </div>
  );
}
