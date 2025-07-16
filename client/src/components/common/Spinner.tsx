/**
 * Spinner Component
 *
 * A simple loading spinner component used as a fallback for lazy-loaded components.
 * Provides visual feedback while chunks are loading.
 */
import React from 'react';
import './Spinner.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  className = '',
}) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large',
  };

  return (
    <div className={`spinner-container ${className}`}>
      <div className={`spinner ${sizeClass[size]}`} />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

export default Spinner;
