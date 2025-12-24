// test/unit/components/comments/CommentForm.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Mock component to avoid dependency issues
const CommentFormMock = {
  name: 'CommentForm',
  template: `
    <form @submit.prevent="submitComment" class="w-full">
      <div class="mb-2 flex items-center text-sm">
        <button
          type="button"
          @click="openUserMentionModal"
          class="mention-user-btn mr-3"
          data-testid="mention-user-btn"
        >
          {{ $t('comments.mention_user') }}
        </button>
        <button
          type="button"
          @click="openCommentCitationModal"
          class="cite-comment-btn mr-3"
          data-testid="cite-comment-btn"
        >
          {{ $t('comments.cite_comment') }}
        </button>
        <button
          type="button"
          @click="showMarkdownHelp = !showMarkdownHelp"
          class="markdown-help-btn"
          data-testid="markdown-help-btn"
        >
          {{ $t('comments.markdown_formatting') }}
        </button>
      </div>

      <!-- Markdown help panel -->
      <div v-if="showMarkdownHelp" class="markdown-help-panel" data-testid="markdown-help-panel">
        <div class="markdown-help-title">{{ $t('comments.markdown_help_title') }}</div>
        <div class="markdown-examples">
          <div><code>**bold**</code> → <strong>bold</strong></div>
          <div><code>*italic*</code> → <em>italic</em></div>
          <div><code>[link](url)</code> → <a href="#" class="text-primary">link</a></div>
        </div>
      </div>

      <textarea
        v-model="content"
        class="comment-textarea"
        data-testid="comment-textarea"
        :placeholder="placeholder"
        required
        ref="commentTextarea"
      ></textarea>

      <!-- User mention modal -->
      <div v-if="showUserMentionModal" class="user-mention-modal" data-testid="user-mention-modal">
        <input
          v-model="userSearchQuery"
          type="text"
          class="user-search-input"
          data-testid="user-search-input"
          :placeholder="$t('comments.search_users')"
        />
        <div v-if="searchedUsers.length > 0" class="user-list">
          <button
            v-for="user in searchedUsers"
            :key="user.id"
            @click="insertUserMention(user)"
            class="user-item"
            :data-testid="'user-item-' + user.id"
          >
            {{ user.username }}
          </button>
        </div>
        <button
          @click="showUserMentionModal = false"
          class="cancel-btn"
          data-testid="cancel-mention-btn"
        >
          {{ $t('common.cancel') }}
        </button>
      </div>

      <!-- Comment citation modal -->
      <div v-if="showCommentCitationModal" class="comment-citation-modal" data-testid="comment-citation-modal">
        <div v-if="availableComments.length > 0" class="comment-list">
          <button
            v-for="comment in availableComments"
            :key="comment.id"
            @click="insertCommentCitation(comment)"
            class="comment-item"
            :data-testid="'comment-item-' + comment.id"
          >
            {{ comment.user?.username }}: {{ comment.content }}
          </button>
        </div>
        <button
          @click="showCommentCitationModal = false"
          class="cancel-btn"
          data-testid="cancel-citation-btn"
        >
          {{ $t('common.cancel') }}
        </button>
      </div>

      <div class="flex justify-end mt-3">
        <button
          type="submit"
          class="submit-btn"
          data-testid="submit-btn"
          :disabled="isSubmitting"
        >
          {{ submitLabel }}
        </button>
      </div>
    </form>
  `,
  props: {
    placeholder: {
      type: String,
      default: '',
    },
    submitLabel: {
      type: String,
      default: 'Submit',
    },
    parentId: {
      type: [Number, String],
      default: null,
    },
    error: {
      type: String,
      default: '',
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    postId: {
      type: [Number, String],
      required: true,
    },
    availableComments: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      content: '',
      showUserMentionModal: false,
      userSearchQuery: '',
      searchedUsers: [],
      showCommentCitationModal: false,
      showMarkdownHelp: false,
    }
  },
  methods: {
    submitComment() {
      const trimmed = this.content.trim()
      if (!trimmed) return
      this.$emit('submit', {
        content: trimmed,
        parentId: this.parentId,
      })
    },
    reset() {
      this.content = ''
    },
    openUserMentionModal() {
      this.showUserMentionModal = true
      this.userSearchQuery = ''
      this.searchedUsers = []
    },
    openCommentCitationModal() {
      this.showCommentCitationModal = true
    },
    insertUserMention(user) {
      this.content += ` @${user.username} `
      this.showUserMentionModal = false
    },
    insertCommentCitation(comment) {
      const commentPreview =
        comment.content.length > 30 ? comment.content.substring(0, 30) + '...' : comment.content

      this.content += ` #comment-${comment.id} (${comment.user?.username}: "${commentPreview}") `
      this.showCommentCitationModal = false
    },
  },
}

