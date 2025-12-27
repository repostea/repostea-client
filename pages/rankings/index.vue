<template>
  <div class="min-h-screen bg-page dark:bg-page-dark">
    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- Header -->
      <PageHeader
        :title="t('rankings.title')"
        :description="t('rankings.subtitle')"
        icon="trophy"
      />

      <!-- Filters -->
      <div class="mt-6">
        <RankingFilters
          :selected-timeframe="selectedTimeframe"
          @timeframe-change="handleTimeframeChange"
        />
      </div>

      <!-- Main Content -->
      <!-- Loading State -->
      <div v-if="loading && !currentData" class="loading-container">
        <LoadingSpinner size="xl" display="centered" :show-text="true" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <ErrorDisplay
          type="generic"
          :custom-message="error"
          action-type="retry"
          @retry="loadRankings"
        />
      </div>

      <!-- Rankings Content -->
      <div v-else-if="currentData">
        <!-- Rankings List (All users 1-100) -->
        <div v-if="currentData.users && currentData.users.length > 0" class="mb-6">
          <RankingsList
            :users="currentData.users"
            :category="selectedCategory"
            :start-rank="1"
            :loading="loading"
            :pagination="pagination"
            @page-change="handlePageChange"
          />
        </div>

        <!-- Empty State -->
        <div v-if="!currentData.users || currentData.users.length === 0" class="empty-state">
          <Icon
            name="fa6-solid:trophy"
            class="text-6xl text-gray-300 dark:text-gray-600 mb-4"
            aria-hidden="true"
          />
          <p class="text-gray-500 dark:text-gray-400">{{ t('rankings.no_data') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from '#i18n'
  import { useRankingsStore } from '~/stores/rankings'
  import { useRoute, useRouter, useSeoMeta } from '#app'
  import PageHeader from '~/components/ui/PageHeader.vue'
  import LoadingSpinner from '~/components/common/LoadingSpinner.vue'
  import ErrorDisplay from '~/components/ui/ErrorDisplay.vue'
  import RankingFilters from '~/components/rankings/RankingFilters.vue'
  import RankingsList from '~/components/rankings/RankingsList.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const rankingsStore = useRankingsStore()

  // State
  const selectedCategory = ref('karma') // Always karma for now
  const selectedTimeframe = ref(route.query.timeframe || 'all')
  const currentPage = ref(parseInt(route.query.page) || 1)

  // Computed
  const loading = computed(() => rankingsStore.loading)
  const error = computed(() => rankingsStore.error)
  const currentData = computed(() => rankingsStore.currentRanking)

  const pagination = computed(() => {
    return currentData.value?.pagination || null
  })

  // Methods
  async function loadRankings(force = false) {
    await rankingsStore.fetchRanking(
      selectedCategory.value,
      selectedTimeframe.value,
      currentPage.value,
      force
    )
  }

  function handleTimeframeChange(timeframe) {
    selectedTimeframe.value = timeframe
    currentPage.value = 1
    updateQueryParams()
    loadRankings()
  }

  function handlePageChange(page) {
    currentPage.value = page
    updateQueryParams()
    loadRankings()

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateQueryParams() {
    const query = {}

    if (selectedTimeframe.value !== 'all') {
      query.timeframe = selectedTimeframe.value
    }

    if (currentPage.value > 1) {
      query.page = currentPage.value
    }

    router.push({ query })
  }

  // Lifecycle
  onMounted(() => {
    loadRankings()
  })

  // SEO
  useSeoMeta({
    title: computed(() => t('rankings.title')),
    description: computed(() => t('rankings.meta_description')),
  })
</script>

<style scoped>
  .loading-container {
    @apply flex items-center justify-center py-12;
  }

  .error-container {
    @apply flex items-center justify-center py-12;
  }

  .empty-state {
    @apply flex flex-col items-center justify-center py-12;
  }
</style>
