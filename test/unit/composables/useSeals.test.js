import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSeals } from '~/composables/useSeals'

// Get mock API from global imports
const getMockApi = () => useNuxtApp().$api

describe('useSeals', () => {
  let mockApi

  beforeEach(() => {
    mockApi = getMockApi()
    vi.clearAllMocks()

    // Reset seals state before each test
    const seals = useSeals()
    seals.resetSeals()

    // Reset mock implementations to defaults
    mockApi.seals.getUserSeals.mockResolvedValue({
      data: { available_seals: 5, total_earned: 10, total_used: 5, last_awarded_at: null },
    })
    mockApi.seals.markPost.mockResolvedValue({
      data: {
        success: true,
        available_seals: 4,
        post: { recommended_seals_count: 1, advise_against_seals_count: 0 },
      },
    })
    mockApi.seals.unmarkPost.mockResolvedValue({
      data: {
        success: true,
        available_seals: 5,
        post: { recommended_seals_count: 0, advise_against_seals_count: 0 },
      },
    })
    mockApi.seals.markComment.mockResolvedValue({
      data: {
        success: true,
        available_seals: 4,
        comment: { recommended_seals_count: 1, advise_against_seals_count: 0 },
      },
    })
    mockApi.seals.unmarkComment.mockResolvedValue({
      data: {
        success: true,
        available_seals: 5,
        comment: { recommended_seals_count: 0, advise_against_seals_count: 0 },
      },
    })
  })

  describe('initial state', () => {
    it('should have null userSeals initially', () => {
      const seals = useSeals()
      expect(seals.userSeals.value).toBeNull()
    })

    it('should not be loading initially', () => {
      const seals = useSeals()
      expect(seals.loading.value).toBe(false)
    })

    it('should have no error initially', () => {
      const seals = useSeals()
      expect(seals.error.value).toBeNull()
    })
  })

  describe('fetchUserSeals', () => {
    it('should fetch and store user seals', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      expect(mockApi.seals.getUserSeals).toHaveBeenCalled()
      expect(seals.userSeals.value).toEqual({
        available_seals: 5,
        total_earned: 10,
        total_used: 5,
        last_awarded_at: null,
      })
    })

    it('should set loading state during fetch', async () => {
      const seals = useSeals()

      const fetchPromise = seals.fetchUserSeals()
      // Loading should be true during fetch
      expect(seals.loading.value).toBe(true)

      await fetchPromise
      // Loading should be false after fetch
      expect(seals.loading.value).toBe(false)
    })

    it('should not refetch if already fetched', async () => {
      const seals = useSeals()

      await seals.fetchUserSeals()
      await seals.fetchUserSeals()

      expect(mockApi.seals.getUserSeals).toHaveBeenCalledTimes(1)
    })

    it('should refetch if force is true', async () => {
      const seals = useSeals()

      await seals.fetchUserSeals()
      await seals.fetchUserSeals(true)

      expect(mockApi.seals.getUserSeals).toHaveBeenCalledTimes(2)
    })

    it('should not make duplicate requests if already loading', async () => {
      const seals = useSeals()

      // Start two fetches at the same time
      const fetch1 = seals.fetchUserSeals()
      const fetch2 = seals.fetchUserSeals()

      await Promise.all([fetch1, fetch2])

      expect(mockApi.seals.getUserSeals).toHaveBeenCalledTimes(1)
    })

    it('should handle fetch error', async () => {
      mockApi.seals.getUserSeals.mockRejectedValue(new Error('Network error'))

      const seals = useSeals()
      await seals.fetchUserSeals()

      expect(seals.error.value).toBe('Network error')
    })
  })

  describe('markPost', () => {
    it('should mark post as recommended', async () => {
      const seals = useSeals()
      // First fetch seals to populate userSeals
      await seals.fetchUserSeals()

      const result = await seals.markPost(123, 'recommended')

      expect(mockApi.seals.markPost).toHaveBeenCalledWith(123, 'recommended')
      expect(result.success).toBe(true)
      expect(seals.userSeals.value.available_seals).toBe(4)
    })

    it('should mark post as advise_against', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      await seals.markPost(123, 'advise_against')

      expect(mockApi.seals.markPost).toHaveBeenCalledWith(123, 'advise_against')
    })

    it('should handle mark post error', async () => {
      mockApi.seals.markPost.mockRejectedValue({
        response: { data: { message: 'No seals available' } },
      })

      const seals = useSeals()

      await expect(seals.markPost(123, 'recommended')).rejects.toBeDefined()
      expect(seals.error.value).toBe('No seals available')
    })
  })

  describe('unmarkPost', () => {
    it('should unmark post and refund seal', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      // First mark, then unmark
      await seals.markPost(123, 'recommended')
      const result = await seals.unmarkPost(123, 'recommended')

      expect(mockApi.seals.unmarkPost).toHaveBeenCalledWith(123, 'recommended')
      expect(result.success).toBe(true)
      expect(seals.userSeals.value.available_seals).toBe(5)
    })

    it('should handle unmark post error', async () => {
      mockApi.seals.unmarkPost.mockRejectedValue({
        response: { data: { message: 'Mark not found' } },
      })

      const seals = useSeals()

      await expect(seals.unmarkPost(123, 'recommended')).rejects.toBeDefined()
      expect(seals.error.value).toBe('Mark not found')
    })
  })

  describe('markComment', () => {
    it('should mark comment as recommended', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      const result = await seals.markComment(456, 'recommended')

      expect(mockApi.seals.markComment).toHaveBeenCalledWith(456, 'recommended')
      expect(result.success).toBe(true)
    })

    it('should update available seals after marking comment', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      await seals.markComment(456, 'recommended')

      expect(seals.userSeals.value.available_seals).toBe(4)
    })
  })

  describe('unmarkComment', () => {
    it('should unmark comment and refund seal', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      await seals.markComment(456, 'recommended')
      const result = await seals.unmarkComment(456, 'recommended')

      expect(mockApi.seals.unmarkComment).toHaveBeenCalledWith(456, 'recommended')
      expect(result.success).toBe(true)
      expect(seals.userSeals.value.available_seals).toBe(5)
    })
  })

  describe('checkUserMarks', () => {
    it('should check if user has marked content', async () => {
      const seals = useSeals()

      const result = await seals.checkUserMarks('post', 123)

      expect(mockApi.seals.checkUserMarks).toHaveBeenCalledWith('post', 123)
      expect(result).toEqual({ has_recommended: false, has_advise_against: false })
    })

    it('should return null on error', async () => {
      mockApi.seals.checkUserMarks.mockRejectedValue(new Error('Error'))

      const seals = useSeals()
      const result = await seals.checkUserMarks('post', 123)

      expect(result).toBeNull()
    })
  })

  describe('getPostMarks', () => {
    it('should get seal marks for a post', async () => {
      const seals = useSeals()

      const result = await seals.getPostMarks(123)

      expect(mockApi.seals.getPostMarks).toHaveBeenCalledWith(123)
      expect(result).toEqual({ recommended: [], advise_against: [] })
    })

    it('should return empty arrays on error', async () => {
      mockApi.seals.getPostMarks.mockRejectedValue(new Error('Error'))

      const seals = useSeals()
      const result = await seals.getPostMarks(123)

      expect(result).toEqual({ recommended: [], advise_against: [] })
    })
  })

  describe('getCommentMarks', () => {
    it('should get seal marks for a comment', async () => {
      const seals = useSeals()

      const result = await seals.getCommentMarks(456)

      expect(mockApi.seals.getCommentMarks).toHaveBeenCalledWith(456)
      expect(result).toEqual({ recommended: [], advise_against: [] })
    })

    it('should return empty arrays on error', async () => {
      mockApi.seals.getCommentMarks.mockRejectedValue(new Error('Error'))

      const seals = useSeals()
      const result = await seals.getCommentMarks(456)

      expect(result).toEqual({ recommended: [], advise_against: [] })
    })
  })

  describe('resetSeals', () => {
    it('should reset all seals state', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      seals.resetSeals()

      expect(seals.userSeals.value).toBeNull()
      expect(seals.loading.value).toBe(false)
      expect(seals.error.value).toBeNull()
    })

    it('should allow refetch after reset', async () => {
      const seals = useSeals()
      await seals.fetchUserSeals()

      seals.resetSeals()
      await seals.fetchUserSeals()

      expect(mockApi.seals.getUserSeals).toHaveBeenCalledTimes(2)
    })
  })

  describe('shared state', () => {
    it('should share state between multiple instances', async () => {
      const seals1 = useSeals()
      const seals2 = useSeals()

      await seals1.fetchUserSeals()

      // Both instances should see the same data
      expect(seals1.userSeals.value).toEqual(seals2.userSeals.value)
    })

    it('should share loading state', async () => {
      const seals1 = useSeals()
      const seals2 = useSeals()

      const fetchPromise = seals1.fetchUserSeals()

      // Both should show loading
      expect(seals1.loading.value).toBe(true)
      expect(seals2.loading.value).toBe(true)

      await fetchPromise

      expect(seals1.loading.value).toBe(false)
      expect(seals2.loading.value).toBe(false)
    })
  })

  describe('exposed API', () => {
    it('should expose all expected methods and properties', () => {
      const seals = useSeals()

      // State
      expect(seals.userSeals).toBeDefined()
      expect(seals.loading).toBeDefined()
      expect(seals.error).toBeDefined()

      // Methods
      expect(typeof seals.fetchUserSeals).toBe('function')
      expect(typeof seals.markPost).toBe('function')
      expect(typeof seals.unmarkPost).toBe('function')
      expect(typeof seals.markComment).toBe('function')
      expect(typeof seals.unmarkComment).toBe('function')
      expect(typeof seals.checkUserMarks).toBe('function')
      expect(typeof seals.getPostMarks).toBe('function')
      expect(typeof seals.getCommentMarks).toBe('function')
      expect(typeof seals.resetSeals).toBe('function')
    })
  })
})
