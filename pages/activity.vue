<template>
  <div class="container mx-auto px-4 py-8">
    <PageHeader
      :title="$t('activity.title')"
      :description="$t('activity.description')"
      icon="eye"
    />

    <div class="max-w-4xl mx-auto mt-8">
      <!-- New activities notification -->
      <transition
        enter-active-class="transition ease-out duration-300"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div
          v-if="newActivitiesCount > 0"
          class="mb-4 sticky top-4 z-10"
        >
          <button
            class="w-full bg-primary hover:bg-primary-dark text-white rounded-lg shadow-lg p-3 transition flex items-center justify-center gap-2"
            @click="loadNewActivities"
          >
            <Icon name="fa6-solid:arrow-up" aria-hidden="true" />
            <span class="font-medium">
              {{ $t('activity.new_activities', { count: newActivitiesCount }) }}
            </span>
          </button>
        </div>
      </transition>

      <!-- Auto-refresh toggle -->
      <div class="mb-4 flex justify-end">
        <button
          class="px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-2"
          :class="autoRefreshEnabled
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'activity-btn-inactive text-text-muted dark:text-text-dark-muted'"
          @click="toggleAutoRefresh"
        >
          <Icon :name="autoRefreshEnabled ? 'fa6-solid:circle-check' : 'fa6-solid:circle-pause'" aria-hidden="true" />
          <span>{{ autoRefreshEnabled ? $t('activity.auto_refresh_on') : $t('activity.auto_refresh_off') }}</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="mb-6 card-bg rounded-lg shadow-sm border activity-border p-3 md:p-4">
        <div class="space-y-3">
          <!-- Time interval selector -->
          <div class="flex items-center justify-between gap-2">
            <div class="text-xs font-medium text-text-muted dark:text-text-dark-muted">
              <Icon name="fa6-solid:clock" class="mr-1" aria-hidden="true" />
              {{ $t('activity.filters.time') }}:
            </div>
            <div class="flex flex-wrap gap-1.5 justify-end">
              <button
                v-for="interval in timeIntervals"
                :key="interval.value"
                class="px-2 md:px-3 py-1 rounded-lg text-xs transition whitespace-nowrap"
                :class="timeInterval === interval.value
                  ? 'bg-primary text-white'
                  : 'activity-btn text-text dark:text-text-dark'"
                @click="setTimeInterval(interval.value)"
              >
                {{ $t(interval.label) }}
              </button>
            </div>
          </div>

          <!-- Activity type filters grid -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="text-xs font-medium text-text-muted dark:text-text-dark-muted">
                {{ $t('activity.filters.types') }}:
              </div>
              <button
                v-if="hasActiveFilters"
                class="px-2 py-1 rounded text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 transition flex items-center gap-1"
                @click="clearFilters"
              >
                <Icon name="fa6-solid:xmark" aria-hidden="true" />
                <span class="hidden sm:inline ml-1">{{ $t('activity.filters.reset') }}</span>
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
              <button
                v-for="type in activityTypes"
                :key="type"
                class="px-2 md:px-3 py-1.5 md:py-1 rounded-lg text-xs transition flex items-center justify-center md:justify-start gap-1.5"
                :class="selectedTypes.includes(type)
                  ? 'bg-primary text-white'
                  : 'activity-btn text-text dark:text-text-dark'"
                @click="toggleActivityType(type)"
              >
                <Icon :name="getActivityIconIconify(type)" class="text-xs" aria-hidden="true" />
                <span class="text-xs">{{ $t(`activity.activity_types.${type}`) }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading && activities.length === 0" class="text-center py-12">
        <Icon name="fa6-solid:spinner" class="text-4xl text-gray-400 dark:text-gray-600" aria-hidden="true" />
        <p class="mt-4 text-text-muted dark:text-text-dark-muted">{{ $t('activity.loading') }}</p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="error"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
      >
        <Icon name="fa6-solid:triangle-exclamation" class="text-3xl text-red-500 dark:text-red-400 mb-3" aria-hidden="true" />
        <p class="text-red-700 dark:text-red-300">{{ error }}</p>
        <button
          class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          @click="loadActivities"
        >
          {{ $t('activity.retry') }}
        </button>
      </div>

      <!-- Activity feed -->
      <div v-else class="space-y-4">
        <div
          v-for="activity in activities"
          :key="`${activity.activity_type}-${activity.activity_id}`"
          class="card-bg rounded-lg shadow-sm border activity-card p-4 transition"
        >
          <div class="flex items-start gap-3">
            <!-- Activity icon -->
            <div
              class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              :class="getActivityIconBg(activity.activity_type)"
            >
              <Icon :name="getActivityIconIconify(activity.activity_type)" class="text-white" aria-hidden="true" />
            </div>

            <!-- Activity content -->
            <div class="flex-1 min-w-0">
              <!-- Activity type and time -->
              <div class="flex items-center gap-2 mb-1">
                <span class="text-sm font-semibold text-text dark:text-text-dark">
                  {{ getActivityTypeLabel(activity.activity_type) }}
                </span>
                <span class="text-xs text-text-muted dark:text-text-dark-muted">
                  {{ formatTimeAgo(activity.created_at) }}
                </span>
              </div>

              <!-- Activity details -->
              <div class="text-sm text-text-muted dark:text-text-dark-muted">
                <!-- New post -->
                <div v-if="activity.activity_type === 'new_post'">
                  <nuxt-link
                    :to="localePath(`/posts/${activity.slug}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:file-lines" class="text-xs" aria-hidden="true" />
                    <span class="italic">{{ activity.title }}</span>
                  </nuxt-link>
                  <span v-if="activity.user" class="ml-1">
                    {{ $t('activity.by') }}
                    <nuxt-link
                      :to="localePath(`/u/${activity.user.username}`)"
                      class="text-primary dark:text-primary-light hover:underline font-medium"
                    >
                      @{{ activity.user.username }}
                    </nuxt-link>
                  </span>
                  <span v-else class="ml-1 text-text-muted dark:text-text-dark-muted">
                    {{ $t('activity.by_anonymous') }}
                  </span>
                </div>

                <!-- Post vote -->
                <div v-else-if="activity.activity_type === 'post_vote'">
                  <span class="inline-flex items-center gap-1">
                    <Icon :name="activity.vote_value > 0 ? 'fa6-solid:arrow-up' : 'fa6-solid:arrow-down'" :class="activity.vote_value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" aria-hidden="true" />
                    <span :class="activity.vote_value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ activity.vote_value > 0 ? $t('activity.upvote') : $t('activity.downvote') }}
                    </span>
                    {{ $t('activity.on_post') }}
                  </span>
                  <nuxt-link
                    :to="localePath(`/posts/${activity.post_slug}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:file-lines" class="text-xs" aria-hidden="true" />
                    <span class="italic">{{ activity.post_title }}</span>
                  </nuxt-link>
                </div>

                <!-- New comment -->
                <div v-else-if="activity.activity_type === 'new_comment'">
                  <span>{{ $t('activity.comment_on') }}</span>
                  <nuxt-link
                    :to="localePath(`/posts/${activity.post_slug}${activity.comment_id ? '#comment-' + activity.comment_id : ''}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:file-lines" class="text-xs" aria-hidden="true" />
                    <span class="italic">{{ activity.post_title }}</span>
                  </nuxt-link>
                  <span v-if="activity.user" class="ml-1">
                    {{ $t('activity.by') }}
                    <nuxt-link
                      :to="localePath(`/u/${activity.user.username}`)"
                      class="text-primary dark:text-primary-light hover:underline font-medium"
                    >
                      @{{ activity.user.username }}
                    </nuxt-link>
                  </span>
                  <span v-else class="ml-1 text-text-muted dark:text-text-dark-muted">
                    {{ $t('activity.by_anonymous') }}
                  </span>
                  <div
                    v-if="activity.comment_content"
                    class="mt-1 text-xs text-text-muted dark:text-text-dark-muted italic line-clamp-2 cursor-pointer"
                    @click="$router.push(`/${locale}/posts/${activity.post_slug}${activity.comment_id ? '#comment-' + activity.comment_id : ''}`)"
                  >
                    "{{ truncateText(activity.comment_content, 100) }}"
                  </div>
                </div>

                <!-- Comment vote -->
                <div v-else-if="activity.activity_type === 'comment_vote'">
                  <span class="inline-flex items-center gap-1">
                    <Icon :name="activity.vote_value > 0 ? 'fa6-solid:arrow-up' : 'fa6-solid:arrow-down'" :class="activity.vote_value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" aria-hidden="true" />
                    <span :class="activity.vote_value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ activity.vote_value > 0 ? $t('activity.upvote') : $t('activity.downvote') }}
                    </span>
                    {{ $t('activity.on_comment') }}
                  </span>
                  {{ $t('activity.in_post') }}
                  <nuxt-link
                    :to="localePath(`/posts/${activity.post_slug}${activity.comment_id ? '#comment-' + activity.comment_id : ''}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:file-lines" class="text-xs" aria-hidden="true" />
                    <span class="italic">{{ activity.post_title }}</span>
                  </nuxt-link>
                </div>

                <!-- Seal awarded -->
                <div v-else-if="activity.activity_type === 'seal_awarded'">
                  <span>
                    {{ $t('activity.seal_awarded') }}
                    <span class="font-semibold" :class="getSealClass(activity.seal_name)">
                      {{ getSealLabel(activity.seal_name) }}
                    </span>
                  </span>
                  {{ $t('activity.in_post') }}
                  <nuxt-link
                    :to="localePath(`/posts/${activity.post_slug}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:file-lines" class="text-xs" aria-hidden="true" />
                    <span class="italic">{{ activity.post_title }}</span>
                  </nuxt-link>
                </div>

                <!-- Frontpage -->
                <div v-else-if="activity.activity_type === 'frontpage'">
                  <nuxt-link
                    :to="localePath(`/posts/${activity.slug}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:file-lines" class="text-xs" aria-hidden="true" />
                    <span class="italic">{{ activity.title }}</span>
                  </nuxt-link>
                  <span class="ml-1">{{ $t('activity.reached_frontpage') }}</span>
                </div>

                <!-- New Agora message -->
                <div v-else-if="activity.activity_type === 'new_agora_message'">
                  <span>{{ $t('activity.agora_message') }}</span>
                  <nuxt-link
                    :to="localePath(`/agora/${activity.agora_message_id}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:comments" class="text-xs" aria-hidden="true" />
                    <span>{{ $t('activity.view_in_agora') }}</span>
                  </nuxt-link>
                  <span v-if="activity.user" class="ml-1">
                    {{ $t('activity.by') }}
                    <nuxt-link
                      :to="localePath(`/u/${activity.user.username}`)"
                      class="text-primary dark:text-primary-light hover:underline font-medium"
                    >
                      @{{ activity.user.username }}
                    </nuxt-link>
                  </span>
                  <span v-else class="ml-1 text-text-muted dark:text-text-dark-muted">
                    {{ $t('activity.by_anonymous') }}
                  </span>
                  <div
                    v-if="activity.agora_message_content"
                    class="mt-1 text-xs text-text-muted dark:text-text-dark-muted italic line-clamp-2 cursor-pointer"
                    @click="$router.push(localePath(`/agora/${activity.agora_message_id}`))"
                  >
                    "{{ truncateText(activity.agora_message_content, 100) }}"
                  </div>
                </div>

                <!-- Agora vote -->
                <div v-else-if="activity.activity_type === 'agora_vote'">
                  <span class="inline-flex items-center gap-1">
                    <Icon :name="activity.vote_value > 0 ? 'fa6-solid:arrow-up' : 'fa6-solid:arrow-down'" :class="activity.vote_value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" aria-hidden="true" />
                    <span :class="activity.vote_value > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ activity.vote_value > 0 ? $t('activity.upvote') : $t('activity.downvote') }}
                    </span>
                    {{ $t('activity.on_agora_message') }}
                  </span>
                  <nuxt-link
                    :to="localePath(`/agora/${activity.agora_message_id}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:comments" class="text-xs" aria-hidden="true" />
                    <span>{{ $t('activity.view_in_agora') }}</span>
                  </nuxt-link>
                </div>

                <!-- New sub created -->
                <div v-else-if="activity.activity_type === 'new_sub'">
                  <span>{{ $t('activity.sub_created') }}</span>
                  <nuxt-link
                    :to="localePath(`/s/${activity.sub_name}`)"
                    class="font-medium text-primary dark:text-primary-light hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    <Icon name="fa6-solid:users" class="text-xs" aria-hidden="true" />
                    <span>s/{{ activity.sub_display_name || activity.sub_name }}</span>
                  </nuxt-link>
                  <span v-if="activity.user" class="ml-1">
                    {{ $t('activity.by') }}
                    <nuxt-link
                      :to="localePath(`/u/${activity.user.username}`)"
                      class="text-primary dark:text-primary-light hover:underline font-medium"
                    >
                      @{{ activity.user.username }}
                    </nuxt-link>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading more indicator -->
        <div v-if="loading && activities.length > 0" class="text-center py-4">
          <Icon name="fa6-solid:spinner" class="text-2xl text-gray-400 dark:text-gray-600" aria-hidden="true" />
        </div>

        <!-- No more activities -->
        <div v-if="!hasMore && activities.length > 0" class="text-center py-4">
          <p class="text-text-muted dark:text-text-dark-muted text-sm">
            {{ $t('activity.no_more_activities') }}
          </p>
        </div>

        <!-- No activities found -->
        <div v-if="!loading && activities.length === 0 && !error" class="text-center py-12">
          <Icon name="fa6-solid:inbox" class="text-4xl text-gray-400 dark:text-gray-600 mb-4" aria-hidden="true" />
          <p class="text-text-muted dark:text-text-dark-muted">
            {{ $t('activity.no_activities') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'
  import PageHeader from '~/components/ui/PageHeader.vue'

  const { t, locale } = useI18n()
  const localePath = useLocalePath()
  const config = useRuntimeConfig()

  const activities = ref([])
  const loading = ref(false)
  const error = ref(null)
  const offset = ref(0)
  const limit = 50
  const hasMore = ref(true)

  // Auto-refresh
  const autoRefreshInterval = ref(null)
  const autoRefreshEnabled = ref(true)
  const REFRESH_INTERVAL = 30000 // 30 seconds
  const newActivitiesCount = ref(0)

  // Filters
  const timeInterval = ref('24h') // Default: last 24 hours
  const timeIntervals = [
    { value: '1h', label: 'activity.filters.last_hour', hours: 1 },
    { value: '24h', label: 'activity.filters.last_24h', hours: 24 },
    { value: '7d', label: 'activity.filters.last_week', hours: 24 * 7 },
    { value: 'all', label: 'activity.filters.all_time', hours: null },
  ]
  const activityTypes = ['new_post', 'post_vote', 'new_comment', 'comment_vote', 'seal_awarded', 'frontpage', 'new_agora_message', 'agora_vote', 'new_sub']
  const selectedTypes = ref([])

  const hasActiveFilters = computed(() => {
    return timeInterval.value !== 'all' || selectedTypes.value.length > 0
  })

  const getActivityIconIconify = (type) => {
    const icons = {
      new_post: 'fa6-solid:file-lines',
      post_vote: 'fa6-solid:arrow-up',
      new_comment: 'fa6-solid:comment',
      comment_vote: 'fa6-solid:arrow-up',
      seal_awarded: 'fa6-solid:award',
      frontpage: 'fa6-solid:star',
      new_agora_message: 'fa6-solid:comments',
      agora_vote: 'fa6-solid:arrow-up',
      new_sub: 'fa6-solid:users',
    }
    return icons[type] || 'fa6-solid:circle'
  }

  const getActivityIconBg = (type) => {
    const colors = {
      new_post: 'bg-blue-500',
      post_vote: 'bg-green-500',
      new_comment: 'bg-purple-500',
      comment_vote: 'bg-green-500',
      seal_awarded: 'bg-yellow-500',
      frontpage: 'bg-orange-500',
      new_agora_message: 'bg-indigo-500',
      agora_vote: 'bg-teal-500',
      new_sub: 'bg-pink-500',
    }
    return colors[type] || 'bg-gray-500'
  }

  const getActivityTypeLabel = (type) => {
    return t(`activity.activity_types.${type}`)
  }

  const getSealLabel = (sealType) => {
    const labels = {
      recommended: t('activity.seals.recommended'),
      problematic: t('activity.seals.problematic'),
    }
    return labels[sealType] || sealType
  }

  const getSealClass = (sealType) => {
    const classes = {
      recommended: 'text-green-600 dark:text-green-400',
      problematic: 'text-red-600 dark:text-red-400',
    }
    return classes[sealType] || 'text-gray-600 dark:text-gray-400'
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    }

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit)
      if (interval >= 1) {
        return t(`activity.time.${unit}`, { count: interval })
      }
    }

    return t('activity.time.just_now')
  }

  const truncateText = (text, maxLength) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const setTimeInterval = (interval) => {
    timeInterval.value = interval
    resetAndLoad()
  }

  const toggleActivityType = (type) => {
    const index = selectedTypes.value.indexOf(type)
    if (index > -1) {
      selectedTypes.value.splice(index, 1)
    } else {
      selectedTypes.value.push(type)
    }
    resetAndLoad()
  }

  const clearFilters = () => {
    timeInterval.value = '24h' // Reset to default
    selectedTypes.value = []
    resetAndLoad()
  }

  const resetAndLoad = () => {
    offset.value = 0
    activities.value = []
    hasMore.value = true
    loadActivities()
  }

  const checkForNewActivities = async () => {
    if (loading.value || offset.value > 0) return // Only check on first page

    try {
      const params = {
        limit: 10, // Just check for new ones
        offset: 0,
      }

      const currentInterval = timeIntervals.find(i => i.value === timeInterval.value)
      if (currentInterval && currentInterval.hours) {
        params.since = new Date(Date.now() - currentInterval.hours * 60 * 60 * 1000).toISOString()
      }

      if (selectedTypes.value.length > 0) {
        params.types = selectedTypes.value.join(',')
      }

      const response = await $fetch(`${config.public.apiBaseUrl}/v1/activities/feed`, {
        params,
      })

      if (response.activities && response.activities.length > 0) {
        const firstCurrentId = activities.value[0]?.activity_id
        const newActivities = []

        for (const activity of response.activities) {
          if (activity.activity_id === firstCurrentId) break
          newActivities.push(activity)
        }

        if (newActivities.length > 0) {
          newActivitiesCount.value = newActivities.length
        }
      }
    } catch (err) {
      console.error('Error checking for new activities:', err)
    }
  }

  const loadNewActivities = () => {
    newActivitiesCount.value = 0
    resetAndLoad()
  }

  const loadActivities = async () => {
    if (loading.value || !hasMore.value) return

    try {
      loading.value = true
      error.value = null

      const params = {
        limit,
        offset: offset.value,
      }

      const currentInterval = timeIntervals.find(i => i.value === timeInterval.value)
      if (currentInterval && currentInterval.hours) {
        params.since = new Date(Date.now() - currentInterval.hours * 60 * 60 * 1000).toISOString()
      }

      if (selectedTypes.value.length > 0) {
        params.types = selectedTypes.value.join(',')
      }

      const response = await $fetch(`${config.public.apiBaseUrl}/v1/activities/feed`, {
        params,
      })

      if (response.activities) {
        if (offset.value === 0) {
          activities.value = response.activities
        } else {
          activities.value.push(...response.activities)
        }

        // Check if there are more activities to load
        hasMore.value = response.activities.length === limit
      }
    } catch (err) {
      console.error('Error loading activity feed:', err)
      error.value = t('activity.error_loading')
    } finally {
      loading.value = false
    }
  }

  const loadMore = () => {
    offset.value += limit
    loadActivities()
  }

  // Infinite scroll
  const handleScroll = () => {
    const scrollPosition = window.innerHeight + window.scrollY
    const pageHeight = document.documentElement.scrollHeight

    // Load more when user is 200px from bottom
    if (scrollPosition >= pageHeight - 200 && !loading.value && hasMore.value) {
      loadMore()
    }
  }

  const startAutoRefresh = () => {
    if (autoRefreshInterval.value) return

    autoRefreshInterval.value = setInterval(() => {
      if (autoRefreshEnabled.value && offset.value === 0) {
        checkForNewActivities()
      }
    }, REFRESH_INTERVAL)
  }

  const stopAutoRefresh = () => {
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
      autoRefreshInterval.value = null
    }
  }

  const toggleAutoRefresh = () => {
    autoRefreshEnabled.value = !autoRefreshEnabled.value
    if (autoRefreshEnabled.value) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  onMounted(() => {
    loadActivities()
    window.addEventListener('scroll', handleScroll)
    startAutoRefresh()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    stopAutoRefresh()
  })

  // SEO
  const route = useRoute()
  const siteUrl = config.public.siteUrl
  const pageUrl = `${siteUrl}${route.path}`
  const ogImageUrl = `${siteUrl}/logo-wolf.png`

  useSeoMeta({
    title: t('activity.title') + ' | ' + config.public.appName,
    description: t('activity.description'),
    keywords: `${config.public.appName}, fisgoneo, actividad, comunidad, tiempo real`,
    robots: 'index, follow',
    ogTitle: t('activity.title') + ' | ' + config.public.appName,
    ogDescription: t('activity.description'),
    ogImage: ogImageUrl,
    ogUrl: pageUrl,
    ogType: 'website',
    ogSiteName: config.public.appName,
    twitterCard: 'summary',
    twitterTitle: t('activity.title') + ' | ' + config.public.appName,
    twitterDescription: t('activity.description'),
    twitterImage: ogImageUrl,
    twitterSite: config.public.twitterHandle || undefined,
  })

  useCanonical()

  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': pageUrl,
          url: pageUrl,
          name: t('activity.title'),
          description: t('activity.description'),
          isPartOf: {
            '@id': `${siteUrl}/#website`,
          },
          inLanguage: 'es-ES',
        }),
        tagPosition: 'bodyClose',
      },
    ],
  })
</script>

<style scoped>
  .activity-btn-inactive {
    background-color: var(--color-bg-subtle);
  }

  .activity-border {
    border-color: var(--color-border-default);
  }

  .activity-btn {
    background-color: var(--color-bg-subtle);
  }

  .activity-btn:hover {
    background-color: var(--color-bg-hover);
  }

  .activity-card {
    border-color: var(--color-border-default);
  }

  .activity-card:hover {
    border-color: var(--color-border-subtle);
  }
</style>
