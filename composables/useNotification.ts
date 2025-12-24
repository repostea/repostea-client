import { ref, computed, readonly, getCurrentInstance } from 'vue'
import { useI18n } from '#i18n'

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info'
export type NotificationPriority = 'high' | 'normal' | 'low'

// Notification configuration interface
export interface NotificationConfig {
  message: string
  type?: NotificationType
  priority?: NotificationPriority
  timeout?: number
  translate?: boolean
  translateParams?: Record<string, any>
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
    style?: 'primary' | 'secondary'
  }>
}

// Individual notification interface
export interface Notification extends Required<Omit<NotificationConfig, 'actions'>> {
  id: string
  timestamp: number
  actions: NotificationConfig['actions']
}

// Global notification state
const notifications = ref<Notification[]>([])
const notificationCounter = ref(0)

// Export for testing
export const resetNotificationState = () => {
  notifications.value = []
  notificationCounter.value = 0
}

export function useNotification() {
  // Only use i18n if in component context
  let t: (key: string, params?: Record<string, unknown>) => string
  try {
    if (getCurrentInstance()) {
      const i18n = useI18n()
      t = i18n.t as (key: string, params?: Record<string, unknown>) => string
    } else {
      // Fallback when not in component context
      t = (key: string) => key
    }
  } catch {
    // Fallback if i18n is not available
    t = (key: string) => key
  }

  // Default configurations by priority
  const defaultConfigs = {
    high: {
      timeout: 0, // Persistent for high priority
      persistent: true,
    },
    normal: {
      timeout: 3000, // Reduced from 5000
      persistent: false,
    },
    low: {
      timeout: 2000, // Reduced from 3000
      persistent: false,
    },
  }

  // Generate unique notification ID
  const generateId = () => {
    notificationCounter.value++
    return `notification-${Date.now()}-${notificationCounter.value}`
  }

  // Add notification to the queue
  const addNotification = (config: NotificationConfig): string => {
    const priority = config.priority || 'normal'
    const defaults = defaultConfigs[priority]

    const notification: Notification = {
      id: generateId(),
      message: config.message,
      type: config.type || 'info',
      priority,
      timeout: config.timeout ?? defaults.timeout,
      translate: config.translate || false,
      translateParams: config.translateParams || {},
      persistent: config.persistent ?? defaults.persistent,
      timestamp: Date.now(),
      actions: config.actions || [],
    }

    // For high priority notifications, clear existing ones
    if (priority === 'high') {
      notifications.value = notifications.value.filter((n) => n.priority !== 'high')
    }

    notifications.value.push(notification)

    // Auto-remove if not persistent
    if (!notification.persistent && notification.timeout > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.timeout)
    }

    return notification.id
  }

  // Remove notification by ID
  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  // Clear all notifications
  const clearAll = () => {
    notifications.value = []
  }

  // Clear notifications by type
  const clearByType = (type: NotificationType) => {
    notifications.value = notifications.value.filter((n) => n.type !== type)
  }

  // Clear notifications by priority
  const clearByPriority = (priority: NotificationPriority) => {
    notifications.value = notifications.value.filter((n) => n.priority !== priority)
  }

  // Convenience methods for different notification types
  const success = (message: string, options?: Partial<NotificationConfig>) => {
    return addNotification({
      message,
      type: 'success',
      priority: options?.priority || 'normal',
      ...options,
    })
  }

  const error = (message: string, options?: Partial<NotificationConfig>) => {
    return addNotification({
      message,
      type: 'error',
      priority: options?.priority || 'normal',
      ...options,
    })
  }

  const warning = (message: string, options?: Partial<NotificationConfig>) => {
    return addNotification({
      message,
      type: 'warning',
      priority: options?.priority || 'normal',
      ...options,
    })
  }

  const info = (message: string, options?: Partial<NotificationConfig>) => {
    return addNotification({
      message,
      type: 'info',
      priority: options?.priority || 'normal',
      ...options,
    })
  }

  // Smart API error handler
  const apiError = (
    error: any,
    fallbackMessage = 'Ha ocurrido un error',
    options?: Partial<NotificationConfig>
  ) => {
    let message = fallbackMessage

    if (error?.response?.data?.message) {
      message = error.response.data.message
    } else if (error?.message) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }

    return addNotification({
      message,
      type: 'error',
      priority: 'high',
      ...options,
    })
  }

  // Validation error handler for forms
  const validationError = (
    errors: Record<string, string[]> | string,
    options?: Partial<NotificationConfig>
  ) => {
    let message: string

    if (typeof errors === 'string') {
      message = errors
    } else {
      // Show first validation error
      const firstError = Object.values(errors)[0]?.[0]
      if (!firstError) return
      message = firstError
    }

    return addNotification({
      message,
      type: 'error',
      priority: 'normal',
      ...options,
    })
  }

  // Action confirmation with auto-dismiss
  const actionSuccess = (action: string, options?: Partial<NotificationConfig>) => {
    return addNotification({
      message: `${action} realizado correctamente`,
      type: 'success',
      priority: 'low',
      timeout: 3000,
      ...options,
    })
  }

  // Get notification message with translation if needed
  const getNotificationMessage = (notification: Notification): string => {
    if (notification.translate) {
      return t(notification.message, notification.translateParams)
    }
    return notification.message
  }

  // Computed properties for different notification categories
  const highPriorityNotifications = computed(() =>
    notifications.value.filter((n) => n.priority === 'high')
  )

  const normalPriorityNotifications = computed(() =>
    notifications.value.filter((n) => n.priority === 'normal')
  )

  const lowPriorityNotifications = computed(() =>
    notifications.value.filter((n) => n.priority === 'low')
  )

  const hasNotifications = computed(() => notifications.value.length > 0)

  return {
    // State
    notifications: readonly(notifications),
    highPriorityNotifications,
    normalPriorityNotifications,
    lowPriorityNotifications,
    hasNotifications,

    // Core methods
    addNotification,
    removeNotification,
    clearAll,
    clearByType,
    clearByPriority,
    getNotificationMessage,

    // Convenience methods
    success,
    error,
    warning,
    info,
    apiError,
    validationError,
    actionSuccess,
  }
}

// Types are already exported above via interface declarations
