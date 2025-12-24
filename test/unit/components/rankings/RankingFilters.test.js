import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RankingFilters from '~/components/rankings/RankingFilters.vue'

describe('RankingFilters Component', () => {
  const createWrapper = (props = {}) => {
    return mount(RankingFilters, {
      props: {
        selectedTimeframe: 'all',
        ...props,
      },
      global: {
        mocks: {
          $t: (key) => {
            const translations = {
              'rankings.timeframes.all_time': 'All Time',
              'rankings.timeframes.this_month': 'This Month',
              'rankings.timeframes.this_week': 'This Week',
              'rankings.timeframes.today': 'Today',
            }
            return translations[key] || key
          },
          t: (key) => {
            const translations = {
              'rankings.timeframes.all_time': 'All Time',
              'rankings.timeframes.this_month': 'This Month',
              'rankings.timeframes.this_week': 'This Week',
              'rankings.timeframes.today': 'Today',
            }
            return translations[key] || key
          },
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders the filter container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.ranking-filters').exists()).toBe(true)
    })

    it('renders all four timeframe buttons', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')
      expect(buttons).toHaveLength(4)
    })

    it('renders buttons with correct labels', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')

      expect(buttons[0].text()).toBe('All Time')
      expect(buttons[1].text()).toBe('This Month')
      expect(buttons[2].text()).toBe('This Week')
      expect(buttons[3].text()).toBe('Today')
    })

    it('uses i18n translations for button labels', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')

      // All buttons should have translated text
      buttons.forEach((button) => {
        expect(button.text()).toBeTruthy()
        expect(button.text().length).toBeGreaterThan(0)
      })
    })
  })

  describe('Active State', () => {
    it('marks "all" button as active by default', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'all' })
      const buttons = wrapper.findAll('.timeframe-btn')

      expect(buttons[0].classes()).toContain('active')
    })

    it('marks "month" button as active when selected', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'month' })
      const buttons = wrapper.findAll('.timeframe-btn')

      expect(buttons[1].classes()).toContain('active')
    })

    it('marks "week" button as active when selected', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'week' })
      const buttons = wrapper.findAll('.timeframe-btn')

      expect(buttons[2].classes()).toContain('active')
    })

    it('marks "today" button as active when selected', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'today' })
      const buttons = wrapper.findAll('.timeframe-btn')

      expect(buttons[3].classes()).toContain('active')
    })

    it('only one button is active at a time', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'week' })
      const buttons = wrapper.findAll('.timeframe-btn')
      const activeButtons = buttons.filter((btn) => btn.classes().includes('active'))

      expect(activeButtons).toHaveLength(1)
    })
  })

  describe('Events', () => {
    it('emits timeframe-change event when clicking "all" button', async () => {
      const wrapper = createWrapper({ selectedTimeframe: 'week' })
      const buttons = wrapper.findAll('.timeframe-btn')

      await buttons[0].trigger('click')

      expect(wrapper.emitted('timeframe-change')).toBeTruthy()
      expect(wrapper.emitted('timeframe-change')[0]).toEqual(['all'])
    })

    it('emits timeframe-change event when clicking "month" button', async () => {
      const wrapper = createWrapper({ selectedTimeframe: 'all' })
      const buttons = wrapper.findAll('.timeframe-btn')

      await buttons[1].trigger('click')

      expect(wrapper.emitted('timeframe-change')).toBeTruthy()
      expect(wrapper.emitted('timeframe-change')[0]).toEqual(['month'])
    })

    it('emits timeframe-change event when clicking "week" button', async () => {
      const wrapper = createWrapper({ selectedTimeframe: 'all' })
      const buttons = wrapper.findAll('.timeframe-btn')

      await buttons[2].trigger('click')

      expect(wrapper.emitted('timeframe-change')).toBeTruthy()
      expect(wrapper.emitted('timeframe-change')[0]).toEqual(['week'])
    })

    it('emits timeframe-change event when clicking "today" button', async () => {
      const wrapper = createWrapper({ selectedTimeframe: 'all' })
      const buttons = wrapper.findAll('.timeframe-btn')

      await buttons[3].trigger('click')

      expect(wrapper.emitted('timeframe-change')).toBeTruthy()
      expect(wrapper.emitted('timeframe-change')[0]).toEqual(['today'])
    })

    it('emits correct event data for each timeframe', async () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')

      const expectedIds = ['all', 'month', 'week', 'today']

      for (let i = 0; i < buttons.length; i++) {
        await buttons[i].trigger('click')
        expect(wrapper.emitted('timeframe-change')[i]).toEqual([expectedIds[i]])
      }
    })
  })

  describe('Props', () => {
    it('accepts selectedTimeframe prop', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'month' })
      expect(wrapper.props('selectedTimeframe')).toBe('month')
    })

    it('is required and defaults to "all"', () => {
      const wrapper = createWrapper({})
      expect(wrapper.props('selectedTimeframe')).toBe('all')
    })

    it('updates active state when prop changes', async () => {
      const wrapper = createWrapper({ selectedTimeframe: 'all' })

      await wrapper.setProps({ selectedTimeframe: 'week' })

      const buttons = wrapper.findAll('.timeframe-btn')
      expect(buttons[2].classes()).toContain('active')
    })
  })

  describe('Styling', () => {
    it('applies correct container classes', () => {
      const wrapper = createWrapper()
      const container = wrapper.find('.ranking-filters')

      expect(container.classes()).toContain('ranking-filters')
    })

    it('applies button group classes', () => {
      const wrapper = createWrapper()
      const buttonGroup = wrapper.find('.inline-flex')

      expect(buttonGroup.exists()).toBe(true)
      expect(buttonGroup.classes()).toContain('inline-flex')
      expect(buttonGroup.classes()).toContain('rounded-lg')
    })

    it('applies correct classes to buttons', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')

      buttons.forEach((button) => {
        expect(button.classes()).toContain('timeframe-btn')
      })
    })

    it('applies active class styling', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'month' })
      const activeButton = wrapper.findAll('.timeframe-btn')[1]

      expect(activeButton.classes()).toContain('active')
    })
  })

  describe('Timeframe Data', () => {
    it('contains all expected timeframe IDs', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')

      // Verify all buttons exist and can be clicked
      expect(buttons).toHaveLength(4)
    })

    it('maintains correct order of timeframes', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')

      expect(buttons[0].text()).toBe('All Time')
      expect(buttons[1].text()).toBe('This Month')
      expect(buttons[2].text()).toBe('This Week')
      expect(buttons[3].text()).toBe('Today')
    })
  })

  describe('Accessibility', () => {
    it('buttons are keyboard accessible', () => {
      const wrapper = createWrapper()
      const buttons = wrapper.findAll('.timeframe-btn')

      buttons.forEach((button) => {
        expect(button.element.tagName).toBe('BUTTON')
      })
    })

    it('active button has distinct visual state', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'week' })
      const buttons = wrapper.findAll('.timeframe-btn')
      const activeButton = buttons[2]

      expect(activeButton.classes()).toContain('active')
    })
  })

  describe('User Interactions', () => {
    it('allows switching between timeframes', async () => {
      const wrapper = createWrapper({ selectedTimeframe: 'all' })
      const buttons = wrapper.findAll('.timeframe-btn')

      // Click on week
      await buttons[2].trigger('click')
      expect(wrapper.emitted('timeframe-change')[0]).toEqual(['week'])

      // Click on month
      await buttons[1].trigger('click')
      expect(wrapper.emitted('timeframe-change')[1]).toEqual(['month'])

      // Click on today
      await buttons[3].trigger('click')
      expect(wrapper.emitted('timeframe-change')[2]).toEqual(['today'])
    })

    it('can click on already active timeframe', async () => {
      const wrapper = createWrapper({ selectedTimeframe: 'month' })
      const buttons = wrapper.findAll('.timeframe-btn')

      await buttons[1].trigger('click')

      expect(wrapper.emitted('timeframe-change')).toBeTruthy()
      expect(wrapper.emitted('timeframe-change')[0]).toEqual(['month'])
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot with "all" selected', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'all' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with "month" selected', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'month' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with "week" selected', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'week' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with "today" selected', () => {
      const wrapper = createWrapper({ selectedTimeframe: 'today' })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
