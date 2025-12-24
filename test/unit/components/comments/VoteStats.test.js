import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VoteStatsComponent from '~/components/comments/VoteStatsComponent.vue'

// Mock i18n
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}))

describe('VoteStatsComponent', () => {
  let wrapper
  const mockProps = {
    voteDetails: [],
    voteStats: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    wrapper = mount(VoteStatsComponent, {
      props: mockProps,
      global: {
        mocks: {
          $t: (key) => key,
        },
      },
    })
  })

  describe('Component Rendering', () => {
    it('renders the component correctly', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('displays no votes message when no data', () => {
      expect(wrapper.text()).toContain('vote.stats.no_votes')
    })

    it('shows correct structure', () => {
      expect(wrapper.find('.vote-stats').exists()).toBe(true)
    })
  })
})
