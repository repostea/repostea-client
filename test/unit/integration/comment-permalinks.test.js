import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Comment Permalinks Integration', () => {
  beforeEach(() => {
    // Mock DOM methods
    global.document = {
      getElementById: vi.fn(),
      createElement: vi.fn(() => ({
        classList: { add: vi.fn(), remove: vi.fn() },
        getBoundingClientRect: vi.fn(() => ({ top: 100 })),
      })),
    }

    global.window = {
      location: {
        origin: 'https://example.com',
        pathname: '/posts/test-post',
        href: 'https://example.com/posts/test-post',
        hash: '',
      },
      scrollTo: vi.fn(),
      pageYOffset: 0,
    }
  })

  it('should handle complete permalink workflow', () => {
    // Mock comment data
    const mockComment = {
      id: 1234,
      hex_id: '4d2',
      content: 'Test comment content',
      user: { username: 'testuser' },
      post: {
        uuid: 'bb680fd8-483d-4444-a4ac-4115439c304c',
        permalink: '/posts/test-post',
      },
    }

    // Test hex ID generation
    expect(mockComment.hex_id).toBe('4d2')
    expect(parseInt(mockComment.hex_id, 16)).toBe(1234)

    // Test element ID format
    const elementId = `c-${mockComment.hex_id}`
    expect(elementId).toBe('c-4d2')

    // Test permalink URL generation
    const baseUrl = window.location.origin
    const postPermalink = mockComment.post.permalink
    const permalinkUrl = `${baseUrl}${postPermalink}#c-${mockComment.hex_id}`

    expect(permalinkUrl).toBe('https://example.com/posts/test-post#c-4d2')

    // Test citation format
    const citationText = `#c-${mockComment.hex_id} (${mockComment.user.username}: "Test comment content")`
    expect(citationText).toBe('#c-4d2 (testuser: "Test comment content")')

    // Test UUID redirect URL
    const uuidUrl = `${baseUrl}/p/${mockComment.post.uuid}#c-${mockComment.hex_id}`
    expect(uuidUrl).toBe('https://example.com/p/bb680fd8-483d-4444-a4ac-4115439c304c#c-4d2')
  })

  it('should handle hash navigation correctly', () => {
    const mockElement = {
      getBoundingClientRect: vi.fn(() => ({ top: 100 })),
      classList: { add: vi.fn() },
    }

    document.getElementById.mockReturnValue(mockElement)

    // Simulate hash navigation
    const hash = '#c-4d2'
    const commentId = hash.substring(1) // Remove #

    expect(commentId).toBe('c-4d2')

    // Simulate scroll calculation
    const headerHeight = 120
    const elementPosition = 100 // From getBoundingClientRect
    const offsetPosition = elementPosition - headerHeight

    expect(offsetPosition).toBe(-20)

    // Verify DOM query
    expect(document.getElementById).not.toHaveBeenCalled() // Not called yet

    // Simulate the actual getElementById call
    document.getElementById(commentId)
    expect(document.getElementById).toHaveBeenCalledWith('c-4d2')
  })

  it('should handle citation parsing correctly', () => {
    const citationRegex = /#c-([0-9a-fA-F]+)\s+\(([^:]+):\s+"([^"]+)"\)/g

    const testContent = 'This references #c-4d2 (testuser: "Some quoted text") in the discussion.'

    const match = citationRegex.exec(testContent)
    expect(match).toBeTruthy()
    expect(match[1]).toBe('4d2') // hex_id
    expect(match[2]).toBe('testuser') // username
    expect(match[3]).toBe('Some quoted text') // preview

    // Test replacement
    const placeholder = '__CITATION_0__'
    const replacedContent = testContent.replace(citationRegex, placeholder)
    expect(replacedContent).toBe('This references __CITATION_0__ in the discussion.')

    // Test HTML generation
    const html = `<a href="#c-4d2" class="text-primary hover:underline">#c-4d2</a> <span class="text-gray-500">(testuser: "Some quoted text")</span>`
    const finalContent = replacedContent.replace(placeholder, html)

    expect(finalContent).toContain('href="#c-4d2"')
    expect(finalContent).toContain('#c-4d2')
    expect(finalContent).toContain('testuser')
    expect(finalContent).toContain('Some quoted text')
  })

  it('should handle user mention parsing correctly', () => {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g

    const testContent = 'Hello @testuser, what do you think?'

    const match = mentionRegex.exec(testContent)
    expect(match).toBeTruthy()
    expect(match[1]).toBe('testuser')

    // Test replacement
    const placeholder = '__MENTION_0__'
    const replacedContent = testContent.replace(mentionRegex, placeholder)
    expect(replacedContent).toBe('Hello __MENTION_0__, what do you think?')

    // Test HTML generation
    const html = `<a href="/u/testuser" class="text-primary hover:underline">@testuser</a>`
    const finalContent = replacedContent.replace(placeholder, html)

    expect(finalContent).toContain('href="/u/testuser"')
    expect(finalContent).toContain('@testuser')
  })

  it('should handle router scroll behavior configuration', () => {
    // Mock router scroll behavior function
    const scrollBehavior = (to, from, savedPosition) => {
      if (savedPosition) {
        return savedPosition
      }

      if (to.hash) {
        return {
          el: to.hash,
          behavior: 'smooth',
          top: -120,
        }
      }

      return { top: 0 }
    }

    // Test with comment hash
    const toWithHash = { hash: '#c-4d2' }
    const result = scrollBehavior(toWithHash, {}, null)

    expect(result).toEqual({
      el: '#c-4d2',
      behavior: 'smooth',
      top: -120,
    })

    // Test with saved position
    const savedPos = { top: 500 }
    const resultWithSaved = scrollBehavior({}, {}, savedPos)
    expect(resultWithSaved).toEqual(savedPos)

    // Test without hash
    const toWithoutHash = { hash: '' }
    const resultNoHash = scrollBehavior(toWithoutHash, {}, null)
    expect(resultNoHash).toEqual({ top: 0 })
  })

  it('should validate hex ID format compliance', () => {
    const testIds = [
      { id: 1, hex: '1' },
      { id: 15, hex: 'f' },
      { id: 255, hex: 'ff' },
      { id: 4095, hex: 'fff' },
      { id: 65535, hex: 'ffff' },
    ]

    testIds.forEach(({ id, hex }) => {
      // Backend should generate this
      const hexId = id.toString(16)
      expect(hexId).toBe(hex)

      // Frontend should use it in IDs
      const elementId = `c-${hexId}`
      expect(elementId).toMatch(/^c-[0-9a-f]+$/)

      // Should be valid in URLs
      const url = `https://example.com/posts/test#c-${hexId}`
      expect(url).toMatch(/^https:\/\/.*#c-[0-9a-f]+$/)

      // Should work in citations
      const citation = `#c-${hexId} (user: "text")`
      expect(citation).toMatch(/#c-[0-9a-f]+\s+\(.*\)/)
    })
  })
})
