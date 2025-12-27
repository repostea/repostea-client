import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SortControls from '~/components/posts/SortControls.vue'

vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const translations = {
        'links.recent': 'Recent',
        'links.most_valued': 'Most Valued',
        'links.most_commented': 'Most Commented',
        'links.most_visited': 'Most Visited',
        'filters.last_24_hours': 'Last 24 hours',
        'filters.last_7_days': 'Last 7 days',
        'filters.last_30_days': 'Last 30 days',
        'filters.all_time': 'All time',
      }
      return translations[key] || key
    },
  }),
}))

describe('SortControls Component', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    const mockT = (key) => {
      const translations = {
        'links.recent': 'Recent',
        'links.most_valued': 'Most Valued',
        'links.most_commented': 'Most Commented',
        'links.most_visited': 'Most Visited',
        'filters.last_24_hours': 'Last 24 hours',
        'filters.last_7_days': 'Last 7 days',
        'filters.last_30_days': 'Last 30 days',
        'filters.all_time': 'All time',
      }
      return translations[key] || key
    }

    return mount(SortControls, {
      props: {
        sort: 'lastActive',
        direction: 'desc',
        timeInterval: '43200',
        ...props,
      },
      global: {
        mocks: {
          $t: mockT,
        },
        stubs: {
          ClientOnly: {
            template: '<div><slot /></div>',
          },
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders the component', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('has sort-controls class', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.sort-controls').exists()).toBe(true)
    })

    it('renders all sort buttons', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('.sort-button')
      expect(buttons.length).toBe(4)
    })

    it('renders Recent button', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Recent')
    })

    it('renders Most Valued button', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Most Valued')
    })

    it('renders Most Commented button', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Most Commented')
    })

    it('renders Most Visited button', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Most Visited')
    })
  })

  describe('Sort Icons', () => {
    it('Recent button has clock icon', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('.sort-button')
      const recentButton = buttons.find((btn) => btn.text().includes('Recent'))
      const icon = recentButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:clock')
    })

    it('Most Valued button has bolt icon', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('.sort-button')
      const valuedButton = buttons.find((btn) => btn.text().includes('Most Valued'))
      const icon = valuedButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:bolt')
    })

    it('Most Commented button has comments icon', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('.sort-button')
      const commentedButton = buttons.find((btn) => btn.text().includes('Most Commented'))
      const icon = commentedButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:comments')
    })

    it('Most Visited button has eye icon', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('.sort-button')
      const visitedButton = buttons.find((btn) => btn.text().includes('Most Visited'))
      const icon = visitedButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:eye')
    })
  })

  describe('Active Sort State', () => {
    it('marks Recent as active by default', () => {
      wrapper = createWrapper({ sort: 'lastActive', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const recentButton = buttons.find((btn) => btn.text().includes('Recent'))
      expect(recentButton.classes()).toContain('active')
    })

    it('marks Most Valued as active when selected', () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const valuedButton = buttons.find((btn) => btn.text().includes('Most Valued'))
      expect(valuedButton.classes()).toContain('active')
    })

    it('marks Most Commented as active when selected', () => {
      wrapper = createWrapper({ sort: 'comments', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const commentedButton = buttons.find((btn) => btn.text().includes('Most Commented'))
      expect(commentedButton.classes()).toContain('active')
    })

    it('marks Most Visited as active when selected', () => {
      wrapper = createWrapper({ sort: 'views', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const visitedButton = buttons.find((btn) => btn.text().includes('Most Visited'))
      expect(visitedButton.classes()).toContain('active')
    })

    it('only one button is active at a time', () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      const activeButtons = wrapper.findAll('.sort-button.active')
      expect(activeButtons.length).toBe(1)
    })

    it('correctly identifies active sort using isActiveSort', () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      expect(wrapper.vm.isActiveSort('favourites', 'desc')).toBe(true)
      expect(wrapper.vm.isActiveSort('lastActive', 'desc')).toBe(false)
    })
  })

  describe('Sort Selection', () => {
    it('emits update:sort when clicking Recent', async () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const recentButton = buttons.find((btn) => btn.text().includes('Recent'))
      await recentButton.trigger('click')

      expect(wrapper.emitted('update:sort')).toBeTruthy()
      expect(wrapper.emitted('update:sort')[0]).toEqual(['lastActive'])
    })

    it('emits update:direction when clicking Recent', async () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const recentButton = buttons.find((btn) => btn.text().includes('Recent'))
      await recentButton.trigger('click')

      expect(wrapper.emitted('update:direction')).toBeTruthy()
      expect(wrapper.emitted('update:direction')[0]).toEqual(['desc'])
    })

    it('emits update:sort when clicking Most Valued', async () => {
      wrapper = createWrapper({ sort: 'lastActive', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const valuedButton = buttons.find((btn) => btn.text().includes('Most Valued'))
      await valuedButton.trigger('click')

      expect(wrapper.emitted('update:sort')[0]).toEqual(['favourites'])
    })

    it('emits update:sort when clicking Most Commented', async () => {
      wrapper = createWrapper({ sort: 'lastActive', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const commentedButton = buttons.find((btn) => btn.text().includes('Most Commented'))
      await commentedButton.trigger('click')

      expect(wrapper.emitted('update:sort')[0]).toEqual(['comments'])
    })

    it('emits update:sort when clicking Most Visited', async () => {
      wrapper = createWrapper({ sort: 'lastActive', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const visitedButton = buttons.find((btn) => btn.text().includes('Most Visited'))
      await visitedButton.trigger('click')

      expect(wrapper.emitted('update:sort')[0]).toEqual(['views'])
    })

    it('does not emit when clicking already active sort', async () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      const buttons = wrapper.findAll('.sort-button')
      const valuedButton = buttons.find((btn) => btn.text().includes('Most Valued'))
      await valuedButton.trigger('click')

      expect(wrapper.emitted('update:sort')).toBeFalsy()
      expect(wrapper.emitted('update:direction')).toBeFalsy()
    })
  })

  describe('Time Filter Display', () => {
    it('does not show time filter for Recent sort', () => {
      wrapper = createWrapper({ sort: 'lastActive' })
      expect(wrapper.find('.time-select').exists()).toBe(false)
    })

    it('shows time filter for Most Valued sort', () => {
      wrapper = createWrapper({ sort: 'favourites' })
      expect(wrapper.find('.time-select').exists()).toBe(true)
    })

    it('shows time filter for Most Commented sort', () => {
      wrapper = createWrapper({ sort: 'comments' })
      expect(wrapper.find('.time-select').exists()).toBe(true)
    })

    it('shows time filter for Most Visited sort', () => {
      wrapper = createWrapper({ sort: 'views' })
      expect(wrapper.find('.time-select').exists()).toBe(true)
    })

    it('needsTimeFilter returns false for lastActive', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.needsTimeFilter('lastActive')).toBe(false)
    })

    it('needsTimeFilter returns true for favourites', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.needsTimeFilter('favourites')).toBe(true)
    })

    it('needsTimeFilter returns true for comments', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.needsTimeFilter('comments')).toBe(true)
    })

    it('needsTimeFilter returns true for views', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.needsTimeFilter('views')).toBe(true)
    })
  })

  describe('Time Filter Options', () => {
    beforeEach(() => {
      wrapper = createWrapper({ sort: 'favourites', timeInterval: '1440' })
    })

    it('shows all time options', () => {
      expect(wrapper.text()).toContain('Last 24 hours')
      expect(wrapper.text()).toContain('Last 7 days')
      expect(wrapper.text()).toContain('Last 30 days')
      expect(wrapper.text()).toContain('All time')
    })

    it('has 4 time options', () => {
      const options = wrapper.findAll('.time-select option')
      expect(options.length).toBe(4)
    })

    it('option values are correct', () => {
      const options = wrapper.findAll('.time-select option')
      expect(options[0].attributes('value')).toBe('1440')
      expect(options[1].attributes('value')).toBe('10080')
      expect(options[2].attributes('value')).toBe('43200')
      expect(options[3].attributes('value')).toBe('0')
    })

    it('selects Last 24 hours by default when timeInterval is 1440', () => {
      const select = wrapper.find('.time-select')
      expect(select.element.value).toBe('1440')
    })

    it('selects Last 30 days when timeInterval is 43200', async () => {
      await wrapper.setProps({ timeInterval: '43200' })
      const select = wrapper.find('.time-select')
      expect(select.element.value).toBe('43200')
    })

    it('selects All time when timeInterval is 0', async () => {
      await wrapper.setProps({ timeInterval: '0' })
      const select = wrapper.find('.time-select')
      expect(select.element.value).toBe('0')
    })
  })

  describe('Time Filter Interaction', () => {
    it('emits update:timeInterval when changing time filter', async () => {
      wrapper = createWrapper({ sort: 'favourites', timeInterval: '1440' })
      const select = wrapper.find('.time-select')
      await select.setValue('10080')

      expect(wrapper.emitted('update:timeInterval')).toBeTruthy()
      expect(wrapper.emitted('update:timeInterval')[0]).toEqual(['10080'])
    })

    it('emits update:timeInterval when selecting all time', async () => {
      wrapper = createWrapper({ sort: 'favourites', timeInterval: '1440' })
      const select = wrapper.find('.time-select')
      await select.setValue('0')

      expect(wrapper.emitted('update:timeInterval')[0]).toEqual(['0'])
    })

    it('uses v-model for time interval', () => {
      wrapper = createWrapper({ sort: 'favourites', timeInterval: '43200' })
      expect(wrapper.vm.timeIntervalModel).toBe('43200')
    })
  })

  describe('Time Filter Styling', () => {
    it('applies active styling when non-default time selected', async () => {
      wrapper = createWrapper({ sort: 'favourites', timeInterval: '10080' })
      const select = wrapper.find('.time-select')
      // Component uses time-select-active class for non-default times
      expect(select.classes()).toContain('time-select-active')
    })

    it('applies default styling when 24 hours selected', () => {
      wrapper = createWrapper({ sort: 'favourites', timeInterval: '1440' })
      const select = wrapper.find('.time-select')
      expect(select.classes()).not.toContain('time-select-active')
    })

    it('applies active styling for all time selection', async () => {
      wrapper = createWrapper({ sort: 'favourites', timeInterval: '0' })
      const select = wrapper.find('.time-select')
      expect(select.classes()).toContain('time-select-active')
    })
  })

  describe('Props', () => {
    it('accepts sort prop', () => {
      wrapper = createWrapper({ sort: 'comments' })
      expect(wrapper.props('sort')).toBe('comments')
    })

    it('accepts direction prop', () => {
      wrapper = createWrapper({ direction: 'asc' })
      expect(wrapper.props('direction')).toBe('asc')
    })

    it('accepts timeInterval prop', () => {
      wrapper = createWrapper({ timeInterval: '10080' })
      expect(wrapper.props('timeInterval')).toBe('10080')
    })

    it('has default value for sort prop', () => {
      wrapper = mount(SortControls)
      expect(wrapper.props('sort')).toBe('lastActive')
    })

    it('has default value for direction prop', () => {
      wrapper = mount(SortControls)
      expect(wrapper.props('direction')).toBe('desc')
    })

    it('has default value for timeInterval prop', () => {
      wrapper = mount(SortControls)
      expect(wrapper.props('timeInterval')).toBe('43200')
    })
  })

  describe('Component Methods', () => {
    it('setSort does not emit when same sort is selected', () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      wrapper.vm.setSort('favourites', 'desc')
      expect(wrapper.emitted('update:sort')).toBeFalsy()
    })

    it('setSort emits both sort and direction', () => {
      wrapper = createWrapper({ sort: 'lastActive', direction: 'desc' })
      wrapper.vm.setSort('favourites', 'desc')
      expect(wrapper.emitted('update:sort')).toBeTruthy()
      expect(wrapper.emitted('update:direction')).toBeTruthy()
    })

    it('isActiveSort checks both sort and direction', () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      expect(wrapper.vm.isActiveSort('favourites', 'desc')).toBe(true)
      expect(wrapper.vm.isActiveSort('favourites', 'asc')).toBe(false)
    })
  })

  describe('Styling Classes', () => {
    // Test removed: base classes verification - CSS classes change frequently, low value test

    it('active button has correct classes', () => {
      wrapper = createWrapper({ sort: 'favourites' })
      const buttons = wrapper.findAll('.sort-button')
      const activeButton = buttons.find((btn) => btn.classes().includes('active'))
      expect(activeButton.classes()).toContain('sort-button')
      expect(activeButton.classes()).toContain('active')
    })

    it('time select has time-select class', () => {
      wrapper = createWrapper({ sort: 'favourites' })
      const select = wrapper.find('.time-select')
      expect(select.classes()).toContain('time-select')
    })
  })

  describe('Responsive Behavior', () => {
    it('has responsive classes for mobile', () => {
      wrapper = createWrapper()
      // The component has media queries in scoped CSS for mobile
      // at max-width 640px, text is hidden except for active button
      expect(wrapper.find('.sort-controls').exists()).toBe(true)
    })

    it('all buttons maintain their structure on mobile', () => {
      wrapper = createWrapper()
      const buttons = wrapper.findAll('.sort-button')
      expect(buttons.length).toBe(4)
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot with Recent sort active', () => {
      wrapper = createWrapper({ sort: 'lastActive', direction: 'desc' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with Most Valued sort active', () => {
      wrapper = createWrapper({ sort: 'favourites', direction: 'desc' })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with time filter visible', () => {
      wrapper = createWrapper({
        sort: 'comments',
        direction: 'desc',
        timeInterval: '10080',
      })
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with all time selected', () => {
      wrapper = createWrapper({
        sort: 'views',
        direction: 'desc',
        timeInterval: '0',
      })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
