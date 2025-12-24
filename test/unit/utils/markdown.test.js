import { describe, it, expect } from 'vitest'
import { extractEmbeds, replaceEmbedsWithPlaceholders, hasEmbeds } from '~/utils/markdown'

describe('markdown embed utilities', () => {
  describe('extractEmbeds', () => {
    it('should extract single embed from content', () => {
      const content = 'Check this out: [embed:YouTube](https://www.youtube.com/watch?v=abc12345678)'
      const embeds = extractEmbeds(content)

      expect(embeds).toHaveLength(1)
      expect(embeds[0].provider).toBe('YouTube')
      expect(embeds[0].url).toBe('https://www.youtube.com/watch?v=abc12345678')
    })

    it('should extract multiple embeds from content', () => {
      const content = `
        Video: [embed:YouTube](https://youtube.com/watch?v=abc)
        Tweet: [embed:Twitter](https://twitter.com/user/status/123)
        Photo: [embed:Instagram](https://instagram.com/p/xyz)
      `
      const embeds = extractEmbeds(content)

      expect(embeds).toHaveLength(3)
      expect(embeds[0].provider).toBe('YouTube')
      expect(embeds[1].provider).toBe('Twitter')
      expect(embeds[2].provider).toBe('Instagram')
    })

    it('should return empty array for content without embeds', () => {
      const content = 'Just some regular text with a link: https://example.com'
      const embeds = extractEmbeds(content)

      expect(embeds).toHaveLength(0)
    })

    it('should return empty array for empty content', () => {
      expect(extractEmbeds('')).toHaveLength(0)
      expect(extractEmbeds(null)).toHaveLength(0)
      expect(extractEmbeds(undefined)).toHaveLength(0)
    })

    it('should include fullMatch and index in results', () => {
      const content = 'Start [embed:Test](http://test.com) end'
      const embeds = extractEmbeds(content)

      expect(embeds[0].fullMatch).toBe('[embed:Test](http://test.com)')
      expect(embeds[0].index).toBe(6)
    })
  })

  describe('replaceEmbedsWithPlaceholders', () => {
    it('should replace single embed with placeholder', () => {
      const content = 'Text [embed:YouTube](https://youtube.com/watch?v=abc) more text'
      const result = replaceEmbedsWithPlaceholders(content)

      expect(result).toBe('Text <!--EMBED_PLACEHOLDER_0--> more text')
    })

    it('should replace multiple embeds with numbered placeholders', () => {
      const content = '[embed:A](http://a.com) middle [embed:B](http://b.com)'
      const result = replaceEmbedsWithPlaceholders(content)

      expect(result).toBe('<!--EMBED_PLACEHOLDER_0--> middle <!--EMBED_PLACEHOLDER_1-->')
    })

    it('should return content unchanged if no embeds', () => {
      const content = 'Regular text without embeds'
      const result = replaceEmbedsWithPlaceholders(content)

      expect(result).toBe(content)
    })

    it('should handle empty/null content', () => {
      expect(replaceEmbedsWithPlaceholders('')).toBe('')
      expect(replaceEmbedsWithPlaceholders(null)).toBe(null)
      expect(replaceEmbedsWithPlaceholders(undefined)).toBe(undefined)
    })
  })

  describe('hasEmbeds', () => {
    it('should return true for content with embeds', () => {
      const content = 'Check this: [embed:YouTube](https://youtube.com/watch?v=abc)'
      expect(hasEmbeds(content)).toBe(true)
    })

    it('should return false for content without embeds', () => {
      const content = 'Regular text with link: https://youtube.com'
      expect(hasEmbeds(content)).toBe(false)
    })

    it('should return false for empty/null content', () => {
      expect(hasEmbeds('')).toBe(false)
      expect(hasEmbeds(null)).toBe(false)
      expect(hasEmbeds(undefined)).toBe(false)
    })

    it('should return true for multiple embeds', () => {
      const content = '[embed:A](http://a.com) and [embed:B](http://b.com)'
      expect(hasEmbeds(content)).toBe(true)
    })
  })
})
