// test/unit/composables/useAgoraMessage.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

import { useAgoraMessage } from '~/composables/useAgoraMessage'

// Mock the markdown utility
vi.mock('~/utils/markdown', () => ({
  extractEmbeds: vi.fn((content) => {
    if (!content) return []
    const embeds = []
    if (content.includes('youtube.com')) {
      embeds.push({ provider: 'youtube', url: 'https://youtube.com/watch?v=test' })
    }
    if (content.includes('twitter.com')) {
      embeds.push({ provider: 'twitter', url: 'https://twitter.com/user/status/123' })
    }
    return embeds
  }),
}))

describe('useAgoraMessage composable', () => {
  describe('canEdit', () => {
    it('returns true when user owns the message', () => {
      const message = ref({ id: 1, content: 'test', user: { id: 1 } })
      const authUser = ref({ id: 1, username: 'testuser' })

      const { canEdit } = useAgoraMessage(message, authUser)

      expect(canEdit.value).toBe(true)
    })

    it('returns false when user does not own the message', () => {
      const message = ref({ id: 1, content: 'test', user: { id: 2 } })
      const authUser = ref({ id: 1, username: 'testuser' })

      const { canEdit } = useAgoraMessage(message, authUser)

      expect(canEdit.value).toBe(false)
    })

    it('returns false when no auth user', () => {
      const message = ref({ id: 1, content: 'test', user: { id: 1 } })
      const authUser = ref(null)

      const { canEdit } = useAgoraMessage(message, authUser)

      expect(canEdit.value).toBe(false)
    })
  })

  describe('canDelete', () => {
    it('returns true when user owns the message', () => {
      const message = ref({ id: 1, content: 'test', user: { id: 1 } })
      const authUser = ref({ id: 1, username: 'testuser', isAdmin: false })

      const { canDelete } = useAgoraMessage(message, authUser)

      expect(canDelete.value).toBe(true)
    })

    it('returns true when user is admin', () => {
      const message = ref({ id: 1, content: 'test', user: { id: 2 } })
      const authUser = ref({ id: 1, username: 'admin', isAdmin: true })

      const { canDelete } = useAgoraMessage(message, authUser)

      expect(canDelete.value).toBe(true)
    })

    it('returns false when user is not owner and not admin', () => {
      const message = ref({ id: 1, content: 'test', user: { id: 2 } })
      const authUser = ref({ id: 1, username: 'testuser', isAdmin: false })

      const { canDelete } = useAgoraMessage(message, authUser)

      expect(canDelete.value).toBe(false)
    })
  })

  describe('isTopLevelMessage', () => {
    it('returns true for messages without parent_id', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)

      const { isTopLevelMessage } = useAgoraMessage(message, authUser)

      expect(isTopLevelMessage.value).toBe(true)
    })

    it('returns false for replies', () => {
      const message = ref({ id: 1, content: 'test', parent_id: 5 })
      const authUser = ref(null)

      const { isTopLevelMessage } = useAgoraMessage(message, authUser)

      expect(isTopLevelMessage.value).toBe(false)
    })
  })

  describe('totalRepliesCount', () => {
    it('uses server total_replies_count when available', () => {
      const message = ref({
        id: 1,
        content: 'test',
        total_replies_count: 50,
        replies: [{ id: 2 }],
      })
      const authUser = ref(null)

      const { totalRepliesCount } = useAgoraMessage(message, authUser)

      expect(totalRepliesCount.value).toBe(50)
    })

    it('falls back to counting loaded replies', () => {
      const message = ref({
        id: 1,
        content: 'test',
        replies: [{ id: 2, replies: [{ id: 3 }] }, { id: 4 }],
      })
      const authUser = ref(null)

      const { totalRepliesCount } = useAgoraMessage(message, authUser)

      expect(totalRepliesCount.value).toBe(3)
    })
  })

  describe('countAllReplies', () => {
    it('counts nested replies recursively', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)
      const { countAllReplies } = useAgoraMessage(message, authUser)

      const nestedMessage = {
        id: 1,
        replies: [{ id: 2, replies: [{ id: 3 }, { id: 4 }] }, { id: 5 }],
      }

      expect(countAllReplies(nestedMessage)).toBe(4)
    })

    it('returns 0 for null message', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)
      const { countAllReplies } = useAgoraMessage(message, authUser)

      expect(countAllReplies(null)).toBe(0)
    })
  })

  describe('flattenReplies', () => {
    it('flattens replies with depth info', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)
      const { flattenReplies } = useAgoraMessage(message, authUser)

      const replies = [
        { id: 1, content: 'reply 1', replies: [{ id: 2, content: 'nested' }] },
        { id: 3, content: 'reply 2' },
      ]

      const result = flattenReplies(replies)

      expect(result.length).toBe(3)
      expect(result[0]._depth).toBe(0)
      expect(result[1]._depth).toBe(1)
      expect(result[2]._depth).toBe(0)
    })

    it('limits to 10 replies', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)
      const { flattenReplies } = useAgoraMessage(message, authUser)

      const replies = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        content: `reply ${i + 1}`,
      }))

      const result = flattenReplies(replies)

      expect(result.length).toBe(10)
    })
  })

  describe('formatExpiryTime', () => {
    it('returns empty string for null', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)
      const { formatExpiryTime } = useAgoraMessage(message, authUser)

      expect(formatExpiryTime(null)).toBe('')
    })

    it('returns "expired" for past dates', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)
      const { formatExpiryTime } = useAgoraMessage(message, authUser)

      const pastDate = new Date(Date.now() - 1000 * 60 * 60)
      expect(formatExpiryTime(pastDate.toISOString())).toBe('expired')
    })

    it('formats days correctly', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)
      const { formatExpiryTime } = useAgoraMessage(message, authUser)

      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
      expect(formatExpiryTime(futureDate.toISOString())).toBe('3d')
    })
  })

  describe('messageEmbeds', () => {
    it('extracts embeds from message content', () => {
      const message = ref({
        id: 1,
        content: 'Check this: https://youtube.com/watch?v=test',
      })
      const authUser = ref(null)

      const { messageEmbeds } = useAgoraMessage(message, authUser)

      expect(messageEmbeds.value.length).toBe(1)
      expect(messageEmbeds.value[0].provider).toBe('youtube')
    })
  })

  describe('voteTypeSummary', () => {
    it('returns vote_type_summary from message', () => {
      const message = ref({
        id: 1,
        content: 'test',
        vote_type_summary: { interesting: 5, funny: 3 },
      })
      const authUser = ref(null)

      const { voteTypeSummary } = useAgoraMessage(message, authUser)

      expect(voteTypeSummary.value).toEqual({ interesting: 5, funny: 3 })
    })

    it('returns empty object when no summary', () => {
      const message = ref({ id: 1, content: 'test' })
      const authUser = ref(null)

      const { voteTypeSummary } = useAgoraMessage(message, authUser)

      expect(voteTypeSummary.value).toEqual({})
    })
  })
})
