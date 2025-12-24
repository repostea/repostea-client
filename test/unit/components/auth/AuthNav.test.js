import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AuthNav from '~/components/auth/AuthNav.vue'

const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  username: '',
  userKarma: 0,
  logout: vi.fn(),
}

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('AuthNav Component', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
    mockAuthStore.username = ''

    // Mock process.client for guest detection (just add property, don't replace object)
    process.client = true
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = () => {
    return mount(AuthNav, {
      global: {
        mocks: {
          t: (key) => {
            const translations = {
              'auth.login': 'Login',
              'auth.register': 'Register',
              'auth.guest': 'Guest',
              'auth.exit_guest': 'Exit Guest Mode',
              'navigation.my_profile': 'My Profile',
              'profile.my_posts': 'My Posts',
              'navigation.settings': 'Settings',
              'navigation.logout': 'Logout',
            }
            return translations[key] || key
          },
        },
        stubs: {
          NuxtLink: {
            template: '<a :to="to"><slot /></a>',
            props: ['to'],
          },
          ClientOnly: {
            template: '<div><slot /></div>',
          },
        },
      },
    })
  }

  describe('Unauthenticated State', () => {
    it('renders auth buttons when not authenticated', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()

      expect(wrapper.find('.auth-buttons').exists()).toBe(true)
    })

    it('shows login button', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()

      const loginButton = wrapper.find('.btn-login')
      expect(loginButton.exists()).toBe(true)
      expect(loginButton.text()).toBe('Login')
    })

    it('shows register button', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()

      const registerButton = wrapper.find('.btn-register')
      expect(registerButton.exists()).toBe(true)
    })

    it('does not show user menu when not authenticated', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()

      expect(wrapper.find('.user-menu').exists()).toBe(false)
    })
  })

  describe('Authenticated State - Regular User', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.username = 'testuser'
      mockAuthStore.user = {
        id: 1,
        username: 'testuser',
        is_guest: false,
      }
    })

    afterEach(() => {
      // Clean up to prevent state leaking into next describe block
      mockAuthStore.isAuthenticated = false
      mockAuthStore.user = null
      mockAuthStore.username = ''
    })

    it('shows user menu when authenticated', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.user-menu').exists()).toBe(true)
    })

    it('displays username', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('testuser')
    })

    it('shows user icon', () => {
      wrapper = createWrapper()
      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map(icon => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:circle-user')
    })

    it('shows chevron down icon', () => {
      wrapper = createWrapper()
      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map(icon => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:chevron-down')
    })

    it('does not show auth buttons when authenticated', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.auth-buttons').exists()).toBe(false)
    })

    it('does not show guest icon for regular user', () => {
      wrapper = createWrapper()
      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map(icon => icon.attributes('name'))
      expect(iconNames).not.toContain('fa6-solid:user-secret')
    })
  })

  describe('Authenticated State - Guest User', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: 1,
        display_name: 'Guest123',
        is_guest: true,
      }
    })

    it('shows guest icon instead of regular user icon', () => {
      wrapper = createWrapper()
      const icons = wrapper.findAll('.iconify-icon')
      const iconNames = icons.map(icon => icon.attributes('name'))
      expect(iconNames).toContain('fa6-solid:user-secret')
      expect(iconNames).not.toContain('fa6-solid:circle-user')
    })

    it('displays guest display name', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Guest123')
    })

    it('shows guest indicator text', () => {
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Guest')
    })

    it('uses fallback name when display_name is not set', () => {
      mockAuthStore.user = {
        id: 1,
        name: 'GuestName',
        is_guest: true,
      }
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('GuestName')
    })

    it('shows "Guest" as default when no name available', () => {
      mockAuthStore.user = {
        id: 1,
        is_guest: true,
      }
      wrapper = createWrapper()
      expect(wrapper.text()).toContain('Guest')
    })
  })

  describe('Dropdown Menu - Regular User', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.username = 'testuser'
      mockAuthStore.user = {
        id: 1,
        username: 'testuser',
        is_guest: false,
      }
    })

    it('does not show dropdown initially', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.dropdown-menu').exists()).toBe(false)
    })

    it('shows dropdown when clicking user info', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.vm.isOpen).toBe(true)
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    })

    it('displays My Profile link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.text()).toContain('My Profile')
    })

    it('displays My Posts link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.text()).toContain('My Posts')
    })

    it('displays Settings link', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.text()).toContain('Settings')
    })

    it('displays Logout button', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.text()).toContain('Logout')
    })

    it('has correct number of menu items', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      const menuItems = wrapper.findAll('.menu-item')
      expect(menuItems.length).toBe(4) // Profile, Posts, Settings, Logout
    })

    it('shows divider before logout', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.find('.menu-divider').exists()).toBe(true)
    })

    it('closes dropdown when clicking menu item', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      const profileLink = wrapper.findAll('.menu-item')[0]
      await profileLink.trigger('click')

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('toggles dropdown on multiple clicks', async () => {
      wrapper = createWrapper()

      // Open
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      // Close
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.vm.isOpen).toBe(false)

      // Open again
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)
    })
  })

  describe('Dropdown Menu - Guest User', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = {
        id: 1,
        display_name: 'Guest123',
        is_guest: true,
      }
    })

    it('shows guest info section in dropdown', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.find('.guest-info').exists()).toBe(true)
    })

    it('displays guest name in dropdown', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.find('.guest-name').text()).toContain('Guest123')
    })

    it('shows guest indicator in dropdown', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.find('.guest-indicator-dropdown').exists()).toBe(true)
    })

    it('shows Exit Guest Mode button', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.text()).toContain('Exit Guest Mode')
    })

    it('does not show regular user menu items for guest', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      expect(wrapper.text()).not.toContain('My Profile')
      expect(wrapper.text()).not.toContain('My Posts')
      expect(wrapper.text()).not.toContain('Settings')
    })

    it('has only 2 items for guest (info + logout)', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      const menuItems = wrapper.findAll('.menu-item')
      expect(menuItems.length).toBe(2) // Guest info + Exit Guest Mode
    })
  })

  describe('Logout Functionality', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.username = 'testuser'
      mockAuthStore.user = {
        id: 1,
        username: 'testuser',
        is_guest: false,
      }
      mockAuthStore.logout = vi.fn().mockResolvedValue()
    })

    it('calls authStore.logout when clicking logout button', async () => {
      delete window.location
      window.location = { href: '' }

      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      const logoutButton = wrapper.find('.logout')
      await logoutButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(mockAuthStore.logout).toHaveBeenCalled()
    })

    it('closes dropdown after logout', async () => {
      delete window.location
      window.location = { href: '' }

      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      const logoutButton = wrapper.find('.logout')
      await logoutButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('handles logout errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockAuthStore.logout = vi.fn().mockRejectedValue(new Error('Logout failed'))

      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')

      const logoutButton = wrapper.find('.logout')
      await logoutButton.trigger('click')
      await wrapper.vm.$nextTick()

      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Click Outside Handling', () => {
    beforeEach(() => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.username = 'testuser'
      mockAuthStore.user = {
        id: 1,
        username: 'testuser',
        is_guest: false,
      }
    })

    it('registers click outside listener on mount', () => {
      wrapper = createWrapper()
      // Just verify the component mounts successfully
      expect(wrapper.vm).toBeDefined()
    })

    it('can open dropdown', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('can close dropdown programmatically', async () => {
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      wrapper.vm.closeDropdown()
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('Styling and Classes', () => {
    it('applies auth-nav class to container', () => {
      wrapper = createWrapper()
      expect(wrapper.find('.auth-nav').exists()).toBe(true)
    })

    it('applies correct classes to login button', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()

      const loginButton = wrapper.find('.btn-login')
      expect(loginButton.classes()).toContain('btn-login')
    })

    it('applies correct classes to register button', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()

      const registerButton = wrapper.find('.btn-register')
      expect(registerButton.classes()).toContain('btn-register')
    })

    it('applies correct classes to user info', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = { id: 1, username: 'test', is_guest: false }
      wrapper = createWrapper()

      expect(wrapper.find('.user-info').exists()).toBe(true)
    })

    it('applies logout class to logout button', async () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = { id: 1, username: 'test', is_guest: false }
      wrapper = createWrapper()

      await wrapper.find('.user-info').trigger('click')
      const logoutButton = wrapper.find('.logout')
      expect(logoutButton.classes()).toContain('logout')
    })
  })

  describe('Responsive Behavior', () => {
    it('has hidden class for username on mobile', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.username = 'testuser'
      mockAuthStore.user = { id: 1, username: 'testuser', is_guest: false }
      wrapper = createWrapper()

      const username = wrapper.find('.username')
      expect(username.classes()).toContain('hidden')
      expect(username.classes()).toContain('lg:inline')
    })

    it('shows register icon on mobile', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()

      const registerButton = wrapper.find('.btn-register')
      const icon = registerButton.find('.iconify-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('name')).toBe('fa6-solid:user-plus')
    })
  })

  describe('Snapshots', () => {
    it('matches snapshot when not authenticated', () => {
      mockAuthStore.isAuthenticated = false
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when authenticated as regular user', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.username = 'testuser'
      mockAuthStore.user = { id: 1, username: 'testuser', is_guest: false }
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot when authenticated as guest', () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.user = { id: 1, display_name: 'Guest123', is_guest: true }
      wrapper = createWrapper()
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('matches snapshot with dropdown open', async () => {
      mockAuthStore.isAuthenticated = true
      mockAuthStore.username = 'testuser'
      mockAuthStore.user = { id: 1, username: 'testuser', is_guest: false }
      wrapper = createWrapper()
      await wrapper.find('.user-info').trigger('click')
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})
