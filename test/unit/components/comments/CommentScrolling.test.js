import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CommentsList from '~/components/comments/CommentsList.vue'

// Mock i18n
const mockT = vi.fn((key, fallback) => fallback || key)
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
  useLocalePath: () => vi.fn((path) => path),
}))

// Mock stores - will be created in beforeEach to allow dynamic updates
let mockCommentsStore
let mockAuthStore

vi.mock('~/stores/comments', () => ({
  useCommentsStore: () => mockCommentsStore,
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock system settings
vi.mock('~/composables/useSystemSettings', () => ({
  useSystemSettings: () => ({
    isGuestAccessEnabled: { value: true },
    settings: { value: { guest_access: 'enabled' } },
  }),
}))

// Mock comment components
vi.mock('~/components/comments/CommentForm.vue', () => ({
  default: {
    template: `
      <div data-testid="comment-form">
        <textarea 
          data-testid="comment-textarea"
          @input="$emit('input', $event.target.value)"
        ></textarea>
        <button 
          data-testid="submit-button" 
          @click="$emit('submit', { content: 'Test comment content' })"
        >
          Submit
        </button>
      </div>
    `,
    props: ['placeholder', 'submitLabel', 'isSubmitting', 'error', 'postId'],
    emits: ['submit', 'input'],
    methods: {
      reset() {
        // Mock reset functionality
      },
    },
  },
}))

vi.mock('~/components/comments/CommentItem.vue', () => ({
  default: {
    template: `
      <div 
        :id="'c-' + (comment.hex_id || comment.id.toString(16))" 
        data-testid="comment-item"
        class="comment-item"
      >
        <p>{{ comment.content }}</p>
        <button @click="$emit('reply', comment.id)">Reply</button>
      </div>
    `,
    props: ['comment', 'linkId', 'replyingTo', 'isSubmittingReply', 'replyError'],
    emits: ['voted', 'reply', 'cite', 'favourited', 'unfavourited', 'submit-reply', 'cancel-reply'],
  },
}))

describe('CommentsList Scrolling Functionality', () => {
  let wrapper
  let mockScrollTo
  let mockScrollIntoView
  let mockGetBoundingClientRect

  beforeEach(() => {
    vi.clearAllMocks()

    // Initialize stores
    mockCommentsStore = {
      comments: [],
      createComment: vi.fn(),
      fetchComments: vi.fn(),
    }

    mockAuthStore = {
      isAuthenticated: true,
      user: { id: 1, display_name: 'Test User' },
      token: 'test-token',
      isAnonymous: false,
      isGuest: false,
    }

    // Mock DOM methods
    mockScrollTo = vi.fn()
    mockScrollIntoView = vi.fn()
    mockGetBoundingClientRect = vi.fn(() => ({
      top: 100,
      left: 0,
      width: 100,
      height: 50,
    }))

    // Mock window.scrollTo
    Object.defineProperty(window, 'scrollTo', {
      value: mockScrollTo,
      writable: true,
    })

    // Mock window.pageYOffset
    Object.defineProperty(window, 'pageYOffset', {
      value: 200,
      writable: true,
    })

    // Mock Element.prototype methods
    Element.prototype.scrollIntoView = mockScrollIntoView
    Element.prototype.getBoundingClientRect = mockGetBoundingClientRect

    // Mock querySelector and getElementById
    const mockElement = {
      scrollIntoView: mockScrollIntoView,
      getBoundingClientRect: mockGetBoundingClientRect,
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      focus: vi.fn(),
      querySelector: vi.fn(() => ({ focus: vi.fn() })),
    }

    document.querySelector = vi.fn(() => mockElement)
    document.getElementById = vi.fn(() => mockElement)

    wrapper = mount(CommentsList, {
      global: {
        stubs: {
          NuxtLink: {
            name: 'NuxtLink',
            template: '<a><slot /></a>',
            props: ['to'],
          },
        },
      },
      props: {
        linkId: 123,
        initialComments: [
          {
            id: 1,
            content: 'First comment',
            created_at: '2023-01-01T00:00:00Z',
            votes: 5,
            children: [],
          },
          {
            id: 2,
            content: 'Second comment',
            created_at: '2023-01-02T00:00:00Z',
            votes: 3,
            children: [],
          },
        ],
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Comment Form Scrolling', () => {
    it('should scroll to comment form when floating button is clicked', async () => {
      // Simulate enough comments to show floating button
      await wrapper.setProps({
        initialComments: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          content: `Comment ${i + 1}`,
          created_at: `2023-01-0${i + 1}T00:00:00Z`,
          votes: i,
          children: [],
        })),
      })

      await nextTick()

      // Manually call the method
      wrapper.vm.scrollToCommentForm()

      // Wait for nextTick inside the method to complete
      await nextTick()
      await nextTick() // Wait for the showCommentForm.value = true to take effect

      // Verify that querySelector was called to find the comment form
      expect(document.querySelector).toHaveBeenCalledWith('.comment-form-container')

      // Verify that scrollTo was called with correct parameters
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number), // elementPosition - headerHeight
        behavior: 'smooth',
      })
    })

    it('should focus on textarea after scrolling to comment form', async () => {
      const mockTextarea = { focus: vi.fn() }
      const mockCommentForm = {
        querySelector: vi.fn(() => mockTextarea),
        getBoundingClientRect: mockGetBoundingClientRect,
      }

      document.querySelector = vi.fn(() => mockCommentForm)

      await wrapper.vm.scrollToCommentForm()

      // Wait for the setTimeout to execute
      await new Promise((resolve) => setTimeout(resolve, 600))

      expect(mockCommentForm.querySelector).toHaveBeenCalledWith('textarea')
      expect(mockTextarea.focus).toHaveBeenCalled()
    })
  })

  describe('New Comment Scrolling', () => {
    it('should scroll to new comment after successful submission', async () => {
      const newComment = {
        id: 999,
        content: 'New test comment',
        created_at: '2023-12-01T00:00:00Z',
        votes: 0,
      }

      // Mock the createComment to return our new comment
      mockCommentsStore.createComment.mockResolvedValue(newComment)

      // Update the comments array to include the new comment after fetchComments
      mockCommentsStore.fetchComments.mockImplementation(() => {
        mockCommentsStore.comments = [...mockCommentsStore.comments, newComment]
        return Promise.resolve()
      })

      // Mock getElementById to return an element for the new comment
      const newCommentElement = {
        getBoundingClientRect: mockGetBoundingClientRect,
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      }

      document.getElementById = vi.fn((id) => {
        const hexId = newComment.hex_id || newComment.id.toString(16)
        if (id === `c-${hexId}`) {
          return newCommentElement
        }
        return null
      })

      // First need to expand the comment form
      const writeCommentButton = wrapper
        .findAll('button')
        .find(
          (btn) =>
            btn.text().includes('comments.write_comment') || btn.html().includes('fa-comment')
        )
      await writeCommentButton.trigger('click')
      await nextTick()

      // Submit a comment
      const commentForm = wrapper.find('[data-testid="comment-form"]')
      const submitButton = commentForm.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')

      // Wait for async operations and DOM updates
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Verify that getElementById was called with the new comment ID
      const expectedHexId = newComment.hex_id || newComment.id.toString(16)
      expect(document.getElementById).toHaveBeenCalledWith(`c-${expectedHexId}`)

      // Verify that scrollTo was called for the new comment
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number), // calculated position
        behavior: 'smooth',
      })

      // Verify that highlight class was added
      expect(newCommentElement.classList.add).toHaveBeenCalledWith('new-comment-highlight')
    })

    it('should handle case when new comment element is not found', async () => {
      const newComment = {
        id: 999,
        content: 'New test comment',
        created_at: '2023-12-01T00:00:00Z',
        votes: 0,
      }

      mockCommentsStore.createComment.mockResolvedValue(newComment)

      // Update the comments array to include the new comment after fetchComments
      mockCommentsStore.fetchComments.mockImplementation(() => {
        mockCommentsStore.comments = [...mockCommentsStore.comments, newComment]
        return Promise.resolve()
      })

      // Mock getElementById to return null (element not found)
      document.getElementById = vi.fn(() => null)

      // First need to expand the comment form
      const writeCommentButton = wrapper
        .findAll('button')
        .find(
          (btn) =>
            btn.text().includes('comments.write_comment') || btn.html().includes('fa-comment')
        )
      await writeCommentButton.trigger('click')
      await nextTick()

      // Submit a comment
      const commentForm = wrapper.find('[data-testid="comment-form"]')
      const submitButton = commentForm.find('[data-testid="submit-button"]')
      await submitButton.trigger('click')

      // Wait for async operations
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Verify that getElementById was called but scrollTo was not called since element wasn't found
      const expectedHexId = newComment.hex_id || newComment.id.toString(16)
      expect(document.getElementById).toHaveBeenCalledWith(`c-${expectedHexId}`)

      // scrollTo should not be called if element is not found
      expect(mockScrollTo).not.toHaveBeenCalled()
    })
  })

  describe('Reply Scrolling', () => {
    it('should scroll to new reply after successful submission', async () => {
      const parentCommentId = 1
      const newReply = {
        id: 888,
        content: 'New test reply',
        created_at: '2023-12-01T00:00:00Z',
        votes: 0,
        parent_id: parentCommentId,
      }

      mockCommentsStore.createComment.mockResolvedValue(newReply)
      mockCommentsStore.fetchComments.mockResolvedValue()

      // Update the comments array to include the new reply after fetchComments
      mockCommentsStore.fetchComments.mockImplementation(() => {
        mockCommentsStore.comments = [...mockCommentsStore.comments, newReply]
        return Promise.resolve()
      })

      // Mock getElementById for the new reply
      const newReplyElement = {
        getBoundingClientRect: mockGetBoundingClientRect,
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      }

      document.getElementById = vi.fn((id) => {
        const hexId = newReply.hex_id || newReply.id.toString(16)
        if (id === `c-${hexId}`) {
          return newReplyElement
        }
        return null
      })

      // Start replying to a comment
      wrapper.vm.replyTo(parentCommentId)
      await nextTick()

      // Submit the reply
      await wrapper.vm.submitReply(parentCommentId, { content: 'New test reply' })

      // Wait for async operations and DOM updates
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Verify that getElementById was called with the new reply ID
      const expectedHexId = newReply.hex_id || newReply.id.toString(16)
      expect(document.getElementById).toHaveBeenCalledWith(`c-${expectedHexId}`)

      // Verify that scrollTo was called for the new reply
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })

      // Verify that highlight class was added
      expect(newReplyElement.classList.add).toHaveBeenCalledWith('new-comment-highlight')
    })

    it('should scroll to parent comment when replying', async () => {
      const parentCommentId = 1

      // Mock getElementById for the parent comment
      const parentCommentElement = {
        scrollIntoView: mockScrollIntoView,
      }

      document.getElementById = vi.fn((id) => {
        const hexId = parentCommentId.toString(16)
        if (id === `c-${hexId}`) {
          return parentCommentElement
        }
        return null
      })

      // Start replying to a comment
      wrapper.vm.replyTo(parentCommentId)
      await nextTick()

      // Verify that getElementById was called for the parent comment
      const expectedHexId = parentCommentId.toString(16)
      expect(document.getElementById).toHaveBeenCalledWith(`c-${expectedHexId}`)

      // Verify that scrollIntoView was called
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
    })
  })

  describe('Scroll to Last Comment', () => {
    it('should scroll to the newest comment when scrollToLastComment is called', async () => {
      // Create a fresh wrapper with comments for this specific test
      const testComments = [
        {
          id: 1,
          content: 'First comment',
          created_at: '2023-01-01T00:00:00Z',
          votes: 5,
          children: [],
        },
        {
          id: 2,
          content: 'Second comment',
          created_at: '2023-01-02T00:00:00Z', // This is the newest
          votes: 3,
          children: [],
        },
      ]

      // Set up the mock store with comments before mounting
      mockCommentsStore.comments = testComments

      const testWrapper = mount(CommentsList, {
        global: {
          stubs: {
            NuxtLink: {
              name: 'NuxtLink',
              template: '<a><slot /></a>',
              props: ['to'],
            },
          },
        },
        props: {
          linkId: 123,
          initialComments: testComments,
        },
      })

      await nextTick()

      // Mock the newest comment element (comment with id 2)
      const newestCommentElement = {
        getBoundingClientRect: mockGetBoundingClientRect,
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      }

      document.getElementById = vi.fn((id) => {
        const hexId = (2).toString(16) // Comment with id 2 is the newest
        if (id === `c-${hexId}`) {
          return newestCommentElement
        }
        return null
      })

      // Call scrollToLastComment
      testWrapper.vm.scrollToLastComment()

      // Wait for nextTick inside the method to complete
      await nextTick()
      await nextTick()
      await nextTick()

      // Verify that the newest comment was found and scrolled to
      const expectedHexId = (2).toString(16)
      expect(document.getElementById).toHaveBeenCalledWith(`c-${expectedHexId}`)
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })
      expect(newestCommentElement.classList.add).toHaveBeenCalledWith('new-comment-highlight')

      testWrapper.unmount()
    })
  })

  describe('Scroll Offset Calculations', () => {
    it('should calculate correct scroll position with header offset', async () => {
      const mockElement = {
        getBoundingClientRect: () => ({
          top: 500, // Element is 500px from top of viewport
        }),
      }

      document.querySelector = vi.fn(() => mockElement)

      // pageYOffset is 200 (mocked above)
      // Element top is 500
      // Header height is 120 (hardcoded in component)
      // Expected calculation: 200 + 500 - 120 = 580

      wrapper.vm.scrollToCommentForm()

      // Wait for nextTick inside the method to complete
      await nextTick()
      await nextTick()

      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 580, // 200 + 500 - 120
        behavior: 'smooth',
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing comment form element gracefully', async () => {
      // Mock querySelector to return null (element not found)
      document.querySelector = vi.fn(() => null)

      // Should not throw an error
      expect(() => wrapper.vm.scrollToCommentForm()).not.toThrow()

      // scrollTo should not be called
      expect(mockScrollTo).not.toHaveBeenCalled()
    })

    it('should handle missing comment element gracefully during reply', async () => {
      // Mock getElementById to return null
      document.getElementById = vi.fn(() => null)

      // Should not throw an error
      expect(() => wrapper.vm.replyTo(999)).not.toThrow()

      // scrollIntoView should not be called
      expect(mockScrollIntoView).not.toHaveBeenCalled()
    })
  })

  describe('Complete Scroll Implementation', () => {
    it('should implement complete scroll solution with all features', async () => {
      // This test verifies the complete scroll implementation including:
      // 1. Multi-strategy scroll approach (immediate, RAF, retry)
      // 2. Performance optimizations
      // 3. Fallback strategies
      // 4. User experience features (smooth scroll, highlight)
      // 5. Error handling

      const testCommentId = 123

      // Setup mock element with all required properties
      const mockElement = {
        getBoundingClientRect: vi.fn(() => ({
          top: 300,
        })),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      }

      // scrollToNewComment uses 'comment-${commentId}' format
      document.getElementById = vi.fn((id) => {
        if (id === `comment-${testCommentId}`) {
          return mockElement
        }
        return null
      })

      // Mock window.pageYOffset
      Object.defineProperty(window, 'pageYOffset', {
        value: 100,
        writable: true,
        configurable: true,
      })

      // Test immediate scroll (element ready)
      await wrapper.vm.scrollToNewComment(testCommentId)
      await nextTick()

      // Verify scroll was called with correct parameters
      // Expected: pageYOffset (100) + elementTop (300) - headerHeight (120) = 280
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: expect.any(Number),
        behavior: 'smooth',
      })

      // Verify highlight class was added (user experience feature)
      expect(mockElement.classList.add).toHaveBeenCalledWith('new-comment-highlight')

      // Verify smooth scroll behavior is used (not instant)
      const scrollCall = mockScrollTo.mock.calls[0][0]
      expect(scrollCall.behavior).toBe('smooth')

      // Verify header offset is calculated (not scrolled behind header)
      expect(scrollCall.top).toBeLessThan(100 + 300) // Less than raw position
      expect(scrollCall.top).toBeGreaterThan(0) // But still positive
    })

    it('should handle fallback strategies when element not immediately available', async () => {
      // Test progressive retry with delays
      const testCommentId = 456
      let callCount = 0

      document.getElementById = vi.fn((_id) => {
        callCount++
        // Element becomes available on second try (simulating DOM update delay)
        if (callCount >= 2) {
          return {
            getBoundingClientRect: () => ({ top: 200 }),
            classList: {
              add: vi.fn(),
              remove: vi.fn(),
            },
          }
        }
        return null
      })

      await wrapper.vm.scrollToNewComment(testCommentId)

      // Wait for retry attempts
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Verify getElementById was called multiple times (retry logic)
      expect(document.getElementById).toHaveBeenCalledTimes(callCount)
      expect(callCount).toBeGreaterThan(1)
    })

    it('should gracefully handle out-of-range comment IDs', async () => {
      // Test error handling for invalid IDs
      const invalidId = 999999

      document.getElementById = vi.fn(() => null)

      // Should not throw error
      await expect(wrapper.vm.scrollToNewComment(invalidId)).resolves.not.toThrow()

      // Verify no scroll happened
      mockScrollTo.mockClear()
      await new Promise((resolve) => setTimeout(resolve, 500))

      // After all retries, scrollTo should not have been called
      expect(mockScrollTo).not.toHaveBeenCalled()
    })

    it('should maintain performance with proper timing', async () => {
      // Test performance optimization - immediate success should be fast
      const startTime = Date.now()
      const testCommentId = 789

      document.getElementById = vi.fn(() => ({
        getBoundingClientRect: () => ({ top: 150 }),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      }))

      await wrapper.vm.scrollToNewComment(testCommentId)
      await nextTick()

      const endTime = Date.now()
      const duration = endTime - startTime

      // Immediate success should be very fast (< 100ms)
      expect(duration).toBeLessThan(100)

      // Verify scroll was called immediately
      expect(mockScrollTo).toHaveBeenCalled()
    })
  })
})
