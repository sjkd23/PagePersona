/**
 * Custom hook for managing transformation history
 *
 * This hook provides persistent storage and management of transformation
 * history using localStorage. It maintains a limited history of recent
 * transformations with deduplication and error handling capabilities.
 *
 * @module useTransformationHistory
 */

import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom hook for managing transformation history
 *
 * This hook provides persistent storage and management of transformation
 * history using localStorage. It maintains a limited history of recent
 * transformations with deduplication and error handling capabilities.
 *
 * @module useTransformationHistory
 */

import type { WebpageContent } from '@pagepersonai/shared';

/**
 * Local storage key for transformation history
 */
const HISTORY_KEY = 'transformation-history';

/**
 * Maximum number of history items to retain
 */
const MAX_HISTORY_ITEMS = 5;

/**
 * Extended interface for history items with unique identifiers
 *
 * @interface HistoryItem
 * @extends WebpageContent
 * @property {string} id - Unique identifier for the history item
 */
export interface HistoryItem extends WebpageContent {
  id: string;
}

/**
 * Hook for managing transformation history with persistent storage
 *
 * Provides CRUD operations for transformation history with automatic
 * localStorage synchronization, deduplication, and error handling.
 * Maintains a maximum number of items and ensures data integrity.
 *
 * @returns {object} History management interface
 * @returns {HistoryItem[]} returns.history - Current history items
 * @returns {function} returns.addToHistory - Add new transformation to history
 * @returns {function} returns.removeFromHistory - Remove specific item from history
 * @returns {function} returns.clearHistory - Clear all history items
 */
export function useTransformationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Ensure timestamps are Date objects
        const historyWithDates = parsedHistory.map((item: WebpageContent) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setHistory(historyWithDates);
      }
    } catch (error) {
      logger.error('Failed to load transformation history:', error);
      // Clear corrupted data
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      logger.error('Failed to save transformation history:', error);
    }
  }, [history]);

  /**
   * Adds a new transformation result to history
   *
   * Creates a unique ID for the item and prevents duplicates by
   * removing any existing item with the same URL and persona.
   * Maintains the maximum history size by removing oldest items.
   *
   * @param {WebpageContent} content - The transformation result to add
   */
  const addToHistory = (content: WebpageContent) => {
    const historyItem: HistoryItem = {
      ...content,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setHistory((prevHistory) => {
      // Remove any existing item with the same URL and persona to avoid duplicates
      const filteredHistory = prevHistory.filter(
        (item) =>
          !(item.originalUrl === content.originalUrl && item.persona.id === content.persona.id),
      );

      // Add new item to the beginning and keep only the last MAX_HISTORY_ITEMS
      return [historyItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    });
  };

  /**
   * Removes a specific item from history by ID
   *
   * @param {string} id - The unique identifier of the item to remove
   */
  const removeFromHistory = (id: string) => {
    setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
  };

  /**
   * Clears all history items and removes from localStorage
   */
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
