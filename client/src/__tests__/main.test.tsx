import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StrictMode } from 'react'

// Mock React DOM
const mockRender = vi.fn()
const mockCreateRoot = vi.fn(() => ({
  render: mockRender
}))

vi.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot
}))

// Mock App component
vi.mock('../App.tsx', () => ({
  default: () => 'App'
}))

describe('main.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock DOM element
    const mockElement = document.createElement('div')
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement)
  })

  it('should render App component in StrictMode', async () => {
    // Import main to trigger the render
    await import('../main.tsx')

    expect(document.getElementById).toHaveBeenCalledWith('root')
    expect(mockCreateRoot).toHaveBeenCalledWith(expect.any(HTMLElement))
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        type: StrictMode,
        props: expect.objectContaining({
          children: expect.anything()
        })
      })
    )
  })
})
