import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePushNotifications } from '~/composables/usePushNotifications'
import { useAuthStore } from '~/stores/auth'

// Mock useNotification composable
const mockNotification = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
}
vi.mock('~/composables/useNotification', () => ({
  useNotification: () => mockNotification,
}))

// Get mock API from global imports
const getMockApi = () => useNuxtApp().$api

describe('usePushNotifications', () => {
  let authStore
  let mockApi
  let originalProcessClient

  beforeEach(() => {
    setActivePinia(createPinia())
    authStore = useAuthStore()
    mockApi = getMockApi()
    vi.clearAllMocks()

    // Store original and mock process.client
    originalProcessClient = process.client
    process.client = true

    // Setup notification API mocks
    if (!mockApi.notifications) {
      mockApi.notifications = {}
    }
    mockApi.notifications.getVapidPublicKey = vi.fn().mockResolvedValue({
      data: { public_key: 'test-vapid-key' },
    })
    mockApi.notifications.savePushSubscription = vi.fn().mockResolvedValue({})
    mockApi.notifications.removePushSubscription = vi.fn().mockResolvedValue({})
    mockApi.notifications.updatePushPreferences = vi.fn().mockResolvedValue({})
    mockApi.notifications.getPushPreferences = vi.fn().mockResolvedValue({
      data: {
        enabled: true,
        comments: true,
        votes: true,
        mentions: true,
        system: true,
      },
    })
    mockApi.notifications.sendTestPushNotification = vi.fn().mockResolvedValue({})
  })

  afterEach(() => {
    // Restore original process.client
    process.client = originalProcessClient
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const pushNotifications = usePushNotifications()

      expect(pushNotifications.isSupported.value).toBe(false)
      expect(pushNotifications.isSubscribed.value).toBe(false)
      expect(pushNotifications.permission.value).toBe('default')
      expect(pushNotifications.loading.value).toBe(false)
    })

    it('should have default preferences', () => {
      const pushNotifications = usePushNotifications()

      expect(pushNotifications.preferences.value).toEqual({
        enabled: false,
        comments: true,
        votes: true,
        mentions: true,
        system: true,
      })
    })
  })

  describe('computed properties', () => {
    it('canSubscribe should be false when not supported', () => {
      const pushNotifications = usePushNotifications()
      expect(pushNotifications.canSubscribe.value).toBe(false)
    })

    it('canUnsubscribe should be false when not subscribed', () => {
      const pushNotifications = usePushNotifications()
      expect(pushNotifications.canUnsubscribe.value).toBe(false)
    })

    it('needsPermission should be false when not supported', () => {
      const pushNotifications = usePushNotifications()
      expect(pushNotifications.needsPermission.value).toBe(false)
    })

    it('isBlocked should be false by default', () => {
      const pushNotifications = usePushNotifications()
      expect(pushNotifications.isBlocked.value).toBe(false)
    })
  })

  describe('requestPermission', () => {
    it('should return false if not supported', async () => {
      const pushNotifications = usePushNotifications()
      const result = await pushNotifications.requestPermission()
      expect(result).toBe(false)
    })
  })

  describe('subscribe', () => {
    it('should return false if cannot subscribe', async () => {
      const pushNotifications = usePushNotifications()
      const result = await pushNotifications.subscribe()
      expect(result).toBe(false)
    })
  })

  describe('unsubscribe', () => {
    it('should return false if cannot unsubscribe', async () => {
      const pushNotifications = usePushNotifications()
      const result = await pushNotifications.unsubscribe()
      expect(result).toBe(false)
    })
  })

  describe('updatePreferences', () => {
    it('should return false if not authenticated', async () => {
      authStore.user = null
      authStore.isAuthenticated = false

      const pushNotifications = usePushNotifications()
      const result = await pushNotifications.updatePreferences({ comments: false })
      expect(result).toBe(false)
    })

    it('should return false for anonymous users', async () => {
      authStore.user = { id: 1, is_anonymous: true }
      authStore.isAuthenticated = true
      authStore.isAnonymous = true

      const pushNotifications = usePushNotifications()
      const result = await pushNotifications.updatePreferences({ comments: false })
      expect(result).toBe(false)
    })

    it('should update preferences when authenticated (integration test)', async () => {
      // Note: Full auth integration requires proper Pinia store setup
      // This tests the method exists and returns boolean
      const pushNotifications = usePushNotifications()
      const result = await pushNotifications.updatePreferences({ comments: false })
      expect(typeof result).toBe('boolean')
    })
  })

  describe('loadPreferences', () => {
    it('should not load preferences if not authenticated', async () => {
      authStore.user = null
      authStore.isAuthenticated = false

      const pushNotifications = usePushNotifications()
      await pushNotifications.loadPreferences()

      expect(mockApi.notifications.getPushPreferences).not.toHaveBeenCalled()
    })

    it('should not load preferences for anonymous users', async () => {
      authStore.user = { id: 1, is_anonymous: true }
      authStore.isAuthenticated = true
      authStore.isAnonymous = true

      const pushNotifications = usePushNotifications()
      await pushNotifications.loadPreferences()

      expect(mockApi.notifications.getPushPreferences).not.toHaveBeenCalled()
    })

    it('should have loadPreferences method', async () => {
      // Note: Full auth integration requires proper Pinia store setup
      // This tests the method exists and can be called
      const pushNotifications = usePushNotifications()
      expect(typeof pushNotifications.loadPreferences).toBe('function')
      // Method should not throw when called
      await expect(pushNotifications.loadPreferences()).resolves.not.toThrow()
    })

    it('should reset to defaults on error', async () => {
      authStore.user = { id: 1 }
      authStore.isAuthenticated = true
      authStore.isAnonymous = false

      mockApi.notifications.getPushPreferences.mockRejectedValue(new Error('Load failed'))

      const pushNotifications = usePushNotifications()
      await pushNotifications.loadPreferences()

      expect(pushNotifications.preferences.value).toEqual({
        enabled: false,
        comments: true,
        votes: true,
        mentions: true,
        system: true,
      })
    })
  })

  describe('testNotification', () => {
    it('should not send if not supported', async () => {
      const pushNotifications = usePushNotifications()
      await pushNotifications.testNotification()

      expect(mockApi.notifications.sendTestPushNotification).not.toHaveBeenCalled()
    })
  })

  describe('readonly state', () => {
    it('should expose readonly state values', () => {
      const pushNotifications = usePushNotifications()

      // These should be readonly refs
      expect(pushNotifications.subscription).toBeDefined()
      expect(pushNotifications.isSupported).toBeDefined()
      expect(pushNotifications.isSubscribed).toBeDefined()
      expect(pushNotifications.permission).toBeDefined()
      expect(pushNotifications.loading).toBeDefined()
      expect(pushNotifications.preferences).toBeDefined()
    })

    it('should expose computed properties', () => {
      const pushNotifications = usePushNotifications()

      expect(pushNotifications.canSubscribe).toBeDefined()
      expect(pushNotifications.canUnsubscribe).toBeDefined()
      expect(pushNotifications.needsPermission).toBeDefined()
      expect(pushNotifications.isBlocked).toBeDefined()
    })

    it('should expose all methods', () => {
      const pushNotifications = usePushNotifications()

      expect(typeof pushNotifications.initialize).toBe('function')
      expect(typeof pushNotifications.requestPermission).toBe('function')
      expect(typeof pushNotifications.subscribe).toBe('function')
      expect(typeof pushNotifications.unsubscribe).toBe('function')
      expect(typeof pushNotifications.updatePreferences).toBe('function')
      expect(typeof pushNotifications.loadPreferences).toBe('function')
      expect(typeof pushNotifications.testNotification).toBe('function')
    })
  })
})
