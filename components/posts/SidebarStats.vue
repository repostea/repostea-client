<template>
  <div
    class="sidebar-stats-container p-4 rounded-lg shadow-sm"
  >
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-lg font-semibold text-text dark:text-text-dark flex items-center">
        <Icon name="fa6-solid:chart-bar" class="mr-2 text-primary dark:text-primary-light" aria-hidden="true" />
        <span class="truncate">{{ t('stats.platform_stats') }}</span>
      </h4>
      <NuxtLink
        :to="localePath('/stats')"
        class="inline-flex items-center text-xs px-2 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light rounded hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors flex-shrink-0"
      ><Icon name="fa6-solid:chart-line" class="mr-1 flex-shrink-0" aria-hidden="true" /> <span>{{ t('common.view_all') }}</span></NuxtLink>
    </div>

    <div v-if="loading" class="flex items-center justify-center p-6 text-gray-500">
      <div
        class="w-5 h-5 border-2 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mr-2"
      />
      <span class="text-sm">{{ t('stats.loading', 'Loading...') }}</span>
    </div>

    <div v-else-if="error" class="text-red-500 p-3 text-sm bg-red-50 dark:bg-red-900/20 rounded-md">
      <Icon name="fa6-solid:circle-exclamation" class="mr-2" aria-hidden="true" />
      <span class="break-words">{{ error }}</span>
    </div>

    <div v-else-if="processedStats" class="space-y-4">
      <!-- Primary Stats - With Subtle Colors -->
      <div class="grid grid-cols-1 gap-3">
        <div
          v-for="stat in processedStats.primary"
          :key="stat.key"
          :class="getStatBgClass(stat.key)"
          class="flex items-center justify-between p-3 rounded-lg"
        >
          <div class="flex items-center min-w-0 flex-1">
            <div class="flex-shrink-0 mr-3">
              <Icon :name="stat.icon" class="text-lg" :style="`color: ${getStatIconColor(stat.key)}`" aria-hidden="true" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs text-text-muted dark:text-text-dark-muted truncate">
                {{ stat.label }}
              </div>
              <div class="text-lg font-bold text-text dark:text-text-dark">
                {{ stat.formattedValue }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Daily Activity Section - With Subtle Colors -->
      <div
        v-if="processedStats.daily.length > 0"
        class="bg-green-50/50 dark:bg-green-900/5 p-3 rounded-lg border border-green-100 dark:border-green-900/20"
      >
        <h5
          class="text-xs font-medium uppercase text-text-muted dark:text-text-dark-muted mb-3 flex items-center"
        >
          <Icon name="fa6-solid:calendar-day" class="mr-2 text-green-500 dark:text-green-400" aria-hidden="true" />
          <span class="truncate">{{ t('stats.last_24h', 'Últimas 24h') }}</span>
        </h5>
        <div class="space-y-2">
          <div
            v-for="stat in processedStats.daily"
            :key="stat.key"
            class="flex justify-between items-center text-sm py-1"
          >
            <span class="text-text dark:text-text-dark flex items-center min-w-0 flex-1">
              <Icon :name="stat.icon" class="mr-2 flex-shrink-0" :style="`color: ${getStatIconColor(stat.key)}`" aria-hidden="true" />
              <span class="truncate">{{ stat.label }}</span>
            </span>
            <span
              :class="getDailyValueClass(stat.key)"
              class="font-medium px-2 py-1 rounded ml-2 flex-shrink-0"
            >
              {{ stat.formattedValue }}
            </span>
          </div>
        </div>
      </div>

      <!-- Language Distribution -->
      <div
        v-if="processedStats.languages.length > 0"
        class="sidebar-stats-languages p-3 rounded-lg"
      >
        <h5
          class="text-xs font-medium uppercase text-gray-600 dark:text-gray-400 mb-3 flex items-center"
        >
          <Icon name="fa6-solid:globe" class="mr-2" aria-hidden="true" />
          <span class="truncate">{{ t('stats.posts_by_language', 'Por idioma') }}</span>
        </h5>
        <div class="space-y-2">
          <div
            v-for="lang in processedStats.languages"
            :key="lang.code"
            class="flex justify-between items-center text-sm"
          >
            <span class="text-gray-700 dark:text-gray-300 flex items-center min-w-0 flex-1">
              <span
                class="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                :style="{ backgroundColor: lang.color }"
              />
              <span class="truncate">{{ lang.name }}</span>
            </span>
            <span class="font-medium text-gray-900 dark:text-gray-100 text-xs ml-2 flex-shrink-0">
              {{ lang.formattedCount }}
            </span>
          </div>
        </div>
      </div>

      <!-- Additional Stats - Simplified -->
      <div
        v-if="processedStats.other.length > 0"
        class="sidebar-stats-other p-3 rounded-lg"
      >
        <h5
          class="text-xs font-medium uppercase text-text-muted dark:text-text-dark-muted mb-3 flex items-center"
        >
          <Icon name="fa6-solid:circle-info" class="mr-2 text-gray-400" aria-hidden="true" />
          <span class="truncate">{{ t('stats.general', 'General') }}</span>
        </h5>
        <div class="space-y-2">
          <div
            v-for="stat in processedStats.other"
            :key="stat.key"
            class="flex justify-between items-center text-sm py-1"
          >
            <span class="text-text dark:text-text-dark min-w-0 flex-1 truncate">{{
              stat.label
            }}</span>
            <span
              class="font-medium text-text dark:text-text-dark px-2 py-1 ml-2 flex-shrink-0"
            >
              {{ stat.formattedValue }}
            </span>
          </div>
        </div>
      </div>

      <!-- Last updated timestamp -->
      <div
        class="sidebar-stats-footer text-xs text-text-muted dark:text-text-dark-muted text-center pt-3 flex items-center justify-center"
      >
        <Icon name="fa6-solid:clock" class="mr-1.5" aria-hidden="true" />
        <span>{{ t('stats.last_updated', 'Actualizado') }}: {{ lastUpdated }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { onMounted, ref, computed } from 'vue'
  import { useNuxtApp } from '#app'
  import { useI18n, useLocalePath  } from '#i18n'
  

  defineProps({
    tags: {
      type: Array,
      default: () => [],
    },
  })

  const stats = ref(null)
  const error = ref(null)
  const loading = ref(true)
  const { $api } = useNuxtApp()
  const { t } = useI18n()
  const localePath = useLocalePath()

  // Safe number formatting
  const formatNumber = (num) => {
    const number = Number(num)
    if (isNaN(number)) return '0'
    return new Intl.NumberFormat().format(number)
  }

  // Get nice labels for stats keys using i18n with fallbacks
  const getStatLabel = (key) => {
    // Try i18n first, then fallback to formatted key
    return (
      t(`stats.${key}`, '') ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    )
  }

  // Get appropriate icon for each stat
  const getStatIcon = (key) => {
    const icons = {
      total_users: 'fa6-solid:users',
      total_posts: 'fa6-solid:file-lines',
      total_comments: 'fa6-solid:comments',
      total_votes: 'fa6-solid:thumbs-up',
      active_users: 'fa6-solid:user-clock',
      posts_today: 'fa6-solid:calendar-day',
      comments_today: 'fa6-solid:comment',
    }
    return icons[key] || 'fa6-solid:chart-bar'
  }

  // Get background class for each stat (subtle colors)
  const getStatBgClass = (key) => {
    const bgClasses = {
      total_users: 'bg-primary/10 dark:bg-primary/10',
      total_posts: 'bg-blue-50 dark:bg-blue-900/10',
      total_comments: 'bg-orange-50 dark:bg-orange-900/10',
    }
    return bgClasses[key] || 'sidebar-stat-default-bg'
  }

  // Get icon color for each stat
  const getStatIconColor = (key) => {
    // Use CSS variables instead of checking dark mode to avoid SSR mismatch
    const colors = {
      total_users: 'var(--color-primary)',
      total_posts: 'rgb(59, 130, 246)', // blue-500
      total_comments: 'rgb(249, 115, 22)', // orange-500
      active_users: 'rgb(34, 197, 94)', // green-500
      posts_today: 'rgb(59, 130, 246)',
      comments_today: 'rgb(249, 115, 22)',
    }
    return colors[key] || 'rgb(107, 114, 128)' // gray-500
  }

  // Get value class for daily stats
  const getDailyValueClass = (key) => {
    const classes = {
      posts_today: 'text-blue-600 dark:text-blue-400',
      comments_today: 'text-orange-600 dark:text-orange-400',
      active_users: 'text-green-600 dark:text-green-400',
    }
    return classes[key] || 'text-text dark:text-text-dark'
  }


  // Process and organize all stats data
  const processedStats = computed(() => {
    // Only show stats if we have real data from API
    if (!stats.value || Object.keys(stats.value).length === 0) {
      return null
    }

    // Use ONLY real data from API
    const displayStats = stats.value

    // Primary stats - simplified
    const primaryKeys = ['total_posts', 'total_comments', 'total_users']
    const primary = primaryKeys
      .filter((key) => displayStats[key] !== undefined)
      .map((key) => {
        return {
          key,
          label: getStatLabel(key),
          formattedValue: formatNumber(displayStats[key]),
          icon: getStatIcon(key),
        }
      })

    // Daily stats - simplified
    const dailyKeys = ['posts_today', 'comments_today', 'active_users']
    const daily = dailyKeys
      .filter((key) => displayStats[key] !== undefined)
      .map((key) => {
        return {
          key,
          label: getStatLabel(key),
          formattedValue: formatNumber(displayStats[key]),
          icon: getStatIcon(key),
        }
      })

    // Language distribution
    const languageColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    const languages = displayStats.posts_by_language
      ? Object.entries(displayStats.posts_by_language)
          .map(([code, count], index) => ({
            code,
            name: code.toUpperCase(),
            count: Number(count) || 0,
            formattedCount: formatNumber(Number(count) || 0),
            color: languageColors[index % languageColors.length],
          }))
          .filter((lang) => lang.count > 0)
      : []

    // Tags processing removed
    const tags = []

    // Other stats
    const excludeKeys = [...primaryKeys, ...dailyKeys, 'posts_by_language']
    const other = Object.keys(displayStats)
      .filter((key) => !excludeKeys.includes(key) && typeof displayStats[key] === 'number')
      .map((key) => ({
        key,
        label: getStatLabel(key),
        formattedValue: formatNumber(displayStats[key]),
      }))

    return {
      primary,
      daily,
      languages,
      tags,
      other,
    }
  })

  const lastUpdated = computed(() => {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  })

  onMounted(() => {

    // Start with empty stats (component hidden until data loads)
    stats.value = {}
    loading.value = false

    // Fetch real data in background without blocking
    setTimeout(async () => {
      try {
        const response = await $api.stats?.getStats()

        if (response?.data && Object.keys(response.data).length > 0) {
          stats.value = response.data
        }
      } catch (err) {
        console.error('[SidebarStats] Error loading stats:', err)
      }
    }, 100) // Small delay to not compete with critical resources
  })
</script>

<style scoped>
  .sidebar-stats-container {
    background-color: var(--color-card-bg);
    border: 1px solid var(--color-border-default);
  }

  .dark .sidebar-stats-container {
    background-color: var(--color-card-bg-dark);
  }

  .sidebar-stats-other {
    background-color: var(--color-bg-hover);
  }

  .sidebar-stats-footer {
    border-top: 1px solid var(--color-border-default);
  }

  .sidebar-stat-default-bg {
    background-color: var(--color-bg-subtle);
  }

  .sidebar-stats-languages {
    background-color: var(--color-bg-subtle);
  }
</style>
