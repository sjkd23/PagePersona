import './Footer.css';

interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`footer ${className}`}>
      <div className="footer__container">
        <div className="footer__content">
          <p>PagePersona | Created by Dylan Stauch</p>
        </div>
      </div>
    </footer>
  );
}
