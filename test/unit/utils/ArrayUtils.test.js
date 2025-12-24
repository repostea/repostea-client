// test/unit/utils/ArrayUtils.test.js
import { describe, it, expect } from 'vitest'

// Simple array utility functions to test
const arrayUtils = {
  // Find the maximum value in an array
  findMax: (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null
    return Math.max(...arr)
  },

  // Find the minimum value in an array
  findMin: (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null
    return Math.min(...arr)
  },

  // Calculate the average of an array of numbers
  average: (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return null
    const sum = arr.reduce((acc, val) => acc + val, 0)
    return sum / arr.length
  },

  // Filter out duplicate values from an array
  unique: (arr) => {
    if (!Array.isArray(arr)) return []
    return [...new Set(arr)]
  },

  // Group an array of objects by a specific property
  groupBy: (arr, key) => {
    if (!Array.isArray(arr) || !key) return {}
    return arr.reduce((result, item) => {
      const groupKey = item[key]
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey].push(item)
      return result
    }, {})
  },
}

describe('Array Utilities', () => {
  describe('findMax', () => {
    it('finds the maximum value in an array', () => {
      expect(arrayUtils.findMax([1, 5, 3, 9, 2])).toBe(9)
    })

    it('returns null for empty arrays', () => {
      expect(arrayUtils.findMax([])).toBeNull()
    })

    it('returns null for non-array inputs', () => {
      expect(arrayUtils.findMax('not an array')).toBeNull()
      expect(arrayUtils.findMax(null)).toBeNull()
      expect(arrayUtils.findMax(undefined)).toBeNull()
    })
  })

  describe('findMin', () => {
    it('finds the minimum value in an array', () => {
      expect(arrayUtils.findMin([5, 3, 9, 1, 2])).toBe(1)
    })

    it('returns null for empty arrays', () => {
      expect(arrayUtils.findMin([])).toBeNull()
    })

    it('returns null for non-array inputs', () => {
      expect(arrayUtils.findMin('not an array')).toBeNull()
      expect(arrayUtils.findMin(null)).toBeNull()
    })
  })

  describe('average', () => {
    it('calculates the average of an array of numbers', () => {
      expect(arrayUtils.average([2, 4, 6, 8])).toBe(5)
    })

    it('handles decimal results correctly', () => {
      expect(arrayUtils.average([1, 2, 3])).toBe(2)
      expect(arrayUtils.average([1, 2, 4])).toBe(7 / 3)
    })

    it('returns null for empty arrays', () => {
      expect(arrayUtils.average([])).toBeNull()
    })

    it('returns null for non-array inputs', () => {
      expect(arrayUtils.average('not an array')).toBeNull()
      expect(arrayUtils.average(null)).toBeNull()
    })
  })

  describe('unique', () => {
    it('removes duplicate values from an array', () => {
      expect(arrayUtils.unique([1, 2, 2, 3, 4, 4, 5])).toEqual([1, 2, 3, 4, 5])
    })

    it('works with strings', () => {
      expect(arrayUtils.unique(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
    })

    it('returns an empty array for non-array inputs', () => {
      expect(arrayUtils.unique('not an array')).toEqual([])
      expect(arrayUtils.unique(null)).toEqual([])
    })
  })

  describe('groupBy', () => {
    it('groups an array of objects by a specified property', () => {
      const users = [
        { id: 1, role: 'admin', name: 'Alice' },
        { id: 2, role: 'user', name: 'Bob' },
        { id: 3, role: 'admin', name: 'Charlie' },
        { id: 4, role: 'user', name: 'Dave' },
      ]

      const expected = {
        admin: [
          { id: 1, role: 'admin', name: 'Alice' },
          { id: 3, role: 'admin', name: 'Charlie' },
        ],
        user: [
          { id: 2, role: 'user', name: 'Bob' },
          { id: 4, role: 'user', name: 'Dave' },
        ],
      }

      expect(arrayUtils.groupBy(users, 'role')).toEqual(expected)
    })

    it('returns an empty object for empty arrays', () => {
      expect(arrayUtils.groupBy([], 'role')).toEqual({})
    })

    it('returns an empty object for non-array inputs', () => {
      expect(arrayUtils.groupBy('not an array', 'role')).toEqual({})
      expect(arrayUtils.groupBy(null, 'role')).toEqual({})
    })

    it('returns an empty object when no key is provided', () => {
      const users = [{ id: 1, name: 'Alice' }]
      expect(arrayUtils.groupBy(users)).toEqual({})
    })
  })
})
