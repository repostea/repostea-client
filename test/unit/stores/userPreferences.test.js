import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserPreferencesStore } from '../../../stores/userPreferences'

// Mock de process.env
global.process = global.process || {}
global.process.env = global.process.env || {}
global.process.env.NODE_ENV = 'test'

// Mock de useCookie
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: {
      user: {
        getPreferences: vi.fn(),
        savePreferences: vi.fn()
      }
    }
  })
}))

// Mock global de useCookie
global.useCookie = vi.fn(() => ({
  value: null
}))

describe('UserPreferences Store - Content Languages', () => {
  beforeEach(() => {
    // Configurar process.env y process.client
    global.process.env = { NODE_ENV: 'test' }
    global.process.client = true

    // Crear una nueva instancia de Pinia para cada test
    setActivePinia(createPinia())

    // Limpiar mocks
    vi.clearAllMocks()
  })

  it('should start with empty selectedLanguages', () => {
    const store = useUserPreferencesStore()
    expect(store.selectedLanguages).toEqual([])
  })

  it('should have getSelectedLanguages getter', () => {
    const store = useUserPreferencesStore()
    expect(store.getSelectedLanguages).toEqual([])
  })

  it('should update selectedLanguages with setSelectedLanguages', () => {
    const store = useUserPreferencesStore()
    const languages = ['es', 'en', 'fr']

    store.setSelectedLanguages(languages)

    expect(store.selectedLanguages).toEqual(languages)
  })

  it('should update cookie when setting selectedLanguages', () => {
    const mockCookie = { value: null }
    global.useCookie = vi.fn(() => mockCookie)

    const store = useUserPreferencesStore()
    const languages = ['es', 'en']

    store.setSelectedLanguages(languages)

    // Verify that updatePreferencesCookie was called
    expect(mockCookie.value).toBeTruthy()

    // Verificar que la cookie contiene los idiomas
    const cookieData = JSON.parse(mockCookie.value)
    expect(cookieData.selectedLanguages).toEqual(languages)
  })

  it('should include selectedLanguages in cookie with other preferences', () => {
    const mockCookie = { value: null }
    global.useCookie = vi.fn(() => mockCookie)

    const store = useUserPreferencesStore()
    store.theme = 'dark'
    store.layout = 'list'
    store.selectedLanguages = ['es', 'ca']

    store.updatePreferencesCookie()

    const cookieData = JSON.parse(mockCookie.value)
    expect(cookieData).toEqual({
      theme: 'dark',
      layout: 'list',
      sortBy: 'created_at',
      sortDir: 'desc',
      selectedLanguages: ['es', 'ca']
    })
  })

  it('should handle empty selectedLanguages array', () => {
    const store = useUserPreferencesStore()

    store.setSelectedLanguages([])

    expect(store.selectedLanguages).toEqual([])
  })

  it('should handle single language selection', () => {
    const store = useUserPreferencesStore()

    store.setSelectedLanguages(['es'])

    expect(store.selectedLanguages).toEqual(['es'])
  })

  it('should handle multiple language selection', () => {
    const store = useUserPreferencesStore()
    const languages = ['es', 'en', 'fr', 'de', 'it']

    store.setSelectedLanguages(languages)

    expect(store.selectedLanguages).toEqual(languages)
  })

  it('should preserve other preferences when setting languages', () => {
    const store = useUserPreferencesStore()

    // Establecer otras preferencias primero
    store.theme = 'yups'
    store.layout = 'compact'
    store.sortBy = 'votes'

    // Ahora establecer idiomas
    store.setSelectedLanguages(['es', 'en'])

    // Verificar que otras preferencias no cambiaron
    expect(store.theme).toBe('yups')
    expect(store.layout).toBe('compact')
    expect(store.sortBy).toBe('votes')
    expect(store.selectedLanguages).toEqual(['es', 'en'])
  })
})
