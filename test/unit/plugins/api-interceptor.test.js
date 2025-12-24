import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('API Interceptor - Background Request Handling', () => {
  // Mock storage objects
  let mockLocalStorage
  let mockSessionStorage
  let mockWindow

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

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
      clear: vi.fn(() => {
        mockLocalStorage.data = {}
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
      clear: vi.fn(() => {
        mockSessionStorage.data = {}
      }),
    }
    global.sessionStorage = mockSessionStorage

    // Mock window.location
    mockWindow = {
      location: {
        href: '',
        pathname: '/',
      },
    }
    global.window = mockWindow

    // Mock process.client (just add property, don't replace object)
    process.client = true
  })

  afterEach(() => {
    mockLocalStorage.data = {}
    mockSessionStorage.data = {}
  })

  /**
   * Helper function to simulate the interceptor logic
   */
  const simulateInterceptor = (error) => {
    const statusCode = error.response?.status

    if (statusCode === 401 && process.client) {
      const isBackgroundRequest = error.config?.headers?.['X-Background-Request'] === 'true'

      const token = sessionStorage.getItem('token') || localStorage.getItem('token')
      const isGuest =
        token &&
        (token.startsWith('guest_') ||
          sessionStorage.getItem('guest_user') === 'true' ||
          localStorage.getItem('guest_user') === 'true')

      sessionStorage.removeItem('token')
      localStorage.removeItem('token')

      if (!isBackgroundRequest && !isGuest) {
        sessionStorage.removeItem('user')
        localStorage.removeItem('user')
        localStorage.removeItem('guest_user')
        window.location.href = '/auth/login'
      }
    }
  }

  describe('Background Request with Invalid Token', () => {
    it('should NOT redirect to login when X-Background-Request header is present', () => {
      // Setup: User has invalid token
      mockLocalStorage.data.token = 'invalid-token'

      // Create mock error with background header
      const mockError = {
        response: { status: 401 },
        config: {
          headers: { 'X-Background-Request': 'true' },
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Verify tokens were cleaned up
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')

      // Verify NO redirect happened
      expect(window.location.href).not.toBe('/auth/login')
      expect(window.location.href).toBe('')
    })

    it('should clean up tokens silently on background 401', () => {
      // Setup: User has expired token
      mockLocalStorage.data.token = 'expired-token'

      // Create mock 401 error with background header
      const mockError = {
        response: { status: 401 },
        config: {
          headers: { 'X-Background-Request': 'true' },
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Verify cleanup happened
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')

      // Should NOT redirect
      expect(window.location.href).toBe('')
    })
  })

  describe('User-Initiated Request with Invalid Token', () => {
    it('should redirect to login when request is NOT marked as background', () => {
      // Setup: User has invalid token, NOT a guest
      mockLocalStorage.data.token = 'invalid-token'

      // Create mock 401 error WITHOUT background header
      const mockError = {
        response: { status: 401 },
        config: {
          headers: {}, // No X-Background-Request header
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Verify full cleanup
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('user')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')
      expect(localStorage.removeItem).toHaveBeenCalledWith('guest_user')

      // Verify redirect happened
      expect(window.location.href).toBe('/auth/login')
    })

    it('should redirect when voting without valid authentication', () => {
      // Setup: No token at all
      // (mockLocalStorage.data is already empty)

      // Create mock 401 error for vote endpoint
      const mockError = {
        response: { status: 401 },
        config: {
          method: 'POST',
          url: '/posts/1/vote',
          headers: {},
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Should redirect
      expect(window.location.href).toBe('/auth/login')
    })
  })

  describe('Guest User Handling', () => {
    it('should NOT redirect guest users on 401', () => {
      // Setup: Guest user token
      mockLocalStorage.data.token = 'guest_abc123'
      mockLocalStorage.data.guest_user = 'true'

      // Create mock 401 error
      const mockError = {
        response: { status: 401 },
        config: {
          method: 'POST',
          url: '/posts/1/vote',
          headers: {},
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Tokens should be cleaned
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')

      // But should NOT redirect
      expect(window.location.href).not.toBe('/auth/login')
      expect(window.location.href).toBe('')
    })

    it('should NOT redirect when guest_user flag is set in sessionStorage', () => {
      // Setup: Guest user in sessionStorage
      mockLocalStorage.data.token = 'some-token'
      mockSessionStorage.data.guest_user = 'true'

      // Create mock 401 error
      const mockError = {
        response: { status: 401 },
        config: {
          headers: {},
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Should NOT redirect guest
      expect(window.location.href).not.toBe('/auth/login')
      expect(window.location.href).toBe('')
    })

    it('should NOT redirect when token starts with "guest_"', () => {
      // Setup: Token starts with guest_ prefix
      mockLocalStorage.data.token = 'guest_token_123'

      // Create mock 401 error
      const mockError = {
        response: { status: 401 },
        config: {
          headers: {},
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Should clean tokens
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')

      // Should NOT redirect guest
      expect(window.location.href).toBe('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing error response gracefully', () => {
      // Create error with no response (network error)
      const mockError = {
        message: 'Network Error',
        config: {
          headers: { 'X-Background-Request': 'true' },
        },
      }

      // Should not crash
      expect(() => simulateInterceptor(mockError)).not.toThrow()

      // Should not redirect on network error
      expect(window.location.href).toBe('')
    })

    it('should handle undefined headers in config', () => {
      // Setup: Token exists
      mockLocalStorage.data.token = 'invalid-token'

      // Create mock error with undefined headers
      const mockError = {
        response: { status: 401 },
        config: {
          // No headers property
        },
      }

      // Should not crash
      expect(() => simulateInterceptor(mockError)).not.toThrow()

      // Should redirect (non-background, non-guest)
      expect(window.location.href).toBe('/auth/login')
    })

    it('should handle background request with both localStorage and sessionStorage tokens', () => {
      // Setup: Tokens in both storages
      mockLocalStorage.data.token = 'local-token'
      mockSessionStorage.data.token = 'session-token'

      // Create mock 401 with background header
      const mockError = {
        response: { status: 401 },
        config: {
          headers: { 'X-Background-Request': 'true' },
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Both should be cleaned
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('token')

      // Should NOT redirect
      expect(window.location.href).toBe('')
    })

    it('should only trigger on 401 status', () => {
      // Setup: Token exists
      mockLocalStorage.data.token = 'some-token'

      // Create mock 403 error (not 401)
      const mockError = {
        response: { status: 403 },
        config: {
          headers: {},
        },
      }

      // Simulate interceptor
      simulateInterceptor(mockError)

      // Should NOT clean tokens or redirect for non-401 errors
      expect(localStorage.removeItem).not.toHaveBeenCalled()
      expect(sessionStorage.removeItem).not.toHaveBeenCalled()
      expect(window.location.href).toBe('')
    })
  })
})
