interface HowItWorksStepProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function HowItWorksStep({
  stepNumber,
  title,
  subtitle,
  className = "",
}: HowItWorksStepProps) {
  return (
    <div className={`step-item ${className}`}>
      <div className="step-number">{stepNumber}</div>
      <div className="step-content">
        <div className="step-text">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
