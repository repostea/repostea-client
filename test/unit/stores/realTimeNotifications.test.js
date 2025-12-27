import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRealTimeNotificationsStore } from '~/stores/realTimeNotifications'

// Mock $fetch
global.$fetch = vi.fn()

// Mock useRuntimeConfig - make it globally available like Nuxt does
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:8000/api',
  },
}))

describe('realTimeNotifications Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key) => {
        if (key === 'token') return 'test-token-123'
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }

    // Mock sessionStorage
    global.sessionStorage = {
      getItem: vi.fn(() => null), // Return null instead of undefined
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }

    // Mock process.client (just add property, don't replace object)
    process.client = true
  })

  describe('Notifications State', () => {
    it('initializes with empty notifications', () => {
      const store = useRealTimeNotificationsStore()

      expect(store.notifications).toEqual([])
      expect(store.unreadCount).toBe(0)
    })

    it('calculates unread count correctly', () => {
      const store = useRealTimeNotificationsStore()

      // Add notifications manually for testing
      store._setNotificationsForTesting([
        {
          id: '1',
          read: false,
          title: 'Test 1',
          message: 'Body 1',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
        {
          id: '2',
          read: true,
          title: 'Test 2',
          message: 'Body 2',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
        {
          id: '3',
          read: false,
          title: 'Test 3',
          message: 'Body 3',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
      ])

      expect(store.unreadCount).toBe(2)
    })

    it('returns unread notifications correctly', () => {
      const store = useRealTimeNotificationsStore()

      store._setNotificationsForTesting([
        {
          id: '1',
          read: false,
          title: 'Test 1',
          message: 'Body 1',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
        {
          id: '2',
          read: true,
          title: 'Test 2',
          message: 'Body 2',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
        {
          id: '3',
          read: false,
          title: 'Test 3',
          message: 'Body 3',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
      ])

      expect(store.unreadNotifications).toHaveLength(2)
      expect(store.unreadNotifications.every((n) => !n.read)).toBe(true)
    })

    it('limits unread notifications to 10', () => {
      const store = useRealTimeNotificationsStore()

      // Add 15 unread notifications
      store._setNotificationsForTesting(
        Array.from({ length: 15 }, (_, i) => ({
          id: `${i}`,
          read: false,
          title: `Test ${i}`,
          message: `Body ${i}`,
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        }))
      )

      expect(store.unreadNotifications).toHaveLength(10)
    })
  })

  describe('loadNotifications', () => {
    it('loads notifications from API', async () => {
      const mockResponse = {
        data: [
          {
            id: '1',
            type: 'App\\Notifications\\TestNotification',
            title: 'Test',
            body: 'Body',
            read: false,
            created_at: '2025-01-01T00:00:00Z',
            data: {},
          },
        ],
        unread_count: 1,
      }

      global.$fetch = vi.fn().mockResolvedValue(mockResponse)

      const store = useRealTimeNotificationsStore()
      await store.loadNotifications()

      expect(global.$fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notifications',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123',
          },
        })
      )

      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].title).toBe('Test')
    })

    it('handles missing auth token', async () => {
      global.localStorage.getItem = vi.fn(() => null)

      const store = useRealTimeNotificationsStore()
      await store.loadNotifications()

      expect(global.$fetch).not.toHaveBeenCalled()
      expect(store.notifications).toEqual([])
    })

    it('handles API errors gracefully', async () => {
      global.$fetch = vi.fn().mockRejectedValue(new Error('API Error'))

      const store = useRealTimeNotificationsStore()
      await store.loadNotifications()

      // Should not throw, notifications should remain empty
      expect(store.notifications).toEqual([])
    })

    it('transforms API notifications correctly', async () => {
      const mockResponse = {
        data: [
          {
            id: '123',
            type: 'App\\Notifications\\TestNotification',
            title: 'Welcome',
            body: 'Welcome message',
            read: false,
            created_at: '2025-01-01T12:00:00Z',
            data: {
              action_url: '/profile',
            },
          },
        ],
        unread_count: 1,
      }

      global.$fetch = vi.fn().mockResolvedValue(mockResponse)

      const store = useRealTimeNotificationsStore()
      await store.loadNotifications()

      expect(store.notifications[0]).toMatchObject({
        id: '123',
        title: 'Welcome',
        read: false,
        actionUrl: '/profile',
      })
      // Verify body exists (may be 'body' or 'message' depending on store transformation)
      expect(store.notifications[0].body || store.notifications[0].message).toBe('Welcome message')
    })
  })

  describe('markAsRead', () => {
    it('marks notification as read optimistically', async () => {
      global.$fetch = vi.fn().mockResolvedValue({})

      const store = useRealTimeNotificationsStore()
      store._setNotificationsForTesting([
        {
          id: '1',
          read: false,
          title: 'Test',
          message: 'Body',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
      ])

      await store.markAsRead('1')

      expect(store.notifications[0].read).toBe(true)
      expect(global.$fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notifications/1/read',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })

    it('reverts on API error', async () => {
      global.$fetch = vi.fn().mockRejectedValue(new Error('API Error'))

      const store = useRealTimeNotificationsStore()
      store._setNotificationsForTesting([
        {
          id: '1',
          read: false,
          title: 'Test',
          message: 'Body',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
      ])

      await store.markAsRead('1')

      // Should revert the optimistic update
      expect(store.notifications[0].read).toBe(false)
    })
  })

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      global.$fetch = vi.fn().mockResolvedValue({})

      const store = useRealTimeNotificationsStore()
      store._setNotificationsForTesting([
        {
          id: '1',
          read: false,
          title: 'Test 1',
          message: 'Body 1',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
        {
          id: '2',
          read: false,
          title: 'Test 2',
          message: 'Body 2',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
      ])

      await store.markAllAsRead()

      expect(store.notifications.every((n) => n.read)).toBe(true)
      expect(global.$fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/notifications/read-all',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  describe('removeNotification', () => {
    it('removes notification from store', () => {
      const store = useRealTimeNotificationsStore()
      store._setNotificationsForTesting([
        {
          id: '1',
          read: false,
          title: 'Test 1',
          message: 'Body 1',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
        {
          id: '2',
          read: false,
          title: 'Test 2',
          message: 'Body 2',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
      ])

      store.removeNotification('1')

      expect(store.notifications).toHaveLength(1)
      expect(store.notifications[0].id).toBe('2')
    })
  })

  describe('clearAllNotifications', () => {
    it('clears all notifications', () => {
      const store = useRealTimeNotificationsStore()
      store._setNotificationsForTesting([
        {
          id: '1',
          read: false,
          title: 'Test 1',
          message: 'Body 1',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
        {
          id: '2',
          read: false,
          title: 'Test 2',
          message: 'Body 2',
          type: 'system',
          timestamp: Date.now(),
          priority: 'normal',
        },
      ])

      store.clearAllNotifications()

      expect(store.notifications).toEqual([])
    })
  })

  describe('Edge Cases', () => {
    it('handles null or undefined notifications gracefully', () => {
      const store = useRealTimeNotificationsStore()
      store._setNotificationsForTesting(null)

      expect(store.unreadCount).toBe(0)
      expect(store.unreadNotifications).toEqual([])
    })

    it('handles empty notification objects', () => {
      const store = useRealTimeNotificationsStore()
      store._setNotificationsForTesting([null, undefined, {}])

      // Should not crash
      expect(store.unreadCount).toBe(0)
    })
  })
})
