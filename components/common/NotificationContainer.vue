<template>
  <div class="notification-container">
    <!-- High Priority Notifications (Center/Modal-like) -->
    <Transition name="modal" mode="out-in">
      <div
        v-if="highPriorityNotifications.length > 0"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="clearHighPriority"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" />

        <!-- High Priority Notification -->
        <div
          v-for="notification in highPriorityNotifications"
          :key="notification.id"
          class="relative rounded-lg shadow-xl border max-w-md w-full"
          :class="getNotificationClasses(notification.type, 'high')"
          role="alertdialog"
          aria-modal="true"
        >
          <div class="p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <Icon
                  :name="getIconIconify(notification.type)"
                  :class="getIconColorClass(notification.type) + ' text-xl'"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-4 flex-1">
                <h3 class="text-lg font-semibold mb-2" :class="getTitleClass(notification.type)">
                  {{ getNotificationTitle(notification.type) }}
                </h3>
                <p class="text-sm" :class="getTextClass(notification.type)">
                  {{ getNotificationMessage(notification) }}
                </p>

                <!-- Actions -->
                <div
                  v-if="notification.actions && notification.actions.length > 0"
                  class="mt-4 flex gap-2"
                >
                  <button
                    v-for="action in notification.actions"
                    :key="action.label"
                    class="px-4 py-2 text-sm font-medium rounded-md transition-colors"
                    :class="getActionClasses(action.style || 'primary')"
                    @click="handleAction(action, notification.id)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </div>
              <div class="ml-4 flex-shrink-0">
                <button
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  :aria-label="$t('common.close')"
                  @click="removeNotification(notification.id)"
                >
                  <Icon name="fa6-solid:xmark" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Normal & Low Priority Notifications (Corner) -->
    <div
      class="fixed top-4 right-4 z-40 space-y-3 max-w-sm w-full"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup name="slide" tag="div" class="space-y-3">
        <div
          v-for="notification in cornerNotifications"
          :key="notification.id"
          class="notification-card rounded-lg shadow-lg border backdrop-blur-sm transform transition-all duration-300"
          :class="getNotificationClasses(notification.type, notification.priority)"
          role="alert"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <Icon
                  :name="getIconIconify(notification.type)"
                  :class="getIconColorClass(notification.type) + ' text-sm'"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium">
                  {{ getNotificationMessage(notification) }}
                </p>

                <!-- Compact Actions -->
                <div
                  v-if="notification.actions && notification.actions.length > 0"
                  class="mt-2 flex gap-2"
                >
                  <button
                    v-for="action in notification.actions"
                    :key="action.label"
                    class="px-2 py-1 text-xs font-medium rounded transition-colors"
                    :class="getActionClasses(action.style || 'secondary', 'small')"
                    @click="handleAction(action, notification.id)"
                  >
                    {{ action.label }}
                  </button>
                </div>
              </div>
              <div class="ml-3 flex-shrink-0">
                <button
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
                  :aria-label="$t('common.close')"
                  @click="removeNotification(notification.id)"
                >
                  <Icon name="fa6-solid:xmark" class="text-xs" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- Progress bar for timed notifications -->
            <div
              v-if="!notification.persistent && notification.timeout > 0"
              class="mt-2 w-full notification-progress-bg rounded-full h-1"
            >
              <div
                class="h-1 rounded-full transition-all ease-linear"
                :class="getProgressBarClass(notification.type)"
                :style="{ width: '100%', animationDuration: `${notification.timeout}ms` }"
                style="animation: shrink-width linear forwards"
              />
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from '#i18n'
  import {
    useNotification,
    type NotificationType,
    type NotificationPriority,
  } from '~/composables/useNotification'

  const { t } = useI18n()
  const {
    highPriorityNotifications,
    normalPriorityNotifications,
    lowPriorityNotifications,
    removeNotification,
    clearByPriority,
    getNotificationMessage,
  } = useNotification()

  // Combine normal and low priority for corner display
  const cornerNotifications = computed(() => [
    ...normalPriorityNotifications.value,
    ...lowPriorityNotifications.value,
  ])

  // Clear high priority notifications when clicking backdrop
  const clearHighPriority = () => {
    clearByPriority('high')
  }

  // Handle action buttons
  const handleAction = (action: { action: () => void }, notificationId: string) => {
    action.action()
    removeNotification(notificationId)
  }

  // Get notification styling classes
  const getNotificationClasses = (type: NotificationType, _priority: NotificationPriority) => {
    const baseClasses = {
      success:
        'bg-green-50/95 dark:bg-green-900/95 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700',
      error:
        'bg-red-50/95 dark:bg-red-900/95 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
      warning:
        'bg-yellow-50/95 dark:bg-yellow-900/95 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
      info: 'bg-blue-50/95 dark:bg-blue-900/95 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
    }

    return baseClasses[type]
  }

  // Get icon for Iconify
  const getIconIconify = (type: NotificationType) => {
    const icons = {
      success: 'fa6-solid:circle-check',
      error: 'fa6-solid:circle-exclamation',
      warning: 'fa6-solid:triangle-exclamation',
      info: 'fa6-solid:circle-info',
    }
    return icons[type]
  }

  // Get icon color class
  const getIconColorClass = (type: NotificationType) => {
    const colors = {
      success: 'text-green-500',
      error: 'text-red-500',
      warning: 'text-yellow-500',
      info: 'text-blue-500',
    }
    return colors[type]
  }

  // Get progress bar classes
  const getProgressBarClass = (type: NotificationType) => {
    const progressColors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500',
    }

    return progressColors[type]
  }

  // Get notification titles for high priority notifications
  const getNotificationTitle = (type: NotificationType) => {
    const titles = {
      success: t('notifications.success'),
      error: t('notifications.error'),
      warning: t('notifications.warning'),
      info: t('notifications.information'),
    }

    return titles[type] || titles.info
  }

  // Get title text classes
  const getTitleClass = (type: NotificationType) => {
    const classes = {
      success: 'text-green-800 dark:text-green-200',
      error: 'text-red-800 dark:text-red-200',
      warning: 'text-yellow-800 dark:text-yellow-200',
      info: 'text-blue-800 dark:text-blue-200',
    }

    return classes[type]
  }

  // Get body text classes
  const getTextClass = (type: NotificationType) => {
    const classes = {
      success: 'text-green-700 dark:text-green-300',
      error: 'text-red-700 dark:text-red-300',
      warning: 'text-yellow-700 dark:text-yellow-300',
      info: 'text-blue-700 dark:text-blue-300',
    }

    return classes[type]
  }

  // Get action button classes
  const getActionClasses = (
    style: 'primary' | 'secondary',
    size: 'normal' | 'small' = 'normal'
  ) => {
    const sizeClasses = size === 'small' ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'

    if (style === 'primary') {
      return `${sizeClasses} bg-primary text-white hover:bg-primary-dark`
    }

    return `${sizeClasses} notification-action-secondary`
  }
</script>

<style scoped>
  /* Modal transitions for high priority notifications */
  .modal-enter-active,
  .modal-leave-active {
    transition: all 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }

  /* Slide transitions for corner notifications */
  .slide-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-leave-active {
    transition: all 0.2s ease-in;
  }

  .slide-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }

  .slide-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }

  /* Progress bar animation */
  @keyframes shrink-width {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  /* Notification card hover effects */
  .notification-card:hover {
    transform: translateY(-1px);
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .notification-progress-bg {
    background-color: var(--color-border-default);
  }

  .notification-action-secondary {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-primary);
  }

  .notification-action-secondary:hover {
    background-color: var(--color-bg-hover);
  }
</style>
