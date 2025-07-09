import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ValidationError from '../ValidationError';

describe('ValidationError', () => {
  it('should render error message when provided', () => {
    const errorMessage = 'This field is required';
    render(<ValidationError error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toHaveClass('error-text');
  });

  it('should not render anything when error is null', () => {
    const { container } = render(<ValidationError error={null} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render anything when error is empty string', () => {
    const { container } = render(<ValidationError error="" />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should apply correct CSS classes', () => {
    const errorMessage = 'Test error';
    render(<ValidationError error={errorMessage} />);
    
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toHaveClass('error-text');
    const container = errorElement.closest('.validation-error');
    expect(container).toBeInTheDocument();
  });

  it('should handle multiline error messages', () => {
    const multilineError = 'Line 1\nLine 2\nLine 3';
    render(<ValidationError error={multilineError} />);
    
    // Just check that the text content is present in some form
    const errorSpan = screen.getByText(/Line 1/);
    expect(errorSpan).toBeInTheDocument();
    expect(errorSpan.textContent).toContain('Line 1');
    expect(errorSpan.textContent).toContain('Line 2');
    expect(errorSpan.textContent).toContain('Line 3');
  });
});
