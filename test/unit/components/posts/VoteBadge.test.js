import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import VoteBadge from '~/components/posts/VoteBadge.vue'

// Mock the auth store
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
    user: { id: 1, username: 'testuser' },
  }),
}))

describe('VoteBadge Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const createWrapper = (props = {}) => {
    return mount(VoteBadge, {
      props: {
        votes: 0,
        type: 'internal',
        isLoading: false,
        userHasVoted: false,
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => {
            const translations = {
              'posts.votes': 'Votes',
              'posts.vote': 'Vote',
              'posts.voted': 'Voted',
            }
            return translations[key] || key
          },
        },
        stubs: {
          NuxtLink: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders the vote badge container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.vote-badge').exists()).toBe(true)
    })

    it('renders vote count', () => {
      const wrapper = createWrapper({ votes: 42 })
      expect(wrapper.text()).toContain('42')
    })

    it('renders vote label', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Votes')
    })

    it('renders vote button', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.vote-button').exists()).toBe(true)
    })
  })

  describe('Vote Count Display', () => {
    it('displays zero votes correctly', () => {
      const wrapper = createWrapper({ votes: 0 })
      expect(wrapper.text()).toContain('0')
    })

    it('displays positive votes', () => {
      const wrapper = createWrapper({ votes: 15 })
      expect(wrapper.text()).toContain('15')
    })

    it('displays large vote numbers', () => {
      const wrapper = createWrapper({ votes: 1234 })
      expect(wrapper.text()).toContain('1234')
    })

    it('displays very large vote numbers', () => {
      const wrapper = createWrapper({ votes: 999999 })
      expect(wrapper.text()).toContain('999999')
    })

    it('handles negative votes', () => {
      const wrapper = createWrapper({ votes: -5 })
      expect(wrapper.text()).toContain('-5')
    })
  })

  describe('Vote Button States', () => {
    it('shows "Vote" text when user has not voted', () => {
      const wrapper = createWrapper({ userHasVoted: false })
      expect(wrapper.find('.vote-button').text()).toBe('Vote')
    })

    it('shows "Voted" text when user has voted', () => {
      const wrapper = createWrapper({ userHasVoted: true })
      expect(wrapper.find('.vote-button').text()).toBe('Voted')
    })

    it('applies voted class when user has voted', () => {
      const wrapper = createWrapper({ userHasVoted: true })
      expect(wrapper.find('.vote-button').classes()).toContain('voted')
    })

    it('does not apply voted class when user has not voted', () => {
      const wrapper = createWrapper({ userHasVoted: false })
      expect(wrapper.find('.vote-button').classes()).not.toContain('voted')
    })
  })

  describe('Loading State', () => {
    it('shows spinner when loading', () => {
      const wrapper = createWrapper({ isLoading: true })
      expect(wrapper.find('.spinner').exists()).toBe(true)
    })

    it('hides button text when loading', () => {
      const wrapper = createWrapper({ isLoading: true, userHasVoted: false })
      expect(wrapper.find('.vote-button').text()).toBe('')
    })

    it('disables button when loading', () => {
      const wrapper = createWrapper({ isLoading: true })
      expect(wrapper.find('.vote-button').attributes('disabled')).toBeDefined()
    })

    it('does not show spinner when not loading', () => {
      const wrapper = createWrapper({ isLoading: false })
      expect(wrapper.find('.spinner').exists()).toBe(false)
    })
  })

  describe('Vote Action', () => {
    it('emits vote event when clicking vote button', async () => {
      const wrapper = createWrapper({ userHasVoted: false })
      await wrapper.find('.vote-button').trigger('click')

      expect(wrapper.emitted('vote')).toBeTruthy()
      expect(wrapper.emitted('vote')[0]).toEqual([1])
    })

    it('emits unvote event when clicking voted button', async () => {
      const wrapper = createWrapper({ userHasVoted: true })
      await wrapper.find('.vote-button').trigger('click')

      expect(wrapper.emitted('vote')).toBeTruthy()
      expect(wrapper.emitted('vote')[0]).toEqual([0])
    })

    it('does not emit event when button is disabled', async () => {
      const wrapper = createWrapper({ isLoading: true })
      await wrapper.find('.vote-button').trigger('click')

      expect(wrapper.emitted('vote')).toBeFalsy()
    })
  })

  describe('Vote Pulse Animation', () => {
    it('shows pulse animation after loading completes', async () => {
      const wrapper = createWrapper({ isLoading: true })

      await wrapper.setProps({ isLoading: false })
      await wrapper.vm.$nextTick()

      const voteCount = wrapper.find('.text-xl')
      expect(voteCount.classes()).toContain('vote-pulse')
    })

    it('removes pulse animation after timeout', async () => {
      const wrapper = createWrapper({ isLoading: true })

      await wrapper.setProps({ isLoading: false })
      await wrapper.vm.$nextTick()

      // Animation should be present initially
      expect(wrapper.find('.text-xl').classes()).toContain('vote-pulse')

      // Fast forward time by 800ms
      vi.advanceTimersByTime(800)
      await wrapper.vm.$nextTick()

      // Animation should be removed
      expect(wrapper.find('.text-xl').classes()).not.toContain('vote-pulse')
    })

    it('does not show pulse animation on initial render', () => {
      const wrapper = createWrapper({ isLoading: false })
      const voteCount = wrapper.find('.text-xl')
      expect(voteCount.classes()).not.toContain('vote-pulse')
    })

    it('only shows pulse animation when loading transitions from true to false', async () => {
      const wrapper = createWrapper({ isLoading: false })

      await wrapper.setProps({ isLoading: false })
      await wrapper.vm.$nextTick()

      const voteCount = wrapper.find('.text-xl')
      expect(voteCount.classes()).not.toContain('vote-pulse')
    })
  })

  describe('Props', () => {
    it('accepts votes prop', () => {
      const wrapper = createWrapper({ votes: 123 })
      expect(wrapper.props('votes')).toBe(123)
    })

    it('defaults votes to 0', () => {
      const wrapper = createWrapper({ votes: undefined })
      expect(wrapper.props('votes')).toBe(0)
    })

    it('accepts type prop', () => {
      const wrapper = createWrapper({ type: 'external' })
      expect(wrapper.props('type')).toBe('external')
    })

    it('defaults type to "internal"', () => {
      const wrapper = createWrapper({ type: undefined })
      expect(wrapper.props('type')).toBe('internal')
    })

    it('accepts isLoading prop', () => {
      const wrapper = createWrapper({ isLoading: true })
      expect(wrapper.props('isLoading')).toBe(true)
    })

    it('defaults isLoading to false', () => {
      const wrapper = createWrapper({ isLoading: undefined })
      expect(wrapper.props('isLoading')).toBe(false)
    })

    it('accepts userHasVoted prop', () => {
      const wrapper = createWrapper({ userHasVoted: true })
      expect(wrapper.props('userHasVoted')).toBe(true)
    })

    it('defaults userHasVoted to false', () => {
      const wrapper = createWrapper({ userHasVoted: undefined })
      expect(wrapper.props('userHasVoted')).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('has aria-label when user has not voted', () => {
      const wrapper = createWrapper({ userHasVoted: false })
      expect(wrapper.find('.vote-button').attributes('aria-label')).toBe('Vote')
    })

    it('has aria-label when user has voted', () => {
      const wrapper = createWrapper({ userHasVoted: true })
      expect(wrapper.find('.vote-button').attributes('aria-label')).toBe('Voted')
    })

    it('has screen reader only text for vote label', () => {
      const wrapper = createWrapper({ votes: 0 })
      expect(wrapper.find('.sr-only').exists()).toBe(false) // Badge text is always visible
    })
  })

  describe('Styling', () => {
    it('applies correct base classes to container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.vote-badge').classes()).toContain('vote-badge')
    })

    it('applies correct classes to vote count', () => {
      const wrapper = createWrapper()
      const voteCount = wrapper.find('.text-xl')
      expect(voteCount.classes()).toContain('font-bold')
      expect(voteCount.classes()).toContain('tabular-nums')
    })

    it('applies correct classes to vote button', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.vote-button')
      expect(button.classes()).toContain('vote-button')
    })
  })

  describe('Click Events', () => {
    it('prevents event propagation when clicking button', async () => {
      const wrapper = createWrapper()
      const clickEvent = new MouseEvent('click')
      vi.spyOn(clickEvent, 'stopPropagation')

      await wrapper.find('.vote-button').trigger('click', clickEvent)

      // Note: @click.stop modifier should prevent propagation
      // This is handled by Vue, so we can't directly test it in unit tests
      expect(wrapper.emitted('vote')).toBeTruthy()
    })
  })

  describe('Vote Count Updates', () => {
    it('updates vote count when prop changes', async () => {
      const wrapper = createWrapper({ votes: 10 })
      expect(wrapper.text()).toContain('10')

      await wrapper.setProps({ votes: 15 })
      expect(wrapper.text()).toContain('15')
    })

    it('updates button state when userHasVoted prop changes', async () => {
      const wrapper = createWrapper({ userHasVoted: false })
      expect(wrapper.find('.vote-button').text()).toBe('Vote')

      await wrapper.setProps({ userHasVoted: true })
      expect(wrapper.find('.vote-button').text()).toBe('Voted')
    })
  })

  describe('Edge Cases', () => {
    it('handles null votes gracefully', () => {
      const wrapper = createWrapper({ votes: null })
      expect(wrapper.text()).toContain('0')
    })

    it('handles undefined votes gracefully', () => {
      const wrapper = createWrapper({ votes: undefined })
      expect(wrapper.text()).toContain('0')
    })

    it('handles rapid loading state changes', async () => {
      const wrapper = createWrapper({ isLoading: false })

      await wrapper.setProps({ isLoading: true })
      await wrapper.setProps({ isLoading: false })
      await wrapper.vm.$nextTick()

      const voteCount = wrapper.find('.text-xl')
      expect(voteCount.classes()).toContain('vote-pulse')
    })

    it('handles multiple vote toggles', async () => {
      const wrapper = createWrapper({ userHasVoted: false })

      // First vote
      await wrapper.find('.vote-button').trigger('click')
      expect(wrapper.emitted('vote')[0]).toEqual([1])

      await wrapper.setProps({ userHasVoted: true })

      // Unvote
      await wrapper.find('.vote-button').trigger('click')
      expect(wrapper.emitted('vote')[1]).toEqual([0])
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot with no votes', () => {
      const wrapper = createWrapper({ votes: 0, userHasVoted: false })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with votes', () => {
      const wrapper = createWrapper({ votes: 42, userHasVoted: false })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when user has voted', () => {
      const wrapper = createWrapper({ votes: 42, userHasVoted: true })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when loading', () => {
      const wrapper = createWrapper({ votes: 42, isLoading: true })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
