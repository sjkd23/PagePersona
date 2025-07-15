import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InputModeToggle from '../InputModeToggle';

describe('InputModeToggle', () => {
  const mockOnModeChange = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders URL and Text buttons', () => {
    render(<InputModeToggle mode="url" onModeChange={mockOnModeChange} />);

    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('highlights the active mode', () => {
    render(<InputModeToggle mode="url" onModeChange={mockOnModeChange} />);

    const urlButton = screen.getByText('URL');
    const textButton = screen.getByText('Text');

    expect(urlButton).toHaveClass('mode-button-active');
    expect(textButton).toHaveClass('mode-button-inactive');
  });

  it('calls onModeChange when switching modes', () => {
    render(<InputModeToggle mode="url" onModeChange={mockOnModeChange} />);

    const textButton = screen.getByText('Text');
    fireEvent.click(textButton);

    expect(mockOnModeChange).toHaveBeenCalledWith('text');
  });

  it('disables buttons when disabled prop is true', () => {
    render(<InputModeToggle mode="url" onModeChange={mockOnModeChange} disabled={true} />);

    const urlButton = screen.getByText('URL');
    const textButton = screen.getByText('Text');

    expect(urlButton).toBeDisabled();
    expect(textButton).toBeDisabled();
  });
});
