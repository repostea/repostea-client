import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ThemeSelector from '~/components/common/ThemeSelector.vue'

// Mock i18n
const mockT = vi.fn((key) => key)
vi.mock('#i18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}))

// Mock the stores
vi.mock('~/stores/userPreferences', () => ({
  useUserPreferencesStore: () => ({
    theme: 'renegados1',
    setTheme: vi.fn(),
  }),
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: true,
  }),
}))

// Mock the useNotification composable
vi.mock('~/composables/useNotification', () => ({
  useNotification: () => ({
    info: vi.fn(),
  }),
}))

describe('ThemeSelector', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('renders correctly', () => {
    wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('shows current theme', () => {
    wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        stubs: {
          Icon: true,
        },
      },
    })

    expect(wrapper.vm.preferencesStore.theme).toBe('renegados1')
  })

  it('can toggle theme', async () => {
    // Mock process.client (just add property, don't replace object)
    process.client = true

    wrapper = mount(ThemeSelector, {
      global: {
        plugins: [pinia],
        stubs: {
          Icon: true,
        },
      },
    })

    // Call the switchTheme method
    await wrapper.vm.switchTheme('dark')

    expect(wrapper.vm.preferencesStore.setTheme).toHaveBeenCalledWith('dark')
  })
})
