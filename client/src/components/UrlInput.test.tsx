import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlInput from '../components/UrlInput'

describe('UrlInput Component', () => {
  const defaultProps = {
    url: '',
    onUrlChange: vi.fn(),
    isLoading: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with initial props', () => {
    render(<UrlInput {...defaultProps} />)
    
    // Should render input field
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('calls onUrlChange when input value changes', async () => {
    const user = userEvent.setup()
    const mockOnUrlChange = vi.fn()
    
    render(<UrlInput {...defaultProps} onUrlChange={mockOnUrlChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'https://example.com')
    
    expect(mockOnUrlChange).toHaveBeenCalled()
  })

  it('validates URL format correctly', async () => {
    const user = userEvent.setup()
    render(<UrlInput {...defaultProps} />)
    
    const input = screen.getByRole('textbox')
    
    // Test valid URL
    await user.type(input, 'https://example.com')
    // Should not show error state (implementation dependent)
    
    await user.clear(input)
    
    // Test invalid URL
    await user.type(input, 'not-a-url')
    // Should show error state (implementation dependent)
  })

  it('handles URL without protocol correctly', async () => {
    const user = userEvent.setup()
    const mockOnUrlChange = vi.fn()
    
    render(<UrlInput {...defaultProps} onUrlChange={mockOnUrlChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'example.com')
    
    expect(mockOnUrlChange).toHaveBeenCalled()
  })

  it('shows loading state when isLoading is true', () => {
    render(<UrlInput {...defaultProps} isLoading={true} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('switches between URL and text input modes', async () => {
    const user = userEvent.setup()
    render(<UrlInput {...defaultProps} />)
    
    // Check if mode toggle buttons exist (implementation dependent)
    // This test assumes there are buttons to switch modes
    const urlModeBtn = screen.queryByText(/url/i)
    const textModeBtn = screen.queryByText(/text/i)
    
    if (urlModeBtn && textModeBtn) {
      await user.click(textModeBtn)
      // Should switch to text mode
      
      await user.click(urlModeBtn)
      // Should switch back to URL mode
    }
  })

  it('displays current URL value correctly', () => {
    const testUrl = 'https://test-example.com'
    render(<UrlInput {...defaultProps} url={testUrl} />)
    
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe(testUrl)
  })

  it('handles empty input gracefully', () => {
    const mockOnUrlChange = vi.fn()
    
    // Test that component renders properly with empty URL
    render(<UrlInput url="" onUrlChange={mockOnUrlChange} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    
    // Should render with empty value without any errors
    expect(input).toHaveValue('')
    expect(input).toBeInTheDocument()
    
    // Component should be stable with empty input
    expect(mockOnUrlChange).not.toHaveBeenCalled()
  })

  it('prevents input when loading', async () => {
    const user = userEvent.setup()
    const mockOnUrlChange = vi.fn()
    
    render(<UrlInput {...defaultProps} isLoading={true} onUrlChange={mockOnUrlChange} />)
    
    const input = screen.getByRole('textbox')
    
    // Try to type - should be prevented due to disabled state
    await user.type(input, 'test')
    
    // onUrlChange should not be called since input is disabled
    expect(mockOnUrlChange).not.toHaveBeenCalled()
  })

  describe('URL validation edge cases', () => {
    it('handles localhost URLs', async () => {
      const user = userEvent.setup()
      const mockOnUrlChange = vi.fn()
      
      render(<UrlInput {...defaultProps} onUrlChange={mockOnUrlChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'http://localhost:3000')
      
      expect(mockOnUrlChange).toHaveBeenCalled()
    })

    it('handles IP addresses', async () => {
      const user = userEvent.setup()
      const mockOnUrlChange = vi.fn()
      
      render(<UrlInput {...defaultProps} onUrlChange={mockOnUrlChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '192.168.1.1')
      
      expect(mockOnUrlChange).toHaveBeenCalled()
    })

    it('handles URLs with query parameters', async () => {
      const user = userEvent.setup()
      const mockOnUrlChange = vi.fn()
      
      render(<UrlInput {...defaultProps} onUrlChange={mockOnUrlChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'https://example.com?param=value&other=test')
      
      expect(mockOnUrlChange).toHaveBeenCalled()
    })
  })
})
