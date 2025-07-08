interface FooterProps {
  className?: string;
}

export default function Footer({ className = '' }: FooterProps) {
  const footerClasses = 'mt-8 bg-[#8da3b8] border-t border-white/10';
  const containerClasses = 'max-w-6xl mx-auto p-8';
  const contentClasses = 'flex justify-between items-center flex-col md:flex-row gap-4 md:gap-0 text-center md:text-left';
  const textClasses = 'm-0 text-sm font-medium text-[#2c3e50]';
  const linkClasses = 'text-sm font-medium text-[#2c3e50] no-underline hover:underline hover:text-[#34495e] transition-colors duration-200';

  return (
    <footer className={`${footerClasses} ${className}`}>
      <div className={containerClasses}>
        <div className={contentClasses}>
          <>
            <p className={textClasses}>PagePersona | Created by Dylan Stauch</p>
            <div className="flex gap-8 md:gap-8 gap-4">
              <a href="#privacy" className={linkClasses}>Privacy</a>
              <a href="#terms" className={linkClasses}>Terms</a>
              <a href="#about" className={linkClasses}>About</a>
            </div>
          </>
        </div>
      </div>
    </footer>
  );
}
