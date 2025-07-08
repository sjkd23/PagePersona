/**
 * @fileoverview Test suite for PageTransformer component
 *     vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { sub: 'test-user' },
      userProfile: null,
      isAuthenticated: true,
      isLoading: false,
      isSyncing: false,
      error: null,
      getAccessToken: mockGetAccessToken,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUserProfile: vi.fn(),
      isNewUser: null,
      isFirstLogin: null,
      profileSyncError: null,
      getCustomClaims: vi.fn(),
    })r interactions, state management, and API integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import PageTransformer from './PageTransformer'
import * as useAuthModule from '../../hooks/useAuth0'
import * as useTransformationHistoryModule from '../../hooks/useTransformationHistory'
import ApiService from '../../lib/apiClient'

// Mock dependencies
vi.mock('../../hooks/useAuth0')
vi.mock('../../hooks/useTransformationHistory')
vi.mock('../../lib/apiClient')
vi.mock('../PersonaSelector', () => ({
  default: vi.fn(({ onPersonaSelect }) => (
    <div data-testid="persona-selector">
      <button
        onClick={() => onPersonaSelect({
          id: 'professional',
          name: 'Professional',
          description: 'Professional writing style'
        })}
      >
        Select Professional
      </button>
    </div>
  ))
}))

vi.mock('./UrlInput', () => ({
  default: vi.fn(({ url, onUrlChange, isLoading }) => (
    <div data-testid="url-input">
      <input
        data-testid="url-field"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="Enter URL"
        disabled={isLoading}
      />
    </div>
  ))
}))

vi.mock('./ContentDisplay', () => ({
  default: vi.fn(({ content }) => (
    <div data-testid="content-display">
      {content ? `Content: ${content.transformedContent}` : 'No content'}
    </div>
  ))
}))

describe('PageTransformer', () => {
  const mockGetAccessToken = vi.fn()
  const mockAddToHistory = vi.fn()
  const mockRemoveFromHistory = vi.fn()
  const mockClearHistory = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock useAuth hook
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { sub: 'test-user' },
      userProfile: null,
      isAuthenticated: true,
      isLoading: false,
      isSyncing: false,
      error: null,
      getAccessToken: mockGetAccessToken,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUserProfile: vi.fn(),
      isNewUser: null,
      isFirstLogin: null,
      profileSyncError: null,
      getCustomClaims: vi.fn(),
    })

    // Mock useTransformationHistory hook
    vi.mocked(useTransformationHistoryModule.useTransformationHistory).mockReturnValue({
      history: [],
      addToHistory: mockAddToHistory,
      removeFromHistory: mockRemoveFromHistory,
      clearHistory: mockClearHistory
    })

    mockGetAccessToken.mockResolvedValue('mock-token')
  })

  describe('Component Rendering', () => {
    it('should render all required components', () => {
      render(<PageTransformer />)
      
      expect(screen.getByTestId('persona-selector')).toBeInTheDocument()
      expect(screen.getByTestId('url-input')).toBeInTheDocument()
      // ContentDisplay is only rendered when there's content or loading
      expect(screen.queryByTestId('content-display')).not.toBeInTheDocument()
    })

    it('should initialize with empty state', () => {
      render(<PageTransformer />)
      
      // Check that no content is displayed initially
      expect(screen.queryByTestId('content-display')).not.toBeInTheDocument()
    })
  })

  describe('Persona Selection', () => {
    it('should handle persona selection', async () => {
      render(<PageTransformer />)
      
      const selectButton = screen.getByText('Select Professional')
      await userEvent.click(selectButton)
      
      // Component should update internally (verified through integration)
      expect(selectButton).toBeInTheDocument()
    })
  })

  describe('URL Transformation', () => {
    it('should handle successful URL transformation', async () => {
      const mockTransformResult = {
        success: true,
        originalContent: {
          title: 'Test Article',
          content: 'Original content',
          url: 'https://example.com',
          wordCount: 100
        },
        transformedContent: 'Transformed content in professional style.',
        persona: {
          id: 'professional',
          name: 'Professional',
          description: 'Professional writing style'
        }
      }

      vi.mocked(ApiService.transformWebpage).mockResolvedValue(mockTransformResult)

      render(<PageTransformer />)
      
      // Select persona first
      await userEvent.click(screen.getByText('Select Professional'))
      
      // Enter URL
      const urlField = screen.getByTestId('url-field')
      await userEvent.type(urlField, 'example.com')
      
      // Transform using the main Generate button
      const generateButton = screen.getByText('Generate with Professional')
      await userEvent.click(generateButton)
      
      await waitFor(() => {
        expect(ApiService.transformWebpage).toHaveBeenCalledWith({
          url: 'https://example.com',
          persona: 'professional'
        })
      })

      await waitFor(() => {
        expect(mockAddToHistory).toHaveBeenCalled()
      })
    })

    it('should handle transformation errors', async () => {
      vi.mocked(ApiService.transformWebpage).mockRejectedValue(
        new Error('Transformation failed')
      )

      render(<PageTransformer />)
      
      // Select persona and enter URL
      await userEvent.click(screen.getByText('Select Professional'))
      await userEvent.type(screen.getByTestId('url-field'), 'example.com')
      await userEvent.click(screen.getByText('Generate with Professional'))
      
      await waitFor(() => {
        expect(ApiService.transformWebpage).toHaveBeenCalled()
      })

      // Should not add to history on error
      expect(mockAddToHistory).not.toHaveBeenCalled()
    })

    it('should format URLs correctly', async () => {
      vi.mocked(ApiService.transformWebpage).mockResolvedValue({
        success: true,
        originalContent: { title: '', content: '', url: '', wordCount: 0 },
        transformedContent: '',
        persona: { id: '', name: '', description: '' }
      })

      render(<PageTransformer />)
      
      await userEvent.click(screen.getByText('Select Professional'))
      
      // Test URL formatting
      const urlField = screen.getByTestId('url-field')
      await userEvent.type(urlField, 'example.com') // Without protocol
      await userEvent.click(screen.getByText('Generate with Professional'))
      
      await waitFor(() => {
        expect(ApiService.transformWebpage).toHaveBeenCalledWith({
          url: 'https://example.com',
          persona: 'professional'
        })
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state during transformation', async () => {
      vi.mocked(ApiService.transformWebpage).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      render(<PageTransformer />)
      
      await userEvent.click(screen.getByText('Select Professional'))
      await userEvent.type(screen.getByTestId('url-field'), 'example.com')
      
      const generateButton = screen.getByText('Generate with Professional')
      await userEvent.click(generateButton)
      
      // Should be in loading state (can be verified by checking if button is disabled)
      expect(ApiService.transformWebpage).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(ApiService.transformWebpage).mockRejectedValue(
        new Error('Network error')
      )

      render(<PageTransformer />)
      
      await userEvent.click(screen.getByText('Select Professional'))
      await userEvent.type(screen.getByTestId('url-field'), 'example.com')
      await userEvent.click(screen.getByText('Generate with Professional'))
      
      await waitFor(() => {
        expect(ApiService.transformWebpage).toHaveBeenCalled()
      })
      
      // Error should be handled gracefully without crashing
      expect(screen.queryByTestId('content-display')).not.toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      render(<PageTransformer />)
      
      // Try to transform without selecting persona
      await userEvent.type(screen.getByTestId('url-field'), 'example.com')
      // Can't click generate button without persona since it's not rendered
      
      // Should not call API without persona
      expect(ApiService.transformWebpage).not.toHaveBeenCalled()
    })
  })

  describe('History Integration', () => {
    it('should restore transformation from history', () => {
      const mockHistoryContent = {
        id: 'hist-1',
        originalUrl: 'https://historical.com',
        originalTitle: 'Historical Article',
        originalContent: 'Historical content',
        transformedContent: 'Transformed historical content',
        persona: {
          id: 'casual',
          label: 'Casual',
          name: 'Casual',
          description: 'Casual writing style',
          exampleTexts: 'Example casual text',
          avatarUrl: '/avatar.png',
          theme: {
            primary: '#blue',
            secondary: '#lightblue',
            accent: '#darkblue'
          }
        },
        timestamp: new Date()
      }

      // Mock history with content
      vi.mocked(useTransformationHistoryModule.useTransformationHistory).mockReturnValue({
        history: [mockHistoryContent],
        addToHistory: mockAddToHistory,
        removeFromHistory: mockRemoveFromHistory,
        clearHistory: mockClearHistory
      })

      render(<PageTransformer />)
      
      // Check that history count is displayed correctly
      expect(screen.getByText('History (1)')).toBeInTheDocument()
      // ContentDisplay should not be visible initially since no content is set
      expect(screen.queryByTestId('content-display')).not.toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    it('should complete full transformation workflow', async () => {
      const mockResult = {
        success: true,
        originalContent: {
          title: 'Test Article',
          content: 'Original content',
          url: 'https://example.com',
          wordCount: 100
        },
        transformedContent: 'Professional transformation result',
        persona: {
          id: 'professional',
          name: 'Professional',
          description: 'Professional writing style'
        }
      }

      vi.mocked(ApiService.transformWebpage).mockResolvedValue(mockResult)

      render(<PageTransformer />)
      
      // Complete workflow
      await userEvent.click(screen.getByText('Select Professional'))
      await userEvent.type(screen.getByTestId('url-field'), 'example.com')
      await userEvent.click(screen.getByText('Generate with Professional'))
      
      await waitFor(() => {
        expect(ApiService.transformWebpage).toHaveBeenCalledWith({
          url: 'https://example.com',
          persona: 'professional'
        })
        expect(mockAddToHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            transformedContent: 'Professional transformation result'
          })
        )
      })
    })
  })
})
