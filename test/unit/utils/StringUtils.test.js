// test/unit/utils/StringUtils.test.js
import { describe, it, expect } from 'vitest'
import { truncateText, stripMarkdown, createExcerpt } from '~/utils/text.js'

// Simple utility functions to test
const stringUtils = {
  capitalize: (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  slugify: (str) => {
    if (!str) return ''
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
  },
}

describe('String Utilities', () => {
  describe('capitalize', () => {
    it('capitalizes the first letter of a string', () => {
      expect(stringUtils.capitalize('hello')).toBe('Hello')
    })

    it('lowercases the rest of the string', () => {
      expect(stringUtils.capitalize('HELLO')).toBe('Hello')
    })

    it('handles empty strings', () => {
      expect(stringUtils.capitalize('')).toBe('')
    })

    it('handles null values', () => {
      expect(stringUtils.capitalize(null)).toBe('')
    })
  })

  describe('truncateText', () => {
    it('truncates strings longer than the specified length', () => {
      expect(
        truncateText('This is a very long string that needs to be truncated', 20)
      ).toBe('This is a very long ...')
    })

    it('does not truncate strings shorter than the specified length', () => {
      expect(truncateText('Short string', 20)).toBe('Short string')
    })

    it('uses default length if not specified', () => {
      const longString =
        'This is a string that is longer than thirty characters and should be truncated'
      expect(truncateText(longString)).toBe('This is a string that is longe...')
    })

    it('handles empty strings', () => {
      expect(truncateText('')).toBe('')
    })

    it('handles null or undefined', () => {
      expect(truncateText(null)).toBe('')
      expect(truncateText(undefined)).toBe('')
    })
  })

  describe('stripMarkdown', () => {
    it('removes markdown formatting', () => {
      const markdown = '# Title\n**Bold text** and *italic text*\n[Link](http://example.com)'
      const result = stripMarkdown(markdown)
      expect(result).toBe('Title Bold text and italic text Link')
    })

    it('handles empty content', () => {
      expect(stripMarkdown('')).toBe('')
      expect(stripMarkdown(null)).toBe('')
    })
  })

  describe('createExcerpt', () => {
    it('creates excerpt from markdown content', () => {
      const markdown = '# Title\n\nThis is a **long** content that should be truncated at some point to create a nice excerpt for display purposes.'
      const result = createExcerpt(markdown, 50)
      expect(result).toBe('Title This is a long content that should be trunca...')
    })
  })

  describe('slugify', () => {
    it('converts spaces to hyphens', () => {
      expect(stringUtils.slugify('hello world')).toBe('hello-world')
    })

    it('removes special characters', () => {
      expect(stringUtils.slugify('hello! world?')).toBe('hello-world')
    })

    it('converts to lowercase', () => {
      expect(stringUtils.slugify('Hello World')).toBe('hello-world')
    })
  })
})
