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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="controls-container mb-4">
          <div class="controls-wrapper">
            <div class="left-controls">
              <FilterControls @filter-changed="handleFilterChanged" />
              <ContentLanguageSelector />
            </div>
            <LayoutSelector />
          </div>
        </div>
        <PostList
          :posts="posts"
          :meta="meta"
          :loading="loading"
          :layout="layout"
          :has-more="hasMorePosts"
          :load-more-loading="loadMoreLoading"
          :empty-state-type="'my-subs'"
          @load-more="loadMorePosts"
          @clear-filters="handleClearFilters"
        >
          <template #after-third-post>
            <RecentComments />
          </template>
          <template #after-sixth-post>
            <TopComments />
          </template>
        </PostList>
      </div>
      <div class="hidden lg:block lg:col-span-1 space-y-6">
        <RecentComments />
        <TopComments />
        <ClientOnly>
          <template #fallback>
            <div class="space-y-4">
              <div class="skeleton-loader rounded-lg h-48 animate-pulse"/>
              <div class="skeleton-loader rounded-lg h-32 animate-pulse"/>
            </div>
          </template>
          <div ref="statsContainer">
            <SidebarStats v-if="showStats" :tags="popularTags" />
          </div>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

definePageMeta({})

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePostsStore } from '~/stores/posts'
import { useUserPreferencesStore } from '~/stores/userPreferences'
import { useI18n } from '#i18n'
import { useNuxtApp, useCookie } from '#app'
import { useSeoMeta } from '#imports'
import { usePostsPageLogic } from '~/composables/usePostsPageLogic'
import ResponsiveNavigation from '~/components/posts/ResponsiveNavigation.vue'
import PostList from '~/components/posts/PostList.vue'
import SidebarStats from '~/components/posts/SidebarStats.vue'
import LayoutSelector from '~/components/posts/LayoutSelector.vue'
import FilterControls from '~/components/posts/FilterControls.vue'
import ContentLanguageSelector from '~/components/common/ContentLanguageSelector.vue'
import RecentComments from '~/components/posts/RecentComments.vue'
import TopComments from '~/components/posts/TopComments.vue'

const { t } = useI18n()
const route = useRoute()
const postsStore = usePostsStore()
const userPreferencesStore = useUserPreferencesStore()
const { $api } = useNuxtApp()
const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig.public.siteUrl
const ogImageUrl = `${siteUrl}/logo-wolf.png`

// SEO
useSeoMeta({
  title: `${t('sections.my_subs')} - ${runtimeConfig.public.appName}`,
  description: t('subs.my_subs_description'),
  ogTitle: `${t('sections.my_subs')} - ${runtimeConfig.public.appName}`,
  ogDescription: t('subs.my_subs_description'),
  ogImage: ogImageUrl,
  ogUrl: `${siteUrl}/my-subs`,
  ogType: 'website',
  ogSiteName: runtimeConfig.public.appName,
  twitterCard: 'summary_large_image',
  twitterTitle: `${t('sections.my_subs')} - ${runtimeConfig.public.appName}`,
  twitterDescription: t('subs.my_subs_description'),
  twitterImage: ogImageUrl,
  twitterSite: runtimeConfig.public.twitterHandle || undefined,
})

useCanonical()

