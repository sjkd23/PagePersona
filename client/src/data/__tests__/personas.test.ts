import { describe, it, expect } from 'vitest'
import { FULL_PERSONAS } from '@shared/constants/personas'

describe('data/personas', () => {
  it('should have all personas with required properties', () => {
    const allPersonas = Object.values(FULL_PERSONAS)
    
    expect(allPersonas.length).toBeGreaterThan(0)
    
    allPersonas.forEach(persona => {
      expect(persona).toHaveProperty('id')
      expect(persona).toHaveProperty('name')
      expect(persona).toHaveProperty('description')
      expect(persona).toHaveProperty('label')
      expect(persona).toHaveProperty('exampleTexts')
      expect(persona).toHaveProperty('avatarUrl')
      expect(persona).toHaveProperty('theme')
      expect(persona).toHaveProperty('toneModifier')
      expect(persona).toHaveProperty('systemPrompt')
      
      expect(typeof persona.id).toBe('string')
      expect(typeof persona.name).toBe('string')
      expect(typeof persona.description).toBe('string')
      expect(typeof persona.label).toBe('string')
      expect(Array.isArray(persona.exampleTexts)).toBe(true)
      expect(typeof persona.avatarUrl).toBe('string')
      expect(typeof persona.theme).toBe('object')
      expect(typeof persona.toneModifier).toBe('string')
      expect(typeof persona.systemPrompt).toBe('string')
      
      // Validate theme has required colors
      expect(persona.theme).toHaveProperty('primary')
      expect(persona.theme).toHaveProperty('secondary')
      expect(persona.theme).toHaveProperty('accent')
      
      // Validate toneModifier is not empty and contains content
      expect(persona.toneModifier.trim().length).toBeGreaterThan(0)
      
      // Validate systemPrompt contains toneModifier
      expect(persona.systemPrompt).toContain(persona.toneModifier)
      
      // Validate example texts array has content
      expect(persona.exampleTexts.length).toBeGreaterThan(0)
      persona.exampleTexts.forEach((text: string) => {
        expect(typeof text).toBe('string')
        expect(text.trim().length).toBeGreaterThan(0)
      })
    })
  })

  it('should have unique persona IDs', () => {
    const allPersonas = Object.values(FULL_PERSONAS)
    const ids = allPersonas.map(p => p.id)
    const uniqueIds = new Set(ids)
    
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have consistent ID keys and persona.id values', () => {
    Object.entries(FULL_PERSONAS).forEach(([key, persona]) => {
      expect(key).toBe(persona.id)
    })
  })

  it('should have valid avatar URLs', () => {
    const allPersonas = Object.values(FULL_PERSONAS)
    
    allPersonas.forEach(persona => {
      expect(persona.avatarUrl).toMatch(/^\/images\//)
    })
  })

  it('should have valid hex color themes', () => {
    const allPersonas = Object.values(FULL_PERSONAS)
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/
    
    allPersonas.forEach(persona => {
      expect(persona.theme.primary).toMatch(hexColorRegex)
      expect(persona.theme.secondary).toMatch(hexColorRegex)
      expect(persona.theme.accent).toMatch(hexColorRegex)
    })
  })

  it('should contain expected personas', () => {
    const expectedPersonas = [
      'eli5',
      'medieval-knight',
      'anime-hacker',
      'plague-doctor',
      'robot'
    ]
    
    expectedPersonas.forEach(personaId => {
      expect(FULL_PERSONAS).toHaveProperty(personaId)
    })
  })
})
