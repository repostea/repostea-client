import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useVote } from '~/composables/useVote'

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  userKarma: 0,
}

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('useVote composable', () => {
  beforeEach(() => {
    // Reset mock values
    mockAuthStore.isAuthenticated = false
    mockAuthStore.userKarma = 0
  })

  describe('canVote', () => {
    it('should always allow voting (including guests)', () => {
      const { canVote } = useVote()
      expect(canVote.value).toBe(true)
    })

    it('should allow voting for authenticated users', () => {
      mockAuthStore.isAuthenticated = true
      const { canVote } = useVote()
      expect(canVote.value).toBe(true)
    })
  })

  describe('canDownvote', () => {
    it('should not allow guests to downvote', () => {
      mockAuthStore.isAuthenticated = false
      const { canDownvote } = useVote()
      expect(canDownvote.value).toBe(false)
    })

    it('should not allow authenticated users with low karma to downvote', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.userKarma = 5
      const { canDownvote } = useVote()
      expect(canDownvote.value).toBe(false)
    })

    it('should allow authenticated users with sufficient karma to downvote', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.userKarma = 8
      const { canDownvote } = useVote()
      expect(canDownvote.value).toBe(true)
    })

    it('should allow users with karma above threshold to downvote', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.userKarma = 100
      const { canDownvote } = useVote()
      expect(canDownvote.value).toBe(true)
    })

    it('should use custom karma threshold when provided', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.userKarma = 15
      const { canDownvote } = useVote(20)
      expect(canDownvote.value).toBe(false)

      mockAuthStore.userKarma = 25
      const { canDownvote: canDownvote2 } = useVote(20)
      expect(canDownvote2.value).toBe(true)
    })
  })

  describe('positiveVoteTypes', () => {
    it('should return array of positive vote types', () => {
      const { positiveVoteTypes } = useVote()
      expect(positiveVoteTypes).toHaveLength(4)
      expect(positiveVoteTypes.map((t) => t.value)).toEqual([
        'didactic',
        'interesting',
        'elaborate',
        'funny',
      ])
    })

    it('should have iconify icons for all positive vote types', () => {
      const { positiveVoteTypes } = useVote()
      positiveVoteTypes.forEach((type) => {
        expect(type.iconify).toBeTruthy()
        expect(type.iconify.startsWith('fa6-solid:')).toBe(true)
      })
    })

    it('should have icon colors for all positive vote types', () => {
      const { positiveVoteTypes } = useVote()
      positiveVoteTypes.forEach((type) => {
        expect(type.iconColor).toBeTruthy()
        expect(type.iconColor.startsWith('text-')).toBe(true)
      })
    })
  })

  describe('negativeVoteTypes', () => {
    it('should return array of negative vote types', () => {
      const { negativeVoteTypes } = useVote()
      expect(negativeVoteTypes).toHaveLength(4)
      expect(negativeVoteTypes.map((t) => t.value)).toEqual([
        'incomplete',
        'irrelevant',
        'false',
        'outofplace',
      ])
    })

    it('should have iconify icons for all negative vote types', () => {
      const { negativeVoteTypes } = useVote()
      negativeVoteTypes.forEach((type) => {
        expect(type.iconify).toBeTruthy()
        expect(type.iconify.startsWith('fa6-solid:')).toBe(true)
      })
    })
  })

  describe('getVoteTypeIconify', () => {
    it('should return iconify for positive vote type', () => {
      const { getVoteTypeIconify } = useVote()
      expect(getVoteTypeIconify('didactic')).toBe('fa6-solid:graduation-cap')
      expect(getVoteTypeIconify('funny')).toBe('fa6-solid:face-laugh')
    })

    it('should return iconify for negative vote type', () => {
      const { getVoteTypeIconify } = useVote()
      expect(getVoteTypeIconify('incomplete')).toBe('fa6-solid:scissors')
      expect(getVoteTypeIconify('false')).toBe('fa6-solid:circle-xmark')
    })

    it('should return empty string for unknown vote type', () => {
      const { getVoteTypeIconify } = useVote()
      expect(getVoteTypeIconify('unknown')).toBe('')
      expect(getVoteTypeIconify('')).toBe('')
    })
  })

  describe('getVoteTypeIconColor', () => {
    it('should return color for positive vote type', () => {
      const { getVoteTypeIconColor } = useVote()
      expect(getVoteTypeIconColor('didactic')).toBe('text-yellow-500')
      expect(getVoteTypeIconColor('interesting')).toBe('text-purple-500')
      expect(getVoteTypeIconColor('elaborate')).toBe('text-blue-500')
      expect(getVoteTypeIconColor('funny')).toBe('text-green-500')
    })

    it('should return color for negative vote type', () => {
      const { getVoteTypeIconColor } = useVote()
      expect(getVoteTypeIconColor('incomplete')).toBe('text-orange-500')
      expect(getVoteTypeIconColor('irrelevant')).toBe('text-gray-500')
      expect(getVoteTypeIconColor('false')).toBe('text-red-500')
      expect(getVoteTypeIconColor('outofplace')).toBe('text-pink-500')
    })

    it('should return empty string for unknown vote type', () => {
      const { getVoteTypeIconColor } = useVote()
      expect(getVoteTypeIconColor('unknown')).toBe('')
    })
  })

  describe('getVoteTypeClass', () => {
    it('should return green classes for positive votes', () => {
      const { getVoteTypeClass } = useVote()
      const result = getVoteTypeClass(1)
      expect(result).toContain('bg-green-100')
      expect(result).toContain('text-green-800')
      expect(result).toContain('dark:bg-green-900')
    })

    it('should return red classes for negative votes', () => {
      const { getVoteTypeClass } = useVote()
      const result = getVoteTypeClass(-1)
      expect(result).toContain('bg-red-100')
      expect(result).toContain('text-red-800')
      expect(result).toContain('dark:bg-red-900')
    })

    it('should return red classes for zero votes', () => {
      const { getVoteTypeClass } = useVote()
      const result = getVoteTypeClass(0)
      expect(result).toContain('bg-red-100')
    })
  })

  describe('isVoting', () => {
    it('should start as false', () => {
      const { isVoting } = useVote()
      expect(isVoting.value).toBe(false)
    })

    it('should be a reactive ref', () => {
      const { isVoting } = useVote()
      isVoting.value = true
      expect(isVoting.value).toBe(true)
    })
  })
})
