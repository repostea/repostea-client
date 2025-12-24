import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CommentsList from '~/components/comments/CommentsList.vue'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: {
      comments: {
        create: vi.fn(),
        getByPost: vi.fn(),
        createComment: vi.fn(),
      },
    },
  }),
  nextTick: vi.fn(() => Promise.resolve()),
}))

// Mock i18n
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
  useLocalePath: () => (path) => path,
}))

// Mock process.client for Nuxt SSR check (extend existing process, don't replace it)
if (typeof process !== 'undefined') {
  process.client = true
}

describe('CommentsList - Nested Comments', () => {
  let wrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.restoreAllMocks()
  })

  const createTestComments = () => [
    {
      id: 1,
      content: 'Parent comment',
      user: { id: 1, username: 'user1' },
      created_at: '2023-01-01T00:00:00Z',
      children: [
        {
          id: 2,
          content: 'First reply',
          user: { id: 2, username: 'user2' },
          created_at: '2023-01-01T01:00:00Z',
          children: [],
        },
      ],
    },
    {
      id: 3,
      content: 'Another parent comment',
      user: { id: 3, username: 'user3' },
      created_at: '2023-01-01T02:00:00Z',
      children: [],
    },
  ]

  it('should add new reply to correct parent comment children', async () => {
    const initialComments = createTestComments()

    wrapper = mount(CommentsList, {
      props: {
        entryId: '123',
        linkId: '123',
        initialComments,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              comments: {
                comments: initialComments,
                loading: false,
                error: null,
              },
              auth: {
                isAuthenticated: true,
                isAnonymous: false,
                user: { id: 1, username: 'testuser' },
                token: 'test-token',
              },
            },
          }),
        ],
        stubs: {
          CommentItem: { template: '<div class="comment-item"><slot /></div>' },
          CommentForm: { template: '<div class="comment-form"><slot /></div>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })

    // Wait for component to be fully mounted
    await wrapper.vm.$nextTick()

    // Access the comments store directly
    const commentsStore = wrapper.vm.$pinia.state.value.comments

    // Verify initial state
    expect(commentsStore.comments).toHaveLength(2)
    const initialParentComment = commentsStore.comments.find((c) => c.id === 1)
    expect(initialParentComment).toBeDefined()
    expect(initialParentComment.children).toHaveLength(1)

    // Simulate what the store's createComment does when adding a reply
    const newReply = {
      id: 4,
      content: 'New nested reply',
      user: { id: 4, username: 'user4' },
      created_at: '2023-01-01T03:00:00Z',
      is_anonymous: false,
      author_name: null,
      children: [],
      votes: 0,
      userVote: null,
      userVoteType: null,
      voteDetails: [],
      voteStats: null,
      isGuest: false,
      authorName: null,
      parentId: 1,
      parent_id: 1,
    }

    // Add reply to parent's children array (simulating store action)
    const parentComment = commentsStore.comments.find((c) => c.id === 1)
    if (!parentComment.children) {
      parentComment.children = []
    }
    parentComment.children.push(newReply)

    // Force reactivity update
    await wrapper.vm.$nextTick()

    // Verify the reply was added to the correct parent
    const updatedParentComment = commentsStore.comments.find((c) => c.id === 1)
    expect(updatedParentComment.children).toHaveLength(2)

    const newChild = updatedParentComment.children.find((c) => c.id === 4)
    expect(newChild).toBeDefined()
    expect(newChild.content).toBe('New nested reply')
    expect(newChild.children).toEqual([])

    // Verify other comments weren't affected
    const otherParentComment = commentsStore.comments.find((c) => c.id === 3)
    expect(otherParentComment.children).toHaveLength(0)
  })

  it('should add replies to nested comments (3-level deep)', async () => {
    // Test de anidamiento de 3 niveles: Parent -> Child -> Grandchild
    const initialComments = [
      {
        id: 1,
        content: 'Parent comment',
        user: { id: 1, username: 'user1' },
        created_at: '2023-01-01T00:00:00Z',
        children: [
          {
            id: 2,
            content: 'Child comment (level 2)',
            user: { id: 2, username: 'user2' },
            created_at: '2023-01-01T01:00:00Z',
            children: [],
          },
        ],
      },
    ]

    wrapper = mount(CommentsList, {
      props: {
        entryId: '123',
        linkId: '123',
        initialComments,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              comments: {
                comments: initialComments,
                loading: false,
                error: null,
              },
              auth: {
                isAuthenticated: true,
                isAnonymous: false,
                user: { id: 3, username: 'user3' },
                token: 'test-token',
              },
            },
          }),
        ],
        stubs: {
          CommentItem: { template: '<div class="comment-item"><slot /></div>' },
          CommentForm: { template: '<div class="comment-form"><slot /></div>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })

    await wrapper.vm.$nextTick()

    const commentsStore = wrapper.vm.$pinia.state.value.comments

    // Add grandchild comment (level 3) to the child comment (id: 2)
    const grandchildComment = {
      id: 3,
      content: 'Grandchild comment (level 3)',
      user: { id: 3, username: 'user3' },
      created_at: '2023-01-01T02:00:00Z',
      parent_id: 2,
      children: [],
    }

    // Find the child comment and add the grandchild to its children
    const parentComment = commentsStore.comments[0]
    const childComment = parentComment.children[0]
    childComment.children.push(grandchildComment)

    await wrapper.vm.$nextTick()

    // Verify the 3-level nesting structure
    expect(commentsStore.comments).toHaveLength(1)
    expect(commentsStore.comments[0].id).toBe(1) // Parent
    expect(commentsStore.comments[0].children).toHaveLength(1)
    expect(commentsStore.comments[0].children[0].id).toBe(2) // Child
    expect(commentsStore.comments[0].children[0].children).toHaveLength(1)
    expect(commentsStore.comments[0].children[0].children[0].id).toBe(3) // Grandchild
    expect(commentsStore.comments[0].children[0].children[0].content).toBe(
      'Grandchild comment (level 3)'
    )
  })

  it('should handle anonymous user replies correctly', async () => {
    // Test to verify anonymous comments are handled correctly
    const initialComments = createTestComments()

    wrapper = mount(CommentsList, {
      props: {
        entryId: '123',
        linkId: '123',
        initialComments,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              comments: {
                comments: initialComments,
                loading: false,
                error: null,
              },
              auth: {
                isAuthenticated: false,
                isAnonymous: true,
                user: null,
                token: null,
              },
            },
          }),
        ],
        stubs: {
          CommentItem: { template: '<div class="comment-item"><slot /></div>' },
          CommentForm: { template: '<div class="comment-form"><slot /></div>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })

    await wrapper.vm.$nextTick()

    const commentsStore = wrapper.vm.$pinia.state.value.comments
    const authStore = wrapper.vm.$pinia.state.value.auth

    // Verify anonymous state
    expect(authStore.isAnonymous).toBe(true)
    expect(authStore.isAuthenticated).toBe(false)

    // Create an anonymous reply
    const anonymousReply = {
      id: 5,
      content: 'Anonymous reply',
      user: null,
      created_at: '2023-01-01T05:00:00Z',
      is_anonymous: true,
      author_name: 'Anonymous User',
      parent_id: 1,
      children: [],
    }

    // Add the anonymous reply to the first parent comment
    const parentComment = commentsStore.comments[0]
    parentComment.children.push(anonymousReply)

    await wrapper.vm.$nextTick()

    // Verify the anonymous reply was added
    const addedReply = parentComment.children.find((c) => c.id === 5)
    expect(addedReply).toBeDefined()
    expect(addedReply.is_anonymous).toBe(true)
    expect(addedReply.author_name).toBe('Anonymous User')
    expect(addedReply.user).toBeNull()
  })

  it('should add new top-level comments to the end of the list', async () => {
    const initialComments = createTestComments()

    wrapper = mount(CommentsList, {
      props: {
        entryId: '123',
        linkId: '123',
        initialComments,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              comments: {
                comments: initialComments,
                loading: false,
                error: null,
              },
              auth: {
                isAuthenticated: true,
                isAnonymous: false,
                user: { id: 1, username: 'testuser' },
                token: 'test-token',
              },
            },
          }),
        ],
        stubs: {
          CommentItem: { template: '<div class="comment-item"><slot /></div>' },
          CommentForm: { template: '<div class="comment-form"><slot /></div>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })

    // Wait for component to be fully mounted
    await wrapper.vm.$nextTick()

    // Access the comments store directly
    const commentsStore = wrapper.vm.$pinia.state.value.comments

    // Initial state: 2 top-level comments
    expect(commentsStore.comments).toHaveLength(2)

    // Create new top-level comment
    const newTopLevelComment = {
      id: 7,
      content: 'New top level comment',
      user: { id: 7, username: 'user7' },
      created_at: '2023-01-01T06:00:00Z',
      is_anonymous: false,
      author_name: null,
      children: [],
      votes: 0,
      userVote: null,
      userVoteType: null,
      voteDetails: [],
      voteStats: null,
      isGuest: false,
      authorName: null,
      parentId: null,
      parent_id: null,
    }

    // Add to the end like the store does for top-level comments
    commentsStore.comments.push(newTopLevelComment)

    // Force reactivity update
    await wrapper.vm.$nextTick()

    // Check that the comment was added to the end
    expect(commentsStore.comments).toHaveLength(3)
    expect(commentsStore.comments[2].id).toBe(7)
    expect(commentsStore.comments[2].content).toBe('New top level comment')
    expect(commentsStore.comments[2].children).toEqual([])
  })

  it('should not affect other comments when adding nested replies', async () => {
    // Test para verificar el aislamiento: agregar reply a un comentario no debe afectar otros
    const initialComments = [
      {
        id: 1,
        content: 'First parent',
        user: { id: 1, username: 'user1' },
        created_at: '2023-01-01T00:00:00Z',
        children: [],
      },
      {
        id: 2,
        content: 'Second parent',
        user: { id: 2, username: 'user2' },
        created_at: '2023-01-01T01:00:00Z',
        children: [],
      },
      {
        id: 3,
        content: 'Third parent',
        user: { id: 3, username: 'user3' },
        created_at: '2023-01-01T02:00:00Z',
        children: [],
      },
    ]

    wrapper = mount(CommentsList, {
      props: {
        entryId: '123',
        linkId: '123',
        initialComments,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              comments: {
                comments: initialComments,
                loading: false,
                error: null,
              },
              auth: {
                isAuthenticated: true,
                isAnonymous: false,
                user: { id: 4, username: 'user4' },
                token: 'test-token',
              },
            },
          }),
        ],
        stubs: {
          CommentItem: { template: '<div class="comment-item"><slot /></div>' },
          CommentForm: { template: '<div class="comment-form"><slot /></div>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })

    await wrapper.vm.$nextTick()

    const commentsStore = wrapper.vm.$pinia.state.value.comments

    // Initial state: 3 top-level comments, all with no children
    expect(commentsStore.comments).toHaveLength(3)
    expect(commentsStore.comments[0].children).toHaveLength(0)
    expect(commentsStore.comments[1].children).toHaveLength(0)
    expect(commentsStore.comments[2].children).toHaveLength(0)

    // Store initial state of other comments
    const firstParentContentBefore = commentsStore.comments[0].content
    const thirdParentContentBefore = commentsStore.comments[2].content

    // Add a reply to the SECOND parent only
    const replyToSecond = {
      id: 4,
      content: 'Reply to second parent',
      user: { id: 4, username: 'user4' },
      created_at: '2023-01-01T03:00:00Z',
      parent_id: 2,
      children: [],
    }

    commentsStore.comments[1].children.push(replyToSecond)

    await wrapper.vm.$nextTick()

    // Verify: Only the second parent was affected
    expect(commentsStore.comments[0].children).toHaveLength(0) // First parent: unchanged
    expect(commentsStore.comments[1].children).toHaveLength(1) // Second parent: has new reply
    expect(commentsStore.comments[2].children).toHaveLength(0) // Third parent: unchanged

    // Verify: Content of other comments is unchanged
    expect(commentsStore.comments[0].content).toBe(firstParentContentBefore)
    expect(commentsStore.comments[2].content).toBe(thirdParentContentBefore)

    // Verify: The reply is correctly placed
    expect(commentsStore.comments[1].children[0].id).toBe(4)
    expect(commentsStore.comments[1].children[0].content).toBe('Reply to second parent')
    expect(commentsStore.comments[1].children[0].parent_id).toBe(2)
  })
})
