<template>
  <div class="rankings-list">
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <Icon
          name="fa6-solid:spinner"
          class="text-4xl text-primary-dark dark:text-primary-light animate-spin"
          aria-hidden="true"
        />
      </div>
    </div>

    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <Icon
        name="fa6-solid:trophy"
        class="text-6xl text-gray-300 dark:text-gray-600 mb-4"
        aria-hidden="true"
      />
      <p class="text-gray-500 dark:text-gray-400">{{ t('rankings.no_data') }}</p>
    </div>

    <div v-else class="rankings-grid">
      <div
        v-for="(user, index) in filteredUsers"
        :key="user.id"
        class="ranking-item"
        :class="{
          highlighted: isCurrentUser(user),
          'top-1': startRank + index === 1,
          'top-2': startRank + index === 2,
          'top-3': startRank + index === 3,
        }"
      >
        <div class="rank-number">
          <Icon
            v-if="index === 0"
            name="fa6-solid:crown"
            class="text-yellow-500"
            aria-hidden="true"
          />
          <Icon
            v-else-if="index === 1"
            name="fa6-solid:medal"
            class="text-gray-400"
            aria-hidden="true"
          />
          <Icon
            v-else-if="index === 2"
            name="fa6-solid:medal"
            class="text-orange-500"
            aria-hidden="true"
          />
          <span v-else class="rank">#{{ startRank + index }}</span>
        </div>

        <NuxtLink :to="localePath(`/u/${user.username}`)" class="user-info">
          <div class="avatar">
            <Icon
              v-if="!user.avatar"
              name="fa6-solid:user"
              class="text-gray-400 text-xl"
              aria-hidden="true"
            />
            <NuxtImg
              v-else
              :src="user.avatar"
              :alt="user.display_name || user.username"
              width="40"
              height="40"
              class="avatar-img"
              loading="lazy"
              preset="avatar"
            />
          </div>
          <div class="user-details">
            <h4 class="username">{{ user.display_name || user.username }}</h4>
          </div>
        </NuxtLink>

        <div class="metric-display">
          <span class="metric-value">{{ formatMetric(user) }}</span>
          <span class="metric-label">{{ getMetricLabel() }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.last_page > 1" class="pagination-controls">
      <button
        :disabled="pagination.current_page === 1"
        class="pagination-button"
        :aria-label="t('pagination.previous')"
        @click="$emit('page-change', pagination.current_page - 1)"
      >
        <Icon name="fa6-solid:chevron-left" aria-hidden="true" />
      </button>

      <div class="page-info">
        {{ t('rankings.page') }} {{ pagination.current_page }} {{ t('rankings.of') }}
        {{ pagination.last_page }}
      </div>

      <button
        :disabled="pagination.current_page === pagination.last_page"
        class="pagination-button"
        :aria-label="t('pagination.next')"
        @click="$emit('page-change', pagination.current_page + 1)"
      >
        <Icon name="fa6-solid:chevron-right" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { useI18n, useLocalePath } from '#i18n'
  import { useAuthStore } from '~/stores/auth'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const authStore = useAuthStore()

  const props = defineProps({
    users: {
      type: Array,
      default: () => [],
    },
    category: {
      type: String,
      default: 'karma',
    },
    startRank: {
      type: Number,
      default: 4,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    pagination: {
      type: Object,
      default: null,
    },
  })

  defineEmits(['page-change'])

  // Filter out users with 0 karma points (or 0 of the metric being displayed)
  const filteredUsers = computed(() => {
    return props.users.filter((user) => {
      switch (props.category) {
        case 'karma':
          return (user.karma_points || 0) > 0
        case 'posts':
          return (user.posts_count || 0) > 0
        case 'comments':
          return (user.comments_count || 0) > 0
        case 'streaks':
          return (user.longest_streak || 0) > 0
        case 'achievements':
          return (user.achievements_count || 0) > 0
        default:
          return true
      }
    })
  })

  function formatMetric(user) {
    switch (props.category) {
      case 'karma':
        return (user.karma_points || 0).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
      case 'posts':
        return (user.posts_count || 0).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
      case 'comments':
        return (user.comments_count || 0).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
      case 'streaks':
        return user.longest_streak || 0
      case 'achievements':
        return user.achievements_count || 0
      default:
        return 0
    }
  }

  function getMetricLabel() {
    switch (props.category) {
      case 'karma':
        return t('rankings.karma_points')
      case 'posts':
        return t('rankings.posts')
      case 'comments':
        return t('rankings.comments')
      case 'streaks':
        return t('rankings.days_streak')
      case 'achievements':
        return t('rankings.achievements')
      default:
        return ''
    }
  }

  function isCurrentUser(user) {
    return authStore.user && authStore.user.id === user.id
  }
</script>

<style scoped>
  .rankings-list {
    @apply w-full;
  }

  .loading-container {
    @apply flex items-center justify-center py-12;
  }

  .empty-state {
    @apply flex flex-col items-center justify-center py-12;
  }

  .rankings-grid {
    @apply space-y-2;
  }

  .ranking-item {
    @apply flex items-center gap-3 p-2.5 rounded-lg transition-all hover:shadow-md;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .ranking-item.top-1 {
    @apply border-2 border-yellow-400 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10;
  }

  .ranking-item.top-2 {
    @apply border-2 border-gray-300 dark:border-gray-400 bg-gray-50/50 dark:bg-gray-900/10;
  }

  .ranking-item.top-3 {
    @apply border-2 border-orange-400 dark:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10;
  }

  .ranking-item.highlighted {
    @apply border-primary-dark dark:border-primary-light bg-blue-50 dark:bg-blue-900/20;
  }

  .rank-number {
    @apply flex-shrink-0 w-10 text-center;
  }

  .rank {
    @apply text-base font-bold text-gray-500 dark:text-gray-400;
  }

  .ranking-item.highlighted .rank {
    @apply text-primary-dark dark:text-primary-light;
  }

  .user-info {
    @apply flex items-center gap-2 flex-1 min-w-0;
  }

  .avatar {
    @apply w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center;
    border: 2px solid var(--color-border-default);
    background-color: var(--color-bg-hover);
  }

  .avatar-img {
    @apply w-full h-full object-cover;
  }

  .user-details {
    @apply flex flex-col min-w-0 flex-1;
  }

  .username {
    @apply font-semibold text-sm truncate;
  }

  .level-badge {
    @apply mt-0.5 text-xs px-2 py-0.5 text-primary-dark dark:text-primary-light rounded-full inline-block w-fit;
    background-color: rgba(var(--color-primary-rgb), 0.1);
  }

  .dark .level-badge {
    background-color: rgba(var(--color-primary-rgb), 0.15);
  }

  .metric-display {
    @apply flex flex-col items-end flex-shrink-0;
  }

  .metric-value {
    @apply text-base font-bold text-primary-dark dark:text-primary-light;
  }

  .metric-label {
    @apply text-xs text-text-muted dark:text-text-dark-muted uppercase;
  }

  .pagination-controls {
    @apply flex items-center justify-center gap-4 mt-4 py-3;
  }

  .pagination-button {
    @apply px-3 py-1.5 bg-primary-dark dark:bg-primary-light text-white dark:text-gray-900 rounded-lg font-medium transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed text-sm;
  }

  .page-info {
    @apply text-sm text-text-muted dark:text-text-dark-muted;
  }

  @media (max-width: 640px) {
    .ranking-item {
      @apply gap-2 p-2;
    }

    .rank-number {
      @apply w-8;
    }

    .rank {
      @apply text-sm;
    }

    .avatar {
      @apply w-8 h-8;
    }

    .username {
      @apply text-xs;
    }

    .metric-value {
      @apply text-sm;
    }

    .metric-label {
      @apply hidden;
    }
  }
</style>
