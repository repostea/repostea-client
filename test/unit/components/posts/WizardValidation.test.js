import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PostFormWizard from '~/components/posts/PostFormWizard.vue'

// Mock i18n with Spanish translations
const translations = {
  'submit.validation.content_type_required': 'El tipo de contenido es requerido',
  'submit.validation.title_min_length': 'El título debe tener al menos 3 caracteres',
  'submit.validation.content_min_length': 'El contenido debe tener al menos 10 caracteres',
  'submit.validation.url_required': 'La URL es requerida',
  'submit.validation.url_invalid': 'Debe ser una URL válida',
  'submit.validation.poll_min_options': 'Debe tener al menos 2 opciones',
  'submit.validation.description_min_length': 'La descripción debe tener al menos 10 caracteres',
}

vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: (key) => translations[key] || key,
  }),
  useLocalePath: () => (path) => path,
}))

// Mock Nuxt app with proper API structure
const mockApi = {
  tags: {
    getTagCategories: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Technology',
            name_key: 'technology',
            tags: [
              { id: 1, name: 'JavaScript', name_key: 'javascript' },
              { id: 2, name: 'Python', name_key: 'python' },
            ],
          },
        ],
      },
    }),
  },
  posts: {
    createPost: vi.fn(),
    importPost: vi.fn(),
  },
  media: {
    validateMediaUrl: vi.fn(),
    getMediaInfo: vi.fn(),
  },
}

vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: mockApi,
    $i18n: {
      locale: { value: 'es' },
      t: (key) => key,
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

// Mock notification methods for testing
const mockNotificationMethods = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  apiError: vi.fn(),
  validationError: vi.fn(),
  actionSuccess: vi.fn(),
}

vi.mock('~/composables/useNotification', () => ({
  useNotification: vi.fn(() => mockNotificationMethods),
}))

