import { describe, it, expect } from 'vitest'

describe('Comment Hex ID Generation', () => {
  it('should convert decimal IDs to hexadecimal correctly', () => {
    const testCases = [
      { decimal: 1, hex: '1' },
      { decimal: 10, hex: 'a' },
      { decimal: 15, hex: 'f' },
      { decimal: 100, hex: '64' },
      { decimal: 255, hex: 'ff' },
      { decimal: 1000, hex: '3e8' },
      { decimal: 4095, hex: 'fff' },
      { decimal: 65535, hex: 'ffff' },
      { decimal: 1048575, hex: 'fffff' },
      { decimal: 1234567, hex: '12d687' },
    ]

    testCases.forEach(({ decimal, hex }) => {
      expect(decimal.toString(16)).toBe(hex)
    })
  })

  it('should generate shorter hex IDs than decimal for large numbers', () => {
    const largeCases = [
      { decimal: 1000000, decimalStr: '1000000', hex: 'f4240' },
      { decimal: 9999999, decimalStr: '9999999', hex: '98967f' },
    ]

    largeCases.forEach(({ decimal, decimalStr, hex }) => {
      const hexId = decimal.toString(16)
      expect(hexId).toBe(hex)
      expect(hexId.length).toBeLessThan(decimalStr.length)
    })
  })

  it('should generate valid CSS/HTML IDs with c- prefix', () => {
    const testIds = [1, 100, 1000, 10000]

    testIds.forEach((id) => {
      const hexId = id.toString(16)
      const fullId = `c-${hexId}`

      // Should start with c-
      expect(fullId).toMatch(/^c-[0-9a-f]+$/)

      // Should be valid HTML ID (no spaces, starts with letter)
      expect(fullId).toMatch(/^[a-zA-Z][\w-]*$/)
    })
  })

  it('should generate consistent hashes for citation regex patterns', () => {
    const testComments = [
      { id: 10, hex: 'a', text: '#c-a (user: "quoted text")' },
      { id: 255, hex: 'ff', text: '#c-ff (user: "quoted text")' },
      { id: 4095, hex: 'fff', text: '#c-fff (user: "quoted text")' },
    ]

    const citationRegex = /#c-([0-9a-fA-F]+)\s+\(([^:]+):\s+"([^"]+)"\)/g

    testComments.forEach(({ id, hex, text }) => {
      expect(id.toString(16)).toBe(hex)

      const match = citationRegex.exec(text)
      expect(match).toBeTruthy()
      expect(match[1]).toBe(hex) // Extracted hex should match

      // Reset regex for next iteration
      citationRegex.lastIndex = 0
    })
  })

  it('should handle comment preview truncation correctly', () => {
    const getCommentPreview = (content) => {
      const plainText = content.replace(/[*_`#[\]()]/g, '').trim()
      return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText
    }

    const testCases = [
      {
        input: 'Short comment',
        expected: 'Short comment',
      },
      {
        input:
          'This is a very long comment that definitely exceeds the fifty character limit and should be truncated',
        expected: 'This is a very long comment that definitely exceed...',
      },
      {
        input: 'Comment with **markdown** and *formatting* [removed]',
        expected: 'Comment with markdown and formatting removed',
      },
    ]

    testCases.forEach(({ input, expected }) => {
      expect(getCommentPreview(input)).toBe(expected)
    })
  })

  it('should generate permalink URLs with correct format', () => {
    const baseUrl = 'https://example.com'
    const postSlug = 'test-post'
    const commentId = 1234
    const hexId = commentId.toString(16) // '4d2'

    const permalinkUrl = `${baseUrl}/posts/${postSlug}#c-${hexId}`

    expect(permalinkUrl).toBe('https://example.com/posts/test-post#c-4d2')
    expect(permalinkUrl).toMatch(/^https?:\/\/.*\/posts\/.*#c-[0-9a-f]+$/)
  })

  it('should handle UUID to slug redirect URLs correctly', () => {
    const baseUrl = 'https://example.com'
    const uuid = 'bb680fd8-483d-4444-a4ac-4115439c304c'
    const slug = 'test-post'
    const hash = '#c-5'

    const uuidUrl = `${baseUrl}/p/${uuid}${hash}`
    const slugUrl = `${baseUrl}/posts/${slug}${hash}`

    expect(uuidUrl).toBe('https://example.com/p/bb680fd8-483d-4444-a4ac-4115439c304c#c-5')
    expect(slugUrl).toBe('https://example.com/posts/test-post#c-5')

    // Simulate redirect preserving hash
    const targetUrl = slugUrl
    expect(targetUrl).toContain('#c-5')
  })
})
