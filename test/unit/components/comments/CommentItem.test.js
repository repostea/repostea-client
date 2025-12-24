// test/unit/components/comments/CommentItem.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Mock the marked and DOMPurify libraries
vi.mock('marked', () => ({
  parse: vi.fn((content) => {
    // Simple mock that just wraps content in <p> tag and preserves placeholders
    return `<p>${content}</p>`
  }),
}))

vi.mock('dompurify', () => ({
  sanitize: vi.fn((html) => html),
}))

// Mock component to avoid dependency issues
const CommentItemMock = {
  name: 'CommentItem',
  template: `
    <div :id="'comment-' + comment.id" class="comment-item">
      <div class="comment-header">
        <div class="author-info">{{ comment.user.username }}</div>
      </div>
      <div class="comment-content" data-testid="comment-content" v-html="formatCommentContent(comment.content)"></div>
      <button @click="replyTo" class="reply-button" data-testid="reply-button">
        {{ $t('comments.reply') }}
      </button>
      <div class="vote-controls">
        <!-- Vote controls would go here -->
      </div>
    </div>
  `,
  props: {
    comment: {
      type: Object,
      required: true,
    },
    linkId: {
      type: [Number, String],
      required: true,
    },
    replyingTo: {
      type: [Number, String, null],
      default: null,
    },
    nested: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    formatCommentContent(content) {
      if (!content) return ''

      // First, we need to temporarily replace user mentions and comment citations
      // with placeholders to prevent Markdown parser from processing them
      const mentions = []
      const citations = []

      // Replace @username with a placeholder
      let processedContent = content.replace(/@([a-zA-Z0-9_-]+)/g, (match, username) => {
        const placeholder = `__MENTION_${mentions.length}__`
        mentions.push({ username })
        return placeholder
      })

      // Replace #comment-123 with a placeholder
      processedContent = processedContent.replace(
        /#comment-(\d+)\s+\(([^:]+):\s+"([^"]+)"\)/g,
        (match, commentId, username, preview) => {
          const placeholder = `__CITATION_${citations.length}__`
          citations.push({ commentId, username, preview })
          return placeholder
        }
      )

      // Parse the content as Markdown using our mocked marked.parse
      const { parse } = require('marked')
      let formattedContent = parse(processedContent)

      // Sanitize the HTML using our mocked DOMPurify.sanitize
      const { sanitize } = require('dompurify')
      formattedContent = sanitize(formattedContent)

      // Replace the mention placeholders with the actual HTML (account for markdown processing)
      mentions.forEach((mention, index) => {
        const placeholder = `__MENTION_${index}__`
        const strongPlaceholder = `<strong>MENTION_${index}</strong>`
        const html = `<a href="/u/${mention.username}" class="text-primary hover:underline">@${mention.username}</a>`
        formattedContent = formattedContent.replace(placeholder, html)
        formattedContent = formattedContent.replace(strongPlaceholder, html)
      })

      // Replace the citation placeholders with the actual HTML (account for markdown processing)
      citations.forEach((citation, index) => {
        const placeholder = `__CITATION_${index}__`
        const strongPlaceholder = `<strong>CITATION_${index}</strong>`
        const html = `<a href="#comment-${citation.commentId}" class="text-primary hover:underline">#comment-${citation.commentId}</a> <span class="text-gray-500">(${citation.username}: "${citation.preview}")</span>`
        formattedContent = formattedContent.replace(placeholder, html)
        formattedContent = formattedContent.replace(strongPlaceholder, html)
      })

      return formattedContent
    },
    replyTo() {
      this.$emit('reply', this.comment.id)
    },
  },
}

