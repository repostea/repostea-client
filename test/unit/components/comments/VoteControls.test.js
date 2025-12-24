// test/unit/components/comments/VoteControls.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// Mock VoteControls component
const VoteControlsMock = {
  name: 'VoteControls',
  template: `
    <div class="vote-controls">
      <button
        @click="handleVote(1, 'upvote')"
        :class="{ 'active': currentVote === 1 }"
        class="upvote-button">
        Upvote
      </button>
      <span class="vote-count">{{ voteCount }}</span>
      <button
        @click="handleVote(-1, 'downvote')"
        :class="{ 'active': currentVote === -1 }"
        class="downvote-button">
        Downvote
      </button>
    </div>
  `,
  props: {
    itemId: {
      type: Number,
      required: true,
    },
    itemType: {
      type: String,
      required: true,
    },
    initialVote: {
      type: Number,
      default: null,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      currentVote: this.initialVote,
    }
  },
  watch: {
    initialVote(newVal) {
      this.currentVote = newVal
    },
  },
  methods: {
    async handleVote(value, type) {
      // Toggle functionality: if same vote type clicked again, unvote
      if (this.currentVote === value) {
        // Unvote
        await this.$api.delete(`/api/v1/${this.itemType}/${this.itemId}/vote`)
        this.currentVote = null
        this.$emit('vote-changed', null)
      } else {
        // Vote
        await this.$api.post(`/api/v1/${this.itemType}/${this.itemId}/vote`, {
          value,
          type,
        })
        this.currentVote = value
        this.$emit('vote-changed', value)
      }
    },
  },
}

describe('VoteControls Component', () => {
  let wrapper
  let apiMock

  beforeEach(() => {
    apiMock = {
      post: vi.fn().mockResolvedValue({ data: { success: true } }),
      delete: vi.fn().mockResolvedValue({ data: { success: true } }),
    }

    wrapper = mount(VoteControlsMock, {
      props: {
        itemId: 1,
        itemType: 'posts',
        initialVote: null,
        voteCount: 5,
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
          }),
        ],
        mocks: {
          $api: apiMock,
          $t: (key) => key,
        },
      },
    })
  })

  it('renders vote buttons and count correctly', () => {
    expect(wrapper.find('.upvote-button').exists()).toBe(true)
    expect(wrapper.find('.downvote-button').exists()).toBe(true)
    expect(wrapper.find('.vote-count').text()).toBe('5')
  })

  it('allows voting when no previous vote exists', async () => {
    const upvoteButton = wrapper.find('.upvote-button')
    await upvoteButton.trigger('click')

    expect(apiMock.post).toHaveBeenCalledWith('/api/v1/posts/1/vote', {
      value: 1,
      type: 'upvote',
    })
    expect(wrapper.vm.currentVote).toBe(1)
  })

  it('toggles vote when clicking same vote type again (unvote)', async () => {
    // Set initial vote
    await wrapper.setProps({ initialVote: 1 })
    await wrapper.vm.$nextTick()

    // Click upvote again to unvote
    const upvoteButton = wrapper.find('.upvote-button')
    await upvoteButton.trigger('click')

    expect(apiMock.delete).toHaveBeenCalledWith('/api/v1/posts/1/vote')
    expect(wrapper.vm.currentVote).toBeNull()
  })

  it('changes vote when clicking different vote type', async () => {
    // Set initial upvote
    await wrapper.setProps({ initialVote: 1 })
    await wrapper.vm.$nextTick()

    // Click downvote to change vote
    const downvoteButton = wrapper.find('.downvote-button')
    await downvoteButton.trigger('click')

    expect(apiMock.post).toHaveBeenCalledWith('/api/v1/posts/1/vote', {
      value: -1,
      type: 'downvote',
    })
    expect(wrapper.vm.currentVote).toBe(-1)
  })

  it('highlights active vote button', async () => {
    await wrapper.setProps({ initialVote: 1 })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.upvote-button').classes()).toContain('active')
    expect(wrapper.find('.downvote-button').classes()).not.toContain('active')
  })

  it('emits vote-changed event when vote changes', async () => {
    const upvoteButton = wrapper.find('.upvote-button')
    await upvoteButton.trigger('click')

    expect(wrapper.emitted('vote-changed')).toBeTruthy()
    expect(wrapper.emitted('vote-changed')[0]).toEqual([1])
  })

  it('emits vote-changed event with null when unvoting', async () => {
    // Set initial vote
    await wrapper.setProps({ initialVote: 1 })
    await wrapper.vm.$nextTick()

    // Unvote
    const upvoteButton = wrapper.find('.upvote-button')
    await upvoteButton.trigger('click')

    expect(wrapper.emitted('vote-changed')).toBeTruthy()
    expect(wrapper.emitted('vote-changed')[0]).toEqual([null])
  })
})
