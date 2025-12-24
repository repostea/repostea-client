import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PostFormWizard from '~/components/posts/PostFormWizard.vue'

// Mock the composables
vi.mock('~/composables/useNotification', () => ({
  useNotification: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: { value: { id: 1, username: 'test' } },
    isAuthenticated: { value: true },
  }),
}))

// Mock the stores
const mockPostsStore = {
  createPost: vi.fn(),
}

vi.mock('~/stores/posts', () => ({
  usePostsStore: () => mockPostsStore,
}))

// Mock the API with proper structure
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

// Mock useNuxtApp to return our mocked API
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

// Mock the i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    locale: { value: 'es' },
  }),
}))

describe('PostFormWizard - Validation Navigation', () => {
  let wrapper

  beforeEach(() => {
    setActivePinia(createPinia())

    wrapper = mount(PostFormWizard, {
      global: {
        stubs: {
          'client-only': true,
          LazyIcon: true,
          NuxtLink: true,
          TagSelector: true,
          MarkdownEditor: true,
          RequiredFieldIndicator: true,
        },
        provide: {
          $api: mockApi,
        },
      },
    })
  })

  it('should navigate to step 3 when link description is too short on submit', async () => {
    // Set up a link post with short description
    // For link: Step 2 = URL, Step 3 = Title/Description
    // detectErrorStep returns 3 for description errors on link posts
    await wrapper.vm.selectContentType('link')

    // Fill title with valid value
    wrapper.vm.form.title = 'Valid title'

    // Fill description with invalid value (less than 10 characters)
    wrapper.vm.form.content = 'short'

    // Fill URL with valid value
    wrapper.vm.form.url = 'https://example.com'

    // Navigate to final step
    wrapper.vm.currentStep = 4

    // Mock the API response with validation error
    mockPostsStore.createPost.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'La descripción debe tener al menos 10 caracteres',
          errors: {
            content: ['La descripción debe tener al menos 10 caracteres'],
          },
        },
      },
    })

    // Attempt to submit
    await wrapper.vm.submitPost()

    // detectErrorStep returns 3 for title/description errors on link posts
    expect(wrapper.vm.currentStep).toBe(3)
    expect(wrapper.vm.errors.content).toBeTruthy()
  })

  it('should navigate to step 3 when title is too short on submit for link posts', async () => {
    // Set up a link post
    // For link: Step 2 = URL, Step 3 = Title/Description
    // detectErrorStep returns 3 for title errors on link posts
    await wrapper.vm.selectContentType('link')

    // Fill title with invalid value
    wrapper.vm.form.title = 'ab' // Only 2 characters

    // Fill valid description and URL
    wrapper.vm.form.content = 'This is a valid description with more than 10 characters'
    wrapper.vm.form.url = 'https://example.com'

    // Navigate to final step
    wrapper.vm.currentStep = 4

    // Mock the API response with validation error
    mockPostsStore.createPost.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'El título debe tener al menos 5 caracteres',
          errors: {
            title: ['El título debe tener al menos 5 caracteres'],
          },
        },
      },
    })

    // Attempt to submit
    await wrapper.vm.submitPost()

    // detectErrorStep returns 3 for title errors on link posts
    expect(wrapper.vm.currentStep).toBe(3)
    expect(wrapper.vm.errors.title).toBeTruthy()
  })

  it('should validate description length for link posts in step 3', async () => {
    // Set up a link post
    // For link: step 3 validates title and description
    await wrapper.vm.selectContentType('link')
    wrapper.vm.form.url = 'https://example.com'
    wrapper.vm.currentStep = 3

    // Fill title with valid value
    wrapper.vm.form.title = 'Valid title'

    // Fill description with invalid value
    wrapper.vm.form.content = 'short'

    // Validate current step
    const isValid = wrapper.vm.validateCurrentStep()

    expect(isValid).toBe(false)
    expect(wrapper.vm.errors.content).toBe('submit.validation.description_min_length')
  })

  it('should detect error step correctly for short link description', async () => {
    // Set up a link post with short description
    // For link: Step 2 = URL, Step 3 = Title/Description
    // detectErrorStep returns 3 for description errors
    wrapper.vm.form.content_type = 'link'
    wrapper.vm.form.title = 'Valid title'
    wrapper.vm.form.content = 'short' // Less than 10 characters
    wrapper.vm.form.url = 'https://example.com'

    const errorStep = wrapper.vm.detectErrorStep()

    // detectErrorStep returns 3 for description errors on link posts
    expect(errorStep).toBe(3)
  })

  it('should show error message on final step if navigation fails', async () => {
    // Set up a post that passes client validation but fails server validation
    wrapper.vm.form.content_type = 'text'
    wrapper.vm.form.title = 'Valid title'
    wrapper.vm.form.content = 'Valid content with more than 10 characters'
    wrapper.vm.currentStep = 4

    // Mock server error that doesn't map to a specific field
    mockPostsStore.createPost.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          message: 'Server error that cannot be mapped to a specific step',
        },
      },
    })

    // Attempt to submit
    await wrapper.vm.submitPost()

    // Should show error message on current step
    expect(wrapper.vm.errorMessage).toBeTruthy()
  })
})
