/**
 * Testing Best Practices for React Components
 * 
 * Use React Testing Library's act() utility to wrap state updates
 * and ensure proper component behavior testing.
 * 
 * @example
 * import { act } from '@testing-library/react'
 * 
 * act(() => {
 *   // Any code that causes state updates
 *   fireEvent.click(button)
 *   setUserInput('new value')
 * })
 */

import { act } from '@testing-library/react'

// Helper to wrap async operations that trigger React updates
export const actAsync = async (fn: () => Promise<void> | void) => {
  await act(async () => {
    await fn()
  })
}

// Helper to wrap sync operations that trigger React updates  
export const actSync = (fn: () => void) => {
  act(() => {
    fn()
  })
}