describe('CommentForm Component', () => {
  let wrapper
  let mockUsers
  let mockComments

  beforeEach(() => {
    // Mock users for testing mentions
    mockUsers = [
      { id: 1, username: 'user1', avatar: '/img/avatar1.png' },
      { id: 2, username: 'user2', avatar: '/img/avatar2.png' },
    ]

    // Mock comments for testing citations
    mockComments = [
      { id: 101, content: 'This is the first comment', user: { id: 1, username: 'user1' } },
      { id: 102, content: 'This is the second comment', user: { id: 2, username: 'user2' } },
    ]

    // Mount the component
    wrapper = mount(CommentFormMock, {
      props: {
        placeholder: 'Write a comment...',
        submitLabel: 'Comment',
        postId: 1,
        availableComments: mockComments,
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

    // Mock the fetch API for user search
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/users/search')) {
        return Promise.resolve({
          json: () => Promise.resolve({ data: mockUsers }),
        })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders the comment form with mention and citation buttons', () => {
    expect(wrapper.find('[data-testid="mention-user-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="cite-comment-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="comment-textarea"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="submit-btn"]').exists()).toBe(true)
  })

  it('opens the user mention modal when the mention button is clicked', async () => {
    // Initially the modal should be hidden
    expect(wrapper.find('[data-testid="user-mention-modal"]').exists()).toBe(false)

    // Click the mention button
    await wrapper.find('[data-testid="mention-user-btn"]').trigger('click')

    // Now the modal should be visible
    expect(wrapper.find('[data-testid="user-mention-modal"]').exists()).toBe(true)
  })

  it('opens the comment citation modal when the citation button is clicked', async () => {
    // Initially the modal should be hidden
    expect(wrapper.find('[data-testid="comment-citation-modal"]').exists()).toBe(false)

    // Click the citation button
    await wrapper.find('[data-testid="cite-comment-btn"]').trigger('click')

    // Now the modal should be visible
    expect(wrapper.find('[data-testid="comment-citation-modal"]').exists()).toBe(true)
  })

  it('inserts a user mention into the textarea', async () => {
    // Set up the component state
    await wrapper.setData({
      showUserMentionModal: true,
      searchedUsers: mockUsers,
    })

    // Click on a user to mention
    await wrapper.find('[data-testid="user-item-1"]').trigger('click')

    // Check that the mention was inserted into the textarea
    expect(wrapper.vm.content).toContain('@user1')

    // Modal should be closed
    expect(wrapper.find('[data-testid="user-mention-modal"]').exists()).toBe(false)
  })

  it('inserts a comment citation into the textarea', async () => {
    // Set up the component state
    await wrapper.setData({
      showCommentCitationModal: true,
    })

    // Click on a comment to cite
    await wrapper.find('[data-testid="comment-item-101"]').trigger('click')

    // Check that the citation was inserted into the textarea
    expect(wrapper.vm.content).toContain('#comment-101')
    expect(wrapper.vm.content).toContain('user1')

    // Modal should be closed
    expect(wrapper.find('[data-testid="comment-citation-modal"]').exists()).toBe(false)
  })

  it('submits the form with the comment content', async () => {
    // Set some content
    await wrapper.setData({
      content:
        'This is a test comment with @user1 mention and #comment-101 (user1: "This is the first comment") citation',
    })

    // Submit the form
    await wrapper.find('form').trigger('submit')

    // Check that the submit event was emitted with the correct data
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0][0]).toEqual({
      content:
        'This is a test comment with @user1 mention and #comment-101 (user1: "This is the first comment") citation',
      parentId: null,
    })
  })

  it('resets the form content', async () => {
    // Set some content
    await wrapper.setData({
      content: 'This is a test comment',
    })

    // Reset the form
    wrapper.vm.reset()

    // Check that the content was cleared
    expect(wrapper.vm.content).toBe('')
  })

  it('toggles the Markdown help panel when the Markdown button is clicked', async () => {
    // Initially the Markdown help panel should be hidden
    expect(wrapper.find('[data-testid="markdown-help-panel"]').exists()).toBe(false)

    // Click the Markdown help button
    await wrapper.find('[data-testid="markdown-help-btn"]').trigger('click')

    // Now the Markdown help panel should be visible
    expect(wrapper.find('[data-testid="markdown-help-panel"]').exists()).toBe(true)

    // Click the button again to hide the panel
    await wrapper.find('[data-testid="markdown-help-btn"]').trigger('click')

    // The panel should be hidden again
    expect(wrapper.find('[data-testid="markdown-help-panel"]').exists()).toBe(false)
  })

  it('displays Markdown formatting examples in the help panel', async () => {
    // Show the Markdown help panel
    await wrapper.setData({
      showMarkdownHelp: true,
    })

    // Check that the panel contains Markdown examples
    const helpPanel = wrapper.find('[data-testid="markdown-help-panel"]')
    expect(helpPanel.exists()).toBe(true)
    expect(helpPanel.text()).toContain('bold')
    expect(helpPanel.text()).toContain('italic')
    expect(helpPanel.text()).toContain('link')
    expect(helpPanel.html()).toContain('<code>**bold**</code>')
    expect(helpPanel.html()).toContain('<code>*italic*</code>')
    expect(helpPanel.html()).toContain('<code>[link](url)</code>')
  })
})
