import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockUseNuxtApp = vi.fn()

vi.mock('#app', () => ({
  useNuxtApp: mockUseNuxtApp,
}))

describe('Posts Store', () => {
  let store
  let mockApi

  beforeEach(async () => {
    setActivePinia(createPinia())

    mockApi = {
      posts: {
        getPosts: vi.fn(),
        getFrontpage: vi.fn(),
        getPending: vi.fn(),
        getPost: vi.fn(),
        getPostBySlug: vi.fn(),
        getPostByUuid: vi.fn(),
        votePost: vi.fn(),
        unvotePost: vi.fn(),
        createPost: vi.fn(),
        importPost: vi.fn(),
      },
      media: {
        validateMediaUrl: vi.fn(),
        getMediaInfo: vi.fn(),
      },
    }

    mockUseNuxtApp.mockReturnValue({
      $api: mockApi,
    })

    const { usePostsStore } = await import('../../../stores/posts')
    store = usePostsStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('should initialize with default values', () => {
    expect(store.posts).toEqual([])
    expect(store.currentPost).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should update state after fetchPosts', async () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Test Post 1',
        content: 'Content 1',
        user: { username: 'user1' },
        vote_count: 10,
        user_vote: null,
      },
      {
        id: 2,
        title: 'Test Post 2',
        content: 'Content 2',
        user: { username: 'user2' },
        vote_count: 5,
        user_vote: null,
      },
    ]

    const mockResponse = {
      data: {
        data: mockPosts,
        meta: {
          current_page: 1,
          last_page: 2,
          total: 20,
          per_page: 10,
        },
      },
    }

    mockApi.posts.getPosts.mockResolvedValue(mockResponse)

    await store.fetchPosts()

    expect(store.loading).toBe(false)
    expect(store.posts.length).toBe(2)
    expect(store.posts[0].title).toBe('Test Post 1')
    expect(store.posts[0].votes).toBe(10)
    expect(store.posts[0].uv).toBe(10)
    expect(store.posts[0].dv).toBe(0)
    expect(store.meta.total).toBe(20)
    expect(store.meta.currentPage).toBe(1)
  })

  it('should handle fetchPosts failure', async () => {
    const mockError = new Error('Error loading posts')
    mockError.response = {
      data: {
        message: 'Error loading posts',
      },
    }

    mockApi.posts.getPosts.mockRejectedValue(mockError)

    await expect(store.fetchPosts()).rejects.toThrow()

    expect(store.loading).toBe(false)
    expect(store.error).toBe('Error loading posts')
    expect(store.posts).toEqual([])
  })

  it('should vote on a post correctly', async () => {
    store.posts = [{ id: 1, title: 'Test Post', votes: 5, userVote: null, uv: 5, dv: 0 }]
    store.currentPost = null

    mockApi.posts.votePost.mockResolvedValue({
      data: {
        votes: { total: 6, up: 6, down: 0 },
        user_vote: 1,
      },
    })

    await store.votePost(1, 1)

    expect(store.posts[0].votes).toEqual({ total: 6, up: 6, down: 0 })
    expect(store.posts[0].userVote).toBe(1)

    mockApi.posts.votePost.mockResolvedValue({
      data: {
        votes: { total: 4, up: 5, down: 1 },
        user_vote: -1,
      },
    })

    await store.votePost(1, -1)

    expect(store.posts[0].votes).toEqual({ total: 4, up: 5, down: 1 })
    expect(store.posts[0].userVote).toBe(-1)
  })

  it('should unvote on a post correctly', async () => {
    store.posts = [{ id: 1, title: 'Test Post', votes: 6, userVote: 1, uv: 6, dv: 0 }]
    store.currentPost = null

    mockApi.posts.unvotePost.mockResolvedValue({})
    vi.spyOn(store, 'generateFingerprint').mockResolvedValue('test-fp')

    await store.unvotePost(1)

    expect(store.posts[0].votes).toBe(5)
    expect(store.posts[0].uv).toBe(5)
    expect(store.posts[0].userVote).toBeNull()
    expect(mockApi.posts.unvotePost).toHaveBeenCalledWith(1, 'test-fp')
  })

  it('should create a post correctly', async () => {
    store.posts = [{ id: 1, title: 'Existing Post', votes: 5, userVote: null, uv: 5, dv: 0 }]

    const postData = {
      title: 'New Post',
      content: 'New Content',
      url: 'https://example.com',
    }

    const mockCreatedPost = {
      id: 3,
      title: 'New Post',
      content: 'New Content',
      url: 'https://example.com',
      vote_count: 0,
      user_vote: null,
      user: { username: 'newuser' },
    }

    mockApi.posts.createPost.mockResolvedValue({
      data: {
        data: mockCreatedPost,
      },
    })

    const result = await store.createPost(postData)

    expect(result.title).toBe('New Post')
    expect(result.votes).toBe(0)
    expect(store.posts.length).toBe(2)
    expect(store.posts[0].title).toBe('New Post')
  })

  it('should fetch frontpage posts', async () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Frontpage Post',
        content: 'Content',
        user: { username: 'user1' },
        vote_count: 10,
      },
    ]

    const mockResponse = {
      data: {
        data: mockPosts,
        meta: {
          current_page: 1,
          last_page: 1,
          total: 1,
          per_page: 25,
        },
      },
    }

    mockApi.posts.getFrontpage.mockResolvedValue(mockResponse)

    await store.fetchFrontpage()

    expect(store.currentSection).toBe('frontpage')
    expect(store.posts.length).toBe(1)
    expect(store.posts[0].title).toBe('Frontpage Post')
  })

  it('should fetch pending posts', async () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Pending Post',
        content: 'Content',
        user: { username: 'user1' },
        vote_count: 0,
      },
    ]

    const mockResponse = {
      data: {
        data: mockPosts,
        meta: {
          current_page: 1,
          last_page: 1,
          total: 1,
          per_page: 25,
        },
      },
    }

    mockApi.posts.getPending.mockResolvedValue(mockResponse)

    await store.fetchPending()

    expect(store.currentSection).toBe('pending')
    expect(store.pendingPosts.length).toBe(1)
    expect(store.posts.length).toBe(1)
    expect(store.posts[0].title).toBe('Pending Post')
  })
})