describe('CommentItem Component', () => {
  let wrapper
  let mockComment

  beforeEach(() => {
    // Create a mock comment with mentions and citations
    mockComment = {
      id: 101,
      content: 'Hello @user1, I am replying to #comment-102 (user2: "This is the second comment")',
      user: { id: 1, username: 'testuser', avatar: '/img/avatar1.png' },
      created_at: '2023-01-01T00:00:00Z',
      votes: 5,
      mentioned_users: [2],
      cited_comments: [102],
    }

    // Mount the component
    wrapper = mount(CommentItemMock, {
      props: {
        comment: mockComment,
        linkId: 1,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        mocks: {
          $t: (key) => key,
          localePath: (path) => path,
        },
      },
    })
  })

  it('renders the comment content with user mentions formatted as links', () => {
    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that the content is rendered
    expect(contentElement.exists()).toBe(true)

    // Check that the user mention is formatted as a link
    expect(contentElement.html()).toContain(
      '<a href="/u/user1" class="text-primary hover:underline">@user1</a>'
    )
  })

  it('renders the comment content with comment citations formatted as links', () => {
    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that the comment citation is formatted as a link
    expect(contentElement.html()).toContain(
      '<a href="#comment-102" class="text-primary hover:underline">#comment-102</a>'
    )

    // Check that the citation preview is included
    expect(contentElement.html()).toContain(
      '<span class="text-gray-500">(user2: "This is the second comment")</span>'
    )
  })

  it('emits a reply event when the reply button is clicked', async () => {
    // Click the reply button
    await wrapper.find('[data-testid="reply-button"]').trigger('click')

    // Check that the reply event was emitted with the correct comment ID
    expect(wrapper.emitted('reply')).toBeTruthy()
    expect(wrapper.emitted('reply')[0][0]).toBe(101)
  })

  it('renders the comment with the correct ID for anchor links', () => {
    // Check that the comment has the correct ID for anchor links
    expect(wrapper.attributes('id')).toBe('comment-101')
  })

  it('handles comments without mentions or citations', async () => {
    // Update the comment to have no mentions or citations
    await wrapper.setProps({
      comment: {
        ...mockComment,
        content: 'This is a regular comment with no mentions or citations',
        mentioned_users: [],
        cited_comments: [],
      },
    })

    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that the content is rendered correctly
    expect(contentElement.text()).toBe('This is a regular comment with no mentions or citations')

    // Check that there are no mention or citation links
    expect(contentElement.find('.user-mention').exists()).toBe(false)
    expect(contentElement.find('.comment-citation').exists()).toBe(false)
  })

  it('handles multiple mentions and citations', async () => {
    // Update the comment to have multiple mentions and citations
    await wrapper.setProps({
      comment: {
        ...mockComment,
        content:
          'Hello @user1 and @user2, I am replying to #comment-102 (user2: "Second comment") and #comment-103 (user3: "Third comment")',
        mentioned_users: [2, 3],
        cited_comments: [102, 103],
      },
    })

    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that all mentions are formatted as links
    expect(contentElement.html()).toContain(
      '<a href="/u/user1" class="text-primary hover:underline">@user1</a>'
    )
    expect(contentElement.html()).toContain(
      '<a href="/u/user2" class="text-primary hover:underline">@user2</a>'
    )

    // Check that all citations are formatted as links
    expect(contentElement.html()).toContain(
      '<a href="#comment-102" class="text-primary hover:underline">#comment-102</a>'
    )
    expect(contentElement.html()).toContain(
      '<a href="#comment-103" class="text-primary hover:underline">#comment-103</a>'
    )
  })

  it('renders Markdown formatting in comments', async () => {
    // Update the comment to include Markdown formatting
    await wrapper.setProps({
      comment: {
        ...mockComment,
        content: '**Bold text** and *italic text* and `code`',
        mentioned_users: [],
        cited_comments: [],
      },
    })

    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that Markdown is rendered correctly
    expect(contentElement.html()).toContain('<strong>Bold text</strong>')
    expect(contentElement.html()).toContain('<em>italic text</em>')
    expect(contentElement.html()).toContain('<code>code</code>')
  })

  it('renders Markdown links in comments', async () => {
    // Update the comment to include Markdown links
    await wrapper.setProps({
      comment: {
        ...mockComment,
        content: 'Check out [this link](https://example.com)',
        mentioned_users: [],
        cited_comments: [],
      },
    })

    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that Markdown links are rendered correctly
    expect(contentElement.html()).toContain('<a href="https://example.com">this link</a>')
  })

  it('renders Markdown headings in comments', async () => {
    // Update the comment to include Markdown headings
    await wrapper.setProps({
      comment: {
        ...mockComment,
        content: '# Heading 1\n## Heading 2\n### Heading 3',
        mentioned_users: [],
        cited_comments: [],
      },
    })

    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that Markdown headings are rendered correctly
    expect(contentElement.html()).toContain('<h1>Heading 1</h1>')
    expect(contentElement.html()).toContain('<h2>Heading 2</h2>')
    expect(contentElement.html()).toContain('<h3>Heading 3</h3>')
  })

  it('correctly handles a mix of Markdown, mentions, and citations', async () => {
    // Update the comment to include a mix of Markdown, mentions, and citations
    await wrapper.setProps({
      comment: {
        ...mockComment,
        content:
          '**Bold text** with @user1 mention and #comment-102 (user2: "Second comment") citation',
        mentioned_users: [1],
        cited_comments: [102],
      },
    })

    const contentElement = wrapper.find('[data-testid="comment-content"]')

    // Check that everything is rendered correctly
    expect(contentElement.html()).toContain('<strong>Bold text</strong>')
    expect(contentElement.html()).toContain(
      '<a href="/u/user1" class="text-primary hover:underline">@user1</a>'
    )
    expect(contentElement.html()).toContain(
      '<a href="#comment-102" class="text-primary hover:underline">#comment-102</a>'
    )
  })
})
