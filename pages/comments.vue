<template>
  <div>
    <ResponsiveNavigation
      v-model:section="currentSection"
      v-model:sort="sort"
      v-model:direction="direction"
      v-model:time-interval="timeInterval"
      :current-section="currentSection"
      :sort="sort"
      :direction="direction"
      :time-interval="timeInterval"
      :is-mobile="isMobile"
    />

    <div class="max-w-5xl mx-auto">
      <div class="controls-container mb-4">
        <div class="controls-wrapper">
          <div class="left-controls">
            <CommentSortControls
              :sort="sort"
              :direction="direction"
              :time-interval="timeInterval"
              @update:sort="updateSort"
              @update:direction="updateDirection"
              @update:time-interval="updateTimeInterval"
            />
          </div>
        </div>
      </div>

      <CommentList
        :comments="comments"
        :meta="meta"
        :loading="loading"
        :has-more="hasMoreComments"
        :load-more-loading="loadMoreLoading"
        :time-interval="timeInterval"
        @load-more="loadMoreComments"
        @expand-time-range="expandTimeRange"
      />
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useI18n } from '#i18n'
  import { useNuxtApp } from '#app'
  import { useSeoMeta } from '#imports'
  import ResponsiveNavigation from '~/components/posts/ResponsiveNavigation.vue'
  import CommentList from '~/components/comments/CommentList.vue'
  import CommentSortControls from '~/components/comments/CommentSortControls.vue'

  const { t } = useI18n()
  const { $api } = useNuxtApp()
  const runtimeConfig = useRuntimeConfig()

  // SEO Meta Tags
  const siteUrl = runtimeConfig.public.siteUrl
  const ogImageUrl = `${siteUrl}/logo-wolf.png`

  useSeoMeta({
    title: t('sections.comments') + ' - ' + runtimeConfig.public.appName,
    description: t('sections.comments_description'),
    ogTitle: t('sections.comments') + ' - ' + runtimeConfig.public.appName,
    ogDescription: t('sections.comments_description'),
    ogImage: ogImageUrl,
    ogUrl: `${siteUrl}/comments`,
    ogType: 'website',
    ogSiteName: runtimeConfig.public.appName,
    twitterCard: 'summary_large_image',
    twitterTitle: t('sections.comments') + ' - ' + runtimeConfig.public.appName,
    twitterDescription: t('sections.comments_description'),
    twitterImage: ogImageUrl,
    twitterSite: runtimeConfig.public.twitterHandle || undefined,
  })

  const currentSection = ref('comments')
  const sort = ref('recent')
  const direction = ref('desc')
  const page = ref(1)
  const loading = ref(true)
  const loadMoreLoading = ref(false)
  const timeInterval = ref('2880') // Last 48 hours by default
  const isMobile = ref(false)
  const comments = ref([])
  const meta = ref({})

  const hasMoreComments = computed(() => {
    return meta.value.current_page < meta.value.last_page
  })

  const updateSort = (newSort) => {
    sort.value = newSort
  }

  const updateDirection = (newDirection) => {
    direction.value = newDirection
  }

  const updateTimeInterval = (newInterval) => {
    timeInterval.value = newInterval
  }

  const fetchComments = async () => {
    loading.value = true
    try {
      const params = {
        page: page.value,
        per_page: 20,
        sort_by: sort.value,
        sort_dir: direction.value,
        time_interval: timeInterval.value,
        include: 'post,user,vote_stats',
      }

      const response = await $api.comments.getAll(params)

      // Handle both CommentCollection format and direct array format
      const responseData = response.data?.data || response.data || []
      const responseMeta = response.data?.meta || response.meta || {}

      if (page.value === 1) {
        comments.value = Array.isArray(responseData) ? responseData : []
      } else {
        comments.value = [...comments.value, ...(Array.isArray(responseData) ? responseData : [])]
      }

      meta.value = responseMeta
    } catch (error) {
      console.error('Error fetching comments:', error)
      comments.value = []
      meta.value = {}
    } finally {
      loading.value = false
      loadMoreLoading.value = false
    }
  }

  const loadMoreComments = async () => {
    if (!hasMoreComments.value || loadMoreLoading.value) return

    loadMoreLoading.value = true
    page.value++
    await fetchComments()
  }

  const expandTimeRange = (newInterval) => {
    timeInterval.value = newInterval
  }

  const checkIfMobile = () => {
    if (import.meta.client) {
      isMobile.value = window.innerWidth < 768
    }
  }

  watch([sort, direction, timeInterval], () => {
    page.value = 1
    fetchComments()
  })

  onMounted(async () => {
    checkIfMobile()
    if (import.meta.client) {
      window.addEventListener('resize', checkIfMobile)
    }

    await fetchComments()
  })
</script>

<style scoped>
  .controls-container {
    @apply rounded-lg shadow-md p-4;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-default);
  }

  .controls-wrapper {
    @apply flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4;
  }

  .left-controls {
    @apply flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto;
  }

  @media (max-width: 640px) {
    .controls-wrapper {
      @apply flex-col;
    }

    .left-controls {
      @apply w-full;
    }
  }
</style>
