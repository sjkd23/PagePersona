/**
 * Application footer component
 *
 * This component renders the main footer section of the application with
 * attribution information and consistent styling. Provides a simple
 * content container that can be extended with additional links or information.
 *
 * @module Footer
 */

import './Footer.css';

/**
 * Props for the Footer component
 *
 * @interface FooterProps
 * @property {string} [className] - Additional CSS classes for styling
 */
interface FooterProps {
  className?: string;
}

/**
 * Footer component that displays application attribution
 *
 * Renders a simple footer with consistent styling and attribution
 * information. Designed to be placed at the bottom of page layouts
 * with optional additional CSS classes for customization.
 *
 * @param {FooterProps} props - Component props
 * @returns {JSX.Element} The rendered footer component
 */
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
