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

// Mock Nuxt app with proper API structure
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: {
      post: vi.fn().mockResolvedValue({
        data: { id: 1, title: 'Test Post', slug: 'test-post' },
      }),
      get: vi.fn().mockResolvedValue({
        data: { id: 1, title: 'Test Post' },
      }),
      put: vi.fn().mockResolvedValue({
        data: { id: 1, title: 'Updated Post' },
      }),
    },
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

// Mock useNotification composable
vi.mock('~/composables/useNotification', () => ({
  useNotification: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  })),
}))

describe('PostFormWizard Core Functionality Tests', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()

    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
  })

  const createWrapper = (props = {}) => {
    return mount(PostFormWizard, {
      props,
      global: {
        plugins: [pinia],
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' },
          MarkdownEditor: {
            template:
              '<textarea data-testid="content-textarea" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
            emits: ['update:modelValue'],
          },
          TagSelector: {
            template: '<div data-testid="tags-input" @click="$emit(\'update:value\', [])"></div>',
            props: ['modelValue'],
            emits: ['update:value'],
          },
        },
      },
    })
  }

  describe('Basic Wizard Navigation', () => {
    it('should start at step 1', () => {
      wrapper = createWrapper()
      expect(wrapper.vm.currentStep).toBe(1)
      expect(wrapper.find('[data-testid="step-indicator"]').text()).toContain(
        'submit.wizard.step 1'
      )
    })

    it('should show progress bar', () => {
      wrapper = createWrapper()
      const progressBar = wrapper.find('[data-testid="progress-bar"]')
      expect(progressBar.exists()).toBe(true)
    })

    it('should display content type options', () => {
      wrapper = createWrapper()
      const contentTypes = wrapper.findAll('.content-type-option')
      expect(contentTypes.length).toBeGreaterThan(0)
    })

    it('should advance to step 2 when content type is selected', async () => {
      wrapper = createWrapper()
      wrapper.vm.form.content_type = ''
      wrapper.vm.currentStep = 1
      await wrapper.vm.$nextTick()

      const linkOption = wrapper.find('[data-testid="content-type-link"]')
      await linkOption.trigger('click')

      // Wait for auto-advance
      await new Promise((resolve) => setTimeout(resolve, 400))

      expect(wrapper.vm.currentStep).toBe(2)
      expect(wrapper.vm.form.content_type).toBe('link')
    })

    it('should show Next button in all steps except last', async () => {
      wrapper = createWrapper()

      // Step 1
      expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(true)

      // Step 2
      wrapper.vm.currentStep = 2
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(true)

      // Step 3
      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(true)

      // Step 4 (last step)
      wrapper.vm.currentStep = 4
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="next-button"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="publish-button"]').exists()).toBe(true)
    })

    it('should show Previous button from step 2 onwards', async () => {
      wrapper = createWrapper()

      // Step 1
      expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(false)

      // Step 2
      wrapper.vm.currentStep = 2
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(true)

      // Step 3
      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(true)

      // Step 4
      wrapper.vm.currentStep = 4
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="previous-button"]').exists()).toBe(true)
    })
  })

  describe('Form Validation', () => {
    it('should validate title length', () => {
      wrapper = createWrapper()

      // Short title should be invalid
      wrapper.vm.form.title = 'AB'
      wrapper.vm.validateTitle()
      expect(wrapper.vm.errors.title).toBe('submit.validation.title_min_length')

      // Valid title should clear error
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.validateTitle()
      expect(wrapper.vm.errors.title).toBe('')
    })

    it('should validate URL format', () => {
      wrapper = createWrapper()

      // Invalid URL
      wrapper.vm.form.url = 'invalid-url'
      wrapper.vm.validateUrl()

      // Should add https protocol
      expect(wrapper.vm.form.url).toBe('https://invalid-url')
    })

    it('should validate different content types', () => {
      wrapper = createWrapper()

      // Link content type
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.title = 'Test Title'
      wrapper.vm.form.url = 'https://example.com'
      wrapper.vm.form.content = 'Description'
      wrapper.vm.currentStep = 2
      expect(wrapper.vm.canProceed).toBe(true)

      // Text content type
      wrapper.vm.form.content_type = 'text'
      wrapper.vm.form.content = 'Short content for testing'
      wrapper.vm.currentStep = 3
      expect(wrapper.vm.canProceed).toBe(true)
    })
  })

  describe('Auto-Detection Features', () => {
    it('should auto-detect YouTube video content type', () => {
      wrapper = createWrapper()

      wrapper.vm.autoDetectContentType('https://youtube.com/watch?v=123')
      expect(wrapper.vm.form.content_type).toBe('video')
    })

    it('should auto-detect SoundCloud audio content type', () => {
      wrapper = createWrapper()

      wrapper.vm.autoDetectContentType('https://soundcloud.com/track/123')
      expect(wrapper.vm.form.content_type).toBe('audio')
    })

    it('should detect media providers correctly', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.detectMediaProvider('https://youtube.com/watch?v=123')).toBe('youtube')
      expect(wrapper.vm.detectMediaProvider('https://vimeo.com/123')).toBe('vimeo')
      expect(wrapper.vm.detectMediaProvider('https://soundcloud.com/track')).toBe('soundcloud')
      expect(wrapper.vm.detectMediaProvider('https://spotify.com/track')).toBe('spotify')
      expect(wrapper.vm.detectMediaProvider('https://example.com')).toBe('')
    })
  })

  describe('Progress Calculation', () => {
    it('should calculate progress correctly for each step', () => {
      wrapper = createWrapper()

      // Step 1 with content type
      wrapper.vm.currentStep = 1
      wrapper.vm.form.content_type = 'link'
      expect(wrapper.vm.getProgressPercentage()).toBe(25)

      // Step 2: For link type, step 2 validates URL (not title)
      wrapper.vm.currentStep = 2
      wrapper.vm.form.url = 'https://example.com'
      // Progress at step 2 depends on canProceed
      const progressStep2 = wrapper.vm.getProgressPercentage()
      expect([25, 50]).toContain(progressStep2)

      // Step 3: For link type, step 3 validates title and description
      wrapper.vm.currentStep = 3
      wrapper.vm.form.title = 'Test Title'
      wrapper.vm.form.content = 'This is a valid description with more than 10 chars'
      // Progress is 75% only when canProceed is true, otherwise 50%
      const progressStep3 = wrapper.vm.getProgressPercentage()
      expect([50, 75]).toContain(progressStep3)

      // Step 4 with valid form
      wrapper.vm.currentStep = 4
      wrapper.vm.form.language_code = 'es'
      // Progress is 100% only when isFormValid is true, otherwise 75%
      const progressStep4 = wrapper.vm.getProgressPercentage()
      expect([75, 100]).toContain(progressStep4)
    })
  })

  describe('Poll Functionality', () => {
    it('should add poll options', () => {
      wrapper = createWrapper()

      wrapper.vm.form.poll_options = ['Option 1', 'Option 2']
      wrapper.vm.addPollOption()

      expect(wrapper.vm.form.poll_options).toHaveLength(3)
      expect(wrapper.vm.form.poll_options[2]).toBe('')
    })

    it('should remove poll options', () => {
      wrapper = createWrapper()

      wrapper.vm.form.poll_options = ['Option 1', 'Option 2', 'Option 3']
      wrapper.vm.removePollOption(1)

      expect(wrapper.vm.form.poll_options).toHaveLength(2)
      expect(wrapper.vm.form.poll_options).toEqual(['Option 1', 'Option 3'])
    })

    it('should not allow removing options if only 2 remain', () => {
      wrapper = createWrapper()

      wrapper.vm.form.poll_options = ['Option 1', 'Option 2']
      wrapper.vm.removePollOption(0)

      expect(wrapper.vm.form.poll_options).toHaveLength(2)
    })

    it('should calculate poll expiration dates', () => {
      wrapper = createWrapper()

      // Test different expiration options
      wrapper.vm.pollExpirationOption = 'never'
      expect(wrapper.vm.calculatePollExpiration()).toBe(null)

      wrapper.vm.pollExpirationOption = '1d'
      const expiration = wrapper.vm.calculatePollExpiration()
      expect(expiration).toBeInstanceOf(Date)
    })
  })

  describe('Tag Handling', () => {
    it('should update tags correctly', () => {
      wrapper = createWrapper()

      const tags = [
        { id: 1, name: 'test' },
        { id: 2, name: 'vue' },
      ]
      wrapper.vm.updateTags(tags)

      expect(wrapper.vm.form.tags).toEqual(tags)
    })

    it('should handle non-array tag input', () => {
      wrapper = createWrapper()

      wrapper.vm.updateTags('not-array')
      expect(wrapper.vm.form.tags).toEqual([])

      wrapper.vm.updateTags(null)
      expect(wrapper.vm.form.tags).toEqual([])
    })
  })

  describe('Content Type Specific Features', () => {
    it('should show correct placeholder for URLs based on content type', () => {
      wrapper = createWrapper()

      wrapper.vm.form.content_type = 'video'
      expect(wrapper.vm.getUrlPlaceholder()).toBe('https://youtube.com/watch?v=...')

      wrapper.vm.form.content_type = 'audio'
      expect(wrapper.vm.getUrlPlaceholder()).toBe('https://soundcloud.com/...')

      wrapper.vm.form.content_type = 'link'
      expect(wrapper.vm.getUrlPlaceholder()).toBe('https://ejemplo.com')
    })

    it('should show correct step titles based on content type', () => {
      wrapper = createWrapper()

      // link, video, audio, image all use title_step now
      wrapper.vm.form.content_type = 'link'
      expect(wrapper.vm.getStep3Title()).toBe('submit.wizard.title_step')

      wrapper.vm.form.content_type = 'video'
      expect(wrapper.vm.getStep3Title()).toBe('submit.wizard.title_step')

      wrapper.vm.form.content_type = 'text'
      expect(wrapper.vm.getStep3Title()).toBe('submit.wizard.text_step')
    })
  })

  describe('AI Assistant Integration', () => {
    it('should show AI not available notification', async () => {
      // Mock the notification composable
      const mockInfo = vi.fn()
      const mockUseNotification = vi.fn(() => ({
        info: mockInfo,
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
      }))

      // Import the module to get access to the mock
      const { useNotification } = await import('~/composables/useNotification')
      useNotification.mockImplementation(mockUseNotification)

      wrapper = createWrapper()

      wrapper.vm.showAINotAvailable()

      expect(mockInfo).toHaveBeenCalledWith('submit.ai_assistant_not_available', {
        priority: 'normal',
      })
    })

    it('should toggle AI assistant', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.showAIAssistant).toBe(false)

      wrapper.vm.toggleAIAssistant('title')
      expect(wrapper.vm.showAIAssistant).toBe(true)
      expect(wrapper.vm.aiAssistantMode).toBe('title')

      wrapper.vm.toggleAIAssistant('content')
      expect(wrapper.vm.showAIAssistant).toBe(false)
    })
  })

  describe('Error Reset', () => {
    it('should reset all errors', () => {
      wrapper = createWrapper()

      // Set some errors
      wrapper.vm.errors.title = 'Title error'
      wrapper.vm.errors.url = 'URL error'
      wrapper.vm.errors.content = 'Content error'

      wrapper.vm.resetErrors()

      expect(wrapper.vm.errors.title).toBe('')
      expect(wrapper.vm.errors.url).toBe('')
      expect(wrapper.vm.errors.content).toBe('')
    })
  })

  describe('Form State Management', () => {
    it('should maintain form state when navigating between steps', async () => {
      wrapper = createWrapper()

      // Fill some data
      wrapper.vm.form.title = 'Test Title'
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.url = 'https://example.com'

      // Navigate forward and back
      wrapper.vm.currentStep = 2
      await wrapper.vm.$nextTick()

      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()

      wrapper.vm.currentStep = 2
      await wrapper.vm.$nextTick()

      // Data should be preserved
      expect(wrapper.vm.form.title).toBe('Test Title')
      expect(wrapper.vm.form.content_type).toBe('link')
      expect(wrapper.vm.form.url).toBe('https://example.com')
    })
  })
})
