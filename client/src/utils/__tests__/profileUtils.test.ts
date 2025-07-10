import { describe, it, expect } from 'vitest'
import { formatProfileField, hasValidName, formatFullName } from '../profileUtils'

describe('utils/profileUtils', () => {
  describe('formatProfileField', () => {
    it('should return "Not provided" for null, undefined, or empty values', () => {
      expect(formatProfileField(null)).toBe('Not provided')
      expect(formatProfileField(undefined)).toBe('Not provided')
      expect(formatProfileField('')).toBe('Not provided')
      expect(formatProfileField('   ')).toBe('Not provided')
    })

    it('should trim and return valid string values', () => {
      expect(formatProfileField('  John  ')).toBe('John')
      expect(formatProfileField('Jane')).toBe('Jane')
      expect(formatProfileField('  test@email.com  ')).toBe('test@email.com')
    })

    it('should handle non-string values', () => {
      expect(formatProfileField(123 as any)).toBe('Not provided')
      expect(formatProfileField({} as any)).toBe('Not provided')
      expect(formatProfileField([] as any)).toBe('Not provided')
    })
  })

  describe('hasValidName', () => {
    it('should return true when first name is valid', () => {
      expect(hasValidName('John', undefined)).toBe(true)
      expect(hasValidName('John', '')).toBe(true)
      expect(hasValidName('  John  ', '')).toBe(true)
    })

    it('should return true when last name is valid', () => {
      expect(hasValidName(undefined, 'Doe')).toBe(true)
      expect(hasValidName('', 'Doe')).toBe(true)
      expect(hasValidName('', '  Doe  ')).toBe(true)
    })

    it('should return true when both names are valid', () => {
      expect(hasValidName('John', 'Doe')).toBe(true)
      expect(hasValidName('  John  ', '  Doe  ')).toBe(true)
    })

    it('should return false when both names are invalid', () => {
      expect(hasValidName(undefined, undefined)).toBe(false)
      expect(hasValidName('', '')).toBe(false)
      expect(hasValidName('   ', '   ')).toBe(false)
      expect(hasValidName(undefined, '')).toBe(false)
      expect(hasValidName('', undefined)).toBe(false)
    })
  })

  describe('formatFullName', () => {
    it('should combine first and last name when both are valid', () => {
      expect(formatFullName('John', 'Doe')).toBe('John Doe')
      expect(formatFullName('  John  ', '  Doe  ')).toBe('John Doe')
    })

    it('should return only first name when last name is invalid', () => {
      expect(formatFullName('John', undefined)).toBe('John')
      expect(formatFullName('John', '')).toBe('John')
      expect(formatFullName('  John  ', '   ')).toBe('John')
    })

    it('should return only last name when first name is invalid', () => {
      expect(formatFullName(undefined, 'Doe')).toBe('Doe')
      expect(formatFullName('', 'Doe')).toBe('Doe')
      expect(formatFullName('   ', '  Doe  ')).toBe('Doe')
    })

    it('should return empty string when both names are invalid', () => {
      expect(formatFullName(undefined, undefined)).toBe('')
      expect(formatFullName('', '')).toBe('')
      expect(formatFullName('   ', '   ')).toBe('')
    })

    it('should handle single character names', () => {
      expect(formatFullName('J', 'D')).toBe('J D')
      expect(formatFullName('J', undefined)).toBe('J')
      expect(formatFullName(undefined, 'D')).toBe('D')
    })

    it('should handle names with special characters', () => {
      expect(formatFullName("O'Connor", "Smith-Jones")).toBe("O'Connor Smith-Jones")
      expect(formatFullName('José', 'García')).toBe('José García')
    })
  })
})