// ============================================
// SSR: Fetch initial posts on server side
// ============================================
const { data: initialPostsData } = await useAsyncData('my-subs-posts', async () => {
  const contentTypeFilterCookie = useCookie('content_type_filter')
  const selectedLanguagesCookie = useCookie('selected_languages')

  let languages = null
  if (selectedLanguagesCookie.value) {
    try {
      languages = typeof selectedLanguagesCookie.value === 'string'
        ? JSON.parse(selectedLanguagesCookie.value)
        : selectedLanguagesCookie.value
    } catch (e) {
      console.error('Error parsing languages cookie:', e)
    }
  }

  const sortBy = route.query.sort?.toString() || 'lastActive'
  const sortDir = route.query.dir?.toString() || 'desc'
  const timeInt = parseInt(route.query.time?.toString() || '43200')

  const params = {
    pagination: 'cursor',
    sort_by: sortBy,
    sort_dir: sortDir,
    time_interval: timeInt,
    per_page: 15,
    source: 'my-subs',
  }

  if (contentTypeFilterCookie.value) {
    params.content_type = contentTypeFilterCookie.value
  }

  if (languages && languages.length > 0) {
    params.languages = Array.isArray(languages) ? languages.join(',') : languages
  }

  try {
    const response = await $api.posts.getFrontpage(params)
    return {
      posts: response.data.data || [],
      meta: response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: 15, has_more: false, next_cursor: null, prev_cursor: null }
    }
  } catch (error) {
    console.error('SSR: Error fetching my-subs posts:', error)
    return {
      posts: [],
      meta: { current_page: 1, last_page: 1, total: 0, per_page: 15, has_more: false, next_cursor: null, prev_cursor: null }
    }
  }
})

// Initialize user preferences from cookie
const userPrefsCookie = useCookie('user_prefs', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
if (userPrefsCookie.value) {
  try {
    const cookiePrefs = typeof userPrefsCookie.value === 'string'
      ? JSON.parse(userPrefsCookie.value)
      : userPrefsCookie.value
    if (cookiePrefs.layout) {
      userPreferencesStore.layout = cookiePrefs.layout
    }
  } catch (e) {
    console.error('Error parsing user_prefs cookie:', e)
  }
}

// Initialize store with SSR data
if (initialPostsData.value?.posts && initialPostsData.value.posts.length > 0) {
  try {
    postsStore.posts = initialPostsData.value.posts.map(post => {
      try {
        return postsStore._transformPostData(post)
      } catch (transformError) {
        console.error('⚠️ [SSR] Error transforming post:', { postId: post.id, error: transformError.message })
        return post
      }
    })
    const ssrMeta = initialPostsData.value.meta
    postsStore.meta = {
      currentPage: ssrMeta.current_page || 1,
      lastPage: ssrMeta.last_page || 1,
      total: ssrMeta.total_posts || ssrMeta.total || ssrMeta.post_count || 0,
      perPage: ssrMeta.per_page,
      hasMore: ssrMeta.has_more ?? (ssrMeta.current_page < ssrMeta.last_page),
      nextCursor: ssrMeta.next_cursor || null,
      prevCursor: ssrMeta.prev_cursor || null,
    }
  } catch (e) {
    console.error('🚨 [SSR] Critical error initializing posts:', e)
    postsStore.posts = []
    postsStore.meta = { currentPage: 1, lastPage: 1, total: 0, perPage: 15, hasMore: false, nextCursor: null, prevCursor: null }
  }
}

// Use shared logic composable
const {
  sort,
  direction,
  loading,
  loadMoreLoading,
  timeInterval,
  isMobile,
  popularTags,
  currentSection,
  showStats,
  statsContainer,
  layout,
  posts,
  meta,
  hasMorePosts,
  handleFilterChanged,
  handleClearFilters,
  loadMorePosts,
  initOnMount,
} = usePostsPageLogic({
  defaultSection: 'my_subs',
  updateUrl: true,
})

onMounted(() => {
  const hasSSRData = initialPostsData.value?.posts && initialPostsData.value.posts.length > 0
  initOnMount(hasSSRData)
})
</script>

<style scoped>
.controls-container {
  @apply rounded-md p-1;
  background-color: color-mix(in srgb, var(--color-bg-card) 70%, transparent);
  border: 1px solid var(--color-border-default);
}

.skeleton-loader {
  background-color: var(--color-bg-hover);
}

.controls-wrapper {
  @apply flex flex-row flex-nowrap items-center justify-between gap-1;
}

.left-controls {
  @apply flex flex-nowrap items-center gap-1 flex-grow min-w-0 overflow-x-auto;
}
</style>
