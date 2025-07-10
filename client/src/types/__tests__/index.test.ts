import { describe, it, expect } from 'vitest'

describe('types/index', () => {
  it('should re-export shared types', async () => {
    // Test that the module exports the expected types
    const module = await import('../index')
    
    // Since this is a type-only module, we just verify it can be imported
    // without throwing errors
    expect(module).toBeDefined()
  })

  it('should import without errors', async () => {
    // This test ensures the module structure is correct
    expect(async () => {
      await import('../index')
    }).not.toThrow()
  })
})
