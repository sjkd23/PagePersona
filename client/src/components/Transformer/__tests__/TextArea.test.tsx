import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TextArea from '../TextArea';

describe('TextArea', () => {
  it('should render with provided value', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="test content" onChange={mockOnChange} />);
    
    const textarea = screen.getByDisplayValue('test content');
    expect(textarea).toBeInTheDocument();
  });

  it('should call onChange when user types', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new content' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('new content');
  });

  it('should display placeholder when provided', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} placeholder="Enter your message" />);
    
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} disabled={true} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('should not be disabled by default', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toBeDisabled();
  });

  it('should apply error styling when hasError is true', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} hasError={true} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('text-area-error');
  });

  it('should not apply error styling when hasError is false', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} hasError={false} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toHaveClass('text-area-error');
  });

  it('should set correct number of rows', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} rows={5} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('should default to 3 rows when not specified', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '3');
  });

  it('should set maxLength when provided', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} maxLength={100} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '100');
  });

  it('should not have maxLength attribute when not provided', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).not.toHaveAttribute('maxLength');
  });

  it('should apply custom className when provided', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} className="custom-class" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
    expect(textarea).toHaveClass('text-area');
  });

  it('should render with data-testid when provided', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} data-testid="custom-textarea" />);
    
    expect(screen.getByTestId('custom-textarea')).toBeInTheDocument();
  });

  it('should handle multiline content', () => {
    const mockOnChange = vi.fn();
    const multilineContent = 'Line 1\nLine 2\nLine 3';
    render(<TextArea value={multilineContent} onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(multilineContent);
  });

  it('should handle empty value', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('');
  });

  it('should handle multiple rapid changes', () => {
    const mockOnChange = vi.fn();
    render(<TextArea value="" onChange={mockOnChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'First line' } });
    fireEvent.change(textarea, { target: { value: 'First line\nSecond line' } });
    fireEvent.change(textarea, { target: { value: 'First line\nSecond line\nThird line' } });
    
    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'First line');
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'First line\nSecond line');
    expect(mockOnChange).toHaveBeenNthCalledWith(3, 'First line\nSecond line\nThird line');
  });
});
