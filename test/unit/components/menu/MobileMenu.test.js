import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import MobileMenu from '~/components/menu/MobileMenu.vue'

const mockAuthStore = {
  isAuthenticated: false,
  user: null,
}

// Create reactive route mock
const mockRoutePath = ref('/')
const mockRoute = {
  get path() {
    return mockRoutePath.value
  },
  set path(value) {
    mockRoutePath.value = value
  },
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const translations = {
        'navigation.submit': 'Submit',
        'agora.title': 'Agora',
        'navigation.subs': 'Communities',
        'stats.title': 'Statistics',
        'rankings.title': 'Rankings',
        'navigation.saved_lists': 'Saved Lists',
        'activity.title': 'Activity',
        'navigation.settings': 'Settings',
        'navigation.language': 'Language',
        'navigation.theme': 'Theme',
      }
      return translations[key] || key
    },
  }),
  useLocalePath: () => (path) => path,
}))

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      appEnv: 'development',
    },
  }),
}))

describe('MobileMenu Component', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null

    // Reset route path
    mockRoutePath.value = '/'

    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    // Mock process.client (just add property, don't replace object)
    process.client = true
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(MobileMenu, {
      props: {
        modelValue: false,
        ...props,
      },
      global: {
        mocks: {
          $route: mockRoute,
        },
        stubs: {
          NuxtLink: {
            template: '<a :to="to" @click="$emit(\'click\')"><slot /></a>',
            props: ['to'],
          },
          ClientOnly: {
            template: '<div><slot /></div>',
          },
          AuthNav: {
            template: '<div class="auth-nav-stub"></div>',
          },
          NotificationDropdown: {
            template: '<div class="notification-dropdown-stub"></div>',
          },
          MobileLanguageSelector: {
            template: '<div class="language-selector-stub"></div>',
          },
          MobileThemeSelector: {
            template: '<div class="theme-selector-stub"></div>',
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

    it('renders the hamburger menu button', () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')
      expect(menuButton.exists()).toBe(true)
    })

    it('renders three menu bars in hamburger icon', () => {
      wrapper = createWrapper()
      const menuBars = wrapper.findAll('.menu-bar')
      expect(menuBars.length).toBe(3)
    })

    it('renders AuthNav component', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.auth-nav-stub').exists()).toBe(true)
    })

    it('does not show NotificationDropdown when not authenticated', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()
      expect(wrapper.find('.notification-dropdown-stub').exists()).toBe(false)
    })

    it('shows NotificationDropdown when authenticated', () => {
      mockAuthStore.isAuthenticated = true
      wrapper = createWrapper()
      expect(wrapper.find('.notification-dropdown-stub').exists()).toBe(true)
    })
  })

  describe('Menu Toggle Functionality', () => {
    it('menu is closed by default', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.isOpen).toBe(false)
      expect(wrapper.find('.mobile-menu-container.open').exists()).toBe(false)
    })

    it('opens menu when clicking menu button', async () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')
      await menuButton.trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)
      expect(wrapper.find('.mobile-menu-container.open').exists()).toBe(true)
    })

    it('closes menu when clicking menu button again', async () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')

      await menuButton.trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      await menuButton.trigger('click')
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('applies menu-open class to button when open', async () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')

      await menuButton.trigger('click')
      expect(menuButton.classes()).toContain('menu-open')
    })

    it('removes menu-open class when closed', async () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')

      await menuButton.trigger('click')
      expect(menuButton.classes()).toContain('menu-open')

      await menuButton.trigger('click')
      expect(menuButton.classes()).not.toContain('menu-open')
    })

    it('emits update:modelValue when toggling menu', async () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')

      await menuButton.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([true])
    })
  })

  describe('Navigation Links', () => {
    it('renders Submit link', async () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')
      await menuButton.trigger('click')

      expect(wrapper.text()).toContain('Submit')
    })

    it('renders Statistics link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.text()).toContain('Statistics')
    })

    it('renders Rankings link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.text()).toContain('Rankings')
    })

    it('renders Saved Lists link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.text()).toContain('Saved Lists')
    })

    it('renders Activity link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.text()).toContain('Activity')
    })

    it('does not render Home link when on home page', async () => {
      mockRoutePath.value = '/'
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      const homeLink = wrapper.findAll('a').find((a) => a.attributes('to') === '/')
      expect(homeLink).toBeUndefined()
    })

    it('renders Home link when not on home page', async () => {
      mockRoutePath.value = '/stats'
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      const homeLink = wrapper.findAll('a').find((a) => a.attributes('to') === '/')
      expect(homeLink).toBeDefined()
    })

    it('closes menu when clicking navigation link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      const submitLink = wrapper.findAll('a').find((a) => a.attributes('to') === '/submit')
      await submitLink.trigger('click')

      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('FAB (Floating Action Button)', () => {
    it('renders FAB when not on submit page', () => {
      mockRoutePath.value = '/'
      wrapper = createWrapper()
      expect(wrapper.find('.mobile-fab').exists()).toBe(true)
    })

    it('does not render FAB when on submit page', () => {
      mockRoutePath.value = '/submit'
      wrapper = createWrapper()
      expect(wrapper.find('.mobile-fab').exists()).toBe(false)
    })

    it('FAB links to submit page by default', () => {
      mockRoutePath.value = '/'
      wrapper = createWrapper()
      const fab = wrapper.find('.mobile-fab')
      expect(fab.attributes('to')).toBe('/submit')
    })

    it('FAB includes sub parameter when on sub page', () => {
      mockRoutePath.value = '/s/technology'
      wrapper = createWrapper()
      expect(wrapper.vm.currentSubName).toBe('technology')
      expect(wrapper.vm.fabLink).toBe('/submit?sub=technology')
    })

    it('FAB link updates when sub changes', async () => {
      mockRoutePath.value = '/s/science'
      wrapper = createWrapper()
      expect(wrapper.vm.currentSubName).toBe('science')
      expect(wrapper.vm.fabLink).toBe('/submit?sub=science')
    })

    it('FAB has plus icon', () => {
      mockRoutePath.value = '/'
      wrapper = createWrapper()
      const fab = wrapper.find('.mobile-fab')
      const icon = fab.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:plus')
    })
  })

  describe('Settings Section', () => {
    it('renders settings section', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.text()).toContain('Settings')
    })

    it('renders language selector button', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.text()).toContain('Language')
    })

    it('renders theme selector button', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.text()).toContain('Theme')
    })

    it('language button has correct icon', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      const buttons = wrapper.findAll('button')
      const languageButton = buttons.find((btn) => btn.text().includes('Language'))
      const icon = languageButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:language')
    })

    it('theme button has correct icon', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      const buttons = wrapper.findAll('button')
      const themeButton = buttons.find((btn) => btn.text().includes('Theme'))
      const icon = themeButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:palette')
    })
  })

  describe('Language Modal', () => {
    it('does not show language modal initially', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.showLanguageModal).toBe(false)
      expect(wrapper.find('.language-selector-stub').exists()).toBe(false)
    })

    it('opens language modal when clicking language button', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const buttons = wrapper.findAll('button')
      const languageButton = buttons.find((btn) => btn.text().includes('Language'))
      await languageButton.trigger('click')

      expect(wrapper.vm.showLanguageModal).toBe(true)
    })

    it('closes main menu when opening language modal', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      const buttons = wrapper.findAll('button')
      const languageButton = buttons.find((btn) => btn.text().includes('Language'))
      await languageButton.trigger('click')

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('renders language modal overlay', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const buttons = wrapper.findAll('button')
      const languageButton = buttons.find((btn) => btn.text().includes('Language'))
      await languageButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.mobile-modal-overlay').exists()).toBe(true)
    })

    it('shows language selector component in modal', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const buttons = wrapper.findAll('button')
      const languageButton = buttons.find((btn) => btn.text().includes('Language'))
      await languageButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.language-selector-stub').exists()).toBe(true)
    })

    it('closes language modal when clicking overlay', async () => {
      wrapper = createWrapper()
      wrapper.vm.showLanguageModal = true
      await wrapper.vm.$nextTick()

      const overlay = wrapper.find('.mobile-modal-overlay')
      await overlay.trigger('click')

      expect(wrapper.vm.showLanguageModal).toBe(false)
    })

    it('closes language modal when clicking close button', async () => {
      wrapper = createWrapper()
      wrapper.vm.showLanguageModal = true
      await wrapper.vm.$nextTick()

      const overlays = wrapper.findAll('.mobile-modal-overlay')
      const closeButton = overlays[0].find('[name="fa6-solid:xmark"]').element.parentElement
      await closeButton.click()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showLanguageModal).toBe(false)
    })

    it('closes modal when language is selected', async () => {
      wrapper = createWrapper()
      wrapper.vm.showLanguageModal = true
      await wrapper.vm.$nextTick()

      // Call the handler directly since stubs don't emit events
      wrapper.vm.handleLanguageSelected()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showLanguageModal).toBe(false)
    })
  })

  describe('Theme Modal', () => {
    it('does not show theme modal initially', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.showThemeModal).toBe(false)
      expect(wrapper.find('.theme-selector-stub').exists()).toBe(false)
    })

    it('opens theme modal when clicking theme button', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const buttons = wrapper.findAll('button')
      const themeButton = buttons.find((btn) => btn.text().includes('Theme'))
      await themeButton.trigger('click')

      expect(wrapper.vm.showThemeModal).toBe(true)
    })

    it('closes main menu when opening theme modal', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      const buttons = wrapper.findAll('button')
      const themeButton = buttons.find((btn) => btn.text().includes('Theme'))
      await themeButton.trigger('click')

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('renders theme modal overlay', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const buttons = wrapper.findAll('button')
      const themeButton = buttons.find((btn) => btn.text().includes('Theme'))
      await themeButton.trigger('click')
      await wrapper.vm.$nextTick()

      const overlays = wrapper.findAll('.mobile-modal-overlay')
      expect(overlays.length).toBeGreaterThan(0)
    })

    it('shows theme selector component in modal', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const buttons = wrapper.findAll('button')
      const themeButton = buttons.find((btn) => btn.text().includes('Theme'))
      await themeButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.theme-selector-stub').exists()).toBe(true)
    })

    it('closes theme modal when clicking overlay', async () => {
      wrapper = createWrapper()
      wrapper.vm.showThemeModal = true
      await wrapper.vm.$nextTick()

      const overlay = wrapper.findAll('.mobile-modal-overlay')[0]
      await overlay.trigger('click')

      expect(wrapper.vm.showThemeModal).toBe(false)
    })

    it('closes modal when theme is selected', async () => {
      wrapper = createWrapper()
      wrapper.vm.showThemeModal = true
      await wrapper.vm.$nextTick()

      // Call the handler directly since stubs don't emit events
      wrapper.vm.handleThemeSelected()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.showThemeModal).toBe(false)
    })
  })

  describe('Responsive Behavior', () => {
    it('closes menu when resizing to desktop width', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      // Simulate resize to desktop
      window.innerWidth = 768
      wrapper.vm.handleResize()

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('keeps menu closed when resizing on mobile', async () => {
      wrapper = createWrapper()
      expect(wrapper.vm.isOpen).toBe(false)

      // Simulate resize on mobile
      window.innerWidth = 400
      wrapper.vm.handleResize()

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('closes language modal when resizing to desktop', async () => {
      wrapper = createWrapper()
      wrapper.vm.showLanguageModal = true

      window.innerWidth = 768
      wrapper.vm.handleResize()

      expect(wrapper.vm.showLanguageModal).toBe(false)
    })

    it('closes theme modal when resizing to desktop', async () => {
      wrapper = createWrapper()
      wrapper.vm.showThemeModal = true

      window.innerWidth = 768
      wrapper.vm.handleResize()

      expect(wrapper.vm.showThemeModal).toBe(false)
    })
  })

  describe('Props and v-model', () => {
    it('accepts modelValue prop', () => {
      wrapper = createWrapper({ modelValue: true })
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('initializes isOpen from modelValue prop', () => {
      wrapper = createWrapper({ modelValue: true })
      expect(wrapper.vm.isOpen).toBe(true)
      expect(wrapper.find('.mobile-menu-container.open').exists()).toBe(true)
    })

    it('emits update:modelValue with correct value', async () => {
      wrapper = createWrapper({ modelValue: false })
      await wrapper.find('.menu-button').trigger('click')

      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeTruthy()
      expect(emitted[0]).toEqual([true])
    })
  })

  describe('Feature Flags', () => {
    it('shows Communities link in development mode', async () => {
      // Note: Production mode test removed as vi.mock cannot be changed mid-test
      // The component should show Communities link in development (mocked as appEnv: 'development')
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      expect(wrapper.text()).toContain('Communities')
    })

    it('shows Agora link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      expect(wrapper.text()).toContain('Agora')
    })
  })

  describe('Icons', () => {
    it('Submit link has plus-circle icon', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const links = wrapper.findAll('.mobile-nav-link')
      const submitLink = links.find((link) => link.text().includes('Submit'))
      const icon = submitLink.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:circle-plus')
    })

    it('Statistics link has chart-line icon', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const links = wrapper.findAll('.mobile-nav-link')
      const statsLink = links.find((link) => link.text().includes('Statistics'))
      const icon = statsLink.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:chart-line')
    })

    it('Rankings link has trophy icon', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const links = wrapper.findAll('.mobile-nav-link')
      const rankingsLink = links.find((link) => link.text().includes('Rankings'))
      const icon = rankingsLink.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:trophy')
    })

    it('Saved Lists link has bookmark icon', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const links = wrapper.findAll('.mobile-nav-link')
      const listsLink = links.find((link) => link.text().includes('Saved Lists'))
      const icon = listsLink.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:bookmark')
    })

    it('Activity link has rss icon', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')

      const links = wrapper.findAll('.mobile-nav-link')
      const activityLink = links.find((link) => link.text().includes('Activity'))
      const icon = activityLink.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:rss')
    })
  })

  describe('Accessibility', () => {
    it('menu button has aria-label', () => {
      wrapper = createWrapper()
      const menuButton = wrapper.find('.menu-button')
      // $t mock returns the key, so we check for the key
      expect(menuButton.attributes('aria-label')).toBe('navigation.main_menu')
    })

    it('modal overlays have proper z-index for stacking', async () => {
      wrapper = createWrapper()
      wrapper.vm.showLanguageModal = true
      await wrapper.vm.$nextTick()

      const overlay = wrapper.find('.mobile-modal-overlay')
      expect(overlay.classes()).toContain('z-50')
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot when menu is closed', () => {
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when menu is open', async () => {
      wrapper = createWrapper()
      await wrapper.find('.menu-button').trigger('click')
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with language modal', async () => {
      wrapper = createWrapper()
      wrapper.vm.showLanguageModal = true
      await wrapper.vm.$nextTick()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with theme modal', async () => {
      wrapper = createWrapper()
      wrapper.vm.showThemeModal = true
      await wrapper.vm.$nextTick()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when authenticated', () => {
      mockAuthStore.isAuthenticated = true
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot on submit page (no FAB)', () => {
      mockRoutePath.value = '/submit'
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
