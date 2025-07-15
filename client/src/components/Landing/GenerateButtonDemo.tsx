interface GenerateButtonDemoProps {
  className?: string;
}

export default function GenerateButtonDemo({ className = '' }: GenerateButtonDemoProps) {
  return (
    <div className={`visual-item ${className}`}>
      <img
        src="/images/landing_page/Generate_img.png"
        alt="Generate button with cursor click demo"
        className="generate-button-image"
      />
    </div>
  );
}
