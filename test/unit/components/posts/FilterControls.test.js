import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FilterControls from '~/components/posts/FilterControls.vue'

const mockUserPreferencesStore = {
  getFilters: null,
  setFilters: vi.fn((filters) => {
    mockUserPreferencesStore.getFilters = filters
  }),
  setContentTypeFilter: vi.fn((contentType) => {
    if (contentType === null) {
      const { content_type: _content_type, ...rest } = mockUserPreferencesStore.getFilters || {}
      mockUserPreferencesStore.getFilters = Object.keys(rest).length > 0 ? rest : null
      mockUserPreferencesStore.setFilters(mockUserPreferencesStore.getFilters)
    } else {
      mockUserPreferencesStore.getFilters = {
        ...mockUserPreferencesStore.getFilters,
        content_type: contentType,
      }
      mockUserPreferencesStore.setFilters(mockUserPreferencesStore.getFilters)
    }
  }),
  get getContentTypeFilter() {
    return this.getFilters?.content_type || null
  },
}

vi.mock('~/stores/userPreferences', () => ({
  useUserPreferencesStore: () => mockUserPreferencesStore,
}))

vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const translations = {
        'filters.all': 'All',
        'filters.text': 'Text',
        'filters.link': 'Link',
        'filters.video': 'Video',
        'filters.audio': 'Audio',
        'filters.poll': 'Poll',
        'filters.content_type': 'Content Type',
      }
      return translations[key] || key
    },
  }),
}))

