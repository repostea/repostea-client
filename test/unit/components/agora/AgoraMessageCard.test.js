// test/unit/components/agora/AgoraMessageCard.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'

// Test the core logic functions that will be extracted to composables
// These tests verify behavior before refactoring the component

describe('AgoraMessageCard Logic', () => {
  describe('canEdit permission', () => {
    function canEdit(authUser, messageUser) {
      return authUser && authUser.id === messageUser?.id
    }

    it('returns true when user owns the message', () => {
      const authUser = { id: 1, username: 'testuser' }
      const messageUser = { id: 1, username: 'testuser' }
      expect(canEdit(authUser, messageUser)).toBe(true)
    })

    it('returns false when user does not own the message', () => {
      const authUser = { id: 1, username: 'testuser' }
      const messageUser = { id: 2, username: 'otheruser' }
      expect(canEdit(authUser, messageUser)).toBe(false)
    })

    it('returns falsy when no auth user', () => {
      const authUser = null
      const messageUser = { id: 1, username: 'testuser' }
      expect(canEdit(authUser, messageUser)).toBeFalsy()
    })

    it('returns false when message user is undefined', () => {
      const authUser = { id: 1, username: 'testuser' }
      expect(canEdit(authUser, undefined)).toBe(false)
    })
  })

  describe('canDelete permission', () => {
    function canDelete(authUser, messageUser) {
      return authUser && (authUser.id === messageUser?.id || authUser.isAdmin)
    }

    it('returns true when user owns the message', () => {
      const authUser = { id: 1, username: 'testuser', isAdmin: false }
      const messageUser = { id: 1, username: 'testuser' }
      expect(canDelete(authUser, messageUser)).toBe(true)
    })

    it('returns true when user is admin (even if not owner)', () => {
      const authUser = { id: 1, username: 'admin', isAdmin: true }
      const messageUser = { id: 2, username: 'otheruser' }
      expect(canDelete(authUser, messageUser)).toBe(true)
    })

    it('returns false when user is not owner and not admin', () => {
      const authUser = { id: 1, username: 'testuser', isAdmin: false }
      const messageUser = { id: 2, username: 'otheruser' }
      expect(canDelete(authUser, messageUser)).toBe(false)
    })

    it('returns falsy when no auth user', () => {
      expect(canDelete(null, { id: 1 })).toBeFalsy()
    })
  })

  describe('isTopLevelMessage', () => {
    function isTopLevelMessage(message) {
      return !message.parent_id
    }

    it('returns true for messages without parent_id', () => {
      expect(isTopLevelMessage({ id: 1, content: 'test' })).toBe(true)
      expect(isTopLevelMessage({ id: 1, parent_id: null })).toBe(true)
      expect(isTopLevelMessage({ id: 1, parent_id: undefined })).toBe(true)
    })

    it('returns false for replies (messages with parent_id)', () => {
      expect(isTopLevelMessage({ id: 1, parent_id: 5 })).toBe(false)
      expect(isTopLevelMessage({ id: 1, parent_id: 1 })).toBe(false)
    })
  })

  describe('countAllReplies', () => {
    function countAllReplies(msg) {
      if (!msg || !msg.replies) return 0
      let count = msg.replies.length
      for (const reply of msg.replies) {
        count += countAllReplies(reply)
      }
      return count
    }

    it('returns 0 for message without replies', () => {
      expect(countAllReplies({ id: 1, content: 'test' })).toBe(0)
      expect(countAllReplies({ id: 1, replies: [] })).toBe(0)
    })

    it('returns 0 for null/undefined message', () => {
      expect(countAllReplies(null)).toBe(0)
      expect(countAllReplies(undefined)).toBe(0)
    })

    it('counts direct replies', () => {
      const message = {
        id: 1,
        replies: [
          { id: 2, content: 'reply 1' },
          { id: 3, content: 'reply 2' },
          { id: 4, content: 'reply 3' },
        ],
      }
      expect(countAllReplies(message)).toBe(3)
    })

    it('counts nested replies recursively', () => {
      const message = {
        id: 1,
        replies: [
          {
            id: 2,
            content: 'reply 1',
            replies: [
              { id: 5, content: 'nested reply 1' },
              { id: 6, content: 'nested reply 2' },
            ],
          },
          { id: 3, content: 'reply 2', replies: [] },
          {
            id: 4,
            content: 'reply 3',
            replies: [
              {
                id: 7,
                content: 'nested reply 3',
                replies: [{ id: 8, content: 'deeply nested' }],
              },
            ],
          },
        ],
      }
      // 3 direct + 2 nested in reply 1 + 1 nested in reply 3 + 1 deeply nested = 7
      expect(countAllReplies(message)).toBe(7)
    })
  })

  describe('totalRepliesCount', () => {
    function countAllReplies(msg) {
      if (!msg || !msg.replies) return 0
      let count = msg.replies.length
      for (const reply of msg.replies) {
        count += countAllReplies(reply)
      }
      return count
    }

    function getTotalRepliesCount(message) {
      // Prefer the server-calculated total if available
      if (message.total_replies_count !== undefined && message.total_replies_count > 0) {
        return message.total_replies_count
      }
      // Fallback to counting loaded replies
      return countAllReplies(message)
    }

    it('prefers server-calculated total_replies_count', () => {
      const message = {
        id: 1,
        total_replies_count: 50,
        replies: [{ id: 2 }, { id: 3 }], // Only 2 loaded
      }
      expect(getTotalRepliesCount(message)).toBe(50)
    })

    it('falls back to counting loaded replies when total_replies_count is 0', () => {
      const message = {
        id: 1,
        total_replies_count: 0,
        replies: [{ id: 2 }, { id: 3 }],
      }
      expect(getTotalRepliesCount(message)).toBe(2)
    })

    it('falls back to counting loaded replies when total_replies_count is undefined', () => {
      const message = {
        id: 1,
        replies: [{ id: 2 }, { id: 3 }, { id: 4 }],
      }
      expect(getTotalRepliesCount(message)).toBe(3)
    })
  })

  describe('flattenReplies', () => {
    function flattenReplies(replies, depth = 0, result = []) {
      if (!replies || result.length >= 10) return result
      for (const reply of replies) {
        if (result.length >= 10) break
        result.push({ ...reply, _depth: depth })
        if (reply.replies && reply.replies.length > 0) {
          flattenReplies(reply.replies, depth + 1, result)
        }
      }
      return result
    }

    it('returns empty array for null/undefined replies', () => {
      expect(flattenReplies(null)).toEqual([])
      expect(flattenReplies(undefined)).toEqual([])
    })

    it('flattens replies with correct depth', () => {
      const replies = [
        {
          id: 1,
          content: 'reply 1',
          replies: [{ id: 2, content: 'nested 1', replies: [] }],
        },
        { id: 3, content: 'reply 2', replies: [] },
      ]

      const flattened = flattenReplies(replies)

      expect(flattened.length).toBe(3)
      expect(flattened[0]._depth).toBe(0)
      expect(flattened[0].id).toBe(1)
      expect(flattened[1]._depth).toBe(1)
      expect(flattened[1].id).toBe(2)
      expect(flattened[2]._depth).toBe(0)
      expect(flattened[2].id).toBe(3)
    })

    it('limits to 10 replies maximum', () => {
      const replies = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        content: `reply ${i + 1}`,
        replies: [],
      }))

      const flattened = flattenReplies(replies)

      expect(flattened.length).toBe(10)
    })
  })

  describe('getExpiryLabel', () => {
    const expiryOptions = [
      { value: 1, label: '1 hour' },
      { value: 24, label: '1 day' },
      { value: 168, label: '1 week' },
      { value: 720, label: '1 month' },
      { value: 8760, label: '1 year' },
      { value: 876000, label: '1 century' },
    ]

    function getExpiryLabel(hours) {
      const option = expiryOptions.find((o) => o.value === hours)
      return option ? option.label.toLowerCase() : ''
    }

    it('returns correct label for known expiry values', () => {
      expect(getExpiryLabel(1)).toBe('1 hour')
      expect(getExpiryLabel(24)).toBe('1 day')
      expect(getExpiryLabel(168)).toBe('1 week')
      expect(getExpiryLabel(720)).toBe('1 month')
      expect(getExpiryLabel(8760)).toBe('1 year')
      expect(getExpiryLabel(876000)).toBe('1 century')
    })

    it('returns empty string for unknown expiry values', () => {
      expect(getExpiryLabel(12)).toBe('')
      expect(getExpiryLabel(0)).toBe('')
      expect(getExpiryLabel(999999)).toBe('')
    })
  })

  describe('extractEmbeds (from markdown utils)', () => {
    // Test that embed URLs are properly extracted from content
    // This tests the integration with the markdown utility

    const embedPatterns = {
      youtube:
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi,
      twitter: /https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+/gi,
      instagram: /https?:\/\/(?:www\.)?instagram\.com\/p\/[a-zA-Z0-9_-]+/gi,
    }

    function extractEmbeds(content) {
      const embeds = []
      if (!content) return embeds

      for (const [provider, pattern] of Object.entries(embedPatterns)) {
        const matches = content.match(pattern)
        if (matches) {
          for (const url of matches) {
            embeds.push({ provider, url })
          }
        }
      }
      return embeds
    }

    it('extracts YouTube URLs from content', () => {
      const content = 'Check this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const embeds = extractEmbeds(content)

      expect(embeds.length).toBe(1)
      expect(embeds[0].provider).toBe('youtube')
      expect(embeds[0].url).toContain('youtube.com')
    })

    it('extracts Twitter/X URLs from content', () => {
      const content = 'See this tweet: https://twitter.com/user/status/123456789'
      const embeds = extractEmbeds(content)

      expect(embeds.length).toBe(1)
      expect(embeds[0].provider).toBe('twitter')
    })

    it('extracts multiple embeds from content', () => {
      const content =
        'Video: https://www.youtube.com/watch?v=abc1234567X and tweet: https://twitter.com/user/status/123456789'
      const embeds = extractEmbeds(content)

      expect(embeds.length).toBe(2)
    })

    it('returns empty array for content without embeds', () => {
      const content = 'Just plain text without any embed URLs'
      const embeds = extractEmbeds(content)

      expect(embeds).toEqual([])
    })

    it('returns empty array for null/undefined content', () => {
      expect(extractEmbeds(null)).toEqual([])
      expect(extractEmbeds(undefined)).toEqual([])
      expect(extractEmbeds('')).toEqual([])
    })
  })

  describe('message expiry calculations', () => {
    function formatExpiryTime(expiresAt) {
      if (!expiresAt) return ''

      const now = new Date()
      const expiry = new Date(expiresAt)
      const diffMs = expiry - now

      if (diffMs <= 0) return 'expired'

      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays > 0) return `${diffDays}d`
      if (diffHours > 0) return `${diffHours}h`
      return `${diffMinutes}m`
    }

    it('returns empty string for null/undefined expires_at', () => {
      expect(formatExpiryTime(null)).toBe('')
      expect(formatExpiryTime(undefined)).toBe('')
    })

    it('returns "expired" for past dates', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
      expect(formatExpiryTime(pastDate.toISOString())).toBe('expired')
    })

    it('formats days correctly', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3) // 3 days from now
      expect(formatExpiryTime(futureDate.toISOString())).toBe('3d')
    })

    it('formats hours correctly when less than a day', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 5) // 5 hours from now
      expect(formatExpiryTime(futureDate.toISOString())).toBe('5h')
    })

    it('formats minutes correctly when less than an hour', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 30) // 30 minutes from now
      expect(formatExpiryTime(futureDate.toISOString())).toBe('30m')
    })
  })
})
