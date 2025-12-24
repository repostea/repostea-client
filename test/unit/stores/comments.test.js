import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCommentsStore } from '~/stores/comments'

// Get the mocked API from the global imports mock
const getMockApi = () => useNuxtApp().$api

describe('Comments Store', () => {
  let store
  let mockApi

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCommentsStore()
    mockApi = getMockApi()
    vi.clearAllMocks()

    // Mock canvas for fingerprint generation
    const mockCanvas = {
      getContext: () => ({
        textBaseline: '',
        font: '',
        fillStyle: '',
        fillRect: vi.fn(),
        fillText: vi.fn(),
      }),
      toDataURL: () => 'data:image/png;base64,test',
    }
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') return mockCanvas
      return document.createElement(tag)
    })
  })

  describe('initial state', () => {
    it('should have empty comments array', () => {
      expect(store.comments).toEqual([])
    })

    it('should have null currentComment', () => {
      expect(store.currentComment).toBeNull()
    })

    it('should not be loading initially', () => {
      expect(store.loading).toBe(false)
    })

    it('should have no error initially', () => {
      expect(store.error).toBeNull()
    })

    it('should have default meta values', () => {
      expect(store.meta).toEqual({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 100,
      })
    })
  })

  describe('fetchComments', () => {
    it('should fetch and transform comments', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              content: 'Test comment',
              votes: 5,
              user_vote: 1,
              user_vote_type: 'interesting',
              is_anonymous: false,
              replies: [],
            },
          ],
          meta: {
            current_page: 1,
            last_page: 2,
            total: 50,
            per_page: 100,
          },
        },
      }

      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)

      await store.fetchComments(1)

      expect(store.loading).toBe(false)
      expect(store.comments).toHaveLength(1)
      expect(store.comments[0].id).toBe(1)
      expect(store.comments[0].hex_id).toBe('1')
      expect(store.comments[0].votes).toBe(5)
      expect(store.comments[0].userVote).toBe(1)
      expect(store.comments[0].userVoteType).toBe('interesting')
    })

    it('should generate hex_id from numeric id', async () => {
      const mockResponse = {
        data: {
          data: [{ id: 255, content: 'Test', replies: [] }],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        },
      }

      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)
      await store.fetchComments(1)

      expect(store.comments[0].hex_id).toBe('ff')
    })

    it('should transform array vote_details format', async () => {
      const voteDetails = [
        { user_id: 1, value: 1, type: 'interesting' },
        { user_id: 2, value: -1, type: 'irrelevant' },
      ]

      const mockResponse = {
        data: {
          data: [{ id: 1, vote_details: voteDetails, replies: [] }],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        },
      }

      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)
      await store.fetchComments(1)

      expect(store.comments[0].voteDetails).toEqual(voteDetails)
    })

    it('should transform object vote_details format (legacy)', async () => {
      const voteDetails = {
        interesting: 3,
        irrelevant: -2,
      }

      const mockResponse = {
        data: {
          data: [{ id: 1, vote_details: voteDetails, replies: [] }],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        },
      }

      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)
      await store.fetchComments(1)

      // Should have 5 entries (3 positive + 2 negative)
      expect(store.comments[0].voteDetails).toHaveLength(5)

      // Check positive votes
      const positiveVotes = store.comments[0].voteDetails.filter((v) => v.value === 1)
      expect(positiveVotes).toHaveLength(3)
      expect(positiveVotes.every((v) => v.type === 'interesting')).toBe(true)

      // Check negative votes
      const negativeVotes = store.comments[0].voteDetails.filter((v) => v.value === -1)
      expect(negativeVotes).toHaveLength(2)
      expect(negativeVotes.every((v) => v.type === 'irrelevant')).toBe(true)
    })

    it('should convert "unspecified" type to null in legacy format', async () => {
      const voteDetails = {
        unspecified: 2,
      }

      const mockResponse = {
        data: {
          data: [{ id: 1, vote_details: voteDetails, replies: [] }],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        },
      }

      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)
      await store.fetchComments(1)

      expect(store.comments[0].voteDetails[0].type).toBeNull()
    })

    it('should update meta on successful fetch', async () => {
      const mockResponse = {
        data: {
          data: [],
          meta: { current_page: 2, last_page: 5, total: 100, per_page: 20 },
        },
      }

      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)
      await store.fetchComments(1, 2)

      expect(store.meta).toEqual({
        currentPage: 2,
        lastPage: 5,
        total: 100,
        perPage: 20,
      })
    })

    it('should handle error gracefully', async () => {
      mockApi.comments.getPostComments.mockRejectedValue({
        response: { data: { message: 'Server error' } },
      })

      const result = await store.fetchComments(1)

      expect(store.error).toBe('Server error')
      expect(result).toEqual([])
      expect(store.loading).toBe(false)
    })
  })

  describe('_formatReplies', () => {
    it('should format nested replies recursively', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              content: 'Parent',
              replies: [
                {
                  id: 2,
                  content: 'Child',
                  parent_id: 1,
                  replies: [{ id: 3, content: 'Grandchild', parent_id: 2, replies: [] }],
                },
              ],
            },
          ],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        },
      }

      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)
      await store.fetchComments(1)

      expect(store.comments[0].children).toHaveLength(1)
      expect(store.comments[0].children[0].id).toBe(2)
      expect(store.comments[0].children[0].children).toHaveLength(1)
      expect(store.comments[0].children[0].children[0].id).toBe(3)
    })
  })

  describe('_organizeCommentsHierarchy', () => {
    it('should return flat comments when no parent relationships', () => {
      const comments = [
        { id: 1, parentId: null, children: [] },
        { id: 2, parentId: null, children: [] },
      ]

      const result = store._organizeCommentsHierarchy(comments)
      expect(result).toHaveLength(2)
    })

    it('should organize comments into parent-child relationships', () => {
      const comments = [
        { id: 1, parentId: null, children: [] },
        { id: 2, parentId: 1, children: [] },
        { id: 3, parentId: 1, children: [] },
      ]

      const result = store._organizeCommentsHierarchy(comments)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].children).toHaveLength(2)
    })
  })

  describe('findCommentById', () => {
    beforeEach(async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 1,
              replies: [{ id: 2, replies: [{ id: 3, replies: [] }] }],
            },
          ],
          meta: { current_page: 1, last_page: 1, total: 1, per_page: 100 },
        },
      }
      mockApi.comments.getPostComments.mockResolvedValue(mockResponse)
      await store.fetchComments(1)
    })

    it('should find root comment', () => {
      const comment = store.findCommentById(1)
      expect(comment).toBeTruthy()
      expect(comment.id).toBe(1)
    })

    it('should find nested comment', () => {
      const comment = store.findCommentById(2)
      expect(comment).toBeTruthy()
      expect(comment.id).toBe(2)
    })

    it('should find deeply nested comment', () => {
      const comment = store.findCommentById(3)
      expect(comment).toBeTruthy()
      expect(comment.id).toBe(3)
    })

    it('should return null for non-existent comment', () => {
      const comment = store.findCommentById(999)
      expect(comment).toBeNull()
    })
  })

  describe('createComment', () => {
    it('should add top-level comment to end of list', async () => {
      // Initialize with existing comment
      store.comments = [{ id: 1, content: 'Existing', children: [] }]

      mockApi.comments.createComment.mockResolvedValue({
        data: {
          data: { id: 2, content: 'New comment', parent_id: null },
        },
      })

      await store.createComment(1, { content: 'New comment' })

      expect(store.comments).toHaveLength(2)
      expect(store.comments[1].id).toBe(2)
    })

    it('should add reply to parent comment', async () => {
      store.comments = [{ id: 1, content: 'Parent', children: [] }]

      mockApi.comments.createComment.mockResolvedValue({
        data: {
          data: { id: 2, content: 'Reply', parent_id: 1 },
        },
      })

      await store.createComment(1, { content: 'Reply', parentId: 1 })

      expect(store.comments[0].children).toHaveLength(1)
      expect(store.comments[0].children[0].id).toBe(2)
    })

    it('should convert camelCase to snake_case for backend', async () => {
      mockApi.comments.createComment.mockResolvedValue({
        data: { data: { id: 1 } },
      })

      await store.createComment(1, {
        content: 'Test',
        authorName: 'Guest',
        parentId: 5,
      })

      expect(mockApi.comments.createComment).toHaveBeenCalledWith(1, {
        content: 'Test',
        author_name: 'Guest',
        parent_id: 5,
      })
    })
  })

  describe('voteComment', () => {
    beforeEach(() => {
      store.comments = [{ id: 1, votes: 0, userVote: null, children: [] }]
    })

    it('should update comment vote count', async () => {
      mockApi.comments.voteComment.mockResolvedValue({
        data: {
          data: {
            votes: 5,
            user_vote: 1,
            user_vote_type: 'interesting',
            stats: { votes_count: 5 },
          },
        },
      })

      await store.voteComment(1, 1, 'interesting')

      expect(store.comments[0].votes).toBe(5)
      expect(store.comments[0].userVote).toBe(1)
      expect(store.comments[0].userVoteType).toBe('interesting')
    })

    it('should update nested comment vote', async () => {
      store.comments = [
        {
          id: 1,
          children: [{ id: 2, votes: 0, userVote: null, children: [] }],
        },
      ]

      mockApi.comments.voteComment.mockResolvedValue({
        data: {
          data: {
            votes: 3,
            user_vote: 1,
            stats: { votes_count: 3 },
          },
        },
      })

      await store.voteComment(2, 1)

      expect(store.comments[0].children[0].votes).toBe(3)
    })
  })

  describe('unvoteComment', () => {
    it('should reset user vote', async () => {
      store.comments = [{ id: 1, votes: 5, userVote: 1, userVoteType: 'funny', children: [] }]

      mockApi.comments.unvoteComment.mockResolvedValue({
        data: {
          data: {
            votes: 4,
            stats: { votes_count: 4 },
          },
        },
      })

      await store.unvoteComment(1)

      expect(store.comments[0].votes).toBe(4)
      expect(store.comments[0].userVote).toBeNull()
      expect(store.comments[0].userVoteType).toBeNull()
    })
  })

  describe('generateFingerprint', () => {
    it('should generate a base64 encoded fingerprint', async () => {
      const fingerprint = await store.generateFingerprint()
      expect(fingerprint).toBeTruthy()
      expect(typeof fingerprint).toBe('string')
    })
  })
})