describe('FilterControls Component', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockUserPreferencesStore.getFilters = null

    // Mock process.client (just add property, don't replace object)
    process.client = true

    // Mock document and window event listeners
    document.addEventListener = vi.fn()
    document.removeEventListener = vi.fn()
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()
    window.dispatchEvent = vi.fn()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = () => {
    const mockT = (key) => {
      const translations = {
        'filters.all': 'All',
        'filters.text': 'Text',
        'filters.link': 'Link',
        'filters.video': 'Video',
        'filters.audio': 'Audio',
        'filters.poll': 'Poll',
        'filters.content_type': 'Content Type',
      }
      return translations[key] || key
    }

    return mount(FilterControls, {
      global: {
        mocks: {
          $t: mockT,
        },
        stubs: {
          ClientOnly: {
            template: '<div><slot /></div>',
          },
          Icon: {
            template: '<i class="iconify-icon" :name="name"></i>',
            props: ['name'],
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

    it('renders the control button', () => {
      wrapper = createWrapper()
      const button = wrapper.find('.control-button')
      expect(button.exists()).toBe(true)
    })

    it('control button has title attribute', () => {
      wrapper = createWrapper()
      const button = wrapper.find('.control-button')
      expect(button.attributes('title')).toBe('Content Type')
    })

    it('shows "All" label by default', () => {
      mockUserPreferencesStore.getFilters = null
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('All')
    })

    it('shows filter icon by default', () => {
      mockUserPreferencesStore.getFilters = null
      wrapper = createWrapper()
      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map((icon) => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:filter')
    })

    it('shows chevron down when collapsed', () => {
      wrapper = createWrapper()
      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map((icon) => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:chevron-down')
    })

    it('does not show dropdown by default', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.isExpanded).toBe(false)
      expect(wrapper.find('.control-dropdown').exists()).toBe(false)
    })
  })

  describe('Dropdown Toggle', () => {
    it('opens dropdown when clicking control button', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)
      expect(wrapper.find('.control-dropdown').exists()).toBe(true)
    })

    it('closes dropdown when clicking control button again', async () => {
      wrapper = createWrapper()
      const button = wrapper.find('.control-button')

      await button.trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)

      await button.trigger('click')
      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('shows chevron up when expanded', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map((icon) => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:chevron-up')
    })

    it('applies active class to button when expanded', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      const button = wrapper.find('.control-button')
      expect(button.classes()).toContain('active')
    })

    it('dispatches close-other-dropdowns event when opening', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      expect(window.dispatchEvent).toHaveBeenCalled()
    })
  })

  describe('Filter Options', () => {
    it('shows all filter options when expanded', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      expect(wrapper.text()).toContain('All')
      expect(wrapper.text()).toContain('Text')
      expect(wrapper.text()).toContain('Link')
      expect(wrapper.text()).toContain('Video')
      expect(wrapper.text()).toContain('Audio')
      expect(wrapper.text()).toContain('Poll')
    })

    it('shows correct icons for each filter', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map((icon) => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:globe') // All
      expect(iconNames).toContain('fa6-solid:file-lines') // Text
      expect(iconNames).toContain('fa6-solid:link') // Link
      expect(iconNames).toContain('fa6-solid:video') // Video
      expect(iconNames).toContain('fa6-solid:headphones') // Audio
      expect(iconNames).toContain('fa6-solid:square-poll-vertical') // Poll
    })

    it('highlights "All" filter by default', async () => {
      mockUserPreferencesStore.getFilters = null
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const allButton = buttons[0]
      expect(allButton.classes()).toContain('active')
    })

    it('all filter buttons are present', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      expect(buttons.length).toBe(6) // All, Text, Link, Video, Audio, Poll
    })
  })

  describe('Filter Selection', () => {
    it('sets text filter when clicking text option', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const textButton = buttons.find((btn) => btn.text().includes('Text'))
      await textButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith({
        content_type: 'text',
      })
    })

    it('sets link filter when clicking link option', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const linkButton = buttons.find((btn) => btn.text().includes('Link'))
      await linkButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith({
        content_type: 'link',
      })
    })

    it('sets video filter when clicking video option', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const videoButton = buttons.find((btn) => btn.text().includes('Video'))
      await videoButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith({
        content_type: 'video',
      })
    })

    it('sets audio filter when clicking audio option', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const audioButton = buttons.find((btn) => btn.text().includes('Audio'))
      await audioButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith({
        content_type: 'audio',
      })
    })

    it('sets poll filter when clicking poll option', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const pollButton = buttons.find((btn) => btn.text().includes('Poll'))
      await pollButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith({
        content_type: 'poll',
      })
    })

    it('removes filter when clicking all option', async () => {
      mockUserPreferencesStore.getFilters = { content_type: 'text' }
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const allButton = buttons[0]
      await allButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith(null)
    })

    it('closes dropdown after selecting filter', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      expect(wrapper.vm.isExpanded).toBe(true)

      const buttons = wrapper.findAll('.filter-button')
      const textButton = buttons.find((btn) => btn.text().includes('Text'))
      await textButton.trigger('click')

      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('emits filter-changed event when filter is selected', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const textButton = buttons.find((btn) => btn.text().includes('Text'))
      await textButton.trigger('click')

      expect(wrapper.emitted('filter-changed')).toBeTruthy()
      expect(wrapper.emitted('filter-changed')[0]).toEqual(['text'])
    })

    it('emits null when selecting all filter', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const allButton = buttons[0]
      await allButton.trigger('click')

      expect(wrapper.emitted('filter-changed')).toBeTruthy()
      expect(wrapper.emitted('filter-changed')[0]).toEqual([null])
    })
  })

  describe('Active Filter Display', () => {
    it('displays text filter label when text filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'text' }
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Text')
    })

    it('displays link filter label when link filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'link' }
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Link')
    })

    it('displays video filter label when video filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'video' }
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Video')
    })

    it('shows text icon when text filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'text' }
      wrapper = createWrapper()
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:file-lines')
    })

    it('shows link icon when link filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'link' }
      wrapper = createWrapper()
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:link')
    })

    it('shows video icon when video filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'video' }
      wrapper = createWrapper()
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:video')
    })

    it('shows audio icon when audio filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'audio' }
      wrapper = createWrapper()
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:headphones')
    })

    it('shows poll icon when poll filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'poll' }
      wrapper = createWrapper()
      const icon = wrapper.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:square-poll-vertical')
    })

    it('highlights active filter in dropdown', async () => {
      mockUserPreferencesStore.getFilters = { content_type: 'text' }
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const textButton = buttons.find((btn) => btn.text().includes('Text'))
      expect(textButton.classes()).toContain('active')
    })

    it('applies primary color styling when filter is active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'text' }
      wrapper = createWrapper()
      const button = wrapper.find('.control-button')
      expect(button.classes()).toContain('text-primary')
    })
  })

  describe('Filter Preservation', () => {
    it('preserves other filters when setting content_type filter', async () => {
      mockUserPreferencesStore.getFilters = { other_filter: 'value' }
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const textButton = buttons.find((btn) => btn.text().includes('Text'))
      await textButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith({
        other_filter: 'value',
        content_type: 'text',
      })
    })

    it('removes only content_type when selecting all', async () => {
      mockUserPreferencesStore.getFilters = {
        content_type: 'text',
        other_filter: 'value',
      }
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const allButton = buttons[0]
      await allButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith({
        other_filter: 'value',
      })
    })

    it('sets null when no other filters exist and selecting all', async () => {
      mockUserPreferencesStore.getFilters = { content_type: 'text' }
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')

      const buttons = wrapper.findAll('.filter-button')
      const allButton = buttons[0]
      await allButton.trigger('click')

      expect(mockUserPreferencesStore.setFilters).toHaveBeenCalledWith(null)
    })
  })

  describe('Click Outside Handling', () => {
    it('registers click listener on mount', () => {
      wrapper = createWrapper()
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    })

    it('registers close-other-dropdowns listener on mount', () => {
      wrapper = createWrapper()
      expect(window.addEventListener).toHaveBeenCalledWith(
        'close-other-dropdowns',
        expect.any(Function)
      )
    })

    it('closes dropdown when clicking outside', () => {
      wrapper = createWrapper()
      wrapper.vm.isExpanded = true

      const outsideElement = document.createElement('div')
      const clickEvent = new MouseEvent('click', { target: outsideElement })
      wrapper.vm.handleClickOutside(clickEvent)

      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('does not close dropdown when clicking inside', () => {
      wrapper = createWrapper()
      wrapper.vm.isExpanded = true

      const insideElement = wrapper.element
      const clickEvent = { target: insideElement }
      wrapper.vm.handleClickOutside(clickEvent)

      expect(wrapper.vm.isExpanded).toBe(true)
    })

    it('closes dropdown when receiving close-other-dropdowns event', () => {
      wrapper = createWrapper()
      wrapper.vm.isExpanded = true

      const event = {
        detail: { source: 'other-component' },
      }
      wrapper.vm.handleCloseDropdown(event)

      expect(wrapper.vm.isExpanded).toBe(false)
    })

    it('does not close dropdown when event is from itself', () => {
      wrapper = createWrapper()
      wrapper.vm.isExpanded = true

      const event = {
        detail: { source: 'filter-controls' },
      }
      wrapper.vm.handleCloseDropdown(event)

      expect(wrapper.vm.isExpanded).toBe(true)
    })

    it('removes click listener on unmount', () => {
      wrapper = createWrapper()
      wrapper.unmount()
      expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function))
    })

    it('removes close-other-dropdowns listener on unmount', () => {
      wrapper = createWrapper()
      wrapper.unmount()
      expect(window.removeEventListener).toHaveBeenCalledWith(
        'close-other-dropdowns',
        expect.any(Function)
      )
    })
  })

  describe('Styling Classes', () => {
    it('has filter-controls class', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.filter-controls').exists()).toBe(true)
    })

    it('control button has correct classes', () => {
      wrapper = createWrapper()
      const button = wrapper.find('.control-button')
      expect(button.classes()).toContain('control-button')
      expect(button.classes()).toContain('flex')
    })

    it('dropdown has control-dropdown class', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      const dropdown = wrapper.find('.control-dropdown')
      expect(dropdown.exists()).toBe(true)
      expect(dropdown.classes()).toContain('control-dropdown')
    })

    it('filter buttons have correct classes', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      const button = wrapper.find('.filter-button')
      expect(button.classes()).toContain('filter-button')
    })
  })

  describe('Responsive Behavior', () => {
    it('has responsive classes for mobile', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.filter-controls').exists()).toBe(true)
      // The component has media queries in scoped CSS for mobile
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot with no filter', () => {
      mockUserPreferencesStore.getFilters = null
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with text filter active', () => {
      mockUserPreferencesStore.getFilters = { content_type: 'text' }
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with dropdown open', async () => {
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with video filter active and dropdown open', async () => {
      mockUserPreferencesStore.getFilters = { content_type: 'video' }
      wrapper = createWrapper()
      await wrapper.find('.control-button').trigger('click')
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
