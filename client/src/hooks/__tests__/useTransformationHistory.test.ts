import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTransformationHistory, type HistoryItem } from '../useTransformationHistory'
import type { WebpageContent } from '../../../../shared/types/personas'

// Mock the logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }
}))

// Import the mocked logger
import { logger } from '../../utils/logger'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

// Mock console.error to avoid noise in tests
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('useTransformationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError.mockClear()
  })

  const mockWebpageContent: WebpageContent = {
    originalTitle: 'Test Title',
    originalContent: 'Test content',
    transformedContent: 'Transformed content',
    originalUrl: 'https://example.com',
    persona: {
      id: 'professional',
      name: 'Professional',
      description: 'Professional persona',
      label: 'Professional',
      exampleTexts: ['Example text'],
      avatarUrl: 'avatar.png',
      theme: {
        primary: '#000',
        secondary: '#fff',
        accent: '#333',
      },
    },
    timestamp: new Date('2023-01-01'),
  }

  describe('initialization', () => {
    it('should initialize with empty history when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useTransformationHistory())

      expect(result.current.history).toEqual([])
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('transformation-history')
    })

    it('should load history from localStorage on mount', () => {
      const savedHistory = [
        {
          ...mockWebpageContent,
          id: 'test-id-1',
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedHistory))

      const { result } = renderHook(() => useTransformationHistory())

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].id).toBe('test-id-1')
      expect(result.current.history[0].timestamp).toBeInstanceOf(Date)
    })

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')

      const { result } = renderHook(() => useTransformationHistory())

      expect(result.current.history).toEqual([])
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to load transformation history:',
        expect.any(Error)
      )
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('transformation-history')
    })
  })

  describe('addToHistory', () => {
    it('should add new item to history', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useTransformationHistory())

      act(() => {
        result.current.addToHistory(mockWebpageContent)
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0]).toMatchObject({
        ...mockWebpageContent,
        id: expect.any(String),
      })
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'transformation-history',
        expect.any(String)
      )
    })

    it('should remove duplicate entries (same URL and persona)', () => {
      const existingItem: HistoryItem = {
        ...mockWebpageContent,
        id: 'existing-id',
        originalTitle: 'Old Title',
      }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([existingItem]))

      const { result } = renderHook(() => useTransformationHistory())

      act(() => {
        result.current.addToHistory({
          ...mockWebpageContent,
          originalTitle: 'New Title',
        })
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].originalTitle).toBe('New Title')
      expect(result.current.history[0].id).not.toBe('existing-id')
    })

    it('should maintain maximum history items limit', () => {
      const existingHistory: HistoryItem[] = Array.from({ length: 5 }, (_, i) => ({
        ...mockWebpageContent,
        id: `id-${i}`,
        originalUrl: `https://example${i}.com`,
      }))
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHistory))

      const { result } = renderHook(() => useTransformationHistory())

      act(() => {
        result.current.addToHistory({
          ...mockWebpageContent,
          originalUrl: 'https://new-example.com',
        })
      })

      expect(result.current.history).toHaveLength(5)
      expect(result.current.history[0].originalUrl).toBe('https://new-example.com')
      expect(result.current.history.some(item => item.id === 'id-4')).toBe(false)
    })

    it('should handle localStorage setItem errors', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const { result } = renderHook(() => useTransformationHistory())

      act(() => {
        result.current.addToHistory(mockWebpageContent)
      })

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to save transformation history:',
        expect.any(Error)
      )
    })
  })

  describe('removeFromHistory', () => {
    it('should remove item by id', () => {
      const existingHistory: HistoryItem[] = [
        { ...mockWebpageContent, id: 'id-1' },
        { ...mockWebpageContent, id: 'id-2', originalUrl: 'https://example2.com' },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHistory))

      const { result } = renderHook(() => useTransformationHistory())

      act(() => {
        result.current.removeFromHistory('id-1')
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].id).toBe('id-2')
    })

    it('should handle removal of non-existent id', () => {
      const existingHistory: HistoryItem[] = [
        { ...mockWebpageContent, id: 'id-1' },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHistory))

      const { result } = renderHook(() => useTransformationHistory())

      act(() => {
        result.current.removeFromHistory('non-existent-id')
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].id).toBe('id-1')
    })
  })

  describe('clearHistory', () => {
    it('should clear all history and remove from localStorage', () => {
      const existingHistory: HistoryItem[] = [
        { ...mockWebpageContent, id: 'id-1' },
        { ...mockWebpageContent, id: 'id-2' },
      ]
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHistory))

      const { result } = renderHook(() => useTransformationHistory())

      act(() => {
        result.current.clearHistory()
      })

      expect(result.current.history).toEqual([])
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('transformation-history')
    })
  })

  describe('localStorage integration', () => {
    it('should save to localStorage whenever history changes', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useTransformationHistory())

      // Clear any initial calls
      mockLocalStorage.setItem.mockClear()

      act(() => {
        result.current.addToHistory(mockWebpageContent)
      })

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'transformation-history',
        expect.stringContaining(mockWebpageContent.originalTitle)
      )
    })
  })
})
