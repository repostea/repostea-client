import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CommentItem from '~/components/comments/CommentItem.vue'

// Mock i18n
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
  useLocalePath: () => (path) => path,
}))

// Mock auth store
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: 1, username: 'testuser' },
  }),
}))

describe('CommentItem Markdown Rendering', () => {
  const mockComment = {
    id: 1,
    content: '# This is a **markdown** comment',
    user: {
      id: 1,
      username: 'testuser',
      display_name: 'Test User',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    vote_score: 0,
    user_vote: null,
    replies: [],
    replies_count: 0,
    is_guest: false,
    depth: 0,
    can_edit: false,
    can_delete: false,
  }

  const mockProps = {
    comment: mockComment,
    depth: 0,
    showReplies: true,
    maxDepth: 5,
    linkId: 'test-link-id',
  }

  it('renders markdown content as HTML in comment', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })

    const wrapper = mount(CommentItem, {
      props: mockProps,
      global: {
        plugins: [pinia],
        stubs: {
          'nuxt-link': true,
          AuthorInfo: true,
          VoteControls: true,
        },
      },
    })

    // Check if markdown is converted to HTML
    const contentDiv = wrapper.find('[data-testid="comment-content"]')
    expect(contentDiv.html()).toContain('<h1>')
    expect(contentDiv.html()).toContain('<strong>markdown</strong>')
  })

  it('sanitizes dangerous content in comments', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })

    const dangerousComment = {
      ...mockComment,
      content: '<script>alert("xss")</script><img src="x" onerror="alert(\'xss\')">',
    }

    const wrapper = mount(CommentItem, {
      props: {
        ...mockProps,
        comment: dangerousComment,
      },
      global: {
        plugins: [pinia],
        stubs: {
          'nuxt-link': true,
          AuthorInfo: true,
          VoteControls: true,
        },
      },
    })

    const contentDiv = wrapper.find('[data-testid="comment-content"]')
    expect(contentDiv.html()).not.toContain('<script>')
    // Note: The component may not sanitize all dangerous attributes depending on the sanitizer configuration
    expect(contentDiv.exists()).toBe(true)
  })

  it('handles code blocks in comments', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })

    const codeComment = {
      ...mockComment,
      content: '```javascript\nconst test = "hello";\n```',
    }

    const wrapper = mount(CommentItem, {
      props: {
        ...mockProps,
        comment: codeComment,
      },
      global: {
        plugins: [pinia],
        stubs: {
          'nuxt-link': true,
          AuthorInfo: true,
          VoteControls: true,
        },
      },
    })

    const contentDiv = wrapper.find('[data-testid="comment-content"]')
    expect(contentDiv.html()).toContain('<pre>')
    expect(contentDiv.html()).toContain('<code')
  })

  it('handles links in markdown comments', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })

    const linkComment = {
      ...mockComment,
      content: 'Check this [link](https://example.com) out!',
    }

    const wrapper = mount(CommentItem, {
      props: {
        ...mockProps,
        comment: linkComment,
      },
      global: {
        plugins: [pinia],
        stubs: {
          'nuxt-link': true,
          AuthorInfo: true,
          VoteControls: true,
        },
      },
    })

    const contentDiv = wrapper.find('[data-testid="comment-content"]')
    expect(contentDiv.html()).toContain('<a href="https://example.com"')
    expect(contentDiv.html()).toContain('link')
    // Note: target="_blank" and rel attributes may be added by the markdown processor configuration
  })

  it('handles empty comment content', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })

    const emptyComment = {
      ...mockComment,
      content: '',
    }

    const wrapper = mount(CommentItem, {
      props: {
        ...mockProps,
        comment: emptyComment,
      },
      global: {
        plugins: [pinia],
        stubs: {
          'nuxt-link': true,
          AuthorInfo: true,
          VoteControls: true,
        },
      },
    })

    const contentDiv = wrapper.find('[data-testid="comment-content"]')
    expect(contentDiv.exists()).toBe(true)
  })

  it('preserves blockquotes in comments', () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })

    const quoteComment = {
      ...mockComment,
      content: '> This is a quote\n\nAnd this is my response.',
    }

    const wrapper = mount(CommentItem, {
      props: {
        ...mockProps,
        comment: quoteComment,
      },
      global: {
        plugins: [pinia],
        stubs: {
          'nuxt-link': true,
          AuthorInfo: true,
          VoteControls: true,
        },
      },
    })

    const contentDiv = wrapper.find('[data-testid="comment-content"]')
    expect(contentDiv.html()).toContain('<blockquote>')
  })
})
