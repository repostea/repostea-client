import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'

// Create mock API functions that we can reference
const mockAuthApi = {
  guestLogin: vi.fn(),
  getUser: vi.fn(),
  logout: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  requestMagicLink: vi.fn(),
  verifyMagicLink: vi.fn(),
}

const mockUsersApi = {
  updateProfile: vi.fn(),
}

// Mock cookie values
const mockCookieValues = {}

// Mock Nuxt composables with proper structure
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: {
      auth: mockAuthApi,
      users: mockUsersApi,
    },
  }),
  useCookie: (name) => ({
    value: mockCookieValues[name] || null,
  }),
}))

// Mock localStorage service
vi.mock('~/services/localStorageService', () => ({
  localStorageService: {
    clearVotedPosts: vi.fn(),
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock process.client for Nuxt SSR check (extend existing process, don't replace it)
if (typeof process !== 'undefined') {
  process.client = true
}

describe('Auth Store - Anonymous Users', () => {
  let authStore

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()

    // Reset all mocks
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)

    // Reset mock functions
    Object.values(mockAuthApi).forEach((fn) => fn.mockReset())
    Object.values(mockUsersApi).forEach((fn) => fn.mockReset())

    // Reset cookie mock values
    Object.keys(mockCookieValues).forEach((key) => delete mockCookieValues[key])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Anonymous User Detection', () => {
    it('should detect anonymous user correctly', () => {
      // User not anonymous initially
      expect(authStore.isGuest).toBe(false)

      // Set anonymous user
      authStore.user = {
        id: 1,
        display_name: 'Test User (Anónimo)',
        is_guest: true,
      }

      expect(authStore.isGuest).toBe(true)
    })

    it('should detect anonymous user from localStorage fallback', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'guest_user') return 'true'
        return null
      })

      // Re-create store to test getter
      const newStore = useAuthStore()
      expect(newStore.isGuest).toBe(true)
    })
  })

  describe('Anonymous Login Process', () => {
    it('should perform anonymous login successfully', async () => {
      const mockResponse = {
        data: {
          user: {
            id: 123,
            username: 'guest_user_123',
            display_name: 'Juan Pérez (Anónimo)',
            is_guest: true,
            karma_points: 0,
          },
          token: 'anonymous_token_123',
        },
      }

      mockAuthApi.guestLogin.mockResolvedValue(mockResponse)

      await authStore.guestLogin()

      expect(authStore.user).toEqual(mockResponse.data.user)
      expect(authStore.token).toBe(mockResponse.data.token)
      expect(authStore.isGuest).toBe(true)

      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockResponse.data.token)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('guest_user', 'true')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockResponse.data.user)
      )
    })

    it('should handle anonymous login failure', async () => {
      const mockError = new Error('Network error')
      mockAuthApi.guestLogin.mockRejectedValue(mockError)

      await expect(authStore.guestLogin()).rejects.toThrow('Network error')

      expect(authStore.user).toBeNull()
      expect(authStore.token).toBeNull()
      expect(authStore.error).toBe('Error creating guest session')
    })
  })

  describe('Store Initialization with Anonymous Users', () => {
    it('should initialize with cached anonymous user data', async () => {
      const cachedUser = {
        id: 123,
        display_name: 'Cached User (Anónimo)',
        is_guest: true,
      }

      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return 'cached_token'
          case 'guest_user':
            return 'true'
          case 'user':
            return JSON.stringify(cachedUser)
          default:
            return null
        }
      })

      mockAuthApi.getUser.mockResolvedValue({
        data: cachedUser,
      })

      await authStore.initialize()

      // Should set user from cache immediately
      expect(authStore.user).toEqual(cachedUser)
      expect(authStore.token).toBe('cached_token')
      expect(authStore.isGuest).toBe(true)
      expect(authStore.initialized).toBe(true)
    })

    it('should create new anonymous session if flag exists but no token', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'guest_user') return 'true'
        return null
      })

      const mockResponse = {
        data: {
          user: { id: 456, is_guest: true, display_name: 'New Anonymous' },
          token: 'new_token',
        },
      }

      mockAuthApi.guestLogin.mockResolvedValue(mockResponse)

      await authStore.initialize()

      expect(mockAuthApi.guestLogin).toHaveBeenCalled()
      expect(authStore.user).toEqual(mockResponse.data.user)
      expect(authStore.isGuest).toBe(true)
    })

    it('should clear invalid cached data on real auth error', async () => {
      // Mock console.error to suppress error logs during tests
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return 'invalid_token'
          case 'user':
            return 'invalid_json'
          default:
            return null
        }
      })

      // Mock a real auth error with response (401 from server)
      // This should clear the token, unlike network errors which preserve it
      mockAuthApi.getUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthenticated' },
        },
      })

      await authStore.initialize()

      expect(authStore.user).toBeNull()
      expect(authStore.token).toBeNull()

      // Restore console.error
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Anonymous User State Management', () => {
    it('should maintain anonymous status after user update', async () => {
      authStore.user = {
        id: 123,
        display_name: 'Test Anonymous',
        is_guest: true,
      }

      expect(authStore.isGuest).toBe(true)

      // Update user data (simulating server response)
      authStore.user = {
        ...authStore.user,
        karma_points: 5,
      }

      expect(authStore.isGuest).toBe(true)
    })

    it('should correctly identify authenticated anonymous users', () => {
      authStore.token = 'valid_token'
      authStore.user = {
        id: 123,
        is_guest: true,
        display_name: 'Anonymous User',
      }

      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.isGuest).toBe(true)
    })

    it('should handle logout for anonymous users', async () => {
      authStore.token = 'anonymous_token'
      authStore.user = { id: 123, is_guest: true }

      mockAuthApi.logout.mockResolvedValue({ data: { message: 'Logged out' } })

      await authStore.logout()

      expect(authStore.user).toBeNull()
      expect(authStore.token).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('guest_user')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle localStorage errors gracefully', async () => {
      // Mock console.error to suppress error logs during tests
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Should not throw, but should handle the error gracefully
      await authStore.initialize()

      // Due to error in localStorage access, initialized will be false
      // but loading should be false (handled in finally)
      expect(authStore.initialized).toBe(false)
      expect(authStore.loading).toBe(false)

      // Restore console.error
      consoleErrorSpy.mockRestore()
    })

    it('should handle malformed cached user data', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return 'valid_token'
          case 'user':
            return '{invalid json'
          default:
            return null
        }
      })

      mockAuthApi.getUser.mockResolvedValue({
        data: { id: 123, is_guest: true },
      })

      await authStore.initialize()

      // Should still fetch from server
      expect(mockAuthApi.getUser).toHaveBeenCalled()
      expect(authStore.user).toEqual({ id: 123, is_guest: true })
    })

    it('should handle anonymous login restoration errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'guest_user') return 'true'
        return null
      })

      mockAuthApi.guestLogin.mockRejectedValue(new Error('Server error'))

      await authStore.initialize()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('guest_user')
      expect(authStore.initialized).toBe(true)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Performance and Caching', () => {
    it('should use cached data for immediate UI updates', async () => {
      const cachedUser = { id: 123, is_guest: true, display_name: 'Cached' }

      localStorageMock.getItem.mockImplementation((key) => {
        switch (key) {
          case 'token':
            return 'token'
          case 'user':
            return JSON.stringify(cachedUser)
          default:
            return null
        }
      })

      // Mock slow server response
      let serverResolve
      const serverPromise = new Promise((resolve) => {
        serverResolve = resolve
      })
      mockAuthApi.getUser.mockImplementation(() => serverPromise)

      const initPromise = authStore.initialize()

      // Should immediately set cached data
      expect(authStore.user).toEqual(cachedUser)
      expect(authStore.initialized).toBe(true)

      // Complete server response
      serverResolve({ data: { ...cachedUser, karma_points: 10 } })
      await initPromise

      // Should update with server data
      expect(authStore.user.karma_points).toBe(10)
    })
  })
})
