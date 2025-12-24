<template>
  <div>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <LoadingSpinner size="xl" display="centered" :show-text="true" />
    </div>

    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6"
    >
      <p>{{ $t('common.error_loading') }}: {{ error }}</p>
      <button class="text-sm underline mt-2" @click="loadStats">
        {{ $t('common.try_again') }}
      </button>
    </div>

    <div v-else class="space-y-8">
      <!-- Summary Stats Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          class="card-bg rounded-xl shadow-sm stats-card-border p-6 flex flex-col items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          <div class="text-primary dark:text-primary-light text-3xl mb-2">
            <Icon name="fa6-solid:users" aria-hidden="true" />
          </div>
          <div class="text-3xl font-bold mb-1">{{ numberFormat(generalStats.total_users) }}</div>
          <div class="text-text-muted dark:text-text-dark-muted text-sm">
            {{ $t('stats.total_users') }}
          </div>
        </div>
        <div
          class="card-bg rounded-xl shadow-sm stats-card-border p-6 flex flex-col items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          <div class="text-blue-500 dark:text-blue-400 text-3xl mb-2">
            <Icon name="fa6-solid:file-lines" aria-hidden="true" />
          </div>
          <div class="text-3xl font-bold mb-1">{{ numberFormat(generalStats.total_posts) }}</div>
          <div class="text-text-muted dark:text-text-dark-muted text-sm">
            {{ $t('stats.total_posts') }}
          </div>
        </div>
        <div
          class="card-bg rounded-xl shadow-sm stats-card-border p-6 flex flex-col items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          <div class="text-orange-500 dark:text-orange-400 text-3xl mb-2">
            <Icon name="fa6-solid:comments" aria-hidden="true" />
          </div>
          <div class="text-3xl font-bold mb-1">{{ numberFormat(generalStats.total_comments) }}</div>
          <div class="text-text-muted dark:text-text-dark-muted text-sm">
            {{ $t('stats.total_comments') }}
          </div>
        </div>
        <div
          class="card-bg rounded-xl shadow-sm stats-card-border p-6 flex flex-col items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-300"
        >
          <div class="text-green-500 dark:text-green-400 text-3xl mb-2">
            <Icon name="fa6-solid:user-check" aria-hidden="true" />
          </div>
          <div class="text-3xl font-bold mb-1">{{ numberFormat(userStats.confirmed_users) }}</div>
          <div class="text-text-muted dark:text-text-dark-muted text-sm">
            {{ $t('stats.confirmed_users') }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- General Stats Card -->
        <div
          class="card-bg rounded-lg shadow-sm stats-card-border p-6 hover:shadow-md transition-shadow duration-300"
        >
          <h3 class="text-lg font-bold text-text dark:text-text-dark inline-flex items-center mb-5"><Icon name="fa6-solid:circle-info" class="mr-2 text-primary dark:text-primary-light flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.general') }}</span></h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col bg-primary/5 dark:bg-primary/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.total_users')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(generalStats.total_users)
              }}</span>
            </div>
            <div class="flex flex-col bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.active_today')
              }}</span>
              <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{
                numberFormat(generalStats.active_users_today)
              }}</span>
            </div>
            <div class="flex flex-col bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.total_posts')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(generalStats.total_posts)
              }}</span>
            </div>
            <div class="flex flex-col bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.posts_today')
              }}</span>
              <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{
                numberFormat(generalStats.posts_today)
              }}</span>
            </div>
            <div class="flex flex-col bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.total_comments')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(generalStats.total_comments)
              }}</span>
            </div>
            <div class="flex flex-col bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.comments_today')
              }}</span>
              <span class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{
                numberFormat(generalStats.comments_today)
              }}</span>
            </div>
          </div>

          <div
            v-if="generalStats.timestamp"
            class="mt-4 pt-3 stats-border-top flex items-center justify-between text-xs text-text-muted dark:text-text-dark-muted"
          >
            <span class="inline-flex items-center"><Icon name="fa6-solid:clock" class="mr-1.5 flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.last_updated') }}: {{ formatDateTime(generalStats.timestamp) }}</span></span>
            <button class="text-primary dark:text-primary-light hover:underline inline-flex items-center" :aria-label="$t('common.refresh')" @click="loadStats">
              <Icon name="fa6-solid:rotate" class="mr-1 flex-shrink-0" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Content Stats Card -->
        <div
          class="card-bg rounded-lg shadow-sm stats-card-border p-6 hover:shadow-md transition-shadow duration-300"
        >
          <h3 class="text-lg font-bold mb-5 text-text dark:text-text-dark inline-flex items-center"><Icon name="fa6-solid:file-lines" class="mr-2 text-primary dark:text-primary-light flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.content') }}</span></h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.published_posts')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(contentStats.published_posts)
              }}</span>
            </div>
            <div class="flex flex-col stats-subtle-bg rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.pending_posts')
              }}</span>
              <span class="text-2xl font-bold text-text-muted dark:text-text-dark-muted">{{
                numberFormat(contentStats.pending_posts)
              }}</span>
            </div>
            <div class="flex flex-col bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.last_24h')
              }}</span>
              <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{
                numberFormat(contentStats.posts_last_24h)
              }}</span>
            </div>
            <div class="flex flex-col bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.last_7d')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(contentStats.posts_last_7d)
              }}</span>
            </div>
          </div>
        </div>

        <!-- User Stats Card -->
        <div
          class="card-bg rounded-lg shadow-sm stats-card-border p-6 hover:shadow-md transition-shadow duration-300"
        >
          <h3 class="text-lg font-bold mb-5 text-text dark:text-text-dark inline-flex items-center"><Icon name="fa6-solid:users" class="mr-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.users') }}</span></h3>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="flex flex-col bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.new_today')
              }}</span>
              <span class="text-2xl font-bold text-green-600 dark:text-green-400">{{
                numberFormat(userStats.new_users_today)
              }}</span>
            </div>
            <div class="flex flex-col bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.new_week')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(userStats.new_users_week)
              }}</span>
            </div>
            <div class="flex flex-col bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.confirmed_users')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(userStats.confirmed_users)
              }}</span>
            </div>
            <div class="flex flex-col bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.confirmation_rate')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{ userStats.confirmation_rate }}%</span>
            </div>
          </div>

          <!-- Desglose de usuarios confirmados -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="flex flex-col bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2 text-center">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.verified_email')
              }}</span>
              <span class="text-lg font-bold text-blue-600 dark:text-blue-400">{{
                numberFormat(userStats.verified_users)
              }}</span>
            </div>
            <div class="flex flex-col bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2 text-center">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.federated_users')
              }}</span>
              <span class="text-lg font-bold text-purple-600 dark:text-purple-400">{{
                numberFormat(userStats.federated_users)
              }}</span>
            </div>
            <div class="flex flex-col bg-sky-50 dark:bg-sky-900/10 rounded-lg p-2 text-center">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.telegram_users')
              }}</span>
              <span class="text-lg font-bold text-sky-600 dark:text-sky-400">{{
                numberFormat(userStats.telegram_users)
              }}</span>
            </div>
          </div>

          <div class="stats-border-top pt-4 mt-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-text dark:text-text-dark inline-flex items-center"><Icon name="fa6-solid:trophy" class="mr-2 text-orange-500 dark:text-orange-400 flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.top_users') }}</span></h4>
              <NuxtLink
                :to="localePath('/rankings')"
                class="text-xs text-primary dark:text-primary-light hover:underline flex items-center"
              >
                {{ $t('common.view_all') }}
                <Icon name="fa6-solid:chevron-right" class="ml-1 text-xs" aria-hidden="true" />
              </NuxtLink>
            </div>

            <div class="space-y-2">
              <div
                v-for="(user, index) in userStats.top_karma_users?.slice(0, 5)"
                :key="user.id"
                class="flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:shadow-md"
                :class="{
                  'border-2 border-yellow-400 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10': index === 0,
                  'border-2 border-gray-300 dark:border-gray-400 bg-gray-50/50 dark:bg-gray-900/10': index === 1,
                  'border-2 border-orange-400 dark:border-orange-500 bg-orange-50/50 dark:bg-orange-900/10': index === 2,
                  'stats-card-border card-bg': index > 2
                }"
              >
                <div class="flex-shrink-0 w-8 text-center">
                  <Icon v-if="index === 0" name="fa6-solid:crown" class="text-yellow-500" aria-hidden="true" />
                  <Icon v-else-if="index === 1" name="fa6-solid:medal" class="text-gray-400" aria-hidden="true" />
                  <Icon v-else-if="index === 2" name="fa6-solid:medal" class="text-orange-500" aria-hidden="true" />
                  <span v-else class="text-sm font-bold text-gray-500 dark:text-gray-400">#{{ index + 1 }}</span>
                </div>

                <NuxtLink
                  :to="localePath(`/u/${user.username}`)"
                  class="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div class="w-8 h-8 rounded-full overflow-hidden stats-avatar-border flex-shrink-0 stats-avatar-bg flex items-center justify-center">
                    <Icon name="fa6-solid:user" class="text-gray-400 text-sm" aria-hidden="true" />
                  </div>
                  <span class="font-semibold text-sm truncate">
                    {{ user.display_name || user.username }}
                  </span>
                </NuxtLink>

                <div class="flex flex-col items-end flex-shrink-0">
                  <span class="text-sm font-bold text-primary dark:text-primary-light">
                    {{ numberFormat(user.karma_points) }}
                  </span>
                  <span class="text-xs text-text-muted dark:text-text-dark-muted uppercase">
                    karma
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Engagement Stats Card -->
        <div
          class="card-bg rounded-lg shadow-sm stats-card-border p-6 hover:shadow-md transition-shadow duration-300"
        >
          <h3 class="text-lg font-bold mb-5 text-text dark:text-text-dark inline-flex items-center"><Icon name="fa6-solid:chart-bar" class="mr-2 text-orange-500 dark:text-orange-400 flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.engagement') }}</span></h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.comments_24h')
              }}</span>
              <span class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{
                numberFormat(engagementStats.comments_last_24h)
              }}</span>
            </div>
            <div class="flex flex-col bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.votes_24h')
              }}</span>
              <span class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{
                numberFormat(engagementStats.votes_last_24h)
              }}</span>
            </div>
            <div class="flex flex-col bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.comments_week')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(engagementStats.comments_last_7d)
              }}</span>
            </div>
            <div class="flex flex-col bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3">
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1">{{
                $t('stats.votes_week')
              }}</span>
              <span class="text-2xl font-bold text-text dark:text-text-dark">{{
                numberFormat(engagementStats.votes_last_7d)
              }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-4 pt-4 stats-border-top">
            <div
              class="flex flex-col items-center bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3"
            >
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1 text-center">{{
                $t('stats.avg_comments_post')
              }}</span>
              <span class="text-3xl font-bold text-text dark:text-text-dark">{{
                engagementStats.avg_comments_per_post
              }}</span>
            </div>
            <div
              class="flex flex-col items-center bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3"
            >
              <span class="text-text-muted dark:text-text-dark-muted text-xs mb-1 text-center">{{
                $t('stats.avg_votes_post')
              }}</span>
              <span class="text-3xl font-bold text-text dark:text-text-dark">{{ engagementStats.avg_votes_per_post }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Language Distribution Section -->
      <div class="mt-8">
        <h2 class="inline-flex items-center text-2xl font-bold mb-6 text-text dark:text-text-dark"><Icon name="fa6-solid:language" class="mr-2 flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.language_distribution') }}</span></h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Language Chart Card -->
          <div
            class="md:col-span-2 card-bg rounded-lg shadow-sm stats-card-border p-5"
          >
            <h3 class="inline-flex items-center text-lg font-bold mb-4 text-text dark:text-text-dark"><Icon name="fa6-solid:chart-pie" class="mr-2 flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.articles_by_language') }}</span></h3>

            <div class="h-80 relative">
              <canvas v-if="!chartError" ref="languageChartRef"/>
              <div
                v-else
                class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400"
              >
                <div class="text-center">
                  <Icon name="fa6-solid:chart-pie" class="text-4xl mb-2" aria-hidden="true" />
                  <p>No hay datos disponibles para mostrar</p>
                </div>
              </div>
            </div>

            <div
              v-if="contentStats.timestamp"
              class="mt-4 text-xs text-text-muted dark:text-text-dark-muted text-right"
            >
              {{ $t('stats.last_updated') }}: {{ formatDateTime(contentStats.timestamp) }}
            </div>
          </div>

          <!-- Language Stats Table Card -->
          <div
            class="card-bg rounded-lg shadow-sm stats-card-border p-5"
          >
            <h3 class="inline-flex items-center text-lg font-bold mb-4 text-text dark:text-text-dark"><Icon name="fa6-solid:list" class="mr-2 flex-shrink-0" aria-hidden="true" /> <span>{{ $t('stats.language_breakdown') }}</span></h3>

            <div class="overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="stats-border-bottom">
                    <th class="px-2 py-3 text-left">{{ $t('stats.language') }}</th>
                    <th class="px-2 py-3 text-right">{{ $t('stats.articles') }}</th>
                    <th class="px-2 py-3 text-right">{{ $t('stats.percentage') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="lang in languageStats"
                    :key="lang.code"
                    class="stats-table-row-border stats-table-row-hover"
                  >
                    <td class="px-2 py-2">
                      <div class="flex items-center">
                        <div
                          class="w-3 h-3 rounded-full mr-2"
                          :style="{ backgroundColor: lang.color }"
                        />
                        <span class="mr-1">{{ getLanguageFlag(lang.code) }}</span>
                        {{ getLanguageName(lang.code) }}
                      </div>
                    </td>
                    <td class="px-2 py-2 text-right">{{ numberFormat(lang.count) }}</td>
                    <td class="px-2 py-2 text-right">{{ lang.percentage }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, watch, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useLocalePath } from '#i18n'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'

  const { t } = useI18n()
  const localePath = useLocalePath()
  const { $api } = useNuxtApp()

  // Chart reference and state
  const languageChartRef = ref(null)
  let languageChart = null
  const chartError = ref(false)

  const loading = ref(true)
  const error = ref(null)
  const generalStats = ref({})
  const contentStats = ref({})
  const userStats = ref({})
  const engagementStats = ref({})

  const languageStats = computed(() => {
    if (!contentStats.value.posts_by_language || !Array.isArray(contentStats.value.posts_by_language)) return []

    const totalPosts = contentStats.value.posts_by_language.reduce(
      (sum, lang) => sum + lang.count,
      0
    )

    // Predefined colors for specific languages to ensure they're distinct
    const languageColors = {
      en: 'hsl(210, 70%, 60%)', // Blue for English
      es: 'hsl(0, 70%, 60%)', // Red for Spanish
    }

    return contentStats.value.posts_by_language.map((lang) => {
      let color

      // Use predefined colors for specific languages
      if (languageColors[lang.language_code]) {
        color = languageColors[lang.language_code]
      } else {
        // For other languages, use the hash-based approach
        const hashCode = Array.from(lang.language_code).reduce(
          (hash, char) => char.charCodeAt(0) + ((hash << 5) - hash),
          0
        )
        const hue = Math.abs(hashCode % 360)
        color = `hsl(${hue}, 70%, 60%)`
      }

      return {
        code: lang.language_code,
        count: lang.count,
        percentage: totalPosts > 0 ? ((lang.count / totalPosts) * 100).toFixed(1) : 0,
        color: color,
      }
    })
  })

  const languages = {
    en: { name: 'English', flag: '🇬🇧' },
    es: { name: 'Spanish', flag: '🇪🇸' },
    fr: { name: 'French', flag: '🇫🇷' },
    de: { name: 'German', flag: '🇩🇪' },
    it: { name: 'Italian', flag: '🇮🇹' },
    pt: { name: 'Portuguese', flag: '🇵🇹' },
    ru: { name: 'Russian', flag: '🇷🇺' },
    ar: { name: 'Arabic', flag: '🇸🇦' },
    ja: { name: 'Japanese', flag: '🇯🇵' },
    zh: { name: 'Chinese', flag: '🇨🇳' },
    nl: { name: 'Dutch', flag: '🇳🇱' },
    pl: { name: 'Polish', flag: '🇵🇱' },
    tr: { name: 'Turkish', flag: '🇹🇷' },
    sv: { name: 'Swedish', flag: '🇸🇪' },
    da: { name: 'Danish', flag: '🇩🇰' },
    fi: { name: 'Finnish', flag: '🇫🇮' },
    ko: { name: 'Korean', flag: '🇰🇷' },
    cs: { name: 'Czech', flag: '🇨🇿' },
    hu: { name: 'Hungarian', flag: '🇭🇺' },
    no: { name: 'Norwegian', flag: '🇳🇴' },
  }

  function getLanguageName(code) {
    return languages[code]?.name || code
  }

  function getLanguageFlag(code) {
    return languages[code]?.flag || ''
  }

  async function createLanguageChart() {
    if (!languageChartRef.value || languageStats.value.length === 0) {
      chartError.value = true
      return
    }

    try {
      // Import Chart.js dynamically
      const { Chart, registerables } = await import('chart.js')
      Chart.register(...registerables)

      if (languageChart) {
        languageChart.destroy()
      }

      const ctx = languageChartRef.value.getContext('2d')

      const labels = languageStats.value.map(
        (lang) => `${getLanguageFlag(lang.code)} ${getLanguageName(lang.code)}`
      )
      const data = languageStats.value.map((lang) => lang.count)
      const colors = languageStats.value.map((lang) => lang.color)

      languageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: colors,
              borderColor: 'rgba(255, 255, 255, 0.8)',
              borderWidth: 2,
              hoverOffset: 15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                usePointStyle: true,
                boxWidth: 10,
                color: document.querySelector('html').classList.contains('dark')
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(0, 0, 0, 0.7)',
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || ''
                  const value = context.raw || 0
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${label}: ${value} (${percentage}%)`
                },
              },
            },
          },
        },
      })

      chartError.value = false
    } catch (err) {
      console.error('Error creating chart:', err)
      chartError.value = true
    }
  }

  watch(
    languageStats,
    () => {
      if (languageStats.value.length > 0 && !loading.value) {
        nextTick(() => {
          createLanguageChart()
        })
      }
    },
    { deep: true }
  )

  onMounted(() => {
    loadStats()

    const observer = new MutationObserver(() => {
      if (languageChart) {
        languageChart.options.plugins.legend.labels.color = document
          .querySelector('html')
          .classList.contains('dark')
          ? 'rgba(255, 255, 255, 0.8)'
          : 'rgba(0, 0, 0, 0.7)'
        languageChart.update()
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  async function loadStats() {
    loading.value = true
    error.value = null

    try {
      // Use test data if $api is not available
      if (!$api || !$api.stats) {
        // Test data
        generalStats.value = {
          total_users: 1250,
          active_users_today: 89,
          total_posts: 3420,
          posts_today: 23,
          total_comments: 8750,
          comments_today: 156,
          timestamp: new Date().toISOString(),
        }

        contentStats.value = {
          published_posts: 3420,
          pending_posts: 12,
          posts_last_24h: 23,
          posts_last_7d: 178,
          popular_tags: [
            { id: 1, name: 'Vue.js', posts_count: 234 },
            { id: 2, name: 'JavaScript', posts_count: 189 },
            { id: 3, name: 'Nuxt', posts_count: 156 },
            { id: 4, name: 'CSS', posts_count: 98 },
          ],
          posts_by_language: [
            { language_code: 'es', count: 1800 },
            { language_code: 'en', count: 1200 },
            { language_code: 'fr', count: 300 },
            { language_code: 'de', count: 120 },
          ],
          timestamp: new Date().toISOString(),
        }

        userStats.value = {
          verified_users: 890,
          federated_users: 45,
          telegram_users: 32,
          confirmed_users: 967,
          new_users_today: 12,
          new_users_week: 89,
          verification_rate: 71.2,
          confirmation_rate: 77.4,
          top_karma_users: [
            { id: 1, username: 'usuario1', display_name: 'Usuario Uno', karma_points: 2500 },
            { id: 2, username: 'usuario2', display_name: 'Usuario Dos', karma_points: 2100 },
            { id: 3, username: 'usuario3', display_name: 'Usuario Tres', karma_points: 1890 },
          ],
          timestamp: new Date().toISOString(),
        }

        engagementStats.value = {
          comments_last_24h: 156,
          votes_last_24h: 423,
          comments_last_7d: 1240,
          votes_last_7d: 3560,
          avg_comments_per_post: 2.6,
          avg_votes_per_post: 8.3,
          timestamp: new Date().toISOString(),
        }
      } else {
        // API real
        try {
          const [generalResponse, contentResponse, userResponse, engagementResponse] =
            await Promise.all([
              $api.stats.getGeneral(),
              $api.stats.getContent(),
              $api.stats.getUsers(),
              $api.stats.getEngagement(),
            ])


          // Extract data from responses, ensuring we handle the correct structure
          // The API returns data directly in the response.data object, not nested under a data property
          generalStats.value = generalResponse.data || {}
          contentStats.value = contentResponse.data || {}
          userStats.value = userResponse.data || {}
          engagementStats.value = engagementResponse.data || {}

          // Ensure we have default values for critical fields
          if (!generalStats.value.total_users) generalStats.value.total_users = 0
          if (!generalStats.value.total_posts) generalStats.value.total_posts = 0
          if (!generalStats.value.total_comments) generalStats.value.total_comments = 0
          if (!contentStats.value.published_posts) contentStats.value.published_posts = 0
          if (!userStats.value.verified_users) userStats.value.verified_users = 0
          if (!userStats.value.confirmed_users) userStats.value.confirmed_users = 0
          if (!userStats.value.federated_users) userStats.value.federated_users = 0
          if (!userStats.value.telegram_users) userStats.value.telegram_users = 0
          if (!userStats.value.confirmation_rate) userStats.value.confirmation_rate = 0
        } catch (apiError) {
          console.error('API error:', apiError)
          error.value = t('common.error_loading')
        }
      }

      setTimeout(() => {
        if (languageStats.value.length > 0) {
          createLanguageChart()
        }
      }, 100)
    } catch (err) {
      console.error('Error fetching statistics:', err)
      error.value = t('common.network_error')
    } finally {
      loading.value = false
    }
  }

  function numberFormat(number) {
    if (number === undefined || number === null) return '0'

    if (number >= 1000000000) {
      return (number / 1000000000).toFixed(1) + 'B'
    }
    if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M'
    }
    if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'k'
    }
    return number.toString()
  }

  function formatDateTime(isoDate) {
    if (!isoDate) return ''
    try {
      const date = new Date(isoDate)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
      return isoDate
    }
  }
</script>

<style scoped>
  .stats-card-border {
    border: 1px solid var(--color-border-default);
  }

  .stats-border-top {
    border-top: 1px solid var(--color-border-default);
  }

  .stats-border-bottom {
    border-bottom: 1px solid var(--color-border-default);
  }

  .stats-subtle-bg {
    background-color: var(--color-bg-subtle);
  }

  .stats-table-row-border {
    border-bottom: 1px solid var(--color-border-subtle);
  }

  .stats-table-row-hover:hover {
    background-color: var(--color-bg-hover);
  }

  .stats-avatar-border {
    border: 2px solid var(--color-border-default);
  }

  .stats-avatar-bg {
    background-color: var(--color-bg-subtle);
  }

  .spinner {
    border: 3px solid var(--color-border-default);
    border-radius: 50%;
    border-top: 3px solid var(--color-primary);
    width: 30px;
    height: 30px;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .spinner {
    border-top-color: var(--color-primary);
  }

  .bg-white,
  .dark\:bg-card-dark {
    transition: all 0.3s ease;
  }

  .bg-white:hover,
  .dark\:bg-card-dark:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  .dark .bg-card-dark:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  }

  tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
  }

  .dark tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
  }

  @keyframes countUp {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .text-3xl {
    animation: countUp 0.6s ease-out forwards;
  }

  .grid-cols-4 > div:nth-child(1) .text-3xl {
    animation-delay: 0.1s;
  }
  .grid-cols-4 > div:nth-child(2) .text-3xl {
    animation-delay: 0.2s;
  }
  .grid-cols-4 > div:nth-child(3) .text-3xl {
    animation-delay: 0.3s;
  }
  .grid-cols-4 > div:nth-child(4) .text-3xl {
    animation-delay: 0.4s;
  }
</style>
