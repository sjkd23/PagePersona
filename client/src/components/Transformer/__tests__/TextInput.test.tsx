import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TextInput from '../TextInput';

describe('TextInput', () => {
  it('should render with provided value', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="test value" onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when user types', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new text' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('new text');
  });

  it('should display placeholder when provided', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} placeholder="Enter text here" />);
    
    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} disabled={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should not be disabled by default', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).not.toBeDisabled();
  });

  it('should apply error styling when hasError is true', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} hasError={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('text-input-error');
  });

  it('should not apply error styling when hasError is false', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} hasError={false} />);
    
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveClass('text-input-error');
  });

  it('should apply custom className when provided', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
    expect(input).toHaveClass('text-input');
  });

  it('should have autoFocus when autoFocus prop is true', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} autoFocus={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });

  it('should render with data-testid when provided', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} data-testid="custom-test-id" />);
    
    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });

  it('should have correct input type', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should handle multiple rapid changes', () => {
    const mockOnChange = vi.fn();
    render(<TextInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });
    
    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'a');
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'ab');
    expect(mockOnChange).toHaveBeenNthCalledWith(3, 'abc');
  });
});
