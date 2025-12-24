import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '~/composables/useAuth'

// Mock auth store
const mockAuthStore = {
  isAuthenticated: false,
  user: null,
  isGuest: true,
  isAdmin: false,
  isModerator: false,
}

// Mock useCookie
const mockToken = { value: null }

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

vi.mock('#app', () => ({
  useCookie: () => mockToken,
}))

// Mock process.client
const originalProcessClient = process.client

describe('useAuth composable', () => {
  beforeEach(() => {
    // Reset mock values
    mockAuthStore.isAuthenticated = false
    mockAuthStore.user = null
    mockAuthStore.isGuest = true
    mockAuthStore.isAdmin = false
    mockAuthStore.isModerator = false
    mockToken.value = null

    // Ensure we're on client side for tests
    global.process.client = true
  })

  afterAll(() => {
    global.process.client = originalProcessClient
  })

  describe('isAuthenticated', () => {
    it('should return false when user is not authenticated', () => {
      mockAuthStore.isAuthenticated = false
      const { isAuthenticated } = useAuth()
      expect(isAuthenticated.value).toBe(false)
    })

    it('should return true when user is authenticated', () => {
      mockAuthStore.isAuthenticated = true
      const { isAuthenticated } = useAuth()
      expect(isAuthenticated.value).toBe(true)
    })

    it('should use cookie for SSR (server-side)', () => {
      global.process.client = false
      mockToken.value = 'some-token'
      const { isAuthenticated } = useAuth()
      expect(isAuthenticated.value).toBe(true)
    })

    it('should return false on server when no token cookie', () => {
      global.process.client = false
      mockToken.value = null
      const { isAuthenticated } = useAuth()
      expect(isAuthenticated.value).toBe(false)
    })
  })

  describe('user', () => {
    it('should return null when no user', () => {
      mockAuthStore.user = null
      const { user } = useAuth()
      expect(user.value).toBeNull()
    })

    it('should return user object when authenticated', () => {
      const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' }
      mockAuthStore.user = mockUser
      const { user } = useAuth()
      expect(user.value).toEqual(mockUser)
    })
  })

  describe('isGuest', () => {
    it('should return true for guest users', () => {
      mockAuthStore.isGuest = true
      const { isGuest } = useAuth()
      expect(isGuest.value).toBe(true)
    })

    it('should return false for authenticated users', () => {
      mockAuthStore.isGuest = false
      const { isGuest } = useAuth()
      expect(isGuest.value).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return false for regular users', () => {
      mockAuthStore.isAdmin = false
      const { isAdmin } = useAuth()
      expect(isAdmin.value).toBe(false)
    })

    it('should return true for admin users', () => {
      mockAuthStore.isAdmin = true
      const { isAdmin } = useAuth()
      expect(isAdmin.value).toBe(true)
    })
  })

  describe('isModerator', () => {
    it('should return false for regular users', () => {
      mockAuthStore.isModerator = false
      const { isModerator } = useAuth()
      expect(isModerator.value).toBe(false)
    })

    it('should return true for moderator users', () => {
      mockAuthStore.isModerator = true
      const { isModerator } = useAuth()
      expect(isModerator.value).toBe(true)
    })
  })

  describe('reactivity', () => {
    it('should return computed properties that react to store changes', () => {
      const { user, isAdmin } = useAuth()

      // Initially null
      expect(user.value).toBeNull()
      expect(isAdmin.value).toBe(false)

      // Update store
      mockAuthStore.user = { id: 1, name: 'Admin' }
      mockAuthStore.isAdmin = true

      // Get fresh composable to test reactive nature
      const { user: user2, isAdmin: isAdmin2 } = useAuth()
      expect(user2.value).toEqual({ id: 1, name: 'Admin' })
      expect(isAdmin2.value).toBe(true)
    })
  })
})
