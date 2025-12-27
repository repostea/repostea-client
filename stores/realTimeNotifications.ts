import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWebSocket } from '~/composables/useWebSocket'
import { useNotification } from '~/composables/useNotification'
import { isSafeActionUrl } from '~/utils/urlSecurity'

export interface RealTimeNotification {
  id: string
  type: 'comment' | 'vote' | 'mention' | 'system' | 'moderation'
  title: string
  body: string
  data?: Record<string, unknown>
  read: boolean
  timestamp: number
  priority: 'high' | 'normal' | 'low'
  actionUrl?: string
  iconClass?: string
}

export interface NotificationCategorySummary {
  total: number
  unread: number
  new: number
}

export interface NotificationSummary {
  posts: NotificationCategorySummary
  comments: NotificationCategorySummary
  mentions: NotificationCategorySummary
  achievements: NotificationCategorySummary
  system: NotificationCategorySummary
}

export const useRealTimeNotificationsStore = defineStore('realTimeNotifications', () => {
  // State - Ensure clean initialization
  const notifications = ref<RealTimeNotification[]>([])
  const isConnected = ref(false)
  const connectionError = ref<string | null>(null)

  // Summary state
  const summary = ref<NotificationSummary>({
    posts: { total: 0, unread: 0, new: 0 },
    comments: { total: 0, unread: 0, new: 0 },
    mentions: { total: 0, unread: 0, new: 0 },
    achievements: { total: 0, unread: 0, new: 0 },
    system: { total: 0, unread: 0, new: 0 },
  })
  const loadingSummary = ref(false)
  const totalUnread = ref(0)

  // WebSocket instance (lazy initialized)
  let webSocket: ReturnType<typeof useWebSocket> | null = null

  // Notification system (lazy initialized)
  let notificationSystem: ReturnType<typeof useNotification> | null = null

  // Polling interval for summary
  let pollingInterval: NodeJS.Timeout | null = null

  // Computed
  const unreadCount = computed(() => {
    // Ensure we have a proper array and it's not empty
    if (
      !notifications.value ||
      !Array.isArray(notifications.value) ||
      notifications.value.length === 0
    ) {
      return 0
    }

    // Filter unread notifications with proper validation
    const unreadNotifications = notifications.value.filter((notification) => {
      return (
        notification &&
        typeof notification === 'object' &&
        'read' in notification &&
        notification.read === false
      )
    })

    return unreadNotifications.length
  })

  const unreadNotifications = computed(() => {
    if (
      !notifications.value ||
      !Array.isArray(notifications.value) ||
      notifications.value.length === 0
    ) {
      return []
    }

    return notifications.value
      .filter((notification) => {
        return (
          notification &&
          typeof notification === 'object' &&
          'read' in notification &&
          notification.read === false
        )
      })
      .slice(0, 10) // Limit to 10 most recent
  })

  const recentNotifications = computed(() => {
    if (
      !notifications.value ||
      !Array.isArray(notifications.value) ||
      notifications.value.length === 0
    ) {
      return []
    }

    return notifications.value.slice(0, 20) // Show last 20 notifications
  })

  // Initialize services
  const _initializeServices = () => {
    if (!webSocket) {
      webSocket = useWebSocket({
        reconnectInterval: 3000,
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000,
        autoConnect: false, // Manual connect
      })
    }

    if (!notificationSystem) {
      notificationSystem = useNotification()
    }
  }

  // Initialize WebSocket listeners
  const _initializeWebSocket = () => {
    if (!webSocket) return

    // Connection status
    webSocket.onConnected(() => {
      isConnected.value = true
      connectionError.value = null
    })

    webSocket.onDisconnected(() => {
      isConnected.value = false
    })

    webSocket.onError((error: Error | null) => {
      connectionError.value = error?.message || 'Connection error'
    })

    // Notification events
    webSocket.onNotification((data: Record<string, unknown>) => {
      handleNotification(data)
    })

    webSocket.onComment((data: Record<string, unknown>) => {
      handleCommentNotification(data)
    })

    webSocket.onVote((data: Record<string, unknown>) => {
      handleVoteNotification(data)
    })
  }

  // Handle incoming notifications
  const handleNotification = (data: Record<string, unknown>) => {
    const notification: RealTimeNotification = {
      id: (data.id as string) || generateId(),
      type: (data.type as RealTimeNotification['type']) || 'system',
      title: (data.title as string) || 'New Notification',
      body: (data.body as string) || (data.content as string) || '',
      data: data.data as Record<string, unknown> | undefined,
      read: false,
      timestamp: (data.timestamp as number) || Date.now(),
      priority: (data.priority as RealTimeNotification['priority']) || 'normal',
      actionUrl: (data.action_url as string) || (data.actionUrl as string),
      iconClass: getIconForType(data.type as string),
    }

    addNotification(notification)
    showToastNotification(notification)
  }

  // Handle comment notifications
  const handleCommentNotification = (data: Record<string, unknown>) => {
    const notification: RealTimeNotification = {
      id: (data.id as string) || generateId(),
      type: 'comment',
      title: (data.title as string) || '💬 New Comment',
      body:
        (data.body as string) ||
        `${(data.author_name as string) || 'Someone'} commented on your post`,
      data: {
        postId: data.post_id,
        commentId: data.comment_id,
        authorName: data.author_name,
        content: data.content,
      },
      read: false,
      timestamp: (data.timestamp as number) || Date.now(),
      priority: 'normal',
      actionUrl:
        (data.post_url as string) ||
        `/p/${(data.post_uuid as string) || data.post_id}#comment-${data.comment_id}`,
      iconClass: 'fa6-solid:comment text-blue-500',
    }

    addNotification(notification)
    showToastNotification(notification)
  }

  // Handle vote notifications
  const handleVoteNotification = (data: Record<string, unknown>) => {
    const voteValue = data.vote_value as number
    const isUpvote = voteValue > 0
    const notification: RealTimeNotification = {
      id: (data.id as string) || generateId(),
      type: 'vote',
      title: isUpvote ? '👍 Upvote' : '👎 Downvote',
      body: `Your ${(data.content_type as string) || 'post'} received ${isUpvote ? 'an upvote' : 'a downvote'}`,
      data: {
        postId: data.post_id,
        commentId: data.comment_id,
        voteValue: data.vote_value,
        contentType: data.content_type,
      },
      read: false,
      timestamp: (data.timestamp as number) || Date.now(),
      priority: 'low',
      actionUrl: (data.content_url as string) || `/p/${(data.post_uuid as string) || data.post_id}`,
      iconClass: isUpvote
        ? 'fa6-solid:thumbs-up text-green-500'
        : 'fa6-solid:thumbs-down text-red-500',
    }

    addNotification(notification)

    // Only show toast for upvotes to avoid spam
    if (isUpvote) {
      showToastNotification(notification)
    }
  }

  // Add notification to store
  const addNotification = (notification: RealTimeNotification) => {
    // Ensure notifications array exists
    if (!notifications.value) {
      notifications.value = []
    }

    // Validate notification object before adding
    if (!notification || typeof notification !== 'object' || !notification.id) {
      return
    }

    // Avoid duplicates
    const existingIndex = notifications.value.findIndex((n) => n.id === notification.id)
    if (existingIndex >= 0) {
      notifications.value[existingIndex] = notification
    } else {
      notifications.value.unshift(notification)
    }

    // Keep only last 100 notifications
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }
  }

  // Show toast notification
  const showToastNotification = (notification: RealTimeNotification) => {
    if (!notificationSystem) return

    const { title, body, priority, actionUrl } = notification

    const actions = isSafeActionUrl(actionUrl)
      ? [
          {
            label: 'View',
            action: () => {
              if (process.client) {
                window.location.href = actionUrl!
              }
            },
          },
        ]
      : undefined

    notificationSystem.addNotification({
      message: `${title}: ${body}`,
      type: getNotificationTypeForToast(notification.type),
      priority: priority as 'low' | 'normal' | 'high',
      timeout: priority === 'high' ? 0 : 5000, // High priority stays until dismissed
      actions,
    })
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!notifications.value) return

    // Find notification index
    const index = notifications.value.findIndex((n) => n.id === notificationId)
    if (index === -1) return

    // Optimistic update - replace the entire object to trigger reactivity
    const notification = notifications.value[index]
    notifications.value[index] = { ...notification, read: true }

    // Call API
    try {
      const config = useRuntimeConfig()
      // Use the same token name as the API plugin
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')

      if (!token) return

      await $fetch(`${config.public.apiBaseUrl}/v1/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Revert optimistic update on error
      notifications.value[index] = { ...notifications.value[index], read: false }
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!notifications.value) return

    // Optimistic update
    notifications.value.forEach((notification) => {
      notification.read = true
    })

    // Call API
    try {
      const config = useRuntimeConfig()
      // Use the same token name as the API plugin
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')

      if (!token) return

      await $fetch(`${config.public.apiBaseUrl}/v1/notifications/read-all`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Silent fail
    }
  }

  // Remove notification (local only)
  const removeNotification = (notificationId: string) => {
    if (!notifications.value) return
    const index = notifications.value.findIndex((n) => n.id === notificationId)
    if (index >= 0) {
      notifications.value.splice(index, 1)
    }
  }

  // Delete notification (API + local)
  const deleteNotification = async (notificationId: string) => {
    if (!notifications.value) return

    // Optimistic update
    const index = notifications.value.findIndex((n) => n.id === notificationId)
    const deletedNotification = index >= 0 ? notifications.value[index] : null

    if (index >= 0) {
      notifications.value.splice(index, 1)
    }

    // Call API
    try {
      const config = useRuntimeConfig()
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')

      if (!token) return

      await $fetch(`${config.public.apiBaseUrl}/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      // Revert optimistic update on error
      if (deletedNotification && index >= 0) {
        notifications.value.splice(index, 0, deletedNotification)
      }
    }
  }

  // Clear all notifications
  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Load notification summary (centralized)
  const loadSummary = async (silent = false) => {
    if (!process.client) {
      return
    }

    if (!silent) {
      loadingSummary.value = true
    }

    try {
      const config = useRuntimeConfig()
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')

      if (!token) {
        return
      }

      const data = await $fetch<{ summary: NotificationSummary; total_unread: number }>(
        `${config.public.apiBaseUrl}/v1/notifications/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      summary.value = data.summary
      totalUnread.value = data.total_unread

      // Cache summary in sessionStorage
      if (process.client) {
        sessionStorage.setItem('notification-summary', JSON.stringify(data.summary))
      }
    } catch {
      // Silent fail
    } finally {
      if (!silent) {
        loadingSummary.value = false
      }
    }
  }

  // Load only unread notifications from API (lightweight for badge)
  const loadUnreadCount = async () => {
    if (!process.client) {
      return
    }

    try {
      const config = useRuntimeConfig()
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')

      if (!token) {
        return
      }

      // Load only unread notifications (more efficient than loading all)
      const url = `${config.public.apiBaseUrl}/v1/notifications`
      const response = await $fetch<{ data: Array<Record<string, unknown>> }>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          filter: 'unread',
          per_page: 10, // Solo necesitamos el conteo, no todas
        },
      })

      // Transform API notifications to our format (only unread ones)
      // Already sorted by backend (orderBy created_at desc)
      const apiNotifications = response.data || []

      notifications.value = apiNotifications.map((n) => ({
        id: n.id as string,
        type: ((n.type as string)?.replace('App\\Notifications\\', '').toLowerCase() ||
          'system') as RealTimeNotification['type'],
        title: (n.title as string) || 'Notification',
        body: (n.body as string) || '',
        data: n.data as Record<string, unknown> | undefined,
        read: n.read as boolean,
        timestamp: new Date(n.created_at as string).getTime(),
        priority: 'normal' as const,
        actionUrl:
          ((n.data as Record<string, unknown>)?.action_url as string) ||
          ((n.data as Record<string, unknown>)?.actionUrl as string),
        iconClass: getIconForType(n.type as string),
      }))
    } catch {
      // Silent fail
    }
  }

  // Load notifications from API
  const loadNotifications = async (filter: 'all' | 'unread' | 'read' = 'all') => {
    if (!process.client) {
      return
    }

    try {
      const config = useRuntimeConfig()
      const token = sessionStorage.getItem('token') || localStorage.getItem('token')

      if (!token) {
        return
      }

      const url = `${config.public.apiBaseUrl}/v1/notifications`

      const response = await $fetch<{ data: Array<Record<string, unknown>> }>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          filter,
          per_page: 20,
        },
      })

      // Transform API notifications to our format
      // Already sorted by backend (orderBy created_at desc)
      const apiNotifications = response.data || []

      notifications.value = apiNotifications.map((n) => ({
        id: n.id as string,
        type: ((n.type as string)?.replace('App\\Notifications\\', '').toLowerCase() ||
          'system') as RealTimeNotification['type'],
        title: (n.title as string) || 'Notification',
        body: (n.body as string) || '',
        data: n.data as Record<string, unknown> | undefined,
        read: n.read as boolean,
        timestamp: new Date(n.created_at as string).getTime(),
        priority: 'normal' as const,
        actionUrl:
          ((n.data as Record<string, unknown>)?.action_url as string) ||
          ((n.data as Record<string, unknown>)?.actionUrl as string),
        iconClass: getIconForType(n.type as string),
      }))
    } catch {
      // Silent fail
    }
  }

  // Connect to SSE (disabled - using REST polling instead)
  const connect = () => {
    // SSE connection disabled - notifications fetched via REST API
  }

  // Disconnect from WebSocket
  const disconnect = () => {
    if (webSocket) {
      webSocket.disconnect()
    }
  }

  // Helper functions
  const generateId = (): string => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const getIconForType = (type: string): string => {
    const icons = {
      comment: 'fa6-solid:comment text-blue-500',
      vote: 'fa6-solid:thumbs-up text-green-500',
      mention: 'fa6-solid:at text-purple-500',
      system: 'fa6-solid:bell text-gray-500',
      moderation: 'fa6-solid:shield text-red-500',
    }
    return icons[type as keyof typeof icons] || icons.system
  }

  const getNotificationTypeForToast = (type: string): 'success' | 'error' | 'warning' | 'info' => {
    const typeMap = {
      comment: 'info',
      vote: 'success',
      mention: 'info',
      system: 'info',
      moderation: 'warning',
    }
    return (
      (typeMap[type as keyof typeof typeMap] as 'success' | 'error' | 'warning' | 'info') || 'info'
    )
  }

  // Start polling for summary updates
  const startSummaryPolling = (intervalMs = 60000) => {
    if (!process.client) return

    // Load immediately
    loadSummary(true)

    // Clear any existing interval
    stopSummaryPolling()

    // Setup new polling interval
    pollingInterval = setInterval(() => {
      loadSummary(true) // Silent mode to avoid loading spinner
    }, intervalMs)
  }

  // Stop polling for summary updates
  const stopSummaryPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // Auto-load notifications when store is accessed on client side
  const autoConnect = () => {
    // WebSocket/SSE TEMPORARILY DISABLED - performance issues
    // Instead, load notifications from REST API
    if (process.client) {
      loadNotifications()
    }
  }

  // Test helper - only for testing
  const _setNotificationsForTesting = (newNotifications: RealTimeNotification[]) => {
    // Allow in test environment (vitest sets NODE_ENV to 'test')
    if (process.env.NODE_ENV !== 'test' && import.meta.env.MODE !== 'test') {
      return
    }
    notifications.value = newNotifications
  }

  return {
    // State - exposed directly (Pinia handles reactivity, readonly causes issues with internal mutations)
    notifications,
    isConnected,
    connectionError,
    summary,
    loadingSummary,
    totalUnread,

    // Computed
    unreadCount,
    unreadNotifications,
    recentNotifications,

    // Actions
    loadNotifications,
    loadUnreadCount,
    loadSummary,
    startSummaryPolling,
    stopSummaryPolling,
    markAsRead,
    markAllAsRead,
    removeNotification,
    deleteNotification,
    clearAllNotifications,
    connect,
    disconnect,
    autoConnect,

    // Test helpers (only available in test mode)
    _setNotificationsForTesting,

    // WebSocket instance for advanced usage (getter)
    get webSocket() {
      return webSocket
    },
  }
})
