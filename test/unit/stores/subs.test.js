import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSubsStore } from '~/stores/subs'

// Mock posts store
vi.mock('~/stores/posts', () => ({
  usePostsStore: () => ({
    _transformPostData: (post) => ({ ...post, transformed: true }),
  }),
}))

// Get the mocked API from the global imports mock
const getMockApi = () => useNuxtApp().$api

describe('Subs Store', () => {
  let store
  let mockApi

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSubsStore()
    mockApi = getMockApi()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty subs array', () => {
      expect(store.subs).toEqual([])
    })

    it('should have null currentSub', () => {
      expect(store.currentSub).toBeNull()
    })

    it('should not be loading initially', () => {
      expect(store.loading).toBe(false)
    })

    it('should have trending as default active tab', () => {
      expect(store.activeTab).toBe('trending')
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      store.subs = [
        { id: 1, name: 'sub1', is_member: true, is_trending: true, is_popular: false },
        { id: 2, name: 'sub2', is_member: false, is_trending: true, is_popular: true },
        { id: 3, name: 'sub3', is_member: true, is_trending: false, is_popular: true },
      ]
    })

    it('getMySubs should return only member subs', () => {
      const mySubs = store.getMySubs
      expect(mySubs).toHaveLength(2)
      expect(mySubs.every((s) => s.is_member)).toBe(true)
    })

    it('getTrendingSubs should return trending subs', () => {
      const trending = store.getTrendingSubs
      expect(trending).toHaveLength(2)
      expect(trending.every((s) => s.is_trending)).toBe(true)
    })

    it('getPopularSubs should return popular subs', () => {
      const popular = store.getPopularSubs
      expect(popular).toHaveLength(2)
      expect(popular.every((s) => s.is_popular)).toBe(true)
    })
  })

  describe('fetchSubs', () => {
    it('should fetch and store subs', async () => {
      const mockResponse = {
        data: {
          data: [{ id: 1, name: 'test-sub' }],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 15 },
        },
      }

      mockApi.subs.getSubs.mockResolvedValue(mockResponse)
      await store.fetchSubs()

      expect(store.subs).toHaveLength(1)
      expect(store.subs[0].name).toBe('test-sub')
    })

    it('should update meta on successful fetch', async () => {
      const mockResponse = {
        data: {
          data: [],
          meta: { current_page: 2, last_page: 5, total: 75, per_page: 15 },
        },
      }

      mockApi.subs.getSubs.mockResolvedValue(mockResponse)
      await store.fetchSubs()

      expect(store.meta).toEqual({
        currentPage: 2,
        lastPage: 5,
        total: 75,
        perPage: 15,
      })
    })

    it('should pass params to API', async () => {
      mockApi.subs.getSubs.mockResolvedValue({ data: { data: [], meta: {} } })
      await store.fetchSubs({ search: 'test', sort: 'popular' })

      expect(mockApi.subs.getSubs).toHaveBeenCalledWith({ search: 'test', sort: 'popular' })
    })

    it('should handle error gracefully', async () => {
      mockApi.subs.getSubs.mockRejectedValue({
        response: { data: { message: 'Error fetching subs' } },
      })

      await expect(store.fetchSubs()).rejects.toBeDefined()
      expect(store.error).toBe('Error fetching subs')
    })
  })

  describe('fetchSub', () => {
    it('should fetch single sub by name', async () => {
      const mockSub = { id: 1, name: 'test-sub', title: 'Test Sub' }
      mockApi.subs.getSub.mockResolvedValue({ data: { data: mockSub } })

      const result = await store.fetchSub('test-sub')

      expect(result).toEqual(mockSub)
      expect(store.currentSub).toEqual(mockSub)
    })

    it('should fetch single sub by id', async () => {
      const mockSub = { id: 1, name: 'test-sub' }
      mockApi.subs.getSub.mockResolvedValue({ data: { data: mockSub } })

      await store.fetchSub(1)

      expect(mockApi.subs.getSub).toHaveBeenCalledWith(1)
    })
  })

  describe('fetchSubPosts', () => {
    it('should fetch and transform sub posts', async () => {
      const mockResponse = {
        data: {
          data: [{ id: 1, title: 'Post 1' }],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 10 },
        },
      }

      mockApi.subs.getSubPosts.mockResolvedValue(mockResponse)
      await store.fetchSubPosts(1)

      expect(store.subPosts).toHaveLength(1)
      expect(store.subPosts[0].transformed).toBe(true)
    })

    it('should update postsMeta', async () => {
      mockApi.subs.getSubPosts.mockResolvedValue({
        data: { data: [], meta: { current_page: 3, last_page: 10, total: 100, per_page: 10 } },
      })

      await store.fetchSubPosts(1)

      expect(store.postsMeta).toEqual({
        currentPage: 3,
        lastPage: 10,
        total: 100,
        perPage: 10,
      })
    })
  })

  describe('fetchSubRules', () => {
    it('should fetch sub rules', async () => {
      const mockRules = [{ id: 1, title: 'Be nice' }]
      mockApi.subs.getSubRules.mockResolvedValue({ data: mockRules })

      await store.fetchSubRules(1)

      expect(store.subRules).toEqual(mockRules)
    })

    it('should set empty array on error (non-critical)', async () => {
      mockApi.subs.getSubRules.mockRejectedValue(new Error('Failed'))

      await store.fetchSubRules(1)

      expect(store.subRules).toEqual([])
    })
  })

  describe('createSub', () => {
    it('should create sub and add to list', async () => {
      store.subs = [{ id: 1, name: 'existing' }]
      const newSub = { id: 2, name: 'new-sub' }
      mockApi.subs.createSub.mockResolvedValue({ data: newSub })

      const result = await store.createSub({ name: 'new-sub', title: 'New Sub' })

      expect(result).toEqual(newSub)
      expect(store.subs[0]).toEqual(newSub)
    })

    it('should not add to empty subs list', async () => {
      const newSub = { id: 1, name: 'new-sub' }
      mockApi.subs.createSub.mockResolvedValue({ data: newSub })

      await store.createSub({ name: 'new-sub' })

      expect(store.subs).toHaveLength(0)
    })
  })

  describe('updateSub', () => {
    it('should update currentSub if matches', async () => {
      store.currentSub = { id: 1, name: 'old-name' }
      const updated = { id: 1, name: 'new-name' }
      mockApi.subs.updateSub.mockResolvedValue({ data: updated })

      await store.updateSub(1, { name: 'new-name' })

      expect(store.currentSub).toEqual(updated)
    })

    it('should update sub in list if exists', async () => {
      store.subs = [{ id: 1, name: 'old-name' }]
      const updated = { id: 1, name: 'new-name' }
      mockApi.subs.updateSub.mockResolvedValue({ data: updated })

      await store.updateSub(1, { name: 'new-name' })

      expect(store.subs[0]).toEqual(updated)
    })

    it('should not update currentSub if different id', async () => {
      store.currentSub = { id: 2, name: 'other' }
      mockApi.subs.updateSub.mockResolvedValue({ data: { id: 1, name: 'updated' } })

      await store.updateSub(1, {})

      expect(store.currentSub).toEqual({ id: 2, name: 'other' })
    })
  })

  describe('deleteSub', () => {
    it('should remove sub from list', async () => {
      store.subs = [
        { id: 1, name: 'sub1' },
        { id: 2, name: 'sub2' },
      ]
      mockApi.subs.deleteSub.mockResolvedValue({})

      await store.deleteSub(1)

      expect(store.subs).toHaveLength(1)
      expect(store.subs[0].id).toBe(2)
    })

    it('should clear currentSub if deleted', async () => {
      store.currentSub = { id: 1, name: 'test' }
      mockApi.subs.deleteSub.mockResolvedValue({})

      await store.deleteSub(1)

      expect(store.currentSub).toBeNull()
    })
  })

  describe('joinSub', () => {
    it('should update member status on join', async () => {
      store.currentSub = { id: 1, is_member: false, members_count: 10 }
      store.subs = [{ id: 1, is_member: false, members_count: 10 }]
      mockApi.subs.joinSub.mockResolvedValue({})

      await store.joinSub(1)

      expect(store.currentSub.is_member).toBe(true)
      expect(store.currentSub.members_count).toBe(11)
      expect(store.subs[0].is_member).toBe(true)
      expect(store.subs[0].members_count).toBe(11)
    })

    it('should not update status on pending request (private sub)', async () => {
      store.currentSub = { id: 1, is_member: false, members_count: 10 }
      mockApi.subs.joinSub.mockResolvedValue({ request_pending: true })

      await store.joinSub(1, 'Please let me in')

      expect(store.currentSub.is_member).toBe(false)
      expect(store.currentSub.members_count).toBe(10)
    })
  })

  describe('leaveSub', () => {
    it('should update member status on leave', async () => {
      store.currentSub = { id: 1, is_member: true, members_count: 10 }
      store.subs = [{ id: 1, is_member: true, members_count: 10 }]
      mockApi.subs.leaveSub.mockResolvedValue({})

      await store.leaveSub(1)

      expect(store.currentSub.is_member).toBe(false)
      expect(store.currentSub.members_count).toBe(9)
      expect(store.subs[0].is_member).toBe(false)
    })

    it('should not go below 0 members', async () => {
      store.currentSub = { id: 1, is_member: true, members_count: 0 }
      mockApi.subs.leaveSub.mockResolvedValue({})

      await store.leaveSub(1)

      expect(store.currentSub.members_count).toBe(0)
    })
  })

  describe('utility actions', () => {
    it('setActiveTab should update active tab', () => {
      store.setActiveTab('popular')
      expect(store.activeTab).toBe('popular')
    })

    it('setSearchQuery should update search query', () => {
      store.setSearchQuery('test query')
      expect(store.searchQuery).toBe('test query')
    })

    it('clearError should reset error', () => {
      store.error = 'Some error'
      store.clearError()
      expect(store.error).toBeNull()
    })

    it('clearCurrentSub should reset current sub state', () => {
      store.currentSub = { id: 1 }
      store.subPosts = [{ id: 1 }]
      store.subRules = [{ id: 1 }]

      store.clearCurrentSub()

      expect(store.currentSub).toBeNull()
      expect(store.subPosts).toEqual([])
      expect(store.subRules).toEqual([])
    })
  })
})
