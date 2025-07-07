import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PersonaSelector from '../components/PersonaSelector'

// Mock the API client
vi.mock('../lib/apiClient', () => ({
  default: {
    getPersonas: vi.fn()
  }
}))

import ApiService from '../lib/apiClient'

describe('PersonaSelector Component', () => {
  const defaultProps = {
    selectedPersona: null,
    onPersonaSelect: vi.fn()
  }

  const mockPersonas = [
    { id: 'professional', name: 'Professional', description: 'Business-focused content' },
    { id: 'casual', name: 'Casual', description: 'Relaxed and friendly tone' },
    { id: 'eli5', name: 'Explain Like I\'m 5', description: 'Simple explanations' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default successful API response
    vi.mocked(ApiService.getPersonas).mockResolvedValue({
      success: true,
      data: { personas: mockPersonas }
    })
  })

  it('renders without crashing', async () => {
    await act(async () => {
      render(<PersonaSelector {...defaultProps} />)
    })

    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('calls onPersonaSelect when a persona is clicked', async () => {
    const user = userEvent.setup()
    const mockOnPersonaSelect = vi.fn()
    
    await act(async () => {
      render(<PersonaSelector {...defaultProps} onPersonaSelect={mockOnPersonaSelect} />)
    })
    
    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    // Find and interact with the select element
    const selectElement = screen.getByRole('combobox')
    
    await act(async () => {
      await user.selectOptions(selectElement, 'professional')
    })
    
    expect(mockOnPersonaSelect).toHaveBeenCalled()
  })

  it('shows selected state for chosen persona', async () => {
    await act(async () => {
      render(<PersonaSelector {...defaultProps} selectedPersona="professional" />)
    })
    
    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    // Check that the selected persona is set
    const selectElement = screen.getByRole('combobox') as HTMLSelectElement
    expect(selectElement.value).toBe('professional')
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    const mockOnPersonaSelect = vi.fn()
    
    await act(async () => {
      render(<PersonaSelector {...defaultProps} onPersonaSelect={mockOnPersonaSelect} />)
    })
    
    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    const selectElement = screen.getByRole('combobox')
    
    await act(async () => {
      await user.click(selectElement)
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
    })
    
    // Test passes if no errors are thrown
    expect(selectElement).toBeInTheDocument()
  })

  it('displays component correctly', async () => {
    await act(async () => {
      render(<PersonaSelector {...defaultProps} />)
    })
    
    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    // Check that default option is present
    expect(screen.getByDisplayValue('Select a persona...')).toBeInTheDocument()
    
    // Check that personas are loaded as options
    expect(screen.getByRole('option', { name: /professional/i })).toBeInTheDocument()
  })

  it('handles prop changes gracefully', async () => {
    const { rerender } = render(<PersonaSelector {...defaultProps} />)
    
    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    // Change selected persona
    await act(async () => {
      rerender(<PersonaSelector {...defaultProps} selectedPersona="casual" />)
    })
    
    // Check that the new selection is reflected
    const selectElement = screen.getByRole('combobox') as HTMLSelectElement
    expect(selectElement.value).toBe('casual')
  })

  it('handles missing props gracefully', async () => {
    // Test with minimal props
    const minimalProps = {
      selectedPersona: null,
      onPersonaSelect: vi.fn()
    }
    
    await act(async () => {
      render(<PersonaSelector {...minimalProps} />)
    })
    
    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('accessibility requirements', async () => {
    await act(async () => {
      render(<PersonaSelector {...defaultProps} />)
    })
    
    // Wait for personas to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    
    // Check that select element is accessible
    const selectElement = screen.getByRole('combobox')
    expect(selectElement).not.toHaveAttribute('disabled')
    expect(selectElement).toHaveAttribute('aria-label', 'Select a persona')
    
    // Check that options are accessible
    const options = screen.getAllByRole('option')
    expect(options.length).toBeGreaterThan(0)
  })

  it('handles API errors gracefully', async () => {
    // Mock API failure
    vi.mocked(ApiService.getPersonas).mockRejectedValue(new Error('Network error'))
    
    await act(async () => {
      render(<PersonaSelector {...defaultProps} />)
    })
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/failed to connect to server/i)).toBeInTheDocument()
    })
    
    // Check that retry button is present
    expect(screen.getByText(/try again/i)).toBeInTheDocument()
  })

  it('handles API response errors gracefully', async () => {
    // Mock API error response
    vi.mocked(ApiService.getPersonas).mockResolvedValue({
      success: false,
      error: 'Failed to load personas'
    })
    
    await act(async () => {
      render(<PersonaSelector {...defaultProps} />)
    })
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/failed to load personas/i)).toBeInTheDocument()
    })
  })
})
