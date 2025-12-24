import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SubmitPage from '~/pages/submit/index.vue'

// Mock router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useRoute: () => ({
    query: {},
    params: {},
    path: '/submit',
  }),
}))

// Mock i18n
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
  useLocalePath: () => (path) => path,
}))

// Mock stores
const mockAuthStore = {
  initialized: false,
  isAuthenticated: false,
  initialize: vi.fn(),
}

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

describe('Submit Page', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock auth store state
    mockAuthStore.initialized = false
    mockAuthStore.isAuthenticated = false
    mockAuthStore.initialize.mockResolvedValue()

    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
  })

  const createWrapper = () => {
    return mount(SubmitPage, {
      global: {
        plugins: [pinia],
        stubs: {
          PostFormWizard: { template: '<div data-testid="post-form-wizard"></div>' },
          NuxtLink: { template: '<a><slot /></a>' },
        },
      },
    })
  }

  describe('Authentication Flow', () => {
    it('should redirect unauthenticated users to login page with anonymous option', async () => {
      mockAuthStore.initialized = false
      mockAuthStore.isAuthenticated = false
      mockAuthStore.initialize.mockResolvedValue()

      wrapper = createWrapper()

      // Wait for onMounted to complete
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockAuthStore.initialize).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=%2Fsubmit')
    })

    it('should not redirect authenticated users', async () => {
      mockAuthStore.initialized = true
      mockAuthStore.isAuthenticated = true
      mockAuthStore.initialize.mockResolvedValue()

      wrapper = createWrapper()

      // Wait for onMounted to complete
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should initialize auth store if not initialized', async () => {
      mockAuthStore.initialized = false
      mockAuthStore.isAuthenticated = true
      mockAuthStore.initialize.mockResolvedValue()

      wrapper = createWrapper()

      // Wait for onMounted to complete
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockAuthStore.initialize).toHaveBeenCalled()
    })

    it('should skip initialization if already initialized', async () => {
      mockAuthStore.initialized = true
      mockAuthStore.isAuthenticated = true

      wrapper = createWrapper()

      // Wait for onMounted to complete
      await wrapper.vm.$nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(mockAuthStore.initialize).not.toHaveBeenCalled()
    })
  })

  describe('Page Content', () => {
    it('should render submit form wizard for authenticated users', async () => {
      mockAuthStore.initialized = true
      mockAuthStore.isAuthenticated = true

      wrapper = createWrapper()

      expect(wrapper.find('[data-testid="post-form-wizard"]').exists()).toBe(true)
    })

    it('should display page title', () => {
      mockAuthStore.initialized = true
      mockAuthStore.isAuthenticated = true

      wrapper = createWrapper()

      expect(wrapper.text()).toContain('submit.title')
    })

    it('should have proper page structure', () => {
      mockAuthStore.initialized = true
      mockAuthStore.isAuthenticated = true

      wrapper = createWrapper()

      // Should have main content area
      expect(wrapper.find('.lg\\:col-span-2').exists()).toBe(true)

      // Should have tips sidebar
      expect(wrapper.find('.lg\\:col-span-1').exists()).toBe(true)
    })
  })

  describe('Event Handling', () => {
    beforeEach(() => {
      mockAuthStore.initialized = true
      mockAuthStore.isAuthenticated = true
    })

    it('should handle post submission', async () => {
      wrapper = createWrapper()

      const postData = { id: 1, title: 'Test Post', slug: 'test-post' }

      // Simulate post submission
      await wrapper.vm.onPostSubmitted(postData)

      expect(mockPush).toHaveBeenCalledWith('/posts/test-post')
    })

    it('should handle post submission with ID fallback', async () => {
      wrapper = createWrapper()

      const postData = { id: 1, title: 'Test Post' } // No slug

      // Simulate post submission
      await wrapper.vm.onPostSubmitted(postData)

      expect(mockPush).toHaveBeenCalledWith('/posts/1')
    })

    it('should handle cancel action', async () => {
      wrapper = createWrapper()

      // Simulate cancel
      await wrapper.vm.goToHome()

      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  describe('Tips Content', () => {
    beforeEach(() => {
      mockAuthStore.initialized = true
      mockAuthStore.isAuthenticated = true
    })

    it('should display submission tips', () => {
      wrapper = createWrapper()

      expect(wrapper.text()).toContain('submit.tips_title')
      expect(wrapper.text()).toContain('submit.tips.descriptive_title')
      expect(wrapper.text()).toContain('submit.tips.no_caps')
      expect(wrapper.text()).toContain('submit.tips.clear_description')
    })

    it('should display multimedia tips', () => {
      wrapper = createWrapper()

      expect(wrapper.text()).toContain('submit.media_tips_title')
      expect(wrapper.text()).toContain('submit.media_tips.video_platforms')
      expect(wrapper.text()).toContain('submit.media_tips.audio_platforms')
      expect(wrapper.text()).toContain('submit.media_tips.no_storage')
      expect(wrapper.text()).toContain('submit.media_tips.detailed_description')
      expect(wrapper.text()).toContain('submit.media_tips.community_guidelines')
    })
  })
})
