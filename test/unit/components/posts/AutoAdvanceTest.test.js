import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PostFormWizard from '~/components/posts/PostFormWizard.vue'

// Mock i18n
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
  useLocalePath: () => (path) => path,
}))

// Mock Nuxt app
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: {},
  }),
  useCookie: vi.fn(() => ({ value: null })),
}))

// Mock services
vi.mock('~/services/postService', () => ({
  default: {
    updatePost: vi.fn().mockResolvedValue({ id: 1 }),
  },
}))

vi.mock('~/utils/language-data.js', () => ({
  languages: [
    { code: 'es', active: true, flag: '🇪🇸', native: 'Español' },
    { code: 'en', active: true, flag: '🇺🇸', native: 'English' },
  ],
}))

describe('PostFormWizard Auto-Advance Functionality', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()

    pinia = createTestingPinia({
      createSpy: vi.fn,
      initialState: {
        auth: { user: { id: 1 }, isAuthenticated: true },
        posts: { createPost: vi.fn(), importPost: vi.fn(), fetchPost: vi.fn() },
      },
    })
  })

  const createWrapper = () => {
    return mount(PostFormWizard, {
      global: {
        plugins: [pinia],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          MarkdownEditor: { template: '<div data-testid="content-textarea"></div>' },
          TagSelector: { template: '<div data-testid="tags-input"></div>' },
        },
      },
    })
  }

  it('should start at step 1 with 0% progress when no content type selected', () => {
    wrapper = createWrapper()

    expect(wrapper.vm.currentStep).toBe(1)
    expect(wrapper.vm.form.content_type).toBe('') // default value is empty string
    expect(wrapper.vm.getProgressPercentage()).toBe(0) // 0% because no content_type is set
    expect(wrapper.find('[data-testid="step-indicator"]').text()).toContain('submit.wizard.step 1')
  })

  it('should show Next button in step 1 (buttons always visible)', () => {
    wrapper = createWrapper()

    // Next button should be visible in step 1
    expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(true)

    // Previous button should not exist in step 1
    expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(false)
  })

  it('should auto-advance to step 2 when content type is selected', async () => {
    wrapper = createWrapper()

    // Reset content type to empty to test selection
    wrapper.vm.form.content_type = ''
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.currentStep).toBe(1)
    expect(wrapper.vm.getProgressPercentage()).toBe(0)

    // Select text content type
    const textOption = wrapper.find('[data-testid="content-type-text"]')
    await textOption.trigger('click')

    // Should update form immediately
    expect(wrapper.vm.form.content_type).toBe('text')
    expect(wrapper.vm.getProgressPercentage()).toBe(25)

    // Wait for auto-advance (300ms timeout)
    await new Promise((resolve) => setTimeout(resolve, 400))

    // Should have advanced to step 2
    expect(wrapper.vm.currentStep).toBe(2)
    expect(wrapper.find('[data-testid="step-indicator"]').text()).toContain('submit.wizard.step 2')
  })

  it('should auto-advance for all content types', async () => {
    const contentTypes = ['link', 'text', 'video', 'audio', 'poll']

    for (const contentType of contentTypes) {
      wrapper = createWrapper()

      // Reset to initial state
      wrapper.vm.form.content_type = ''
      wrapper.vm.currentStep = 1
      await wrapper.vm.$nextTick()

      // Select the content type
      const option = wrapper.find(`[data-testid="content-type-${contentType}"]`)
      await option.trigger('click')

      // Should update form
      expect(wrapper.vm.form.content_type).toBe(contentType)

      // Wait for auto-advance
      await new Promise((resolve) => setTimeout(resolve, 400))

      // Should advance to step 2
      expect(wrapper.vm.currentStep).toBe(2)
    }
  })

  it('should show correct buttons in each step', async () => {
    wrapper = createWrapper()

    // Step 1: Next button visible, Previous not visible
    expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="publish-button"]').exists()).toBe(false)

    // Advance to step 2
    wrapper.vm.currentStep = 2
    await wrapper.vm.$nextTick()

    // Step 2: Both buttons visible
    expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="publish-button"]').exists()).toBe(false)

    // Advance to step 3
    wrapper.vm.currentStep = 3
    await wrapper.vm.$nextTick()

    // Step 3: Both buttons visible
    expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="publish-button"]').exists()).toBe(false)

    // Advance to step 4 (final step)
    wrapper.vm.currentStep = 4
    await wrapper.vm.$nextTick()

    // Step 4: Publish button visible, Next not visible
    expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="publish-button"]').exists()).toBe(true)
  })

  it('should allow manual navigation even with auto-advance', async () => {
    wrapper = createWrapper()

    // Reset to test from clean state
    wrapper.vm.form.content_type = ''
    wrapper.vm.currentStep = 1
    await wrapper.vm.$nextTick()

    // Select content type but immediately click next (race condition test)
    const linkOption = wrapper.find('[data-testid="content-type-link"]')
    await linkOption.trigger('click')

    // Immediately try to click next button (should work even during auto-advance)
    const nextButton = wrapper.find('[data-testid="next-button"]')
    if (!nextButton.attributes('disabled')) {
      await nextButton.trigger('click')
    }

    // Should end up at step 2 (either by auto-advance or manual click)
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(wrapper.vm.currentStep).toBe(2)
    expect(wrapper.vm.form.content_type).toBe('link')
  })

  it('should update progress percentage correctly', () => {
    wrapper = createWrapper()

    // Step 1 with content type selected
    wrapper.vm.currentStep = 1
    wrapper.vm.form.content_type = 'text'
    expect(wrapper.vm.getProgressPercentage()).toBe(25)

    // Step 2 with title
    wrapper.vm.currentStep = 2
    wrapper.vm.form.title = 'Test Title'
    expect(wrapper.vm.getProgressPercentage()).toBe(50)

    // Step 3 with content
    wrapper.vm.currentStep = 3
    wrapper.vm.form.content = 'Test content that is long enough'
    expect(wrapper.vm.getProgressPercentage()).toBe(75)

    // Step 4 with valid form
    wrapper.vm.currentStep = 4
    expect(wrapper.vm.getProgressPercentage()).toBe(100)
  })
})
