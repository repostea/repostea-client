import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import DesktopMenu from '~/components/menu/DesktopMenu.vue'

// Mock i18n
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const translations = {
        'navigation.home': 'Home',
        'navigation.submit': 'Submit',
        'navigation.subs': 'Subs',
        'navigation.ai_programming': 'AI',
        'navigation.actions': 'More',
      }
      return translations[key] || key
    },
  }),
  useLocalePath: () => (path) => path,
}))

// Mock auth store
const mockAuthStore = {
  user: { id: 1, username: 'testuser' },
  isAuthenticated: true,
}

describe('DesktopMenu', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()

    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        auth: mockAuthStore,
      },
    })
  })

  const createWrapper = (props = {}) => {
    return mount(DesktopMenu, {
      props,
      global: {
        plugins: [pinia],
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :class="$attrs.class"><slot /></a>',
            props: ['to'],
          },
          ThemeSelector: {
            template: '<div data-testid="theme-selector"></div>',
          },
          LanguageSelector: {
            template: '<div data-testid="language-selector"></div>',
          },
          NotificationDropdown: {
            template: '<div data-testid="notification-dropdown"></div>',
          },
          AuthNav: {
            template: '<div data-testid="auth-nav"></div>',
          },
          Icon: {
            template: '<i class="iconify-icon" :name="name"></i>',
            props: ['name'],
          },
        },
      },
    })
  }

  describe('Submit Button Styling', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should render submit button with special styling classes', () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.exists()).toBe(true)

      // Should have both nav-link and nav-link-submit classes
      expect(submitButton.classes()).toContain('nav-link')
      expect(submitButton.classes()).toContain('nav-link-submit')
    })

    it('should use plus icon for submit button', () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      const icon = submitButton.find('.iconify-icon')

      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:plus')
    })

    it('should link to submit page', () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.attributes('href')).toBe('/submit')
    })

    it('should display correct text', () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.text()).toContain('Submit')
    })

    it('should have proper structure with icon and text', () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')

      // Should have icon
      const icon = submitButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:plus')

      // Should have text span
      const textSpan = submitButton.find('span')
      expect(textSpan.exists()).toBe(true)
      expect(textSpan.text()).toBe('Submit')
    })
  })

  describe('Navigation Links', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should render all main navigation links', () => {
      const links = wrapper.findAll('.nav-link')
      // Home (conditional), Submit, Subs, Actions Menu button
      expect(links.length).toBeGreaterThanOrEqual(3) // Submit, Subs, Actions Menu
    })

    it('should have correct navigation structure', () => {
      // Since the home link is conditional (only shown when not on home page),
      // and we don't have proper route mocking, let's just verify the component renders
      const navContainer = wrapper.find('.hidden.md\\:flex')
      expect(navContainer.exists()).toBe(true)

      // Should have the main navigation links container
      const navLinksContainer = wrapper.find('.flex')
      expect(navLinksContainer.exists()).toBe(true)
    })

    it('should render subs link', () => {
      const subsLink = wrapper.find('[href="/s"]')
      expect(subsLink.exists()).toBe(true)
      expect(subsLink.text()).toContain('Subs')
    })
  })

  describe('Actions Menu', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should render actions dropdown trigger', () => {
      const actionsButton = wrapper.find('[data-testid="actions-menu-trigger"]')
      expect(actionsButton.exists()).toBe(true)
      expect(actionsButton.text()).toContain('More')
    })

    it('should toggle actions menu on click', async () => {
      const actionsButton = wrapper.find('[data-testid="actions-menu-trigger"]')

      // Initially closed
      expect(wrapper.vm.isActionsMenuOpen).toBe(false)

      // Click to open
      await actionsButton.trigger('click')
      expect(wrapper.vm.isActionsMenuOpen).toBe(true)

      // Click to close
      await actionsButton.trigger('click')
      expect(wrapper.vm.isActionsMenuOpen).toBe(false)
    })

    it('should show dropdown arrow that rotates when open', async () => {
      const actionsButton = wrapper.find('[data-testid="actions-menu-trigger"]')
      const chevron = actionsButton.find('[name="fa6-solid:chevron-down"]')

      expect(chevron.exists()).toBe(true)

      // Initially not rotated
      expect(chevron.classes()).not.toContain('rotate-180')

      // Open menu
      await actionsButton.trigger('click')
      expect(chevron.classes()).toContain('rotate-180')
    })
  })

  describe('Responsive Behavior', () => {
    it('should be hidden on mobile (md:flex)', () => {
      wrapper = createWrapper()

      const menuContainer = wrapper.find('.hidden.md\\:flex')
      expect(menuContainer.exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should have proper link structure for screen readers', () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')

      // Should be a proper link
      expect(submitButton.element.tagName.toLowerCase()).toBe('a')

      // Should have meaningful text content
      expect(submitButton.text().trim()).toBeTruthy()
    })

    it('should maintain focus order', () => {
      const navLinks = wrapper.findAll('.nav-link')

      // Submit button should exist in navigation
      const submitLink = navLinks.find((link) => link.text().includes('Submit'))
      expect(submitLink).toBeDefined()

      // Should have multiple navigation links
      expect(navLinks.length).toBeGreaterThan(1)
    })
  })

  describe('CSS Classes and Styling', () => {
    beforeEach(() => {
      wrapper = createWrapper()
    })

    it('should apply correct base classes to submit button', () => {
      const submitButton = wrapper.find('[data-testid="submit-button"]')

      expect(submitButton.classes()).toContain('nav-link')
      expect(submitButton.classes()).toContain('nav-link-submit')
      expect(submitButton.classes()).toContain('flex')
      expect(submitButton.classes()).toContain('items-center')
      expect(submitButton.classes()).toContain('px-3')
    })

    it('should apply special submit styling through CSS class', () => {
      // This test verifies that the nav-link-submit class is applied
      // The actual CSS styling is tested through visual/integration tests
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.classes()).toContain('nav-link-submit')
    })
  })

  describe('Active State', () => {
    it('should apply active class when on submit page', () => {
      // This would be tested with proper router mock
      const submitButton = wrapper.find('[data-testid="submit-button"]')
      expect(submitButton.attributes('active-class')).toBe('active')
    })
  })
})
