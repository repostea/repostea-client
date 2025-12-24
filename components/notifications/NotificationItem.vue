<template>
  <div
    ref="notificationRef"
    class="notification-item px-4 py-3 last:border-b-0 transition-colors cursor-pointer relative"
    :class="{
      'bg-blue-50 dark:bg-blue-900/20': !notification.read,
      'opacity-75': notification.read,
    }"
    role="button"
    :aria-label="notificationAriaLabel"
    tabindex="0"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- Unread Indicator -->
    <div
      v-if="!notification.read"
      class="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-primary rounded-full"
      aria-hidden="true"
    />

    <div class="flex items-start space-x-3" :class="{ 'ml-4': !notification.read }">
      <!-- Icon -->
      <div class="flex-shrink-0 mt-1">
        <Icon :name="defaultIconIconify" :class="defaultIconColor" aria-hidden="true" />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Title and Actions -->
        <div class="flex items-start justify-between gap-2">
          <h4
            class="text-sm font-medium text-text dark:text-text-dark flex-1 line-clamp-2"
            :class="{ 'font-semibold': !notification.read }"
          >
            <span v-if="username" class="text-primary font-medium">@{{ username }}</span>
            <span v-if="username">{{ titleWithoutUsername }}</span>
            <span v-else>{{ notification.title }}</span>
          </h4>

          <!-- Actions Menu -->
          <div v-click-outside="closeActions" class="relative flex-shrink-0">
            <button
              class="p-1 text-text-muted dark:text-text-dark-muted hover:text-text dark:hover:text-text-dark rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              :aria-label="$t('notifications.actions')"
              @click.stop="toggleActions"
            >
              <Icon name="fa6-solid:ellipsis" class="text-xs" aria-hidden="true" />
            </button>

            <!-- Actions Dropdown -->
            <div
              v-if="showActions"
              class="notification-dropdown absolute right-0 mt-1 py-1 w-32 rounded-md shadow-lg z-10"
              role="menu"
            >
              <button
                v-if="!notification.read"
                class="w-full px-3 py-1 text-left text-sm text-text dark:text-text-dark hover:bg-primary/10 transition-colors"
                role="menuitem"
                @click.stop="$emit('mark-read')"
              >
                <Icon name="fa6-solid:check" class="text-xs mr-2" aria-hidden="true" />
                {{ $t('notifications.mark_read') }}
              </button>

              <button
                class="w-full px-3 py-1 text-left text-sm text-red-600 dark:text-red-400 hover:bg-primary/10 transition-colors"
                role="menuitem"
                @click.stop="$emit('remove')"
              >
                <Icon name="fa6-solid:trash" class="text-xs mr-2" aria-hidden="true" />
                {{ $t('notifications.remove') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Message with parsed body -->
        <div class="mt-2 space-y-2">
          <!-- Notification body -->
          <div class="notification-body text-sm">
            <div v-html="notification.body"/>
          </div>

          <!-- Timestamp and View link -->
          <div class="flex items-center justify-between">
            <time
              :datetime="new Date(notification.timestamp).toISOString()"
              class="text-xs text-text-muted dark:text-text-dark-muted"
              :title="formatFullDate(notification.timestamp)"
            >
              {{ formatRelativeTime(notification.timestamp) }}
            </time>

            <!-- View link if actionUrl exists (not for achievements/karma) -->
            <a
              v-if="notification.actionUrl && !['achievement', 'karma_level'].includes(notification.type)"
              :href="notification.actionUrl"
              class="text-xs text-primary hover:text-primary-dark dark:hover:text-primary-light font-medium hover:underline flex items-center gap-1"
              @click="handleViewClick"
            >
              {{ $t('common.view') }}
              <Icon name="fa6-solid:arrow-right" class="text-xs" aria-hidden="true" />
            </a>
          </div>
        </div>

        <!-- Priority Indicator -->
        <div
          v-if="notification.priority === 'high'"
          class="mt-1 flex items-center space-x-1 text-xs text-red-600 dark:text-red-400"
        >
          <Icon name="fa6-solid:triangle-exclamation" aria-hidden="true" />
          <span>{{ $t('notifications.high_priority') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useI18n } from '#i18n'


  const { t, locale } = useI18n()

  // Ref for the notification element (for Intersection Observer)
  const notificationRef = ref(null)

  const props = defineProps({
    notification: {
      type: Object,
      required: true,
    },
  })

  const emit = defineEmits(['click', 'mark-read', 'remove'])

  // Local state
  const showActions = ref(false)

  const defaultIconIconify = computed(() => {
    // Use custom icon if provided
    if (props.notification.iconClass) {
      // Extract icon name from iconClass string (e.g., 'fa6-solid:star text-yellow-500' -> 'fa6-solid:star')
      const iconMatch = props.notification.iconClass.match(/fa6-[a-z]+:[a-z0-9-]+/i)
      if (iconMatch) {
        return iconMatch[0]
      }
    }

    const typeIcons = {
      comment: 'fa6-solid:comment',
      comment_reply: 'fa6-solid:reply',
      vote: 'fa6-solid:thumbs-up',
      mention: 'fa6-solid:at',
      system: 'fa6-solid:bell',
      moderation: 'fa6-solid:shield-halved',
      achievement: 'fa6-solid:trophy',
      karma_level: 'fa6-solid:trophy',
    }
    return typeIcons[props.notification.type] || typeIcons.system
  })

  const defaultIconColor = computed(() => {
    const typeColors = {
      comment: 'text-blue-500',
      comment_reply: 'text-blue-500',
      vote: 'text-green-500',
      mention: 'text-purple-500',
      system: 'text-gray-500',
      moderation: 'text-red-500',
      achievement: 'text-yellow-500',
      karma_level: 'text-yellow-500',
    }
    return typeColors[props.notification.type] || typeColors.system
  })

  // Social notification helpers
  const isSocialNotification = computed(() => {
    return ['comment', 'comment_reply', 'mention'].includes(props.notification.type)
  })

  const username = computed(() => {
    if (!isSocialNotification.value || !props.notification.data) return null
    return props.notification.data.commenter_username ||
           props.notification.data.replier_username ||
           props.notification.data.mentioner_username
  })

  const notificationAriaLabel = computed(() => {
    const readStatus = props.notification.read ? t('notifications.read') : t('notifications.unread')
    return `${readStatus} ${props.notification.type} ${t('notifications.notification')}: ${props.notification.title}`
  })

  const titleWithoutUsername = computed(() => {
    if (!username.value || !props.notification.title) return props.notification.title
    // Remove the username from the beginning of the title
    // Handles patterns like "admin_test commented on your post Test Post"
    return props.notification.title.replace(username.value, '').trim()
  })

  // Methods
  const handleClick = (event) => {
    // Check if clicking on a link (including links inside v-html body)
    const clickedLink = event.target.tagName === 'A' ? event.target : event.target.closest('a')

    if (clickedLink) {
      // Mark as read when clicking any link within the notification
      if (!props.notification.read) {
        emit('mark-read')
      }
      // Let the link navigate naturally, no need to prevent default
      return
    }

    // If not clicking on a link, emit click to open modal/details
    emit('click')
  }

  const handleViewClick = (event) => {
    // Prevent default navigation
    event.preventDefault()

    // Mark as read when clicking "View" link
    if (!props.notification.read) {
      emit('mark-read')
    }

    // Navigate after a brief delay to allow the mark-read request to be sent
    // Using setTimeout ensures the API call is initiated before navigation
    setTimeout(() => {
      if (props.notification.actionUrl) {
        window.location.href = props.notification.actionUrl
      }
    }, 100)
  }

  const toggleActions = () => {
    showActions.value = !showActions.value
  }

  const closeActions = () => {
    showActions.value = false
  }

  const formatRelativeTime = (timestamp) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now - date
      const diffSec = Math.round(diffMs / 1000)
      const diffMin = Math.round(diffSec / 60)
      const diffHour = Math.round(diffMin / 60)
      const diffDay = Math.round(diffHour / 24)

      if (diffSec < 60) {
        return t('common.time.just_now')
      } else if (diffMin < 60) {
        return t('common.time.minutes_ago', { count: diffMin })
      } else if (diffHour < 24) {
        return t('common.time.hours_ago', { count: diffHour })
      } else if (diffDay < 30) {
        return t('common.time.days_ago', { count: diffDay })
      } else {
        return date.toLocaleDateString(locale.value, { timeZone: 'Europe/Madrid' })
      }
    } catch (_error) {
      console.error('Error formatting relative time:', _error)
      return t('notifications.unknown_time')
    }
  }

  const formatFullDate = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString(locale.value, {
        timeZone: 'Europe/Madrid',
        dateStyle: 'long',
        timeStyle: 'short'
      })
    } catch (_error) {
      console.error('Error formatting full date:', _error)
      return new Date(timestamp).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
    }
  }

  // Click outside directive
  const vClickOutside = {
    beforeMount(el, binding) {
      el.clickOutsideEvent = (event) => {
        if (!(el === event.target || el.contains(event.target))) {
          binding.value()
        }
      }
      document.addEventListener('click', el.clickOutsideEvent)
    },
    unmounted(el) {
      document.removeEventListener('click', el.clickOutsideEvent)
    },
  }

  // Intersection Observer to mark as read when visible
  let observer = null
  let visibilityTimeout = null

  onMounted(() => {
    if (!props.notification.read && notificationRef.value) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Start timer when visible
              visibilityTimeout = setTimeout(() => {
                if (!props.notification.read) {
                  emit('mark-read')
                }
                // Stop observing after marking as read
                if (observer) {
                  observer.disconnect()
                }
              }, 1500) // Mark as read after 1.5 seconds of visibility
            } else {
              // Cancel timer if scrolled out of view
              if (visibilityTimeout) {
                clearTimeout(visibilityTimeout)
                visibilityTimeout = null
              }
            }
          })
        },
        {
          threshold: 0.7, // 70% of the notification must be visible
        }
      )
      observer.observe(notificationRef.value)
    }
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
    if (visibilityTimeout) {
      clearTimeout(visibilityTimeout)
    }
  })
</script>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Notification body HTML links styling */
  .notification-body :deep(a) {
    @apply transition-colors;
  }

  .group:hover .group-hover\:opacity-100 {
    opacity: 1;
  }

  .notification-item {
    border-bottom: 2px solid var(--color-border-default);
  }

  .notification-item:hover {
    background-color: var(--color-bg-hover);
  }

  .notification-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }
</style>
