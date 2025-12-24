<template>
  <div v-click-outside="closeDropdown" class="relative flex items-center">
    <!-- Notification Bell -->
    <button
      class="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors notification-bell-btn"
      :class="{ 'bg-white/20': isOpen }"
      :aria-label="$t('notifications.toggle_dropdown')"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :title="$t('notifications.notifications')"
      @click="toggleDropdown"
    >
      <Icon name="fa6-solid:bell" class="text-lg" aria-hidden="true" />

      <!-- Unread Badge - Only show on client side with valid count -->
      <ClientOnly>
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium"
          :aria-label="`${unreadCount} ${$t('notifications.unread')}`"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </ClientOnly>

      <!-- Connection Status Indicator - Hidden per user request -->
      <!--
      <span
        class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900"
        :class="connectionStatusClass"
        :title="connectionStatusText"
      ></span>
      -->
    </button>

    <!-- Dropdown Menu - Only render after first interaction and on client side -->
    <ClientOnly>
      <Transition
        v-if="hasInteracted"
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          class="notification-dropdown fixed sm:absolute top-16 sm:top-full right-0 sm:right-0 mt-0 sm:mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-none sm:max-w-md mr-2 sm:mr-0 rounded-lg shadow-lg z-50"
          role="menu"
          aria-orientation="vertical"
        >
        <!-- Header -->
        <div class="notification-header px-4 py-3 flex items-center justify-between">
          <h3 class="font-semibold text-text dark:text-text-dark">
            {{ $t('notifications.notifications') }}
          </h3>
          <SnoozeButton />
        </div>

        <!-- Push Subscription Banner -->
        <PushSubscriptionBanner />

        <!-- Notification Summary -->
        <div class="notification-summary">
          <!-- Loading State -->
          <div v-if="loadingSummary" class="px-4 py-8 text-center flex flex-col items-center">
            <Icon name="fa6-solid:spinner" class="text-2xl text-primary mb-2 animate-spin" aria-hidden="true" />
            <p class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('common.loading') }}
            </p>
          </div>

          <!-- Summary Cards (always shown when not loading) -->
          <div v-else>
            <!-- Post Comments -->
            <NuxtLink
              :to="localePath('/profile/notifications/posts')"
              class="block px-4 py-3 notification-item-hover transition-colors"
              @click="closeDropdown"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Icon name="fa6-solid:comment" class="text-blue-500 text-lg" aria-hidden="true" />
                  <div>
                    <div class="text-sm font-medium text-text dark:text-text-dark">
                      {{ $t('notifications.post_comments') }}
                    </div>
                    <div class="text-xs text-text-muted dark:text-text-dark-muted">
                      <span v-if="summary.posts?.new > 0">{{ summary.posts.new }} {{ $t('notifications.new') }}</span>
                      <span v-else-if="summary.posts?.unread > 0">{{ summary.posts.unread }} {{ $t('notifications.unread').toLowerCase() }}</span>
                      <span v-else>{{ $t('notifications.no_new') }}</span>
                    </div>
                  </div>
                </div>
                <span v-if="summary.posts?.new > 0" class="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {{ summary.posts.new }}
                </span>
              </div>
            </NuxtLink>

            <!-- Comment Replies -->
            <NuxtLink
              :to="localePath('/profile/notifications/comments')"
              class="block px-4 py-3 notification-item-hover transition-colors"
              @click="closeDropdown"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Icon name="fa6-solid:reply" class="text-blue-500 text-lg" aria-hidden="true" />
                  <div>
                    <div class="text-sm font-medium text-text dark:text-text-dark">
                      {{ $t('notifications.comment_replies') }}
                    </div>
                    <div class="text-xs text-text-muted dark:text-text-dark-muted">
                      <span v-if="summary.comments?.new > 0">{{ summary.comments.new }} {{ $t('notifications.new') }}</span>
                      <span v-else-if="summary.comments?.unread > 0">{{ summary.comments.unread }} {{ $t('notifications.unread').toLowerCase() }}</span>
                      <span v-else>{{ $t('notifications.no_new') }}</span>
                    </div>
                  </div>
                </div>
                <span v-if="summary.comments?.new > 0" class="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {{ summary.comments.new }}
                </span>
              </div>
            </NuxtLink>

            <!-- Mentions -->
            <NuxtLink
              :to="localePath('/profile/notifications/mentions')"
              class="block px-4 py-3 notification-item-hover transition-colors"
              @click="closeDropdown"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Icon name="fa6-solid:at" class="text-purple-500 text-lg" aria-hidden="true" />
                  <div>
                    <div class="text-sm font-medium text-text dark:text-text-dark">
                      {{ $t('notifications.mentions') }}
                    </div>
                    <div class="text-xs text-text-muted dark:text-text-dark-muted">
                      <span v-if="summary.mentions?.new > 0">{{ summary.mentions.new }} {{ $t('notifications.new') }}</span>
                      <span v-else-if="summary.mentions?.unread > 0">{{ summary.mentions.unread }} {{ $t('notifications.unread').toLowerCase() }}</span>
                      <span v-else>{{ $t('notifications.no_new') }}</span>
                    </div>
                  </div>
                </div>
                <span v-if="summary.mentions?.new > 0" class="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {{ summary.mentions.new }}
                </span>
              </div>
            </NuxtLink>

            <!-- Achievements (sin punto rojo) -->
            <NuxtLink
              :to="localePath('/profile/notifications/achievements')"
              class="block px-4 py-3 notification-item-hover transition-colors"
              @click="closeDropdown"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <Icon name="fa6-solid:trophy" class="text-yellow-500 text-lg" aria-hidden="true" />
                  <div>
                    <div class="text-sm font-medium text-text dark:text-text-dark">
                      {{ $t('notifications.achievements_and_karma') }}
                    </div>
                    <div class="text-xs text-text-muted dark:text-text-dark-muted">
                      <span v-if="summary.achievements?.new > 0">{{ summary.achievements.new }} {{ $t('notifications.new') }}</span>
                      <span v-else-if="summary.achievements?.unread > 0">{{ summary.achievements.unread }} {{ $t('notifications.unread').toLowerCase() }}</span>
                      <span v-else>{{ $t('notifications.no_new') }}</span>
                    </div>
                  </div>
                </div>
                <span v-if="summary.achievements?.new > 0" class="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {{ summary.achievements.new }}
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Footer -->
        <div
          v-if="!loadingSummary"
          class="notification-footer px-4 py-3 flex items-center justify-center text-sm"
        >
          <NuxtLink
            :to="localePath('/profile/notifications')"
            class="text-primary hover:text-primary-dark transition-colors font-medium inline-flex items-center gap-1"
            @click="closeDropdown"
          >
            {{ $t('notifications.view_all') }}
            <Icon name="fa6-solid:arrow-right" class="text-xs" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </Transition>
    </ClientOnly>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRealTimeNotificationsStore } from '~/stores/realTimeNotifications'
  import { useAuthStore } from '~/stores/auth'
  import { useLocalePath } from '#i18n'

  const localePath = useLocalePath()
  const notificationsStore = useRealTimeNotificationsStore()
  const authStore = useAuthStore()

  // Local state
  const isOpen = ref(false)
  const isClientSide = ref(false)
  const hasInteracted = ref(false)

  // Use store state instead of local state
  const summary = computed(() => notificationsStore.summary)
  const loadingSummary = computed(() => notificationsStore.loadingSummary)

  // Computed
  // New count solo para posts, comments y mentions (sin achievements)
  const unreadCount = computed(() => {
    if (!import.meta.client) return 0
    return (summary.value.posts?.new || 0) +
           (summary.value.comments?.new || 0) +
           (summary.value.mentions?.new || 0)
  })

  // Methods
  const toggleDropdown = async () => {
    hasInteracted.value = true
    isOpen.value = !isOpen.value
    // Load summary when opening dropdown (non-silent to show loading state)
    if (isOpen.value) {
      await notificationsStore.loadSummary(false)
    }
  }

  const closeDropdown = () => {
    isOpen.value = false
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

  // Close dropdown on escape key
  const handleKeydown = (event) => {
    if (event.key === 'Escape' && isOpen.value) {
      closeDropdown()
    }
  }

  onMounted(async () => {
    document.addEventListener('keydown', handleKeydown)

    // Set client side flag
    isClientSide.value = true

    // Start centralized polling if authenticated
    // The store will handle all polling logic
    if (authStore.isAuthenticated) {
      notificationsStore.startSummaryPolling(60000) // Poll every 60 seconds
    }
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    // Note: We don't stop polling here because other components might need it
    // Polling will be managed globally by the store
  })
</script>

<style scoped>
  /* Notification dropdown styles */
  .notification-dropdown {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .notification-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .notification-summary {
    border-top: 1px solid var(--color-border-default);
  }

  .notification-summary > * + * {
    border-top: 1px solid var(--color-border-default);
  }

  .notification-footer {
    border-top: 1px solid var(--color-border-default);
  }

  /* Custom scrollbar for notifications list */
  .max-h-96::-webkit-scrollbar {
    width: 6px;
  }

  .max-h-96::-webkit-scrollbar-track {
    background-color: var(--color-bg-hover);
    border-radius: 3px;
  }

  .max-h-96::-webkit-scrollbar-thumb {
    background-color: var(--color-border-strong);
    border-radius: 3px;
  }

  .max-h-96::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-text-muted);
  }

  /* Animation for notification badge */
  @keyframes pulse-red {
    0%,
    100% {
      @apply bg-red-500;
    }
    50% {
      @apply bg-red-600;
    }
  }

  .animate-pulse-red {
    animation: pulse-red 2s infinite;
  }

  .notification-item-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .notification-bell-btn {
    color: var(--color-navbar-text-secondary);
  }

  .notification-bell-btn:hover {
    color: var(--color-navbar-text);
  }
</style>
