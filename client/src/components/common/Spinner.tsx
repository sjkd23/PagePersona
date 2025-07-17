/**
 * Spinner Loading Component
 *
 * A reusable loading spinner component that provides visual feedback during
 * asynchronous operations. Supports multiple sizes and customizable loading
 * messages with consistent styling across the application.
 *
 * Features:
 * - Multiple size variants (small, medium, large)
 * - Customizable loading messages
 * - Consistent styling with application theme
 * - Accessibility support with proper ARIA attributes
 * - CSS animations for smooth loading indication
 *
 * Usage:
 * ```tsx
 * <Spinner size="large" message="Loading content..." />
 * ```
 *
 * @module Spinner
 * @version 1.0.0
 * @since 1.0.0
 */

import React from 'react';
import './Spinner.css';

/**
 * Props interface for the Spinner component
 */
interface SpinnerProps {
  /** Size variant of the spinner */
  size?: 'small' | 'medium' | 'large';
  /** Loading message to display below the spinner */
  message?: string;
  /** Additional CSS classes to apply */
  className?: string;
  /** Accessibility label for screen readers */
  'aria-label'?: string;
}

/**
 * Spinner Component
 *
 * Renders a loading spinner with customizable size and message.
 * Includes proper accessibility attributes for screen readers.
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  className = '',
  'aria-label': ariaLabel = 'Loading content',
}) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large',
  };

  return (
    <div className={`spinner-container ${className}`} role="status" aria-label={ariaLabel}>
      <div className={`spinner ${sizeClass[size]}`} />
      {message && (
        <p className="spinner-message" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
};

export default Spinner;
