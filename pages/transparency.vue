<template>
  <div class="container mx-auto px-4 py-8">
    <PageHeader
      :title="$t('transparency.title')"
      :description="$t('transparency.description')"
      icon="chart-line"
    />

    <div class="max-w-4xl mx-auto mt-8 space-y-8">
      <!-- Estadísticas generales -->
      <div
        class="card-bg rounded-lg shadow-sm border transparency-border p-6"
      >
        <h2 class="text-2xl font-bold mb-4 text-text dark:text-text-dark">
          <Icon name="fa6-solid:chart-bar" class="mr-2 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          {{ $t('transparency.stats.title') }}
        </h2>
        <div class="grid md:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-text dark:text-text-dark mb-2">{{ formatNumber(stats.posts) }}</div>
            <div class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('transparency.stats.posts') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-text dark:text-text-dark mb-2">
              {{ formatNumber(stats.users) }}
            </div>
            <div class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('transparency.stats.users') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-text dark:text-text-dark mb-2">
              {{ formatNumber(stats.comments) }}
            </div>
            <div class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('transparency.stats.comments') }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-text dark:text-text-dark mb-2">
              {{ formatNumber(stats.aggregated_sources) }}
            </div>
            <div class="text-sm text-text-muted dark:text-text-dark-muted">
              {{ $t('transparency.stats.sources') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Moderación -->
      <div
        class="card-bg rounded-lg shadow-sm border transparency-border p-6"
      >
        <h2 class="text-2xl font-bold mb-4 text-text dark:text-text-dark">
          <Icon name="fa6-solid:shield-halved" class="mr-2 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          {{ $t('transparency.moderation.title') }}
        </h2>
        <div class="grid md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4 text-text dark:text-text-dark">
              {{ $t('transparency.moderation.reports.title') }}
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.reports.received')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{ moderation.reports.total }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.reports.processed')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{ moderation.reports.processed }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.reports.pending')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{ moderation.reports.pending }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.reports.avg_response')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{ moderation.avg_response_hours }}h</span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-semibold mb-4 text-text dark:text-text-dark">
              {{ $t('transparency.moderation.actions.title') }}
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.actions.content_removed')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{ moderation.actions.removed }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.actions.warnings')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{ moderation.actions.warnings }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.actions.users_suspended')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{
                  moderation.actions.suspended
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-text-muted dark:text-text-dark-muted">{{
                  $t('transparency.moderation.actions.appeals')
                }}</span>
                <span class="font-semibold text-text dark:text-text-dark">{{ moderation.actions.appeals }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tipos de reportes -->
      <div
        class="card-bg rounded-lg shadow-sm border transparency-border p-6"
      >
        <h2 class="text-2xl font-bold mb-4 text-text dark:text-text-dark">
          <Icon name="fa6-solid:flag" class="mr-2 text-gray-600 dark:text-gray-400" aria-hidden="true" />
          {{ $t('transparency.report_types.title') }}
        </h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="report in reportTypes"
            :key="report.type"
            class="transparency-item p-4 rounded-lg"
          >
            <div class="flex items-center mb-2">
              <Icon :name="report.icon" class="mr-2 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              <span class="font-semibold text-text dark:text-text-dark">{{
                $t(`transparency.report_types.${report.type}`)
              }}</span>
            </div>
            <div class="text-2xl font-bold text-text dark:text-text-dark">{{ report.count }}</div>
            <div class="text-xs text-text-muted dark:text-text-dark-muted">
              {{ $t('transparency.report_types.last_30_days') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import PageHeader from '~/components/ui/PageHeader.vue'

  const { t, locale } = useI18n()
  const config = useRuntimeConfig()

  // Initialize with default values
  const stats = ref({
    posts: 0,
    users: 0,
    comments: 0,
    aggregated_sources: 0,
  })

  const moderation = ref({
    reports: {
      total: 0,
      processed: 0,
      pending: 0,
    },
    avg_response_hours: 0,
    actions: {
      removed: 0,
      warnings: 0,
      suspended: 0,
      appeals: 0,
    },
  })

  const reportTypes = ref([])

  const loading = ref(true)
  const error = ref(null)

  // Icon mapping for report types
  const reportTypeIcons = {
    spam: 'fa6-solid:bullhorn',
    copyright: 'fa6-solid:copyright',
    harassment: 'fa6-solid:user-slash',
    illegal: 'fa6-solid:gavel',
    privacy: 'fa6-solid:user-shield',
    other: 'fa6-solid:circle-question',
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num)
  }

  // Load real transparency data from API
  onMounted(async () => {
    try {
      loading.value = true
      const response = await $fetch(`${config.public.apiBaseUrl}/v1/transparency`)

      if (response.data) {
        stats.value = response.data.stats
        moderation.value = response.data.moderation

        // Transform report types to include icons
        reportTypes.value = response.data.report_types.map((report) => ({
          type: report.type,
          count: report.count,
          icon: reportTypeIcons[report.type] || reportTypeIcons.other,
        }))
      }
    } catch (err) {
      console.error('Error loading transparency stats:', err)
      error.value = 'No se pudieron cargar las estadísticas de transparencia'
    } finally {
      loading.value = false
    }
  })

  // SEO
  const route = useRoute()
  const runtimeConfig = useRuntimeConfig()
  const siteUrl = runtimeConfig.public.siteUrl
  const pageUrl = `${siteUrl}${route.path}`
  const ogImageUrl = `${siteUrl}/logo-wolf.png`

  useSeoMeta({
    title: t('transparency.title') + ' | ' + runtimeConfig.public.appName,
    description: t('transparency.description'),
    keywords: `${runtimeConfig.public.appName}, transparencia, moderación, estadísticas, comunidad, ético`,
    robots: 'index, follow',
    ogTitle: t('transparency.title') + ' | ' + runtimeConfig.public.appName,
    ogDescription: t('transparency.description'),
    ogImage: ogImageUrl,
    ogUrl: pageUrl,
    ogType: 'website',
    ogSiteName: runtimeConfig.public.appName,
    twitterCard: 'summary',
    twitterTitle: t('transparency.title') + ' | ' + runtimeConfig.public.appName,
    twitterDescription: t('transparency.description'),
    twitterImage: ogImageUrl,
    twitterSite: runtimeConfig.public.twitterHandle || undefined,
  })

  // Set canonical URL
  useCanonical()

  // Add WebPage structured data
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': pageUrl,
          url: pageUrl,
          name: t('transparency.title'),
          description: t('transparency.description'),
          isPartOf: {
            '@id': `${siteUrl}/#website`
          },
          inLanguage: locale.value
        }),
        tagPosition: 'bodyClose'
      }
    ]
  })
</script>

<style scoped>
  .transparency-border {
    border-color: var(--color-border-default);
  }

  .transparency-item {
    background-color: var(--color-bg-subtle);
  }
</style>
