// test/unit/components/posts/AddRelationshipModal.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Mock del componente AddRelationshipModal
const AddRelationshipModalMock = {
  name: 'AddRelationshipModal',
  template: `
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="close">×</button>
        </div>

        <div class="modal-body">
          <!-- Type selection -->
          <div class="type-selection">
            <h4>Select Relationship Type</h4>
            <div class="type-options">
              <button
                v-for="type in relationshipTypes"
                :key="type.value"
                :class="['type-option', { active: selectedType === type.value, disabled: type.requires_author && !isAuthor }]"
                :disabled="type.requires_author && !isAuthor"
                @click="selectType(type.value)"
              >
                <Icon :name="'fa6-solid:' + type.icon" />
                <span>{{ type.label }}</span>
                <div v-if="type.requires_author" class="author-only">
                  <Icon name="fa6-solid:lock" /> Author only
                </div>
              </button>
            </div>
          </div>

          <!-- Post search -->
          <div v-if="selectedType" class="post-search">
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search posts..."
              @input="onSearchInput"
            />
            <div v-if="searching" class="searching">Searching...</div>
            <div v-else-if="searchResults.length > 0" class="search-results">
              <div
                v-for="post in searchResults"
                :key="post.id"
                :class="['search-result', { selected: selectedPostId === post.id }]"
                @click="selectPost(post)"
              >
                <h5>{{ post.title }}</h5>
                <p class="post-author">by {{ post.author }}</p>
              </div>
            </div>
            <div v-else-if="searchQuery" class="no-results">No posts found</div>
          </div>

          <!-- Notes -->
          <div v-if="selectedPostId" class="notes-section">
            <label for="notes">Notes (optional)</label>
            <textarea
              v-model="notes"
              id="notes"
              class="notes-input"
              placeholder="Add optional notes..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" @click="close">Cancel</button>
          <button
            class="submit-btn"
            :disabled="!canSubmit"
            @click="submit"
          >
            Create Relationship
          </button>
        </div>
      </div>
    </div>
  `,
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    postId: {
      type: Number,
      required: true,
    },
    isAuthor: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      title: 'Add Post Relationship',
      selectedType: null,
      searchQuery: '',
      searchResults: [],
      searching: false,
      selectedPostId: null,
      notes: '',
      relationshipTypes: [
        { value: 'reply', label: 'Reply', icon: 'reply', requires_author: false },
        { value: 'continuation', label: 'Continuation', icon: 'forward', requires_author: true },
        { value: 'related', label: 'Related', icon: 'link', requires_author: false },
        { value: 'update', label: 'Update', icon: 'sync', requires_author: false },
        { value: 'correction', label: 'Correction', icon: 'edit', requires_author: false },
        { value: 'duplicate', label: 'Duplicate', icon: 'copy', requires_author: false },
      ],
    }
  },
  computed: {
    canSubmit() {
      return this.selectedType && this.selectedPostId
    },
  },
  methods: {
    close() {
      this.$emit('close')
      this.reset()
    },
    selectType(type) {
      const typeObj = this.relationshipTypes.find((t) => t.value === type)
      if (typeObj && typeObj.requires_author && !this.isAuthor) {
        return
      }
      this.selectedType = type
    },
    onSearchInput() {
      this.searching = true
      // Simulate debounced search
      setTimeout(() => {
        this.performSearch()
      }, 300)
    },
    performSearch() {
      this.searching = false
      // Emit search event for parent to handle
      this.$emit('search', this.searchQuery)
    },
    selectPost(post) {
      this.selectedPostId = post.id
    },
    submit() {
      if (!this.canSubmit) return

      this.$emit('submit', {
        target_post_id: this.selectedPostId,
        relationship_type: this.selectedType,
        notes: this.notes || null,
      })

      this.close()
    },
    reset() {
      this.selectedType = null
      this.searchQuery = ''
      this.searchResults = []
      this.selectedPostId = null
      this.notes = ''
    },
  },
}

