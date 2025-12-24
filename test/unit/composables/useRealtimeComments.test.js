import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Remove global mock to test the real composable
vi.unmock('~/composables/useRealtimeComments')

// Mock useEcho
const mockListen = vi.fn()
const mockChannel = vi.fn(() => ({ listen: mockListen }))
const mockLeaveChannel = vi.fn()
const mockConnect = vi.fn()

vi.mock('~/composables/useEcho', () => ({
  useEcho: () => ({
    channel: mockChannel,
    leaveChannel: mockLeaveChannel,
    connect: mockConnect,
    isConnected: { value: true },
  }),
}))

// Import after mocks are set up
const { useRealtimeComments } = await import('~/composables/useRealtimeComments')

describe('useRealtimeComments', () => {
  let capturedHandler = null

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // Capture the event handler when listen is called
    mockListen.mockImplementation((event, handler) => {
      capturedHandler = handler
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    capturedHandler = null
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { newComments, pendingCount, lastCommentAt } = useRealtimeComments(null)

      expect(newComments.value).toEqual([])
      expect(pendingCount.value).toBe(0)
      expect(lastCommentAt.value).toBe(0)
    })

    it('should export markAsOwn function', () => {
      const { markAsOwn } = useRealtimeComments(null)
      expect(typeof markAsOwn).toBe('function')
    })
  })

  describe('markAsOwn', () => {
    it('should filter out own comments from notifications', () => {
      const { markAsOwn, pendingCount, subscribe } = useRealtimeComments(null)

      subscribe(123)

      // Mark comment 456 as own before it arrives via WebSocket
      markAsOwn(456)

      // Simulate receiving that same comment via WebSocket
      const event = {
        comment: {
          id: 456,
          content: 'Test comment',
          user: { id: 1, username: 'test' },
          created_at: new Date().toISOString(),
          votes_count: 0,
        },
        post_id: 123,
        parent_id: null,
        timestamp: Date.now(),
      }

      capturedHandler(event)

      // Should be ignored - pendingCount should remain 0
      expect(pendingCount.value).toBe(0)
    })

    it('should allow comments from other users', () => {
      const { markAsOwn, pendingCount, newComments, subscribe } = useRealtimeComments(null)

      subscribe(123)

      // Mark comment 456 as own
      markAsOwn(456)

      // Receive a different comment (789) via WebSocket
      const event = {
        comment: {
          id: 789,
          content: 'Someone else comment',
          user: { id: 2, username: 'other' },
          created_at: new Date().toISOString(),
          votes_count: 0,
        },
        post_id: 123,
        parent_id: null,
        timestamp: Date.now(),
      }

      capturedHandler(event)

      // Should be added
      expect(pendingCount.value).toBe(1)
      expect(newComments.value).toHaveLength(1)
      expect(newComments.value[0].id).toBe(789)
    })

    it('should clean up own comment IDs after 5 minutes', () => {
      const { markAsOwn, pendingCount, subscribe } = useRealtimeComments(null)

      subscribe(123)

      // Mark comment as own
      markAsOwn(456)

      const event = {
        comment: {
          id: 456,
          content: 'Test comment',
          user: { id: 1, username: 'test' },
          created_at: new Date().toISOString(),
          votes_count: 0,
        },
        post_id: 123,
        parent_id: null,
        timestamp: Date.now(),
      }

      // Verify it's being filtered initially
      capturedHandler(event)
      expect(pendingCount.value).toBe(0)

      // Advance time by 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000)

      // Now the same comment ID should be accepted (cleanup happened)
      capturedHandler(event)
      expect(pendingCount.value).toBe(1)
    })
  })

  describe('handleNewComment', () => {
    it('should ignore events without comment data', () => {
      const { pendingCount, subscribe } = useRealtimeComments(null)

      subscribe(123)

      capturedHandler({})
      capturedHandler({ comment: null })

      expect(pendingCount.value).toBe(0)
    })

    it('should add valid comments to pending list', () => {
      const { pendingCount, newComments, lastCommentAt, subscribe } = useRealtimeComments(null)

      subscribe(123)

      const timestamp = Date.now()
      const event = {
        comment: {
          id: 789,
          content: 'New comment',
          user: { id: 2, username: 'user2' },
          created_at: new Date().toISOString(),
          votes_count: 5,
        },
        post_id: 123,
        parent_id: null,
        timestamp,
      }

      capturedHandler(event)

      expect(pendingCount.value).toBe(1)
      expect(newComments.value).toHaveLength(1)
      expect(newComments.value[0]).toEqual(event.comment)
      expect(lastCommentAt.value).toBe(timestamp)
    })

    it('should call onNewComment callback when registered', () => {
      const { onNewComment, subscribe } = useRealtimeComments(null)
      const callback = vi.fn()

      subscribe(123)
      onNewComment(callback)

      const event = {
        comment: {
          id: 789,
          content: 'New comment',
          user: { id: 2, username: 'user2' },
          created_at: new Date().toISOString(),
          votes_count: 0,
        },
        post_id: 123,
        parent_id: null,
        timestamp: Date.now(),
      }

      capturedHandler(event)

      expect(callback).toHaveBeenCalledWith(event.comment)
    })

    it('should not call callback for own comments', () => {
      const { markAsOwn, onNewComment, subscribe } = useRealtimeComments(null)
      const callback = vi.fn()

      subscribe(123)
      onNewComment(callback)
      markAsOwn(456)

      const event = {
        comment: {
          id: 456,
          content: 'My own comment',
          user: { id: 1, username: 'me' },
          created_at: new Date().toISOString(),
          votes_count: 0,
        },
        post_id: 123,
        parent_id: null,
        timestamp: Date.now(),
      }

      capturedHandler(event)

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('clearPending', () => {
    it('should clear all pending comments', () => {
      const { pendingCount, newComments, clearPending, subscribe } = useRealtimeComments(null)

      subscribe(123)

      // Add some comments
      const event = {
        comment: {
          id: 789,
          content: 'Comment',
          user: { id: 2, username: 'user' },
          created_at: new Date().toISOString(),
          votes_count: 0,
        },
        post_id: 123,
        parent_id: null,
        timestamp: Date.now(),
      }

      capturedHandler(event)
      capturedHandler({ ...event, comment: { ...event.comment, id: 790 } })

      expect(pendingCount.value).toBe(2)
      expect(newComments.value).toHaveLength(2)

      clearPending()

      expect(pendingCount.value).toBe(0)
      expect(newComments.value).toHaveLength(0)
    })
  })

  describe('subscribe', () => {
    it('should subscribe to the correct channel', () => {
      const { subscribe } = useRealtimeComments(null)

      subscribe(123)

      expect(mockChannel).toHaveBeenCalledWith('post.123')
      expect(mockListen).toHaveBeenCalledWith('.comment.created', expect.any(Function))
    })

    it('should not subscribe with invalid post ID', () => {
      const { subscribe } = useRealtimeComments(null)

      mockChannel.mockClear()

      subscribe(0)
      subscribe(null)

      expect(mockChannel).not.toHaveBeenCalled()
    })

    it('should leave previous channel when subscribing to new one', () => {
      const { subscribe } = useRealtimeComments(null)

      subscribe(123)
      subscribe(456)

      expect(mockLeaveChannel).toHaveBeenCalledWith('post.123')
      expect(mockChannel).toHaveBeenLastCalledWith('post.456')
    })
  })
})
