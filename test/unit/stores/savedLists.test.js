import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSavedListsStore } from '~/stores/savedLists'

// Get the mocked API from the global imports mock
const getMockApi = () => useNuxtApp().$api

describe('SavedLists Store', () => {
  let store
  let mockApi

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSavedListsStore()
    mockApi = getMockApi()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty lists array', () => {
      expect(store.lists).toEqual([])
    })

    it('should have null currentList', () => {
      expect(store.currentList).toBeNull()
    })

    it('should not be loading initially', () => {
      expect(store.loading).toBe(false)
    })

    it('should not be initialized', () => {
      expect(store.isInitialized).toBe(false)
    })

    it('should have empty favoritePostsIds set', () => {
      expect(store.favoritePostsIds.size).toBe(0)
    })

    it('should have empty readLaterPostsIds set', () => {
      expect(store.readLaterPostsIds.size).toBe(0)
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      store.lists = [
        { id: 1, type: 'favorite', name: 'Favoritos', posts_count: 5 },
        { id: 2, type: 'read_later', name: 'Leer más tarde', posts_count: 3 },
        { id: 3, type: 'custom', name: 'Mi lista', slug: 'mi-lista', uuid: 'abc-123' },
        { id: 4, type: 'custom', name: 'Otra lista', slug: 'otra-lista' },
      ]
      store.favoritePostsIds = new Set([1, 2, 3])
      store.readLaterPostsIds = new Set([4, 5])
    })

    it('favoritesList should return favorite type list', () => {
      expect(store.favoritesList).toEqual(store.lists[0])
    })

    it('readLaterList should return read_later type list', () => {
      expect(store.readLaterList).toEqual(store.lists[1])
    })

    it('customLists should return only custom type lists', () => {
      const customLists = store.customLists
      expect(customLists).toHaveLength(2)
      expect(customLists.every((l) => l.type === 'custom')).toBe(true)
    })

    it('isFavorite should check if post is in favorites', () => {
      expect(store.isFavorite(1)).toBe(true)
      expect(store.isFavorite(2)).toBe(true)
      expect(store.isFavorite(99)).toBe(false)
    })

    it('isReadLater should check if post is in read later', () => {
      expect(store.isReadLater(4)).toBe(true)
      expect(store.isReadLater(5)).toBe(true)
      expect(store.isReadLater(1)).toBe(false)
    })

    it('getListById should find list by id', () => {
      expect(store.getListById(3)).toEqual(store.lists[2])
      expect(store.getListById(999)).toBeUndefined()
    })

    it('getListByIdentifier should find by id, uuid, or slug', () => {
      expect(store.getListByIdentifier(3)).toEqual(store.lists[2])
      expect(store.getListByIdentifier('abc-123')).toEqual(store.lists[2])
      expect(store.getListByIdentifier('mi-lista')).toEqual(store.lists[2])
    })
  })

  describe('fetchLists', () => {
    it('should fetch and store lists', async () => {
      const mockLists = [
        { id: 1, type: 'favorite', posts: [{ id: 10 }, { id: 20 }] },
        { id: 2, type: 'read_later', posts: [{ id: 30 }] },
      ]

      mockApi.savedLists.getLists.mockResolvedValue({
        data: { data: mockLists },
      })

      await store.fetchLists()

      expect(store.lists).toEqual(mockLists)
      expect(store.favoritePostsIds.has(10)).toBe(true)
      expect(store.favoritePostsIds.has(20)).toBe(true)
      expect(store.readLaterPostsIds.has(30)).toBe(true)
    })

    it('should not refetch if lists already loaded', async () => {
      store.lists = [{ id: 1 }]

      await store.fetchLists()

      expect(mockApi.savedLists.getLists).not.toHaveBeenCalled()
    })

    it('should handle error gracefully', async () => {
      mockApi.savedLists.getLists.mockRejectedValue({
        response: { data: { message: 'Error loading lists' } },
      })

      await expect(store.fetchLists()).rejects.toBeDefined()
      expect(store.error).toBe('Error loading lists')
    })
  })

  describe('initialize', () => {
    it('should initialize store and set flag', async () => {
      mockApi.savedLists.getLists.mockResolvedValue({
        data: { data: [] },
      })

      await store.initialize()

      expect(store.isInitialized).toBe(true)
    })

    it('should not reinitialize if already initialized', async () => {
      store.isInitialized = true

      await store.initialize()

      expect(mockApi.savedLists.getLists).not.toHaveBeenCalled()
    })

    it('should not duplicate requests if already loading', async () => {
      store.loading = true

      await store.initialize()

      expect(mockApi.savedLists.getLists).not.toHaveBeenCalled()
    })
  })

  describe('fetchList', () => {
    it('should fetch single list by identifier', async () => {
      const mockList = { id: 1, name: 'Test List' }
      mockApi.savedLists.getList.mockResolvedValue({
        data: { data: mockList },
      })

      const result = await store.fetchList('test-slug')

      expect(result).toEqual(mockList)
      expect(store.currentList).toEqual(mockList)
    })
  })

  describe('fetchListPosts', () => {
    it('should fetch and transform list posts', async () => {
      const mockPosts = [
        { id: 1, title: 'Post 1', vote_count: 10, comment_count: 5 },
        { id: 2, title: 'Post 2', votes: 20, numComments: 8 },
      ]

      mockApi.savedLists.getListPosts.mockResolvedValue({
        data: {
          data: mockPosts,
          meta: { current_page: 1, last_page: 2, total: 30, per_page: 15 },
        },
      })

      await store.fetchListPosts('test-list')

      expect(store.currentListPosts).toHaveLength(2)
      expect(store.currentListPosts[0].votes).toBe(10)
      expect(store.currentListPosts[1].votes).toBe(20)
      expect(store.meta.total).toBe(30)
    })
  })

  describe('createList', () => {
    it('should create and add list to store', async () => {
      const newList = { id: 1, name: 'New List', type: 'custom' }
      mockApi.savedLists.createList.mockResolvedValue({
        data: { data: newList },
      })

      const result = await store.createList({ name: 'New List' })

      expect(result).toEqual(newList)
      expect(store.lists).toContainEqual(newList)
    })
  })

  describe('updateList', () => {
    it('should update list in store', async () => {
      store.lists = [{ id: 1, name: 'Old Name' }]
      const updatedList = { id: 1, name: 'New Name' }

      mockApi.savedLists.updateList.mockResolvedValue({
        data: { data: updatedList },
      })

      await store.updateList(1, { name: 'New Name' })

      expect(store.lists[0].name).toBe('New Name')
    })

    it('should update currentList if it matches', async () => {
      store.currentList = { id: 1, name: 'Old Name' }
      store.lists = [{ id: 1, name: 'Old Name' }]
      const updatedList = { id: 1, name: 'New Name' }

      mockApi.savedLists.updateList.mockResolvedValue({
        data: { data: updatedList },
      })

      await store.updateList(1, { name: 'New Name' })

      expect(store.currentList.name).toBe('New Name')
    })
  })

  describe('deleteList', () => {
    it('should remove list from store', async () => {
      store.lists = [
        { id: 1, name: 'List 1' },
        { id: 2, name: 'List 2' },
      ]

      mockApi.savedLists.deleteList.mockResolvedValue({})

      await store.deleteList(1)

      expect(store.lists).toHaveLength(1)
      expect(store.lists[0].id).toBe(2)
    })

    it('should clear currentList if deleted', async () => {
      store.lists = [{ id: 1, name: 'List 1' }]
      store.currentList = { id: 1, name: 'List 1' }
      store.currentListPosts = [{ id: 10 }]

      mockApi.savedLists.deleteList.mockResolvedValue({})

      await store.deleteList(1)

      expect(store.currentList).toBeNull()
      expect(store.currentListPosts).toEqual([])
    })
  })

  describe('addPostToList', () => {
    it('should add post and update counts', async () => {
      store.lists = [{ id: 1, type: 'favorite', posts_count: 5 }]

      mockApi.savedLists.addPostToList.mockResolvedValue({})

      await store.addPostToList(1, 100)

      expect(store.lists[0].posts_count).toBe(6)
      expect(store.favoritePostsIds.has(100)).toBe(true)
    })

    it('should add to readLaterPostsIds for read_later list', async () => {
      store.lists = [{ id: 1, type: 'read_later', posts_count: 2 }]

      mockApi.savedLists.addPostToList.mockResolvedValue({})

      await store.addPostToList(1, 50)

      expect(store.readLaterPostsIds.has(50)).toBe(true)
    })
  })

  describe('removePostFromList', () => {
    it('should remove post and update counts', async () => {
      store.lists = [{ id: 1, type: 'favorite', posts_count: 5 }]
      store.favoritePostsIds = new Set([100, 200])

      mockApi.savedLists.removePostFromList.mockResolvedValue({})

      await store.removePostFromList(1, 100)

      expect(store.lists[0].posts_count).toBe(4)
      expect(store.favoritePostsIds.has(100)).toBe(false)
    })

    it('should remove from currentListPosts', async () => {
      store.lists = [{ id: 1, type: 'custom', posts_count: 3 }]
      store.currentList = { id: 1, posts_count: 3 }
      store.currentListPosts = [{ id: 10 }, { id: 20 }, { id: 30 }]
      store.meta.total = 3

      mockApi.savedLists.removePostFromList.mockResolvedValue({})

      await store.removePostFromList(1, 20)

      expect(store.currentListPosts).toHaveLength(2)
      expect(store.currentListPosts.find((p) => p.id === 20)).toBeUndefined()
      expect(store.meta.total).toBe(2)
    })
  })

  describe('toggleFavorite', () => {
    it('should add to favorites when toggling on', async () => {
      store.lists = [{ id: 1, type: 'favorite', posts_count: 5 }]

      mockApi.savedLists.toggleFavorite.mockResolvedValue({
        data: { is_favorite: true },
      })

      const result = await store.toggleFavorite(100)

      expect(result).toBe(true)
      expect(store.favoritePostsIds.has(100)).toBe(true)
      expect(store.lists[0].posts_count).toBe(6)
    })

    it('should remove from favorites when toggling off', async () => {
      store.lists = [{ id: 1, type: 'favorite', posts_count: 5 }]
      store.favoritePostsIds = new Set([100])

      mockApi.savedLists.toggleFavorite.mockResolvedValue({
        data: { is_favorite: false },
      })

      const result = await store.toggleFavorite(100)

      expect(result).toBe(false)
      expect(store.favoritePostsIds.has(100)).toBe(false)
      expect(store.lists[0].posts_count).toBe(4)
    })
  })

  describe('toggleReadLater', () => {
    it('should add to read later when toggling on', async () => {
      store.lists = [{ id: 1, type: 'read_later', posts_count: 3 }]

      mockApi.savedLists.toggleReadLater.mockResolvedValue({
        data: { is_read_later: true },
      })

      const result = await store.toggleReadLater(50)

      expect(result).toBe(true)
      expect(store.readLaterPostsIds.has(50)).toBe(true)
      expect(store.lists[0].posts_count).toBe(4)
    })

    it('should remove from read later when toggling off', async () => {
      store.lists = [{ id: 1, type: 'read_later', posts_count: 3 }]
      store.readLaterPostsIds = new Set([50])

      mockApi.savedLists.toggleReadLater.mockResolvedValue({
        data: { is_read_later: false },
      })

      const result = await store.toggleReadLater(50)

      expect(result).toBe(false)
      expect(store.readLaterPostsIds.has(50)).toBe(false)
      expect(store.lists[0].posts_count).toBe(2)
    })
  })

  describe('clearList', () => {
    it('should clear list and reset counts', async () => {
      store.lists = [{ id: 1, type: 'favorite', posts_count: 10 }]
      store.favoritePostsIds = new Set([1, 2, 3])

      mockApi.savedLists.clearList.mockResolvedValue({})

      await store.clearList(1)

      expect(store.lists[0].posts_count).toBe(0)
      expect(store.favoritePostsIds.size).toBe(0)
    })

    it('should clear currentListPosts if matching', async () => {
      store.lists = [{ id: 1, type: 'custom', posts_count: 5 }]
      store.currentList = { id: 1, posts_count: 5 }
      store.currentListPosts = [{ id: 10 }, { id: 20 }]
      store.meta.total = 5

      mockApi.savedLists.clearList.mockResolvedValue({})

      await store.clearList(1)

      expect(store.currentList.posts_count).toBe(0)
      expect(store.currentListPosts).toEqual([])
      expect(store.meta.total).toBe(0)
    })
  })

  describe('fetchListByUsernameAndSlug', () => {
    it('should fetch list by username and slug', async () => {
      const mockList = { id: 1, name: 'User List', slug: 'my-list' }

      mockApi.savedLists.getListByUsernameAndSlug.mockResolvedValue({
        data: { data: mockList },
      })

      const result = await store.fetchListByUsernameAndSlug('testuser', 'my-list')

      expect(result).toEqual(mockList)
      expect(store.currentList).toEqual(mockList)
    })
  })
})
