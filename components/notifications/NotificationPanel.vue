<template>
  <div class="notification-panel rounded-lg shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="notification-panel-header px-4 py-3">
      <h2 class="text-lg font-semibold text-text dark:text-text-dark flex items-center">
        <Icon name="fa6-solid:bell" class="mr-2 text-primary text-base" aria-hidden="true" />
        {{ $t('notifications.notification_summary') }}
      </h2>
    </div>

    <!-- Loading State (initial load only) -->
    <div v-if="loading" class="px-4 py-8 text-center flex flex-col items-center">
      <Icon name="fa6-solid:spinner" class="text-2xl text-primary mb-2 animate-spin" aria-hidden="true" />
      <p class="text-sm text-text-muted dark:text-text-dark-muted">
        {{ $t('common.loading') }}
      </p>
    </div>

    <!-- Summary Cards -->
    <div v-else class="notification-panel-items">
      <!-- Post Comments -->
      <button
        class="notification-category-btn w-full text-left block px-4 py-3 transition-colors"
        @click="$emit('category-selected', 'posts')"
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
      </button>

      <!-- Comment Replies -->
      <button
        class="notification-category-btn w-full text-left block px-4 py-3 transition-colors"
        @click="$emit('category-selected', 'comments')"
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
      </button>

      <!-- Mentions -->
      <button
        class="notification-category-btn w-full text-left block px-4 py-3 transition-colors"
        @click="$emit('category-selected', 'mentions')"
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
      </button>

      <!-- Achievements & Karma -->
      <button
        class="notification-category-btn w-full text-left block px-4 py-3 transition-colors"
        @click="$emit('category-selected', 'achievements')"
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
      </button>

      <!-- System Notifications -->
      <button
        class="notification-category-btn w-full text-left block px-4 py-3 transition-colors"
        @click="$emit('category-selected', 'system')"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <Icon name="fa6-solid:bell" class="text-gray-500 text-lg" aria-hidden="true" />
            <div>
              <div class="text-sm font-medium text-text dark:text-text-dark">
                {{ $t('notifications.system') }}
              </div>
              <div class="text-xs text-text-muted dark:text-text-dark-muted">
                <span v-if="summary.system?.new > 0">{{ summary.system.new }} {{ $t('notifications.new') }}</span>
                <span v-else-if="summary.system?.unread > 0">{{ summary.system.unread }} {{ $t('notifications.unread').toLowerCase() }}</span>
                <span v-else>{{ $t('notifications.no_new') }}</span>
              </div>
            </div>
          </div>
          <span v-if="summary.system?.new > 0" class="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
            {{ summary.system.new }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useRealTimeNotificationsStore } from '~/stores/realTimeNotifications'
  defineEmits(['category-selected'])

  const notificationsStore = useRealTimeNotificationsStore()

  // Use store state instead of local state
  const summary = computed(() => notificationsStore.summary)
  const loading = computed(() => notificationsStore.loadingSummary)

  // Load on mount - use centralized store
  onMounted(() => {
    // The store will handle loading, we just trigger it if needed
    // Since NotificationDropdown already started polling, this will use cached data
    if (!summary.value.posts && !summary.value.comments) {
      notificationsStore.loadSummary(false)
    }
  })

  // Expose refresh method for parent components
  defineExpose({
    refresh: () => notificationsStore.loadSummary(false),
  })
</script>

<style scoped>
  .notification-panel {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .notification-panel-header {
    border-bottom: 1px solid var(--color-border-default);
  }

  .notification-panel-items > * + * {
    border-top: 1px solid var(--color-border-default);
  }

  .notification-category-btn:hover {
    background-color: var(--color-bg-hover);
  }
</style>
