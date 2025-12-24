import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Import store after mocking
import { useAuthStore } from '~/stores/auth'

// Mock API before importing store
let mockApi = {
  auth: {
    getUser: vi.fn(),
  },
}

// Mock cookie values
const mockCookieValues = {}

// Mock useNuxtApp globally
vi.mock('#app', () => ({
  useNuxtApp: () => ({
    $api: mockApi,
  }),
  useCookie: (name) => ({
    value: mockCookieValues[name] || null,
  }),
}))

describe('Auth Store - Background Request Handling', () => {
  let mockLocalStorage
  let mockSessionStorage

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Reset mockApi and ensure it's shared
    mockApi.auth.getUser = vi.fn()

    // Mock process.client for Pinia (just add property, don't replace object)
    process.client = true

    // Create new pinia instance for each test
    setActivePinia(createPinia())

    // Mock localStorage
    mockLocalStorage = {
      data: {},
      getItem: vi.fn((key) => mockLocalStorage.data[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage.data[key] = value
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage.data[key]
      }),
    }
    global.localStorage = mockLocalStorage

    // Mock sessionStorage
    mockSessionStorage = {
      data: {},
      getItem: vi.fn((key) => mockSessionStorage.data[key] || null),
      setItem: vi.fn((key, value) => {
        mockSessionStorage.data[key] = value
      }),
      removeItem: vi.fn((key) => {
        delete mockSessionStorage.data[key]
      }),
    }
    global.sessionStorage = mockSessionStorage
  })

  describe('fetchUser with Background Request Flag', () => {
    it('should pass isBackgroundRequest=true parameter during initialization', async () => {
      const authStore = useAuthStore()

      // Setup: Valid token exists in store (not just localStorage)
      mockLocalStorage.data.token = 'valid-token'
      authStore.token = 'valid-token'

      // Mock successful API response
      mockApi.auth.getUser.mockResolvedValue({
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      })

      // Call fetchUser with isBackgroundRequest=true (as in initialize())
      await authStore.fetchUser(true, true)

      // Verify getUser was called with isBackgroundRequest=true
      expect(mockApi.auth.getUser).toHaveBeenCalledWith(true)
      expect(authStore.user).toBeDefined()
      expect(authStore.user.username).toBe('testuser')
    })

    it('should pass isBackgroundRequest=false by default', async () => {
      const authStore = useAuthStore()

      // Setup: Valid token exists
      mockLocalStorage.data.token = 'valid-token'
      authStore.token = 'valid-token'

      // Mock successful API response
      mockApi.auth.getUser.mockResolvedValue({
        data: {
          id: 1,
          username: 'testuser',
        },
      })

      // Call fetchUser without isBackgroundRequest (default behavior)
      await authStore.fetchUser()

      // Verify getUser was called with isBackgroundRequest=false (default)
      expect(mockApi.auth.getUser).toHaveBeenCalledWith(false)
    })

    it('should call fetchUser with isBackgroundRequest=true during initialize', async () => {
      // Setup: Token in localStorage before creating store
      mockLocalStorage.data.token = 'some-token'
      mockLocalStorage.data.user = JSON.stringify({ id: 1, username: 'cached' })

      // Mock successful response
      mockApi.auth.getUser.mockResolvedValue({
        data: {
          id: 1,
          username: 'fresh-data',
        },
      })

      const authStore = useAuthStore()

      // Call initialize (which should call fetchUser with isBackgroundRequest=true)
      await authStore.initialize()

      // Verify it was called with background flag
      expect(mockApi.auth.getUser).toHaveBeenCalledWith(true)
    })
  })

  describe('initialize() with Invalid Token', () => {
    it('should handle 401 error silently when token is invalid', async () => {
      // Setup: Invalid token in localStorage before creating store
      mockLocalStorage.data.token = 'invalid-token'
      mockLocalStorage.data.user = JSON.stringify({ id: 1 })

      // Mock 401 response with data (real auth error from server)
      // The token should only be cleared if there's a valid response with data
      mockApi.auth.getUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Unauthenticated' },
        },
        config: {
          headers: { 'X-Background-Request': 'true' },
        },
      })

      const authStore = useAuthStore()

      // Should not throw during initialize
      await authStore.initialize()

      // Token and user should be cleared after failed fetch (real 401 with data)
      expect(authStore.token).toBeNull()
      expect(authStore.user).toBeNull()
    })

    it('should start with cached user data before fetching fresh data', async () => {
      const authStore = useAuthStore()

      // Setup: Cached data in localStorage
      const cachedUser = { id: 1, username: 'cached' }
      mockLocalStorage.data.token = 'valid-token'
      mockLocalStorage.data.user = JSON.stringify(cachedUser)

      // Mock slow API response
      mockApi.auth.getUser.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: { id: 1, username: 'fresh' },
              })
            }, 100)
          })
      )

      // Start initialization (don't await yet)
      const initPromise = authStore.initialize()

      // User should be immediately available from cache
      expect(authStore.user).toBeDefined()
      expect(authStore.user.username).toBe('cached')
      expect(authStore.token).toBe('valid-token')
      expect(authStore.initialized).toBe(true)

      // Wait for fresh data
      await initPromise

      // Should now have fresh data
      expect(authStore.user.username).toBe('fresh')
    })
  })

  describe('fetchUser Behavior', () => {
    it('should not fetch when no token exists', async () => {
      const authStore = useAuthStore()

      // No token in localStorage
      mockLocalStorage.data = {}

      // Call fetchUser
      const result = await authStore.fetchUser()

      // Should return null without calling API
      expect(result).toBeNull()
      expect(mockApi.auth.getUser).not.toHaveBeenCalled()
    })

    it('should skip fetch if user exists and not forced', async () => {
      const authStore = useAuthStore()

      // Setup: Token and user already in store
      authStore.token = 'valid-token'
      authStore.user = { id: 1, username: 'existing' }
      authStore.lastFetchTime = Date.now()

      // Call fetchUser without force
      await authStore.fetchUser(false)

      // Should not call API
      expect(mockApi.auth.getUser).not.toHaveBeenCalled()
    })

    it('should force fetch when force=true', async () => {
      const authStore = useAuthStore()

      // Setup: Token and user already in store
      mockLocalStorage.data.token = 'valid-token'
      authStore.token = 'valid-token'
      authStore.user = { id: 1, username: 'existing' }
      authStore.lastFetchTime = Date.now()

      // Mock API response
      mockApi.auth.getUser.mockResolvedValue({
        data: { id: 1, username: 'updated' },
      })

      // Call fetchUser with force=true, isBackgroundRequest=false
      await authStore.fetchUser(true, false)

      // Should call API even though user exists
      expect(mockApi.auth.getUser).toHaveBeenCalledWith(false)
      expect(authStore.user.username).toBe('updated')
    })

    it('should set lastFetchTime after successful fetch', async () => {
      const authStore = useAuthStore()

      // Setup
      mockLocalStorage.data.token = 'valid-token'
      authStore.token = 'valid-token'
      const beforeTime = Date.now()

      // Mock API response
      mockApi.auth.getUser.mockResolvedValue({
        data: { id: 1, username: 'user' },
      })

      // Fetch user with force=true
      await authStore.fetchUser(true, false)

      // lastFetchTime should be updated
      expect(authStore.lastFetchTime).toBeGreaterThanOrEqual(beforeTime)
      expect(authStore.lastFetchTime).toBeLessThanOrEqual(Date.now())
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during initialization and keep token', async () => {
      // Setup: Token exists in localStorage before creating store
      mockLocalStorage.data.token = 'some-token'

      // Mock network error (no response = network error, not auth error)
      mockApi.auth.getUser.mockRejectedValue({
        message: 'Network Error',
      })

      const authStore = useAuthStore()

      // Should not throw
      await expect(authStore.initialize()).resolves.not.toThrow()

      // Token should be KEPT on network errors (not cleared)
      // This prevents users from being logged out during deploys/network issues
      expect(authStore.token).toBe('some-token')
    })

    it('should handle malformed cached user data', async () => {
      // Setup: Invalid JSON in localStorage before creating store
      mockLocalStorage.data.token = 'valid-token'
      mockLocalStorage.data.user = 'invalid-json{'

      // Mock successful API response
      mockApi.auth.getUser.mockResolvedValue({
        data: { id: 1, username: 'fresh' },
      })

      const authStore = useAuthStore()

      // Should not crash on initialize
      await expect(authStore.initialize()).resolves.not.toThrow()

      // Should have fresh data
      expect(authStore.user).toBeDefined()
      expect(authStore.user.username).toBe('fresh')
    })
  })
})
