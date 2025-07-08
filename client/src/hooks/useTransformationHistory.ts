import { useState, useEffect } from 'react'
import type { WebpageContent } from '../types/personas'

const HISTORY_KEY = 'transformation-history'
const MAX_HISTORY_ITEMS = 5

export interface HistoryItem extends WebpageContent {
  id: string
}

export function useTransformationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY)
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory)
        // Ensure timestamps are Date objects
        const historyWithDates = parsedHistory.map((item: WebpageContent) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setHistory(historyWithDates)
      }
    } catch (error) {
      console.error('Failed to load transformation history:', error)
      // Clear corrupted data
      localStorage.removeItem(HISTORY_KEY)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save transformation history:', error)
    }
  }, [history])

  const addToHistory = (content: WebpageContent) => {
    const historyItem: HistoryItem = {
      ...content,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    setHistory(prevHistory => {
      // Remove any existing item with the same URL and persona to avoid duplicates
      const filteredHistory = prevHistory.filter(
        item => !(item.originalUrl === content.originalUrl && item.persona.id === content.persona.id)
      )
      
      // Add new item to the beginning and keep only the last MAX_HISTORY_ITEMS
      return [historyItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS)
    })
  }

  const removeFromHistory = (id: string) => {
    setHistory(prevHistory => prevHistory.filter(item => item.id !== id))
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}
