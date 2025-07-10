import { describe, it, expect } from 'vitest'
import { PERSONAS, getPersona, getAllPersonas } from '../personas'

describe('server/data/personas', () => {
  it('should export PERSONAS object', () => {
    expect(PERSONAS).toBeDefined()
    expect(typeof PERSONAS).toBe('object')
  })

  it('should export getPersona function', () => {
    expect(getPersona).toBeDefined()
    expect(typeof getPersona).toBe('function')
  })

  it('should export getAllPersonas function', () => {
    expect(getAllPersonas).toBeDefined()
    expect(typeof getAllPersonas).toBe('function')
  })

  it('should have personas available', () => {
    const allPersonas = getAllPersonas()
    expect(Array.isArray(allPersonas)).toBe(true)
    expect(allPersonas.length).toBeGreaterThan(0)
  })

  it('should be able to get individual personas', () => {
    const allPersonas = getAllPersonas()
    if (allPersonas.length > 0) {
      const firstPersona = allPersonas[0]
      const retrievedPersona = getPersona(firstPersona.id)
      expect(retrievedPersona).toEqual(firstPersona)
    }
  })

  it('should return undefined for non-existent persona', () => {
    const nonExistentPersona = getPersona('non-existent-id')
    expect(nonExistentPersona).toBeUndefined()
  })
})