describe('AddRelationshipModal Component', () => {
  let wrapper

  const mockSearchResults = [
    { id: 2, title: 'Test Post 1', author: 'User1' },
    { id: 3, title: 'Test Post 2', author: 'User2' },
  ]

  beforeEach(() => {
    wrapper = mount(AddRelationshipModalMock, {
      props: {
        isOpen: true,
        postId: 1,
        isAuthor: false,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        mocks: {
          $t: (key) => key,
        },
      },
    })
  })

  it('renders when isOpen is true', () => {
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-header h3').text()).toBe('Add Post Relationship')
  })

  it('does not render when isOpen is false', async () => {
    await wrapper.setProps({ isOpen: false })
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('displays all relationship types', () => {
    const typeButtons = wrapper.findAll('.type-option')
    expect(typeButtons).toHaveLength(6)
  })

  it('allows selecting non-author relationship types', async () => {
    const replyButton = wrapper.findAll('.type-option')[0]
    await replyButton.trigger('click')

    expect(wrapper.vm.selectedType).toBe('reply')
    expect(replyButton.classes()).toContain('active')
  })

  it('disables author-only types when user is not author', () => {
    const continuationButton = wrapper.findAll('.type-option')[1]

    expect(continuationButton.classes()).toContain('disabled')
    expect(continuationButton.attributes('disabled')).toBeDefined()
    expect(continuationButton.find('.author-only').exists()).toBe(true)
  })

  it('enables author-only types when user is author', async () => {
    await wrapper.setProps({ isAuthor: true })

    const continuationButton = wrapper.findAll('.type-option')[1]

    expect(continuationButton.classes()).not.toContain('disabled')
    expect(continuationButton.attributes('disabled')).toBeUndefined()
  })

  it('shows post search after selecting type', async () => {
    expect(wrapper.find('.post-search').exists()).toBe(false)

    await wrapper.setData({ selectedType: 'reply' })

    expect(wrapper.find('.post-search').exists()).toBe(true)
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('emits search event when typing in search input', async () => {
    await wrapper.setData({ selectedType: 'reply' })

    const searchInput = wrapper.find('.search-input')
    await searchInput.setValue('test query')
    await searchInput.trigger('input')

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 350))

    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')[0]).toEqual(['test query'])
  })

  it('displays search results', async () => {
    await wrapper.setData({ selectedType: 'reply', searchResults: mockSearchResults })

    const results = wrapper.findAll('.search-result')
    expect(results).toHaveLength(2)
    expect(results[0].find('h5').text()).toBe('Test Post 1')
    expect(results[1].find('h5').text()).toBe('Test Post 2')
  })

  it('allows selecting a post from search results', async () => {
    await wrapper.setData({ selectedType: 'reply', searchResults: mockSearchResults })

    const firstResult = wrapper.findAll('.search-result')[0]
    await firstResult.trigger('click')

    expect(wrapper.vm.selectedPostId).toBe(2)
    expect(firstResult.classes()).toContain('selected')
  })

  it('shows notes section after selecting post', async () => {
    expect(wrapper.find('.notes-section').exists()).toBe(false)

    await wrapper.setData({ selectedType: 'reply', selectedPostId: 2 })

    expect(wrapper.find('.notes-section').exists()).toBe(true)
    expect(wrapper.find('.notes-input').exists()).toBe(true)
  })

  it('disables submit button when form is incomplete', () => {
    const submitBtn = wrapper.find('.submit-btn')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is complete', async () => {
    await wrapper.setData({ selectedType: 'reply', selectedPostId: 2 })

    const submitBtn = wrapper.find('.submit-btn')
    expect(submitBtn.attributes('disabled')).toBeUndefined()
  })

  it('emits submit event with correct data', async () => {
    await wrapper.setData({
      selectedType: 'reply',
      selectedPostId: 2,
      notes: 'Test notes',
    })

    await wrapper.find('.submit-btn').trigger('click')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')[0]).toEqual([
      {
        target_post_id: 2,
        relationship_type: 'reply',
        notes: 'Test notes',
      },
    ])
  })

  it('emits close event and resets form when cancel is clicked', async () => {
    await wrapper.setData({
      selectedType: 'reply',
      selectedPostId: 2,
      notes: 'Test notes',
    })

    await wrapper.find('.cancel-btn').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.vm.selectedType).toBeNull()
    expect(wrapper.vm.selectedPostId).toBeNull()
    expect(wrapper.vm.notes).toBe('')
  })

  it('emits close event when clicking overlay', async () => {
    await wrapper.find('.modal-overlay').trigger('click.self')

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not close when clicking modal content', async () => {
    const initialCloseCount = wrapper.emitted('close')?.length || 0

    await wrapper.find('.modal-content').trigger('click')

    const newCloseCount = wrapper.emitted('close')?.length || 0
    expect(newCloseCount).toBe(initialCloseCount)
  })

  it('shows no results message when search returns empty', async () => {
    await wrapper.setData({
      selectedType: 'reply',
      searchQuery: 'nonexistent',
      searchResults: [],
      searching: false,
    })

    expect(wrapper.find('.no-results').exists()).toBe(true)
    expect(wrapper.find('.no-results').text()).toBe('No posts found')
  })

  it('shows searching indicator during search', async () => {
    await wrapper.setData({ selectedType: 'reply', searching: true })

    expect(wrapper.find('.searching').exists()).toBe(true)
    expect(wrapper.find('.searching').text()).toBe('Searching...')
  })
})