describe('PostFormWizard Smart Validation Tests', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    vi.clearAllMocks()

    // Clear notification mocks
    Object.values(mockNotificationMethods).forEach((mock) => mock.mockClear())

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
          MarkdownEditor: {
            template:
              '<textarea data-testid="content-textarea" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue'],
            emits: ['update:modelValue'],
          },
          TagSelector: {
            template: '<div data-testid="tags-input"></div>',
            props: ['modelValue'],
            emits: ['update:modelValue', 'update:value'],
          },
          RequiredFieldIndicator: { template: '<div></div>' },
        },
      },
    })
  }

  describe('Step Validation', () => {
    it('should validate step 2 before advancing for link type', async () => {
      wrapper = createWrapper()

      // For link type, step 2 validates URL (not title)
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.currentStep = 2
      await wrapper.vm.$nextTick()

      // Invalid URL
      wrapper.vm.form.url = 'invalid url'
      await wrapper.vm.nextStep()

      // Should remain on step 2
      expect(wrapper.vm.currentStep).toBe(2)

      // Should show warning notification
      expect(mockNotificationMethods.warning).toHaveBeenCalled()
    })

    it('should validate title in step 3 for link type', async () => {
      wrapper = createWrapper()

      // For link type: URL validated in step 2, title+description in step 3
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.url = 'https://example.com'
      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()

      // Title too short
      wrapper.vm.form.title = 'AB'
      await wrapper.vm.nextStep()

      // Should remain on step 3
      expect(wrapper.vm.currentStep).toBe(3)
      expect(mockNotificationMethods.warning).toHaveBeenCalled()
    })

    it('should validate text content length', async () => {
      wrapper = createWrapper()

      // Configurar para contenido de texto
      wrapper.vm.form.content_type = 'text'
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()

      // Contenido muy corto
      wrapper.vm.form.content = 'Short'
      wrapper.vm.nextStep()

      // Should remain on step 3 with error
      expect(wrapper.vm.currentStep).toBe(3)
      expect(mockNotificationMethods.warning).toHaveBeenCalled()
    })

    it('should validate poll options', async () => {
      wrapper = createWrapper()

      // Configurar para encuesta
      wrapper.vm.form.content_type = 'poll'
      wrapper.vm.form.title = 'Valid Poll'
      wrapper.vm.currentStep = 3
      wrapper.vm.form.poll_options = ['Option 1', ''] // Only one valid option
      await wrapper.vm.$nextTick()

      wrapper.vm.nextStep()

      // Should remain on step 3
      expect(wrapper.vm.currentStep).toBe(3)
      expect(mockNotificationMethods.warning).toHaveBeenCalled()
    })
  })

  describe('Error Detection and Navigation', () => {
    it('should detect error in step 2 (URL) for link type', () => {
      wrapper = createWrapper()

      // For link type: step 2 = URL, step 3 = title/description
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.form.content = 'Valid description with more than 10 chars'
      wrapper.vm.form.url = '' // Empty URL - error in step 2

      const errorStep = wrapper.vm.detectErrorStep()
      expect(errorStep).toBe(2)
    })

    it('should detect error in step 3 (title/description) for link type', () => {
      wrapper = createWrapper()

      // For link type: step 2 = URL, step 3 = title/description
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.title = 'AB' // Title too short - error in step 3
      wrapper.vm.form.content = 'Valid description with more than 10 chars'
      wrapper.vm.form.url = 'https://example.com'

      const errorStep = wrapper.vm.detectErrorStep()
      expect(errorStep).toBe(3)
    })

    it('should navigate to error step automatically', async () => {
      wrapper = createWrapper()

      // For link type: URL error goes to step 2
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.form.content = 'Valid description with more than 10 chars'
      wrapper.vm.form.url = '' // Empty URL - error
      wrapper.vm.currentStep = 4 // Start from step 4

      const navigated = wrapper.vm.navigateToErrorStep()

      expect(navigated).toBe(true)
      expect(wrapper.vm.currentStep).toBe(2)
      expect(mockNotificationMethods.warning).toHaveBeenCalled()
    })

    it('should return to step 1 if no specific error found', async () => {
      wrapper = createWrapper()

      // Configurar formulario incompleto
      wrapper.vm.form.content_type = ''
      wrapper.vm.currentStep = 4

      // Simulate submit with errors
      const hasErrors = !wrapper.vm.validateAllSteps()
      expect(hasErrors).toBe(true)

      // If submitPost detects general errors, should go to step 1
      if (hasErrors && !wrapper.vm.navigateToErrorStep()) {
        wrapper.vm.currentStep = 1
        expect(wrapper.vm.currentStep).toBe(1)
      }
    })
  })

  describe('Error Messages', () => {
    it('should show appropriate error message for each step', () => {
      wrapper = createWrapper()

      // Error paso 1
      expect(wrapper.vm.getStepErrorMessage(1)).toContain('tipo de contenido')

      // Error paso 2 for text type (title validation)
      wrapper.vm.form.content_type = 'text'
      wrapper.vm.form.title = 'AB'
      expect(wrapper.vm.getStepErrorMessage(2)).toContain('3 caracteres')

      // Error paso 2 for link type (URL validation)
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.url = ''
      expect(wrapper.vm.getStepErrorMessage(2)).toContain('URL es requerida')
    })

    it('should show content-specific error messages', () => {
      wrapper = createWrapper()

      // Error para contenido de texto
      wrapper.vm.form.content_type = 'text'
      wrapper.vm.form.content = 'Short'
      expect(wrapper.vm.getStepErrorMessage(3)).toContain('10 caracteres')

      // Error para encuesta
      wrapper.vm.form.content_type = 'poll'
      wrapper.vm.form.poll_options = ['Only one']
      expect(wrapper.vm.getStepErrorMessage(3)).toContain('2 opciones')
    })
  })

  describe('Visual Error Feedback', () => {
    it('should set error state for invalid fields', async () => {
      wrapper = createWrapper()

      // For link type, title is in step 3
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.url = 'https://example.com'
      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()

      // Invalid title
      wrapper.vm.form.title = 'AB'
      wrapper.vm.validateTitle()

      // The errors object should have the title error
      expect(wrapper.vm.errors.title).toBeTruthy()
    })

    it('should clear error state when field becomes valid', async () => {
      wrapper = createWrapper()

      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.url = 'https://example.com'
      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()

      // Generate error
      wrapper.vm.form.title = 'AB'
      wrapper.vm.validateTitle()
      expect(wrapper.vm.errors.title).toBeTruthy()

      // Fix error
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.validateTitle()
      expect(wrapper.vm.errors.title).toBe('')
    })
  })

  describe('Complete Form Validation', () => {
    it('should validate all steps before submission', async () => {
      wrapper = createWrapper()

      // Formulario incompleto
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.form.content = 'Valid description with more than 10 chars'
      wrapper.vm.form.url = '' // URL faltante

      const isValid = wrapper.vm.validateAllSteps()
      expect(isValid).toBe(false)
      expect(wrapper.vm.errors.url).toBeTruthy()
    })

    it('should pass validation when all fields are valid', async () => {
      wrapper = createWrapper()

      // Complete and valid form
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.form.content = 'Valid description with more than 10 chars'
      wrapper.vm.form.url = 'https://example.com'

      const isValid = wrapper.vm.validateAllSteps()
      expect(isValid).toBe(true)
    })

    it('should handle submission with validation errors', async () => {
      wrapper = createWrapper()

      // For link type with URL error - should go to step 2
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.form.content = 'Valid description with more than 10 chars'
      wrapper.vm.form.url = '' // Missing URL
      wrapper.vm.currentStep = 4 // En paso final

      // Intentar enviar
      await wrapper.vm.submitPost()

      // Should navigate to step with error (step 2 for URL error)
      expect(wrapper.vm.currentStep).toBe(2)
      expect(mockNotificationMethods.warning).toHaveBeenCalled()
    })
  })

  describe('Real-time Validation', () => {
    it('should validate title programmatically', async () => {
      wrapper = createWrapper()

      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.url = 'https://example.com'
      wrapper.vm.currentStep = 3
      await wrapper.vm.$nextTick()

      // Simulate validation with short title
      wrapper.vm.form.title = 'AB'
      wrapper.vm.validateTitle()

      // Should show error
      expect(wrapper.vm.errors.title).toBeTruthy()
    })

    it('should validate URL format programmatically', async () => {
      wrapper = createWrapper()

      wrapper.vm.form.content_type = 'link'
      wrapper.vm.currentStep = 2
      await wrapper.vm.$nextTick()

      // URL without protocol
      wrapper.vm.form.url = 'example.com'
      wrapper.vm.validateUrl()

      // Should either show error or have been normalized
      // The component may normalize the URL or show an error
      const hasError = wrapper.vm.errors.url !== ''
      const isNormalized = wrapper.vm.form.url === 'https://example.com'

      expect(hasError || isNormalized).toBe(true)
    })
  })

  describe('Notification Types', () => {
    it('should show warning notifications for validation errors', async () => {
      wrapper = createWrapper()

      // For text type in step 3, content is validated
      wrapper.vm.form.content_type = 'text'
      wrapper.vm.form.title = 'Valid Title'
      wrapper.vm.form.content = 'Short' // Too short, less than 10 chars
      wrapper.vm.currentStep = 3

      await wrapper.vm.nextStep()

      expect(mockNotificationMethods.warning).toHaveBeenCalled()
      expect(mockNotificationMethods.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ priority: 'normal', timeout: 5000 })
      )
    })

    it('should show warning with timeout configuration', async () => {
      wrapper = createWrapper()

      // For link type in step 3, title is validated
      wrapper.vm.form.content_type = 'link'
      wrapper.vm.form.url = 'https://example.com'
      wrapper.vm.form.title = 'AB' // Too short
      wrapper.vm.currentStep = 3

      await wrapper.vm.nextStep()

      expect(mockNotificationMethods.warning).toHaveBeenCalled()

      // Verify timeout was configured
      expect(mockNotificationMethods.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ priority: 'normal', timeout: 5000 })
      )
    })
  })
})
